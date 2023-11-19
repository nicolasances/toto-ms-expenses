import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";

/**
 * This class retrieves the list of months that have not been reviewed. 
 * A month is considered "not reviewed" when there are still expenses that have not been "consolidated".
 */
export class GetUnreviewedMonths implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const config = execContext.config as ControllerConfig;
        const logger = execContext.logger;
        const cid = execContext.cid;

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            const cursor = db.collection(config.getCollections().expenses).aggregate([
                { $match: { user: userContext.email, consolidated: { $ne: true } } },
                {
                    $group: {
                        _id: "$yearMonth",
                        totalAmount: { $sum: "$amountInEuro" }
                    }
                },
                { $project: { _id: 0, yearMonth: "$_id", totalAmount: 1 } }
            ])

            var yearMonths = [];

            while (await cursor.hasNext()) {

                const yearMonth = await cursor.next() as any;

                yearMonths.push(yearMonth);

            }

            return { unconsolidated: yearMonths }

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