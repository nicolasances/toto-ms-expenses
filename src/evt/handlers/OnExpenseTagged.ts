import { ObjectId } from "mongodb";
import { ControllerConfig } from "../../Config";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { basicallyHandleError } from "../../controller/util/ErrorUtil";
import { AEventHandler, EventHandlingResult } from "../EventHanlder";
import { TotoEvent } from "../TotoEvent";

export class OnExpenseTagged extends AEventHandler {

    async handleEvent(msg: TotoEvent): Promise<EventHandlingResult> {

        const config = this.execContext.config as ControllerConfig;
        const logger = this.execContext.logger;
        const cid = this.execContext.cid;

        const tagId = msg.data.tagId;

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // 1. Find all expenses with that tag and calculate the sum of the amount (in EUR)
            // 1.1. Prepare the aggregate
            let aggregate = [
                { $match: { tags: tagId } },
                { $group: { _id: { year: '$year' }, amount: { $sum: '$amountInEuro' } } },
            ]

            // 1.2. Execute the aggregate
            const aggregationResult = await db.collection(config.getCollections().expenses).aggregate(aggregate).toArray();

            // 1.3. Extract the total (sum) in EUR
            const totalInEuro = aggregationResult[0];

            // 2. Update the tag
            await db.collection(config.getCollections().tags).updateOne({ _id: new ObjectId(tagId) }, { $set: { amountInEuro: totalInEuro } })

        } catch (error) {
            basicallyHandleError(error, logger, cid);
        }
        finally {
            if (client) client.close();
        }

        return {}
    }
}