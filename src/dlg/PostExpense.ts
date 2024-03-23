import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";
import { TotoRuntimeError } from "../controller/model/TotoRuntimeError";
import { ValidationError } from "../controller/validation/Validator";
import { ControllerConfig } from "../Config";
import { ExpenseStore, TotoExpense } from "../model/ExpenseStore";


export class PostExpense implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const body = req.body
        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        // Putting a default description
        let description = body.description
        if (!description) description = "Unknown"

        // Validate mandatory fields
        if (!body.amount) throw new ValidationError(400, "No amount provided")
        if (!body.date) throw new ValidationError(400, "No date provided")
        if (!body.currency) throw new ValidationError(400, "No currency provided")

        // Extract user
        const user = userContext.email;

        let client;

        try {

            // Instantiate the DB
            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Create the store
            const expenseStore = new ExpenseStore(db, execContext);

            // Create the expense
            const expense = new TotoExpense(body.amount, body.date, description, body.currency, user, body.category, body.monthly)

            // Save the expense
            const expenseId = await expenseStore.createExpense(expense)

            // Return the created Id
            return { id: expenseId }


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