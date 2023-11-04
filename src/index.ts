
import { TotoAPIController } from "./controller/TotoAPIController";
import { ControllerConfig } from "./Config";
import { PostExpense } from "./dlg/PostExpense";
import { StartBackup } from "./dlg/backup/StartBackup";
import { GetExpenses } from "./dlg/GetExpenses";
import { PostTag } from "./dlg/tags/PostTag";
import { GetTags } from "./dlg/tags/GetTags";
import { DeleteTag } from './dlg/tags/DeleteTag';
import { TagExpense } from "./dlg/TagExpense";
import { ExpenseEventHandler } from "./evt/ExpenseEventHandler";

const api = new TotoAPIController("toto-ms-expenses", new ControllerConfig())

api.path("POST", "/expenses", new PostExpense())
api.path("GET", "/expenses", new GetExpenses())
api.path("POST", "/expenses/:id/tags", new TagExpense());

api.path("POST", "/tags", new PostTag())
api.path("GET", "/tags", new GetTags())
api.path("DELETE", "/tags/:id", new DeleteTag());

api.path("POST", "/backup", new StartBackup())

api.path("POST", "/events", new ExpenseEventHandler())

api.listen()