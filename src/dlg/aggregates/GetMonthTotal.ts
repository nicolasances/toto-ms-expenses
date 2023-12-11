import { Request } from "express";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { UserContext } from "../../controller/model/UserContext";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import GetMonthTotalResult, { ExpenseStore } from "../../model/ExpenseStore";


export class GetMonthTotal implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<GetMonthTotalResult> {

        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // Validate mandatory fields
        const yearMonth = req.params.yearMonth
        const targetCurrency = String(req.query.currency ?? "EUR")

        // Extract user
        const user = userContext.email;

        let client;

        try {

            // Instantiate the DB
            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Instantiate the Store
            const store = new ExpenseStore(db, execContext)

            // Get the specified yearMonth total
            const total = await store.getMonthTotal(user, yearMonth, targetCurrency);

            return total

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