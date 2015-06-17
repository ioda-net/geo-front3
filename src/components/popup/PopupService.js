goog.provide('ga_popup_service');

goog.require('ga_draggable_directive');
goog.require('ga_print_service');
(function() {

  var module = angular.module('ga_popup_service', [
    'ga_draggable_directive',
    'ga_print_service'
  ]);

  module.provider('gaPopup', function() {

    this.$get = function($compile, $rootScope, $timeout, $q, gaPrintService) {

      var Popup = function(options) {
        // Create the popup element with its content to the HTML page
        var element = angular.element(
          '<div ga-popup="toggle" ' +
               'ga-popup-options="options" ' +
               'ga-draggable=".popover-title">' +
               options.content +
          '</div>'
        );

        options.print = options.print ||
              (function() {
                var contentEl = element.find('.ga-popup-content');
                gaPrintService.htmlPrintout(contentEl.clone().html());
              });

        if (options.className) {
          element.addClass(options.className);
        }

        // Pass some popup functions for clients to be used in content
        var popup = this;
        options.close = function(evt) {
          var onCloseCallback = popup.scope.options.onCloseCallback;
          if (angular.isFunction(onCloseCallback)) {
            onCloseCallback(this);
          }
        };

        // Create scope, compile and link
        this.scope = $rootScope.$new();
        this.scope.toggle = false;
        this.scope.options = options;
        this.element = $compile(element)(this.scope);

        // Attach popup to body element
        $(document.body).append(this.element);
      };

      Popup.prototype.open = function() {
        this.scope.toggle = true;
      };

      Popup.prototype.close = function() {
        var position = this.element.position();
        this.scope.options.x = position.left;
        this.scope.options.y = position.top;
        this.scope.toggle = false;
      };

      Popup.prototype.destroy = function() {
        this.scope.$destroy();
        this.scope = null;
        this.element.remove();
        this.element = null;
      };

      Popup.prototype.print = function() {
        var self = this;
        var deferred = $q.defer();
        $timeout(function() {
          self.scope.options.print();
          deferred.resolve();
        });

        return deferred.promise;
      };

      return {
        create: function(options) {
          return new Popup(options);
        }
      };
    };
  });
})();
