import { addErrorHandler, registerApplication, start } from "single-spa";
import {
  constructApplications,
  constructLayoutEngine,
  constructRoutes,
} from "single-spa-layout";

const mockActivate = jest.fn();
const mockRoutes = { id: "routes" };
const mockApplications = [{ name: "@bytebank/a" }, { name: "@bytebank/b" }];

jest.mock("single-spa", () => ({
  addErrorHandler: jest.fn(),
  registerApplication: jest.fn(),
  start: jest.fn(),
}));

jest.mock("single-spa-layout", () => ({
  constructRoutes: jest.fn(() => mockRoutes),
  constructApplications: jest.fn(() => mockApplications),
  constructLayoutEngine: jest.fn(() => ({ activate: mockActivate })),
}));

describe("bytebank-root-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = "";
    delete (window as Window & { System?: unknown }).System;
    jest.isolateModules(() => {
      require("./bytebank-root-config");
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("constructs routes, applications and layout engine", () => {
    expect(constructRoutes).toHaveBeenCalledWith("test-file-stub");
    expect(constructApplications).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: mockRoutes,
        loadApp: expect.any(Function),
      })
    );
    expect(constructLayoutEngine).toHaveBeenCalledWith({
      routes: mockRoutes,
      applications: mockApplications,
    });
  });

  it("keeps a dynamic loadApp callback for application names", async () => {
    const config = (constructApplications as jest.Mock).mock.calls[0][0];

    await expect(config.loadApp({ name: "single-spa" })).resolves.toBeDefined();
  });

  it("returns fallback lifecycle for supported app when dynamic import fails", async () => {
    const slot = document.createElement("div");

    const config = (constructApplications as jest.Mock).mock.calls[0][0];
    const lifecycle = (await config.loadApp({
      name: "@bytebank/account",
    })) as {
      bootstrap: () => Promise<void>;
      mount: (props?: { domElement?: Element | null }) => Promise<void>;
      unmount: () => Promise<void>;
    };

    expect(typeof lifecycle.bootstrap).toBe("function");
    expect(typeof lifecycle.mount).toBe("function");
    expect(typeof lifecycle.unmount).toBe("function");

    await lifecycle.mount({ domElement: slot });

    expect(slot.textContent).toContain("Conta indisponivel");
    expect(slot.textContent).toContain("Tentar novamente");
  });

  it("keeps rejection for unsupported app when dynamic import fails", async () => {
    const config = (constructApplications as jest.Mock).mock.calls[0][0];

    await expect(
      config.loadApp({ name: "@bytebank/not-found" })
    ).rejects.toBeDefined();
  });

  it("registers all applications and starts single-spa", () => {
    expect(addErrorHandler).toHaveBeenCalledTimes(1);
    expect(registerApplication).toHaveBeenCalledTimes(mockApplications.length);
    expect(registerApplication).toHaveBeenNthCalledWith(
      1,
      mockApplications[0],
      0,
      mockApplications
    );
    expect(registerApplication).toHaveBeenNthCalledWith(
      2,
      mockApplications[1],
      1,
      mockApplications
    );
    expect(mockActivate).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("renders fallback message for supported app load errors", () => {
    document.body.innerHTML =
      '<application name="@bytebank/account"></application>';

    const handler = (addErrorHandler as jest.Mock).mock.calls[0][0] as (
      error: unknown
    ) => void;

    handler({
      appOrParcelName: "@bytebank/account",
      message:
        "application '@bytebank/account' died in status LOADING_SOURCE_CODE",
    });

    const container = document.querySelector(
      'application[name="@bytebank/account"]'
    );

    expect(container?.textContent).toContain("Conta indisponivel");
    expect(container?.textContent).toContain(
      "Nao foi possivel carregar este modulo agora"
    );
    expect(container?.textContent).toContain("Tentar novamente");
  });

  it("does not render fallback for unsupported applications", () => {
    document.body.innerHTML =
      '<application name="@bytebank/not-found"></application>';

    const handler = (addErrorHandler as jest.Mock).mock.calls[0][0] as (
      error: unknown
    ) => void;

    handler({
      appOrParcelName: "@bytebank/not-found",
      message:
        "application '@bytebank/not-found' died in status LOADING_SOURCE_CODE",
    });

    const container = document.querySelector(
      'application[name="@bytebank/not-found"]'
    );

    expect(container?.querySelector(".mfe-error-fallback")).toBeNull();
  });

  it("does not render fallback when error is not related to loading", () => {
    document.body.innerHTML =
      '<application name="@bytebank/menu"></application>';

    const handler = (addErrorHandler as jest.Mock).mock.calls[0][0] as (
      error: unknown
    ) => void;

    handler({
      appOrParcelName: "@bytebank/menu",
      message: "unexpected runtime error",
    });

    const container = document.querySelector(
      'application[name="@bytebank/menu"]'
    );

    expect(container?.querySelector(".mfe-error-fallback")).toBeNull();
  });

  it("keeps fallback idempotent for repeated errors", () => {
    document.body.innerHTML =
      '<application name="@bytebank/transaction"></application>';

    const handler = (addErrorHandler as jest.Mock).mock.calls[0][0] as (
      error: unknown
    ) => void;

    const errorPayload = {
      appOrParcelName: "@bytebank/transaction",
      message: "Failed to fetch dynamically imported module",
    };

    handler(errorPayload);
    handler(errorPayload);

    const container = document.querySelector(
      'application[name="@bytebank/transaction"]'
    );

    expect(container?.querySelectorAll(".mfe-error-fallback")).toHaveLength(1);
  });

  it("probes module url when retry button is clicked", async () => {
    document.body.innerHTML =
      '<application name="@bytebank/account"></application>';

    (
      window as Window & {
        System?: { resolve: (moduleName: string) => string };
      }
    ).System = {
      resolve: jest.fn(() => "http://localhost:9004/bytebank-account.js"),
    };

    const originalFetch = globalThis.fetch;
    const fetchSpy = jest.fn().mockResolvedValue({ ok: false } as Response);
    Object.defineProperty(globalThis, "fetch", {
      value: fetchSpy,
      configurable: true,
    });

    const handler = (addErrorHandler as jest.Mock).mock.calls[0][0] as (
      error: unknown
    ) => void;

    handler({
      appOrParcelName: "@bytebank/account",
      message:
        "application '@bytebank/account' died in status LOADING_SOURCE_CODE",
    });

    const button = document.querySelector(
      ".mfe-error-retry"
    ) as HTMLButtonElement;

    button.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:9004/bytebank-account.js"),
      expect.objectContaining({ cache: "no-store", method: "GET" })
    );

    Object.defineProperty(globalThis, "fetch", {
      value: originalFetch,
      configurable: true,
    });
  });

  it("shows loading state while retry availability is being checked", () => {
    document.body.innerHTML =
      '<application name="@bytebank/account"></application>';

    (
      window as Window & {
        System?: { resolve: (moduleName: string) => string };
      }
    ).System = {
      resolve: jest.fn(() => "http://localhost:9004/bytebank-account.js"),
    };

    const originalFetch = globalThis.fetch;
    const pendingFetch = jest.fn(() => new Promise<Response>(() => undefined));
    Object.defineProperty(globalThis, "fetch", {
      value: pendingFetch,
      configurable: true,
    });

    const handler = (addErrorHandler as jest.Mock).mock.calls[0][0] as (
      error: unknown
    ) => void;

    handler({
      appOrParcelName: "@bytebank/account",
      message:
        "application '@bytebank/account' died in status LOADING_SOURCE_CODE",
    });

    const button = document.querySelector(
      ".mfe-error-retry"
    ) as HTMLButtonElement;

    button.click();

    expect(button.disabled).toBe(true);
    expect(button.classList.contains("mfe-error-retry-loading")).toBe(true);
    expect(button.textContent).toBe("Verificando...");

    Object.defineProperty(globalThis, "fetch", {
      value: originalFetch,
      configurable: true,
    });
  });
});
