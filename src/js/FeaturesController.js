goog.provide('ga_features_controller');
(function() {

  var module = angular.module('ga_features_controller', []);

  module.controller('GaFeaturesController',
      function($scope, gaGlobalOptions, gaBrowserSniffer) {

        $scope.options = {
          tolerance: gaBrowserSniffer.touchDevice ? 15 : 5,
          identifyUrlTemplate: gaGlobalOptions.apiUrl + '/rest/services/{Portal}/MapServer/identify'.replace('{Portal}', gaGlobalOptions.portalName),
          htmlUrlTemplate: gaGlobalOptions.cachedApiUrl + '/rest/services/{Topic}/MapServer/{Layer}/{Feature}/htmlPopup',
          popupOptions: {
            title: 'object_information',
            x: 0,
            y: 'auto',
            container: 'body',
            position: 'bottom-left',
            showPrint: true,
            draggable: true
          }
        };
      });
})();
