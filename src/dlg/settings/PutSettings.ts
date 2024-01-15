import { Request } from "express";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { UserContext } from "../../controller/model/UserContext";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { SettingsStore, UserSettings } from "../../model/SettingsStore";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";


export class PutSettings implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const user = userContext.email
        const config = execContext.config as ControllerConfig;
        const logger = execContext.logger;
        const cid = execContext.cid;

        // Build the settings object
        const settings = UserSettings.fromJSON(req.body)

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Update it 
            await new SettingsStore(db, execContext).updateSettings(user, settings)

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
        finally {
            if (client) client.close();
        }

    }
}