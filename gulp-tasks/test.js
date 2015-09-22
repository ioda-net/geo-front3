var fs = require('fs');
var gulp = require('gulp');
var run = require('gulp-run');
var extReplace = require('gulp-ext-replace');
var gulpif = require('gulp-if');
var data = require('gulp-data');
var KarmaServer = require('karma').Server;
var nunjucksRender = require('./nunjucks');
var runSequence = require('run-sequence');

var testConfig = null;


function load(src, dest, config) {
  gulp.task('test', function (cb) {
    if (config.prod) {
      testConfig = src.karma_prod_conf;
      runSequence('prod', 'launch-test', cb);
    } else {
      testConfig = src.karma_dev_conf;
      runSequence('plugins', 'launch-test', cb);
    }
  }).help = 'Launch tests with karma.';


  gulp.task('launch-test', ['build-karma-conf'], function (cb) {
    karma = new KarmaServer({
      configFile: testConfig,
      singleRun: true
    }, cb);
    karma.start();
  });


  gulp.task('build-karma-conf', function() {
    return run(src.build_karma_conf_script).exec();
  });


  gulp.task('build-karma-conf-from-template', function () {
    var karmaConf = {
      prod: config.prod
    };
    karmaConf.jsFiles = fs.readFileSync(src.test_deps).toString()
            .split('\n');

    return gulp.src(src.karma_conf_template)
            .pipe(data(function () {
              return karmaConf;
            }))
            .pipe(nunjucksRender())
            .pipe(gulpif(config.prod,
                    extReplace('prod.js', '.nunjucks.html'),
                    extReplace('dev.js', '.nunjucks.html')
                    ))
            .pipe(gulp.dest(dest.test));
  });


  gulp.task('testintegration', function (cb) {
    dest.dev = 'dev/coverage';
    runSequence([
      'index.html',
      'app.css',
      'copy-js',
      'copy-css',
      'deps.js'
    ],
    'istanbul-instrument',
    'launch-integration-tests',
    'istanbul-report-html',
    cb);
  }).help = 'Launch integartion tests with protractor';


  gulp.task('istanbul-instrument', function() {
    var cmd = './node_modules/istanbul/lib/cli.js instrument ' +
        '-o dev/coverage ' +
        '-x \'*.nunjucks.*\' ' +
        '-x \'*.mako*\' ' +
        '-x \'lib/**/*\' ' +
        '--variable \'__coverage__\' ' +
        'src';

    return run(cmd, {verbosity: 3}).exec();
  });


  gulp.task('launch-integration-tests', function() {
    var testConfig;
    if (config.prod) {
      testConfig = src.protractor_prod_conf;
    } else {
      testConfig = src.protractor_dev_conf;
    }
    var cmd = 'protractor ' + testConfig;

    // This must always exit with a 0 status code so that the coverage report is
    // always written.
    return run(cmd + '|| exit 0').exec();
  });


  gulp.task('istanbul-report-html', function() {
    var cmd = "istanbul report "+
        "--include 'coverage/integration/json/**/*.json' " +
        "--dir 'coverage/integration' " +
        "html";
    return run(cmd).exec();
  });
}


module.exports = load;
