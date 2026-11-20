import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "./ParsedRequest";
import { ControllerConfig } from "../Config";
import { ExpenseStore, TotoExpense } from "../model/ExpenseStore";


export class PostExpense extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const body = req.body
        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;

        // Putting a default description
        let description = body.description
        if (!description) description = "Unknown"

        // Validate mandatory fields
        if (!body.amount) throw new ValidationError(400, "No amount provided")
        if (!body.date) throw new ValidationError(400, "No date provided")
        if (!body.currency) throw new ValidationError(400, "No currency provided")

        // Extract user
        const user = userContext.email;


        try {

            // Instantiate the DB
            const db = await config.getMongoDb(config.getDBName());

            // Create the store
            const expenseStore = new ExpenseStore(db, config, cid);

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

    }

}