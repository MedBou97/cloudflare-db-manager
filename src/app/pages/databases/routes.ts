import { route } from "rwsdk/router";
import { requireVerified, requireAdmin } from "@/app/pages/auth/middleware";
import { DatabasesPage } from "./DatabasesPage";
import { ImportPage } from "./ImportPage";
import { DatabaseDetailPage } from "./DatabaseDetailPage";

export const databasesRoutes = [
  route("/databases", [requireVerified(), DatabasesPage]),
  route("/databases/import", [requireAdmin(), ImportPage]),
  route("/databases/:id", [requireVerified(), DatabaseDetailPage]),
];
