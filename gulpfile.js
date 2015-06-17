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
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');

// To load and manipulate configuration
var extend = require('extend'); // Allow to clone a JS object. Used to modify the config locally.
var fs = require('fs');
var toml = require('toml');

// For tests
var karma = require('karma').server;

// Minifiers
var LessPluginCleanCSS = require('less-plugin-clean-css');
var cleancss = new LessPluginCleanCSS({advanced: true});

// Various
var del = require('del');
var merge = require('merge-stream'); // Used to avoid temporary files
var minimist = require('minimist');
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
var testConfig = null;
var knownCliOptions = {
  string: 'portal',
  default: {portal: 'geojb'}
};
var cliOptions = minimist(process.argv.slice(2), knownCliOptions);
var prodDestDir = 'prod/' + cliOptions.portal;


gulp.task('default', ['help']);


gulp.task('help', function () {
  ghelp.show(ghelp.taskNames().sort());
}).help = 'shows this help message.';


gulp.task('test', function (cb) {
  testConfig = 'test/karma-conf.dev.js';
  runSequence('launch-test', cb);
}).help = 'Launch tests with karma.';


gulp.task('test-prod', function (cb) {
  testConfig = 'test/karma-conf.prod.js';
  runSequence('launch-test', cb);
}).help = 'Lanuch test against prod with karma';


