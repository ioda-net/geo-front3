var gulp = require('gulp');
var concat = require('gulp-concat');
var extReplace = require('gulp-ext-replace');
var data = require('gulp-data');
var ngAnnotate = require('gulp-ng-annotate');  // Add annotation to angular files so they can be minified.
var uglify = require('gulp-uglify');
var nunjucksRender = require('./nunjucks');
var path = require('path');
var utils = require('./utils');


function load(src, dest, config) {
  gulp.task('build.js', ['closure-compiler'], function () {
    return gulp.src([
      'src/lib/jquery.js',
      'src/lib/bootstrap.js',
      'src/lib/moment-with-customlocales.js',
      'src/lib/typeahead-0.9.3.js',
      'src/lib/angular.js',
      'src/lib/proj4js-compressed.js',
      'src/lib/EPSG21781.js',
      'src/lib/EPSG2056.js',
      'src/lib/EPSG32631.js',
      'src/lib/EPSG32632.js',
      'src/lib/ol3.js',
      'src/lib/spin.js',
      'src/lib/angular-load.js',
      'src/lib/angular-translate.js',
      'src/lib/angular-translate-loader-static-files.js',
      'src/lib/ultimate-datatable.js',
      'src/lib/fastclick.js',
      'src/lib/localforage.js',
      'src/lib/filesaver.js',
      dest.closure
    ])
            .pipe(uglify())
            .pipe(concat('build.js'))
            .pipe(gulp.dest(dest.lib));
  });


  gulp.task('annotate', ['build-template-cache'], function () {
    return gulp.src([src.template_cache_module, src.components, src.src_js], {base: './'})
            .pipe(ngAnnotate({
              add: true
            }))
            .pipe(gulp.dest(dest.annotated));
  });


  gulp.task('build-template-cache', function() {
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
    var partialsGlob = path.join(src.partials);

    templateCacheConfig.partials = utils.getPartials(partialsGlob, htmlMinConf);

    return gulp.src('src/TemplateCacheModule.nunjucks.js', {base: './'})
            .pipe(data(function () {
              return templateCacheConfig;
            }))
            .pipe(nunjucksRender())
            .pipe(extReplace('.js', '.nunjucks.html'))
            .pipe(gulp.dest('.'));
  });
}


module.exports = load;
