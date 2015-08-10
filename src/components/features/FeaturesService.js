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

  module.factory('gaFeaturesTable', function($window) {
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

    return {setSize: setSize};
  });
})();
