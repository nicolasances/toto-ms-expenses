
import { ObjectId } from "mongodb";
import { getExchangeRate } from "../controller/util/GetExchangeRate";

export interface ITag {

    id?: string,
    name?: string,
    amountInEuro?: number,
    creationDate?: string,  // Format YYYYMMDD
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
    user: string;
    localCurrencyAmount?: number;

    constructor(tag: ITagPO) {
        if (tag.id) this.id = tag.id;
        if (tag.name) this.name = tag.name;
        if (tag.amountInEuro) this.amountInEuro = tag.amountInEuro;
        if (tag.amountInEuro) this.localCurrencyAmount = tag.amountInEuro;
        if (tag.creationDate) this.creationDate = tag.creationDate;
        this.user = tag.user;

        if (tag._id) this.id = tag._id.toString();
    }

}

export async function convertCurrency(Tag: Tag, targetCurrency: string): Promise<Tag> {

    if (targetCurrency == "EUR") return Tag;

    const rate = await getExchangeRate(targetCurrency);

    Tag.localCurrencyAmount = rate.rate * Tag.amountInEuro!;

    return Tag;

}

