import { Request } from "express";
import { TotoDelegate, UserContext, Logger, basicallyHandleError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { ControllerConfig } from "../../Config";
import { Tag, ITagPO, convertCurrency } from "../../model/Tag";
import { ExpenseModel } from "../../model/ExpenseModel";

/**
 * Retrieves the list of expenses that have the specified tag
 */
export class GetTagExpenses extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const logger = Logger.getInstance();
        const cid = this.cid;
        const config = this.config as ControllerConfig;

        const tagId = req.params.id;


        try {

            const db = await config.getMongoDb(config.getDBName());

            logger.compute(cid, `Retrieving expenses related to tag [${tagId}]`)

            // Find all tags of the user
            const result = db.collection(config.getCollections().expenses).find({tags: tagId})

            const expenses = [];
            const expenseModel = new ExpenseModel();

            while (await result.hasNext()) {

                const expensePO = await result.next() as any;

                expenses.push(expenseModel.fromPersistedObject(expensePO));

            }

            return { expenses: expenses }

        } catch (error) {
            basicallyHandleError(error, logger, cid)
        }
    }

}