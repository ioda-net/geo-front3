var gulp = require('gulp');
var eslint = require('gulp-eslint');
var run = require('gulp-run');
var utils = require('./utils');


function load(src, dest, config) {
  gulp.task('lint', function () {
    return gulp.src(src.components)
            .pipe(eslint())
            .pipe(eslint.format());
  }).help = 'run the eslint javacript linter.';


  gulp.task('gslint', function () {
    var cmd = utils.formatCmd([
      'gjslint',
      '-r',
      'src/components',
      'src/js',
      '--jslint_error=all'
    ]);

    return run(cmd).exec();
  }).help = 'run the javascript linter used by swisstopo.';
}


module.exports = load;
