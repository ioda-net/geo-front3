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
var rename = require('gulp-rename');
var nunjucksRender = require('gulp-nunjucks-render');
var gulpif = require('gulp-if');
var run = require('gulp-run');
var less = require('gulp-less');
var LessPluginCleanCSS = require('less-plugin-clean-css');
var cleancss = new LessPluginCleanCSS({ advanced: true });
var ngAnnotate = require('gulp-ng-annotate');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var eslint = require('gulp-eslint');
var minify = require('html-minifier').minify;

nunjucksRender.nunjucks.configure({
    tags: {
        variableStart: '${',
        variableEnd: '}'
    },
    watch: false
});

var depswriter_py =
        new run.Command('python node_modules/google-closure-library/closure/bin/build/depswriter.py',
{
    silent: true
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

    var indexConfig = extend({}, config['default']);
    config['default'].prod = true;
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
        .pipe(gulp.dest('prd'));
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
	    .pipe(gulp.dest('src'))
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
                        partialContents.toString().replace(/'/g, "\\'").replace(/\n/g, ''), {
                            collapseWhitespace: true,
                            conservativeCollapse: true,
			    preserveLineBreaks: false,
			    removeComments: true
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
	    .pipe(renameRegex(/.html$/, '.js'))
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

gulp.task('deps.js', function (cb) {
   run('python node_modules/google-closure-library/closure/bin/build/depswriter.py ' +
                            '--root_with_prefix="src/components components" ' +
                            '--root_with_prefix="src/js js" ' +
                            '--output_file=src/deps.js').exec();

    cb();
});

gulp.task('app.css', function () {
    return gulp.src('src/style/app.less')
        .pipe(less({
            relativeUrls: true
        }))
  .pipe(gulp.dest('src/style'));
});

gulp.task('dev', ['deps.js', 'app.css', 'build-templates']);

gulp.task('build.js', function () {
    return gulp.src([
                'src/lib/jquery-2.0.3.min.js',
                'src/lib/bootstrap-3.3.1.min.js',
                'src/lib/moment-with-customlocales.min.js',
                'src/lib/typeahead-0.9.3.min.js',
                'src/lib/angular.min.js',
                'src/lib/proj4js-compressed.js',
                'src/lib/EPSG21781.js',
                'src/lib/EPSG2056.js',
                'src/lib/EPSG32631.js',
                'src/lib/EPSG32632.js',
                'src/lib/ol.js',
                'src/lib/angular-translate.min.js',
                'src/lib/angular-translate-loader-static-files.min.js',
                'src/lib/fastclick.min.js',
                'src/lib/localforage.min.js',
                'src/lib/filesaver.min.js'
            ]);
});

// Requires only template cache module
gulp.task('annotate', ['build-templates'], function () {
    return gulp.src(['src/components/**/*.js', 'src/js/**/*.js', 'prd/TemplateCacheModule.js'], {base: './'})
	.pipe(ngAnnotate({
	    add: true
	}))
	.pipe(renameRegex(/^prd\/TemplateCacheModule.js$/, 'src/TemplateCacheModule.js'))
	.pipe(gulp.dest('.build-artefacts/annotated'));
});

gulp.task('js-files', ['annotate'], function (cb) {
    return run('python node_modules/google-closure-library/closure/bin/build/closurebuilder.py ' +
	'--root=.build-artefacts/annotated ' +
	'--root=src/lib/closure ' +
       '--namespace="ga" ' +
	'--namespace="__ga_template_cache__" ' +
	'--output_mode=list ', {silent: true}).exec()
	.pipe(run("sed -e ':a' -e 'N' -e '$!ba' -e 's/\\n/ --js /g'", {silent: true}))
	.pipe(run("sed 's/^.*base\.js //'", {silent: true}))
	.pipe(rename('js-files'))
	.pipe(gulp.dest('.build-artefacts'));
})

gulp.task('app.js', ['js-files'], function (cb) {
    var jsFiles = fs.readFileSync('.build-artefacts/js-files')
	.toString();

    run('closure-compiler ' +
	jsFiles.replace('\n', ' ')  +
	'--compilation_level SIMPLE_OPTIMIZATIONS ' +
	'--jscomp_error checkVars ' +
	'--externs externs/ol.js ' +
	'--externs .build-artefacts/externs/angular.js ' +
	'--externs .build-artefacts/externs/jquery.js ' +
	'--js_output_file .build-artefacts/app.js',
	{
	    verbosity: 0
       }).exec();

    cb();
});

gulp.task('build.js', ['app.js'], function () {
    return gulp.src([
	'src/lib/jquery-2.0.3.min.js',
	'src/lib/bootstrap-3.3.1.min.js',
	'src/lib/moment-with-customlocales.min.js',
	'src/lib/typeahead-0.9.3.min.js src/lib/angular.min.js',
	'src/lib/proj4js-compressed.js',
	'src/lib/EPSG*.js',
	'src/lib/ol.js',
	'src/lib/angular-translate.min.js',
	'src/lib/angular-translate-loader-static-files.min.js',
	'src/lib/fastclick.min.js',
	'src/lib/localforage.min.js',
	'src/lib/filesaver.min.js',
	'.build-artefacts/app.js'
    ])
	.pipe(concat('build.js'))
	.pipe(replace(/^\/\/[#,@] sourceMappingURL=.*/g, ''))
	.pipe(gulp.dest('prd/lib'));
})

gulp.task('prd-app.css', function () {
    return gulp.src([
	'src/style/app.less',
    ])
    .pipe(less({
	relativeUrls: true,
	plugins: [cleancss],
    }))
    .pipe(gulp.dest('prd/style'));
});

gulp.task('prd-img', function () {
    return gulp.src('src/img/**/*')
	.pipe(gulp.dest('prd/img'));
});

gulp.task('prd-font', function () {
    return gulp.src('src/style/font-awesome-3.2.1/font/*')
	.pipe(gulp.dest('prd/style/font-awesome-3.2.1/font'));
});

gulp.task('prd-locales', function () {
    return gulp.src('src/locales/*.json')
	.pipe(gulp.dest('prd/locales'));
})

gulp.task('checker', function () {
    return gulp.src('src/checker')
	.pipe(gulp.dest('prd'));
});

gulp.task('lint', function () {
    return gulp.src('src/components/**/*.js')
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task('gslint', function () {
    return run('gjslint -r src/components src/js --jslint_error=all').exec();
})

// Cache partials so they can be used in karma
gulp.task('app-whitespace.js', function () {
    var jsFiles = fs.readFileSync('.build-artefacts/js-files')
	.toString();

    run('closure-compiler ' +
	jsFiles.replace('\n', ' ')  +
	'--compilation_level WHITESPACE_ONLY ' +
	'--formatting PRETTY_PRINT ' +
	'--js_output_file .build-artefacts/app-whitespace.js',
	{
	    verbosity: 0
	}).exec();

    cb();
});

gulp.task('clean', function (cb) {
    del([
        'src/deps.js',
        'src/style/app.css',
        'src/TemplateCacheModule.js'
    ], cb);
});

gulp.task('cleanall', ['clean'], function (cb) {
    del([
        'node_modules'
    ], cb);
});
