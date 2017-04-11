goog.provide('gf3_edit_popup_service');

/**
 * Open/hide the popups and tooltip related to the edition.
 */
(function() {
  var module = angular.module('gf3_edit_popup_service', [
    'pascalprecht.translate'
  ]);

  module.factory('gf3EditPopup', function($document, $rootScope, $translate) {
    var helpTooltip = createHelpTooltip();
    var map;

    return {
      hideFeaturesPopup: hideFeaturesPopup,
      hideHelpTooltip: hideHelpTooltip,
      init: init,
      moveHelpTooltip: moveHelpTooltip,
      showFeaturesPopup: showFeaturesPopup,
      teardown: teardown,
      updateSelectHelpTooltip: updateSelectHelpTooltip
    };

    function createHelpTooltip() {
      var tooltipElement = $document[0].createElement('div');
      tooltipElement.className = 'ga-draw-help';
      return new ol.Overlay({
        element: tooltipElement,
        offset: [15, 15],
        positioning: 'top-left',
        stopEvent: true
      });
    }

    function hideFeaturesPopup() {
      $rootScope.$broadcast('gf3EditFeaturesPopupHide');
    }

    function hideHelpTooltip() {
      helpTooltip.setPosition(undefined);
    }

    function init(olMap) {
      map = olMap;
      map.addOverlay(helpTooltip);
    }

    function moveHelpTooltip(coordinate) {
      helpTooltip.setPosition(coordinate);
    }

    function showFeaturesPopup(feature, attributes, clickedCoords) {
      var geometry = feature.getGeometry();
      var coord = clickedCoords ?
          geometry.getClosestPoint(clickedCoords) :
          geometry.getLastCoordinate();
      var pixel = map.getPixelFromCoordinate(coord);
      $rootScope.$broadcast('gf3EditFeaturesPopupShow',
          feature, attributes, pixel);
      // Required for the popup to display immediatly where expected.
      $rootScope.$applyAsync();
    }

    function teardown() {
      map.removeOverlay(helpTooltip);
      map = null;
    }

    function updateSelectHelpTooltip(type, geometry, hasMinNbPoints,
        addingFeature) {
      var helpMsgId;

      switch (type) {
        case 'add':
          if (addingFeature) {
            helpMsgId = 'edit_add_feature_next_' + geometry;
          } else {
            helpMsgId = 'edit_add_feature_' + geometry;
          }
          break;
        case 'modify':
          helpMsgId = 'edit_modify_feature_' + geometry;
          break;
        case 'modify_new_vertex':
          helpMsgId = 'edit_modify_new_vertex_' + geometry;
          break;
        case 'modify_existing_vertex':
          helpMsgId = 'edit_modify_existing_vertex_' + geometry;
          break;
        case 'select':
          helpMsgId = 'edit_select_feature_' + geometry;
          break;
        default:
          helpMsgId = 'edit_select_no_feature';
          break;
      }

      var message = $translate.instant(helpMsgId);
      if (addingFeature && hasMinNbPoints) {
        message += '<br>' + $translate.instant('edit_delete_last_point');
      }
      helpTooltip.getElement().innerHTML = message;
    }
  });
})();
