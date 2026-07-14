declare module "single-spa-layout" {
  import type { RegisterApplicationConfig } from "single-spa";

  export function constructRoutes(layout: unknown): unknown;

  export function constructApplications(args: {
    routes: unknown;
    loadApp: (app: { name: string }) => Promise<unknown>;
  }): Array<RegisterApplicationConfig>;

  export function constructLayoutEngine(args: {
    routes: unknown;
    applications: Array<unknown>;
  }): {
    activate: () => void;
  };
}
