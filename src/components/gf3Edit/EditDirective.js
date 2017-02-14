goog.provide('gf3_edit_directive');

(function() {
  var module = angular.module('gf3_edit_directive', []);

  module.directive('gf3Edit', function() {
    return {
      restrict: 'A',
      templateUrl: 'components/gf3Edit/partials/edit.html',
      scope: {
        map: '=gf3EditMap',
        options: '=gf3EditOptions',
        layer: '=gf3EditLayer',
        isActive: '=gf3EditActive'
      },
      link: function(scope) {
      }
    };
  });
})();
