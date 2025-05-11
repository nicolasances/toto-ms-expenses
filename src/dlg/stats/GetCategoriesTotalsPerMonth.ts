import { Request } from "express";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { UserContext } from "../../controller/model/UserContext";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { ControllerConfig } from "../../Config";
import { ExpenseStore } from "../../model/ExpenseStore";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import moment from "moment-timezone";

export class GetCategoriesTotalsPerMonth implements TotoDelegate {

  /**
   * This method retrieves the total expenses grouped by category for each month in the specified range for the given user. 
   * It uses the ExpenseStore to fetch the data from the database.
   */
  async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

    const logger = execContext.logger;
    const cid = execContext.cid;
    const config = execContext.config as ControllerConfig;

    // Extract the user
    const userEmail = userContext.email

    let client;

    try {

      client = await config.getMongoClient();
      const db = client.db(config.getDBName());

      // Find out where to start (yearMonth) and where to end
      let yearMonthGte = req.query.yearMonthGte == null ? 190001 : parseInt(String(req.query.yearMonthGte));
      let yearMonthLte = req.query.yearMonthLte == null ? parseInt(moment().tz("Europe/Rome").format("YYYYMM")) : parseInt(String(req.query.yearMonthLte));

      // Get the target currency 
      const targetCurrency = req.query.currency ?? "EUR"

      // Initialize the Store
      const store = new ExpenseStore(db, execContext);

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
    finally {
      if (client) client.close();
    }
  }
}

interface Filter {
  maxResults?: number,
  user?: string
}