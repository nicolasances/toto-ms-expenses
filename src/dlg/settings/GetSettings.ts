import { Request } from "express";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { UserContext } from "../../controller/model/UserContext";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { SettingsStore, UserSettings } from "../../model/SettingsStore";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";


export class GetSettings implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const user = userContext.email
        const config = execContext.config as ControllerConfig;
        const logger = execContext.logger;
        const cid = execContext.cid;

        let client;

        try {

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Retrieve the settings
            return await new SettingsStore(db, execContext).getSettings(user)

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