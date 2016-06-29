{#
  This is a generated file which will contain the code for all activated plugins.
  If a plugin is available but not activated, it is replaced by a function that
  returns undefined. This way, the call to a not activated plugin will not fail.
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
  plugins['${plugin_name}'] = ${available_plugins[plugin_name]}
{% endfor %}

  return plugins;
  });
})();