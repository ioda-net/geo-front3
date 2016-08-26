goog.provide('ga_catalogitem_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_catalogtree_directive');
goog.require('ga_layermetadatapopup_service');
goog.require('ga_map_service');
goog.require('ga_previewlayers_service');
goog.require('gf3');

(function() {

  var module = angular.module('ga_catalogitem_directive', [
    'ga_browsersniffer_service',
    'ga_catalogtree_directive',
    'ga_layermetadatapopup_service',
    'ga_map_service',
    'ga_previewlayers_service',
    'gf3'
  ]);

  /**
   * See examples on how it can be used
   */
  module.directive('gaCatalogitem',
      function($compile, gaMapUtils, gaLayerMetadataPopup, gaBrowserSniffer,
        gaPreviewLayers, gaLayers, gf3GlobalOptions) {

        var addBodLayer = function(map, layerBodId) {
          if (gaLayers.getLayer(layerBodId)) {
            var layer = gaLayers.getOlLayerById(layerBodId);
            if (layer) {
              map.addLayer(layer);
            }
          }
        };

        // Don't add preview layer if the layer is already on the map
        var addPreviewLayer = function(map, item) {
          if (!item.selectedOpen) {
            gaPreviewLayers.addBodLayer(map, item.layerBodId);
          }
        };

        // Remove all preview layers
        var removePreviewLayer = function(map) {
          gaPreviewLayers.removeAll(map);
        };

        var getOlLayer = function(map, item) {
          if (!item) {
            return undefined;
          }
          return gaMapUtils.getMapOverlayForBodId(map, item.layerBodId);
        };

        return {
          restrict: 'A',
          replace: true,
          require: '^gaCatalogtree',
          templateUrl: 'components/catalogtree/partials/catalogitem.html',
          scope: {
            item: '=gaCatalogitemItem',
            map: '=gaCatalogitemMap',
            options: '=gaCatalogitemOptions'
          },
          controller: function($scope) {
            $scope.allowInfobox = gf3GlobalOptions.allowInfobox;

            $scope.item.active = function(activate) {
              var layer = getOlLayer($scope.map, $scope.item);
              //setter called
              if (arguments.length) {
                if (layer) {
                  layer.visible = activate;
                }
                if (activate) {
                  $scope.item.selectedOpen = true;
                  // Add it if it's not already on the map
                  if (!layer) {
                    removePreviewLayer($scope.map);
                    addBodLayer($scope.map, $scope.item.layerBodId);
                  }
                }
              } else { //getter called
                return $scope.item.selectedOpen && layer && layer.visible;
              }
            };

            $scope.toggle = function(evt) {
              $scope.item.selectedOpen = !$scope.item.selectedOpen;
              evt.preventDefault();
              evt.stopPropagation();
            };

            $scope.getLegend = function(evt, bodId) {
              gaLayerMetadataPopup.toggle(bodId);
              evt.stopPropagation();
            };
          },

          compile: function(tEl, tAttr) {
            var contents = tEl.contents().remove();
            var compiledContent;
            return function(scope, iEl, iAttr, controller) {
              if (!compiledContent) {
                compiledContent = $compile(contents);
              }

              // Node
              if (angular.isDefined(scope.item.children)) {
                scope.$watch('item.selectedOpen', function(value) {
                  controller.updatePermalink(scope.item.id, value);
                });

              // Leaf
              } else if (!gaBrowserSniffer.mobile) {
                iEl.on('mouseenter', function(evt) {
                  addPreviewLayer(scope.map, scope.item);
                }).on('mouseleave', function(evt) {
                  removePreviewLayer(scope.map);
                });
              }
              compiledContent(scope, function(clone, scope) {
                iEl.append(clone);
              });
            };
          }
        };
      }
  );
})();
