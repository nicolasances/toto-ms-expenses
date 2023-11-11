import { ObjectId } from "mongodb";
import { ControllerConfig } from "../../Config";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { basicallyHandleError } from "../../controller/util/ErrorUtil";
import { AEventHandler, EventHandlingResult } from "../EventHanlder";
import { TotoEvent } from "../TotoEvent";
import { EVENTS } from "../EventPublisher";

export class OnExpenseTagged extends AEventHandler {

    async handleEvent(msg: TotoEvent): Promise<EventHandlingResult> {

        const config = this.execContext.config as ControllerConfig;
        const logger = this.execContext.logger;
        const cid = this.execContext.cid;

        // Only care about two events: 
        // - expenseTagged
        // - expenseUntagged
        if (msg.type != EVENTS.expenseTagged && msg.type != EVENTS.expenseUntagged) return {}

        // Extract expenseId and tagId
        // Note that the tagId is important also when untagging an expense, since we need to recalculate that specific tag
        const expenseId = msg.id;
        const tagId = msg.data.tagId;

        let client;

        logger.compute(cid, `Event [${msg.type}] received. Expense [${expenseId}] has been tagged with tag [${tagId}]. Recaluating tag total.`)

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // 1. Find all expenses with that tag and calculate the sum of the amount (in EUR)
            // 1.1. Prepare the aggregate for the total amount
            let aggregate = [
                { $match: { tags: tagId } },
                { $group: { _id: 1, amount: { $sum: '$amountInEuro' }, maxDate: { $max: "$date" }, minDate: { $min: "$date" } } },
            ]

            // 1.2. Aggregate for the count of expenses
            let aggCount = [
                { $math: { tags: tagId } },
                { $count: "numExpenses" }
            ]

            // Execute the aggregate
            const aggregationResult = await db.collection(config.getCollections().expenses).aggregate(aggregate).toArray();
            const aggCountResult = await db.collection(config.getCollections().expenses).aggregate(aggCount).toArray();

            // 1.3. Extract the total (sum) in EUR
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
        finally {
            if (client) client.close();
        }

        return {}
    }
}