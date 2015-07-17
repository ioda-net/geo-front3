var fs = require('fs');
var gulp = require('gulp');
var rename = require('gulp-rename');
var run = require('gulp-run');
var utils = require('./utils');


function load(src, dest, config) {
  // Cache partials so they can be used in karma
  gulp.task('app-whitespace.js', ['js-files'], function () {
    var jsFiles = utils.getJsFiles();
    var cmd = utils.formatCmd([
      'java -jar node_modules/google-closure-compiler/compiler.jar',
      jsFiles,
      '--jscomp_error checkVars',
      '--compilation_level WHITESPACE_ONLY',
      '--formatting PRETTY_PRINT',
      '--js_output_file',
      'test/app-whitespace.js'
    ]);

    return run(cmd,
            {
              verbosity: 0
            }).exec();
  });


  gulp.task('closure-compiler', ['js-files'], function () {
    var jsFiles = utils.getJsFiles();
    var cmd = utils.formatCmd([
      'java -jar node_modules/google-closure-compiler/compiler.jar',
      jsFiles,
      '--jscomp_error checkVars',
      '--compilation_level SIMPLE',
      '--externs externs/angular.js',
      '--externs externs/jquery.js',
      '--externs externs/ol.js',
      '--js_output_file /tmp/geo-front3/closure-compiler'
    ]);

    return run(cmd, {
      verbosity: 0
    }).exec()
            .pipe(gulp.dest('/tmp/geo-front3'));
  });


  gulp.task('js-files', ['annotate'], function () {
    var closurebuilder = utils.formatCmd([
      'python node_modules/google-closure-library/closure/bin/build/closurebuilder.py',
      '--root=/tmp/geo-front3/annotated',
      '--root=node_modules/google-closure-library',
      '--namespace="ga"',
      '--namespace="__ga_template_cache__"',
      '--output_mode=list'
    ]);
    var formatFile = utils.formatCmd([
      "sed",
      "-e ':a'",
      "-e 'N'",
      "-e '$!ba'",
      "-e 's/\\n/ --js /g'"
    ]);
    var appendJsFirstFile = utils.formatCmd([
        "sed",
        "-r 's/(.*)/ --js \\1/g'"
    ]);

    return run(closurebuilder, {silent: true}).exec()
            .pipe(run(formatFile, {silent: true}))
            .pipe(run(appendJsFirstFile, {silent: true}))
            .pipe(rename('js-files'))
            .pipe(gulp.dest('/tmp/geo-front3/'));
  });


  gulp.task('deps.js', function () {
    var cmd = utils.formatCmd([
      'python',
      'node_modules/google-closure-library/closure/bin/build/depswriter.py',
      '--root_with_prefix="src/components components"',
      '--root_with_prefix="src/js js"'
    ]);

    return run(cmd, {verbosity: 0}).exec()
            .pipe(rename('deps.js'))
            .pipe(gulp.dest(dest.dev));
  });
}


module.exports = load;
