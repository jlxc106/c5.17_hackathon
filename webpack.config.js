const path = require('path');
var HTMLWebpackPlugin = require('html-webpack-plugin');
var HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: __dirname + '/index.html',
  filename: 'index.html',
  inject: 'body'
});

module.exports = {
  entry: [
    //dev
    'webpack-dev-server/client?http://localhost:8080',
    __dirname + '/app.js'
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
    filename: 'bundle.js',
    path: __dirname
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
  mode: 'development',
  plugins: [HTMLWebpackPluginConfig]
};
