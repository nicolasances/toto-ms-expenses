import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";
import { TotoRuntimeError } from "../controller/model/TotoRuntimeError";

export class PostExpense implements TotoDelegate {

    do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {
        throw new TotoRuntimeError(500, "Method not implemented")
    }

}