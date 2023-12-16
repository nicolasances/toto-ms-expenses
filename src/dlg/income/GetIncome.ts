import { Request } from "express";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { UserContext } from "../../controller/model/UserContext";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { GetIncomesFilter, IncomeStore } from "../../model/IncomeStore";

export class GetIncome implements TotoDelegate {

  async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

    const logger = execContext.logger;
    const cid = execContext.cid;
    const config = execContext.config as ControllerConfig;

    // Retrieve the user from the context
    const user = userContext.email;

    let client;

    try {

      client = await config.getMongoClient();
      const db = client.db(config.getDBName());

      // Init the Store
      const store = new IncomeStore(db, execContext);

      // Get the income transaction
      const income = await store.getIncome(req.params.id)

      return income ?? {};

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
