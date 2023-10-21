import { Logger } from "../../logger/TotoLogger"

export class ExecutionContext {

    logger: Logger;  
    cid?: string; 
    appVersion?: string; 
    apiName: string

    constructor(logger: Logger, apiName: string, cid?: string, appVersion?: string) {
        this.apiName = apiName;
        this.logger = logger;
        this.cid = cid;
        this.appVersion = appVersion;
    }

}