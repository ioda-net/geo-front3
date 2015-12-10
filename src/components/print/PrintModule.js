goog.provide('gf3_print');

goog.require('gf3_print_directive');
goog.require('ngeo.CreatePrint');
goog.require('ngeo.PrintUtils');
(function() {

  angular.module('gf3_print', [
    'gf3_print_directive',
    'ngeo.CreatePrint',
    'ngeo.PrintUtils'
  ]);
})();

