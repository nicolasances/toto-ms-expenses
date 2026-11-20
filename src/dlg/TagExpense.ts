import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, basicallyHandleError } from "totoms";
import { ParsedRequest } from "./ParsedRequest";
import { ControllerConfig } from "../Config";
import { ObjectId } from "mongodb";
import { EVENTS, EventPublisher } from "../evt/EventPublisher";

export class TagExpense extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const body = req.body;
        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;

        // 1. Validate
        if (!req.params.id) throw new ValidationError(400, "No expense Id provided");
        if (!body.tagId) throw new ValidationError(400, "No tag Id provided");

        const tagId = body.tagId;
        const expenseId = req.params.id;


        try {

            const db = await config.getMongoDb(config.getDBName());

            // 1. Update the expense, attaching the tag id to it
            const updateExpenseResult = await db.collection(config.getCollections().expenses).updateOne({ _id: new ObjectId(expenseId) }, { $push: { tags: tagId } })

            // 2. Publish an tag with the updated "tag" 
            const publishingResult = await new EventPublisher(this.messageBus, cid, "expenses").publishEvent(expenseId, EVENTS.expenseTagged, `Expense ${expenseId} has been tagged with tag ${tagId}`, { tagId: tagId })

            // 3. Return 
            return { modifiedExpenses: updateExpenseResult.modifiedCount, expenseTaggedEventPublished: publishingResult.published }


        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }
    }

}