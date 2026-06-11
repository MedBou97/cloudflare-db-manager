import { route } from "rwsdk/router";
import { requireVerified } from "@/app/pages/auth/middleware";
import { DatabasesPage } from "./DatabasesPage";
import { ConnectPage } from "./ConnectPage";
import { ConnectionDetailPage } from "./ConnectionDetailPage";
import { TableBrowsePage } from "./TableBrowsePage";
import { SqlEditorPage } from "./SqlEditorPage";

export const databasesRoutes = [
  route("/databases", [requireVerified(), DatabasesPage]),
  route("/databases/connect", [requireVerified(), ConnectPage]),
  route("/databases/connections/:id", [requireVerified(), ConnectionDetailPage]),
  route("/databases/connections/:id/tables/:schema/:table", [requireVerified(), TableBrowsePage]),
  route("/databases/connections/:id/sql", [requireVerified(), SqlEditorPage]),
];
