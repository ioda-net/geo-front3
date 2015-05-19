'use strict';

var gulp = require('gulp');
var karma = require('karma').server;

gulp.task('test', function (done) {
  karma.start({
    configFile: __dirname + '/test/karma-conf-dev.js',
    singleRun: true
  }, done);
});