{#
    This is a Mako template that generates Angular code putting the
    contents of HTML partials into Angular's $templateCache. The
    generated code is then built with the rest of JavaScript code.
    The generated script is not used at all in development mode,
    where HTML partials are loaded through Ajax.
#}
// Generated code. Do not edit.
(function() {
  goog.provide('__ga_template_cache__');
  goog.require('ga');
  angular.module('ga').run(['$templateCache', function($templateCache) {
{% for partialName, partialContent in partials %}
  $templateCache.put('${partialName}', '${partialContent}');
{% endfor %}
  }]);
})();
