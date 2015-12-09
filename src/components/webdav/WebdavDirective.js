goog.provide('gf_webdav_directive');

goog.require('gf');

(function() {
  var module = angular.module('gf_webdav_directive', ['gf']);

  module.directive('gfWebdavSaveSelect', function(gfGlobalOptions) {
    return {
      restrict: 'A',
      templateUrl: 'components/webdav/partials/webdavsaveselect.html',
      scope: {
        drawingSave: '=?gfDrawingSave'
      },
      link: function(scope) {
        scope.allowWebdav = gfGlobalOptions.allowWebdav;
      }
    };
  });

  module.directive('gfWebdavConnect', function() {
    return {
      restrict: 'A',
      templateUrl: 'components/webdav/partials/webdavconnect.html',
      scope: {
        drawingSave: '=gfDrawingSave',
        webdav: '=gfWebdav'
      }
    };
  });
})();
