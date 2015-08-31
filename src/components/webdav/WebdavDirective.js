goog.provide('ga_webdav_directive');

goog.require('IN');

(function() {
  var module = angular.module('ga_webdav_directive', ['IN']);

  module.directive('gaWebdavSaveSelect', function(inGlobalOptions) {
    return {
      restrict: 'A',
      templateUrl: 'components/webdav/partials/webdavsaveselect.html',
      scope: {
        drawingSave: '=gaDrawingSave'
      },
      link: function(scope) {
        scope.allowWebdav = inGlobalOptions.allowWebdav;
      }
    };
  });

  module.directive('gaWebdavConnect', function() {
    return {
      restrict: 'A',
      templateUrl: 'components/webdav/partials/webdavconnect.html',
      scope: {
        drawingSave: '=gaDrawingSave',
        webdav: '=gaWebdav'
      }
    };
  });
})();
