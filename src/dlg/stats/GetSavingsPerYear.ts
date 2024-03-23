import { Request } from "express";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { UserContext } from "../../controller/model/UserContext";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { IncomeStore } from "../../model/IncomeStore";
import { ExpenseStore, YearsTotals } from "../../model/ExpenseStore";

export class GetSavingsPerYear implements TotoDelegate {

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

      // Find out where to start (yearMonth)
      let yearMonthGte = req.query.yearMonthGte == null ? 190001 : parseInt(String(req.query.yearMonthGte));

      // Get the target currency 
      const targetCurrency = req.query.currency ?? "EUR"

      // 1. Get the total expenses of each year
      const expensesPerYear = await new ExpenseStore(db, execContext).getTotalsPerYear(userEmail, yearMonthGte, String(targetCurrency))

      // 2. Get the total incomes of each year
      const incomesPerYear = await new IncomeStore(db, execContext).getTotalsPerYear(userEmail, yearMonthGte, String(targetCurrency))

      // 3. Calculate the savings of each year
      return new SavingsPerYear(expensesPerYear, incomesPerYear)


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

class YearSaving {

  year: string
  saving: number

  constructor(year: string, saving: number) {
    this.year = year
    this.saving = saving
  }

}

class SavingsPerYear {

  savings: YearSaving[]

  constructor(expensesPerYear: YearsTotals, incomesPerYear: YearsTotals) {

    this.savings = []

    for (let expenseYear of expensesPerYear.years) {


      let saving = - expenseYear.amount
      let year = expenseYear.year

      // If there are no incomes at all (for some reason), the saving is the negative expenses
      if (incomesPerYear == null) {
        
        this.savings.push(new YearSaving(year, saving))
        
        continue;
        
      }
      
      // Find the expenses of the year
      let incomeYear = incomesPerYear.findYearTotal(year)
      let income = (incomeYear && incomeYear.amount) ? incomeYear.amount : 0
      
      // Calculate savings
      saving += income

      // Add the saving
      this.savings.push(new YearSaving(year, saving))

    }

  }

}