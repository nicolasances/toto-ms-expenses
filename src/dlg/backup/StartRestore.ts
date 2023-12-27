import fs from 'fs'
import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { Storage } from "@google-cloud/storage";
import { correlationId } from '../../controller/util/CorrelationId';
import * as readline from 'readline';

const storage = new Storage();

export class StartRestore implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid ?? correlationId();
        const bucketName = String(process.env.BACKUP_BUCKET);

        // Extract needed data
        const date = req.body.date;

        // Validate required data
        if (!date) throw new ValidationError(400, `No date was provided.`)

        // Get the GCS Bucket
        const bucket = storage.bucket(bucketName)

        let client;

        try {

            logger.compute(cid, `Starting Expenses Database Restore. Restoring date [${date}]`)

            const config = execContext.config as ControllerConfig;

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Iterate through the relevant collections
            for (let collection of Object.keys(config.getCollections())) {

                logger.compute(cid, `Starting Restore of collection [${collection}]`)

                // Delete the content of the collection
                await db.collection(collection).deleteMany({})

                // Find the data on the GCS Bucket
                const file = bucket.file(`${date}-${collection}.json`)

                // Create a read stream
                const fileStream = file.createReadStream();

                // Read the file content
                const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

                let i = 0
                for await (const line of rl) {

                    // console.log(`Line ${i++}: ${line}`); 

                    console.log(line.indexOf("\n"))
                    
                    const doc = JSON.parse(line);

                    // Save the doc
                    db.collection(collection).insertOne(doc)

                }

                logger.compute(cid, `Restore of collection [${collection}] completed.`)

            }

            logger.compute(cid, `Database Restore completed`)

            return { backup: "done", date: date }

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