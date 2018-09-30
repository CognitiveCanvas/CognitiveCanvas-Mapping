const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
    bundle: './src/entry.js',
  },
  plugins: [
    //new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: 'Cognitive Canvas Map',
      template: './index.html',
      filename: '../index.html'
    })
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/resources')
  },
  mode: 'development',
  devtool: "eval-source-map",
  module: {
     rules: [
       {
         test: /\.css$/,
         use: [
           'style-loader',
           'css-loader'
         ]
       },
       {
         test: /\.exec\.js$/,
         use: [ 'script-loader' ]
       }
     ]
   }
};
