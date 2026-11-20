import { Request } from "express";
import { TotoDelegate, TotoRequest } from "totoms";

/**
 * Wraps the incoming push request, so that it can be handed over to the totoms message bus as is.
 */
interface EventsTagHookRequest extends TotoRequest {
    request: Request;   // The original Pub/Sub push request
}

/**
 * Keeps the legacy POST /events/tag endpoint alive.
 * 
 * totoms only registers POST /events for Pub/Sub push messages. Subscriptions that still push to /events/tag
 * are forwarded to the same message bus handling (which authorizes the Pub/Sub request itself).
 */
export class EventsTagHook extends TotoDelegate<EventsTagHookRequest, any> {

    async do(req: EventsTagHookRequest): Promise<any> {

        return await this.messageBus.onPushMessageReceived(req.request);

    }

    parseRequest(req: Request): EventsTagHookRequest {

        return { request: req };

    }

}
