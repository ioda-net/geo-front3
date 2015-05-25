var glob = require('glob');
var fs = require('fs');

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

module.exports.getPartials = getPartials;