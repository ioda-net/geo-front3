goog.provide('ga_importwmts_controller');
(function() {

  var module = angular.module('ga_importwmts_controller', []);

  module.controller('GaImportWmtsController', function($scope, gaGlobalOptions) {
    var defaultWmtsList = [
      'https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml'
    ];

    $scope.options = {
      owsType: 'WMTS',
      proxyUrl: gaGlobalOptions.ogcproxyUrl,
      defaultGetCapParams: '',
      wmtsVersion: '1.0.0',
      wmtsCap: 'WMTSCapabilities.xml',
      defaultOWSList: gaGlobalOptions.wmtsList !== undefined ?
          gaGlobalOptions.wmtsList : defaultWmtsList
    };
  });
})();
