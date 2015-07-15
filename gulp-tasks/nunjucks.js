/**
 * Special custom modules that exports the correctly configured nunjucks render.
 * @type Module gulp-nunjucks-render|Module gulp-nunjucks-render
 */


var nunjucksRender = require('gulp-nunjucks-render');  // Templating engine

// Change nunjucks variable delimiters to avoid conflict with angular
nunjucksRender.nunjucks.configure({
  tags: {
    variableStart: '${',
    variableEnd: '}'
  },
  watch: false
});

module.exports = nunjucksRender;
