/* global require, __dirname, process */

'use strict';

// Gulp plugins
var gulp = require('gulp');
var concat = require('gulp-concat');
var data = require('gulp-data');
var eslint = require('gulp-eslint');  // Linter
var extReplace = require('gulp-ext-replace');
var gulpif = require('gulp-if');
var less = require('gulp-less');
var ngAnnotate = require('gulp-ng-annotate');  // Add annotation to angular files so they can be minified.
var nunjucksRender = require('gulp-nunjucks-render');  // Templating engine
var rename = require('gulp-rename');
var renameRegex = require('gulp-regex-rename');
var run = require('gulp-run');  // Run system commands
var ghelp = require('gulp-showhelp');
var watch = require('gulp-watch');

// To load and manipulate configuration
var extend = require('extend'); // Allow to clone a JS object. Used to modify the config locally.
var fs = require('fs');
var ini = require('ini');

// For tests
var karma = require('karma').server;

// Minifiers
var LessPluginCleanCSS = require('less-plugin-clean-css');
var cleancss = new LessPluginCleanCSS({advanced: true});

// Various
var del = require('del');
var merge = require('merge-stream'); // Used to avoid temporary files
var path = require('path');
var runSequence = require('run-sequence');
var geoGulpUtils = require('./scripts/geo-gulp-utils');


// Change nunjucks variable delimiters to avoid conflict with angular
nunjucksRender.nunjucks.configure({
  tags: {
    variableStart: '${',
    variableEnd: '}'
  },
  watch: false
});


var config = null;


gulp.task('default', ['help']);


gulp.task('help', function () {
  ghelp.show(ghelp.taskNames().sort());
}).help = 'shows this help message.';


gulp.task('test', function (cb) {
  runSequence(['build-karma-conf-from-template', 'app-whitespace.js'], 'launch-test', cb);
}).help = {
  '': 'Launch tests with karam.',
  '--prod': 'If given, launch tests against production file.'
};


