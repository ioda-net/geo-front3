goog.provide('ga_features_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_debounce_service');
goog.require('ga_map_service');
goog.require('ga_popup_service');
goog.require('ga_styles_service');
(function() {

  var module = angular.module('ga_features_directive', [
    'ga_debounce_service',
    'ga_popup_service',
    'ga_map_service',
    'ga_styles_service',
    'pascalprecht.translate'
  ]);

  module.directive('gaFeatures',
      function($timeout, $http, $q, $translate, $sce, $window, gaPopup, gaLayers,
          gaBrowserSniffer, gaDefinePropertiesForLayer, gaMapClick, gaDebounce,
          gaPreviewFeatures, gaStyleFactory, gaMapUtils) {
        var popupContent = '<div ng-repeat="htmlsnippet in options.htmls">' +
                            '<div ng-bind-html="htmlsnippet"></div>' +
                            '<div class="ga-tooltip-separator" ' +
                              'ng-show="!$last"></div>' +
                           '</div>';
        return {
          restrict: 'A',
          templateUrl: 'components/features/partials/features.html',
          scope: {
            map: '=gaFeaturesMap',
            options: '=gaFeaturesOptions',
            isActive: '=gaFeaturesActive'
          },
          link: function($scope, element, attrs) {
            var featuresToDisplay = {},
                propertiesNames = {},
                onCloseCB = angular.noop,
                map = $scope.map,
                popup,
                canceler,
                currentTopic,
                vector,
                vectorSource,
                parser,
                year,
                listenerKey;

            parser = new ol.format.GeoJSON();

            $window.addEventListener('resize', featuresContainerSize);

            function featuresContainerSize() {
              // max-width on features container to always view buttons
              var popupContent = $('.ga-features-popup').parent();
              var popup = popupContent.parent();
              popupContent.css('max-width', $window.innerWidth);

              // max-height on features container to scroll vertically
              // We must take into account the size of the title bar which may
              // be inserted in the DOM after this function is called.
              popup.on('DOMSubtreeModified', correctHeight);
              function correctHeight() {
                var popupTitle = popup.find('.popover-title');
                var heightTitle = parseInt(
                        popupTitle.outerHeight(), 10);
                // On some browsers (eg Firefox), the DOM will be updated
                // multiple times and the CSS may not have been applied yet.
                if (popupTitle.length > 0 && heightTitle !== 0) {
                  popup.off('DOMSubtreeModified', correctHeight);
                  var heightPop = parseInt(popup.css('height'), 10);
                  var newHeight = heightPop - heightTitle;
                  popupContent.css('max-height', newHeight);
                }
              }
            }

            $scope.$on('gaTopicChange', function(event, topic) {
              currentTopic = topic.id;
              initTooltip();
            });

            $scope.$on('gaTimeSelectorChange', function(event, currentyear) {
              year = currentyear;
            });

            $scope.$on('gaTriggerTooltipRequest', function(event, data) {
              var size = map.getSize();
              var mapExtent = map.getView().calculateExtent(size);
              initTooltip();

              // We use $timeout to execute the showFeature when the
              // popup is correctly closed.
              $timeout(function() {
                showFeatures(data.features);
                onCloseCB = data.onCloseCB;
              }, 0);

            });

            $scope.$on('gaTriggerTooltipInit', function(event) {
              initTooltip();
            });

            $scope.$on('gaTriggerTooltipInitOrUnreduce', function(event) {
              if (popup && popup.scope.options.isReduced) {
                popup.close();
              } else {
                initTooltip();
              }
            });

            // Change cursor style on mouse move, only on desktop
            var updateCursorStyle = function(evt) {
              var feature;
              var hasQueryableLayer = false;
              if (!gaBrowserSniffer.msie || gaBrowserSniffer.msie > 10) {
                hasQueryableLayer = map.forEachLayerAtPixel(evt.pixel,
                  function() {
                    return true;
                  },
                  undefined,
                  function(layer) {
                    return isQueryableBodLayer(layer);
                  });
              }
              if (!hasQueryableLayer) {
                feature = findVectorFeature(evt.pixel);
              }
              map.getTarget().style.cursor = (hasQueryableLayer || feature) ?
                  'pointer' : '';
            };
            var updateCursorStyleDebounced = gaDebounce.debounce(
                updateCursorStyle, 10, false, false);

            if (!gaBrowserSniffer.mobile) {
              map.on('pointermove', function(evt) {
                if (!$scope.isActive) {
                  return;
                }
                updateCursorStyleDebounced(evt);
              });
            }

            function initTooltip() {
               // Cancel all pending requests
              if (canceler) {
                canceler.resolve();
              }
              // Create new cancel object
              canceler = $q.defer();
              // htmls = [] would break the reference in the popup
              clearObject(featuresToDisplay);
              clearObject(propertiesNames);
              if ($scope.popupToggle) {
                $timeout(function() {
                  $scope.popupToggle = false;
                });
              }

              // Clear the preview features
              gaPreviewFeatures.clear(map);

              // Remove the remove layer listener if exist
              if (listenerKey) {
                ol.Observable.unByKey(listenerKey);
              }
            }

            function clearObject(obj) {
              for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                  delete obj[key];
                }
              }
            }

            gaMapClick.listen(map, function(evt) {
              if (!$scope.isActive) {
                return;
              }
              var size = map.getSize();
              var mapExtent = map.getView().calculateExtent(size);
              var coordinate = (evt.originalEvent) ?
                  map.getEventCoordinate(evt.originalEvent) :
                  evt.coordinate;

              // A digest cycle is necessary for $http requests to be
              // actually sent out. Angular-1.2.0rc2 changed the $evalSync
              // function of the $rootScope service for exactly this. See
              // Angular commit 6b91aa0a18098100e5f50ea911ee135b50680d67.
              // We use a conservative approach and call $apply ourselves
              // here, but we instead could also let $evalSync trigger a
              // digest cycle for us.

              $scope.$apply(function() {
                findFeatures(coordinate, size, mapExtent);
              });
            });

            $scope.$watch('isActive', function(active) {
              if (!active) {
                // Remove the highlighted feature when we deactivate the tooltip
                initTooltip();
              }
            });

            // Test if the layer is a vector layer
            function isVectorLayer(olLayer) {
              return (olLayer instanceof ol.layer.Vector ||
                  (olLayer instanceof ol.layer.Image &&
                  olLayer.getSource() instanceof ol.source.ImageVector));
            }

            // Test if the layer is a queryable bod layer
            function isQueryableBodLayer(olLayer) {
              var bodId = olLayer.bodId;
              if (bodId) {
                bodId = gaLayers.getLayerProperty(bodId, 'parentLayerId') ||
                    bodId;
              }
              return (bodId &&
                  gaLayers.getLayerProperty(bodId, 'queryable'));
            };

            // Get all the queryable layers
            function getLayersToQuery() {
              var layersToQuery = [];
              map.getLayers().forEach(function(l) {
                if (l.visible && !l.preview &&
                    (isQueryableBodLayer(l) || isVectorLayer(l))) {
                  layersToQuery.push(l);
                }
              });
              return layersToQuery;
            }

            // Find the first feature from a vector layer
            function findVectorFeature(pixel, vectorLayer) {
              var featureFound;

              map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                // vectorLayer is defined when a feature is clicked.
                // onclick
                if (layer) {
                  if (!vectorLayer || vectorLayer == layer) {
                    if (!featureFound &&
                        (feature.get('name') ||
                        feature.get('description'))) {
                      feature.set('layerId', layer.id);
                      featureFound = feature;
                    }
                  }
                }
              });
              return featureFound;
            }

            // Find features for all type of layers
            function findFeatures(coordinate, size, mapExtent) {
              var identifyUrl = $scope.options.identifyUrlTemplate
                  .replace('{Topic}', currentTopic),
                  layersToQuery = getLayersToQuery(),
                  pixel = map.getPixelFromCoordinate(coordinate);
              initTooltip();
              for (var i = 0, ii = layersToQuery.length; i < ii; i++) {
                var layerToQuery = layersToQuery[i];
                if (isVectorLayer(layerToQuery)) {
                  var feature = findVectorFeature(pixel, layerToQuery);
                  if (feature) {
                    var htmlpopup =
                      '<div class="htmlpopup-container">' +
                        '<div class="htmlpopup-header">' +
                          '<span>' + layerToQuery.label + ' &nbsp;</span>' +
                          '{{name}}' +
                        '</div>' +
                        '<div class="htmlpopup-content">' +
                          '{{descr}}' +
                        '</div>' +
                      '</div>';
                    var name = feature.get('name');
                    htmlpopup = htmlpopup.
                        replace('{{descr}}', feature.get('description') || '').
                        replace('{{name}}', (name) ? '(' + name + ')' : '');
                    feature.set('htmlpopup', htmlpopup);
                    showFeatures([feature]);
                    // Iframe communication from inside out
                    if (top != window) {
                      var featureId = feature.getId();
                      var layerBodId = layerToQuery.get('bodId');
                      if (featureId && layerBodId) {
                        window.parent.postMessage(
                            layerBodId + '#' + featureId, '*'
                        );
                      }
                    }
                  }
                } else { // queryable bod layers
                  var params = {
                    geometryType: 'esriGeometryPoint',
                    geometryFormat: 'geojson',
                    geometry: coordinate[0] + ',' + coordinate[1],
                    // FIXME: make sure we are passing the right dpi here.
                    imageDisplay: size[0] + ',' + size[1] + ',96',
                    mapExtent: mapExtent.join(','),
                    tolerance: $scope.options.tolerance,
                    layers: 'all:' + layerToQuery.bodId
                  };

                  // Only timeEnabled layers use the timeInstant parameter
                  if (layerToQuery.timeEnabled) {
                    params.timeInstant = year ||
                        yearFromString(layerToQuery.time);
                  }

                  $http.get(identifyUrl, {
                    timeout: canceler.promise,
                    params: params
                  }).success(function(features) {
                    showFeatures(features.results);
                    angular.extend(propertiesNames, features.propertiesNames);
                  });
                }
              }
            }

            // Highlight the features found
            function showFeatures(foundFeatures) {
              if (foundFeatures && foundFeatures.length > 0) {

                // Remove the tooltip, if a layer is removed, we don't care
                // which layer. It worked like that in RE2.
                listenerKey = $scope.map.getLayers().on('remove',
                  function(event) {
                    if (!event.element.preview) {
                      initTooltip();
                    }
                  }
                );

                angular.forEach(foundFeatures, function(value) {

                  if (value instanceof ol.Feature) {
                    var feature = new ol.Feature(value.getGeometry());
                    var layerId = value.get('layerId');
                    feature.set('layerId', layerId);
                    gaPreviewFeatures.add(map, feature);
                    showPopup(value.get('htmlpopup'));
                  } else {
                    //draw feature, but only if it should be drawn
                    if (gaLayers.getLayer(value.layerBodId) &&
                        gaLayers.getLayerProperty(value.layerBodId,
                                                  'highlightable')) {
                      var features = parser.readFeatures(value);
                      for (var i = 0, ii = features.length; i < ii; ++i) {
                        features[i].set('layerId', value.layerBodId);
                        gaPreviewFeatures.add(map, features[i]);
                      }
                    }

                    showPopup(value);
                  }
                });
              }
            }

            // Show the popup with all features informations
            function showPopup(feature) {
              // Show popup on first result
              if (Object.keys(featuresToDisplay).length === 0) {
                if (!$scope.popupToggle) {
                  angular.extend($scope.options, {
                    title: 'object_information',
                    content: popupContent,
                    features: featuresToDisplay,
                    propertiesNames: propertiesNames
                  });
                  $scope.popupToggle = true;
                  $scope.options.currentTab = feature.layerBodId;
                  featuresContainerSize();
                }
              }
              if (!(feature.layerBodId in featuresToDisplay)) {
                featuresToDisplay[feature.layerBodId] = [];
              }
              featuresToDisplay[feature.layerBodId].push(feature);
            }

            function yearFromString(timestamp) {
              if (timestamp && timestamp.length) {
                timestamp = parseInt(timestamp.substr(0, 4));
                if (timestamp <= new Date().getFullYear()) {
                  return timestamp;
                }
              }
            }
          }
        };
      });
})();
