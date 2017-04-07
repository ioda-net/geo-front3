goog.provide('gf3_edit_directive');

// Don't add goog.require to ga_* modules to prevent circular dependency
// errors. The directive worsk fine without them since they are already loaded
// by other components.

(function() {
  var module = angular.module('gf3_edit_directive', [
    'pascalprecht.translate',
    'ga_browsersniffer_service',
    'ga_debounce_service'

  ]);

  module.directive('gf3Edit', function($document, $http, $timeout, $translate,
      $rootScope, gaDebounce, gaBrowserSniffer, gaStyleFactory, gf3Auth) {
    var MIN_NB_POINTS = {
      'point': 1,
      'line': 2,
      'linestring': 2,
      'polygon': 3
    };

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
        var formatWFS = new ol.format.WFS();
        var xs = new XMLSerializer();
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
              !isInInputField(event)) {  // Delete key
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

        var helpTooltip;
        function createHelpTooltip() {
          var tooltipElement = $document[0].createElement('div');
          tooltipElement.className = 'ga-draw-help';
          helpTooltip = new ol.Overlay({
            element: tooltipElement,
            offset: [15, 15],
            positioning: 'top-left',
            stopEvent: true
          });
        }
        function hideHelpTooltip() {
          helpTooltip.setPosition(undefined);
        }
        // Display an help tooltip when selecting
        function updateSelectHelpTooltip(type, geometry, hasMinNbPoints) {
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
        };
        createHelpTooltip();

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
                helpTooltip.setPosition(evt.coordinate);
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
              hideFeaturesPopup();
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
              showFeaturesPopup(feature, event.coordinate);
            });

            snap = new ol.interaction.Snap({
              source: scope.layer.getSource()
            });

            scope.map.addInteraction(interaction);
            scope.map.addInteraction(snap);
            scope.map.addOverlay(helpTooltip);

            scope.authRequired = scope.layer.authRequired;
            scope.authUrl = scope.layer.getSource().getUrl();
            scope.isAuthenticated = gf3Auth.hasLogin(scope.authUrl);

            scope.layer.getSource().on('addfeature', featuresRefreshCb);

            mapDiv.on('mouseout', hideHelpTooltip);
            $document.on('keyup', keyPressedCb);

            clearModified();
          } else {
            deregSelectPointerEvts.forEach(function(item) {
              ol.Observable.unByKey(item);
            });
            unselectFeature();
            scope.map.removeInteraction(interaction);
            scope.map.removeInteraction(snap);
            scope.map.removeOverlay(helpTooltip);

            mapDiv.off('mouseout', hideHelpTooltip);
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
              $document.keyup(add, removeLastPoint);
            });
            add.on('drawend', function(e) {
              scope.infos.dirty = true;
              addingFeature = false;
              drawnFeature = null;
              $document.off('keyup', removeLastPoint);
              addedFeatures.push(e.feature);
              // Wait a little time before selecting feature: if we don't, the
              // select style may not be applied.
              $timeout(function() {
                selectFeature(e.feature);
              }, 50);
            });
            scope.map.addInteraction(add);
          } else {
            // If the user cancel the drawing, we must remove this callback.
            $document.off('keyup', removeLastPoint);
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

          showFeaturesPopup(feature, clickedCoords);
        }

        function unselectFeature() {
          if (scope.selectedFeature) {
            scope.selectedFeature.setStyle(scope.defaultStyle);
          }
          scope.selectedFeature = null;
          selectedFeatures.clear();
          hideFeaturesPopup();
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
          var node = formatWFS.writeTransaction(
              addedFeatures, updatedFeatures,
              deletedFeatures, serializeOptions);
          scope.message = $translate.instant('edit_saving');

          scope.saveErrors = [];
          $http({
            method: 'POST',
            url: scope.layer.getSource().getUrl(),
            data: xs.serializeToString(node),
            headers: {
              'Content-Type': 'text/xml'
            }
          }).then(function(resp) {
            if (saveResponseContainsError(resp.data)) {
              scope.message = $translate.instant('edit_save_error');
              scope.saveErrors = getErrorMessageFromSaveResponse(resp.data);
            } else {
              scope.message = $translate.instant('edit_save_success');
              scope.layer.getSource().clear();
              clearModified();
            }
          }, function(resp) {
            if (resp.status === 401 || resp.status === 403) {
              scope.authRequired = true;
            } else {
              scope.message = $translate.instant('edit_save_error');
            }
          });
        };

        function saveResponseContainsError(data) {
          // Depending of the server and the WFS version, the XML response will
          // be different. Here, we handle GeoServer (1.0.0 and 1.1.0) and
          // tinyOWS (1.0.0).
          if (data.indexOf('ExceptionReport') > -1 ||
              data.indexOf('ServiceExceptionReport') > -1 ||
              (data.indexOf('WFS_TransactionResponse') &&
                  data.indexOf('FAILED') > -1)) {
            return true;
          }

          return false;
        }

        function getErrorMessageFromSaveResponse(data) {
          var parser = new DOMParser();
          var document = parser.parseFromString(data, 'text/xml');
          var errorMessages = [];
          // Depending of the server and the WFS version, the XML response will
          // be different. Here, we handle GeoServer (1.0.0 and 1.1.0) and
          // tinyOWS (1.0.0).
          var messages = document.getElementsByTagName('Message');
          var serviceExceptions =
              document.getElementsByTagName('ServiceException');
          var exceptionTexts = document.getElementsByTagName('ExceptionText');

          if (messages.length > 0) {
            for (var i = 0; i < messages.length; i++) {
              errorMessages.push(messages[i].innerHTML);
            }
          } else if (serviceExceptions.length > 0) {
            for (var i = 0; i < serviceExceptions.length; i++) {
              var msgNode = serviceExceptions[i];
              errorMessages.push(msgNode.getAttribute('code') + ' ' +
                  msgNode.getAttribute('locator') + ' ' +
                  msgNode.innerHTML);
            }
          } else if (exceptionTexts.length > 0) {
            for (var i = 0; i < exceptionTexts.length; i++) {
              errorMessages.push(exceptionTexts[i].innerHTML);
            }
          } else {
            errorMessages.push($translate.instant('edit_unknown_save_error'));
          }

          return errorMessages;
        }

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

                hoverEdgeSelectedFeature = onEdge(feature, cursorCoords);
                hoverVertexSelectedFeature = onVertex(feature, cursorCoords);
              }, {
            layerFilter: layerFilter
          });

          if (hoverSelectableFeature && !scope.addingFeature) {
            mapDiv.addClass(cssPointer);
            updateSelectHelpTooltip();
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
            var hasMinNbPoints = hasFeatureEnoughPoints(drawnFeature);
            updateSelectHelpTooltip(
                'add', scope.layer.geometry, hasMinNbPoints);
          } else if (hoverSelectableFeature) {
            updateSelectHelpTooltip('select', scope.layer.geometry);
          } else if (hoverSelectedFeature) {
            var helpType;
            if (hoverVertexSelectedFeature) {
              helpType = 'modify_existing_vertex';
            } else if (hoverEdgeSelectedFeature) {
              helpType = 'modify_new_vertex';
            } else {
              helpType = 'modify';
            }
            updateSelectHelpTooltip(helpType, scope.layer.geometry);
          } else {
            // Update tooltip to 'nothing to select'.
            updateSelectHelpTooltip();
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

        function onEdge(feature, coords) {
          var featureGeom = feature.getGeometry();
          var closestPoint = featureGeom.getClosestPoint(coords);

          return closestPoint[0] === coords[0] &&
              closestPoint[1] === coords[1];
        }

        function onVertex(feature, coords) {
          var onPoint = false;

          var featureCoords = feature.getGeometry().getCoordinates();
          var featurePoints =
              getPointsList(featureCoords, scope.layer.geometry);
          featurePoints.forEach(function(point) {
            if (point[0] === coords[0] && point[1] === coords[1]) {
              onPoint = true;
            }
          });

          return onPoint;
        }

        function getPointsList(coords, geometryType) {
          switch (geometryType) {
            case 'line':
              return coords;
            case 'polygon':
              return coords[0];
            case 'point':
              return [coords];
            default:
              return coords;
          }
        }

        function hasFeatureEnoughPoints(feature) {
          if (!feature) {
            return;
          }

          var minNbPoints = MIN_NB_POINTS[scope.layer.geometry];
          var points = getPointsList(feature.getGeometry().getCoordinates());

          // We need to use a strict comparision: when we are adding a feature,
          // the position of the cursor (point not added yet) is counted among
          // the points. It means that when drawing a line, if the user has
          // only added one points, the feature has two.
          return points.length > minNbPoints;
        }

        // Taken from the draw directive.
        function removeLastPoint(event) {
          if (event.data && event.which === 46 &&
          !isInInputField(event)) {
            event.data.removeLastPoint();
          }
        }

        function isInInputField(event) {
          return /^(input|textarea)$/i.test(event.target.nodeName);
        }

        function showFeaturesPopup(feature, clickedCoords) {
          var geometry = feature.getGeometry();
          var coord = clickedCoords ?
              geometry.getClosestPoint(clickedCoords) :
              geometry.getLastCoordinate();
          var pixel = scope.map.getPixelFromCoordinate(coord);
          $rootScope.$broadcast('gf3EditFeaturesPopupShow',
              feature, scope.layer.attributes, pixel);
          // Required for the popup to display immediatly where expected.
          scope.$applyAsync();
        }

        function hideFeaturesPopup() {
          $rootScope.$broadcast('gf3EditFeaturesPopupHide');
        }


        // Register events
        scope.$on('gf3_editfeatureattrs', function() {
          scope.infos.dirty = true;
        });
      }
    };
  });
})();
