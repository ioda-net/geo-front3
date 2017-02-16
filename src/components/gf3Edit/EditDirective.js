goog.provide('gf3_edit_directive');

(function() {
  var module = angular.module('gf3_edit_directive', []);

  module.directive('gf3Edit', function($document, $http, $translate,
      gaDebounce, gaBrowserSniffer) {
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

        var select;
        var deregSelectPointerEvts = [];
        var interaction;
        var snap;
        var add;

        var addedFeatures;
        var updatedFeatures;
        var deletedFeatures;

        var cssPointer = 'ga-pointer';
        var cssGrab = 'ga-grab';
        var cssGrabbing = 'ga-grabbing';
        var mapDiv = $(scope.map.getTarget());

        scope.$watch('isActive', function(active) {
          if (active) {
            select = new ol.interaction.Select({
              layers: layerFilter
            });
            if (!gaBrowserSniffer.mobile) {
              deregSelectPointerEvts = scope.map.on([
                'pointerdown',
                'pointerup',
                'pointermove'
              ], function(evt) {
                updateCursorAndTooltipsDebounced(evt);
              });
            }
            select.getFeatures().on('add', function(e) {
              e.element.on('change', function(e) {
                var feature = e.target;
                var id = feature.getId();
                // Newly added features don't have an id yet.
                if (updatedFeatures.indexOf(feature) === -1 && id) {
                  scope.infos.dirty = true;
                  updatedFeatures.push(feature);
                }
              });
            });
            select.setActive(false);
            select.setActive(true);

            interaction = new ol.interaction.Modify({
              features: select.getFeatures()
            });
            interaction.on('modifystart', function() {
              mapDiv.addClass(cssGrabbing);
            });
            interaction.on('modifyend', function() {
              mapDiv.removeClass(cssGrabbing);
            });

            snap = new ol.interaction.Snap({
              source: scope.layer.getSource()
            });

            scope.map.addInteraction(select);
            scope.map.addInteraction(interaction);
            scope.map.addInteraction(snap);

            clearModified();
          } else {
            deregSelectPointerEvts.forEach(function(item) {
              ol.Observable.unByKey(item);
            });
            select.getFeatures().clear();
            scope.map.removeInteraction(select);
            scope.map.removeInteraction(interaction);
            scope.map.removeInteraction(snap);
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
            });
            scope.map.addInteraction(add);
          } else {
            scope.map.removeInteraction(add);
          }
        });

        function clearModified() {
          addedFeatures = [];
          updatedFeatures = [];
          deletedFeatures = [];
          scope.selectedFeature = null;
          scope.infos.dirty = false;
        }

        scope.cancel = function() {
          select.getFeatures().clear();
          scope.layer.getSource().clear();
          clearModified();
        };

        scope.save = function() {
          select.getFeatures().clear();

          var serializeOptions = {
            featureNS: scope.layer.featureNS,
            featureType: scope.layer.featureType,
            srsName: scope.layer.srsName,
            featurePrefix: scope.layer.featurePrefix
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
          select.getFeatures().clear();

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
            scope.selectedFeature = null;
            scope.infos.dirty = true;
          }
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
                if (evt.type === 'pointerdown') {
                  scope.selectedFeature = feature;
                }

                if (scope.selectedFeature === feature) {
                  hoverSelectedFeature = true;
                } else {
                  hoverSelectableFeature = true;
                }
              }, {
            layerFilter: layerFilter
          }
          );

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
      }
    };
  });
})();
