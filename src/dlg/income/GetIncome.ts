import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { GetIncomesFilter, IncomeStore } from "../../model/IncomeStore";

export class GetIncome extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

  async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

    const logger = Logger.getInstance();
    const cid = this.cid;
    const config = this.config as ControllerConfig;

    // Retrieve the user from the context
    const user = userContext.email;


    try {

      const db = await config.getMongoDb(config.getDBName());

      // Init the Store
      const store = new IncomeStore(db, config, cid);

      // Get the income transaction
      const income = await store.getIncome(req.params.id)

      return income ?? {};

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
