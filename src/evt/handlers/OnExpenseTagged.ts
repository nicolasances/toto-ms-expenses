import { ObjectId } from "mongodb";
import { Logger, ProcessingResponse, TotoMessage, TotoMessageHandler, basicallyHandleError } from "totoms";
import { ControllerConfig } from "../../Config";
import { EVENTS } from "../EventPublisher";

/**
 * Handles the tagging and untagging of an expense: recalculates the totals of the affected tag.
 */
export class OnExpenseTagged extends TotoMessageHandler {

    protected handledMessageType: string = EVENTS.expenseTagged;

    /**
     * Recalculates the total amount (in EUR), number of expenses and date range of the tag.
     * 
     * @param msg the expenseTagged (or expenseUntagged) message. msg.id is the expense id, msg.data.tagId the tag id.
     */
    async onMessage(msg: TotoMessage): Promise<ProcessingResponse> {

        const config = this.config as ControllerConfig;
        const logger = Logger.getInstance();
        const cid = msg.cid ?? this.cid;

        // The tagId is important also when untagging an expense, since we need to recalculate that specific tag
        const expenseId = msg.id;
        const tagId = msg.data.tagId;

        logger.compute(cid, `Event [${msg.type}] received. Expense [${expenseId}] has been tagged with tag [${tagId}]. Recaluating tag total.`)

        try {

            const db = await config.getMongoDb(config.getDBName());

            // 1. Find all expenses with that tag and calculate the sum of the amount (in EUR)
            const aggregate = [
                { $match: { tags: tagId } },
                { $group: { _id: 1, amount: { $sum: '$amountInEuro' }, maxDate: { $max: "$date" }, minDate: { $min: "$date" } } },
            ]

            const aggCount = [
                { $match: { tags: tagId } },
                { $count: "numExpenses" }
            ]

            const aggregationResult = await db.collection(config.getCollections().expenses).aggregate(aggregate).toArray();
            const aggCountResult = await db.collection(config.getCollections().expenses).aggregate(aggCount).toArray();

            const totalInEuro = aggregationResult[0].amount;
            const minDate = aggregationResult[0].minDate;
            const maxDate = aggregationResult[0].maxDate;
            const numExpenses = aggCountResult[0].numExpenses;

            logger.compute(cid, `Tag Total recalculated: [EUR ${totalInEuro}]. Num expenses: [${numExpenses}]`)

            // 2. Update the tag
            await db.collection(config.getCollections().tags).updateOne({ _id: new ObjectId(tagId) }, { $set: { amountInEuro: totalInEuro, numExpenses: numExpenses, minDate: minDate, maxDate: maxDate } })

            logger.compute(cid, `Event [${msg.type}] successfully handled.`)

        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }

        return { status: "processed" }
    }
}

/**
 * Handles the untagging of an expense: same logic as tagging, since the tag totals need to be recalculated.
 */
export class OnExpenseUntagged extends OnExpenseTagged {

    protected handledMessageType: string = EVENTS.expenseUntagged;

}
