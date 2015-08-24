var gulp = require('gulp');
var del = require('del');


function load(src, dest, config) {
  gulp.task('clean-tmp', function (cb) {
    del(['/tmp/geo-front3'], {force: true}, cb);
  });

  gulp.task('clean', ['clean-prod'], function (cb) {
    del([
      'src/style/app.css',
      'src/js/SigeomPlugins.js',
      'test/app-whitespace.js',
      'test/karma-conf.dev.js',
      'test/karma-conf.prod.js',
      'dev/' + config.portal_name
    ], cb);
  }).help = 'remove generated files.';


  gulp.task('clean-prod', function(cb) {
    del(['prod/' + config.portal_name]);
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
