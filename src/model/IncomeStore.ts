import moment from "moment";
import { Db, ObjectId } from "mongodb";
import { ControllerConfig } from "../Config";
import { CurrencyConversion } from "../util/CurrencyConversion";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { MonthTotal, MonthsTotals } from "./ExpenseStore";

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
        let queryFilter = { user: filter?.user } as any

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
        const result = await this.db.collection(this.config.getCollections().incomes).findOne({ _id: new ObjectId(id) })

        // Check if null
        if (!result) return null

        // Convert it and return it
        return TotoIncome.fromPO(result)

    }

    /**
     * Updates the specified income transaction
     * 
     * @param id the id of the transaction to update
     * @param updates an object with all the fields that need to be update
     */
    async updateIncome(id: string, updates: any): Promise<UpdateIncomeResult> {

        // Load the transaction 
        const result = await this.db.collection(this.config.getCollections().incomes).findOne({ _id: new ObjectId(id) })

        // Convert it
        const tx = TotoIncome.fromPO(result)

        // Update the transaction
        if (updates.amount != null) {

            // Update the amount
            tx.amount = parseFloat(updates.amount);

            // If the currency is not EUR recalculate the amount in EUR based on the original rate
            if (tx.currency != "EUR") tx.amountInEuro = tx.amount * tx.rateToEur!;
            else tx.amountInEuro = tx.amount
        }

        if (updates.date) {

            // Update the date 
            tx.date = updates.date

            // Recalculate the year month
            tx.yearMonth = parseInt(moment(tx.date, "YYYYMMDD").format("YYYYMM"))
        }

        if (updates.description) tx.description = updates.description
        if (updates.consolidated != null) tx.consolidated = updates.consolidated
        if (updates.category) tx.category = updates.category

        // Update the record
        const updateResult = await this.db.collection(this.config.getCollections().incomes).updateOne({ _id: new ObjectId(id) }, { $set: tx })

        return { modifiedCount: updateResult.modifiedCount }

    }

    /**
     * Calculates the total amount of incomes for every month starting at yearMonthGte and ending today
     * 
     * @param user the user email
     * @param yearMonthGte the yearMonth that delimits the start of the interval to consider. 
     */
    async getTotalsPerMonth(user: string, yearMonthGte: number, targetCurrency: string): Promise<MonthsTotals> {

        // Get the exchange rate from EUR to Target Currency
        const { rate } = await new CurrencyConversion(this.execContext).getRateEURToTargetCurrency(targetCurrency)

        // Prepare the filter
        let filter = { $match: { user: user, yearMonth: { $gte: yearMonthGte } } };

        // Prepare the grouping
        let groupByYearmonth = { $group: { _id: { yearMonth: '$yearMonth', currency: '$currency' }, amount: { $sum: '$amount' } } }

        // Sorting
        let sort = { $sort: { "_id.yearMonth": 1 } };

        // Prepare the aggregate
        let aggregate = [filter, groupByYearmonth, sort]

        // Fire the query
        const cursor = this.db.collection(this.config.getCollections().incomes).aggregate(aggregate);

        // Output: array of months and their totals
        const monthsTotal = new MonthsTotals(yearMonthGte)

        while (await cursor.hasNext()) {

            // Get the item
            const item = await cursor.next() as any;

            let amount = item.amount;

            // Calculate the total, by converting to local currency, if needed
            if (item._id.currency != targetCurrency) amount = item.amount * rate

            // Add a MonthTotal, converting the amount to the target currency
            monthsTotal.addMonthTotal(new MonthTotal(item._id.yearMonth, amount))

        }

        // Return the final list
        return monthsTotal

    }

}

export interface UpdateIncomeResult {
    modifiedCount: number
}

/**
 * This class can be used to filter incomes when reading them through getIncomes()
 */
export class GetIncomesFilter {

    user: string
    yearMonth?: string

    constructor(user: string) {
        this.user = user
    }

}

/**
 * This class represents the model of an Income
 */
export class TotoIncome {

    id?: string
    amount: number
    currency: string
    category: string = "VARIE"
    rateToEur?: number
    amountInEuro?: number
    date: string
    description: string
    yearMonth: number
    consolidated: boolean = false
    user: string

    constructor(amount: number, date: string, description: string, currency: string, user: string, category: string) {

        this.amount = amount
        this.date = date
        this.description = description
        this.currency = currency
        this.user = user
        this.category = category

        // Calculate year month from date
        this.yearMonth = parseInt(moment(this.date, "YYYYMMDD").format("YYYYMM"))

    }

    /**
     * Creates the TotoIncome based on a json object read from Mongo
     * @param po the po as read from Mongo
     */
    static fromPO(po: any): TotoIncome {

        let category = po.category
        if (!category) category = "VARIE"

        let income = new TotoIncome(po.amount, po.date, po.description, po.currency, po.user, category)

        income.id = po._id
        income.rateToEur = po.rateToEur
        income.amountInEuro = po.amountInEuro
        income.yearMonth = po.yearMonth
        income.consolidated = po.consolidated

        return income

    }

}
