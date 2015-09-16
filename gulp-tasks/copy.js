var gulp = require('gulp');
var extReplace = require('gulp-ext-replace');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');

function load(src, dest, config) {
  gulp.task('copy-js', function () {
    return gulp.src(src.js)
            .pipe(gulp.dest(dest.dev));
  });


  gulp.task('copy-cesium', ['copy-cesium-folder'], function() {
    return gulp.src(src.ol3cesium)
        .pipe(gulp.dest(dest.lib));
  });


  gulp.task('copy-cesium-folder', function() {
    return gulp.src(src.cesium)
        .pipe(gulp.dest(dest.lib_cesium));
  });


  gulp.task('copy-pdfmake-prod', function () {
    return gulp.src(src.pdfmakeProd)
            .pipe(uglify())
            .pipe(gulp.dest(dest.lib));
  });


  gulp.task('copy-css', function () {
    return gulp.src(src.css)
            .pipe(gulpif(config.prod,
              gulp.dest(dest.prod),
              gulp.dest(dest.dev)));
  });


  gulp.task('copy-partials', function () {
    return gulp.src(src.partials, {base: './src/'})
            .pipe(gulp.dest(dest.dev));
  });


  gulp.task('copy-fonts', function () {
    return gulp.src(src.font)
            .pipe(gulpif(config.prod,
                    gulp.dest(dest.prod),
                    gulp.dest(dest.dev)));
  });


  gulp.task('copy-checker', function () {
    return gulp.src('src/checker')
            .pipe(gulpif(config.prod,
                    gulp.dest(dest.prod),
                    gulp.dest(dest.dev)));
  });


  gulp.task('copy-IE', function () {
    return gulp.src('src/lib/IE/*.js')
            .pipe(uglify())
            .pipe(extReplace('.min.js', '.js'))
            .pipe(gulp.dest(dest.lib_ie));
  });
}


module.exports = load;