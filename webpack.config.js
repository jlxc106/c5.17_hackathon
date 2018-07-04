const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
var HTMLWebpackPlugin = require('html-webpack-plugin');
var HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: __dirname + '/index.html',
  filename: 'index.html',
  inject: 'body'
});

module.exports = {
  entry: [
    //dev
    //'webpack-dev-server/client?http://localhost:8080',
    __dirname + '/app.js',
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, /server/],
        loader: 'babel-loader'
      }
    ]
  },
  output: {
    //filename: 'bundle.js',
    filename: 'bundle.min.js',
    path: __dirname,
    publicPath: '/'
  },
  devServer: {
    hot: true,
    historyApiFallback: true,
    // proxy: {
    //   '/socket.io': {
    //     target: 'http://localhost:3000',
    //     ws: true
    //     // secure: false
    //   }
    // }
  },
  devtool: 'inline-source-map',
  watchOptions: {
    ignored: /node_modules/,
  },
   optimization:{
     minimize: true,
     minimizer:[
       new UglifyJsPlugin({
         include: /\.min\.js$/
       })
     ]
   },
  mode: 'production',
  plugins: [HTMLWebpackPluginConfig]
};
