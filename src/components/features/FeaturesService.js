goog.provide('ga_features_service');

(function() {
  var module = angular.module('ga_features_service', []);

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
          var geometry = boxFeature.getGeometry().getExtent();

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
})();
