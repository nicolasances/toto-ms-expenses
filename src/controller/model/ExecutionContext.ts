import { Logger } from "../../logger/TotoLogger"
import { TotoControllerConfig } from "./TotoControllerConfig";

export class ExecutionContext {

    logger: Logger;  
    cid?: string; 
    appVersion?: string; 
    apiName: string
    config: TotoControllerConfig;

    constructor(logger: Logger, apiName: string, config: TotoControllerConfig, cid?: string, appVersion?: string) {
        this.apiName = apiName;
        this.logger = logger;
        this.cid = cid;
        this.appVersion = appVersion;
        this.config = config;
    }

}