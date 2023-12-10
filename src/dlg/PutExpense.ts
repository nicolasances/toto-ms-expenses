import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";
import { TotoRuntimeError } from "../controller/model/TotoRuntimeError";
import { ControllerConfig } from "../Config";
import { ValidationError } from "../controller/validation/Validator";
import { ObjectId } from "mongodb";
import { CurrencyConversion } from "../controller/util/GetExchangeRate";
import { ExpenseModel } from "../model/ExpenseModel";


export class PutExpense implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const config = execContext.config as ControllerConfig;
        const logger = execContext.logger;
        const cid = execContext.cid;

        let client

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Get the expense Id
            const tid = req.params.id;

            // Get the exchange rate
            const currency = req.body.currency;
            const amountInEuro = await new CurrencyConversion(execContext).convertAmountToEUR(req.body.amount, currency);

            // Update
            await db.collection(config.getCollections().expenses).updateOne({ _id: new ObjectId(tid) }, new ExpenseModel().updateExpense(req.body, amountInEuro))

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