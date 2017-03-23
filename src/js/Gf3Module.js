goog.provide('gf3');

goog.require('gf3_edit');
goog.require('gf3_edit_controller');
goog.require('gf3_editfeaturespopup_controller');

(function() {
  var module = angular.module('gf3', [
    'gf3_edit',
    'gf3_edit_controller',
    'gf3_editfeaturespopup_controller'
  ]);
})();
