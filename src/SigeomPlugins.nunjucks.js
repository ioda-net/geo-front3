{#
  This is a generated file which will contain the code for all activated plugins.
  If a plugin is available but not activated, it is replaced by a function that
  returns undefined. This way, the call to a not activated plugin will not fail.
#}
// We use gaGlobalOptions but we don't explicitely require
// goog.require('ga'); because closure-compiler will crash due to circular
// dependencies.
goog.require('sigeom');

goog.provide('sigeom_plugins');
(function() {
  sigeomModule.factory('sgPlugins', function($http, gaGlobalOptions) {
      var plugins  = {};
{% for pluginName in activatedPlugins %}
  plugins['${pluginName}'] = ${availablePlugins[pluginName]}
{% endfor %}

  return plugins;
  });
})();