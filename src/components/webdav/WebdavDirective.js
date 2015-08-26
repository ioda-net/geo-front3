goog.provide('ga_webdav_directive');

(function() {
  var module = angular.module('ga_webdav_directive', []);

  module.directive('gaWebdavSaveSelect', function() {
    return {
      restrict: 'A',
      templateUrl: 'components/webdav/partials/webdavsaveselect.html',
      scope: {
        drawingSave: '=gaDrawingSave'
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
