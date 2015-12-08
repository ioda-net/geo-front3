goog.provide('gf3_features_controller');
(function() {

  var module = angular.module('gf3_features_controller', []);

  module.controller('gf3FeaturesController',
      function($scope, gaGlobalOptions, gaBrowserSniffer) {
        $scope.gridApi = {};
        $scope.options = {
          tolerance: gaBrowserSniffer.touchDevice ? 15 : 5,
          identifyUrlTemplate: gaGlobalOptions.apiUrl + '/rest/services/{Portal}/MapServer/identify'.replace('{Portal}', gaGlobalOptions.portalName),
          params: {
            geometryType: 'esriGeometryPoint',
            geometryFormat: 'geojson'
          },
          popupOptions: {
            title: 'object_information',
            x: 0,
            y: 'auto',
            container: 'body',
            position: 'features',
            showPrint: false,
            draggable: false
          }
        };
      });
})();
