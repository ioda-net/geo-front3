goog.provide('ga_features');

goog.require('ga_features_directive');
(function() {

  angular.module('ga_features', [
    'ga_features_directive',
    'ui.grid',
    'ui.grid.pagination',
    'ui.grid.selection',
    'ui.grid.exporter',
    'ui.grid.moveColumns',
    'ui.grid.resizeColumns',
    'angularLoad'
  ]);
})();
