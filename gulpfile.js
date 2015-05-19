/* global require, __dirname */

'use strict';

var gulp = require('gulp');
var karma = require('karma').server;
var del = require('del');
var glob = require('glob');
var extend = require('extend');
var fs = require('fs');
var ini = require('ini');
var data = require('gulp-data');
var shell = require('gulp-shell');
var renameRegex = require('gulp-regex-rename');
var nunjucksRender = require('gulp-nunjucks-render');
var gulpif = require('gulp-if');
var minify = require('html-minifier').minify;

nunjucksRender.nunjucks.configure({
    tags: {
        variableStart: '${',
        variableEnd: '}'
    },
    watch: false
});

var config = ini.parse(fs.readFileSync('./config-dev.ini', 'utf-8'));
// Required by appcache
config['default'].version = new Date().getTime();

gulp.task('test', function (cb) {
    karma.start({
        configFile: __dirname + '/test/karma-conf-dev.js',
        singleRun: true
    }, cb);
});

gulp.task('build-templates', function (cb) {
    // HTML
    var indexConfig = extend({}, config['default']);
    config.devices.forEach(function (device) {
            gulp.src('src/*.nunjucks.html')
        .pipe(data(function() {
            indexConfig.device = device;
            return indexConfig;
        }))
        .pipe(nunjucksRender())
        .pipe(renameRegex(/\.nunjucks/, ''))
        .pipe(renameRegex(/index/, device))
        .pipe(renameRegex(/desktop/, 'index'))
        .pipe(gulp.dest('src'));
    });

    // HTML5 Appcache
    gulp.src([
                'src/*.nunjucks.appcache',
            ])
            .pipe(data(function() {
                return config['default'];
            }))
            .pipe(nunjucksRender())
            .pipe(renameRegex(/\.nunjucks/, ''))
            .pipe(renameRegex(/\.html$/, '.appcache'))
            .pipe(gulp.dest('prd'));

    // Template cache
    var templateCacheConfig = extend({}, config['default']);
    templateCacheConfig['partials'] = {};
    var patialNames = glob
            .sync('src/components/**/partials/**/*.html')
            .forEach(function (partialPath) {
                var partialContents = fs.readFileSync(partialPath);
                // The name of the partial in the cache is its path without src/
                var partialName = partialPath.replace(/^src\//, '')
                templateCacheConfig['partials'][partialName] = minify(
                        partialContents.toString(), {
                            collapseWhitespace: true,
                            conservativeCollapse: true
                        }
                    );
            });

    gulp.src([
                'src/TemplateCacheModule.nunjucks.js',
            ])
            .pipe(data(function() {
                return templateCacheConfig;
            }))
            .pipe(nunjucksRender())
            .pipe(renameRegex(/\.nunjucks/, ''))
            .pipe(gulp.dest('prd'));

    // Karma
    [{'prod': true}, {'prod': false}].forEach(function (prod) {
        gulp.src('test/karma-conf.nunjucks.js')
            .pipe(data(function () {
                return prod;
            }))
            .pipe(nunjucksRender())
            .pipe(renameRegex(/\.nunjucks/, ''))
            .pipe(gulpif(prod.prod,
                            renameRegex(/\.html$/, '-prod.js'),
                            renameRegex(/\.html/, '-dev.js')
            ))
            .pipe(gulp.dest('test'));
    });

    cb();
});

gulp.task('translate', shell.task([
    'python3 scripts/translation2json.py src/locales/translations.csv src/locales/',
]));

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