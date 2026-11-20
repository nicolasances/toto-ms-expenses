import { Request } from "express";
import { TotoDelegate, UserContext, Logger, basicallyHandleError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { Tag, ITagPO, convertCurrency } from "../../model/Tag";

/**
 * Retrieves the list of tags created by the user
 */
export class GetTags extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;

        // Target currency should be provided in the request query parameters. Default is EUR
        const targetCurrency = req.query.targetCurrency ?? "EUR";


        try {

            const db = await config.getMongoDb(config.getDBName());

            logger.compute(cid, `Retrieving tags for user [${userContext.email}]`)

            // Find all tags of the user
            const result = db.collection(config.getCollections().tags).find(new Tag({ user: userContext.email }))

            const tags = [];

            while (await result.hasNext()) {

                const tag = await result.next() as unknown as ITagPO

                tags.push(await convertCurrency(new Tag(tag), String(targetCurrency), cid))
            }

            return { tags: tags }

        } catch (error) {
            basicallyHandleError(error, logger, cid)
        }
    }

}