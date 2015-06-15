(function() {
  goog.provide('ga_catalogtree_controller');

  var module = angular.module('ga_catalogtree_controller', []);

  module.controller('GaCatalogtreeController',
      function($scope, gaGlobalOptions) {
        $scope.options = {
          catalogUrlTemplate: '/json/' + gaGlobalOptions.portalName + '/catalog_{Topic}.json'
        };
      });
})();
