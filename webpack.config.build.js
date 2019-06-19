// Specific config file for production bundles

const merge = require('webpack-merge'); // Handles the config files merging process
const common = require('./webpack.config.common.js'); // The basic config from common config file

// Merging the basic shared config from the common config file with this one
module.exports = merge(common, {
    // Enabling Dev-Tools in browser to access SourceMap files in order to see original code before transpilation
    devtool: 'source-map', // Full SourceMap file is emitted and linked as a comment from bundle file
    mode: 'production', // Activating built-in optimizations according to environment
});