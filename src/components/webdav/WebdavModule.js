goog.provide('gf_webdav');

goog.require('gf_webdav_directive');
goog.require('gf_webdav_service');
(function() {

  angular.module('gf_webdav', [
    'gf_webdav_directive',
    'gf_webdav_service'
  ]);
})();
