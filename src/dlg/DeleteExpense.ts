import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "./ParsedRequest";
import { ControllerConfig } from "../Config";
import { ExpenseStore } from "../model/ExpenseStore";

export class DeleteExpense extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

  async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

    const logger = Logger.getInstance();
    const cid = this.cid;
    const config = this.config as ControllerConfig;

    const expenseId = req.params.id


    try {

      const db = await config.getMongoDb(config.getDBName());

      await new ExpenseStore(db, config, cid).deleteExpense(expenseId);

      return { deleted: true }

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

interface Filter {
  maxResults?: number,
  user?: string
}