import { PubSub, Topic } from "@google-cloud/pubsub";
import moment from "moment";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { ControllerConfig } from "../Config";

const pubsub = new PubSub({ projectId: process.env.GCP_PID });

let topic: Topic;

export class ExpenseEventPublisher {

    execContext: ExecutionContext;
    cid: string;
    config: ControllerConfig;

    constructor(execContext: ExecutionContext) {
        this.execContext = execContext;
        this.cid = String(execContext.cid);
        this.config = this.execContext.config as ControllerConfig
    }

    publishEvent = async (id: string, eventType: string, msg: string, data?: any): Promise<PublishingResult> => {

        const logger = this.execContext.logger;

        let timestamp = moment().tz('Europe/Rome').format('YYYY.MM.DD HH:mm:ss');

        // Push message to PubSub
        let message = JSON.stringify({
            timestamp: timestamp,
            cid: this.cid,
            id: id,
            type: eventType,
            msg: msg,
            data: data
        });

        logger.compute(this.cid, "Publishing the event [ " + eventType + " ] for expense [ " + id + " ]. The following message is to be published: [ " + message + " ]", "info");

        try {

            const topicName = this.config.getTopics().expenses;

            if (!topic) {
                logger.compute(this.cid, `Instantiating PubSub Topic for topic [${topicName}]`, "info");
                topic = pubsub.topic(this.config.getTopics().expenses);
                logger.compute(this.cid, `PubSub Topic [${topicName}] instantiated!`, "info");
            }

            await topic.publishMessage({ data: Buffer.from(message) });

            logger.compute(this.cid, "Successfully published the event [ " + eventType + " ] for expense [ " + id + " ]", "info");

            return { published: true }

        } catch (e: any) {

            logger.compute(this.cid, "Publishing the event [ " + eventType + " ] failed for expense [ " + id + " ]. The following message had to be published: [ " + message + " ]", "error");
            logger.compute(this.cid, e, 'error');
            console.error(e);

            return { published: false }

        }

    }
}

export interface PublishingResult {
    published: boolean
}


export const EXPENSE_EVENTS = {

    // A transaction has been tagged
    expenseTagged: "expenseTagged",

    // A transaction has been untagged
    expenseUntagged: "expenseUntagged", 

}