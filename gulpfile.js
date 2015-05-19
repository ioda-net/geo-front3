/* global require, __dirname */

'use strict';

var gulp = require('gulp');
var karma = require('karma').server;
var del = require('del');
var fs = require('fs');
var ini = require('ini');
var data = require('gulp-data');
var renameRegex = require('gulp-regex-rename');
var nunjucksRender = require('gulp-nunjucks-render');

nunjucksRender.nunjucks.configure({
    tags: {
        variableStart: '${',
        variableEnd: '}'
    },
    watch: false
});

var config = ini.parse(fs.readFileSync('./config-dev.ini', 'utf-8'));

gulp.task('test', function (cb) {
    karma.start({
        configFile: __dirname + '/test/karma-conf-dev.js',
        singleRun: true
    }, cb);
});

gulp.task('build-html', function (cb){
    config.devices.forEach(function (device) {
            gulp.src('src/*.nunjucks.html')
        .pipe(data(function() {
            config['default'].device = device;
            return config['default'];
        }))
        .pipe(nunjucksRender())
        .pipe(renameRegex(/\.nunjucks/, ''))
        .pipe(renameRegex(/index/, device))
        .pipe(renameRegex(/desktop/, 'index'))
        .pipe(gulp.dest('src'));
    });
    cb();
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