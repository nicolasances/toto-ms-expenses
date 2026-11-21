import assert from "assert";
import { Amount, CurrencyConversion } from "../../src/util/CurrencyConversion"

describe("CurrencyConversion.alignToSameCurrency", () => {

    it("applies the given rate to all amounts with a currency different than the one provided", () => {

        const amounts: Amount[] = [
            { amount: 2500, currency: "DKK" },
            { amount: 1000, currency: "EUR" }
        ]

        const alignedAmounts = new CurrencyConversion("").alignToSameCurrency(amounts, "DKK", 0.5);

        assert.deepStrictEqual(alignedAmounts, [{amount: 2500, currency: "DKK"}, {amount: 500, currency: "DKK"}])

    })

    it("does not apply the rate if all amounts are with the target currency", () => {

        const amounts: Amount[] = [
            { amount: 2500, currency: "DKK" },
        ]

        const alignedAmounts = new CurrencyConversion("").alignToSameCurrency(amounts, "DKK", 0.5);

        assert.deepStrictEqual(alignedAmounts, [{amount: 2500, currency: "DKK"}])

    })

    it("applies the given rate to all currency different than the target one, even though they are not the same currency", () => {
        // This use case points at an accepted bug (because for now there are only 2 currencies supported, so it will never happen): 
        // if I had 3 currencies: EUR, DKK, USD, since the function only requires one rate (e.g. EUR:DKK) and the target currency is DKK, 
        // that rate will be WRONGFULLY applied to both EUR (correct) and USD (WRONG!)

        const amounts: Amount[] = [
            { amount: 2500, currency: "DKK" },
            { amount: 1000, currency: "EUR" },
            { amount: 2000, currency: "USD" },
        ]

        const alignedAmounts = new CurrencyConversion("").alignToSameCurrency(amounts, "DKK", 0.5);

        assert.deepStrictEqual(alignedAmounts, [{amount: 2500, currency: "DKK"}, {amount: 500, currency: "DKK"}, {amount: 1000, currency: "DKK"}])
    })

    it("returns an empty array if there are no amounts", () => {

        const amounts: Amount[] = []

        const alignedAmounts = new CurrencyConversion("").alignToSameCurrency(amounts, "DKK", 0.5);

        assert.deepStrictEqual(alignedAmounts, [])

    })
})