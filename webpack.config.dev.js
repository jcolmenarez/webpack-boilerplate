// Specific config file for dev-env bundles

const merge = require('webpack-merge'); // Handles the config files merging process
const common = require('./webpack.config.common.js'); // The basic config from common config file

// Merging the basic shared config from the common config file with this one
module.exports = merge(common, {
    // Enabling Dev-Tools in browser to access SourceMap files in order to see original code before transpilation
    devtool: 'eval-source-map', // Full SourceMap is added as a DataUrl to eval()
    mode: 'development', // Activating built-in optimizations according to environment
    watch: true
});