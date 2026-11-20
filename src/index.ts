import { TotoMicroservice, TotoMicroserviceConfiguration, getHyperscalerConfiguration, SupportedHyperscalers } from "totoms";
import { ControllerConfig } from "./Config";
import { PostExpense } from "./dlg/PostExpense";
import { StartBackup } from "./dlg/backup/StartBackup";
import { GetExpenses } from "./dlg/GetExpenses";
import { PostTag } from "./dlg/tags/PostTag";
import { GetTags } from "./dlg/tags/GetTags";
import { DeleteTag } from './dlg/tags/DeleteTag';
import { TagExpense } from "./dlg/TagExpense";
import { UntagExpense } from "./dlg/UntagExpense";
import { GetTagExpenses } from "./dlg/tags/GetTagExpenses";
import { GetTag } from "./dlg/tags/GetTag";
import { GetUnreviewedMonths } from "./dlg/insights/GetUnreviewedMonths";
import { PutExpense } from "./dlg/PutExpense";
import { GetMonthTotal } from "./dlg/aggregates/GetMonthTotal";
import { PostIncome } from "./dlg/income/PostIncome";
import { GetExpensesTotalPerMonth } from "./dlg/stats/GetExpensesTotalPerMonth";
import { GetIncomes } from "./dlg/income/GetIncomes";
import { GetIncome } from "./dlg/income/GetIncome";
import { PutIncome } from "./dlg/income/PutIncome";
import { GetIncomesTotalPerMonth } from "./dlg/stats/GetIncomesTotalPerMonth";
import { StartRestore } from "./dlg/backup/StartRestore";
import { GetExpense } from "./dlg/GetExpense";
import { GetSettings } from "./dlg/settings/GetSettings";
import { PutSettings } from "./dlg/settings/PutSettings";
import { GetSavingsPerYear } from "./dlg/stats/GetSavingsPerYear";
import { GetSavingsPerMonth } from "./dlg/stats/GetSavingsPerMonth";
import { GetCategoriesTotalsPerMonth } from "./dlg/stats/GetCategoriesTotalsPerMonth";
import { GetCategoriesAvgMonthlySpendPerYear } from "./dlg/stats/GetCategoriesAvgMonthlySpendPerYear";
import { DeleteExpense } from "./dlg/DeleteExpense";
import { EventsTagHook } from "./evt/EventsTagHook";
import { OnExpenseTagged, OnExpenseUntagged } from "./evt/handlers/OnExpenseTagged";
import { OnTagDeleted } from "./evt/handlers/OnTagDeleted";

const config: TotoMicroserviceConfiguration = {
    serviceName: "toto-ms-expenses",
    environment: {
        hyperscaler: (process.env.HYPERSCALER as SupportedHyperscalers) || "gcp",
        hyperscalerConfiguration: getHyperscalerConfiguration()
    },
    customConfiguration: ControllerConfig,
    apiConfiguration: {
        apiEndpoints: [
            { method: 'POST', path: '/expenses', delegate: PostExpense },
            { method: 'GET', path: '/expenses', delegate: GetExpenses },
            { method: 'GET', path: '/expenses/:id', delegate: GetExpense },
            { method: 'DELETE', path: '/expenses/:id', delegate: DeleteExpense },
            { method: 'PUT', path: '/expenses/:id', delegate: PutExpense },
            { method: 'POST', path: '/expenses/:id/tags', delegate: TagExpense },
            { method: 'DELETE', path: '/expenses/:id/tags/:tagId', delegate: UntagExpense },
            { method: 'GET', path: '/expenses/:yearMonth/total', delegate: GetMonthTotal },
            { method: 'POST', path: '/incomes', delegate: PostIncome },
            { method: 'GET', path: '/incomes', delegate: GetIncomes },
            { method: 'GET', path: '/incomes/:id', delegate: GetIncome },
            { method: 'PUT', path: '/incomes/:id', delegate: PutIncome },
            { method: 'POST', path: '/tags', delegate: PostTag },
            { method: 'GET', path: '/tags', delegate: GetTags },
            { method: 'GET', path: '/tags/:id', delegate: GetTag },
            { method: 'DELETE', path: '/tags/:id', delegate: DeleteTag },
            { method: 'GET', path: '/tags/:id/expenses', delegate: GetTagExpenses },
            { method: 'GET', path: '/insights/unconsolidated', delegate: GetUnreviewedMonths },
            { method: 'POST', path: '/backup', delegate: StartBackup },
            { method: 'POST', path: '/restore', delegate: StartRestore },
            { method: 'POST', path: '/events/tag', delegate: EventsTagHook, options: { noAuth: true } },
            { method: 'GET', path: '/stats/expensesPerMonth', delegate: GetExpensesTotalPerMonth },
            { method: 'GET', path: '/stats/incomesPerMonth', delegate: GetIncomesTotalPerMonth },
            { method: 'GET', path: '/stats/savingsPerYear', delegate: GetSavingsPerYear },
            { method: 'GET', path: '/stats/savingsPerMonth', delegate: GetSavingsPerMonth },
            { method: 'GET', path: '/stats/categoryTotalsPerMonth', delegate: GetCategoriesTotalsPerMonth },
            { method: 'GET', path: '/stats/categoryAvgMonthlySpendPerYear', delegate: GetCategoriesAvgMonthlySpendPerYear },
            { method: 'GET', path: '/settings', delegate: GetSettings },
            { method: 'PUT', path: '/settings', delegate: PutSettings },
        ],
    },
    messageBusConfiguration: {
        topics: [
            { logicalName: "expenses", secret: "topic-name-expenses" },
            { logicalName: "tags", secret: "topic-name-tags" }
        ],
        messageHandlers: [
            OnExpenseTagged,
            OnExpenseUntagged,
            OnTagDeleted
        ]
    }
};

TotoMicroservice.init(config).then(microservice => {
    microservice.start();
});
