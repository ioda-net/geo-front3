{#
    This is a Mako template that generates Angular code putting the
    contents of HTML partials into Angular's $templateCache. The
    generated code is then built with the rest of JavaScript code.
    The generated script is not used at all in development mode,
    where HTML partials are loaded through Ajax.
#}
// Generated code. Do not edit.
goog.provide('__ga_template_cache__');
goog.require('geoadmin');
(function() {
  angular.module('geoadmin').run(['$templateCache', function($templateCache) {
{% for partial_name, partial_content in partials.items() %}
  $templateCache.put('${partial_name}', '${partial_content}');
{% endfor %}
  }]);
})();
