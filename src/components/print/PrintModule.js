goog.provide('ga_print');

goog.require('ga_print_directive');
goog.require('ga_print_style_service');
goog.require('ngeo.CreatePrint');
goog.require('ngeo.PrintUtils');
(function() {

  angular.module('ga_print', [
    'ga_print_directive',
    'ngeo.CreatePrint',
    'ngeo.PrintUtils'
  ]);
})();

