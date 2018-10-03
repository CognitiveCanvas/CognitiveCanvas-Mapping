const merge = require('webpack-merge');
const common = require('./webpack.common.js');
//const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = merge(common, {
  plugins: [
    //new WebpackShellPlugin({onBuildStart:['echo "Webpack Start"'], onBuildEnd:['wfs --id=tool_panel_dev --host=web:strate@webstrates.ucsd.edu ./dist'], verbose: "false"})
  ],
  mode: 'development',
  watch: true,
  devtool: "eval-source-map",
});
