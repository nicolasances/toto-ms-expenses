import { Logger, ProcessingResponse, TotoMessage, TotoMessageHandler, basicallyHandleError } from "totoms";
import { ControllerConfig } from "../../Config";
import { EVENTS } from "../EventPublisher";
import { ExpenseModel } from "../../model/ExpenseModel";

/**
 * Handles the deletion of a tag: removes the tag from all the expenses that had it.
 */
export class OnTagDeleted extends TotoMessageHandler {

    protected handledMessageType: string = EVENTS.tagDeleted;

    /**
     * @param msg the tagDeleted message. msg.id is the id of the deleted tag.
     */
    async onMessage(msg: TotoMessage): Promise<ProcessingResponse> {

        const config = this.config as ControllerConfig;
        const logger = Logger.getInstance();
        const cid = msg.cid ?? this.cid;

        const tagId = msg.id;

        logger.compute(cid, `Event [${msg.type}] received. Tag [${tagId}] has been deleted. Updating expenses tagged with that tag.`)

        try {

            const db = await config.getMongoDb(config.getDBName());

            // Only update expenses that have that tag, removing the tag from their list of tags
            const taggedExpenses = new ExpenseModel().findExpensesWithTag(tagId);
            const removeTag = new ExpenseModel().updateRemoveTag(tagId) as any;

            const updateResult = await db.collection(config.getCollections().expenses).updateMany(taggedExpenses, removeTag);

            logger.compute(cid, `Event [${msg.type}] successfully handled. Updated expenses: ${updateResult.modifiedCount} (tag removed)`)

        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }

        return { status: "processed" }
    }
}
