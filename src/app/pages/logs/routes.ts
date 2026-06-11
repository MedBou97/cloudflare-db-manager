import { route } from "rwsdk/router";
import { LogsPage } from "./LogsPage";
import { requireVerified } from "@/app/pages/auth/middleware";

export const logsRoutes = [
  route("/logs", [requireVerified(), LogsPage]),
];
