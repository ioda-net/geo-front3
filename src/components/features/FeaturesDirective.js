goog.provide('gf3_features_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_debounce_service');
goog.require('ga_map_service');
goog.require('ga_popup_service');
goog.require('ga_styles_service');
goog.require('gf3_features_service');
(function() {

  var module = angular.module('gf3_features_directive', [
    'ga_debounce_service',
    'gf3_features_service',
    'ga_popup_service',
    'ga_map_service',
    'ga_styles_service',
    'pascalprecht.translate'
  ]);

  module.directive('gf3Features',
      function($timeout, $http, $q, $rootScope, $window,
          gaLayers, gaBrowserSniffer,
          gaMapClick, gaDebounce, gaPreviewFeatures, gaGlobalOptions,
          gf3DragBox, gf3FeaturesUtils, gf3FeaturesGrid, datatable) {
        var popupContent = '<div ng-repeat="htmlsnippet in options.htmls">' +
                            '<div ng-bind-html="htmlsnippet"></div>' +
                            '<div class="ga-tooltip-separator" ' +
                              'ng-show="!$last"></div>' +
                           '</div>';

        return {
          restrict: 'A',
          templateUrl: 'components/features/partials/features.html',
          scope: {
            map: '=gf3FeaturesMap',
            options: '=gf3FeaturesOptions',
            isActive: '=gf3FeaturesActive'
          },
          link: function(scope, element, attrs) {
            var featurePropertiesToDisplay = {},
                features = {},
                featuresIdToIndex = {},
                gridsOptions = {},
                map = scope.map,
                popup,
                canceler,
                currentTopic,
                parser,
                year,
                listenerKey;
            var dragBox = gf3DragBox(map, function(geometry) {
              scope.isActive = true;
              scope.$apply(function() {
                var mapRes = map.getView().getResolution();
                var mapProj = map.getView().getProjection();
                var mapSize = map.getSize();
                var mapExtent = map.getView().calculateExtent(mapSize);
                findFeatures(geometry, mapSize, mapExtent, mapProj, mapRes);
              });
            });
            gf3FeaturesGrid.init(
                map,
                features,
                featurePropertiesToDisplay,
                featuresIdToIndex);

            $rootScope.$on('$translateChangeEnd', function() {
              gf3FeaturesGrid.updateLang(gridsOptions);
            });

            parser = new ol.format.GeoJSON();

            scope.$on('gaTopicChange', function(event, topic) {
              currentTopic = topic.id;
              initTooltip();
            });

            scope.$on('gaTimeSelectorChange', function(event, currentyear) {
              year = currentyear;
            });

            scope.$on('gaTriggerTooltipRequest', function(event, data) {
              initTooltip();

              // We use $timeout to execute the showFeature when the
              // popup is correctly closed.
              $timeout(function() {
                showFeatures(data.features, null, data.nohighlight);
              }, 0);

            });

            scope.$on('gaTriggerTooltipInit', function(event) {
              initTooltip();
            });

            scope.$on('gaTriggerTooltipInitOrUnreduce', function(event) {
              if (popup && popup.scope.options.isReduced) {
                popup.close();
              } else {
                initTooltip();
              }
            });

            // Change cursor style on mouse move, only on desktop
            var updateCursorStyle = function(evt) {
              var hasQueryableLayer = false;
              if (!gaBrowserSniffer.msie || gaBrowserSniffer.msie > 10) {
                hasQueryableLayer = map.forEachLayerAtPixel(evt.pixel,
                  function() {
                    return true;
                  },
                  undefined,
                  function(layer) {
                    return gf3FeaturesUtils.isQueryableBodLayer(layer);
                  });
              }
              map.getTarget().style.cursor = (hasQueryableLayer ||
                  gf3FeaturesUtils.hasImportedQueryableLayer(map, evt.pixel)) ?
                  'pointer' : '';
            };
            var updateCursorStyleDebounced = gaDebounce.debounce(
                updateCursorStyle, 10, false, false);

            if (!gaBrowserSniffer.mobile) {
              map.on('pointermove', function(evt) {
                if (!scope.isActive) {
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
              gf3FeaturesUtils.clearObject(featurePropertiesToDisplay);
              gf3FeaturesUtils.clearObject(features);
              gf3FeaturesUtils.clearObject(featuresIdToIndex);
              gf3FeaturesUtils.clearObject(gridsOptions);
              if (scope.popupToggle) {
                $timeout(function() {
                  scope.popupToggle = false;
                });
              }

              // Clear the preview features
              gaPreviewFeatures.clear(map);

              // Remove the remove layer listener if exist
              if (listenerKey) {
                ol.Observable.unByKey(listenerKey);
              }
            }

            gaMapClick.listen(map, function(evt) {
              if (!scope.isActive) {
                return;
              }
              var mapRes = map.getView().getResolution();
              var mapProj = map.getView().getProjection();
              var mapSize = map.getSize();
              var mapExtent = map.getView().calculateExtent(mapSize);
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

              scope.$apply(function() {
                findFeatures(coordinate, mapSize, mapExtent, mapProj, mapRes);
              });
            });

            scope.$watch('isActive', function(active) {
              if (active) {
                dragBox.enable();
              } else {
                // Remove the highlighted feature when we deactivate the
                // tooltip
                initTooltip();
                // Disable the dragbox
                dragBox.disable();
              }
            });

            // Find the first feature from a vector layer
            function findVectorFeatures(coordinates, vectorLayer, geometry) {
              if (geometry instanceof Array) {
                var pixel = map.getPixelFromCoordinate(coordinates);
                return findVectorFeaturesOnPixel(pixel, vectorLayer);
              } else {
                return findVectorFeaturesInDragBox(geometry);
              }
            }

            function findVectorFeaturesInDragBox(geometry) {
              var features = [];
              map.getLayers().getArray().forEach(function(layer) {
                if (gf3FeaturesUtils.isVectorLayer(layer)) {
                  layer.getSource()
                    .getFeatures()
                    .forEach(function(feature) {
                      var featureGeometryExtent = feature.getGeometry()
                        .getExtent();
                      var geometryExtent = geometry.getExtent();

                      if (gf3FeaturesUtils.hasNameOrDescription(feature) &&
                            ol.extent.intersects(geometryExtent,
                              featureGeometryExtent)) {
                        vectorFeatureSetProperties(feature, layer);
                        features.push(feature);
                      }
                    });
                }
              });

              return features;
            }

            function vectorFeatureSetProperties(feature, layer) {
              var featureId = feature.getId() || gf3FeaturesUtils.getRandomId();
              feature.set('layerId', layer.id);
              feature.set('featureId', featureId);
            }

            function findVectorFeaturesOnPixel(pixel, vectorLayer) {
              var features = [];
              map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                if (layer && vectorLayer === layer) {
                  if (gf3FeaturesUtils.hasNameOrDescription(feature)) {
                    vectorFeatureSetProperties(feature, layer);
                    features.push(feature);
                  }
                }
              });

              return features;
            }

            // Find features for all type of layers
            function findFeatures(geometry, mapSize, mapExtent,
                mapProj, mapRes) {
              var layersToQuery = gf3FeaturesUtils.getLayersToQuery(map);
              var coordinates = gf3FeaturesUtils.getCoords(geometry);
              initTooltip();

              layersToQuery.vectorLayers.forEach(function(layerToQuery) {
                var features =
                    findVectorFeatures(coordinates, layerToQuery, geometry);
                if (features) {
                  showFeatures(features, layerToQuery.get('label'));
                }
              });

              layersToQuery.bodLayers.forEach(function(layerToQuery) {
                findQueryableLayerFeatures(coordinates, mapSize, mapExtent,
                    layerToQuery);
              });

              layersToQuery.wmsLayers.forEach(function(layerToQuery) {
                findWmsLayerFeatures(layerToQuery, geometry, mapProj, mapRes);
              });
            }

            function findQueryableLayerFeatures(coordinates, size, mapExtent,
                layerToQuery) {
              var identifyUrl = scope.options.identifyUrlTemplate
                  .replace('{Topic}', currentTopic);
              var params = angular.merge({}, scope.options.params, {
                geometry: coordinates.join(','),
                // FIXME: make sure we are passing the right dpi here.
                imageDisplay: size[0] + ',' + size[1] + ',96',
                mapExtent: mapExtent.join(','),
                tolerance: scope.options.tolerance,
                layers: 'all:' + layerToQuery.bodId
              });

              // Only timeEnabled layers use the timeInstant parameter
              if (layerToQuery.timeEnabled) {
                params.timeInstant = year ||
                    gf3FeaturesUtils.yearFromString(layerToQuery.time);
              }

              $http.get(identifyUrl, {
                timeout: canceler.promise,
                params: params
              }).success(function(features) {
                showFeatures(features.results);
              });
            }

            // Highlight the features found
            function showFeatures(foundFeatures, /* optional */ layerName) {
              if (foundFeatures && foundFeatures.length > 0) {

                // Remove the tooltip, if a layer is removed, we don't care
                // which layer. It worked like that in RE2.
                listenerKey = scope.map.getLayers().on('remove',
                  function(event) {
                    if (!event.element.preview) {
                      initTooltip();
                    }
                  }
                );

                angular.forEach(foundFeatures, function(value) {
                  displayFeature(value, layerName);
                });
                if (foundFeatures.length > 0) {
                  var seenId = [];
                  foundFeatures.forEach(function(feature) {
                    var layerId = feature.layerId || feature.get('layerId');
                    if (seenId.indexOf(layerId) === -1) {
                      var data = featurePropertiesToDisplay[layerId];
                      gridsOptions[layerId].setData(data);
                    }
                  });
                }
              }
            }

            function displayFeature(value, /* optional */ layerName) {
              if (value instanceof ol.Feature) {
                displayVectorFeature(value, layerName);
              } else {
                displayQueryableLayerFeature(value);
              }
            }

            function displayVectorFeature(value, /* optional */ layerName) {
              var feature = new ol.Feature(value.getGeometry());
              feature.layerId = value.get('layerId');
              feature.featureId = value.get('featureId');
              var name = value.get('name');

              if (name && layerName) {
                name += ' (' + layerName + ')';
              } else if (!name) {
                name = layerName;
              }

              // For features comming from a WMS, this is already set.
              feature.properties = value.properties || {
                name: name,
                description: value.get('description'),
                type: value.get('type'),
                label: value.get('featureId'),
                print: false
              };
              gaPreviewFeatures.add(map, feature);
              showPopup(feature);
            }

            // Show the popup with all features informations
            function showPopup(feature) {
              // Show popup on first result
              if (Object.keys(featurePropertiesToDisplay).length === 0) {
                if (!scope.popupToggle) {
                  initPopup(feature);
                }
              }
              if (!(feature.layerId in featurePropertiesToDisplay)) {
                initFeaturesForLayer(feature);
              }
              // Multiple layers may request the same feature table. If both
              // layers are active, a features can be return two times. We check
              // if the Ids is know. If it is, we don't add the feature again.
              var featureId = feature.featureId.toString();
              var layerId = feature.layerId;
              var addedFeaturesIds =
                  Object.keys(featuresIdToIndex[layerId]);
              if (addedFeaturesIds.indexOf(featureId) === -1) {
                featuresIdToIndex[layerId][feature.featureId] =
                  featurePropertiesToDisplay[layerId].length;
                feature.properties.layerLabel = layerId;
                featurePropertiesToDisplay[layerId].push(feature.properties);
                features[layerId].push(feature);
              }
            }

            function displayQueryableLayerFeature(value) {
              value.layerId = value.layerBodId;
              //draw feature, but only if it should be drawn
              if (isBodLayer(value.layerBodId) && value.geometry) {
                var features = parser.readFeatures(value);
                for (var i = 0, ii = features.length; i < ii; ++i) {
                  features[i].set('layerId', value.layerBodId);
                  if (!features[i].properties) {
                    features[i].properties = {};
                  }
                  angular.extend(features[i].properties, {
                    print: false
                  });
                  gaPreviewFeatures.add(map, features[i]);
                }
              }
              showPopup(value);
            }

            function isBodLayer(layerBodId) {
              var ids = [];
              if (layerBodId.indexOf(',') > -1) {
                ids = layerBodId.split(',');
              } else {
                ids.push(layerBodId);
              }

              var containsBodLayer = false;
              ids.forEach(function(id) {
                containsBodLayer = containsBodLayer || !!gaLayers.getLayer(id);
              });

              return containsBodLayer;
            }

            function initPopup(feature) {
              angular.extend(scope.options, {
                content: popupContent,
                features: featurePropertiesToDisplay,
                gridsOptions: gridsOptions
              });
              angular.extend(scope.options.popupOptions, {
                close: close
              });
              scope.popupToggle = true;
              var done = false;
              // On IE, if we try to display a grid before the grid container
              // has the proper size, the size of the columns are too small:
              // they are designed fit into the container before it has the good
              // size.
              gf3FeaturesGrid.setSize(function() {
                if (!done) {
                  scope.options.currentTab = feature.layerId;
                  done = true;
                }
              });
            }

            function findWmsLayerFeatures(layerToQuery, geometry,
                mapProj, mapRes) {
              var extent = layerToQuery.getExtent();
              geometry = geometry.getExtent ? geometry.getExtent() : geometry;
              if (extent && !ol.extent.containsCoordinate(extent,
                  geometry)) {
                return;
              }
              var source = layerToQuery.getSource();
              var sourceCoord, sourceRes,
                  sourceProj = source.getProjection();
              if (sourceProj) { // auto reprojection
                sourceRes = ol.reproj.calculateSourceResolution(sourceProj,
                    mapProj, geometry, mapRes);
                sourceCoord = ol.proj.transform(geometry, mapProj,
                    sourceProj);
              }
              var resolution =
                  getWmsLayerFeaturesResolution(geometry, sourceRes, mapRes);
              var url = source.getGetFeatureInfoUrl(
                  sourceCoord || geometry,
                  resolution,
                  sourceProj || mapProj,
                  {'INFO_FORMAT': 'text/plain'});
              if (url) {
                if (!/^https?:/.test(url)) {
                  url = $window.location.protocol + url;
                }

                url = gaGlobalOptions.ogcproxyUrl +
                    encodeURIComponent(url);
                $http.get(url, {
                  timeout: canceler.promise,
                  layer: layerToQuery
                }).then(function(response) {
                  var text = response.data;
                  if (/(Server Error|ServiceException)/.test(text)) {
                    return 0;
                  }
                  var description = '<pre>' + text + '</pre>';
                  var feature = new ol.Feature({
                    geometry: null,
                    description: description
                  });
                  feature.properties = {
                    description: description
                  };
                  feature.set('featureId', parseInt(Math.random() * 1000000));
                  feature.set('layerId', layerToQuery.id);
                  showFeatures([feature]);
                  return 1;
                });
              }
            }

            function getWmsLayerFeaturesResolution(geometry, sourceRes,
                mapRes) {
              if (geometry.length === 2) {
                return sourceRes || mapRes;
              } else {
                return Math.max(geometry[2] - geometry[0],
                  geometry[3] - geometry[1]);
              }
            }

            function initFeaturesForLayer(feature) {
              featuresIdToIndex[feature.layerId] = {};
              featurePropertiesToDisplay[feature.layerId] = [];
              features[feature.layerId] = [];
              var layerOptions = gf3FeaturesGrid.getLayerOptions(feature);
              gridsOptions[feature.layerId] = datatable(layerOptions);
            }

            function close() {
              gaPreviewFeatures.clear(map);
              dragBox.hide();
              gf3FeaturesGrid.close();
            }
          }
        };
      });
})();
