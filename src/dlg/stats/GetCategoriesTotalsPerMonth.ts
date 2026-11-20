import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { ExpenseStore } from "../../model/ExpenseStore";
import moment from "moment-timezone";

export class GetCategoriesTotalsPerMonth extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

  /**
   * This method retrieves the total expenses grouped by category for each month in the specified range for the given user. 
   * It uses the ExpenseStore to fetch the data from the database.
   */
  async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

    const logger = Logger.getInstance();
    const cid = this.cid;
    const config = this.config as ControllerConfig;

    // Extract the user
    const userEmail = userContext.email


    try {

      const db = await config.getMongoDb(config.getDBName());

      // Find out where to start (yearMonth) and where to end
      let yearMonthGte = req.query.yearMonthGte == null ? 190001 : parseInt(String(req.query.yearMonthGte));
      let yearMonthLte = req.query.yearMonthLte == null ? parseInt(moment().tz("Europe/Rome").format("YYYYMM")) : parseInt(String(req.query.yearMonthLte));

      // Get the target currency 
      const targetCurrency = req.query.currency ?? "EUR"

      // Initialize the Store
      const store = new ExpenseStore(db, config, cid);

      // Retrieve the statistics from the store
      const categories = await store.getCategoryTotalsPerMonth(userEmail, yearMonthGte, String(targetCurrency));

      return { categories: categories }

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