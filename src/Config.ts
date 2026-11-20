import { TotoControllerConfig, APIOptions, SecretsManager, AUTH_PROVIDERS } from "totoms";

const dbName = 'expenses';
const collections = {
    expenses: 'expenses',
    incomes: 'incomes', 
    settings: 'settings',
    cron: 'cron',
    tags: 'tags'
};

export class ControllerConfig extends TotoControllerConfig {

    constructor(secretsManager: SecretsManager) {
        super(secretsManager);
    }

    async load(): Promise<any> {

        // The parent loads the common secrets (mongo host, jwt signing key, expected audience, registry endpoint) and the mongo credentials
        await super.load();

    }

    getMongoSecretNames(): { userSecretName: string; pwdSecretName: string; } | null {

        return {
            userSecretName: 'toto-ms-expenses-mongo-user',
            pwdSecretName: 'toto-ms-expenses-mongo-pswd'
        };

    }

    getProps(): APIOptions {

        return {
            customAuthProvider: AUTH_PROVIDERS.toto
        };

    }

    getDBName() { return dbName }
    getCollections() { return collections }

}
