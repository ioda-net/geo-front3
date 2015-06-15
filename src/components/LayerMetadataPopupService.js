(function() {
  goog.provide('ga_layer_metadata_popup_service');

  goog.require('ga_map_service');
  goog.require('ga_popup');

  var module = angular.module('ga_layer_metadata_popup_service', [
    'ga_map_service',
    'ga_popup',
    'pascalprecht.translate'
  ]);

  module.provider('gaLayerMetadataPopup', function() {
    this.$get = function($translate, $rootScope, $sce, gaPopup, gaLayers) {
      var popupContent = '<div ng-bind-html="options.result.html"></div>';

      var LayerMetadataPopup = function() {
        var popups = {};

        var create = function(bodid) {
          var layer = {};
          var popup;

          // Called to update the content
          var updateContent = function(init) {
            angular.extend(layer, gaLayers.getLayer(bodid));
            if (init) {
              popup.open();
            }
          };

          //We assume popup does not exist yet
          popup = gaPopup.create({
            title: $translate.instant('metadata_window_title'),
            destroyOnClose: false,
            content: popupContent,
            layer: layer,
            className: 'ga-tooltip-metadata',
            x: 400,
            y: 200,
            showPrint: true,
            type: 'infobox'
          });
          popups[bodid] = popup;

          updateContent(true);

          $rootScope.$on('$translateChangeEnd', function() {
            updateContent(false);
          });

        };

        this.toggle = function(bodid) {
          var popup = popups[bodid];
          if (popup) { // if the popup already exist we toggle it
            if (popup.scope.toggle) {
              popup.close();
            } else {
              popup.open();
            }
          } else {
            create(bodid);
          }
        };
      };

      return new LayerMetadataPopup();
    };
  });
})();
