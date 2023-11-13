import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { ValidationError } from "../../controller/validation/Validator";
import { ControllerConfig } from "../../Config";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { Tag, ITagPO, convertCurrency } from "../../model/Tag";
import { basicallyHandleError } from "../../controller/util/ErrorUtil";

/**
 * Retrieves the list of tags created by the user
 */
export class GetTags implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // Target currency should be provided in the request query parameters. Default is EUR
        const targetCurrency = req.query.targetCurrency ?? "EUR";

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            logger.compute(cid, `Retrieving tags for user [${userContext.email}]`)

            // Find all tags of the user
            const result = db.collection(config.getCollections().tags).find(new Tag({ user: userContext.email }))

            const tags = [];

            while (await result.hasNext()) {

                const tag = await result.next() as unknown as ITagPO

                tags.push(await convertCurrency(new Tag(tag), String(targetCurrency), execContext))
            }

            return { tags: tags }

        } catch (error) {
            basicallyHandleError(error, logger, cid)
        }
        finally {
            if (client) client.close();
        }
    }

}