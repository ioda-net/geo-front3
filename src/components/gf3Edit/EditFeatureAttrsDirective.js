goog.provide('gf3_editfeatureattrs_directive');


(function() {
  var module = angular.module('gf3_editfeatureattrs_directive', []);

  module.directive('gf3EditFeatureAttrs', function() {
    return {
      restrict: 'A',
      templateUrl: 'components/gf3Edit/partials/editfeatures.html',
      scope: {
        feature: '=gf3EditFeatureAttrs'
      },
      link: function(scope) {
      }
    };
  });
})();
