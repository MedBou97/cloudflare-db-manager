import { ErrorResponse } from "rwsdk/worker";
import { RouteMiddleware } from "rwsdk/router";
import { env } from "cloudflare:workers";
import { db, setupDb } from "@/db";
import { sessions, setupSessionStore } from "@/session/store";
import { ROLES } from "@/app/shared/constants";

export const redirectToLogin = () => {
  return new Response(null, {
    status: 302,
    headers: { Location: "/login" },
  });
};

export const loadAuthContext =
  (): RouteMiddleware =>
  async ({ ctx, request, headers }) => {
    await setupDb(env);
    setupSessionStore(env);

    try {
      ctx.session = await sessions.load(request);
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 401) {
        await sessions.remove(request, headers);
        headers.set("Location", "/login");

        return redirectToLogin();
      }

      throw error;
    }

    if (ctx.session?.userId) {
      ctx.user = await db.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
      });
      // console.log("🔍 FOUND USER");
    }
  };

export const requireVerified =
  (): RouteMiddleware =>
  ({ ctx, headers }) => {
    if (!ctx.user || !ctx.user.verified) {
      return redirectToLogin();
    }
    headers.set("Cache-Control", "no-store");
  };

export const requireAdmin =
  (): RouteMiddleware =>
  ({ ctx, headers }) => {
    if (!ctx.user || !ctx.user.verified) {
      return redirectToLogin();
    }
    if (ctx.user.role !== ROLES.ADMIN) {
      return new Response("Forbidden", { status: 403 });
    }
    headers.set("Cache-Control", "no-store");
  };