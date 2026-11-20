import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "./ParsedRequest";
import { ControllerConfig } from "../Config";
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
export class GetExpenses extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

  async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

    const filter = req.query as Filter;
    const sort = req.query;

    const logger = Logger.getInstance();
    const cid = this.cid;
    const config = this.config as ControllerConfig;
    
    const model = new ExpenseModel()

    logger.compute(cid, `Retrieving expenses with filter ${JSON.stringify(filter)}`, "info");

    // Validation
    if (!filter.user) throw new ValidationError(400, "Missing user field")

    if (filter.maxResults == null) filter.maxResults = 0;


    try {

      const db = await config.getMongoDb(config.getDBName());

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
  }
}

interface Filter {
  maxResults?: number, 
  user?: string
}