import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { ControllerConfig } from "../../Config";
import fs from 'fs'
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();

export class StartBackup implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid;

        let client;

        // Iterate through the relevant collections
        try {

            const config = execContext.config as ControllerConfig;

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            const cursor = db.collection(config.getCollections().expenses).find();

            fs.appendFileSync("expenses.json", "[");
            while (await cursor.hasNext()) {

                const doc = await cursor.next();

                fs.appendFileSync("expenses.json", JSON.stringify(doc));
                if (await cursor.hasNext()) fs.appendFileSync("expenses.json", ",\n");
            }
            fs.appendFileSync("expenses.json", "]");

            // Copy the data to GCS
            const bucketName = "totoexperiments-expenses-backup";

            let bucket = storage.bucket(bucketName)

            console.log(`Bucket ${bucketName} exists? [${await bucket.exists()}]`);
            
            await bucket.upload("expenses.json")

            fs.rmSync("expenses.json", {force: true})

            return { backup: "done" }

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