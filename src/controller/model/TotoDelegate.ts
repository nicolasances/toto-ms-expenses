import { Request } from "express";
import { ExecutionContext } from "./ExecutionContext";
import { UserContext } from "./UserContext";

export interface TotoDelegate {

    do(req: Request | FakeRequest, userContext: UserContext | undefined, execContext: ExecutionContext): Promise<any>

}

export interface FakeRequest {

    query: any, 
    params: any, 
    headers: any, 
    body: any

}