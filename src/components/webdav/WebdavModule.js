goog.provide('gf3_webdav');

goog.require('gf3_webdav_directive');
goog.require('gf3_webdav_service');
(function() {

  angular.module('gf3_webdav', [
    'gf3_webdav_directive',
    'gf3_webdav_service'
  ]);
})();
