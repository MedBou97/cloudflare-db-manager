import { route } from "rwsdk/router";
import { requireVerified } from "@/app/pages/auth/middleware";
import { DatabasesPage } from "./DatabasesPage";
import { ConnectPage } from "./ConnectPage";
import { ConnectionDetailPage } from "./ConnectionDetailPage";

export const databasesRoutes = [
  route("/databases", [requireVerified(), DatabasesPage]),
  route("/databases/connect", [requireVerified(), ConnectPage]),
  route("/databases/connections/:id", [requireVerified(), ConnectionDetailPage]),
];
