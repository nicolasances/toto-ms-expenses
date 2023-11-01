import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { FakeRequest, TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";
import { ValidationError } from "../controller/validation/Validator";
import { ControllerConfig } from "../Config";
import { TotoRuntimeError } from "../controller/model/TotoRuntimeError";
import { ObjectId } from "mongodb";

export class PostEvent implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const body = req.body;
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // 1. Validate
        if (!body.event) throw new ValidationError(400, "No event provided")
        if (!body.expenseId) throw new ValidationError(400, "Missing expense ID to attach the event to")

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // 2. Update the expense with the event 
            await db.collection(config.getCollections().expenses).updateOne({ _id: new ObjectId(body.expenseId) }, { $set: { event: body.event } })

            // Done
            return { updated: true }

        } catch (error) {

            logger.compute(cid, `${error}`, "error")

            if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                throw error;
            }
            else {
                console.log(error);
                throw error;
            }

        }
        finally {
            if (client) client.close();
        }
    }

}