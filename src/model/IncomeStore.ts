import moment from "moment";
import { Db, ObjectId } from "mongodb";
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

    async getIncomes(filter?: GetIncomesFilter): Promise<TotoIncome[]> {

        // Build the query filter
        let queryFilter = {} as any

        // Add the year month, if any
        if (filter?.yearMonth) queryFilter.yearMonth = parseInt(filter.yearMonth)

        // Fire the query
        const incomes = await this.db.collection(this.config.getCollections().incomes).find(queryFilter).toArray()

        const totoIncomes = []

        // Convert to TotoIncome objects
        for (let income of incomes) {

            totoIncomes.push(TotoIncome.fromPO(income))
        }

        // Return result
        return totoIncomes

    }

    /**
     * Retrieves a specific income transaction
     * 
     * @param id the id of the income
     */
    async getIncome(id: string): Promise<TotoIncome | null> {

        // Find the transaction
        const result = await this.db.collection(this.config.getCollections().incomes).findOne({_id: new ObjectId(id)})

        // Check if null
        if (!result) return null

        // Convert it and return it
        return TotoIncome.fromPO(result)

    }

}

/**
 * This class can be used to filter incomes when reading them through getIncomes()
 */
export class GetIncomesFilter {

    yearMonth?: string

}

/**
 * This class represents the model of an Income
 */
export class TotoIncome {

    id?: string
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

    /**
     * Creates the TotoIncome based on a json object read from Mongo
     * @param po the po as read from Mongo
     */
    static fromPO(po: any): TotoIncome {

        let income = new TotoIncome(po.amount, po.date, po.description, po.currency, po.user)

        income.id = po._id
        income.rateToEur = po.rateToEur
        income.amountInEuro = po.amountInEuro
        income.yearMonth = po.yearMonth
        income.consolidated = po.consolidated 
        
        return income

    }

}
