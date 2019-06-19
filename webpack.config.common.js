// All config files required by NodeJS with extensions .es6, .es, .jsx, .mjs & .js, will be transpiled by Babel too including this one
//require('@babel/register');

// NodeJS modules & project's general info
const PackInfo = require('./package.json'); // Getting package.json info
const Path = require('path'); // NodeJS module: Creates a dynamic I/O absolute path from a root directory 
const SourceDirectories = Path.resolve(__dirname, 'src'); // Paths to look for source input files to bundle and process

// Webpack dependencies & plugins
const Webpack = require('webpack'); // Reference to access built-in plugins
const ManifestPlugin = require('webpack-manifest-plugin'); // Creates the Webpack's manifest JSON file
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // Cleans the output folder when invoked
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Auto generate HTML files from templates
const HtmlReplaceWebpackPlugin = require('html-replace-webpack-plugin'); // Replaces any content when parsing the HTML template
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // Extracts CSS from JS into separate files
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // Creates a bundle dependencies treemap

// Webpack configuration, it could be a function receiving an environment param and it must return the config object
module.exports = {
    // Base directory for resolving entry points & loaders from this config file
    // It is recommended to pass a value in to make this config file independent from any current working directory
    context: __dirname,
    // Entry points for the app to start execution and gather polyfills, one entry point per HTML page
    // Single Page Apps (SPA): one entry point, Multiple Page Apps (MPA): several entry points
    entry: {
        main: Path.resolve(__dirname, 'src/webpack.init.js')
    },
    // Config for the emitted bundles
    output: {
        filename: `${PackInfo.name}.[name].[contenthash].js`, // Entry points' bundles
        chunkFilename: `app/[name]/${PackInfo.name}.[name].[contenthash].chunk.js`, // Sync/Async loaded chunks
        path: Path.resolve(__dirname, 'build') // Absolute path to folder where all of the generated files will be saved
    },
    // The target environment where the bundle should run (default: web)
    target: 'web',
    // Optimization config for performance improvements
    optimization: {
        // Generating the Webpack's runtime code in a separated and shared bundle for all bundles/chunks
        runtimeChunk: 'single',
        // Splitting on-demand-loaded shared chunks avoiding duplicated dependencies' generation across the bundles/chunks
        // When dynamically importing modules, the Prefetching/Preloading Modules feature could be enabled via 'Magic Comments'
        // Prefetch: resource is probably needed for future flows and loads in idle state after parent resource is loaded
        // Preload: resource might be needed during current flow and loads instantly in parallel to parent resource
        splitChunks: {
            chunks: 'all', // This will made shared chunks available for both async & non-async bundles/chunks 
            minChunks: 2, // Minimal amount of bundles/chunks requesting a shared chunk
            // Grouping shared resources for caching improvements
            cacheGroups: {
                default: false,
                // Vendors caching group (NodeJS modules based)
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors'
                },
                // Custom shared common caching group
                common: {
                    test: Path.resolve(__dirname, 'src/app/common'), // This adds every file in the path to the cache group
                    name: 'common', // Placeholder value for main output.chunkFilename config prop
                    reuseExistingChunk: true, // If any module imported inside this chunk was splitted out already then reuse that older version
                    enforce: true // Forces to ignore default rules to chunk's generation, in order to always create this one
                }
            }
        }
    },
    // These options change how modules are resolved within Webpack processing
    resolve: {
        // Aliases for resolving modules' paths on their respective import/require calls
        alias: {
            'core-js': 'core-js-pure' // Required for solving duplicated references in bundles for both CoreJS & CoreJS-Pure
            /* '@assets': Path.resolve(__dirname, 'src/assets'),
            '@app': Path.resolve(__dirname, 'src/app'),
            '@locales': Path.resolve(__dirname, 'src/app/locales'),
            '@common': Path.resolve(__dirname, 'src/app/common') */
        },
        // Folders where the aliases start resolving from
        modules: ['node_modules', SourceDirectories]
    },
    // In this config section, loaders are invoked running preprocessors on files as they're imported
    // Loaders can be chained together into a series of transforms, but operating on every single file
    // Loaders are processed in a reverse order within the loaders array (i.e. from last elem to first elem)
    // On every rule is preferred to use 'include' over 'exclude' for performance improvements
    module: {
        rules: [
            // Babel loader allows transpiling ES5+ files using Babel & Webpack
            {
                test: /\.js$/,
                include: [SourceDirectories],
                use: {
                    loader: 'babel-loader',
                    options: {
                        // Plugins run before Presets and are processed in a regular order in the array (first to last)
                        plugins: [
                            // Enables the re-use of Babel's injected helpers code into a module in order to save on codesize
                            // It regularly uses @babel/runtime lib but when set with CoreJS 3 it uses @babel/runtime-corejs3 lib
                            // @babel/runtime-corejs3 lib includes CoreJS 3 (Pure) and a version of Regenerator-Runtime
                            // Loads CoreJS polyfills from the included CoreJS-Pure version avoiding polluting the global namespace
                            ['@babel/plugin-transform-runtime', {
                                // Enabling the use of CoreJS-Pure for polyfilling Babel helpers if needed
                                corejs: 3,
                                // Ensuring inlined Babel helpers are replaced with calls to the shared generated helpers module
                                helpers: true,
                                // Ensuring generator/async-await functions are transformed with a regenerator runtime w/o polluting the global scope
                                regenerator: true,
                                // Ensuring helpers will use only ES modules standard syntax discarding use CommonJS syntax
                                useESModules: true
                            }],
                            // Webpack natively supports dynamic imports but it breaks when using Babel for transpiling
                            // This plugin allows to use async on-demand loading of dynamic imports
                            '@babel/plugin-syntax-dynamic-import'
                        ],
                        // Presets are processed in a reversed order in the array (last to first)
                        presets: [
                            // Smart preset for transpiling files using latest ES6, ES7, and ES8 syntax & polyfills
                            // Polyfills for this smart preset are provided by CoreJS (CoreJS module must be installed)
                            // ** In order to reduce bundles file sizes and avoid duplicated references for CoreJS & CoreJS-Pure:
                            // (Issue: Both CoreJS [this smart preset] & CoreJS-Pure [@babel/plugin-trnasform-runtime + @babel/runtime-corejs3] were being bundled together)
                            // - CoreJS-Pure module must be installed instead of the regular CoreJS one,
                            // - And an alias for resolving 'core-js' imports/requires references to 'core-js-pure' must be created **
                            ['@babel/preset-env', {
                                // Polyfill of the latest JS standard
                                // https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md
                                corejs: 3.1, // Enabling new polyfills & features released in minor versions
                                // Enables CLI debugging output
                                debug: true,
                                // Ensuring ES6 module standard syntax won't be transformed to any other module type syntax
                                modules: false,
                                // Describes the minimum supported/targeted environments (MSTE) for this project
                                // Accepts either an object of MSTE versions or a string for a BrowserLists compatible query
                                // Info at https://github.com/browserslist/browserslist | Try queries at https://browserl.ist/
                                targets: 'defaults', // The BrowserLists defaults browsers set
                                // Configures how this smart preset handles polyfills
                                // Adds only the specific polyfills used & required per each file across the project
                                useBuiltIns: 'usage'
                            }]
                        ]
                    }
                }
            },
            // HTML loader loads HTML content as a string into JS for Webpack
            {
                test: /\.html$/,
                include: [SourceDirectories],
                use: [{
                    loader: 'html-loader',
                    options: {minimize: true} // This minimizes the HTML content
                }]
            },
            // 1. CSS loader parses CSS files into JS resolving any dependencies and loading that CSS code to Webpack's chain
            // CSS Loader also supports CSS Modules specs & features such as local/global scope, values and composing/imports
            // 2. Mini CSS Extract plugin's loader extracts CSS from JS files into separated CSS files
            // 3. Style loader loads all of the previously processed CSS code as style tags to DOM
            {
                test: /\.css$/,
                include: [SourceDirectories],
                use: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader']
            },
            // File loader loads any image import/require or URL to Webpack and emits the file to the proper output path
            {
                test: /\.(png|svg|jpg|gif)$/,
                include: [SourceDirectories],
                use: [{
                    loader: 'file-loader',
                    options: {name: 'assets/[folder]/[name].[contenthash].[ext]', publicPath: '/'}
                }]
            },
            // File loader loads any font import/require or URL to Webpack and emits the file to the proper output path
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                include: [SourceDirectories],
                use: [{
                    loader:'file-loader',
                    options: {name: 'assets/[folder]/[name].[contenthash].[ext]', publicPath: '/'}
                }]
            }
        ]
    },
    // Plugins, unlike loaders, operate across larger chunks of code
    plugins: [
        // Invoking before building up in order to delete all of the previously generated files
        new CleanWebpackPlugin(),
        // Will parse HTML template and render final entry file with the proper scripts and styling links tags injected
        new HtmlWebpackPlugin({
            template: Path.resolve(__dirname, 'src/index.html'),
            filename: 'index.html',
            //hash: true // This will enforce a hash param appended to the assets URLs
        }),
        // Replacing the original 'script' & 'link' HTML tags with the automatically generated bundles
        // (Except the ones identified with 'data-env-vars' attrib for special cases [i.e. Globals definition])
        new HtmlReplaceWebpackPlugin([
            {
                pattern: /(?<!\;)<\/?(script|link)(?!\sdata-env-vars)(\s?[\w\d\/\?\#\-\=(\"|\')\.]+)*>?/g,
                replacement: function (){ return ''; }
            }
        ]),
        // Will extract CSS from any source and generate proper bundles or chunks
        new MiniCssExtractPlugin({
            filename: `${PackInfo.name}.[name].[contenthash].css`,
            chunkFilename: `app/[name]/${PackInfo.name}.[name].[contenthash].chunk.css` // Sync/Async loaded CSS chunks
        }),
        // This will cause hashes to be based on relative paths of the original modules
        // generating a 4-chars string as the module ID which is recommended specially for Prod bundles
        new Webpack.HashedModuleIdsPlugin(),
        // After bundling all the dependencies up, this will create the Webpack's manifest file
        new ManifestPlugin({
            fileName: `${PackInfo.name}.manifest.json`
        }),
        // Creating an interactive treemap visualization of all of the bundles' contents
        new BundleAnalyzerPlugin({
            analyzerMode: 'static', // Generating an HTML file containing the treemap
            openAnalyzer: false, // Preventing the browser's automatic opening
            reportFilename: `${Path.resolve(__dirname, 'build')}/bundle-analyzer/index.html` // Path to file in output folder
        })
    ]
};