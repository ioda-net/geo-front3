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

        var updatedFeatures;
        var updatedFeaturesId;
        var deletedFeatures;
        var deletedFeaturesId;

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
                if (updatedFeaturesId.indexOf(id) === -1) {
                  updatedFeatures.push(feature);
                  updatedFeaturesId.push(id);
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
          }
        });

        function clearModified() {
          updatedFeatures = [];
          updatedFeaturesId = [];
          deletedFeatures = [];
          deletedFeaturesId = [];
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
              null, updatedFeatures, deletedFeatures, serializeOptions);
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

          var id = scope.selectedFeature.getId();
          if (updatedFeaturesId.indexOf(id) > -1) {
            var index = updatedFeaturesId.indexOf(id);
            updatedFeatures.splice(index, 1);
            updatedFeaturesId.splice(index, 1);
          }

          scope.layer.getSource().removeFeature(scope.selectedFeature);

          deletedFeatures.push(scope.selectedFeature);
          deletedFeaturesId.push(id);
          scope.selectedFeature = null;
        };
      }
    };
  });
})();
