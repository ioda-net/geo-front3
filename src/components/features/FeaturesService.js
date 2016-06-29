goog.provide('gf3_features_service');

goog.require('ga_map_service');

(function() {
  var module = angular.module('gf3_features_service', ['ga_map_service']);

  module.provider('gf3DragBox', function() {
    this.$get = function(gaStyleFactory, gaBrowserSniffer) {
      var DragBox = function(map, onDragBoxEnd) {
        var dragBoxStyle = gaStyleFactory.getStyle('selectrectangle');
        var boxFeature = new ol.Feature();

        var collection = new ol.Collection();
        var boxOverlay = new ol.layer.Vector({
          map: map,
          source: new ol.source.Vector({
            features: collection,
            useSpatialIndex: false
          }),
          style: dragBoxStyle
        });
        boxOverlay.getSource().addFeature(boxFeature);

        var dragBox = new ol.interaction.DragBox({
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

        this.enable = function() {
          dragBox.on('boxstart', boxStart);
          dragBox.on('boxend', boxEnd);
        };

        this.disable = function() {
          dragBox.un('boxstart', boxStart);
          dragBox.un('boxend', boxEnd);
        };

        function boxStart() {
          resetGeometry();
        }

        function resetGeometry() {
          boxFeature.setGeometry(null);
        }

        function boxEnd(evt) {
          boxFeature.setGeometry(evt.target.getGeometry());
          var geometry = boxFeature.getGeometry();

          onDragBoxEnd(geometry);
          showBox(map);
        }

        function showBox(map) {
          boxOverlay.setMap(map);
        }
      };

      return function(map, onDragBoxEnd) {
        return new DragBox(map, onDragBoxEnd);
      };
    };
  });

  module.factory('gf3FeaturesUtils', function(gaLayers) {
    return {
      isVectorLayer: isVectorLayer,
      isQueryableBodLayer: isQueryableBodLayer,
      getLayersToQuery: getLayersToQuery,
      yearFromString: yearFromString,
      clearObject: clearObject,
      hasImportedQueryableLayer: hasImportedQueryableLayer,
      hasNameOrDescription: hasNameOrDescription,
      getCoords: getCoords,
      getRandomId: getRandomId
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
    }

    // Get all the queryable layers
    function getLayersToQuery(map) {
      var layersToQuery = {
        bodLayers: [],
        vectorLayers: [],
        wmsLayers: []
      };
      map.getLayers().forEach(function(l) {
        if (!l.visible || l.preview) {
          return;
        }
        if (isQueryableBodLayer(l)) {
          layersToQuery.bodLayers.push(l);
        } else if (isVectorLayer(l)) {
          layersToQuery.vectorLayers.push(l);
        } else if (l.getSource &&
            (l.getSource() instanceof ol.source.ImageWMS ||
             l.getSource() instanceof ol.source.TileWMS)) {
          layersToQuery.wmsLayers.push(l);
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
      return !!feature.get('name') || !!feature.get('description');
    }

    function getCoords(geometry) {
      if (geometry instanceof Array) {
        return geometry;
      } else {
        return geometry.getExtent();
      }
    }

    function getRandomId() {
      return Math.random().toString().split('.')[1];
    }
  });

  module.factory('gf3FeaturesGrid', function($translate, $window,
      gaPreviewFeatures, gaGlobalOptions) {
    var parser = new ol.format.GeoJSON();
    var isHiddenRegexp = /_hidden$/;
    var map,
        featuresIdToIndex,
        featurePropertiesToDisplay,
        features;
    var globalGridOptions = {
      name: 'features_datatable',
      hide: {
        active: true,
        showButton: true,
        byDefault: []
      },
      mouseevents: {
        active: true,
        overCallback: highlight,
        leaveCallback: function() {
          gaPreviewFeatures.clearHighlight(map);
        },
        clickCallback: function(line, data) {
          if (line.selected) {
            highlight(line, data);
          } else {
            clearHighlight();
          }
        }
      },
      pagination: {
        mode: 'local',
        active: true,
        numberRecordsPerPage: 5,
        numberRecordsPerPageList: [
          {number: 5, clazz: ''},
          {number: 10, clazz: ''},
          {number: 20, clazz: ''},
          {number: 30, clazz: ''}
        ]
      },
      order: {
        mode: 'local'
      },
      compact: true,
      exportCSV: {
        active: true,
        showButton: true,
        delimiter: ','
      }
    };

    var cellTemplates = {
      grudis: '<a target="grudis" href="{{cellValue}}">[G]</a>',
      hinni: '<a target="hinni" href="{{cellValue}}" ng-if="cellValue">' +
          '<img src="img/dbh.png" style="width:18px;height:18px" /></a>',
      photo: '<a target="photo" href="{{cellValue}}" ng-if="cellValue">' +
          '<img src="img/camera.png" style="width:18px;height:18px"/>' +
          '</a>',
      protocol: '<a target="protocol" href="{{\'{api}\' + cellValue}}" ' +
                    'ng-if="cellValue">' +
          '<img src="img/acroread16.png" style="width:18px;height:18px"/>' +
          '</a>',
      pdf: '<a target="pdf" href="{{cellValue}}" ng-if="cellValue">' +
          '<img src="img/acroread16.png" style="width:18px;height:18px"/>' +
          '</a>',
      url: '<div>' +
          '<a target="_blank" href="{{cellValue}}" ng-if="cellValue">' +
          '{{cellValue | translate  }}</a></div>'
    };

    return {
      init: init,
      getLayerOptions: getLayerOptions,
      setSize: setSize,
      close: close,
      updateLang: updateLang
    };

    function init(
        olmap,
        dFeatures,
        dFeaturePropertiesToDisplay,
        dFeaturesIdToIndex) {
      featuresIdToIndex = dFeaturesIdToIndex;
      featurePropertiesToDisplay = dFeaturePropertiesToDisplay;
      features = dFeatures;
      map = olmap;
    }

    function getLayerOptions(feature) {
      var layerGridOptions = {};
      angular.merge(layerGridOptions, globalGridOptions);

      layerGridOptions.name = feature.layerBodId;
      // Must initialize all columns to translate them.
      layerGridOptions.columns = [];
      Object.keys(feature.properties).forEach(function(name) {
        var cellTemplate;
        if (goog.string.endsWith(name, '_url')) {
          cellTemplate = cellTemplates.url.replace('{name}', name);
        } else {
          cellTemplate = cellTemplates[name];
        }
        if (name === 'protocol') {
          cellTemplate = cellTemplate.replace('{api}', gaGlobalOptions.apiUrl);
        }

        if (!_visible(name)) {
          layerGridOptions.hide.byDefault.push(name);
        }

        layerGridOptions.columns.push({
          header: $translate.instant(_displayName(name)),
          name: name,
          property: name,
          order: true,
          hide: true,
          render: cellTemplate
        });
      });
      return layerGridOptions;
    }

    function _visible(name) {
      return name !== 'label' &&
          !isHiddenRegexp.test(name) &&
          _isInCurrentLang(name);
    }

    function _isInCurrentLang(name) {
      var langSpecific = _isLangSpecificColumn(name);
      return !langSpecific ||
          (langSpecific && name.indexOf('_' + $translate.use()) > -1);
    }

    function _isLangSpecificColumn(name) {
      var specific = false;
      gaGlobalOptions.languages.forEach(function(lang) {
        if (name.indexOf('_' + lang) > -1) {
          specific = true;
        }
      });

      return specific;
    }

    function _displayName(name) {
      name = name.replace(isHiddenRegexp, '');
      gaGlobalOptions.languages.forEach(function(lang) {
        name = name.replace('_' + lang, '');
      });

      return name;
    }

    function setSize(cb) {
      var popup = getPopup();

      $window.addEventListener('resize', function() {
        correctTableSize(popup);
      });
      popup.on('resize', function() {
        correctTableSize(popup);
      });
      popup.on('DOMSubtreeModified', function(evt) {
        correctTableSize(popup);
        cb();
      });
    }

    function getPopup() {
      return $('.gf3-features-popup').parent().parent();
    }

    function correctTableSize(popup) {
      correctWidth(popup);
      correctHeight(popup);
    }

    function correctWidth(popup) {
      // max-width on features container to always view buttons
      var table = $('.gf3-features-popup .grid-container');
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
      var tableContainer = $('.gf3-features-popup .grid-container');
      var table = $('.gf3-features-popup .grid');
      var popupTitle = popup.find('.popover-title');
      var heightTitle = parseInt(
          popupTitle.outerHeight(), 10);
      // On some browsers (eg Firefox), the DOM will be updated
      // multiple times and the CSS may not have been applied yet.
      if (popupTitle.length > 0 && heightTitle !== 0 && table.length > 0) {
        var popupContent = popup.find('.ga-popup-content');
        var popupNav = popupContent.find('.nav');
        var newHeight = parseInt(popup.height(), 10) -
            heightTitle -
            parseInt(popupContent.css('padding-top'), 10) -
            parseInt(popupContent.css('padding-bottom'), 10) -
            parseInt(popupNav.height(), 10) - 10;
        tableContainer.css('height', newHeight);
      }
    }

    function close() {
      var popup = getPopup();
      popup.off('DOMSubtreeModified');
      popup.off('resize');
    }

    function updateLang(gridOptions) {
      for (var layer in gridOptions) {
        var datatable = gridOptions[layer];
        datatable.getColumnsConfig().forEach(function(column) {
          var name = column.name;
          column.header = $translate.instant(_displayName(name));

          if (!_visible(name) && !datatable.isHide(column.id)) {
            // Hide columns that must not be visible in the new language.
            // Note that setHideColumn toggle the hidden status.
            datatable.setHideColumn(column);
          } else if (_visible(name) && datatable.isHide(column.id)) {
            // Show columns that must be visible in the new language.
            datatable.setHideColumn(column);
          }
        });
      }
    }

    function highlight(line, data) {
      var geometry;
      var currentIndex =
          featuresIdToIndex[data.layerLabel][data.label];
      var currentFeature =
          features[data.layerLabel][currentIndex];
      if (currentFeature instanceof ol.Feature) {
        geometry = currentFeature;
      } else if (currentFeature) {
        geometry = parser.readFeature(currentFeature);
      }

      // geometry is empty for WMS features
      if (geometry) {
        gaPreviewFeatures.highlight(map, geometry);
      }
    }

    function clearHighlight() {
      gaPreviewFeatures.clearHighlight(map);
    }
  });
})();
