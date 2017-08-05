// help: http://webpack.github.io/docs/configuration.html
// help: https://webpack.github.io/docs/webpack-dev-server.html#webpack-dev-server-cli
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const loaders = require('./webpack.loaders');

console.log('To debug open address: http://localhost:8027 on any browser');
console.log('');

const config = {
  target: 'web',
  entry: [
    // inject some code in order to enable the auto refresh of the browse in case of a file's change
    'webpack-dev-server/client?http://localhost:8027',
    // the entry application code
    path.resolve(__dirname, 'debug/index.ts')
  ],
  output: {
    path: path.resolve(__dirname, 'debug-ground/debug-on-browser'),
    filename: 'debug-browser.js'
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
