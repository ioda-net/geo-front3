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
      testConfig = 'test/karma-conf.prod.js';
      runSequence('prod', 'launch-test', cb);
    } else {
      testConfig = 'test/karma-conf.dev.js';
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
    return run('scripts/build-js-components-deps-from-js-files.sh').exec();
  });


  gulp.task('build-karma-conf-from-template', function () {
    var karmaConf = {
      prod: config.prod
    };
    karmaConf.jsFiles = fs.readFileSync('test/deps').toString()
            .split('\n');

    return gulp.src('test/karma-conf.nunjucks.js')
            .pipe(data(function () {
              return karmaConf;
            }))
            .pipe(nunjucksRender())
            .pipe(gulpif(config.prod,
                    extReplace('prod.js', '.nunjucks.html'),
                    extReplace('dev.js', '.nunjucks.html')
                    ))
            .pipe(gulp.dest('test'));
  });
}


module.exports = load;
