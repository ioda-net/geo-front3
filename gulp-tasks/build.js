var gulp = require('gulp');
var concat = require('gulp-concat');
var extReplace = require('gulp-ext-replace');
var data = require('gulp-data');
var ngAnnotate = require('gulp-ng-annotate');  // Add annotation to angular files so they can be minified.
var uglify = require('gulp-uglify');
var merge = require('merge-stream'); // Used to avoid temporary files
var nunjucksRender = require('./nunjucks');
var path = require('path');
var utils = require('./utils');


function load(src, dest, config) {
  gulp.task('build.js', ['closure-compiler'], function () {
    return gulp.src([
      'src/lib/jquery-2.1.4.js',
      'src/lib/bootstrap-3.3.1.js',
      'src/lib/moment-with-customlocales.js',
      'src/lib/typeahead-0.9.3.js',
      'src/lib/angular.js',
      'src/lib/csv.js',
      'src/lib/ui-grid.js',
      'src/lib/proj4js-compressed.js',
      'src/lib/EPSG21781.js',
      'src/lib/EPSG2056.js',
      'src/lib/EPSG32631.js',
      'src/lib/EPSG32632.js',
      'src/lib/ol.js',
      'src/lib/angular-translate.js',
      'src/lib/angular-translate-loader-static-files.js',
      'src/lib/fastclick.min.js',
      'src/lib/localforage.min.js',
      'src/lib/filesaver.min.js',
      '/tmp/geo-front3/closure-compiler'
    ])
            .pipe(uglify())
            .pipe(concat('build.js'))
            .pipe(gulp.dest(dest.prod + '/lib'));
  });


  gulp.task('annotate', function () {
    // We must build the template cache before annotating the files.
    // In order to build this cache, we must map each file content to its file name. The content of
    // the file is minified with htmlMin. The templateCacheConfig will contain the mapping in its
    // partials property.
    var templateCacheConfig = {};
    var htmlMinConf = {
      collapseWhitespace: true,
      conservativeCollapse: true,
      preserveLineBreaks: false,
      removeComments: true
    };
    var partialsGlob = path.join('src/components/**/partials/**/*.html');

    templateCacheConfig.partials = utils.getPartials(partialsGlob, htmlMinConf);

    var templateCache = gulp.src('src/TemplateCacheModule.nunjucks.js', {base: './'})
            .pipe(data(function () {
              return templateCacheConfig;
            }))
            .pipe(nunjucksRender())
            .pipe(extReplace('.js', '.nunjucks.html'));

    return merge(templateCache, gulp.src(['src/components/**/*.js', 'src/js/**/*.js'], {base: './'}))
            .pipe(ngAnnotate({
              add: true
            }))
            .pipe(gulp.dest('/tmp/geo-front3/annotated'));
  });
}


module.exports = load;
