// /////////////////////////////////////////////////////////////////////////////////////////////////
//  WebPack 2 PROD Config
// /////////////////////////////////////////////////////////////////////////////////////////////////
//
//  author: Jose Quinto - https://blog.josequinto.com
//
//  WebPack 2 Migrating guide: https://webpack.js.org/guides/migrating/
//
// /////////////////////////////////////////////////////////////////////////////////////////////////

const resolve = require('path').resolve;
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  target: 'web',
  entry: {
    bundle: './src/client/index.ts',
  },
  context: resolve(__dirname, '../'),
  output: {
    path: resolve(__dirname, './../dist'),
    filename: '[name].js',
    publicPath: '',
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),      // Reduces 78 kb on React library
      },
      DEBUG: false,                                 // Doesn´t have effect on my example
      __DEVTOOLS__: false,                           // Doesn´t have effect on my example
    }),
    new ExtractTextPlugin({
      filename: 'main.css',
      allChunks: true,
    }),
    new webpack.optimize.AggressiveMergingPlugin(),

    new HtmlWebpackPlugin({     // Create HTML file that includes references to bundled CSS and JS.
      template: '!!ejs-loader!src/client/index.ejs',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      },
      inject: true,
    }),
  ],
  module: {
    // loaders -> rules in webpack 2
    rules: [
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
        exclude: [
          '/node_modules/',
        ],
      },
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
      {
        test: /\.css$/i,
        include: resolve(__dirname, './../src'),
        use:
          ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                  importLoaders: 1,
                  modules: false,
                  camelCase: true,
                  localIdentName: '[name]_[local]_[hash:base64:5]',
                  minimize: true,
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
          }),
      },
    ],
  },
// When importing a module whose path matches one of the following, just
// assume a corresponding global variable exists and use that instead.
// This is important because it allows us to avoid bundling all of our
// dependencies, which allows browsers to cache those libraries between builds.
// externals: {
//     "react": "React",
//     "react-dom": "ReactDOM"
// }
};
