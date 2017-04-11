goog.provide('gf3_edit_directive');

// Don't add goog.require to ga_* modules to prevent circular dependency
// errors. The directive worsk fine without them since they are already loaded
// by other components.

/**
 * Handles user interaction with the map during the edition of a layer.
 */
(function() {
  var module = angular.module('gf3_edit_directive', [
    'pascalprecht.translate',
    'ga_browsersniffer_service',
    'ga_debounce_service'
  ]);

  module.directive('gf3Edit', function($document, $timeout, $translate,
      gaDebounce, gaBrowserSniffer, gaStyleFactory, gf3Auth,
      gf3EditSave, gf3EditPopup, gf3EditUtils) {

    return {
      restrict: 'A',
      templateUrl: 'components/gf3Edit/partials/edit.html',
      scope: {
        map: '=gf3EditMap',
        options: '=gf3EditOptions',
        layer: '=gf3EditLayer',
        // Used to exchange information with the controller (eg dirty).
        infos: '=gf3EditInfos',
        isActive: '=gf3EditActive'
      },
      link: function(scope) {
        var layerFilter = function(layer) {
          return layer === scope.layer;
        };

        var deregSelectPointerEvts = [];
        var selectedFeatures = new ol.Collection();
        var drawnFeature = null;
        var addingFeature = false;
        var interaction;
        var snap;
        var add;
        var keyPressedCb = function(event) {
          if (event.keyCode === 46 && scope.selectedFeature &&
              !gf3EditUtils.isInInputField(event)) {  // Delete key
            scope.deleteFeature();
          } else if (event.keyCode === 27 && scope.addingFeature) { // ESC key.
            // Disable the draw interaction to cancel the drawing. Re-enable it
            // immediatly so the user can continue to draw.
            add.setActive(false);
            add.setActive(true);
          }
        };
        /**
         * We register this callback to remove features listed in the
         * deletedFeatures array when the features of the source are refreshed
         * from the server.
         */
        var featuresRefreshCb = function(event) {
          var deletedFeaturesId = deletedFeatures.map(function(feature) {
            return feature.getId();
          });
          if (deletedFeaturesId.indexOf(event.feature.getId()) > -1) {
            scope.layer.getSource().removeFeature(event.feature);
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
            scope.message = '';
            scope.saveErrors = [];

            if (!gaBrowserSniffer.mobile) {
              deregSelectPointerEvts = scope.map.on([
                'pointerdown',
                'pointerup',
                'pointermove'
              ], function(evt) {
                gf3EditPopup.moveHelpTooltip(evt.coordinate);
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
              gf3EditPopup.hideFeaturesPopup();
            });
            interaction.on('modifyend', function(event) {
              var feature = scope.selectedFeature;
              var id = feature.getId();
              // Newly added features don't have an id yet.
              if (updatedFeatures.indexOf(feature) === -1 && id) {
                scope.infos.dirty = true;
                updatedFeatures.push(feature);
              }
              mapDiv.removeClass(cssGrabbing);
              gf3EditPopup.showFeaturesPopup(
                  feature, scope.layer.attributes, event.coordinate);
            });

            snap = new ol.interaction.Snap({
              source: scope.layer.getSource()
            });

            scope.map.addInteraction(interaction);
            scope.map.addInteraction(snap);
            gf3EditPopup.init(scope.map);

            scope.authRequired = scope.layer.authRequired;
            scope.authUrl = scope.layer.getSource().getUrl();
            scope.isAuthenticated = gf3Auth.hasLogin(scope.authUrl);

            scope.layer.getSource().on('addfeature', featuresRefreshCb);

            mapDiv.on('mouseout', gf3EditPopup.hideHelpTooltip);
            $document.on('keyup', keyPressedCb);

            clearModified();
          } else {
            deregSelectPointerEvts.forEach(function(item) {
              ol.Observable.unByKey(item);
            });
            unselectFeature();
            scope.map.removeInteraction(interaction);
            scope.map.removeInteraction(snap);
            gf3EditPopup.teardown();

            mapDiv.off('mouseout', gf3EditPopup.hideHelpTooltip);
            $document.off('keyup', keyPressedCb);
            scope.layer.getSource().un('addfeature', featuresRefreshCb);
            scope.addingFeature = false;

            if (scope.infos.dirty) {
              scope.layer.getSource().clear();
            }
          }
        });

        scope.$watch('infos.dirty', function(dirty) {
          if (dirty) {
            scope.message = $translate.instant('edit_unsaved_changes');
          }
        });

        scope.addingFeature = false;
        scope.$watch('addingFeature', function(adding) {
          if (adding) {
            var source = scope.layer.getSource();
            unselectFeature();

            switch (scope.layer.geometry) {
              case 'point':
                add = new ol.interaction.Draw({
                  type: 'Point',
                  source: source
                });
                break;
              case 'polygon':
                add = new ol.interaction.Draw({
                  type: 'Polygon',
                  source: source
                });
                break;
              case 'line':
              case 'linestring':
                add = new ol.interaction.Draw({
                  type: 'LineString',
                  source: source
                });
                break;
            }

            add.on('drawstart', function(e) {
              unselectFeature();
              drawnFeature = e.feature;
              addingFeature = true;
              $document.keyup(add, gf3EditUtils.removeLastPoint);
            });
            add.on('drawend', function(e) {
              var feature = e.feature;
              scope.infos.dirty = true;
              addingFeature = false;
              drawnFeature = null;
              $document.off('keyup', gf3EditUtils.removeLastPoint);
              addedFeatures.push(feature);
              // We need to set the geometry name so the geometry is saved in
              // the proper column. Before doing that, we need to get the
              // geometry, so we can do a setGeometry so the geometry is stored
              // in the proper properties. We then remove the older one to
              // prevent transaction errors (update/insertion in a inexisting
              // column).
              var currentGeometryName = feature.getGeometryName();
              var newGeometryName = scope.layer.geometryName;
              if (currentGeometryName !== newGeometryName) {
                var geometry = e.feature.getGeometry();
                feature.setGeometryName(newGeometryName);
                feature.setGeometry(geometry);
                feature.unset(currentGeometryName);
              }
              // Wait a little time before selecting feature: if we don't, the
              // select style may not be applied.
              $timeout(function() {
                selectFeature(feature);
              }, 50);
            });
            scope.map.addInteraction(add);
          } else {
            // If the user cancel the drawing, we must remove this callback.
            $document.off('keyup', gf3EditUtils.removeLastPoint);
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

        function selectFeature(feature, clickedCoords) {
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

          gf3EditPopup.showFeaturesPopup(
              feature, scope.layer.attributes, clickedCoords);
        }

        function unselectFeature() {
          if (scope.selectedFeature) {
            scope.selectedFeature.setStyle(scope.defaultStyle);
          }
          scope.selectedFeature = null;
          selectedFeatures.clear();
          gf3EditPopup.hideFeaturesPopup();
        }

        scope.loggedIn = function() {
          scope.isAuthenticated = true;
        };

        scope.cancel = function() {
          if (!scope.infos.dirty) {
            return;
          }

          unselectFeature();
          scope.layer.getSource().clear();
          clearModified();
          scope.message = '';
          scope.saveErrors = [];
        };

        scope.save = function() {
          if (!scope.infos.dirty) {
            return;
          }

          unselectFeature();

          var serializeOptions = {
            featureNS: scope.layer.featureNS,
            featureType: scope.layer.featureType,
            srsName: scope.layer.srsName,
            featurePrefix: scope.layer.featurePrefix,
            is3D: scope.layer.is3D,
            version: scope.layer.version
          };
          scope.message = $translate.instant('edit_saving');
          scope.saveErrors = [];
          gf3EditSave.save(
              scope.layer.getSource().getUrl(),
              addedFeatures,
              updatedFeatures,
              deletedFeatures,
              serializeOptions
           ).then(function(message) {
             scope.message = $translate.instant(message);
             scope.layer.getSource().clear();
             clearModified();
           }, function(rejectionInfos) {
             scope.message = $translate.instant(rejectionInfos.message);

             if (rejectionInfos.authRequired) {
               scope.authRequired = true;
             }
             if (rejectionInfos.saveErrors) {
               scope.saveErrors = rejectionInfos.saveErrors;
             }
           });
        };

        scope.deleteFeature = function() {
          if (!confirm($translate.instant('edit_confirm_delete'))) {
            return;
          }

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


        ////////////////////////////////////
        // Utils functions
        ////////////////////////////////////
        // Change cursor style on mouse move, only on desktop
        var updateCursorAndTooltips = function(evt) {
          if (mapDiv.hasClass(cssGrabbing)) {
            mapDiv.removeClass(cssGrab);
            return;
          }
          var cursorCoords = evt.coordinate;
          var hoverSelectableFeature = false;
          var hoverSelectedFeature = false;
          var hoverVertexSelectedFeature = false;
          var hoverEdgeSelectedFeature = false;

          // Try to find a selectable feature
          scope.map.forEachFeatureAtPixel(
              evt.pixel,
              function(feature, layer) {
                if (scope.selectedFeature === feature) {
                  hoverSelectedFeature = true;
                } else {
                  hoverSelectableFeature = true;
                }

                hoverEdgeSelectedFeature =
                    gf3EditUtils.onEdge(feature, cursorCoords);
                hoverVertexSelectedFeature =
                    gf3EditUtils.onVertex(scope.layer, feature, cursorCoords);
              }, {
            layerFilter: layerFilter
          });

          if (hoverSelectableFeature && !scope.addingFeature) {
            mapDiv.addClass(cssPointer);
            gf3EditPopup.updateSelectHelpTooltip();
          } else {
            mapDiv.removeClass(cssPointer);
          }
          if (hoverSelectedFeature) {
            mapDiv.addClass(cssGrab);
          } else {
            mapDiv.removeClass(cssGrab);
          }

          // Update help tooltip
          if (scope.addingFeature) {
            var hasMinNbPoints =
                gf3EditUtils.hasFeatureEnoughPoints(scope.layer, drawnFeature);
            gf3EditPopup.updateSelectHelpTooltip(
                'add', scope.layer.geometry, hasMinNbPoints, addingFeature);
          } else if (hoverSelectableFeature) {
            gf3EditPopup.updateSelectHelpTooltip(
                'select', scope.layer.geometry, true, addingFeature);
          } else if (hoverSelectedFeature) {
            var helpType;
            if (hoverVertexSelectedFeature) {
              helpType = 'modify_existing_vertex';
            } else if (hoverEdgeSelectedFeature) {
              helpType = 'modify_new_vertex';
            } else {
              helpType = 'modify';
            }
            gf3EditPopup.updateSelectHelpTooltip(
                helpType, scope.layer.geometry, true, addingFeature);
          } else {
            // Update tooltip to 'nothing to select'.
            gf3EditPopup.updateSelectHelpTooltip();
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
                // Don't select features when we are adding one.
                if (!scope.addingFeature) {
                  selectFeature(feature, evt.coordinate);
                }

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

        // Register events
        scope.$on('gf3_editfeatureattrs', function() {
          scope.infos.dirty = true;
        });
      }
    };
  });
})();
