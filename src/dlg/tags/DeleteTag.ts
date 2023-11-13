import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { ValidationError } from "../../controller/validation/Validator";
import { ControllerConfig } from "../../Config";
import { ObjectId } from "mongodb";
import { Tag, ITag } from "../../model/Tag";
import { basicallyHandleError } from "../../controller/util/ErrorUtil";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { EVENTS, EventPublisher } from "../../evt/EventPublisher";

export class DeleteTag implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // 1. Validate
        if (!req.params.id) throw new ValidationError(400, "No tag id provided")

        const tagId = req.params.id;

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Delete the tag
            const result = await db.collection(config.getCollections().tags).deleteOne({ _id: new ObjectId(req.params.id), user: userContext.email })

            // Publish an event
            const publishingResults = await new EventPublisher(execContext, "tags").publishEvent(tagId, EVENTS.tagDeleted, `Tag ${tagId} has been deleted`);

            // Done
            return { deletedTags: result.deletedCount, eventPublished: publishingResults.published }

        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }
        finally {
            if (client) client.close();
        }
    }

}