import { describe, expect, it } from "vitest";
import { appRoutes } from "./app-routes";
describe("generic SaaS routes",()=>{
 it.each(["all","leader","erp"] as const)("does not revive ERP under legacy surface %s",surface=>{
  const paths=appRoutes(surface).map(route=>route.path);
  expect(paths).toEqual(expect.arrayContaining(["/","/login","/invite","/operator","/change-password"]));
  expect(paths).not.toContain("/erp");
 });
});
