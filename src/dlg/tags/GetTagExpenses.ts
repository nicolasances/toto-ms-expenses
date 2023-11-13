import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { ValidationError } from "../../controller/validation/Validator";
import { ControllerConfig } from "../../Config";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { Tag, ITagPO, convertCurrency } from "../../model/Tag";
import { basicallyHandleError } from "../../controller/util/ErrorUtil";
import { ExpenseModel } from "../../model/ExpenseModel";

/**
 * Retrieves the list of expenses that have the specified tag
 */
export class GetTagExpenses implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;
        const config = execContext.config as ControllerConfig;

        const tagId = req.params.id;

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

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
        finally {
            if (client) client.close();
        }
    }

}