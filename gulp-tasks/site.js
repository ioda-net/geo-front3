var extend = require('extend');
var gulp = require('gulp');
var extReplace = require('gulp-ext-replace');
var data = require('gulp-data');
var nunjucksRender = require('./nunjucks');
var less = require('gulp-less');
var LessPluginCleanCSS = require('less-plugin-clean-css');
var cleancss = new LessPluginCleanCSS({advanced: true});


function load (src, dest, config) {
  gulp.task('app.css', function () {
    var lessOptions = {
      relativeUrls: true
    };
    if (config.prod) {
      lessOptions.plugins = [cleancss];
    }

    return gulp.src(src.less)
            .pipe(less(lessOptions))
            .pipe(gulp.dest(dest.style));
  });


  gulp.task('appcache', function () {
    var appcacheConfig = extend({}, config);
    config.version = new Date().getTime();

    return gulp.src(src.appcache)
            .pipe(data(function () {
              return appcacheConfig;
            }))
            .pipe(nunjucksRender())
            .pipe(extReplace('.appcache', '.nunjucks.html'))
            .pipe(gulp.dest(dest.output));
  });
}


module.exports = load;
