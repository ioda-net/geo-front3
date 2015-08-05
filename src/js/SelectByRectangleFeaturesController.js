goog.provide('ga_selectbyrectanglefeatures_controller');

goog.require('ga_popup_service');
goog.require('ga_print_service');
(function() {
  
  var module = angular.module('ga_selectbyrectanglefeatures_controller',[
    'ga_popup_service',
    'ga_print_service'
  ]);

  module.controller('GaSelectByRectangleFeaturesController',
  function($scope, gaGlobalOptions, gaBrowserSniffer) {

    $scope.options = {
      selectByRectangle: true,
      tolerance: gaBrowserSniffer.touchDevice ? 15 : 5,
      identifyUrlTemplate: gaGlobalOptions.apiUrl + '/rest/services/{Portal}/MapServer/identify'.replace('{Portal}', gaGlobalOptions.portalName),
      params: {
        geometryType: 'esriGeometryEnvelope',
        geometryFormat: 'geojson'
      },
      query: {
        featuresShown: false,
        hasMoreResults: false,
        nbFeatures: 0,
        max: 200
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
    
    $scope.getItemText = function() {
      return '(' + (($scope.options.hasMoreResults) ? '+' : '') +
          $scope.options.nbFeatures + ')';

    };
    // When the results of query tool are updated, we collapse/expand the
    // features tree accordion, then we update the feature tree
    /*$scope.$on('gaQueryResultsUpdated', function(evt, featuresByLayer) {
      evt.stopPropagation();
      var show = false, nbFeatures = 0, hasMoreResults = false;
      angular.forEach(featuresByLayer, function(layer) {
        // If idenditify for one layers is a bad request, layer is undefined.
        if (layer && layer.features && layer.features.length > 0) {
          show = true;
          hasMoreResults = (hasMoreResults || layer.hasMoreResults);
          nbFeatures += layer.features.length;
        }
        
      });
      $scope.options.nbFeatures = nbFeatures;
      $scope.options.featuresShown = show;
      $scope.options.hasMoreResults = hasMoreResults;
    });*/

    $scope.$on('gaQueryResultsUpdated', function(evt, featuresByLayer) {
      if (evt.hasOwnProperty('stopPropagation')) {
        evt.stopPropagation();
      }
      $scope.$broadcast('gaQueryResultsUpdated', featuresByLayer);
    });

  });
})();
