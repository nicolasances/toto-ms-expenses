import { Request } from "express";
import { TotoDelegate, UserContext, Logger, ValidationError, TotoRuntimeError } from "totoms";
import { ParsedRequest } from "../ParsedRequest";
import { SettingsStore, UserSettings } from "../../model/SettingsStore";
import { ControllerConfig } from "../../Config";


export class PutSettings extends TotoDelegate<ParsedRequest, any> {

  parseRequest(req: Request): ParsedRequest {

    return { params: req.params, query: req.query, body: req.body, headers: req.headers };

  }

    async do(req: ParsedRequest, userContext: UserContext): Promise<any> {

        const user = userContext.email
        const config = this.config as ControllerConfig;
        const logger = Logger.getInstance();
        const cid = this.cid;

        // Build the settings object
        const settings = UserSettings.fromJSON(req.body)


        try {

            const db = await config.getMongoDb(config.getDBName());

            // Update it 
            await new SettingsStore(db, config, cid).updateSettings(user, settings)

            return { updated: true }

        } catch (error) {

            logger.compute(cid, `${error}`, "error")

            if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                throw error;
            }
            else {
                console.log(error);
                throw error;
            }

        }

    }
}