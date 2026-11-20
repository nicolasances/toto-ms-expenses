import moment from "moment-timezone";
import { Logger, MessageDestination, TotoMessage, TotoMessageBus } from "totoms";

/**
 * Manages the publishing of an event
 */
export class EventPublisher {

    messageBus: TotoMessageBus;     // The totoms message bus used to publish
    cid?: string;                   // The correlation id attached to published events
    topicName: TOPIC_TYPE;          // The logical name of the topic (as configured in index.ts)

    constructor(messageBus: TotoMessageBus, cid: string | undefined, topicName: TOPIC_TYPE) {

        this.messageBus = messageBus;
        this.cid = cid;
        this.topicName = topicName;

    }

    /**
     * Publishes an event to the topic passed in the constructor
     * 
     * @param id id of the object for which an event is published
     * @param eventType name of the event
     * @param msg message that describe the event
     * @param data optional additional JSON data to attach to the event
     * 
     * @returns Promise with the publishing result
     */
    publishEvent = async (id: string, eventType: string, msg: string, data?: any): Promise<PublishingResult> => {

        const logger = Logger.getInstance();

        const message: TotoMessage = {
            timestamp: moment().tz('Europe/Rome').format('YYYY.MM.DD HH:mm:ss'),
            cid: String(this.cid),
            id: id,
            type: eventType,
            msg: msg,
            data: data
        };

        try {

            await this.messageBus.publishMessage(new MessageDestination({ topic: this.topicName }), message);

            return { published: true }

        } catch (e: any) {

            logger.compute(this.cid, `Publishing the event [ ${eventType} ] failed. The following message had to be published: [ ${JSON.stringify(message)} ]`, "error");
            logger.compute(this.cid, `${e}`, 'error');
            console.error(e);

            return { published: false }

        }

    }
}

export interface PublishingResult {
    published: boolean     // Whether the event was successfully published
}

export type TOPIC_TYPE = "expenses" | "tags"

export const EVENTS = {

    // A transaction has been tagged
    expenseTagged: "expenseTagged",

    // A transaction has been untagged
    expenseUntagged: "expenseUntagged",

    // A tag has been deleted
    tagDeleted: "tagDeleted"

}
