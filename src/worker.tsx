import { defineApp } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
import { Document } from "@/app/Document";
import { Home, ProtectedHome } from "@/app/pages/Home";
import { setCommonHeaders } from "@/app/headers";
import { loadAuthContext, redirectToLogin } from "@/app/pages/auth/middleware";
import { authRoutes } from "@/app/pages/auth/routes";
import { databasesRoutes } from "@/app/pages/databases/routes";
import { logsRoutes } from "@/app/pages/logs/routes";
import { Session } from "./session/durableObject";
import type { User } from "@prisma/client";

export { SessionDurableObject } from "./session/durableObject";

export type AppContext = {
  session: Session | null;
  user: User | null;
};

export default defineApp([
  setCommonHeaders(),
  loadAuthContext(),
  render(Document, [
    route("/", Home),
    route("/protected", [
      ({ ctx, headers }) => {
        if (!ctx.user || !ctx.user.verified) {
          return redirectToLogin();
        }
        headers.set("Cache-Control", "no-store");
      },
      ProtectedHome,
    ]),
    prefix("", authRoutes),
    prefix("", databasesRoutes),
    prefix("", logsRoutes),
  ]),
]);
