import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { FakeRequest, TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";


export class ExpenseEventHandler implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;
        
        logger.compute(cid, `Received message from PubSub`);

        const data = JSON.parse(String(Buffer.from(req.body.message.data, 'base64')));

        console.log(req.body);
        
        logger.compute(cid, JSON.stringify(data));

        return { processed: true }

    }


}