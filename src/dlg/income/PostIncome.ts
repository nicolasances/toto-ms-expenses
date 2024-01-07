import { Request } from "express";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { UserContext } from "../../controller/model/UserContext";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { IncomeStore, TotoIncome } from "../../model/IncomeStore";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";


export class PostIncome implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const body = req.body
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // Validate mandatory fields
        if (!body.amount) throw new ValidationError(400, "No amount provided")
        if (!body.date) throw new ValidationError(400, "No date provided")
        if (!body.description) throw new ValidationError(400, "No description provided")
        if (!body.currency) throw new ValidationError(400, "No currency provided")
        if (!body.category) throw new ValidationError(400, "Missing category")

        // Extract user
        const user = userContext.email;

        let client;

        try {

            // Instantiate the DB
            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Create the store
            const incomeStore = new IncomeStore(db, execContext);

            // Create the income
            const income = new TotoIncome(parseFloat(body.amount), body.date, body.description, body.currency, user, body.category)

            // Save the income
            const incomeId = await incomeStore.saveIncome(income)

            // Return the created Id
            return { id: incomeId }


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