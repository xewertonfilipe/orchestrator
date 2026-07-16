const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/**
 * @typedef {{ isLocal?: boolean; isContainerLocal?: boolean; isProduction?: boolean }} WebpackEnv
 */

const REQUIRED_PRODUCTION_IMPORTS = {
  account: "BYTEBANK_ACCOUNT_MFE_URL",
  authentication: "BYTEBANK_AUTHENTICATION_MFE_URL",
  menu: "BYTEBANK_MENU_MFE_URL",
  navbar: "BYTEBANK_NAVBAR_MFE_URL",
  rootConfig: "BYTEBANK_ROOT_CONFIG_MFE_URL",
  statement: "BYTEBANK_STATEMENT_MFE_URL",
  transaction: "BYTEBANK_TRANSACTION_MFE_URL",
};

/**
 * @returns {{ account: string; authentication: string; menu: string; navbar: string; rootConfig: string; statement: string; transaction: string; }}
 */
const getProductionImports = () => {
  const missingEnvVars = Object.values(REQUIRED_PRODUCTION_IMPORTS).filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required production import map env vars: ${missingEnvVars.join(
        ", "
      )}`
    );
  }

  return {
    account: process.env[REQUIRED_PRODUCTION_IMPORTS.account],
    authentication: process.env[REQUIRED_PRODUCTION_IMPORTS.authentication],
    menu: process.env[REQUIRED_PRODUCTION_IMPORTS.menu],
    navbar: process.env[REQUIRED_PRODUCTION_IMPORTS.navbar],
    rootConfig: process.env[REQUIRED_PRODUCTION_IMPORTS.rootConfig],
    statement: process.env[REQUIRED_PRODUCTION_IMPORTS.statement],
    transaction: process.env[REQUIRED_PRODUCTION_IMPORTS.transaction],
  };
};

/**
 * @param {WebpackEnv | undefined} webpackConfigEnv
 */
const getTemplateParameters = (webpackConfigEnv) => {
  const isProduction = Boolean(
    webpackConfigEnv && webpackConfigEnv.isProduction
  );

  return {
    isLocal: Boolean(webpackConfigEnv && webpackConfigEnv.isLocal),
    isContainerLocal: Boolean(
      webpackConfigEnv && webpackConfigEnv.isContainerLocal
    ),
    isProduction,
    productionImports: isProduction ? getProductionImports() : {},
    orgName: "bytebank",
  };
};

module.exports = (webpackConfigEnv, argv) => {
  const templateParameters = getTemplateParameters(webpackConfigEnv);
  const orgName = templateParameters.orgName;
  const defaultConfig = singleSpaDefaults({
    orgName,
    projectName: "root-config",
    webpackConfigEnv,
    argv,
    disableHtmlGeneration: true,
  });

  return merge(defaultConfig, {
    resolve: {
      extensions: [".ts", ".js", ".mjs", ".json"],
    },
    devServer: {
      client: {
        overlay: {
          errors: true,
          warnings: false,
          runtimeErrors: false,
        },
      },
    },
    // modify the webpack config however you'd like to by adding to this object
    plugins: [
      new HtmlWebpackPlugin({
        inject: false,
        template: "src/index.ejs",
        templateParameters,
      }),
    ],
  });
};
