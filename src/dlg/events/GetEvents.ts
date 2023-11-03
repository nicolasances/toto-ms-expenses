import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { ValidationError } from "../../controller/validation/Validator";
import { ControllerConfig } from "../../Config";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { ExpenseModel } from "../../model/ExpenseModel";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { Event, IEventPO } from "../../model/Event";

export class GetEvents implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const query = req.query;
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;
        const model = new ExpenseModel()

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Find all events of the user
            const result = db.collection(config.getCollections().events).find(new Event({ user: userContext.email }))

            const events = [];

            while (await result.hasNext()) {

                const event = await result.next() as unknown as IEventPO

                events.push(new Event(event))
            }

            return { events: events }

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