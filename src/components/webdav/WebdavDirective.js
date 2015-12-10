goog.provide('gf3_webdav_directive');

goog.require('gf3');

(function() {
  var module = angular.module('gf3_webdav_directive', ['gf3']);

  module.directive('gf3WebdavSaveSelect', function(gf3GlobalOptions) {
    return {
      restrict: 'A',
      templateUrl: 'components/webdav/partials/webdavsaveselect.html',
      scope: {
        drawingSave: '=?gf3DrawingSave'
      },
      link: function(scope) {
        scope.allowWebdav = gf3GlobalOptions.allowWebdav;
      }
    };
  });

  module.directive('gf3WebdavConnect', function() {
    return {
      restrict: 'A',
      templateUrl: 'components/webdav/partials/webdavconnect.html',
      scope: {
        drawingSave: '=gf3DrawingSave',
        webdav: '=gf3Webdav'
      }
    };
  });
})();
