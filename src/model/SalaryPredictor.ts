import { Moment } from "moment";
import { MonthTotal } from "./ExpenseStore";

/**
 * Predicts the next salary as the average of the salary of the last completed months.
 *
 * No ML involved: this is a plain average. See docs/features/salary-prediction.md
 */
export class SalaryPredictor {

    /**
     * Calculates the yearMonths of the last completed months, excluding the month that contains `now`.
     *
     * @param {Moment} now - The reference date. Its month is considered not completed and is excluded.
     * @param {number} count - How many completed months to return.
     *
     * @returns {number[]} the yearMonths (YYYYMM), oldest first.
     */
    static lastCompletedMonths(now: Moment, count: number): number[] {

        const yearMonths: number[] = [];

        for (let i = count; i >= 1; i--) yearMonths.push(parseInt(now.clone().subtract(i, "months").format("YYYYMM")));

        return yearMonths;

    }

    /**
     * Predicts the next salary based on the monthly salary totals.
     *
     * Rules:
     * - Only the months in the window are considered.
     * - Months that have no salary are ignored: they are not counted as zero.
     * - If no month in the window has a salary, the predicted salary is null.
     *
     * @param {MonthTotal[]} monthTotals - The salary total of each month that has a salary, already in the target currency.
     * @param {number[]} windowYearMonths - The yearMonths (YYYYMM) that make up the window to consider.
     * @param {string} currency - The currency the month totals are expressed in.
     *
     * @returns {SalaryPrediction} the prediction.
     */
    static predict(monthTotals: MonthTotal[], windowYearMonths: number[], currency: string): SalaryPrediction {

        const salaryMonths = monthTotals.filter(monthTotal => windowYearMonths.includes(Number(monthTotal.yearMonth)));

        if (salaryMonths.length == 0) return { predictedSalary: null, currency, basedOnMonths: [] };

        const total = salaryMonths.reduce((sum, monthTotal) => sum + monthTotal.amount, 0);
        const basedOnMonths = salaryMonths.map(monthTotal => Number(monthTotal.yearMonth)).sort((a, b) => a - b);

        return { predictedSalary: total / salaryMonths.length, currency, basedOnMonths };

    }

}

/**
 * The result of a salary prediction
 */
export interface SalaryPrediction {
    predictedSalary: number | null;     // The predicted salary, in `currency`. Null if there is no salary in the window.
    currency: string;                   // The currency of the predicted salary.
    basedOnMonths: number[];            // The yearMonths (YYYYMM) that were actually used for the average, oldest first.
}
