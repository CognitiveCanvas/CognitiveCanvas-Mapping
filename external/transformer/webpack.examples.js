const fs = require('fs');
const path = require('path');

const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const common = require('./webpack.common.js');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');

let configs = [];

const addIndexConfig = () => {
    let example = 'index';

    let name = example;

    let config = {
        entry: `./examples/${example}/main.js`,
        module: {
            rules: [
                {
                    test: /\.handlebars$/,
                    loader: "handlebars-loader"
                },
                {
                    test: /\.css/,
                    use: ExtractTextPlugin.extract({
                        fallback: "style-loader",
                        use: "css-loader"
                    })
                }
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: `Transformer.js`,
                template: `handlebars-loader!./examples/${example}/index.hbs`,
                filename: `index.html`,
                inject: 'head'
            }),
            new HtmlWebpackIncludeAssetsPlugin({
                assets: ['transformer.min.js'],
                append: false
            }),
            new ExtractTextPlugin(`${name}.css`)
        ],
        output: {
            path: path.resolve(__dirname, `dist`),
            filename: `${name}.js`
        }
    };
    configs.push(config);
};
addIndexConfig();

// get all handlebar files '.hbs'
let examples = fs.readdirSync('./examples').filter((folder) => folder.endsWith('-example'));
examples.forEach((example) => {
    let name = path.basename(example, '-example');

    let config = {
        entry: `./examples/${example}/main.js`,
        module: {
            rules: [
                {
                    test: /\.handlebars$/,
                    loader: "handlebars-loader"
                },
                {
                    test: /\.css/,
                    use: ExtractTextPlugin.extract({
                        fallback: "style-loader",
                        use: "css-loader"
                    })
                }
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: `${name} Example`,
                template: `handlebars-loader!./examples/${example}/index.hbs`,
                filename: `index.html`,
                inject: 'head'
            }),
            new HtmlWebpackIncludeAssetsPlugin({
                assets: ['../transformer.min.js'],
                append: false
            }),
            new ExtractTextPlugin(`${name}.css`)
        ],
        output: {
            path: path.resolve(__dirname, `dist/${name}`),
            filename: `${name}.js`
        }
    };
    configs.push(config);
});

module.exports = configs;