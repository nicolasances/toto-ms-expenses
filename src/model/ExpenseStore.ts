import moment from "moment";
import { Db, Document, ObjectId, WithId } from "mongodb";
import { ControllerConfig } from "../Config";
import { CurrencyConversion } from "../util/CurrencyConversion";
import { ExecutionContext } from "../controller/model/ExecutionContext";

export class ExpenseStore {

    db: Db;
    execContext: ExecutionContext;
    config: ControllerConfig;

    constructor(db: Db, execContext: ExecutionContext) {
        this.db = db;
        this.config = execContext.config as ControllerConfig;
        this.execContext = execContext;
    }

    /**
     * Creates ex-novo a Toto Expense in the expenses collection
     * 
     * @param expense a toto expense to create
     * @returns the id of the created expense
     */
    async createExpense(expense: TotoExpense): Promise<string> {

        // Fill all fields that are missing
        // Convert amount in euro
        expense.amountInEuro = await new CurrencyConversion(this.execContext).convertAmountToEUR(expense.amount, expense.currency);

        // Save the expense to DB
        const result = await this.db.collection(this.config.getCollections().expenses).insertOne(expense);

        // Return the id
        return result.insertedId.toHexString();

    }

    /**
     * Calculates the total expenses for the specified year month in the specified currency
     * 
     * @param user the user email
     * @param yearMonth the year month
     * @param targetCurrency the currency needed
     */
    async getMonthTotal(user: string, yearMonth: string, targetCurrency: string): Promise<GetMonthTotalResult> {

        // Fire the query
        const result = await this.db.collection(this.config.getCollections().expenses).aggregate([
            { $match: { user: user, yearMonth: parseInt(yearMonth) } },
            { $group: { _id: { currency: "$currency" }, total: { $sum: "$amount" } } }
        ]).toArray();

        // If there are no records
        if (!result || result.length == 0) return { yearMonth: yearMonth, currency: targetCurrency, total: 0 }

        // Get the conversion rate for the currency conversion (EUR to target currency)
        const { rate } = await new CurrencyConversion(this.execContext).getRateEURToTargetCurrency(targetCurrency)

        // Convert the amount in the target currency, if needed
        let amountInLocalCurrency = result[0].total;

        if (result[0]._id.currency != targetCurrency) amountInLocalCurrency = parseFloat((rate * amountInLocalCurrency).toFixed(2))

        // Return the total
        return {
            yearMonth: yearMonth,
            currency: targetCurrency,
            total: amountInLocalCurrency
        }

    }

    /**
     * Calculates the total amount of expenses for every month starting at yearMonthGte and ending today
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
        const cursor = this.db.collection(this.config.getCollections().expenses).aggregate(aggregate);

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

    /**
     * Calculates the total amount of expenses for every year starting at yearMonthGte and ending this year (included)
     * 
     * @param user the user to use to filter
     * @param yearMonthGte the start date to consider 
     * @param targetCurrency the target currency
     */
    async getTotalsPerYear(user: string, yearMonthGte: number, targetCurrency: string): Promise<YearsTotals> {

        // Get the exchange rate from EUR to Target Currency
        const { rate } = await new CurrencyConversion(this.execContext).getRateEURToTargetCurrency(targetCurrency)

        // Prepare the filter
        const filter = { $match: { user: user, yearMonth: { $gte: yearMonthGte } } };

        // Prepare the grouping by year and currency
        const groupByYearCurrency = { $group: { _id: { year: { $substr: ["$yearMonth", 0, 4] }, currency: '$currency' }, totalAmount: { $sum: '$amount' } } }

        // Project 
        const project = { $project: { _id: 0, currency: "$_id.currency", year: "$_id.year", totalAmount: "$totalAmount" } }

        // Sort
        const sort = { $sort: { year: 1 } }

        // Aggregate
        const aggregate = [filter, groupByYearCurrency, project, sort]

        // Fire the query
        const cursor = this.db.collection(this.config.getCollections().expenses).aggregate(aggregate);

        // Output: array of months and their totals
        const yearsTotals = new YearsTotals(yearMonthGte)

        while (await cursor.hasNext()) {

            // Get the item
            const item = await cursor.next() as any;

            let amount = item.totalAmount;

            // Calculate the total, by converting to local currency, if needed
            if (item.currency != targetCurrency) amount = item.totalAmount * rate

            // Add a YearTotal, converting the amount to the target currency
            yearsTotals.addYearTotal(new YearTotal(item.year, amount))

        }

        // Return the final list
        return yearsTotals

    }

    /**
     * Retrieves the specified expense
     * 
     * @param expenseId the expense Id
     */
    async getExpense(expenseId: string): Promise<TotoExpense | null> {

        const expense = await this.db.collection(this.config.getCollections().expenses).findOne({ _id: new ObjectId(expenseId) })

        return TotoExpense.fromPO(expense)

    }
}

export class TotoExpense {

    id?: string
    amount: number
    amountInEuro?: number
    category: Categories = Categories.VARIE
    date: string
    description: string
    yearMonth: number
    consolidated: boolean = false
    currency: string
    user: string
    monthly: boolean = false
    tags: string[] = []

