import { route } from "rwsdk/router";

// Redirect legacy /records URL to the new /databases page
export const recordsRoutes = [
  route("/records", () => new Response(null, { status: 302, headers: { Location: "/databases" } })),
];
