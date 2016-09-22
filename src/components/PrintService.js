goog.provide('gf3_print_service');
(function() {

  var module = angular.module('gf3_print_service', [
    'pascalprecht.translate'
  ]);

  module.provider('gf3PrintService', function() {
    var windowPrint;

    var buildHtml = function(body, head) {
      var html = '';
      html += '<html><head>';
      html += head || '';
      html += getStylesheetString();
      html += '</head><body onload="window.opener.printOnLoad(window);">';
      html += body;
      html += '</body></html>';
      return html;
    };

    var getStylesheetString = function() {
      var cssLink = $('link[href*="app.css"]').attr('href');
      return '<link href="' + cssLink + '" rel="stylesheet" type="text/css">';
    };

    this.$get = function($window, $translate) {
      var Print = function() {
        this.htmlPrintout = function(body, head, onLoad) {
          $window.printOnLoad = onLoad || function(windowPrint) {
            windowPrint.print();
          };
          if (windowPrint) {
            windowPrint.close();
          }
          windowPrint = $window.open('', 'printout', 'height=400, width=600');
          if (!windowPrint) {
            $window.alert($translate.instant('popup_blocked'));
            return;
          }
          windowPrint.document.write(buildHtml(body, head));
          windowPrint.document.close();
        };
      };
      return new Print();
    };
  });
})();
