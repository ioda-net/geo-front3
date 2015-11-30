var gulp = require('gulp');
var run = require('gulp-run');
var runSequence = require('run-sequence');


function load(src, dest, config) {
  gulp.task('testintegration', function (cb) {
    runSequence([
      'index.html',
      'app.css',
      'copy-js',
      'copy-css',
      'copy-partials',
      'copy-fonts',
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
