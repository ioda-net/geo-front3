goog.provide('ga_features_service');

goog.require('ga_map_service');

(function() {
  var module = angular.module('ga_features_service', ['ga_map_service']);

  module.provider('gaDragBox', function() {
    this.$get = function(gaStyleFactory, gaBrowserSniffer) {
      var DragBox = function(map, onDragBoxEnd) {
        var dragBox, boxOverlay;
        var dragBoxStyle = gaStyleFactory.getStyle('selectrectangle');
        var boxFeature = new ol.Feature();
        var boxOverlay = new ol.FeatureOverlay({
          style: dragBoxStyle
        });
        boxOverlay.addFeature(boxFeature);

        dragBox = new ol.interaction.DragBox({
          condition: function(evt) {
            //MacEnvironments don't get here because the event is not
            //recognized as mouseEvent on Mac by the google closure.
            //We have to use the apple key on those devices
            return evt.originalEvent.ctrlKey ||
                (gaBrowserSniffer.mac && evt.originalEvent.metaKey);
          },
          style: dragBoxStyle
        });

        map.addInteraction(dragBox);

        this.hide = function() {
          boxOverlay.setMap(null);
        };

        dragBox.on('boxstart', function(evt) {
          resetGeometry();
        });

        function resetGeometry() {
          boxFeature.setGeometry(null);
        }

        dragBox.on('boxend', function(evt) {
          boxFeature.setGeometry(evt.target.getGeometry());
          var geometry = boxFeature.getGeometry();

          onDragBoxEnd(geometry);
          showBox(map);
        });

        function showBox(map) {
          boxOverlay.setMap(map);
        }
      };

      return function(map, onDragBoxEnd) {
        return new DragBox(map, onDragBoxEnd);
      };
    };
  });

  module.factory('gaFeaturesUtils', function(gaLayers) {
    return {
      isVectorLayer: isVectorLayer,
      isQueryableBodLayer: isQueryableBodLayer,
      getLayersToQuery: getLayersToQuery,
      yearFromString: yearFromString,
      clearObject: clearObject,
      hasImportedQueryableLayer: hasImportedQueryableLayer,
      hasNameOrDescription: hasNameOrDescription,
      getCoords: getCoords
    };

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
    function getLayersToQuery(map) {
      var layersToQuery = [];
      map.getLayers().forEach(function(l) {
        if (l.visible && !l.preview &&
            (isQueryableBodLayer(l) || isVectorLayer(l))) {
          layersToQuery.push(l);
        }
      });
      return layersToQuery;
    }

    function yearFromString(timestamp) {
      if (timestamp && timestamp.length) {
        timestamp = parseInt(timestamp.substr(0, 4));
        if (timestamp <= new Date().getFullYear()) {
          return timestamp;
        }
      }
    }

    function clearObject(obj) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          delete obj[key];
        }
      }
    }

    function hasImportedQueryableLayer(map, pixel) {
      var featureFound = false;
      map.forEachFeatureAtPixel(pixel, function(feature) {
        if (!featureFound && hasNameOrDescription(feature)) {
          featureFound = true;
        }
      });
      return featureFound;
    }

    function hasNameOrDescription(feature) {
      return feature.get('name') || feature.get('description');
    }

    function getCoords(geometry) {
      if (geometry instanceof ol.geom.Geometry) {
        return geometry.getExtent();
      } else {
        return geometry;
      }
    }
  });

  module.factory('gaFeaturesGrid', function($window, gaPreviewFeatures) {
    var parser = new ol.format.GeoJSON();
    var globalGridOptions = {
      enableGridMenu: true,
      enableSelectAll: true,
      exporterMenuPdf: false,
      exporterPdfPageSize: 'A4',
      exporterPdfOrientation: 'landscape',
      exporterPdfFooter: function (currentPage, pageCount) {
        return {text: currentPage.toString() + ' / ' + pageCount.toString()};
      },
      exporterCsvLinkElement:
              angular.element(
                document.querySelectorAll('.custom-csv-link-location')),
      rowTemplate: '<div ng-mouseover="grid.appScope.highlight(rowRenderIndex)" ' +
              'ng-mouseleave="grid.appScope.clearHighlight()">' +
              '<div ng-repeat="(colRenderIndex, col) in colContainer.renderedColumns track by col.uid" ' +
              'class="ui-grid-cell ng-scope ui-grid-coluiGrid-007" ' +
              'ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader }" ' +
              'ui-grid-cell="">' +
              '</div></div>'
    };

    return {
      getLayerOptions: getLayerOptions,
      setSize: setSize
    };

    function getLayerOptions(feature, featuresToDisplay, map, onRegisterApi) {
      onRegisterApi = onRegisterApi || function() {};
      var exporterCsvFilename = feature.layerId.replace(/,/g, '_') + '.csv';
      var layerGridOptions = {
        data: [],
        exporterCsvFilename: exporterCsvFilename,
        exporterPdfHeader: {
          text: feature.layerId
        },
        onRegisterApi: onRegisterApi,
        appScopeProvider: {
          highlight: function(rowIndex) {
            var geometry;
            var currentFeature = featuresToDisplay[feature.layerId][rowIndex];
            if (currentFeature instanceof ol.Feature) {
              geometry = currentFeature;
            } else {
              geometry = parser.readFeature(currentFeature);
            }
            gaPreviewFeatures.highlight(map, geometry);
          },
          clearHighlight: function() {
            gaPreviewFeatures.clearHighlight(map);
          }
        }
      };
      angular.merge(layerGridOptions, globalGridOptions);
      return layerGridOptions;
    }

    function setSize() {
      var popup = $('.ga-features-popup').parent().parent();

      $window.addEventListener('resize', function () {
        correctTableSize(popup, false);
      });
      popup.on('DOMSubtreeModified', function(evt) {
        correctTableSize(popup, true);
      });
    }

    function correctTableSize(popup, domEvent) {
      correctWith(popup);
      correctHeight(popup);
      // We must only react to DOM events on the creation of the popup. We can
      // safely deactivate afterwards.
      if (domEvent) {
        popup.off('DOMSubtreeModified', correctTableSize);
      }
    }

    function correctWith(popup) {
      // max-width on features container to always view buttons
      var table = $('.ga-features-popup .grid');
      if (table.length > 0) {
        var popupContent = popup.find('.ga-popup-content');
        var newWidth = $window.innerWidth -
                parseInt(popupContent.css('padding-left'), 10) -
                parseInt(popupContent.css('padding-right'), 10);
        table.css('width', newWidth);
      }
    }

    function correctHeight(popup) {
      // max-height on features container to scroll vertically
      // We must take into account the size of the title bar which may
      // be inserted in the DOM after this function is called.
      var table = $('.ga-features-popup .grid');
      var popupTitle = popup.find('.popover-title');
      var heightTitle = parseInt(
              popupTitle.outerHeight(), 10);
      // On some browsers (eg Firefox), the DOM will be updated
      // multiple times and the CSS may not have been applied yet.
      if (popupTitle.length > 0 && heightTitle !== 0 && table.length > 0) {
        var popupContent = popup.find('.ga-popup-content');
        var newHeight = parseInt(popup.css('height'), 10) -
                heightTitle -
                parseInt(popupContent.css('padding-top'), 10) -
                parseInt(popupContent.css('padding-bottom'), 10);
        table.css('height', newHeight);
      }
    }
  });
})();
