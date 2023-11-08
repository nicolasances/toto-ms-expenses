import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { FakeRequest, TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";
import { OnExpenseTagged } from "./handlers/OnExpenseTagged";
import { TotoEvent } from "./TotoEvent";
import { AEventHandler } from "./EventHanlder";
import { OnTagDeleted } from "./handlers/OnTagDeleted";
import { EVENTS } from "./EventPublisher";

export class EventHandlerHook implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        logger.compute(cid, `Received message from PubSub`);

        const HANDLERS: IIndexable = {

            [EVENTS.expenseTagged]: [new OnExpenseTagged(execContext)],
            [EVENTS.expenseUntagged]: [new OnExpenseTagged(execContext)],
            [EVENTS.tagDeleted]: [new OnTagDeleted(execContext)]

        }

        const totoEvent = JSON.parse(String(Buffer.from(req.body.message.data, 'base64'))) as TotoEvent;

        // Find the right event handler 
        if (HANDLERS[totoEvent.type]) {

            for (const handler of HANDLERS[totoEvent.type]) {

                await handler.handleEvent(totoEvent);

            }

        }

        return { processed: true }

    }

}

export interface IIndexable {
    [key: string]: Array<AEventHandler>;
}