    constructor(amount: number, date: string, description: string, currency: string, user: string, category?: string, monthly?: boolean) {

        this.amount = amount
        this.date = date
        this.description = description
        this.currency = currency
        this.user = user

        // Calculate year month from date
        this.yearMonth = parseInt(moment(this.date, "YYYYMMDD").format("YYYYMM"))

        // Set the category
        if (category) this.category = categoryFromString(category)

        // Other optional fields
        if (monthly) this.monthly = monthly

    }

    static fromPO(po: WithId<Document> | null) {

        if (po == null) return null;

        const expense = new TotoExpense(po.amount, String(po.date), po.description, po.currency, po.user, po.category, po.monthly);
        expense.id = po._id.toHexString();
        expense.amountInEuro = po.amountInEuro;
        expense.tags = po.tags;

        return expense

    }

}

export enum Categories {
    AUTO = "AUTO",
    CLOTHES = "CLOTHES",
    FOOD = "FOOD",
    FURNITURE = "FURNITURE",
    HOME = "HOME",
    PALESTRA = "PALESTRA",
    SALUTE = "SALUTE",
    SUPERMERCATO = "SUPERMERCATO",
    SVAGO = "SVAGO",
    USCITE = "USCITE",
    VARIE = "VARIE",
    VIAGGI = "VIAGGI",
    XMAS = "XMAS",
    CHILD = "CHILD",
    PET = "PET",
}

function categoryFromString(categoryString: string) {

    const categoryKeys = Object.keys(Categories) as (keyof typeof Categories)[];

    for (const key of categoryKeys) {
        if (Categories[key] === categoryString) {
            return Categories[key];
        }
    }

    return Categories.VARIE

}

/**
 * Interface for the return parameter of the getMonthTotal method
 */
export interface GetMonthTotalResult {
    yearMonth: string,
    currency: string,
    total: number
}

/**
 * Interface used to represent the total amount of expenses in a month
 */
export class MonthTotal {
    yearMonth: string
    amount: number

    constructor(yearMonth: string, amount: number) {
        this.yearMonth = yearMonth
        this.amount = amount
    }

    /**
     * Adds the specified amount to this month's total
     * 
     * This will be used when a yearMonth is composed of expenses in different currencies
     * 
     * @param amount amount to add to this month total
     */
    addAmount(amount: number) {
        this.amount += amount
    }
}

/**
 * Interface used to represent the total amount of expenses for each month
 * in a given period represented by the interface [yearMonthGte, today]
 */
export class MonthsTotals {
    months: MonthTotal[] = []
    yearMonthGte: number

    constructor(yearMonthGte: number) {
        this.yearMonthGte = yearMonthGte
    }

    /**
     * Add this month's total to the accumulated list of month totals
     * 
     * Note that if a MonthTotal with same yearMonth has already been added, 
     * this method will just add the amount to the existing MonthTotal
     * 
     * @param monthTotal the month total to add
     */
    addMonthTotal(monthTotal: MonthTotal) {

        // If the month is already present, just add the amount to it
        let found = false;

        for (const month of this.months) {

            if (month.yearMonth == monthTotal.yearMonth) {
                month.addAmount(monthTotal.amount)
                found = true
            }

        }

        if (!found) this.months.push(monthTotal)
    }

    find(year: string, month: string): MonthTotal | null {

        for (const monthTotal of this.months) {

            if (monthTotal.yearMonth == `${year}${month}`) return monthTotal

        }

        return null

    }

}

/**
 * Interface used to represent the total amount of expenses in a year
 */
export class YearTotal {
    year: string
    amount: number

    constructor(year: string, amount: number) {
        this.year = year
        this.amount = amount
    }

    /**
     * Adds the specified amount to this year's total
     * 
     * This will be used when a year is composed of expenses in different currencies
     * 
     * @param amount amount to add to this month total
     */
    addAmount(amount: number) {
        this.amount += amount
    }
}

/**
 * Interface used to represent the total amount of expenses for each month
 * in a given period represented by the interface [yearMonthGte, today]
 */
export class YearsTotals {
    years: YearTotal[] = []
    yearMonthGte: number

    constructor(yearMonthGte: number) {
        this.yearMonthGte = yearMonthGte
    }

    /**
     * Add this year's total to the accumulated list of years' totals
     * 
     * Note that if a YearTotal with same year  has already been added, 
     * this method will just add the amount to the existing YearTotal
     * 
     * @param yearTotal the year total to add
     */
    addYearTotal(yearTotal: YearTotal) {

        // If the year is already present, just add the amount to it
        let found = false;

        for (const year of this.years) {

            if (year.year == yearTotal.year) {
                year.addAmount(yearTotal.amount)
                found = true
            }

        }

        if (!found) this.years.push(yearTotal)
    }

    findYearTotal(year: string): YearTotal | null {

        for (const yearTotal of this.years) {

            if (yearTotal.year == year) return yearTotal

        }

        return null
    }

}