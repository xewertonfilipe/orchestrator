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
        templateParameters: {
          isLocal: true,
          isContainerLocal: false,
          orgName: "bytebank",
        },
      })
    );

    expect(mockMerge).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        base: { defaultConfig: true },
      })
    );
  });

  it("builds config for container-local environment", () => {
    const createConfig = require("./webpack.config");

    createConfig({ isContainerLocal: true }, { mode: "production" });

    expect(mockHtmlWebpackPlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        templateParameters: {
          isLocal: false,
          isContainerLocal: true,
          orgName: "bytebank",
        },
      })
    );
  });
});
