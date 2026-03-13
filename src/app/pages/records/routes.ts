import { route } from "rwsdk/router";
import { RecordsPage } from "./RecordsPage";
import { requireVerified } from "@/app/pages/auth/middleware";

export const recordsRoutes = [
  route("/records", [requireVerified(), RecordsPage]),
];
