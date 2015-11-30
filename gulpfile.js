'use strict';

var fs = require('fs');
var gulp = require('gulp');
var ghelp = require('gulp-showhelp');
var watch = require('gulp-watch');
var minimist = require('minimist'); // argv parser
var runSequence = require('run-sequence');
var utils = require('./gulp-tasks/utils');


// Define global variables
var config = JSON.parse(fs.readFileSync('/dev/stdin').toString());
var tempDir;
if (config.prod) {
  tempDir = utils.createTmpDir();
}

var src = config.src.geo_front3;
src.js_files = src.js_files.replace('{temp}', tempDir);

var dest = config.dest.geo_front3;
dest.output = config.dest.relative_output;
dest.tmp = tempDir;
dest.annotated = dest.annotated.replace('{temp}', tempDir);
dest.closure = dest.closure.replace('{temp}', tempDir);


// Load our custom gulp tasks in the global namespace and pass them
// configuration variables
require('./gulp-tasks/build')(src, dest, config);
require('./gulp-tasks/clean')(src, dest, config);
require('./gulp-tasks/closure')(src, dest, config);
require('./gulp-tasks/copy')(src, dest, config);
require('./gulp-tasks/plugins')(src, dest, config);
require('./gulp-tasks/site')(src, dest, config);
require('./gulp-tasks/test')(src, dest, config);


// Define small tasks
gulp.task('default', ['help']);


gulp.task('help', function () {
  ghelp.show(ghelp.taskNames().sort());
}).help = 'shows this help message.';


gulp.task('dev', function () {
  runSequence('plugins',
  [
    'app.css',
    'copy-js',
    'copy-css',
    'copy-partials',
    'copy-fonts',
    'copy-checker'
  ]
  // Failsafe method fix buggy generated deps
  ,'deps.js'
  );
}).help = 'generate all files for development';


gulp.task('watch', ['dev'], function () {
  watch([src.index], function () {
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

  watch([src.plugins, src.pluginsTemplate], function () {
    runSequence('plugins', 'deps.js');
  });

  watch(src.watchLess, function () {
    gulp.start('app.css');
  });

  // Relaunch dev task after a clean done by another instance.
  watch(dest.output, {events: ['unlinkDir'], base: dest.output}, function () {
    gulp.start('dev');
  });
}).help = 'watch for changes in the development files and launch tasks impacted by the update';


gulp.task('prod', function (cb) {
  runSequence(
          'plugins',
          [
            'app.css',
            'copy-fonts',
            'copy-cesium',
            'copy-css',
            'copy-checker',
            'copy-IE',
            'copy-pdfmake-prod',
            'appcache',
            'build.js'
          ],
          'clean-tmp',
          cb);
}).help = 'generate all files for production';
