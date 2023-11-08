import { ObjectId } from "mongodb";
import { ControllerConfig } from "../../Config";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { basicallyHandleError } from "../../controller/util/ErrorUtil";
import { AEventHandler, EventHandlingResult } from "../EventHanlder";
import { TotoEvent } from "../TotoEvent";
import { EVENTS } from "../EventPublisher";
import { ExpenseModel } from "../../model/ExpenseModel";

export class OnTagDeleted extends AEventHandler {

    async handleEvent(msg: TotoEvent): Promise<EventHandlingResult> {

        const config = this.execContext.config as ControllerConfig;
        const logger = this.execContext.logger;
        const cid = this.execContext.cid;

        // Only care about two events: 
        // - expenseTagged
        // - expenseUntagged
        if (msg.type != EVENTS.tagDeleted) return {}

        // Extract expenseId and tagId
        // Note that the tagId is important also when untagging an expense, since we need to recalculate that specific tag
        const tagId = msg.id;

        let client;

        logger.compute(cid, `Event [${msg.type}] received. Tag [${tagId}] has been deleted. Updating expenses tagged with that tag.`)

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // 1. Filter expenses
            // Only update expenses that have that tag
            const taggedExpenses = new ExpenseModel().findExpensesWithTag(tagId);

            // 2. Create the update: remove the tag from the list of tags
            const removeTag = new ExpenseModel().updateRemoveTag(tagId);

            // 3. Remove the tag from all expenses.
            const updateResult = await db.collection(config.getCollections().expenses).updateMany(taggedExpenses, removeTag);

            logger.compute(cid, `Event [${msg.type}] successfully handled. Updated expenses: ${updateResult.modifiedCount} (tag removed)`)

        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }
        finally {
            if (client) client.close();
        }

        return {}
    }
}