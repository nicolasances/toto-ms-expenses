import { Db } from "mongodb";
import { ControllerConfig } from "../Config";

const F_USER = "user"
const F_CURRENCY = "currency"
const F_DASHBOARD_HIGHLIGHTS_VERSION = "dashboardHighlightsVersion"


export class SettingsStore {

    db: Db;
    cid?: string;
    config: ControllerConfig;

    constructor(db: Db, config: ControllerConfig, cid?: string) {
        this.db = db;
        this.config = config;
        this.cid = cid;
    }


    /**
     * Updates the user settings
     * 
     * @param userEmail the email of the user
     * @param userSettings the settings to update. The whole object will overwrite the settings, so all fields should be provided.
     */
    async updateSettings(userEmail: string, userSettings: UserSettings) {

        await this.db.collection(this.config.getCollections().settings).updateOne(
            { [F_USER]: userEmail },
            { $set: userSettings },
            { upsert: true }
        )

    }

    /**
     * Rertieves the user's settings
     * 
     * @param userEmail user email
     */
    async getSettings(userEmail: string): Promise<UserSettings> {

        let settings = await this.db.collection(this.config.getCollections().settings).findOne({ [F_USER]: userEmail })

        if (!settings) return new UserSettings("EUR")

        return UserSettings.fromJSON(settings)

    }

}

export class UserSettings {

    currency: string
    dashboardHighlightsVersion?: string

    constructor(currency: string) {
        this.currency = currency
    }

    static fromJSON(data: any): UserSettings {

        const currency = data[F_CURRENCY] ?? "EUR"

        const settings = new UserSettings(currency)

        settings.dashboardHighlightsVersion = data[F_DASHBOARD_HIGHLIGHTS_VERSION]

        return settings

    }

}