goog.provide('gf3_edit_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_debounce_service');
goog.require('ga_styles_service');

(function() {
  var module = angular.module('gf3_edit_directive', [
    'pascalprecht.translate',
    'ga_browsersniffer_service',
    'ga_debounce_service'

  ]);

  module.directive('gf3Edit', function($document, $http, $timeout, $translate,
      gaDebounce, gaBrowserSniffer, gaStyleFactory) {
    return {
      restrict: 'A',
      templateUrl: 'components/gf3Edit/partials/edit.html',
      scope: {
        map: '=gf3EditMap',
        options: '=gf3EditOptions',
        layer: '=gf3EditLayer',
        infos: '=gf3EditInfos',
        isActive: '=gf3EditActive'
      },
      link: function(scope) {
        var formatWFS = new ol.format.WFS();
        var xs = new XMLSerializer();
        var layerFilter = function(layer) {
          return layer === scope.layer;
        };

        var deregSelectPointerEvts = [];
        var selectedFeatures = new ol.Collection();
        var interaction;
        var snap;
        var add;
        var keyPressedCb = function(event) {
          if (event.keyCode === 46 && scope.selectedFeature) {  // Delete key
            scope.deleteFeature();
          }
        };

        var addedFeatures;
        var updatedFeatures;
        var deletedFeatures;

        var selectStyleFunction = gaStyleFactory.getStyleFunction('select');

        var cssPointer = 'ga-pointer';
        var cssGrab = 'ga-grab';
        var cssGrabbing = 'ga-grabbing';
        var mapDiv = $(scope.map.getTarget());

        scope.$watch('isActive', function(active) {
          if (active) {
            if (!gaBrowserSniffer.mobile) {
              deregSelectPointerEvts = scope.map.on([
                'pointerdown',
                'pointerup',
                'pointermove'
              ], function(evt) {
                updateCursorAndTooltipsDebounced(evt);
              });
            }
            // We rely on the pointerup event to select a feature. The
            // ol.interaction.Select doesn't not work properly: sometime a
            // feature was detected by updateCursorAndTooltipsDebounced
            // (cursor updated to notify the feature was selected) but it was
            // not selected by the interaction. map.forEachFeatureAtPixel is
            // more reliable.
            deregSelectPointerEvts =
                deregSelectPointerEvts.concat(scope.map.on([
              'pointerup'
            ], function(evt) {
              selectFeatureOnClickDebounced(evt);
            }));

            interaction = new ol.interaction.Modify({
              features: selectedFeatures,
              style: selectStyleFunction
            });
            interaction.on('modifystart', function() {
              mapDiv.addClass(cssGrabbing);
            });
            interaction.on('modifyend', function() {
              var feature = scope.selectedFeature;
              var id = feature.getId();
              // Newly added features don't have an id yet.
              if (updatedFeatures.indexOf(feature) === -1 && id) {
                scope.infos.dirty = true;
                updatedFeatures.push(feature);
              }
              mapDiv.removeClass(cssGrabbing);
            });

            snap = new ol.interaction.Snap({
              source: scope.layer.getSource()
            });

            scope.map.addInteraction(interaction);
            scope.map.addInteraction(snap);
            $document.on('keyup', keyPressedCb);

            clearModified();
          } else {
            deregSelectPointerEvts.forEach(function(item) {
              ol.Observable.unByKey(item);
            });
            unselectFeature();
            scope.map.removeInteraction(interaction);
            scope.map.removeInteraction(snap);
            $document.off('keyup', keyPressedCb);
            scope.addingFeature = false;

            if (scope.infos.dirty) {
              scope.layer.getSource().clear();
            }
          }
        });

        scope.addingFeature = false;
        scope.$watch('addingFeature', function(adding) {
          if (adding) {
            var source = scope.layer.getSource();

            switch (scope.layer.geometry) {
              case 'POINT':
                add = new ol.interaction.Draw({
                  type: 'Point',
                  source: source
                });
                break;
              case 'POLYGON':
                add = new ol.interaction.Draw({
                  type: 'Polygon',
                  source: source
                });
                break;
              case 'LINE':
              case 'LINESTRING':
              case 'LINE_STRING':
                add = new ol.interaction.Draw({
                  type: 'LineString',
                  source: source
                });
                break;
            }

            add.on('drawend', function(e) {
              scope.infos.dirty = true;
              addedFeatures.push(e.feature);
              // Wait a little time before selecting feature: if we don't, the
              // select style may not be applied.
              $timeout(function() {
                selectFeature(e.feature);
              }, 50);
            });
            scope.map.addInteraction(add);
          } else {
            scope.map.removeInteraction(add);
          }
        });

        function clearModified() {
          unselectFeature();
          addedFeatures = [];
          updatedFeatures = [];
          deletedFeatures = [];
          scope.infos.dirty = false;
        }

        function selectFeature(feature) {
          // If we are trying to reselect the selected feature, there is
          // nothing to do.
          if (feature === scope.selectedFeature) {
            return;
          }

          unselectFeature();
          scope.selectedFeature = feature;
          scope.defaultStyle = feature.getStyle();
          selectedFeatures.push(feature);
          var styles = selectStyleFunction(feature);
          feature.setStyle(styles);
        }

        function unselectFeature() {
          if (scope.selectedFeature) {
            scope.selectedFeature.setStyle(scope.defaultStyle);
          }
          scope.selectedFeature = null;
          selectedFeatures.clear();
        }

        scope.cancel = function() {
          unselectFeature();
          scope.layer.getSource().clear();
          clearModified();
        };

        scope.save = function() {
          unselectFeature();

          var serializeOptions = {
            featureNS: scope.layer.featureNS,
            featureType: scope.layer.featureType,
            srsName: scope.layer.srsName,
            featurePrefix: scope.layer.featurePrefix,
            version: scope.layer.version
          };
          var node = formatWFS.writeTransaction(
              addedFeatures, updatedFeatures,
              deletedFeatures, serializeOptions);
          scope.message = $translate.instant('edit_saving');

          $http({
            method: 'POST',
            url: scope.layer.getSource().getUrl(),
            data: xs.serializeToString(node),
            headers: {
              'Content-Type': 'text/xml'
            }
          }).then(function() {
            scope.message = $translate.instant('edit_save_success');
            scope.layer.getSource().clear();
            clearModified();
          }, function() {
            scope.message = $translate.instant('edit_save_error');
          });
        };

        scope.deleteFeature = function() {
          if (updatedFeatures.indexOf(scope.selectedFeature) > -1) {
            var index = updatedFeatures.indexOf(scope.selectedFeature);
            updatedFeatures.splice(index, 1);
          } else if (addedFeatures.indexOf(scope.selectedFeature) > -1) {
            var index = addedFeatures.indexOf(scope.selectedFeature);
            addedFeatures.splice(index, 1);
          }

          scope.layer.getSource().removeFeature(scope.selectedFeature);

          // Newly added features don't have an id and must not be in the
          // request for the WFS server.
          if (scope.selectedFeature.getId()) {
            deletedFeatures.push(scope.selectedFeature);
            scope.infos.dirty = true;
          }

          unselectFeature();
        };

        scope.toggleAddFeature = function() {
          scope.addingFeature = !scope.addingFeature;
        };


        // Change cursor style on mouse move, only on desktop
        var updateCursorAndTooltips = function(evt) {
          if (mapDiv.hasClass(cssGrabbing)) {
            mapDiv.removeClass(cssGrab);
            return;
          }
          var hoverSelectableFeature = false;
          var hoverSelectedFeature = false;

          // Try to find a selectable feature
          scope.map.forEachFeatureAtPixel(
              evt.pixel,
              function(feature, layer) {
                if (scope.selectedFeature === feature) {
                  hoverSelectedFeature = true;
                } else {
                  hoverSelectableFeature = true;
                }
              }, {
            layerFilter: layerFilter
          });

          if (hoverSelectableFeature) {
            mapDiv.addClass(cssPointer);
          } else {
            mapDiv.removeClass(cssPointer);
          }
          if (hoverSelectedFeature) {
            mapDiv.addClass(cssGrab);
          } else {
            mapDiv.removeClass(cssGrab);
          }
        };
        var updateCursorAndTooltipsDebounced = gaDebounce.debounce(
            updateCursorAndTooltips, 10, false, false);

        function selectFeatureOnClick(evt) {
          var featureAtPixel = false;
          // Try to find a selectable feature
          scope.map.forEachFeatureAtPixel(
              evt.pixel,
              function(feature, layer) {
                featureAtPixel = true;
                selectFeature(feature);

                // Stop feature detection on 1st feature found.
                return true;
              }, {
            layerFilter: layerFilter
          });

          if (!featureAtPixel) {
            unselectFeature();
          }
        }
        var selectFeatureOnClickDebounced =
            gaDebounce.debounce(selectFeatureOnClick, 10, false, false);
      }
    };
  });
})();
