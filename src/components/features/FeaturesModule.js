goog.provide('gf3_features');

goog.require('gf3_features_directive');
(function() {

  angular.module('gf3_features', [
    'gf3_features_directive',
    'ui.grid',
    'ui.grid.pagination',
    'ui.grid.selection',
    'ui.grid.exporter',
    'ui.grid.moveColumns',
    'ui.grid.resizeColumns',
    'angularLoad'
  ]);
})();
