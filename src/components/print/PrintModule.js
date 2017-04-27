goog.provide('gf3_print');

goog.require('gf3Ngeo.CreatePrint');
goog.require('gf3Ngeo.PrintUtils');
goog.require('gf3_print_directive');
(function() {

  angular.module('gf3_print', [
    'gf3_print_directive',
    'gf3Ngeo.CreatePrint',
    'gf3Ngeo.PrintUtils'
  ]);
})();

