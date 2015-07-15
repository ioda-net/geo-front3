var gulp = require('gulp');
var eslint = require('gulp-eslint');
var run = require('gulp-run');
var utils = require('./utils');


function load(src, dest, config) {
  gulp.task('lint', function () {
    return gulp.src('src/components/**/*.js')
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


  gulp.task('translate', function () {
    var cmd = utils.formatCmd([
      'python3',
      'scripts/translation2json.py',
      '--gspread 1F3R46w4PODfsbJq7jd79sapy3B7TXhQcYM7SEaccOA0',
      '--key re3-translations.json',
      '--files src/locales/translations.csv',
      '--output-folder src/locales/'
    ]);

    return run(cmd).exec();
  }).help = 'launch the translation script';
}


module.exports = load;
