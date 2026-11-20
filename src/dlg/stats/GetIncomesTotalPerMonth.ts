import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { IncomeStore } from "../../model/IncomeStore";
import moment from "moment-timezone";

export class GetIncomesTotalPerMonth extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

  async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

    const logger = Logger.getInstance();
    const cid = this.cid;
    const config = this.config as ControllerConfig;

    // Extract the user
    const userEmail = userContext.email


    try {

      const db = await config.getMongoDb(config.getDBName());

      // Find out where to start (yearMonth)
      let yearMonthGte = req.query.yearMonthGte == null ? 190001 : parseInt(String(req.query.yearMonthGte));
      let yearMonthLte = req.query.yearMonthLte == null ? parseInt(moment().tz("Europe/Rome").format("YYYYMM")) : parseInt(String(req.query.yearMonthLte));

      // Get the target currency 
      const targetCurrency = req.query.currency ?? "EUR"

      // Initialize the Store
      const store = new IncomeStore(db, config, cid);

      // Retrieve the statistics from the store
      const months = await store.getTotalsPerMonth(userEmail, yearMonthGte, String(targetCurrency), yearMonthLte);

      return { months: months }

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