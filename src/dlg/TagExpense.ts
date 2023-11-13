import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { ValidationError } from "../controller/validation/Validator";
import { ControllerConfig } from "../Config";
import { ObjectId } from "mongodb";
import { basicallyHandleError } from "../controller/util/ErrorUtil";
import { TotoDelegate } from "../controller/model/TotoDelegate";
import { EVENTS, EventPublisher } from "../evt/EventPublisher";

export class TagExpense implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const body = req.body;
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // 1. Validate
        if (!req.params.id) throw new ValidationError(400, "No expense Id provided");
        if (!body.tagId) throw new ValidationError(400, "No tag Id provided");

        const tagId = body.tagId;
        const expenseId = req.params.id;

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // 1. Update the expense, attaching the tag id to it
            const updateExpenseResult = await db.collection(config.getCollections().expenses).updateOne({ _id: new ObjectId(expenseId) }, { $push: { tags: tagId } })

            // 2. Publish an tag with the updated "tag" 
            const publishingResult = await new EventPublisher(execContext, "expenses").publishEvent(expenseId, EVENTS.expenseTagged, `Expense ${expenseId} has been tagged with tag ${tagId}`, { tagId: tagId })

            // 3. Return 
            return { modifiedExpenses: updateExpenseResult.modifiedCount, expenseTaggedEventPublished: publishingResult.published }


        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }
        finally {
            if (client) client.close();
        }
    }

}