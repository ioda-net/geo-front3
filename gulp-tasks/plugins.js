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
              if (config.test) {
                // If we are testing, we must enable all the modules except the
                // one that exists to check the behaviour with unactivated
                // modules.
                plugins.activatedPlugins = [];
                plugins.availablePlugins.forEach(function (plugin) {
                  if (plugin !== 'notActivated') {
                    plugins.activatedPlugins.push(plugin);
                  }
                });
              } else {
                plugins.activatedPlugins = config.activatedPlugins;
              }

              return plugins;
            }))
            .pipe(nunjucksRender())
            .pipe(extReplace('.js', '.nunjucks.html'))
            .pipe(gulp.dest(dest.pluginsFile));
  });

  function getPlugins() {
    var plugins = {
      availablePlugins: [],
      plugins: {}
    };

    glob.sync(src.plugins).forEach(function (pluginPath) {
      var pluginName = path.basename(pluginPath, '.js');
      var plugin = fs.readFileSync(pluginPath).toString();
      plugins.plugins[pluginName] = plugin;
      plugins.availablePlugins.push(pluginName);
    });

    return plugins;
  }
}


module.exports = load;
