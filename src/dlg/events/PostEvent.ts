import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { FakeRequest, TotoDelegate } from "../../controller/model/TotoDelegate";
import { UserContext } from "../../controller/model/UserContext";
import { ValidationError } from "../../controller/validation/Validator";
import { ControllerConfig } from "../../Config";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { ObjectId } from "mongodb";
import { Event, IEvent } from "../../model/Event";
import moment from "moment";
import { basicallyHandleError } from "../../controller/util/ErrorUtil";

export class PostEvent implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const body = req.body;
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // 1. Validate
        if (!body.eventName) throw new ValidationError(400, "No event name provided")

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Create an Event
            const event = new Event({
                name: body.eventName,
                creationDate: moment().format("YYYYMMDD"),
                amount: 0,
                user: userContext.email
            })

            // 2. Update the expense with the event 
            const result = await db.collection(config.getCollections().events).insertOne(event)

            // Done
            return { eventId: result.insertedId }

        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }
        finally {
            if (client) client.close();
        }
    }

}