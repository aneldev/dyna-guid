// help: http://webpack.github.io/docs/configuration.html
// help: http://webpack.github.io/docs/configuration.html
// help: https://webpack.github.io/docs/webpack-dev-server.html#webpack-dev-server-cli
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const package = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const loaders = require('./webpack.loaders');

const config = {
  target: 'node',
  entry: [
		// the entry application code
		path.resolve(__dirname, 'src/index.ts')
	],
	output: {
    path: path.resolve(__dirname, 'build'),
		filename: 'index.js',
    publicPath: '/dist/',
    library: package.name,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
	resolve: {
		alias: {},
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".jsx"]
	},
	module: {
    loaders: loaders
  },
  node: {
    fs: "empty"
  }
};

module.exports = config;
