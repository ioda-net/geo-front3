{#
  This is a generated file which will contain the code for all activated plugins.
#}
// We use gaGlobalOptions but we don't explicitely require
// goog.require('ga'); because closure-compiler will crash due to circular
// dependencies.
goog.require('gf3');

goog.provide('gf3_plugins');
(function() {
  angular.module('gf3').factory('gf3Plugins', function($http, gaGlobalOptions) {
      var plugins  = {};
{% for plugin_name in activated_plugins %}
  {# We can be building for a branch without the plugins. In this case, we avoid syntax error by not including the code #}
  {% if available_plugins[plugin_name] %}
  plugins['${plugin_name}'] = ${available_plugins[plugin_name]}
  {% endif %}
{% endfor %}

  return plugins;
  });
})();