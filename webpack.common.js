const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    cogcanvas_bundle: './src/entry.js',
  },
  plugins: [
    //new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: 'Cognitive Canvas Map',
      template: './index.html',
      filename: '../index.html',
      inject: false
    }),
    new MiniCssExtractPlugin({
      filename: "style_bundle.css",
      chunkFilename: "[id].css"
    })
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/resources')
  },
  module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            //{ loader: 'style-loader', options: {singleton: true} },
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: '.'
              }
            },
            { loader: 'css-loader' }
          ]
        },
      {
        test: /\.exec\.js$/,
        use: [ 'script-loader' ]
      }
    ]
  }
};