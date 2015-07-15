'use strict';

var gulp = require('gulp');
var ghelp = require('gulp-showhelp');
var watch = require('gulp-watch');
var minimist = require('minimist'); // argv parser
var runSequence = require('run-sequence');
var utils = require('./gulp-tasks/utils');


// Define global variables
var knownCliOptions = {
  string: 'portal',
  default: {portal: 'geojb'}
};
var cliOptions = minimist(process.argv.slice(2), knownCliOptions);
var config = utils.loadConf(process.argv[2], cliOptions);

var src = {
  img: 'src/img/**/*',
  js: 'src/**/*.js',
  partials: 'src/components/**/*.html',
  less: 'src/style/app.less',
  index: 'src/*.nunjucks.html',
  config: 'config/' + cliOptions.portal + '-dev.toml'
};

var dest = {
  prod: 'prod/' + cliOptions.portal,
  dev: 'dev/' + cliOptions.portal
};


// Load our custom gulp tasks in the global namespace and pass them
// configuration variables
require('./gulp-tasks/build')(src, dest, config);
require('./gulp-tasks/clean')(src, dest, config);
require('./gulp-tasks/closure')(src, dest, config);
require('./gulp-tasks/copy')(src, dest, config);
require('./gulp-tasks/misc')(src, dest, config);
require('./gulp-tasks/site')(src, dest, config);
require('./gulp-tasks/test')(src, dest, config);


// Define small tasks
gulp.task('default', ['help']);


gulp.task('help', function () {
  ghelp.show(ghelp.taskNames().sort());
}).help = 'shows this help message.';


gulp.task('dev', [
    'index.html',
    'app.css',
    'deps.js',
    'copy-js',
    'copy-partials',
    'copy-images',
    'copy-fonts',
    'copy-locales',
    'copy-checker'
]).help = 'generate all files for development';


gulp.task('watch', ['dev'], function () {
  watch([src.index, src.config], function () {
    gulp.start('index.html');
  });

  watch(src.less, function () {
    gulp.start('app.css');
  });

  watch(src.js, function () {
    gulp.start('copy-js');
    gulp.start('deps.js');
  });

  watch(src.partials, function () {
    gulp.start('copy-partials');
  });

  watch(src.img, function () {
    gulp.start('copy-images');
  });
}).help = 'watch for changes in the development files and launch tasks impacted by the update';


gulp.task('prod', function (cb) {
  runSequence(
          [
            'index.html',
            'app.css',
            'copy-images',
            'copy-fonts',
            'copy-locales',
            'copy-checker',
            'copy-IE',
            'appcache',
            'build.js',
            'app-whitespace.js'
          ],
          'clean-tmp',
          cb);
}).help = 'generate all files for production';
