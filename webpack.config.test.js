const mockSingleSpaDefaults = jest.fn(() => ({ defaultConfig: true }));
const mockMerge = jest.fn((base, extra) => ({ base, extra }));
const mockHtmlWebpackPlugin = jest.fn().mockImplementation((options) => {
  return { plugin: "HtmlWebpackPlugin", options };
});

jest.mock("webpack-config-single-spa", () => mockSingleSpaDefaults);
jest.mock("webpack-merge", () => ({ merge: mockMerge }));
jest.mock("html-webpack-plugin", () => mockHtmlWebpackPlugin);

describe("webpack config", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("builds config for local environment", () => {
    const createConfig = require("./webpack.config");
    const argv = { mode: "development" };

    const result = createConfig({ isLocal: true }, argv);

    expect(mockSingleSpaDefaults).toHaveBeenCalledWith(
      expect.objectContaining({
        orgName: "bytebank",
        projectName: "root-config",
        argv,
        disableHtmlGeneration: true,
      })
    );

    expect(mockHtmlWebpackPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        inject: false,
        template: "src/index.ejs",
        templateParameters: expect.objectContaining({
          isLocal: true,
          isContainerLocal: false,
          isProduction: false,
          orgName: "bytebank",
          productionImports: {},
        }),
      })
    );

    expect(mockMerge).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        base: { defaultConfig: true },
        extra: expect.objectContaining({
          devServer: {
            client: {
              overlay: {
                errors: true,
                warnings: false,
                runtimeErrors: false,
              },
            },
          },
        }),
      })
    );
  });

  it("builds config for container-local environment", () => {
    const createConfig = require("./webpack.config");

    createConfig({ isContainerLocal: true }, { mode: "production" });

    expect(mockHtmlWebpackPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        templateParameters: expect.objectContaining({
          isLocal: false,
          isContainerLocal: true,
          isProduction: false,
          orgName: "bytebank",
          productionImports: {},
        }),
      })
    );
  });

  it("builds config for production environment with remote import map", () => {
    process.env.BYTEBANK_ACCOUNT_MFE_URL =
      "https://account.vercel.app/bytebank-account.js";
    process.env.BYTEBANK_AUTHENTICATION_MFE_URL =
      "https://authentication.vercel.app/bytebank-authentication.js";
    process.env.BYTEBANK_MENU_MFE_URL =
      "https://menu.vercel.app/bytebank-menu.js";
    process.env.BYTEBANK_NAVBAR_MFE_URL =
      "https://navbar.vercel.app/bytebank-navbar.js";
    process.env.BYTEBANK_ROOT_CONFIG_MFE_URL =
      "https://orchestrator.vercel.app/bytebank-root-config.js";
    process.env.BYTEBANK_STATEMENT_MFE_URL =
      "https://statement.vercel.app/bytebank-statement.js";
    process.env.BYTEBANK_TRANSACTION_MFE_URL =
      "https://transaction.vercel.app/bytebank-transaction.js";

    const createConfig = require("./webpack.config");

    createConfig({ isProduction: true }, { mode: "production" });

    expect(mockHtmlWebpackPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        templateParameters: expect.objectContaining({
          isLocal: false,
          isContainerLocal: false,
          isProduction: true,
          productionImports: {
            account: "https://account.vercel.app/bytebank-account.js",
            authentication:
              "https://authentication.vercel.app/bytebank-authentication.js",
            menu: "https://menu.vercel.app/bytebank-menu.js",
            navbar: "https://navbar.vercel.app/bytebank-navbar.js",
            rootConfig:
              "https://orchestrator.vercel.app/bytebank-root-config.js",
            statement: "https://statement.vercel.app/bytebank-statement.js",
            transaction:
              "https://transaction.vercel.app/bytebank-transaction.js",
          },
        }),
      })
    );
  });
});
