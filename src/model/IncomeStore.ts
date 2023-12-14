import moment from "moment";
import { Db } from "mongodb";
import { ControllerConfig } from "../Config";
import { CurrencyConversion } from "../util/CurrencyConversion";
import { ExecutionContext } from "../controller/model/ExecutionContext";

export class IncomeStore {

    db: Db;
    execContext: ExecutionContext;
    config: ControllerConfig;

    constructor(db: Db, execContext: ExecutionContext) {
        this.db = db;
        this.config = execContext.config as ControllerConfig;
        this.execContext = execContext;
    }

    /**
     * Creates ex-novo a Toto Income in the income collection
     * 
     * @param income a TotoIcome to save
     * @returns the id of the created income
     */
    async saveIncome(income: TotoIncome): Promise<string> {

        // Get the rate (EUR to Currency, so will need to be inverted)
        const { rate } = await new CurrencyConversion(this.execContext).getRateEURToTargetCurrency(income.currency);

        // Invert the rate
        const rateToEUR = 1 / rate

        // Save the rate
        income.rateToEur = rateToEUR;

        // Convert amount in euro
        income.amountInEuro = rateToEUR * income.amount

        // Save the expense to DB
        const result = await this.db.collection(this.config.getCollections().incomes).insertOne(income);

        // Return the id
        return result.insertedId.toHexString();

    }

}

export class TotoIncome {

    amount: number
    currency: string
    rateToEur?: number
    amountInEuro?: number
    date: string
    description: string
    yearMonth: number
    consolidated: boolean = false
    user: string

    constructor(amount: number, date: string, description: string, currency: string, user: string) {

        this.amount = amount
        this.date = date
        this.description = description
        this.currency = currency
        this.user = user

        // Calculate year month from date
        this.yearMonth = parseInt(moment(this.date, "YYYYMMDD").format("YYYYMM"))

    }

}
