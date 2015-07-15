var gulp = require('gulp');
var del = require('del');


function load(src, dest, config) {
  gulp.task('clean-tmp', function (cb) {
    del(['/tmp/geo-front3'], {force: true}, cb);
  });

  gulp.task('clean', function (cb) {
    del([
      'src/deps.js',
      'src/style/app.css',
      'test/app-whitespace.js',
      'test/karma-conf.dev.js',
      'test/karma-conf.prod.js',
      'prod',
      'dev'
    ], cb);
  }).help = 'remove generated files.';


  gulp.task('cleanall', ['clean'], function (cb) {
    del([
      'node_modules'
    ], cb);
  }).help = 'clean and remove node modules.';
}


module.exports = load;
