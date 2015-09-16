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
  boolean: 'prod',
  default: {
      portal: 'geojb',
      prod: false
  }
};
var cliOptions = minimist(process.argv.slice(2), knownCliOptions);
var config = utils.loadConf(process.argv[2], cliOptions);
var tempDir;
if (config.prod) {
  tempDir = utils.createTmpDir();
}

var src = {
  js: ['!src/plugins/*', '!src/SigeomPlugins.nunjucks.js', 'src/**/*.js'],
  cesium: 'src/lib/Cesium/**/*',
  ol3cesium: 'src/lib/ol3cesium.js',
  css: ['src/**/*.css'],
  font: ['src/**/*.eot', 'src/**/*.otf', 'src/**/*.svg', 'src/**/*.ttf', 'src/**/*.woff'],
  plugins: 'src/plugins/*.js',
  pluginsTemplate: 'src/SigeomPlugins.nunjucks.js',
  partials: 'src/components/**/*.html',
  less: 'src/style/app.less',
  watchLess: 'src/**/*.less',
  index: 'src/*.nunjucks.html',
  config: 'config/' + cliOptions.portal + '-dev.toml',
  pdfmakeProd: ['src/lib/pdfmake.js', 'src/lib/vfs_fonts.js'],
  js_files: '{temp}/js-files'.replace('{temp}', tempDir)
};

var dest = {
  annotated: '{temp}/annotated'.replace('{temp}', tempDir),
  prod: 'prod/' + cliOptions.portal,
  dev: 'dev/' + cliOptions.portal,
  pluginsFile: 'src/js',
  tmp: tempDir,
  closure: tempDir + '/closure-compiler'
};


// Load our custom gulp tasks in the global namespace and pass them
// configuration variables
require('./gulp-tasks/build')(src, dest, config);
require('./gulp-tasks/clean')(src, dest, config);
require('./gulp-tasks/closure')(src, dest, config);
require('./gulp-tasks/copy')(src, dest, config);
require('./gulp-tasks/misc')(src, dest, config);
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
    'index.html',
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
  watch(dest.dev, {events: ['unlinkDir'], base: dest.dev}, function () {
    gulp.start('dev');
  });
}).help = 'watch for changes in the development files and launch tasks impacted by the update';


gulp.task('prod', function (cb) {
  runSequence(
          'plugins',
          [
            'index.html',
            'app.css',
            'copy-fonts',
            'copy-cesium',
            'copy-css',
            'copy-checker',
            'copy-IE',
            'copy-pdfmake-prod',
            'appcache',
            'build.js',
            'app-whitespace.js'
          ],
          'clean-tmp',
          cb);
}).help = 'generate all files for production';
