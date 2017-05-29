/* eslint-disable global-require */
const resolve = require('path').resolve;
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // To enhance the debugging process. More info: https://webpack.js.org/configuration/devtool/
  devtool: 'inline-source-map',
  target: 'web',
  entry: {
    bundle: [
      // bundle the client for webpack-dev-server
      // and connect to the provided endpoint
      'webpack-dev-server/client?http://localhost:3000',
      // bundle the client for hot reloading
      // only- means to only hot reload for successful updates
      // 'webpack/hot/only-dev-server',
      // Our app main entry
      './src/client/index.ts',
    ],
  },
  output: {
    path: resolve(__dirname, '../dist'),
    filename: '[name].js',
    // necessary for HMR to know where to load the hot update chunks
    publicPath: '/',
  },

  devServer: {
    // All options here: https://webpack.js.org/configuration/dev-server/

    // enable HMR on the server
    hot: false,
    // match the output path
    contentBase: resolve(__dirname, '../dist'),
    // match the output `publicPath`
    publicPath: '/',

    port: 3000,
    historyApiFallback: true,
  },

  context: resolve(__dirname, '../'),
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    // enable HMR globally
    new webpack.HotModuleReplacementPlugin(),

    // prints more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin(),

    // do not emit compiled assets that include errors
    new webpack.NoEmitOnErrorsPlugin(),

    new HtmlWebpackPlugin({     // Create HTML file that includes references to bundled CSS and JS.
      template: '!!ejs-loader!src/client/index.ejs',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      },
      inject: true,
    }),
  ],
  watchOptions: {
    poll: true,
  },
  module: {
    // loaders -> rules in webpack 2
    rules: [
      // Once TypeScript is configured to output source maps we need to tell webpack
      // to extract these source maps and pass them to the browser,
      // this way we will get the source file exactly as we see it in our code editor.
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
        exclude: '/node_modules/',
      },
      {
        enforce: 'pre',
        test: /\.tsx?$/,
        use: 'source-map-loader',
        exclude: '/node_modules/',
      },
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      {
        test: /\.ts(x?)$/,
        use: [
          { loader: 'ts-loader' },
        ],
        include: resolve(__dirname, './../src'),
      },
      {
        test: /\.css$/i,
        exclude: [/node_modules/],
        include: resolve(__dirname, './../src'),
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 1,
              modules: true,
              camelCase: true,
              localIdentName: '[name]_[local]_[hash:base64:5]',
              minimize: false,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => ([
                require('postcss-import')(),
                // Following CSS Nesting Module Level 3: http://tabatkins.github.io/specs/css-nesting/
                require('postcss-nesting')(),
                require('postcss-custom-properties')(),
                // https://github.com/ai/browserslist
                require('autoprefixer')({
                  browsers: ['last 1 version'],
                }),
              ]),
            },
          },
        ],
      },
    ],
  },
};
