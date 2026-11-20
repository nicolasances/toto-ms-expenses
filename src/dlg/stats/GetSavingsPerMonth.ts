import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { IncomeStore } from "../../model/IncomeStore";
import { ExpenseStore, MonthsTotals, YearsTotals } from "../../model/ExpenseStore";
import moment from "moment-timezone";

export class GetSavingsPerMonth extends TotoDelegate<ParsedRequest, any> {

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

      // 1. Get the total expenses of each month
      const expensesPerMonth = await new ExpenseStore(db, config, cid).getTotalsPerMonth(userEmail, yearMonthGte, String(targetCurrency), yearMonthLte)

      // 2. Get the total incomes of each month
      const incomesPerMonth = await new IncomeStore(db, config, cid).getTotalsPerMonth(userEmail, yearMonthGte, String(targetCurrency), yearMonthLte)

      // 3. Calculate the savings of each year
      return new SavingsPerMonth(expensesPerMonth, incomesPerMonth)


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

class MonthSaving {

  year: string
  month: string
  saving: number

  constructor(year: string, month: string, saving: number) {
    this.year = year
    this.month = month
    this.saving = saving
  }

}

class SavingsPerMonth {

  savings: MonthSaving[]

  constructor(expensesPerMonth: MonthsTotals, incomesPerMonth: MonthsTotals) {

    this.savings = []

    for (let expenseMonth of expensesPerMonth.months) {


      let saving = - expenseMonth.amount
      let year = String(expenseMonth.yearMonth).substring(0, 4)
      let month = String(expenseMonth.yearMonth).substring(4)

      // If there are no incomes at all (for some reason), the saving is the negative expenses
      if (incomesPerMonth == null) {

        this.savings.push(new MonthSaving(year, month, saving))

        continue;

      }

      // Find the expenses of the year
      let incomeMonth = incomesPerMonth.find(year, month)
      let income = (incomeMonth && incomeMonth.amount) ? incomeMonth.amount : 0

      // Calculate savings
      saving += income

      // Add the saving
      this.savings.push(new MonthSaving(year, month, saving))

    }

  }

}