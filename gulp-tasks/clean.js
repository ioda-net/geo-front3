var gulp = require('gulp');
var del = require('del');


function load(src, dest, config) {
  gulp.task('clean-tmp', function (cb) {
    del([dest.tmp], {force: true}, cb);
  });


  gulp.task('clean', ['clean-output'], function (cb) {
    del([
      dest.sgPlugins,
      src.template_cache_module,
      src.test_deps,
    ], cb);
  }).help = 'remove generated files.';


  gulp.task('clean-output', function(cb) {
    del([dest.output], cb);
  });


  gulp.task('cleanall', ['clean'], function (cb) {
    del([
      'node_modules',
      'prod',
      'dev'
    ], cb);
  }).help = 'clean and remove node modules.';
}


module.exports = load;
