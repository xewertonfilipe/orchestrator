const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa");
const HtmlWebpackPlugin = require("html-webpack-plugin");

/**
 * @typedef {{ isLocal?: boolean; isContainerLocal?: boolean }} WebpackEnv
 */

/**
 * @param {WebpackEnv | undefined} webpackConfigEnv
 */
const getTemplateParameters = (webpackConfigEnv) => {
  return {
    isLocal: Boolean(webpackConfigEnv && webpackConfigEnv.isLocal),
    isContainerLocal: Boolean(
      webpackConfigEnv && webpackConfigEnv.isContainerLocal
    ),
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
