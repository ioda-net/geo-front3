goog.provide('gf3_features_service');

goog.require('ga_map_service');

(function() {
  var module = angular.module('gf3_features_service', ['ga_map_service']);

  module.provider('gf3DragBox', function() {
    this.$get = function(gaStyleFactory, gaBrowserSniffer) {
      var DragBox = function(map, onDragBoxEnd) {
        var dragBox, boxOverlay;
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
      uiGridConstants, gaPreviewFeatures, gaGlobalOptions) {
    var parser = new ol.format.GeoJSON();
    var isHiddenRegexp = /_hidden$/;
    var globalGridOptions = {
      enableGridMenu: true,
      enableSelectAll: true,
      exporterHeaderFilter: $translate.instant,
      exporterMenuPdf: false,
      exporterPdfPageSize: 'A4',
      exporterPdfOrientation: 'landscape',
      gridMenuTitleFilter: $translate,
      exporterPdfFooter: function(currentPage, pageCount) {
        return {text: currentPage.toString() + ' / ' + pageCount.toString()};
      },
      exporterCsvLinkElement:
              angular.element(
                document.querySelectorAll('.custom-csv-link-location')),
      rowTemplate: '<div ng-mouseover="grid.appScope.highlight(row)" ' +
              'ng-mouseleave="grid.appScope.clearHighlight()">' +
              '<div ' +
                'ng-repeat="(colRenderIndex, col) in ' +
                  'colContainer.renderedColumns track by col.uid" ' +
              'class="ui-grid-cell ng-scope ui-grid-coluiGrid-007" ' +
              'ng-class="{ \'ui-grid-row-header-cell\': col.isRowHeader }" ' +
              'ui-grid-cell="">' +
              '</div></div>',
      onRegisterApi: function(gridApi) {
        gridApi.core.on.renderingComplete(null, function() {
          $('.gf3-features-popup').trigger('resize');
        });
      }
    };

    var cellTemplates = {
      grudis: '<div class="ui-grid-cell-contents" title="TOOLTIP">' +
          '<a target="grudis" href="{{COL_FIELD}}">[G]</a></div>',

      hinni: '<div class="ui-grid-cell-contents" title="TOOLTIP">' +
          '<a ng-if="COL_FIELD.length>0" target="hinni" href="{{COL_FIELD}}">' +
          '<img src="img/dbh.png" style="width:18px;height:18px" /></a></div>',

      photo: '<div class="ui-grid-cell-contents" title="TOOLTIP">' +
          '<a ng-if="COL_FIELD.length>0" target="photo" href="{{COL_FIELD}}">' +
          '<img src="img/camera.png" style="width:18px;height:18px"/>' +
          '</a></div>',

      protocol: '<div class="ui-grid-cell-contents" title="TOOLTIP">' +
          '<a target="protocol" href="{{\'{api}\' + COL_FIELD}}">' +
          '<img src="img/acroread16.png" style="width:18px;height:18px"/>' +
          '</a></div>',

      pdf: '<div class="ui-grid-cell-contents" title="TOOLTIP">' +
          '<a target="pdf" href="{{COL_FIELD}}">' +
          '<img src="img/acroread16.png" style="width:18px;height:18px"/>' +
          '</a></div>',

      url: '<div class="ui-grid-cell-contents" title="TOOLTIP">' +
          '<a target="_blank" href="{{COL_FIELD}}">' +
          '{{COL_FIELD CUSTOM_FILTERS}}</a></div>'
    };

    return {
      getLayerOptions: getLayerOptions,
      setSize: setSize,
      close: close,
      updateLang: updateLang
    };

    function getLayerOptions(feature, featuresToDisplay, featuresIdToIndex,
        map, onRegisterApi) {
      onRegisterApi = onRegisterApi || function() {};
      var exporterCsvFilename = feature.layerId.replace(/,/g, '_') + '.csv';
      var layerGridOptions = {
        data: [],
        exporterCsvFilename: exporterCsvFilename,
        exporterPdfHeader: {
          text: feature.layerId
        },
        appScopeProvider: {
          highlight: function(row) {
            var geometry;
            var currentIndex =
                featuresIdToIndex[feature.layerId][row.entity.label];
            var currentFeature =
                featuresToDisplay[feature.layerId][currentIndex];
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
      // To be able to print, we must execute the onRegisterApi function from
      // passed as argument. For the size of the feature table to be correct on
      // Internet Explorer, we must call globalGridOptions.onRegisterApi.
      layerGridOptions.onRegisterApi = function(gridApi) {
        onRegisterApi(gridApi);
        globalGridOptions.onRegisterApi(gridApi);
      };

      // Must initialize all columns to translate them.
      layerGridOptions.columnDefs = [];
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
        layerGridOptions.columnDefs.push({
          field: name,
          name: name,
          displayName: _displayName(name),
          visible: _visible(name),
          headerCellFilter: 'translate',
          cellFilter: 'translate',
          cellTemplate: cellTemplate
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
                parseInt(popupNav.height(), 10);
        table.css('height', newHeight);
        tableContainer.css('height', newHeight);
      }
    }

    function close() {
      var popup = getPopup();
      popup.off('DOMSubtreeModified');
      popup.off('resize');
    }

    function updateLang(gridApi, gridOptions) {
      for (var layer in gridOptions) {
        gridOptions[layer].columnDefs.forEach(function(columnDef) {
          columnDef.visible = _visible(columnDef.name);
        });
      }
      gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
    }
  });
})();
