# API Endpoints

> Note: this document currently covers only the endpoints listed below. Endpoints added before this document was created are not documented here yet.

- [Predictions](#predictions)

## Predictions
| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/predictions/salary` | Predicts the next salary as the average of the last three completed months |

### GET /predictions/salary
**Used for:** showing the user the salary they can expect next, for example to plan savings. The logic is a plain average (no ML), described in [Salary Prediction](../features/salary-prediction.md).

**Request:** no body. Optional query parameter `currency` (default `EUR`).

**Response:** [`SalaryPrediction`](../../src/model/SalaryPredictor.ts)
```json
{ "predictedSalary": 4200.5, "currency": "EUR", "basedOnMonths": [202608, 202609, 202610] }
```
When there is no salary in the window, the status is `200` and `predictedSalary` is `null`, with an empty `basedOnMonths`.

**Implementation:** [`GetSalaryPrediction`](../../src/dlg/predictions/GetSalaryPrediction.ts)
