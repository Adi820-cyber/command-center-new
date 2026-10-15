import { redirect, type RouteObject } from "react-router";
import {
  LoginRoute,
  loginAction,
  loginLoader,
} from "./features/auth/login-route";
import { ChangePasswordRoute } from "./features/auth/change-password-route";
import { OperatorConsoleRoute } from "./features/operator/route";
import { SaasRoute, InvitationRoute } from "./features/saas/route";
import { signOut } from "./lib/auth";
import type { AppSurface } from "./lib/surface";

export function appRoutes(_surface: AppSurface): RouteObject[] {
  return [
    {
      path: "/login",
      loader: loginLoader,
      action: loginAction,
      Component: LoginRoute,
    },
    {
      path: "/logout",
      action: async () => {
        await signOut();
        return redirect("/login");
      },
    },
    { path: "/change-password", Component: ChangePasswordRoute },
    { path: "/operator", Component: OperatorConsoleRoute },
    { path: "/invite", Component: InvitationRoute },
    { path: "/", Component: SaasRoute },
    {
      path: "*",
      Component: () => (
        <main>
          <h1>Page unavailable</h1>
          <p>This page is not part of the KPI platform.</p>
          <a href="/">Open workspace</a>
        </main>
      ),
    },
  ];
}
