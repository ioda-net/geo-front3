goog.provide('gf3_editfeaturespopup_controller');

(function() {

  var module = angular.module('gf3_editfeaturespopup_controller', []);

  module.controller('Gf3EditFeaturesPopupController', function($scope) {
    $scope.options = {
      title: 'edit_popup_title_feature'
    };

    $scope.$on('gf3EditFeaturesPopupShow', function(evt, feature, pixel) {
      $scope.displayed = true;
      // If the selected feature has changed, we force the popup to unreduce
      if ($scope.feature !== feature) {
        $scope.options.isReduced = false;
      }
      $scope.feature = feature;
      if (pixel) {
        $scope.options.x = pixel[0];
        $scope.options.y = pixel[1];
      }
    });

    $scope.$on('gf3EditFeaturesPopupHide', function() {
      $scope.displayed = false;
    });
  });
})();
