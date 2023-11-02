
import { TotoAPIController } from "./controller/TotoAPIController";
import { ControllerConfig } from "./Config";
import { PostExpense } from "./dlg/PostExpense";
import { StartBackup } from "./dlg/backup/StartBackup";
import { GetExpenses } from "./dlg/GetExpenses";
import { PostEvent } from "./dlg/events/PostEvent";
import { GetEvents } from "./dlg/events/GetEvents";

const api = new TotoAPIController("toto-ms-expenses", new ControllerConfig())

api.path("POST", "/expenses", new PostExpense())
api.path("GET", "/expenses", new GetExpenses())

api.path("POST", "/events", new PostEvent())
api.path("GET", "/events", new GetEvents())

api.path("POST", "/backup", new StartBackup())

api.listen()