(function() {
  goog.provide('ga_print');

  goog.require('ga_print_directive');
  goog.require('ga_print_style_service');
  goog.require('ngeo_create_print');
  goog.require('ngeo_print_utils');

  angular.module('ga_print', [
    'ga_print_directive',
    'ga_print_style_service',
    'ngeo_create_print',
    'ngeo_print_utils'
  ]);
})();

