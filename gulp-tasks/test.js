var gulp = require('gulp');
var extReplace = require('gulp-ext-replace');
var gulpif = require('gulp-if');
var data = require('gulp-data');
var karma = require('karma').server;
var nunjucksRender = require('./nunjucks');
var runSequence = require('run-sequence');

var testConfig = null;


function load(src, dest, config) {
  gulp.task('test', function (cb) {
    testConfig = 'test/karma-conf.dev.js';
    config.test = true;
    runSequence('plugins', 'launch-test', cb);
  }).help = 'Launch tests with karma.';


  gulp.task('test-prod', ['prod'], function (cb) {
    testConfig = 'test/karma-conf.prod.js';
    runSequence('plugins', 'launch-test', cb);
  }).help = 'Lanuch test against prod with karma';


  gulp.task('launch-test', [
    'build-karma-conf-from-template',
    'app-whitespace.js'
  ], function (cb) {
    karma.start({
      configFile: testConfig,
      singleRun: true
    }, cb);
  });


  gulp.task('build-karma-conf-from-template', function (cb) {
    [true, false].forEach(function (prod) {
      gulp.src('test/karma-conf.nunjucks.js')
              .pipe(data(function () {
                return {prod: prod};
              }))
              .pipe(nunjucksRender())
              .pipe(gulpif(prod,
                      extReplace('prod.js', '.nunjucks.html'),
                      extReplace('dev.js', '.nunjucks.html')
                      ))
              .pipe(gulp.dest('test'));
    });

    cb();
  });
}


module.exports = load;
