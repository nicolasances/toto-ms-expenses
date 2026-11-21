import { Request } from "express";
import { TotoDelegate, UserContext, Logger } from "totoms";
import moment from "moment-timezone";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { IncomeStore } from "../../model/IncomeStore";
import { SalaryPrediction, SalaryPredictor } from "../../model/SalaryPredictor";

const SALARY_CATEGORY = "SALARY";
const MONTHS_TO_AVERAGE = 3;

/**
 * Predicts the next salary as the average of the salary of the last three completed months.
 * 
 * Query parameters:
 * - currency (optional, default EUR): the currency the prediction is expressed in
 * 
 * See docs/features/salary-prediction.md
 */
export class GetSalaryPrediction extends TotoDelegate<ParsedRequest, SalaryPrediction> {

  /**
   * Extracts the relevant parts of the HTTP request
   * 
   * @param {Request} req - The HTTP request
   * 
   * @returns {ParsedRequest} the parsed request
   */
  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

  /**
   * Calculates the salary prediction for the authenticated user
   * 
   * @param {ParsedRequest} req - The parsed request
   * @param {UserContext} userContext - The context of the authenticated user
   * 
   * @returns {Promise<SalaryPrediction>} the salary prediction
   */
  async do(req: ParsedRequest, userContext: UserContext): Promise<SalaryPrediction> {

    const logger = Logger.getInstance();
    const config = this.config as ControllerConfig;

    const userEmail = userContext.email;
    const targetCurrency = String(req.query.currency ?? "EUR");

    try {

      const db = await config.getMongoDb(config.getDBName());
      const incomeStore = new IncomeStore(db, config, this.cid);

      const windowYearMonths = SalaryPredictor.lastCompletedMonths(moment().tz("Europe/Rome"), MONTHS_TO_AVERAGE);

      const salaryTotals = await incomeStore.getTotalsPerMonth(userEmail, windowYearMonths[0], targetCurrency, windowYearMonths[windowYearMonths.length - 1], SALARY_CATEGORY);

      return SalaryPredictor.predict(salaryTotals.months, windowYearMonths, targetCurrency);

    } catch (error) {

      logger.compute(this.cid, `${error}`, "error");

      throw error;

    }

  }

}
