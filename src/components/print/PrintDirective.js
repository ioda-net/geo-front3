(function() {
  goog.provide('ga_print_directive');

  goog.require('ngeo_create_print');
  goog.require('ngeo_print_utils');

  /** @const **/
  var app = {};

  /**
   * @const
   * @private
   */
  app.WMS_URL_ = 'http://mapserver.local/wms/geojb';

  /**
   * @const
   * @private
   */
  app.PRINT_URL_ = 'http://print.local';

  /**
   * @const
   * @private
   */
  app.PRINT_SCALES_ = [100, 250, 500, 2500, 5000, 10000, 25000, 50000,
    100000, 500000];

  /**
   * @const
   * @private
   */
  app.PRINT_LAYOUT_ = 'A4 landscape';

  /**
   * @const
   * @private
   */
  app.PRINT_DPI_ = 72;

  /**
   * @const
   * @private
   */
  app.PRINT_PAPER_SIZE_ = [555, 675];

  var module = angular.module('ga_print_directive',
          ['ngeo_create_print',
            'ngeo_print_utils'
          ]);

  module.controller('GaPrintDirectiveController', function($scope,
          $window, $timeout,
          ngeoCreatePrint, ngeoPrintUtils) {

    var print = ngeoCreatePrint(app.PRINT_URL_);

    $scope.submit = function() {
      var map = $scope.map;
      var mapSize = map.getSize();
      var viewResolution = map.getView().getResolution();

      // we test mapSize and viewResolution just to please the compiler
      var scale = mapSize !== undefined && viewResolution !== undefined ?
              ngeoPrintUtils.getOptimalScale(mapSize, viewResolution,
                      app.PRINT_PAPER_SIZE_, app.PRINT_SCALES_) :
              app.PRINT_SCALES_[0];

      var dpi = app.PRINT_DPI_;
      var layout = app.PRINT_LAYOUT_;

      $scope.printState = 'Printing...';

      var spec = print.createSpec(map, scale, dpi, layout, {
        'datasource': [],
        'debug': 0,
        'comments': 'My comments',
        'title': 'My print'
      });

      print.createReport(spec).then(
              handleCreateReportSuccess,
              handleCreateReportError);
    };

    function handleCreateReportSuccess(resp) {
      getStatus(resp.data.ref);
    }

    function getStatus(ref) {
      print.getStatus(ref).then(
              function(resp) {
                handleGetStatusSuccess(ref, resp);
              },
              handleGetStatusError
              );
    }

    function handleGetStatusSuccess(ref, resp) {
      var mfResp = resp.data;
      var done = mfResp.done;
      if (done) {
        $scope.printState = '';
        $window.location.href = print.getReportUrl(ref);
      } else {
        $timeout(function() {
          getStatus(ref);
        }, 1000, false);
      }
    }

    function handleGetStatusError() {
      $scope.printState = 'print error';
    }

    function handleCreateReportError() {
      $scope.printState = 'print error';
    }
  });

  module.directive('gaPrint',
          function() {
            return {
              restrict: 'A',
              templateUrl: 'components/print/partials/print.html',
              controller: 'GaPrintDirectiveController',
              link: function(scope, elt, attrs, controller) {
              }
            };
          }
  );
})();
