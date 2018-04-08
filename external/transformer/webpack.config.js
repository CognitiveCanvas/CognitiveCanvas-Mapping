const lib = require('./webpack.lib.js');
const lib_min = require('./webpack.lib.min.js');
const examples = require('./webpack.examples.js');

// merge building libraries with examples
module.exports = [lib, lib_min].concat(examples);