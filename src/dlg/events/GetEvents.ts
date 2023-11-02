import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { ValidationError } from "../../controller/validation/Validator";
import { ControllerConfig } from "../../Config";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { ExpenseModel } from "../../model/ExpenseModel";
import { TotoDelegate } from "../../controller/model/TotoDelegate";

export class GetEvents implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const query = req.query;
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;
        const model = new ExpenseModel()

        // 1. Validate
        if (!query.user) throw new ValidationError(400, "No user provided")

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // 2. Update the expense with the event 
            const events = await db.collection(config.getCollections().expenses).distinct("event", model.filterExpenses(query));

            // Done
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