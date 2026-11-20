import { Request } from "express";
import { TotoDelegate, UserContext, Logger, basicallyHandleError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { Tag, ITagPO, convertCurrency } from "../../model/Tag";
import { ObjectId } from "mongodb";

/**
 * Retrieves the list of tags created by the user
 */
export class GetTag extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;

        const tagId = req.params.id;

        // Target currency should be provided in the request query parameters. Default is EUR
        const targetCurrency = req.query.targetCurrency ?? "EUR";


        try {

            const db = await config.getMongoDb(config.getDBName());

            // Find all tags of the user
            const tag = await db.collection(config.getCollections().tags).findOne({ _id: new ObjectId(tagId) })

            const tagTO = await convertCurrency(new Tag(tag as unknown as ITagPO), String(targetCurrency), cid);

            return tagTO;

        } catch (error) {
            basicallyHandleError(error, logger, cid)
        }
    }

}