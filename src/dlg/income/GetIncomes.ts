import { Request } from "express";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { UserContext } from "../../controller/model/UserContext";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { GetIncomesFilter, IncomeStore } from "../../model/IncomeStore";

export class GetIncomes implements TotoDelegate {

  async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

    const filter = req.query as Filter;
    const sort = req.query;

    const logger = execContext.logger;
    const cid = execContext.cid;
    const config = execContext.config as ControllerConfig;

    // Retrieve the user from the context
    const user = userContext.email;

    logger.compute(cid, `Retrieving incomes with filter ${JSON.stringify(filter)} for user [${user}]`, "info");

    let client;

    try {

      client = await config.getMongoClient();
      const db = client.db(config.getDBName());

      // Init the Store
      const store = new IncomeStore(db, execContext);

      // Build the filter
      const filter = new GetIncomesFilter(user)

      filter.yearMonth = req.query.yearMonth ? String(req.query.yearMonth) : undefined;
      filter.last = req.query.last ? parseInt(String(req.query.last)) : undefined;
      filter.category = req.query.category ? String(req.query.category) : undefined;

      // Get the incomes
      const incomes = await store.getIncomes(filter)

      return {incomes: incomes}

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
}