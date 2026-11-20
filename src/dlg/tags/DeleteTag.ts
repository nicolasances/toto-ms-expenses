import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, basicallyHandleError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { ObjectId } from "mongodb";
import { Tag, ITag } from "../../model/Tag";
import { EVENTS, EventPublisher } from "../../evt/EventPublisher";

export class DeleteTag extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;

        // 1. Validate
        if (!req.params.id) throw new ValidationError(400, "No tag id provided")

        const tagId = req.params.id;


        try {

            const db = await config.getMongoDb(config.getDBName());

            // Delete the tag
            const result = await db.collection(config.getCollections().tags).deleteOne({ _id: new ObjectId(req.params.id), user: userContext.email })

            // Publish an event
            const publishingResults = await new EventPublisher(this.messageBus, cid, "tags").publishEvent(tagId, EVENTS.tagDeleted, `Tag ${tagId} has been deleted`);

            // Done
            return { deletedTags: result.deletedCount, eventPublished: publishingResults.published }

        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }
    }

}