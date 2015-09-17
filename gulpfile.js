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
  appcache: 'src/*.nunjucks.appcache',
  build_karma_conf_script: 'scripts/build-js-components-deps-from-js-files.sh',
  cesium: 'src/lib/Cesium/**/*',
  components: 'src/components/**/*.js',
  config: 'config/' + cliOptions.portal + '-dev.toml',
  css: ['src/**/*.css'],
  font: ['src/**/*.eot', 'src/**/*.otf', 'src/**/*.svg', 'src/**/*.ttf', 'src/**/*.woff'],
  index: 'src/*.nunjucks.html',
  js: ['!src/plugins/*', '!src/SigeomPlugins.nunjucks.js', 'src/**/*.js'],
  js_files: '{temp}/js-files'.replace('{temp}', tempDir),
  karma_conf_template: 'test/karma-conf.nunjucks.js',
  karma_dev_conf: 'test/karma-conf.dev.js',  // used in build-js-components-deps-from-js-files.sh
  karma_prod_conf: 'test/karma-conf.prod.js',  // used in build-js-components-deps-from-js-files.sh
  less: 'src/style/app.less',
  ol3cesium: 'src/lib/ol3cesium.js',
  partials: 'src/components/**/partials/**/*.html',
  pdfmakeProd: ['src/lib/pdfmake.js', 'src/lib/vfs_fonts.js'],
  plugins: 'src/plugins/*.js',
  pluginsTemplate: 'src/SigeomPlugins.nunjucks.js',
  protractor_prod_conf: 'test/protractor-conf.prod.js',
  protractor_dev_conf: 'test/protractor-conf.dev.js',
  src_js: 'src/js/**/*.js',
  template_cache_module: 'src/TemplateCacheModule.js',  // used in build-js-components-deps-from-js-files.sh
  test_deps: 'test/deps',  // used in build-js-components-deps-from-js-files.sh
  watchLess: 'src/**/*.less',
};

var dest = {
  annotated: '{temp}/annotated'.replace('{temp}', tempDir),
  closure: tempDir + '/closure-compiler',
  dev: 'dev/' + cliOptions.portal,
  lib: 'prod/{portal}'.replace('{portal}', cliOptions.portal),
  lib_cesium: 'prod/{portal}/Cesium'.replace('{portal}', cliOptions.portal),
  lib_ie: 'prod/{portal}/lib/IE'.replace('{portal}', cliOptions.portal),
  pluginsFile: 'src/js',
  prod: 'prod/' + cliOptions.portal,
  sgPlugins: 'src/js/SigeomPlugins.js',
  test: 'test',
  tmp: tempDir,
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
            'build.js'
          ],
          'clean-tmp',
          cb);
}).help = 'generate all files for production';
