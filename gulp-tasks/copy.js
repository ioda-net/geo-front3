var gulp = require('gulp');
var gulpif = require('gulp-if');

function load(src, dest, config) {
  gulp.task('copy-js', function () {
    return gulp.src(src.js)
            .pipe(gulp.dest(dest.dev));
  });


  gulp.task('copy-partials', function () {
    return gulp.src(src.partials, {base: './src/'})
            .pipe(gulp.dest(dest.dev));
  });


  gulp.task('copy-images', function () {
    return gulp.src(src.img)
            .pipe(gulpif(config.prod,
                    gulp.dest(dest.prod + '/img'),
                    gulp.dest(dest.dev + '/img')));
  });


  gulp.task('copy-fonts', function () {
    return gulp.src('src/style/font-awesome-3.2.1/font/*')
            .pipe(gulpif(config.prod,
                    gulp.dest(dest.prod + '/style/font-awesome-3.2.1/font'),
                    gulp.dest(dest.dev + '/style/font-awesome-3.2.1/font')));
  });


  gulp.task('copy-locales', function () {
    return gulp.src('src/locales/*.json')
            .pipe(gulpif(config.prod,
                    gulp.dest(dest.prod + '/locales'),
                    gulp.dest(dest.dev + '/locales')));
  });


  gulp.task('copy-checker', function () {
    return gulp.src('src/checker')
            .pipe(gulpif(config.prod,
                    gulp.dest(dest.prod),
                    gulp.dest(dest.dev)));
  });


  gulp.task('copy-IE', function () {
    return gulp.src('src/lib/IE/*.js')
            .pipe(gulp.dest(dest.prod + '/lib'));
  });
}


module.exports = load;