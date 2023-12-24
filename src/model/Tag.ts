
import { ObjectId } from "mongodb";
import { CurrencyConversion } from "../util/CurrencyConversion";
import { ExecutionContext } from "../controller/model/ExecutionContext";

export interface ITag {

    id?: string,
    name?: string,
    amountInEuro?: number,
    creationDate?: string,  // Format YYYYMMDD
    numExpenses?: number,
    minDate?: string // YYYYMMDD
    maxDate?: string // YYYYMMDD
    user: string

}

export interface ITagPO extends ITag {
    _id?: ObjectId
}

export class Tag implements ITag {

    id?: string;
    name?: string;
    amountInEuro?: number;
    creationDate?: string;
    numExpenses?: number;
    minDate?: string;
    maxDate?: string;
    user: string;
    localCurrencyAmount?: number;

    constructor(tag: ITagPO) {
        if (tag.id) this.id = tag.id;
        if (tag.name) this.name = tag.name;
        if (tag.amountInEuro) this.amountInEuro = tag.amountInEuro;
        if (tag.amountInEuro) this.localCurrencyAmount = tag.amountInEuro;
        if (tag.creationDate) this.creationDate = tag.creationDate;
        if (tag.numExpenses) this.numExpenses = tag.numExpenses;
        if (tag.minDate) this.minDate = tag.minDate;
        if (tag.maxDate) this.maxDate = tag.maxDate;
        this.user = tag.user;

        if (tag._id) this.id = tag._id.toString();
    }

}

export async function convertCurrency(tag: Tag, targetCurrency: string, execContext: ExecutionContext): Promise<Tag> {

    if (targetCurrency == "EUR") return tag;

    const rate = await new CurrencyConversion(execContext).getRateEURToTargetCurrency(targetCurrency);

    tag.localCurrencyAmount = rate.rate * tag.amountInEuro!;

    return tag;

}

