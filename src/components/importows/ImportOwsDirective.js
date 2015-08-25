goog.provide('ga_importows_directive');

goog.require('ga_map_service');
goog.require('ga_urlutils_service');
(function() {

  var module = angular.module('ga_importows_directive', [
    'ga_map_service',
    'ga_urlutils_service',
    'pascalprecht.translate'
  ]);

  module.controller('GaImportOwsDirectiveController',
      function($scope, $http, $q, $translate, gaUrlUtils, gaWms, gaWmts) {

          // List of layers available in the GetCapabilities.
          // The layerXXXX properties use layer objects from the parsing of
          // a  GetCapabilities file, not ol layer object.
          $scope.layers = [];
          $scope.options.layerSelected = null; // the layer selected on click
          $scope.options.layerHovered = null;

          // copy from ImportKml
          $scope.fileUrl = null;
          $scope.userMessage = '';
          $scope.progress = 0;

          // Handle URL of WMS
          $scope.handleFileUrl = function() {
            var url = $scope.fileUrl;

            if (gaUrlUtils.isValid(url)) {

              // Append GetCapabilities default parameters
              if ($scope.options.owsType === 'WMS') {
                url =
                  gaUrlUtils.append(url, $scope.options.defaultGetCapParams);
              } else if ($scope.options.owsType === 'WMTS') {
                url += '/' + $scope.options.wmtsVersion + '/' +
                        $scope.options.wmtsCap;
              }

              // Use lang param only for admin.ch servers
              if (url.indexOf('admin.ch') > 0) {
                url = gaUrlUtils.append(url, 'lang=' + $translate.use());
              }

              // Kill the current uploading
              $scope.cancel();

              var proxyUrl = $scope.options.proxyUrl + encodeURIComponent(url);
              $scope.error = false;
              $scope.userMessage = $translate.instant('uploading_file');
              $scope.progress = 0.1;
              $scope.canceler = $q.defer();

              // Angularjs doesn't handle onprogress event
              $http.get(proxyUrl, {timeout: $scope.canceler.promise})
              .success(function(data, status, headers, config) {
                $scope.userMessage = $translate.instant('upload_succeeded');
                $scope.displayFileContent(data);
              })
              .error(function(data, status, headers, config) {
                $scope.error = true;
                $scope.userMessage = $translate.instant('upload_failed');
                $scope.progress = 0;
                $scope.layers = [];
              });
            } else {
              $scope.error = true;
              $scope.userMessage = $translate.instant('drop_invalid_url');
            }
          };

          // Display the list of layers available from the GetCapabilties in the
          // table
          $scope.displayFileContent = function(data) {
            $scope.userMessage = $translate.instant('parsing_file');
            $scope.progress = 80;
            $scope.layers = [];
            $scope.options.layerSelected = null;
            $scope.options.layerHovered = null;

            try {
              if ($scope.options.owsType === 'WMS') {
                displayWmsFileContent(data);
              } else if ($scope.options.owsType === 'WMTS') {
                displayWmtsFileContent(data);
              }

              $scope.userMessage = $translate.instant('parse_succeeded');
              $scope.progress += 20;

            } catch (e) {
              $scope.error = true;
              $scope.userMessage = $translate.instant('parse_failed') +
                                   ' ' + e.message;
              $scope.progress = 0;
            }
          };

          function displayWmsFileContent(data) {
            var result = new ol.format.WMSCapabilities().read(data);
            $scope.userMessage = (result.Service.MaxWidth) ?
                $translate.instant('wms_max_size_allowed') + ' ' +
                  result.Service.MaxWidth +
                  ' * ' + result.Service.MaxHeight : '';

            if (result.Capability.Layer) {
              var root = getChildLayers(result.Capability.Layer,
                  $scope.map.getView().getProjection().getCode(),
                  result.version);
              if (root) {
                $scope.layers = root.Layer;
              }
            }
          }

          function displayWmtsFileContent(data) {
            var result = new ol.format.WMTSCapabilities().read(data);
            $scope.userMessage = '';
            var tileMatrixSetToCrs = {};
            for (var i = 0; i < result.Contents.TileMatrixSet.length; i++) {
              var set = result.Contents.TileMatrixSet[i];
              tileMatrixSetToCrs[set['Identifier']] = set['SupportedCRS'];
            }

            if (result.Contents) {
              var root = getChildLayers(result.Contents,
                $scope.map.getView().getProjection().getCode(),
                result.version, tileMatrixSetToCrs);
              if (root) {
                $scope.layers = root.Layer;
              }
            }
          }

          // copy from ImportKml
          $scope.cancel = function() {
            $scope.userMessage = $translate.instant('operation_canceled');
            $scope.progress = 0;

            // Kill $http request
            if ($scope.canceler) {
              $scope.canceler.resolve();
            }
          };

          // Add a layer from GetCapabilities object to the map
          $scope.addLayer = function(getCapLayer) {
            if (getCapLayer) {
              try {
                var olLayer;
                if ($scope.options.owsType === 'WMS') {
                  olLayer = gaWms.getOlLayerFromGetCapLayer(getCapLayer);
                } else if ($scope.options.owsType === 'WMTS') {
                  olLayer = gaWmts.getOlLayerFromGetCapLayer(getCapLayer);
                }
                if (olLayer) {
                  $scope.map.addLayer(olLayer);
                }
                return olLayer;

              } catch (e) {
                $scope.userMessage = $translate.instant(
                                     'add_wms_layer_failed') + e.message;
                return null;
              }
            }
          };

          // Add the selected layer to the map
          $scope.addLayerSelected = function() {
            if ($scope.options.layerSelected) {
              var layerAdded = $scope.addLayer($scope.options.layerSelected,
                  /* isPreview */ false);

              if (layerAdded) {
                $scope.userMessage = $translate.instant(
                                      'add_wms_layer_succeeded');
              }

              alert($scope.userMessage);
            }
          };

          // Get the abstract to display in the text area
          $scope.getAbstract = function() {
            var l = $scope.options.layerSelected ||
                $scope.options.layerHovered || {};
            return ((l.isInvalid) ? $translate.instant(l.Abstract) :
                                    l.Abstract) || '';
          };

          // Test if the layer can be displayed with a specific projection
          var canUseProj = function(layer, projCode, tileMatrixSetToCrs) {
            var projCodeList = '';
            if ($scope.options.owsType === 'WMS') {
              projCodeList = layer.CRS || layer.SRS;
            } else if ($scope.options.owsType === 'WMTS' &&
                    layer.TileMatrixSetLink) {
              var setId = layer.TileMatrixSetLink[0].TileMatrixSet;
              projCodeList = tileMatrixSetToCrs[setId];
            }
            // If no proj code list available we assume the layer can be
            // displayed, used for wms 1.1.1 until the PR
            // https://github.com/openlayers/ol3/pull/2944 is finished.
            return (!projCodeList ||
                projCodeList.indexOf(projCode.toUpperCase()) !== -1 ||
                projCodeList.indexOf(projCode.toLowerCase()) !== -1);
          };

          // Go through all layers, assign needed properties,
          // and remove useless layers (no name or bad crs without childs)
          var getChildLayers = function(layer, projCode, owsVersion,
              tileMatrixSetToCrs) {

            // If projCode is undefined that means the parent layer can be
            // displayed with the current map projection, since it's an herited
            // property no need to test again.
            if (projCode) {
              if (!canUseProj(layer, projCode, tileMatrixSetToCrs)) {
                layer.isInvalid = true;
                layer.Abstract = 'layer_invalid_no_crs';
              } else {
                projCode = undefined;
              }
            }

            // If the WMS layer has no name, it can't be displayed
            if ((!layer.Name && $scope.options.owsType === 'WMS') ||
                  (!layer.Title && $scope.options.owsType === 'WMTS')) {
              layer.isInvalid = true;
              layer.Abstract = 'layer_invalid_no_name';
            }

            if (!layer.isInvalid && $scope.options.owsType === 'WMS') {
              layer.wmsUrl = $scope.fileUrl;
              layer.wmsVersion = owsVersion;
              layer.id = 'WMS||' + layer.wmsUrl + '||' + layer.Name;
              layer.extent = getLayerExtentFromGetCap(layer);
            } else if (!layer.isInvalid && $scope.options.owsType === 'WMTS') {
              layer.wmtsCapabilityUrl = $scope.fileUrl;
              layer.wmtsTemplateUrl = layer.ResourceURL[0].template;
              layer.wmtsVersion = owsVersion;
              layer.dimensions = getDimensions(layer);
              layer.id = 'WMTS||' + layer.Title + '||' +
                  gaWmts.formatDimensions(layer.dimensions) +
                  '||' + layer.wmtsTemplateUrl;
              layer.extent = layer.WGS84BoundingBox;
            }

            // Go through the child to get valid layers
            if (layer.Layer) {

              for (var i = 0; i < layer.Layer.length; i++) {
                var l = getChildLayers(layer.Layer[i], projCode, owsVersion,
                  tileMatrixSetToCrs);
                if (!l) {
                  layer.Layer.splice(i, 1);
                  i--;
                }
              }

              // No valid child
              if (layer.Layer.length === 0) {
                layer.Layer = undefined;
              }
            }

            if (layer.isInvalid && !layer.Layer) {
              return undefined;
            }

            return layer;
          };

          // Get the layer extent defines in the GetCapabilities
          var getLayerExtentFromGetCap = function(getCapLayer) {
            var layer = getCapLayer;
            var projCode = $scope.map.getView().getProjection().getCode();

            if (layer.BoundingBox) {
              for (var i = 0, ii = layer.BoundingBox.length; i < ii; i++) {
                var bbox = layer.BoundingBox[i];
                var code = bbox.crs || bbox.srs;
                if (code && code.toUpperCase() == projCode.toUpperCase()) {
                  return bbox.extent;
                }
              }
            }
            var extent = layer.EX_GeographicBoundingBox ||
                layer.LatLonBoundingBox;
            if (extent) {
              return ol.proj.transformExtent(extent, 'EPSG:4326', projCode);
            }
         };

         var getDimensions = function(getCapLayer) {
          if (getCapLayer.Dimension && getCapLayer.Dimension.Identifier) {
            var dimensions = {};
            dimensions[getCapLayer.Dimension.Identifier] =
              getCapLayer.Dimension.Default;
            return dimensions;
          }
        };
  });

  module.controller('GaImportOwsItemDirectiveController', function($scope,
      $translate, gaPreviewLayers) {

    // Add preview layer
    $scope.addPreviewLayer = function(evt, getCapLayer) {
      evt.stopPropagation();
      $scope.options.layerHovered = getCapLayer;
      if (getCapLayer.isInvalid) {
        return;
      }
      if ($scope.options.owsType === 'WMS') {
        gaPreviewLayers.addGetCapWMSLayer($scope.map, getCapLayer);
      } else if ($scope.options.owsType === 'WMTS') {
        gaPreviewLayers.addGetCapWMTSLayer($scope.map, getCapLayer);
      }
    };

    // Remove preview layer
    $scope.removePreviewLayer = function(evt) {
      evt.stopPropagation();
      $scope.options.layerHovered = null;
      gaPreviewLayers.removeAll($scope.map);
    };

    // Select the layer clicked
    $scope.toggleLayerSelected = function(evt, getCapLayer) {
      evt.stopPropagation();

      $scope.options.layerSelected = ($scope.options.layerSelected &&
          $scope.options.layerSelected.Name == getCapLayer.Name) ?
          null : getCapLayer;
    };
  });

  module.directive('gaImportOwsItem', function($compile) {

    /**** UTILS functions ****/
    // from OL2
    //TO FIX: utils function to get scale from an extent, should be
    //elsewhere?
    var getScaleFromExtent = function(view, extent, mapSize) {
      // Constants get from OpenLayers 2, see:
      // https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Util.js
      //
      // 39.37 INCHES_PER_UNIT
      // 72 DOTS_PER_INCH
      return view.getResolutionForExtent(extent, mapSize) *
          39.37 * 72;
    };

    // Zoom to layer extent
    var zoomToLayerExtent = function(layer, map) {
      var extent = layer.extent;
      var view = map.getView();
      var mapSize = map.getSize();

      // If a minScale is defined
      if (layer.MaxScaleDenominator && extent) {

        // We test if the layer extent specified in the
        // getCapabilities fit the minScale value.
        var layerExtentScale = getScaleFromExtent(view, extent, mapSize);

        if (layerExtentScale > layer.MaxScaleDenominator) {
          var layerExtentCenter = ol.extent.getCenter(extent);
          var factor = layerExtentScale / layer.MaxScaleDenominator;
          var width = ol.extent.getWidth(extent) / factor;
          var height = ol.extent.getHeight(extent) / factor;
          extent = [
            layerExtentCenter[0] - width / 2,
            layerExtentCenter[1] - height / 2,
            layerExtentCenter[0] + width / 2,
            layerExtentCenter[1] + height / 2
          ];

          var res = view.constrainResolution(
              view.getResolutionForExtent(extent, mapSize), 0, -1);
          view.setCenter(layerExtentCenter);
          view.setResolution(res);
          return;
        }
      }

      if (extent) {
        view.fitExtent(extent, mapSize);
      }
    };

    return {
      restrict: 'A',
      templateUrl: 'components/importows/partials/importows-item.html',
      controller: 'GaImportOwsItemDirectiveController',
      compile: function(tEl, tAttr) {
        var contents = tEl.contents().remove();
        var compiledContent;
        return function(scope, iEl, iAttr, controller) {
          if (!compiledContent) {
            compiledContent = $compile(contents);
          }
          compiledContent(scope, function(clone, scope) {
            iEl.append(clone);
          });

          var headerGroup = iEl.find('> .ga-header-group');
          var toggleBt = headerGroup.find('.icon-plus');
          var childGroup;

          headerGroup.find('.icon-zoom-in').on('click', function(evt) {
            evt.stopPropagation();
            zoomToLayerExtent(scope.layer, scope.map);
          });

          toggleBt.on('click', function(evt) {
            evt.stopPropagation();
            toggleBt.toggleClass('icon-minus');
            if (!childGroup) {
              childGroup = iEl.find('> .ga-child-group');
            }
            childGroup.slideToggle();
          });
        };
      }
    };
  });

  module.directive('gaImportOws',
      function($http, $translate, $rootScope) {
          return {
            restrict: 'A',
            templateUrl: 'components/importows/partials/importows.html',
            scope: {
              map: '=gaImportOwsMap',
              options: '=gaImportOwsOptions'
            },
            controller: 'GaImportOwsDirectiveController',
            link: function(scope, elt, attrs, controller) {

              // Create the typeAhead input for the list of WMSs available
              var taElt = elt.find('input[name=url]').typeahead({
                local: scope.options.defaultWMSList,
                limit: 500

              }).on('typeahead:initialized', function(evt) {
                // Re-initialize the list of suggestions
                initSuggestions();

              }).on('typeahead:selected', function(evt, datum) {

                // When a WMS is selected in the list, start downloading the
                // GetCapabilities
                scope.error = false;
                scope.fileUrl = datum.value;
                scope.handleFileUrl();
                scope.$digest();
                // Re-initialize the list of suggestions
                initSuggestions();
              });


              // Toggle list of suggestions
              elt.find('.ga-import-ows-open').on('click', function(evt) {
                elt.find('.tt-dropdown-menu').toggle();
                // Re-initialize the list of suggestions
                initSuggestions();
              });

              $rootScope.$on('$translateChangeEnd', function() {
                if (scope.fileUrl) {
                  scope.handleFileUrl();
                }
              });

              // Fill the list of suggestions with all the data
              var initSuggestions = function() {
                var taView = $(taElt).data('ttView');
                var dataset = taView.datasets[0];
                dataset.getSuggestions('http', function(suggestions) {
                  taView.dropdownView.renderSuggestions(dataset, suggestions);
                });
              };
            }
          };
        }
  );
})();

