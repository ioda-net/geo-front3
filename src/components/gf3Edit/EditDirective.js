goog.provide('gf3_edit_directive');

(function() {
  var module = angular.module('gf3_edit_directive', []);

  module.directive('gf3Edit', function($http, $translate) {
    return {
      restrict: 'A',
      templateUrl: 'components/gf3Edit/partials/edit.html',
      scope: {
        map: '=gf3EditMap',
        options: '=gf3EditOptions',
        layer: '=gf3EditLayer',
        isActive: '=gf3EditActive'
      },
      link: function(scope) {
        var formatWFS = new ol.format.WFS();
        var xs = new XMLSerializer();

        var select;
        var interaction;
        var snap;
        var add;

        var addedFeatures;
        var updatedFeatures;
        var deletedFeatures;

        scope.$watch('isActive', function(active) {
          if (active) {
            select = new ol.interaction.Select({
              layers: function(layer) {
                return layer === scope.layer;
              }
            });
            select.getFeatures().on('add', function(e) {
              scope.selectedFeature = e.element;
              e.element.on('change', function(e) {
                var feature = e.target;
                var id = feature.getId();
                // Newly added features don't have an id yet.
                if (updatedFeatures.indexOf(feature) === -1 && id) {
                  updatedFeatures.push(feature);
                }
              });
            });

            interaction = new ol.interaction.Modify({
              features: select.getFeatures()
            });

            snap = new ol.interaction.Snap({
              source: scope.layer.getSource()
            });

            scope.map.addInteraction(select);
            scope.map.addInteraction(interaction);
            scope.map.addInteraction(snap);

            clearModified();
          } else {
            scope.map.removeInteraction(select);
            scope.map.removeInteraction(interaction);
            scope.map.removeInteraction(snap);
            scope.addingFeature = false;
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
        }

        scope.cancel = function() {
          select.getFeatures().clear();
          scope.layer.getSource().clear();
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
          }
        };

        scope.toggleAddFeature = function() {
          scope.addingFeature = !scope.addingFeature;
        };
      }
    };
  });
})();
