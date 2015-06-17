goog.provide('ga_share_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_permalink');
(function() {

  var module = angular.module('ga_share_directive', [
    'ga_browsersniffer_service',
    'ga_permalink'
  ]);

  module.directive('gaShare',
      function($http, $window, gaPermalink, gaBrowserSniffer) {
          return {
            restrict: 'A',
            scope: {
              options: '=gaShareOptions'
            },
            templateUrl: 'components/share/partials/share.html',
            link: function(scope, element, attrs) {
              var shortenUrl = scope.options.shortenUrl;
              scope.qrcodegeneratorPath = scope.options.qrcodegeneratorPath;
              scope.mobile = gaBrowserSniffer.mobile;

              if (!gaBrowserSniffer.mobile) {
                $('.ga-share-icon').tooltip({
                  placement: 'bottom'
                });
              }
              $('.ga-share-permalink input').on({
                focus: function() {
                  this.setSelectionRange(0, 9999);
                },
                mouseup: function(e) {
                  // prevent unselection on blur
                  e.preventDefault();
                },
                touchend: function(e) {
                  // prevent unselection on blur
                  e.preventDefault();
                }
              });
              // Store in the scope the permalink value which is bound to
              // the input field
              scope.permalinkValue = gaPermalink.getHref();
              scope.encodedPermalinkHref =
                  encodeURIComponent(gaPermalink.getHref());
              scope.encodedDocumentTitle = encodeURIComponent(document.title);
              scope.urlShortened = false;
              scope.embedValue = gaPermalink.getEmbedHref();

              // Listen to permalink change events from the scope.
              scope.$on('gaPermalinkChange', function(event) {
                scope.permalinkValue = gaPermalink.getHref();
                scope.encodedPermalinkHref =
                    encodeURIComponent(gaPermalink.getHref());
                scope.urlShortened = false;
                // assuming document.title never change
                scope.embedValue = gaPermalink.getEmbedHref();
              });

              // Function to shorten url
              // Make an asynchronous request to url shortener
              scope.shortenUrl = function() {
                $http.get(shortenUrl, {
                  params: {
                    url: scope.permalinkValue
                  }
                }).success(function(response) {
                  scope.permalinkValue = response.shorturl;
                  scope.urlShortened = true;
                });
              };

              // Select the input field on click in order to allow copy/paste
              scope.selectOnClick = function(e) {
                e.target.select();
              };
              // Set iframe size variables
              scope.$watch('iframeSize', function() {
                var maxWidth = 840;
                if (scope.iframeSize) {
                  scope.iframeWidth = scope.iframeSize[0];
                  scope.iframeHeight = scope.iframeSize[1];
                  maxWidth = scope.iframeWidth + 40;
                }
                scope.contentWidth = {
                  'max-width': maxWidth + 'px'
                };
              });

              scope.iframeSize = scope.options.iframeSizes[0].value;

              // Be able to disable some widgets on homescreen
              scope.homescreen = $window.navigator.standalone;

              // Load the content of iframe only when necessary
              var pulldown = $('#pulldown');
              element.find('.modal').on('show.bs.modal', function() {
                // TODO: remove this hack and find something cleaner
                pulldown.css('z-index', 1040);
              }).on('shown.bs.modal', function() {
                $(this).find('select').focus();
                scope.$apply(function() {
                  scope.loadIframe = true;
                });
              }).on('hidden.bs.modal', function() {
                scope.$apply(function() {
                  scope.loadIframe = false;
                });
                // TODO: remove this hack and find something cleaner
                pulldown.css('z-index', '');
              });

              // Display a preview window
              var previewWindow;
              element.find('.form-inline a').click(function() {
                if (previewWindow) {
                  previewWindow.close();
                }
                // The name of this window is used in embed.html to makes a
                // difference between the preview window and an embed page
                // not used in an iFrame.
                previewWindow = window.open(scope.embedValue, 'embed',
                    'width=' + scope.iframeWidth +
                    ', height=' + scope.iframeHeight);
              });

              // Manage minimal size
              var minSize = 200;
              element.find('.form-inline input').blur(function() {
                if (scope.iframeWidth < minSize ||
                    scope.iframeHeight < minSize) {
                  scope.$apply(function() {
                    if (scope.iframeWidth < minSize) {
                      scope.iframeWidth = minSize;
                    } else if (scope.iframeHeight < minSize) {
                      scope.iframeHeight = minSize;
                    }
                  });
                }
              });
            }
          };
        });
})();