gulp.task('launch-test', ['build-karma-conf-from-template', 'app-whitespace.js'], function (cb) {
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


// Cache partials so they can be used in karma
gulp.task('app-whitespace.js', ['js-files'], function () {
  var jsFiles = geoGulpUtils.getJsFiles();
  var cmd = geoGulpUtils.formatCmd([
    'java -jar node_modules/google-closure-compiler/compiler.jar',
    jsFiles,
    '--jscomp_error checkVars',
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
  var cmd = geoGulpUtils.formatCmd([
    'python3',
    'scripts/translation2json.py',
    '--gspread 1F3R46w4PODfsbJq7jd79sapy3B7TXhQcYM7SEaccOA0',
    '--key re3-translations.json',
    '--files src/locales/translations.csv',
    '--output-folder src/locales/'
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
    'prod'
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
  var cmd = geoGulpUtils.formatCmd([
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
  var filename = path.join('./config', cliOptions.portal + '-dev.toml');
  config = toml.parse(fs.readFileSync(filename, 'utf-8'));
  config.prod = false;
  cb();
});


gulp.task('index.html', function (cb) {
  // This task is common to dev and prod and requires configuration. If a configuration file is
  // loaded, we use it. If it is not, we load the dev config.
  if (config === null) {
    gulp.start('load-dev-conf');
  }

  var indexConfig = extend({}, config);
  indexConfig.prod = config.prod;

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
                    gulp.dest(prodDestDir),
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
                  gulp.dest(prodDestDir + '/style'),
                  gulp.dest('src/style')
                  ));
});


gulp.task('deps.js', function () {
  var cmd = geoGulpUtils.formatCmd([
    'python',
    'node_modules/google-closure-library/closure/bin/build/depswriter.py',
    '--root_with_prefix="src/components components"',
    '--root_with_prefix="src/js js"',
    '--output_file=src/deps.js'
  ]);

  return run(cmd).exec();
});


gulp.task('watch', function (cb) {
  watch(['src/*.nunjucks.html', 'config-dev.toml'], function () {
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
            'copy-IE',
            'appcache',
            'build.js',
            'app-whitespace.js'
          ],
          'clean-tmp',
          cb);
}).help = 'generate all files for production';


gulp.task('load-prod-conf', function (cb) {
  var filename = path.join('./config', cliOptions.portal + '-prod.toml');
  config = toml.parse(fs.readFileSync(filename, 'utf-8'));
  config.prod = true;
  cb();
});


gulp.task('copy-images', function () {
  return gulp.src('src/img/**/*')
          .pipe(gulp.dest(prodDestDir + '/img'));
});


gulp.task('copy-fonts', function () {
  return gulp.src('src/style/font-awesome-3.2.1/font/*')
          .pipe(gulp.dest(prodDestDir + '/style/font-awesome-3.2.1/font'));
});


gulp.task('copy-locales', function () {
  return gulp.src('src/locales/*.json')
          .pipe(gulp.dest(prodDestDir + '/locales'));
});


gulp.task('copy-checker', function () {
  return gulp.src('src/checker')
          .pipe(gulp.dest(prodDestDir));
});


gulp.task('copy-IE', function () {
  return gulp.src('src/lib/IE/*.js')
          .pipe(gulp.dest(prodDestDir + '/lib'));
});


gulp.task('appcache', ['load-prod-conf'], function () {
  var appcacheConfig = extend({}, config);
  config.version = new Date().getTime();

  return gulp.src('src/*.nunjucks.appcache')
          .pipe(data(function () {
            return appcacheConfig;
          }))
          .pipe(nunjucksRender())
          .pipe(extReplace('.appcache', '.nunjucks.html'))
          .pipe(gulp.dest(prodDestDir));
});


gulp.task('build.js', ['closure-compiler'], function () {
  return gulp.src([
    'src/lib/jquery-2.0.3.js',
    'src/lib/bootstrap-3.3.1.js',
    'src/lib/moment-with-customlocales.js',
    'src/lib/typeahead-0.9.3.js',
    'src/lib/angular.js',
    'src/lib/proj4js-compressed.js',
    'src/lib/EPSG21781.js',
    'src/lib/EPSG2056.js',
    'src/lib/EPSG32631.js',
    'src/lib/EPSG32632.js',
    'src/lib/ol.js',
    'src/lib/angular-translate.js',
    'src/lib/angular-translate-loader-static-files.js',
    'src/lib/fastclick.min.js',
    'src/lib/localforage.min.js',
    'src/lib/filesaver.min.js',
    '/tmp/geo-front3/closure-compiler'
  ])
          .pipe(uglify())
          .pipe(concat('build.js'))
          .pipe(gulp.dest(prodDestDir + '/lib'));
  ;
});


gulp.task('closure-compiler', ['js-files'], function () {
  var jsFiles = geoGulpUtils.getJsFiles();
  var cmd = geoGulpUtils.formatCmd([
    'java -jar node_modules/google-closure-compiler/compiler.jar',
    jsFiles,
    '--jscomp_error checkVars',
    '--compilation_level SIMPLE',
    '--externs externs/angular.js',
    '--externs externs/jquery.js',
    '--externs externs/ol.js',
    '--js_output_file /tmp/geo-front3/closure-compiler'
  ]);

  return run(cmd, {
    verbosity: 0
  }).exec()
          .pipe(gulp.dest('/tmp/geo-front3'));
});


gulp.task('js-files', ['annotate'], function () {
  var closurebuilder = geoGulpUtils.formatCmd([
    'python node_modules/google-closure-library/closure/bin/build/closurebuilder.py',
    '--root=/tmp/geo-front3/annotated',
    '--root=node_modules/google-closure-library',
    '--namespace="ga"',
    '--namespace="__ga_template_cache__"',
    '--output_mode=list'
  ]);
  var formatFile = geoGulpUtils.formatCmd([
    "sed",
    "-e ':a'",
    "-e 'N'",
    "-e '$!ba'",
    "-e 's/\\n/ --js /g'"
  ]);
  var appendJsFirstFile = geoGulpUtils.formatCmd([
      "sed",
      "-r 's/(.*)/ --js \\1/g'"
  ]);

  return run(closurebuilder, {silent: true}).exec()
          .pipe(run(formatFile, {silent: true}))
          .pipe(run(appendJsFirstFile, {silent: true}))
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
  del(['/tmp/geo-front3'], {force: true}, cb);
});