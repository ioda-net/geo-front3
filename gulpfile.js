/* global require, __dirname */

'use strict';

var gulp = require('gulp');
var karma = require('karma').server;
var del = require('del');

gulp.task('test', function (cb) {
    karma.start({
        configFile: __dirname + '/test/karma-conf-dev.js',
        singleRun: true
    }, cb);
});

gulp.task('clean', function (cb) {
    del([
        'src/deps.js',
        'src/style/app.css',
        'src/TemplateCacheModule.js'
    ], cb);
});

gulp.task('cleanall', function (cb) {
    del([
        'node_modules'
    ]);
});