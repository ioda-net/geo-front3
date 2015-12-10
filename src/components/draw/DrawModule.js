goog.provide('ga_draw');

goog.require('ga_draw_directive');
goog.require('gf3_webdav_service');
(function() {

  angular.module('ga_draw', [
    'ga_draw_directive',
    'gf3_webdav_service'
  ]);
})();
