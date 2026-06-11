import { route } from "rwsdk/router";
import { db } from "@/db";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { ForgotPage } from "./ForgotPage";
import { ResetPage } from "./ResetPage";
import { sessions } from "@/session/store";
import { redirectToLogin } from "./middleware";

export const authRoutes = [
  route("/login", LoginPage),
  route("/register", RegisterPage),
  route("/forgot", ForgotPage),
  route("/reset", ResetPage),
  route("/verify", async ({ request }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return redirectToLogin();
    }

    const user = await db.user.findUnique({
      select: {
        id: true,
        verificationExpires: true,
      },
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return redirectToLogin();
    }

    if (!user.verificationExpires || user.verificationExpires < new Date()) {
      return redirectToLogin();
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    return redirectToLogin();
  }),
  route("/logout", async function ({ request }) {
    const headers = new Headers();
    await sessions.remove(request, headers);
    headers.set("Location", "/");

    return new Response(null, {
      status: 303,
      headers,
    });
  }),
];