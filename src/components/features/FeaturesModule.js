goog.provide('gf_features');

goog.require('gf_features_directive');
(function() {

  angular.module('gf_features', [
    'gf_features_directive',
    'ui.grid',
    'ui.grid.pagination',
    'ui.grid.selection',
    'ui.grid.exporter',
    'ui.grid.moveColumns',
    'ui.grid.resizeColumns',
    'angularLoad'
  ]);
})();
