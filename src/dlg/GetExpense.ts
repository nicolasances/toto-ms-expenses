import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { ValidationError } from "../controller/validation/Validator";
import { ControllerConfig } from "../Config";
import { TotoRuntimeError } from "../controller/model/TotoRuntimeError";
import { TotoDelegate } from "../controller/model/TotoDelegate";
import { ExpenseStore } from "../model/ExpenseStore";

export class GetExpense implements TotoDelegate {

  async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

    const logger = execContext.logger;
    const cid = execContext.cid;
    const config = execContext.config as ControllerConfig;

    const expenseId = req.params.id
    
    let client;

    try {

      client = await config.getMongoClient();
      const db = client.db(config.getDBName());

      const expense = await new ExpenseStore(db, execContext).getExpense(expenseId);

      return expense

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

interface Filter {
  maxResults?: number, 
  user?: string
}