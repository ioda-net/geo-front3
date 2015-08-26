goog.provide('ga_webdav');

goog.require('ga_webdav_directive');
goog.require('ga_webdav_service');
(function() {

  angular.module('ga_webdav', [
    'ga_webdav_directive',
    'ga_webdav_service'
  ]);
})();
