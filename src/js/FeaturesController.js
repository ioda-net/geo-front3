goog.provide('ga_features_controller');
(function() {

  var module = angular.module('ga_features_controller', []);

  module.controller('GaFeaturesController',
      function($scope, angularLoad, gaGlobalOptions, gaBrowserSniffer) {
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
            position: 'bottom-left',
            showPrint: true,
            draggable: true,
            print: print
          }
        };

        function print() {
          angularLoad.loadScript('/lib/pdfmake.js').then(function() {
            return angularLoad.loadScript('/lib/vfs_fonts.js');
          }).then(function() {
            var exportRowType;
            if ($scope.options.gridApi.selection.getSelectedRows().length > 0) {
              exportRowType = 'selected';
            } else {
              exportRowType = 'all';
            }

            $scope.options.gridApi.exporter.pdfExport(exportRowType, 'visible');
          });
        }
      });
})();
