import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { ValidationError } from "../controller/validation/Validator";
import { ControllerConfig } from "../Config";
import { TotoRuntimeError } from "../controller/model/TotoRuntimeError";
import { TotoDelegate } from "../controller/model/TotoDelegate";
import { ExpenseModel, PersistedExpense } from "../model/ExpenseModel";

/**
 * Admitted query params for FILTERING :
 *     { yearMonth: req.query.yearMonth,
 *       maxResults: req.query.maxResults,
 *       category: req.query.category,
 *       cardId: req.query.cardId,
 *       cardMonth: req.query.cardMonth,
 *       cardYear: req.query.cardYear,
 *       currency: req.query.currency,
 *       dateGte: req.query.dateGte,
 *       tag: req.query.tag, // FORMATTED as a tagName:tagValue
 *     }
 * Admitted query params for sorting:
 *     { sortDate: req.query.sortDate,
 *       sortAmount: req.query.sortAmount,
 *       sortYearMonth: req.query.sortYearMonth,
 *       sortDesc: req.query.sortDesc
 *     }
 */
export class GetExpenses implements TotoDelegate {

  async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

    const filter = req.query as Filter;
    const sort = req.query;

    const logger = execContext.logger;
    const cid = execContext.cid;
    const config = execContext.config as ControllerConfig;
    
    const model = new ExpenseModel()

    logger.compute(cid, `Retrieving expenses with filter ${JSON.stringify(filter)}`, "info");

    // Validation
    if (!filter.user) throw new ValidationError(400, "Missing user field")

    if (filter.maxResults == null) filter.maxResults = 0;

    let client;

    try {

      client = await config.getMongoClient();
      const db = client.db(config.getDBName());

      const cursor = db.collection(config.getCollections().expenses)
        .find(model.filterExpenses(filter), { limit: filter.maxResults })
        .sort(model.sortExpenses(sort));

      var expenses = [];

      while (await cursor.hasNext()) {

        const expense = await cursor.next() as any;

        expenses.push(model.fromPersistedObject(expense));

      }

      return {expenses: expenses}

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