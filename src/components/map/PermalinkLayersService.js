goog.provide('ga_permalinklayers_service');

goog.require('ga_filestorage_service');
goog.require('ga_kml_service');
goog.require('ga_map_service');
goog.require('ga_permalink_service');
goog.require('ga_time_service');
goog.require('ga_topic_service');
goog.require('ga_urlutils_service');
goog.require('ga_wms_service');

(function() {

  var module = angular.module('ga_permalinklayers_service', [
    'pascalprecht.translate',
    'ga_filestorage_service',
    'ga_kml_service',
    'ga_map_service',
    'ga_permalink_service',
    'ga_time_service',
    'ga_topic_service',
    'ga_urlutils_service',
    'ga_wms_service'
  ]);

  /**
   * Service that manages the "layers", "layers_opacity", and
   * "layers_visibility" permalink parameter.
   *
   * The manager works with a "layers" array. It watches the array (using
   * $watchCollection) and updates the "layers" parameter in the permalink
   * when the array changes. It also watches "opacity" and "visibility" on
   * each layer and updates the "layers_opacity" and "layers_visibility"
   * parameters as appropriate.
   *
   * And, at application init time, it adds to the map the layers specified
   * in the permalink, and the opacity and visibility of layers.
   */
  module.provider('gaPermalinkLayersManager', function() {

    this.$get = function($rootScope, gaLayers, gaPermalink, $translate, $http,
        gaKml, gaMapUtils, gaWms, gf3Wmts, gaLayerFilters, gaUrlUtils,
        gaFileStorage, gaTopic, gaGlobalOptions, $q, gaTime, $log) {

      var layersParamValue = gaPermalink.getParams().layers;
      var layersOpacityParamValue = gaPermalink.getParams().layers_opacity;
      var layersVisibilityParamValue =
          gaPermalink.getParams().layers_visibility;
      var layersTimestampParamValue =
          gaPermalink.getParams().layers_timestamp;


      var layerSpecs = layersParamValue ? layersParamValue.split(',') : [];
      var layerOpacities = layersOpacityParamValue ?
          layersOpacityParamValue.split(',') : [];
      var layerVisibilities = layersVisibilityParamValue ?
          layersVisibilityParamValue.split(',') : [];
      var layerTimestamps = layersTimestampParamValue ?
          layersTimestampParamValue.split(',') : [];

      function updateLayersParam(layers) {
        if (layers.length) {
          var layerSpecs = $.map(layers, function(layer) {
            return layer.bodId || layer.id;
          });
          gaPermalink.updateParams({
            layers: layerSpecs.join(',')
          });
        } else {
          gaPermalink.deleteParam('layers');
        }
      }

      function updateLayersOpacityParam(layers) {
        var opacityTotal = 0;
        var opacityValues = $.map(layers, function(layer) {
          var opacity = Math.round(layer.getOpacity() * 100) / 100;
          opacityTotal += opacity;
          return opacity;
        });
        if (opacityTotal === layers.length) {
          gaPermalink.deleteParam('layers_opacity');
        } else {
          gaPermalink.updateParams({
            layers_opacity: opacityValues.join(',')
          });
        }
      }

      function updateLayersVisibilityParam(layers) {
        var visibilityTotal = true;
        var visibilityValues = $.map(layers, function(layer) {
          var visibility = layer.visible;
          visibilityTotal = visibilityTotal && visibility;
          return visibility;
        });
        if (visibilityTotal === true) {
          gaPermalink.deleteParam('layers_visibility');
        } else {
          gaPermalink.updateParams({
            layers_visibility: visibilityValues.join(',')
          });
        }
      }

      function updateLayersTimestampsParam(layers) {
        var timestampTotal = false;
        var timestampValues = $.map(layers, function(layer) {
          if (layer.timeEnabled) {
            timestampTotal = true;
            if (layer.time) {
              return layer.time;
            }
          }
          return '';
        });
        if (timestampTotal) {
          gaPermalink.updateParams({
            layers_timestamp: timestampValues.join(',')
          });
        } else {
          gaPermalink.deleteParam('layers_timestamp');
        }
      }

      function isExternal(layer) {
        var id = layer.id;
        return id.indexOf('KML||') === 0 ||
            id.indexOf('WMS||') === 0 ||
            id.indexOf('WMTS||') === 0;
      }

      // Update permalink on layer's modification
      var registerLayersPermalink = function(scope, map) {
        var deregFns = [];
        scope.layers = map.getLayers().getArray();
        scope.layerFilter = gaLayerFilters.permalinked;
        scope.$watchCollection('layers | filter:layerFilter',
            function(layers) {

          updateLayersParam(layers);

          // deregister the listeners we have on each layer and register
          // new ones for the new set of layers.
          angular.forEach(deregFns, function(deregFn) { deregFn(); });
          deregFns.length = 0;

          angular.forEach(layers, function(layer) {
            if (gaMapUtils.isStoredKmlLayer(layer)) {
              deregFns.push(scope.$watch(function() {
                return layer.id;
              }, function() {
                updateLayersParam(layers);
              }));
            }
            deregFns.push(scope.$watch(function() {
              return layer.getOpacity();
            }, function() {
              updateLayersOpacityParam(layers);
            }));
            deregFns.push(scope.$watch(function() {
              return layer.visible;
            }, function() {
              updateLayersVisibilityParam(layers);
            }));
            deregFns.push(scope.$watch(function() {
              return layer.time;
            }, function() {
              updateLayersTimestampsParam(layers);
            }));

          });
        });
      };
      return function(map) {
        var scope = $rootScope.$new();
        var dupId = 0; // Use for duplicate layer
        // We must reorder layer when async layer are added
        var mustReorder = false;

        var addTopicSelectedLayers = function() {
          // if plConf is active, we get layers from there. This
          // might include opacity and visibility
          var topic = gaTopic.get();
          if (topic.plConfig) {
            var p = gaUrlUtils.parseKeyValue(topic.plConfig);
            addLayers(p.layers ? p.layers.split(',') : [],
                      p.layers_opacity ?
                          p.layers_opacity.split(',') : undefined,
                      p.layers_visibility ?
                          p.layers_visibility.split(',') : false,
                      p.layers_timestamp ?
                          p.layers_timestamp.split(',') : undefined
            );
          } else {
            addLayers(topic.selectedLayers.slice(0));
            var activatedLayers = topic.activatedLayers;
            if (activatedLayers.length) {
              addLayers(activatedLayers.slice(0), null, false);
            }
          }
        };

        var addLayers = function(layerSpecs, opacities, visibilities,
            timestamps) {
          var nbLayersToAdd = layerSpecs.length;
          angular.forEach(layerSpecs, function(layerSpec, index) {
            var layer;
            var opacity = (opacities && index < opacities.length) ?
                opacities[index] : undefined;
            var visible = (visibilities === false ||
                (angular.isArray(visibilities) &&
                visibilities[index] == 'false')) ?
                false : true;
            var timestamp = (timestamps && index < timestamps.length &&
                timestamps != '') ? timestamps[index] : '';
            var bodLayer = gaLayers.getLayer(layerSpec);
            if (bodLayer) {
              // BOD layer.
              // Do not consider BOD layers that are already in the map,
              // except for timeEnabled layers
              var isOverlay = gaMapUtils.getMapOverlayForBodId(map, layerSpec);
              // We test if timestamps exist to differentiate between topic
              // selected layers and topic activated layers (no timestamps
              // parameter defined).
              if ((bodLayer.timeEnabled && isOverlay && timestamps) ||
                  !isOverlay) {
                layer = gaLayers.getOlLayerById(layerSpec);

                // If the layer is already on the map when need to increment
                // the id.
                if (isOverlay) {
                  layer.id += '_' + dupId++;
                }
              }
              if (angular.isDefined(layer)) {
                layer.visible = visible;
                // if there is no opacity defined in the permalink, we keep
                // the default opacity of the layers
                if (opacity) {
                  layer.setOpacity(opacity);
                }
                if (layer.timeEnabled && timestamp) {
                  // If a time permalink exist we use it instead of the
                  // timestamp, only if the layer is visible.
                  if (gaTime.get() && layer.visible) {
                    timestamp = gaLayers.getLayerTimestampFromYear(layer.bodId,
                        gaTime.get());
                  }
                  layer.time = timestamp;
                }
                //map.addLayer(layer);
                map.getLayers().insertAt(0, layer);
              }

            } else if (gaMapUtils.isKmlLayer(layerSpec)) {

              // KML layer
              var url = layerSpec.replace('KML||', '');
              try {
                gaKml.addKmlToMapForUrl(map, url,
                  {
                    opacity: opacity || 1,
                    visible: visible
                  },
                  index + 1);
                mustReorder = true;
              } catch (e) {
                // Adding KML layer failed, native alert, log message?
                $log.error(e.message);
              }

            } else if (gaMapUtils.isExternalWmsLayer(layerSpec)) {

              // External WMS layer
              var infos = layerSpec.split('||');
              try {
                gaWms.addWmsToMap(map,
                  {
                    LAYERS: infos[3],
                    VERSION: infos[4] || '1.3.0'
                  },
                  {
                    url: infos[2],
                    label: infos[1],
                    opacity: opacity || 1,
                    visible: visible,
                    extent: gaGlobalOptions.defaultExtent,
                    useReprojection: (infos[5] === 'true')
                  },
                  index + 1);
              } catch (e) {
                // Adding external WMS layer failed, native alert, log message?
                $log.error(e.message);
              }
            } else if (gaMapUtils.isExternalWmtsLayer(layerSpec)) {
              var infos = layerSpec.split('||');
              $http.get(infos[3]).success(function(data) {
                try {
                  var getCapabilities =
                      new ol.format.WMTSCapabilities().read(data);
                  var layerConfig = gf3Wmts.getLayerConfigFromIdentifier(
                      getCapabilities, infos[1]);
                  layerConfig.dimensions = gf3Wmts.importDimensions(infos[2]);
                    gf3Wmts.addWmtsToMap(map, layerConfig, index + 1);
                } catch (e) {
                  // Adding external WMTS layer failed
                  console.error('Loading of external WMTS layer ' + layerSpec +
                          ' failed. ' + e);
                }
              }).error(function() {
                console.error('Loading of external WMTS layer ' + layerSpec +
                        ' failed. Failed to get capabilities from server.');
              });
            }
          });

          // When an async layer is added we must reorder correctly the layers.
          if (mustReorder) {
            var deregister2 = scope.$watchCollection(
                'layers | filter:layerFilter', function(layers) {
              if (layers.length == nbLayersToAdd) {
                deregister2();
                var hasBg = false;
                for (var i = 0, ii = map.getLayers().getLength(); i < ii; i++) {
                  var layer = map.getLayers().item(i);
                  var idx = layerSpecs.indexOf(layer.id);
                  if (i == 0 && layer.background == true) {
                    hasBg = true;
                  }
                  if (hasBg) {
                    idx = idx + 1;
                  }
                  if (i != idx) {
                    map.getLayers().remove(layer);
                    map.getLayers().insertAt(idx, layer);
                    i = (i < idx) ? i : idx;
                  }
                }
              }
            });
          }

          // Add a modifiable KML layer
          var adminId = gaPermalink.getParams().adminId;
          if (adminId) {
            gaFileStorage.getFileUrlFromAdminId(adminId).then(function(url) {
              try {
                gaKml.addKmlToMapForUrl(map, url, {
                  adminId: adminId
                });
                gaPermalink.deleteParam('adminId');
              } catch (e) {
                // Adding KML layer failed, native alert, log message?
                $log.error(e.message);
              }
            });
          }
        };

        // Add permalink layers when topics and layers config are loaded
        $q.all([gaTopic.loadConfig(), gaLayers.loadConfig()]).then(function() {
          if (!layerSpecs.length) {
            // We add topic selected layers if no layers parameters provided
            addTopicSelectedLayers();
          } else {
            // We add layers from 'layers' parameter
            addLayers(layerSpecs, layerOpacities, layerVisibilities,
                layerTimestamps);
          }

          gaTime.allowStatusUpdate = true;
          registerLayersPermalink(scope, map);
          $rootScope.$on('gaTopicChange', function() {
            // First we remove all layers that are selected
            var toDelete = [];
            angular.forEach(map.getLayers().getArray(), function(l) {
              if (gaLayerFilters.selected(l) && !isExternal(l)) {
                toDelete.push(l);
              }
            });
            angular.forEach(toDelete, function(l) {
              map.removeLayer(l);
            });
            addTopicSelectedLayers();
          });
        });
      };
    };
  });
})();
