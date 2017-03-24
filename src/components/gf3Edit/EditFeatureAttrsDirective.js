goog.provide('gf3_editfeatureattrs_directive');


(function() {
  var module = angular.module('gf3_editfeatureattrs_directive', []);

  module.directive('gf3EditFeatureAttrs', function($rootScope) {
    return {
      restrict: 'A',
      templateUrl: 'components/gf3Edit/partials/editfeatureattrs.html',
      scope: {
        feature: '=gf3EditFeatureAttrs',
        attributes: '=gf3EditFeatureAttrsList'
      },
      link: function(scope) {
        scope.$watch('feature', function() {
          if (!scope.attributes) {
            return;
          }

          scope.values = {};
          for (var i = 0; i < scope.attributes.length; i++) {
            var name = scope.attributes[i].name;
            var value = scope.feature.get(name);

            // We need to respect the type of the value for type validation to
            // work with AngularJS.
            switch (scope.attributes[i].type) {
              case 'int':
                value = parseInt(value);
                break;
              case 'decimal':
                value = parseFloat(value);
                break;
            }

            scope.values[name] = value;
          }
        });

        scope.updateValue = function(name) {
          scope.feature.set(name, scope.values[name]);
          $rootScope.$broadcast('gf3_editfeatureattrs');
        };
      }
    };
  });
})();
