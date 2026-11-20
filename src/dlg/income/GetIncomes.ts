import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { GetIncomesFilter, IncomeStore } from "../../model/IncomeStore";

export class GetIncomes extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

  async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

    const filter = req.query as Filter;
    const sort = req.query;

    const logger = Logger.getInstance();
    const cid = this.cid;
    const config = this.config as ControllerConfig;

    // Retrieve the user from the context
    const user = userContext.email;

    logger.compute(cid, `Retrieving incomes with filter ${JSON.stringify(filter)} for user [${user}]`, "info");


    try {

      const db = await config.getMongoDb(config.getDBName());

      // Init the Store
      const store = new IncomeStore(db, config, cid);

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
  }
}

interface Filter {
  maxResults?: number,
}