goog.provide('gf3_edit');

goog.require('gf3_edit_directive');
goog.require('gf3_edit_save_service');
goog.require('gf3_editfeatureattrs_directive');

(function() {
  angular.module('gf3_edit', [
    'gf3_edit_directive',
    'gf3_edit_save_service',
    'gf3_editfeatureattrs_directive'
  ]);
})();
