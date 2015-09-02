goog.provide('ga_importwmts_controller');
(function() {

  var module = angular.module('ga_importwmts_controller', []);

  module.controller('GaImportWmtsController', function($scope, gaGlobalOptions) {
    $scope.options = {
      owsType: 'WMTS',
      proxyUrl: gaGlobalOptions.ogcproxyUrl,
      defaultGetCapParams: '',
      wmtsVersion: '1.0.0',
      wmtsCap: 'WMTSCapabilities.xml',
      defaultWMSList: ['https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml']
    };
  });
})();
