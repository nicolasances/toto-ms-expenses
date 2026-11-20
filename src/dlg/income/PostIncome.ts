import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { IncomeStore, TotoIncome } from "../../model/IncomeStore";


export class PostIncome extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const body = req.body
        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;

        // Validate mandatory fields
        if (!body.amount) throw new ValidationError(400, "No amount provided")
        if (!body.date) throw new ValidationError(400, "No date provided")
        if (!body.description) throw new ValidationError(400, "No description provided")
        if (!body.currency) throw new ValidationError(400, "No currency provided")
        if (!body.category) throw new ValidationError(400, "Missing category")

        // Extract user
        const user = userContext.email;


        try {

            // Instantiate the DB
            const db = await config.getMongoDb(config.getDBName());

            // Create the store
            const incomeStore = new IncomeStore(db, config, cid);

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

    }

}