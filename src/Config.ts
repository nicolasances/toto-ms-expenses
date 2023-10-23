import { CustomAuthVerifier } from "./controller/model/CustomAuthVerifier";
import { TotoControllerConfig } from "./controller/model/TotoControllerConfig";
import { ValidatorProps } from "./controller/model/ValidatorProps";
import { TotoAuthProvider } from "./totoauth/TotoAuthProvider";
import { MongoClient, ServerApiVersion } from 'mongodb';

const mongoUrl = "mongodb://" + process.env.MONGO_USER + ":" + process.env.MONGO_PWD + "@" + process.env.MONGO_HOST + ":27017/expenses";
const dbName = 'expenses';
const collections = {
    expenses: 'expenses',
    settings: 'settings',
    cron: 'cron'
};


export class ControllerConfig implements TotoControllerConfig {

    async load(): Promise<any> {

    }

    getCustomAuthVerifier(): CustomAuthVerifier {

        return new TotoAuthProvider("https://toto-ms-auth-6lv62poq7a-ew.a.run.app")
    }

    getProps(): ValidatorProps {

        return {}
    }

    async getMongoClient() {
        return await new MongoClient(mongoUrl).connect();
    }

    getDBName() { return dbName }
    getCollections() { return collections }

}