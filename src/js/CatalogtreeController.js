goog.provide('ga_catalogtree_controller');
(function() {

  var module = angular.module('ga_catalogtree_controller', []);

  module.controller('GaCatalogtreeController',
      function($scope) {
        $scope.options = {
          catalogUrlTemplate: '/json/catalog_{Topic}_{Lang}.json'
        };
      });
})();