gulp.task('launch-test', function (cb) {
  var configFile;
  if (process.argv[3] && process.argv[3].match(/prod/)) {
    configFile = 'test/karma-conf.prod.js';
  } else {
    configFile = 'test/karma-conf.dev.js';
  }

  karma.start({
    configFile: configFile,
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


// Cache partials so they can be used in karma
gulp.task('app-whitespace.js', ['js-files'], function () {
  var jsFiles = geoGulpUtils.getJsFiles();
  var cmd = geoGulpUtils.formatArgvOpts([
    'closure-compiler',
    jsFiles,
    '--compilation_level WHITESPACE_ONLY',
    '--formatting PRETTY_PRINT',
    '--js_output_file',
    'test/app-whitespace.js'
  ]);

  if (fs.existsSync('test/app-whitespace.js')) {
    return run('echo "test/app-whitespace.js already exists"').exec();
  } else {
    return run(cmd,
            {
              verbosity: 0
            }).exec();
  }
});


gulp.task('translate', function () {
  var cmd = geoGulpUtils.formatArgvOpts([
    'python3',
    'scripts/translation2json.py',
    'src/locales/translations.csv',
    'src/locales/'
  ]);

  return run(cmd).exec();
}).help = 'launch the translation script';


gulp.task('clean', function (cb) {
  del([
    'src/deps.js',
    'src/style/app.css',
    'test/app-whitespace.js',
    'test/karma-conf.dev.js',
    'test/karma-conf.prod.js',
    'prd'
  ], cb);
}).help = 'remove generated files.';


gulp.task('cleanall', ['clean'], function (cb) {
  del([
    'node_modules'
  ], cb);
}).help = 'clean and remove node modules.';


gulp.task('lint', function () {
  return gulp.src('src/components/**/*.js')
          .pipe(eslint())
          .pipe(eslint.format());
}).help = 'run the eslint javacript linter.';


gulp.task('gslint', function () {
  var cmd = geoGulpUtils.formatArgvOpts([
    'gjslint',
    '-r',
    'src/components',
    'src/js',
    '--jslint_error=all'
  ]);

  return run(cmd).exec();
}).help = 'run the javascript linter used by swisstopo.';


gulp.task('dev', function (cb) {
  runSequence(
          'load-dev-conf',
          [
            'index.html',
            'app.css',
            'deps.js'
          ],
          cb);
}).help = 'generate all files for development';


gulp.task('load-dev-conf', function (cb) {
  config = ini.parse(fs.readFileSync('./config-dev.ini', 'utf-8'));
  cb();
});


gulp.task('index.html', function (cb) {
  // This task is common to dev and prod and requires configuration. If a configuration file is
  // loaded, we use it. If it is not, we load the dev config.
  if (config === null) {
    gulp.start('load-dev-conf');
  }

  var indexConfig = extend({}, config['default']);

  config.devices.forEach(function (device) {
    gulp.src('src/*.nunjucks.html')
            .pipe(data(function () {
              indexConfig.device = device;
              return indexConfig;
            }))
            .pipe(nunjucksRender())
            .pipe(extReplace(''))
            .pipe(rename(device + '.html'))
            .pipe(gulpif(config.prod,
                    gulp.dest('prd'),
                    gulp.dest('src')
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

  return gulp.src('src/style/app.less')
          .pipe(less(lessOptions))
          .pipe(gulpif(config.prod,
                  gulp.dest('prd/style'),
                  gulp.dest('src/style')
                  ));
});


gulp.task('deps.js', function () {
  var cmd = geoGulpUtils.formatArgvOpts([
    'python',
    'node_modules/google-closure-library/closure/bin/build/depswriter.py',
    '--root_with_prefix="src/components components"',
    '--root_with_prefix="src/js js"',
    '--output_file=src/deps.js'
  ]);

  return run(cmd).exec();
});


gulp.task('watch', function (cb) {
  watch(['src/*.nunjucks.html', 'config-dev.ini'], function () {
    gulp.start('index.html');
  });

  watch('src/style/app.less', function () {
    gulp.start('app.css');
  });

  watch(['src/components/**/*.js', 'src/js/**/*.js', 'js/**/*.js'], function () {
    gulp.start('deps.js');
  });
}).help = 'watch for changes in the development files and launch tasks impacted by the update';


gulp.task('prod', function (cb) {
  runSequence(
          'load-prod-conf',
          [
            'index.html',
            'app.css',
            'copy-images',
            'copy-fonts',
            'copy-locales',
            'copy-checker',
            'appcache',
            'build.js',
            'app-whitespace.js'
          ],
          'clean-tmp',
          cb);
}).help = 'generate all files for production';


gulp.task('load-prod-conf', function (cb) {
  config = ini.parse(fs.readFileSync('./config-prod.ini', 'utf-8'));
  cb();
});


gulp.task('copy-images', function () {
  return gulp.src('src/img/**/*')
          .pipe(gulp.dest('prd/img'));
});


gulp.task('copy-fonts', function () {
  return gulp.src('src/style/font-awesome-3.2.1/font/*')
          .pipe(gulp.dest('prd/style/font-awesome-3.2.1/font'));
});


gulp.task('copy-locales', function () {
  return gulp.src('src/locales/*.json')
          .pipe(gulp.dest('prd/locales'));
});


gulp.task('copy-checker', function () {
  return gulp.src('src/checker')
          .pipe(gulp.dest('prd'));
});


gulp.task('appcache', ['load-prod-conf'], function () {
  var appcacheConfig = extend({}, config['default']);
  config['default'].version = new Date().getTime();

  return gulp.src('src/*.nunjucks.appcache')
          .pipe(data(function () {
            return appcacheConfig['default'];
          }))
          .pipe(nunjucksRender())
          .pipe(extReplace('.appcache', '.nunjucks.html'))
          .pipe(gulp.dest('prd'));
});


gulp.task('build.js', ['closure-compiler'], function () {
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
    '/tmp/geo-front3/closure-compiler'
  ])
          .pipe(concat('build.js'))
          .pipe(gulp.dest('prd/lib'));
  ;
});


gulp.task('closure-compiler', ['js-files'], function () {
  var jsFiles = geoGulpUtils.getJsFiles();
  var cmd = geoGulpUtils.formatArgvOpts([
    'closure-compiler',
    jsFiles,
    '--compilation_level SIMPLE_OPTIMIZATIONS',
    '--jscomp_error checkVars',
    '--externs externs/ol.js',
    '--externs externs/angular.js',
    '--externs externs/jquery.js'
  ]);

  return run(cmd, {
    verbosity: 0
  }).exec()
          .pipe(gulp.dest('/tmp/geo-front3'));
});


gulp.task('js-files', ['annotate'], function () {
  var closurebuilder = geoGulpUtils.formatArgvOpts([
    'python node_modules/google-closure-library/closure/bin/build/closurebuilder.py',
    '--root=/tmp/geo-front3/annotated',
    '--root=src/lib/closure',
    '--namespace="ga"',
    '--namespace="__ga_template_cache__"',
    '--output_mode=list'
  ]);
  var removeUnusefulLine = geoGulpUtils.formatArgvOpts([
    "sed 's/^.*base\.js //'"
  ]);
  var formatFile = geoGulpUtils.formatArgvOpts([
    "sed",
    "-e ':a'",
    "-e 'N'",
    "-e '$!ba'",
    "-e 's/\\n/ --js /g'"
  ]);

  return run(closurebuilder, {silent: true}).exec()
          .pipe(run(formatFile, {silent: true}))
          .pipe(run(removeUnusefulLine, {silent: true}))
          .pipe(rename('js-files'))
          .pipe(gulp.dest('/tmp/geo-front3/'));
});


gulp.task('annotate', function () {
  // We must build the template cache before annotating the files.
  // In order to build this cache, we must map each file content to its file name. The content of
  // the file is minified with htmlMin. The templateCacheConfig will contain the mapping in its
  // partials property.
  var templateCacheConfig = {};
  var htmlMinConf = {
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: false,
    removeComments: true
  };
  var partialsGlob = path.join('src/components/**/partials/**/*.html');

  templateCacheConfig.partials = geoGulpUtils.getPartials(partialsGlob, htmlMinConf);

  var templateCache = gulp.src('src/TemplateCacheModule.nunjucks.js', {base: './'})
          .pipe(data(function () {
            return templateCacheConfig;
          }))
          .pipe(nunjucksRender())
          .pipe(extReplace('.js', '.nunjucks.html'));

  return merge(templateCache, gulp.src(['src/components/**/*.js', 'src/js/**/*.js'], {base: './'}))
          .pipe(ngAnnotate({
            add: true
          }))
          .pipe(gulp.dest('/tmp/geo-front3/annotated'));
});


gulp.task('clean-tmp', function (cb) {
  del(['/tm/geo-front3'], cb);
});