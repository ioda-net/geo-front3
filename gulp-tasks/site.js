var extend = require('extend');
var gulp = require('gulp');
var extReplace = require('gulp-ext-replace');
var data = require('gulp-data');
var gulpif = require('gulp-if');
var less = require('gulp-less');
var rename = require('gulp-rename');
var LessPluginCleanCSS = require('less-plugin-clean-css');
var cleancss = new LessPluginCleanCSS({advanced: true});
var nunjucksRender = require('./nunjucks');


function load (src, dest, config) {
  gulp.task('index.html', function (cb) {
    var indexConfig = extend({}, config);
    indexConfig.prod = config.prod;

    config.devices.forEach(function (device) {
      gulp.src(src.index)
              .pipe(data(function () {
                indexConfig.device = device;
                return indexConfig;
              }))
              .pipe(nunjucksRender())
              .pipe(extReplace(''))
              .pipe(rename(device + '.html'))
              .pipe(gulpif(config.prod,
                      gulp.dest(dest.prod),
                      gulp.dest(dest.dev)
                      ));
    });

    cb();
  });


  gulp.task('app.css', function () {
    var lessOptions = {
      relativeUrls: true
    };
    if (config.prod) {
      lessOptions.plugins = [cleancss];
    }

    return gulp.src(src.less)
            .pipe(less(lessOptions))
            .pipe(gulpif(config.prod,
                    gulp.dest(dest.prod + '/style'),
                    gulp.dest(dest.dev + '/style')
                    ));
  });


  gulp.task('appcache', function () {
    var appcacheConfig = extend({}, config);
    config.version = new Date().getTime();

    return gulp.src('src/*.nunjucks.appcache')
            .pipe(data(function () {
              return appcacheConfig;
            }))
            .pipe(nunjucksRender())
            .pipe(extReplace('.appcache', '.nunjucks.html'))
            .pipe(gulp.dest(dest.prod));
  });
}


module.exports = load;
