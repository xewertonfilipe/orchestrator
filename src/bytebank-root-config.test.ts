import { registerApplication, start } from "single-spa";
import {
  constructApplications,
  constructLayoutEngine,
  constructRoutes,
} from "single-spa-layout";

const mockActivate = jest.fn();
const mockRoutes = { id: "routes" };
const mockApplications = [{ name: "@bytebank/a" }, { name: "@bytebank/b" }];

jest.mock("single-spa", () => ({
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
    jest.isolateModules(() => {
      require("./bytebank-root-config");
    });
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

  it("registers all applications and starts single-spa", () => {
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
});
