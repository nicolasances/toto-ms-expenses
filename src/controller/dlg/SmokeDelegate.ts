import { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { ExecutionContext } from "../model/ExecutionContext";
import { FakeRequest, TotoDelegate } from "../model/TotoDelegate";
import { UserContext } from "../model/UserContext";

export class SmokeDelegate implements TotoDelegate {

    async do(req: Request, userContext: UserContext | undefined, execContext: ExecutionContext): Promise<SmokeResponse> {

        return {
            api: execContext.apiName,
            status: "running"
        }

    }


}

export interface SmokeResponse {
    api: string,
    status: string
}
