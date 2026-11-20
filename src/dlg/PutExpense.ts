import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "./ParsedRequest";
import { ControllerConfig } from "../Config";
import { ObjectId } from "mongodb";
import { CurrencyConversion } from "../util/CurrencyConversion";
import { ExpenseModel } from "../model/ExpenseModel";


export class PutExpense extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const config = this.config as ControllerConfig;
        const logger = Logger.getInstance();
        const cid = this.cid;


        try {

            const db = await config.getMongoDb(config.getDBName());

            // Get the expense Id
            const tid = req.params.id;

            // Get the exchange rate
            const currency = req.body.currency ?? "EUR";
            const amountInEuro = await new CurrencyConversion(cid).convertAmountToEUR(req.body.amount, currency);

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

    }

}