import assert from "assert";
import moment from "moment";
import { MonthTotal } from "../../src/model/ExpenseStore";
import { SalaryPredictor } from "../../src/model/SalaryPredictor";

describe("SalaryPredictor.lastCompletedMonths", () => {

    it("returns the three months before the current one, oldest first", () => {

        const now = moment("2026-11-21", "YYYY-MM-DD");

        const months = SalaryPredictor.lastCompletedMonths(now, 3);

        assert.deepStrictEqual(months, [202608, 202609, 202610]);

    });

    it("crosses the year boundary", () => {

        const now = moment("2026-02-05", "YYYY-MM-DD");

        const months = SalaryPredictor.lastCompletedMonths(now, 3);

        assert.deepStrictEqual(months, [202511, 202512, 202601]);

    });

});

describe("SalaryPredictor.predict", () => {

    it("averages the salary of the three months", () => {

        const totals = [new MonthTotal("202608", 4000), new MonthTotal("202609", 4200), new MonthTotal("202610", 4400)];

        const prediction = SalaryPredictor.predict(totals, [202608, 202609, 202610], "EUR");

        assert.strictEqual(prediction.predictedSalary, 4200);
        assert.strictEqual(prediction.currency, "EUR");
        assert.deepStrictEqual(prediction.basedOnMonths, [202608, 202609, 202610]);

    });

    it("ignores months without salary instead of counting them as zero", () => {

        const totals = [new MonthTotal("202608", 4000), new MonthTotal("202610", 4400)];

        const prediction = SalaryPredictor.predict(totals, [202608, 202609, 202610], "EUR");

        assert.strictEqual(prediction.predictedSalary, 4200);
        assert.deepStrictEqual(prediction.basedOnMonths, [202608, 202610]);

    });

    it("ignores months outside the window", () => {

        const totals = [new MonthTotal("202607", 1000), new MonthTotal("202608", 4000), new MonthTotal("202611", 9000)];

        const prediction = SalaryPredictor.predict(totals, [202608, 202609, 202610], "EUR");

        assert.strictEqual(prediction.predictedSalary, 4000);
        assert.deepStrictEqual(prediction.basedOnMonths, [202608]);

    });

    it("accepts month totals whose yearMonth comes from the database as a number", () => {

        const totals = [new MonthTotal(202608 as unknown as string, 4000)];

        const prediction = SalaryPredictor.predict(totals, [202608, 202609, 202610], "EUR");

        assert.strictEqual(prediction.predictedSalary, 4000);
        assert.deepStrictEqual(prediction.basedOnMonths, [202608]);

    });

    it("returns a null prediction when there is no salary in the window", () => {

        const prediction = SalaryPredictor.predict([], [202608, 202609, 202610], "USD");

        assert.strictEqual(prediction.predictedSalary, null);
        assert.strictEqual(prediction.currency, "USD");
        assert.deepStrictEqual(prediction.basedOnMonths, []);

    });

});
