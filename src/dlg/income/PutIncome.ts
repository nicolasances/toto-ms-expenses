import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { IncomeStore, TotoIncome } from "../../model/IncomeStore";


export class PutIncome extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const body = req.body
        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;


        try {

            // Instantiate the DB
            const db = await config.getMongoDb(config.getDBName());

            // Create the store
            const incomeStore = new IncomeStore(db, config, cid);

            // Update the income transaction
            const updateResult = await incomeStore.updateIncome(req.params.id, body);

            // Return the created Id
            return updateResult


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