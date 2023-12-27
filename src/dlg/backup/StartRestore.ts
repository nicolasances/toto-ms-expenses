import fs from 'fs'
import { Request } from "express";
import { ExecutionContext } from "../../controller/model/ExecutionContext";
import { UserContext } from "../../controller/model/UserContext";
import { TotoDelegate } from "../../controller/model/TotoDelegate";
import { ControllerConfig } from "../../Config";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";
import { Bucket, Storage } from "@google-cloud/storage";
import { correlationId } from '../../controller/util/CorrelationId';
import * as readline from 'readline';
import { Db } from 'mongodb';

const storage = new Storage();

export class StartRestore implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        const logger = execContext.logger;
        const cid = execContext.cid ?? correlationId();
        const bucketName = String(process.env.BACKUP_BUCKET);
        const config = execContext.config as ControllerConfig;

        let client;

        try {

            // Extract needed data
            const date = req.body.date;

            // Validate required data
            if (!date) throw new ValidationError(400, `No date was provided.`)

            // Get the GCS Bucket
            const bucket = storage.bucket(bucketName)

            logger.compute(cid, `Starting Expenses Database Restore. Restoring date [${date}]`)

            client = await config.getMongoClient();
            const db = client.db(config.getDBName());

            // Check that backup data is available
            const available = await isBackupAvailable(db, bucket, date, execContext);

            logger.compute(cid, `Backup data ${available ? "available" : "NOT available"} on date ${date}`)

            if (!available) throw new ValidationError(400, `Backup data not available for date [${date}]`)

            // Iterate through the relevant collections
            const promises = []

            for (let collection of Object.keys(config.getCollections())) {

                // Restore the collection
                promises.push(restoreCollection(db, bucket, collection, date, execContext))

            }

            // Wait 'til all parallel operations finish
            await Promise.all(promises)

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

/**
 * Checks if all the backup data is available before starting the restore.
 * 
 * @param db 
 * @param bucket the backup bucket
 * @param date the date to restore
 */
async function isBackupAvailable(db: Db, bucket: Bucket, date: string, execContext: ExecutionContext): Promise<boolean> {

    const config = execContext.config as ControllerConfig;

    for (let collection of Object.keys(config.getCollections())) {

        const file = bucket.file(`${date}-${collection}.json`)

        const [exists] = await file.exists()

        if (!exists) return false;

    }

    return true;

}

/**
 * Restores the specified collection at the given date
 * 
 * @param db 
 * @param bucket the bucket where the expense data is stored
 * @param collection the name of the collection 
 * @param date the date to restore
 * @param execContext 
 * 
 * @returns the count of elements restored
 */
async function restoreCollection(db: Db, bucket: Bucket, collection: string, date: string, execContext: ExecutionContext): Promise<number> {

    const logger = execContext.logger
    const cid = execContext.cid

    logger.compute(cid, `Starting Restore of collection [${collection}]`)

    // Delete the content of the collection
    await db.collection(collection).deleteMany({})

    // Find the data on the GCS Bucket
    const file = bucket.file(`${date}-${collection}.json`)

    // Create a read stream
    const fileStream = file.createReadStream();

    // Read the file content
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let count = 0
    let batch = []

    for await (const line of rl) {

        const doc = JSON.parse(line);

        batch.push(doc);

        count++;

        if (count % 200 == 0) {

            // Save the batch of documents
            await db.collection(collection).insertMany(batch)

            logger.compute(cid, `Inserted ${count} documents in collection [${collection}]`)

            // Reset the batch
            batch = []

        }
    }

    // Insert the remaining elements in the batch
    if (batch.length > 0) {

        await db.collection(collection).insertMany(batch)
    }

    logger.compute(cid, `Restore of collection [${collection}] completed. Restored [${count}] documents.`)

    return count;

}