{#
  This is a generated file which will contain the code for all activated plugins.
  If a plugin is available but not activated, it is replaced by a function that
  returns undefined. This way, the call to a not activated plugin will not fail.
#}
goog.require('sigeom');

goog.provide('sigeom_plugins');
(function() {
  sigeomModule.factory('sgPlugins', [function() {
      var plugins  = {};
{% for pluginName in activatedPlugins %}
  plugins['${pluginName}'] = ${plugins[pluginName]}
{% endfor %}

{% for pluginName in availablePlugins %}
  if(!('${pluginName}' in plugins)) {
    plugins['${pluginName}'] = function () {
      return;
    };
  }
  {% endfor %}

  return plugins;
  }]);
})();