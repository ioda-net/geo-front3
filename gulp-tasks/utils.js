/**
 * Special files that contains utility functions.
 * @type Module glob|Module glob
 */

var glob = require('glob');
var fs = require('fs');
var mktemp = require('mktemp');
var path = require('path');
var toml = require('toml');

var htmlMinify = require('html-minifier').minify;

function getPartials(partialsGlob, htmlMinConfig) {
  var partials = {};
  var htmlMinifyConf = htmlMinConfig || {};

  // In order to build the cache, we must map the name of the partials with its minified content.
  // To do that, we use glob to find them and for each element in the resulting array, we add an
  // item to the configuration.
  glob.sync(partialsGlob)
          .forEach(function (partialPath) {
            // Simple quotes whithin the content must be escaped so javascript doesn't consider them
            // as an end of string.
            // htmlMinify doesn't remove all whitespaces, so we help it.
            var partialContents = fs.readFileSync(partialPath)
                    .toString()
                    .replace(/'/g, "\\'")
                    .replace(/\n/g, '');

            // The name of the partial in the cache must be its path without src/
            var partialName = partialPath.replace(/^src\//, '');

            partials[partialName] = htmlMinify(partialContents, htmlMinifyConf);
          });

  return partials;
}

function getJsFiles(src) {
  return fs.readFileSync(src.js_files)
          .toString()
          .replace('\n', ' ');
}


/**
 * Return an array containing all argument passed to the task. If an array is given, they are
 * concatenated.
 */
var passArgvOpts = function (options) {
  var opts = options || [];

  return opts.concat(process.argv.slice(3));
};


/**
 * Join all element of an array with a space.
 */
var formatCmd = function (cmd) {
  return cmd.join(' ');
};


/**
 * Take an array of options, append the options passed to the command line and return the command.
 */
var formatArgvOpts = function (options) {
  var cmd = passArgvOpts(options);
  return formatCmd(cmd);
};


var loadConf = function (taskName, cliOptions) {
  var prod = false;
  if (taskName === 'prod' || cliOptions.prod) {
    prod = true;
  }
  var type = prod ? 'prod' : 'dev';
  var filename = path.join('./config', cliOptions.portal + '-' + type + '.toml');
  var config = toml.parse(fs.readFileSync(filename, 'utf-8'));
  config.prod = prod;

  return config;
};


function createTmpDir() {
  return mktemp.createDirSync('/tmp/geo-front3-XXXXXX');
}


module.exports.getPartials = getPartials;
module.exports.getJsFiles = getJsFiles;
module.exports.passArgvOpts = passArgvOpts;
module.exports.formatCmd = formatCmd;
module.exports.formatArgvOpts = formatArgvOpts;
module.exports.loadConf = loadConf;
module.exports.createTmpDir = createTmpDir;
