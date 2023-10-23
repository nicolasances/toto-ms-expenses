import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";
import { TotoRuntimeError } from "../controller/model/TotoRuntimeError";


export class PostExpense implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        return { success: true }

    }

}