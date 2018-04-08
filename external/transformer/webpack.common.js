const fs = require('fs');
const path = require('path');

// package configuration
const pkg = require('./package.json');

// webpack
const webpack = require('webpack');

// webpack plugins
const CleanWebpackPlugin = require('clean-webpack-plugin');

// const banner = {
//     banner: "some banner\n\nlinebreaks\nonemore", // the banner as string, it will be wrapped in a comment
//     // raw: boolean, // if true, banner will not be wrapped in a comment
//     // entryOnly: boolean, // if true, the banner will only be added to the entry chunks
//     // test: string | RegExp | Array,
//     // include: string | RegExp | Array,
//     // exclude: string | RegExp | Array,
// };

module.exports = {
    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "eslint-loader",
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    externals: ['hammerjs'],
    plugins: [
        new CleanWebpackPlugin('dist')
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: 'Transformer',
        libraryTarget: 'window'
    }
};