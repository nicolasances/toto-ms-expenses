import { CustomAuthVerifier } from "./controller/model/CustomAuthVerifier";
import { TotoControllerConfig } from "./controller/model/TotoControllerConfig";
import { ValidatorProps } from "./controller/model/ValidatorProps";
import { TotoAuthProvider } from "./totoauth/TotoAuthProvider";
import { MongoClient, ServerApiVersion } from 'mongodb';
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const secretManagerClient = new SecretManagerServiceClient();

const dbName = 'expenses';
const collections = {
    expenses: 'expenses',
    settings: 'settings',
    cron: 'cron',
    tags: 'tags'
};
const topics = {
    expenses: 'expenses'
}


export class ControllerConfig implements TotoControllerConfig {

    mongoUser: string | undefined;
    mongoPwd: string | undefined;
    mongoHost: string | undefined;
    expectedAudience: string | undefined;


    async load(): Promise<any> {

        let promises = [];

        promises.push(secretManagerClient.accessSecretVersion({ name: `projects/${process.env.GCP_PID}/secrets/mongo-host/versions/latest` }).then(([version]) => {

            this.mongoHost = version.payload!.data!.toString();

        }));

        promises.push(secretManagerClient.accessSecretVersion({ name: `projects/${process.env.GCP_PID}/secrets/toto-expected-audience/versions/latest` }).then(([version]) => {

            this.expectedAudience = version.payload!.data!.toString();

        }));

        promises.push(secretManagerClient.accessSecretVersion({ name: `projects/${process.env.GCP_PID}/secrets/toto-ms-expenses-mongo-user/versions/latest` }).then(([version]) => {

            this.mongoUser = version.payload!.data!.toString();

        }));

        promises.push(secretManagerClient.accessSecretVersion({ name: `projects/${process.env.GCP_PID}/secrets/toto-ms-expenses-mongo-pswd/versions/latest` }).then(([version]) => {

            this.mongoPwd = version.payload!.data!.toString();

        }));

        await Promise.all(promises);

    }

    getCustomAuthVerifier(): CustomAuthVerifier {

        return new TotoAuthProvider("https://toto-ms-auth-6lv62poq7a-ew.a.run.app")
    }

    getProps(): ValidatorProps {

        return {
        }
    }

    async getMongoClient() {

        const mongoUrl = `mongodb://${this.mongoUser}:${this.mongoPwd}@${this.mongoHost}:27017`

        return await new MongoClient(mongoUrl).connect();
    }
    
    getExpectedAudience(): string {
        
        return String(this.expectedAudience)
        
    }

    getDBName() { return dbName }
    getCollections() { return collections }
    getTopics() { return topics }

}