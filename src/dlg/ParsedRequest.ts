import { TotoRequest } from "totoms";

/**
 * The parts of an incoming HTTP request that the delegates of this service use.
 */
export interface ParsedRequest extends TotoRequest {
    params: any;    // The path parameters of the request (e.g. :id)
    query: any;     // The query string parameters of the request
    body: any;      // The (parsed) JSON body of the request
    headers: any;   // The headers of the request
}
