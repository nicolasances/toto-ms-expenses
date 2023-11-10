import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { ValidationError } from "../../controller/validation/Validator";
import { ControllerConfig } from "../../Config";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { Tag, ITagPO, convertCurrency } from "../../model/Tag";
import { basicallyHandleError } from "../../controller/util/ErrorUtil";
import { ObjectId } from "mongodb";

/**
 * Retrieves the list of tags created by the user
 */
export class GetTag implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        const tagId = req.params.id;

        // Target currency should be provided in the request query parameters. Default is EUR
        const targetCurrency = req.query.targetCurrency ?? "EUR";

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Find all tags of the user
            const tag = db.collection(config.getCollections().tags).findOne({ _id: new ObjectId(tagId) })

            const tagTO = await convertCurrency(new Tag(tag as unknown as ITagPO), String(targetCurrency), execContext);

            return tagTO;

        } catch (error) {
            basicallyHandleError(error, logger, cid)
        }
        finally {
            if (client) client.close();
        }
    }

}