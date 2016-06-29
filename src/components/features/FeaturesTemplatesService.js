goog.provide('gf3_features_templates_service');

(function() {
  var module = angular.module('gf3_features_templates_service', []);

  module.factory('gf3FeaturesTemplates', function() {
    return {
      getTemplates: getTemplates
    };

    function getTemplates() {
      var defaultTemplates = {
        pdf: '<a target="pdf" href="{{cellValue}}" ng-if="cellValue">' +
            '<img src="img/acroread16.png" style="width:18px;height:18px"/>' +
            '</a>',
        url: '<div>' +
            '<a target="_blank" href="{{cellValue}}" ng-if="cellValue">' +
            '{{cellValue | translate  }}</a></div>'
      };

      var customerTemplates = {};

      var templates = {};

      angular.extend(templates, defaultTemplates);
      angular.extend(templates, customerTemplates);

      return templates;
    }
  });
})();
