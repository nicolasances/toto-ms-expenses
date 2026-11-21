# Salary Prediction

## Summary
Provides an endpoint that "predicts" the next salary of the user. 
The logic is deliberately simple: the prediction is the **average of the salary of the last three completed months**. There is no ML involved.

## Endpoint

`GET /predictions/salary`

### Query parameters
| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `currency` | no | `EUR` | The currency the predicted salary is expressed in. Amounts are converted the same way the other stats endpoints (e.g. expenses and incomes per month) do it. |

### Response

```json
{
  "predictedSalary": 4200.5,
  "currency": "EUR",
  "basedOnMonths": [202508, 202509, 202510]
}
```

- `predictedSalary`: the average salary, in the requested currency.
- `currency`: the currency of `predictedSalary`.
- `basedOnMonths`: the `yearMonth` values (`YYYYMM`) that were actually used in the average. Only months that have at least one salary income are listed.

When there is no salary data in the window:

```json
{
  "predictedSalary": null,
  "currency": "EUR",
  "basedOnMonths": []
}
```

The status code is `200` in this case.

## Logic

1. Salary = an income (see `incomes` collection, `TotoIncome`) whose `category` is `SALARY`.
2. The window is the **last three completed months**. The current month is excluded, since it is usually partial and the salary might not have been received yet.
3. For each month in the window, the salary is the sum of all the `SALARY` incomes of that month for the authenticated user, converted to the requested currency.
4. Months with no `SALARY` income are **ignored** (they are not counted as zero).
5. `predictedSalary` = sum of the monthly salaries / number of months that have a salary.
6. If no month in the window has a salary, `predictedSalary` is `null`.

### Example
Today is November 2026. The window is August, September, October 2026.

| Month | Salary |
|-------|--------|
| 202608 | 4000 |
| 202609 | (none) |
| 202610 | 4400 |

`predictedSalary` = (4000 + 4400) / 2 = 4200, `basedOnMonths` = `[202608, 202610]`.

## Out of scope
- Any ML or statistical forecasting (trends, seasonality, weighting).
- Configurable window size or configurable salary category.
- Predicting anything other than salary.
- Adjusting for bonuses, raises or one-off payments.

## Related code
- `src/model/IncomeStore.ts`: income model and income stats (`getTotalsPerMonth`).
- `src/dlg/stats/GetIncomesTotalPerMonth.ts`: reference for how income stats endpoints are built.
- `src/util/CurrencyConversion.ts`: currency conversion.
- `src/index.ts`: where endpoints are registered.

## Implementation notes
- The prediction logic lives in `src/model/SalaryPredictor.ts` (pure, unit tested in `test/model/SalaryPredictor.test.ts`). The endpoint is `src/dlg/predictions/GetSalaryPrediction.ts`.
- Monthly salary totals come from `IncomeStore.getTotalsPerMonth`, which now accepts an optional `category` filter. The currency conversion is therefore exactly the one used by the other income stats: an income whose currency differs from the target currency is multiplied by the EUR-to-target rate. Any limitation of that conversion applies to this endpoint as well.
- The "current month" is determined in the `Europe/Rome` timezone, like the other stats endpoints.
