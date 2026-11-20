import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { ExpenseStore, GetMonthTotalResult } from "../../model/ExpenseStore";


export class GetMonthTotal extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<GetMonthTotalResult> {

        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;

        // Validate mandatory fields
        const yearMonth = req.params.yearMonth
        const targetCurrency = String(req.query.currency ?? "EUR")

        // Extract user
        const user = userContext.email;


        try {

            // Instantiate the DB
            const db = await config.getMongoDb(config.getDBName());

            // Instantiate the Store
            const store = new ExpenseStore(db, config, cid)

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

    }

}