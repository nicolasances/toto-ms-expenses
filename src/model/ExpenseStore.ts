import moment from "moment";
import { Db } from "mongodb";
import { ControllerConfig } from "../Config";
import { CurrencyConversion } from "../controller/util/GetExchangeRate";
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

    async createExpense(expense: TotoExpense): Promise<string> {

        // Fill all fields that are missing
        // Convert amount in euro
        expense.amountInEuro = await new CurrencyConversion(this.execContext).convertAmountToEUR(expense.amount, expense.currency);

        // Save the expense to DB
        const result = await this.db.collection(this.config.getCollections().expenses).insertOne(expense);

        // Return the id
        return result.insertedId.toHexString();

    }
}

export class TotoExpense {

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