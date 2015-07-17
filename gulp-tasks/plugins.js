var fs = require('fs');
var glob = require('glob');
var gulp = require('gulp');
var extReplace = require('gulp-ext-replace');
var data = require('gulp-data');
var path = require('path');
var nunjucksRender = require('./nunjucks');

function load(src, dest, config) {
  gulp.task('plugins', function () {
    var plugins = getPlugins();

    return gulp.src(src.pluginsTemplate)
            .pipe(data(function () {
              plugins.activatedPlugins = config.activatedPlugins;

              return plugins;
            }))
            .pipe(nunjucksRender())
            .pipe(extReplace('.js', '.nunjucks.html'))
            .pipe(gulp.dest(dest.pluginsFile));
  });

  function getPlugins() {
    var plugins = {
      availablePlugins: {}
    };

    glob.sync(src.plugins).forEach(function (pluginPath) {
      var pluginName = path.basename(pluginPath, '.js');
      var plugin = fs.readFileSync(pluginPath).toString();
      plugins.availablePlugins[pluginName] = plugin;
    });

    return plugins;
  }
}


module.exports = load;
