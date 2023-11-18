
import { TotoAPIController } from "./controller/TotoAPIController";
import { ControllerConfig } from "./Config";
import { PostExpense } from "./dlg/PostExpense";
import { StartBackup } from "./dlg/backup/StartBackup";
import { GetExpenses } from "./dlg/GetExpenses";
import { PostTag } from "./dlg/tags/PostTag";
import { GetTags } from "./dlg/tags/GetTags";
import { DeleteTag } from './dlg/tags/DeleteTag';
import { TagExpense } from "./dlg/TagExpense";
import { EventHandlerHook } from "./evt/EventHandlerHook";
import { UntagExpense } from "./dlg/UntagExpense";
import { GetTagExpenses } from "./dlg/tags/GetTagExpenses";
import { GetTag } from "./dlg/tags/GetTag";
import { GetUnreviewedMonths } from "./dlg/insights/GetUnreviewedMonths";

const api = new TotoAPIController("toto-ms-expenses", new ControllerConfig())

api.path("POST", "/expenses", new PostExpense())
api.path("GET", "/expenses", new GetExpenses())
api.path("POST", "/expenses/:id/tags", new TagExpense());
api.path("DELETE", "/expenses/:id/tags/:tagId", new UntagExpense());

api.path("POST", "/tags", new PostTag())
api.path("GET", "/tags", new GetTags())
api.path("GET", "/tags/:id", new GetTag());
api.path("DELETE", "/tags/:id", new DeleteTag());
api.path("GET", "/tags/:id/expenses", new GetTagExpenses());

api.path('GET', '/insights/unconsolidated', new GetUnreviewedMonths());

api.path("POST", "/backup", new StartBackup())

api.path("POST", "/events", new EventHandlerHook())
api.path("POST", "/events/tag", new EventHandlerHook())

api.init().then(() => {
    api.listen()
});