
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

    constructor(Tag: ITagPO) {
        if (Tag.id) this.id = Tag.id;
        if (Tag.name) this.name = Tag.name;
        if (Tag.amountInEuro) this.amountInEuro = Tag.amountInEuro;
        if (Tag.amountInEuro) this.localCurrencyAmount = Tag.amountInEuro;
        if (Tag.creationDate) this.creationDate = Tag.creationDate;
        this.user = Tag.user;

        if (Tag._id) this.id = Tag._id.toString();
    }

}

export async function convertCurrency(Tag: Tag, targetCurrency: string): Promise<Tag> {

    if (targetCurrency == "EUR") return Tag;

    const rate = await getExchangeRate(targetCurrency);

    Tag.localCurrencyAmount = rate.rate * Tag.amountInEuro!;

    return Tag;

}

