import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, basicallyHandleError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { ObjectId } from "mongodb";
import { Tag, ITag } from "../../model/Tag";
import moment from "moment";

export class PostTag extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const body = req.body;
        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;

        // 1. Validate
        if (!body.tagName) throw new ValidationError(400, "No tag name provided")


        try {

            const db = await config.getMongoDb(config.getDBName());

            // Create an Tag
            const tag = new Tag({
                name: body.tagName,
                creationDate: moment().format("YYYYMMDD"),
                amountInEuro: 0,
                user: userContext.email
            })

            // 2. Insert the Tag
            const result = await db.collection(config.getCollections().tags).insertOne(tag)

            // Done
            return { tagId: result.insertedId }

        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }
    }

}