goog.provide('ga_print_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_map_service');
goog.require('ngeo.Print');
goog.require('ngeo.PrintUtils');
goog.require('sigeom_plugins');
(function() {

  var module = angular.module('ga_print_directive', [
    'ngeo',
    'ga_map_service',
    'sigeom'
  ]);

  module.controller('GaPrintDirectiveController', function($scope,
          $window, $timeout, $q, gaLayers,
          ngeoCreatePrint, ngeoPrintUtils, sgPlugins) {

    $scope.printError = false;
    $scope.printConfigLoaded = false;

    var canceler;
    var print = ngeoCreatePrint($scope.options.printPath);
    var deregister = [];

    // Get print config
    var updatePrintConfig = function(data) {
      $scope.capabilities = data;
      $scope.layouts = [];

      angular.forEach($scope.capabilities.layouts, function(layout) {
        var clientInfo = layout.attributes[4].clientInfo;
        $scope.layouts.push({
          name: layout.name,
          scales: clientInfo.scales.reverse(),
          paperSize: [clientInfo.width, clientInfo.height],
          dpis: clientInfo.dpiSuggestions
        });
      });

      // default values:
      $scope.layout = $scope.layouts[0];
      $scope.dpi = $scope.layout.dpis[0];
      var mapSize = $scope.map.getSize();
      var mapResolution = $scope.map.getView().getResolution();
      $scope.scale = ngeoPrintUtils.getOptimalScale(mapSize, mapResolution,
              $scope.layout.paperSize, $scope.layout.scales);
      $scope.options.legend = false;
      $scope.options.graticule = false;

      $scope.printConfigLoaded = true;
    };

    var activate = function() {
      deregister = [
        $scope.map.on('postcompose', handlePostCompose)
      ];
      var mapSize = $scope.map.getSize();
      var viewResolution = $scope.map.getView().getResolution();
      $scope.scale = ngeoPrintUtils.getOptimalScale(mapSize, viewResolution,
          $scope.layout.paperSize, $scope.layout.scales);
      refreshComp();
    };

        // Compose events
    var handlePostCompose = ngeoPrintUtils.createPrintMaskPostcompose(
      /**
       * @return {ol.Size} Size in dots of the map to print.
       */
      function() {
        return $scope.layout.paperSize;
      },
      /**
       * @param {olx.FrameState} frameState Frame state.
       * @return {number} Scale of the map to print.
       */
      function() {
        return $scope.scale;
    });

    var refreshComp = function() {
      $scope.map.render();
    };

    var deactivate = function() {
      if (deregister) {
        for (var i = 0; i < deregister.length; i++) {
          ol.Observable.unByKey(deregister[i]);
        }
      }
      refreshComp();
    };

    var printReportTimeout;
    $scope.submit = function() {
      var map = $scope.map;
      var mapCenter = map.getView().getCenter();
      var cornerCoords = ngeoPrintUtils.getBottomLeftCorner(mapCenter);
      var coordsToPrint = 'x = ' + parseInt(cornerCoords[0], 10) + ', y = ' +
              parseInt(cornerCoords[1], 10);

      $scope.options.printing = true;
      $scope.options.printsuccess = false;

      var url = $window.location.toString();
      var legend = getLengend(map);

      if (sgPlugins.communes) {
        sgPlugins.communes(mapCenter)
                .success(doPrint)
                // If we cannot get the commune name, launch the print anyway
                .error(doPrint);
      } else {
        doPrint();
      }

      function doPrint(data) {
        // If the commune plugin is not activated, data is undefined.
        // If the commune plugin is actiaved, data.commune may be undefined (no
        // commune at given point. In this case, mapfish print expect an empty
        // string or will crash.
        var commune = (data && data.commune) ? data.commune : '';
        var spec = print.createSpec(map, $scope.scale, $scope.dpi,
          $scope.layout.name, {
            legend: legend,
            printLegend: Number($scope.options.legend),
            name: $scope.options.title,
            qrimage: $scope.options.qrcodeUrl + encodeURIComponent(url),
            url: url,
            scale: $scope.scale,
            bottomLeftCornerCoords: coordsToPrint,
            commune: commune
        });

        getGrid(spec);

        canceler = $q.defer();
        print.createReport(spec, {timeout: canceler.promise}).then(
                handleCreateReportSuccess,
                handleCreateReportError);
      }
    };

    var getLengend = function(map) {
      var legend = {};
      if ($scope.options.legend) {
        legend.classes = map.getLayers().getArray().map(function(layer) {
          var legendUrl;
          var label;
          if (layer.bodId) {
            legendUrl = gaLayers.getLayerProperty(layer.id, 'legendUrl');
            label = gaLayers.getLayerProperty(layer.id, 'label');
          }
          return {icons: [legendUrl], name: label};
        }).filter(function(legend) {
          var legendUrl = legend.icons[0];
          return legendUrl !== '' && legendUrl !== undefined;
        });
      }

      return legend;
    };

    var getGrid = function(spec) {
      if ($scope.options.grid) {
        var wmsUrl = gaLayers.getLayerProperty('grid', 'wmsUrl');
        spec.attributes.map.layers.splice(0, 0, {
          baseURL: wmsUrl,
          customParams: {TRANSPARENT: true},
          imageFormat: 'image/png',
          layers: ['grid'],
          opacity: 1,
          serverType: 'mapserver',
          type: 'WMS'
        });
      }
    };

    var handleCreateReportSuccess = function(resp) {
      getStatus(resp.data.ref);
    };

    var getStatus = function(ref) {
      canceler = $q.defer();
      print.getStatus(ref, {timeout: canceler.promise}).then(
              function(resp) {
                handleGetStatusSuccess(ref, resp);
              },
              handleGetStatusError
              );
    };

    var handleGetStatusSuccess = function(ref, resp) {
      var mfResp = resp.data;
      var done = mfResp.done;
      if (done) {
        $scope.options.printing = false;
        $scope.options.printsuccess = true;
        $window.location.href = print.getReportUrl(ref);
      } else {
        printReportTimeout = $timeout(function() {
          getStatus(ref);
        }, 1000, false);
      }
    };

    var handleGetStatusError = function() {
      handlePrintError();
    };

    var handlePrintError = function() {
      $scope.options.printsuccess = false;
      $scope.options.printing = false;
      $scope.printError = true;
    };

    var handleCreateReportError = function() {
      handlePrintError();
    };

     // Abort the print process
    $scope.abort = function() {
      $scope.options.printing = false;
      // Abort the current $http request
      if (canceler) {
        canceler.resolve();
      }
      $timeout.cancel(printReportTimeout);
    };

    // Listeners
    $scope.$on('gaLayersChange', function() {
      refreshComp();
    });
    $scope.map.on('change:size', function() {
      refreshComp();
    });
    $scope.$watch('scale', function() {
      refreshComp();
    });
    $scope.$watch('layout', function() {
      refreshComp();
    });
    $scope.$watch('active', function(newVal) {
      if (newVal === true) {
        if ($scope.printConfigLoaded) {
          activate();
        } else {
          canceler = $q.defer();
          print.getCapabilities({timeout: canceler.promise})
              .success(function(data) {
                updatePrintConfig(data);
                activate();
              }).error(handlePrintError);
        }
      } else {
        deactivate();
      }
    });
  });

  module.directive('gaPrint',
          function() {
            return {
              restrict: 'A',
              scope: {
                map: '=gaPrintMap',
                options: '=gaPrintOptions',
                active: '=gaPrintActive'
              },
              templateUrl: 'components/print/partials/print.html',
              controller: 'GaPrintDirectiveController',
              link: function(scope, elt, attrs, controller) {
              }
            };
          }
  );
})();
