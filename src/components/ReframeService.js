goog.provide('ga_reframe_service');

(function() {

  var module = angular.module('ga_reframe_service', []);
  /**
   * Service to transform coordinates from lv03 to lv95 and vice-versa.
   *
   */
  module.provider('gaReframe', function() {
    this.$get = function($q, $http, gaGlobalOptions) {

      var lv03tolv95Url = gaGlobalOptions.lv03tolv95Url;
      var lv95tolv03Url = gaGlobalOptions.lv95tolv03Url;
      var defaultToSecondaryEpsgUrl =
          gaGlobalOptions.defaultToSecondaryEpsgUrl;
      var secondaryToDefaultEpsgUrl =
          gaGlobalOptions.secondaryToDefaultEpsgUrl;

      var Reframe = function() {
        this.get03To95 = function(coordinates, timeout) {
          var defer = $q.defer();
          $http.get(lv03tolv95Url, {
            params: {
              easting: coordinates[0],
              northing: coordinates[1]
            },
            timeout: timeout
          }).then(function(response) {
            defer.resolve(response.data.coordinates);
          }, function(response) {
            if (response.status == -1) { // cancel
              defer.reject();
            } else {
              defer.resolve(ol.proj.transform(coordinates,
                  'EPSG:21781', 'EPSG:2056'));
            }
          });
          return defer.promise;
        };

        this.get95To03 = function(coordinates, timeout) {
          var defer = $q.defer();
          $http.get(lv95tolv03Url, {
            params: {
              easting: coordinates[0],
              northing: coordinates[1]
            },
            timeout: timeout
          }).then(function(response) {
            defer.resolve(response.data.coordinates);
          }, function(response) {
            if (response.status == -1) { // cancel
              defer.reject();
            } else {
              // Use proj4js on error
              defer.resolve(ol.proj.transform(coordinates,
                  'EPSG:2056', 'EPSG:21781'));
            }
          });
          return defer.promise;
        };

        this.getDefaultToSecondary = function(coordinates) {
          var defer = $q.defer();
          if (defaultToSecondaryEpsgUrl) {
            $http.get(defaultToSecondaryEpsgUrl, {
              params: {
                easting: coordinates[0],
                northing: coordinates[1]
              }
            }).then(function(response) {
              defer.resolve(response.data.coordinates);
            }, function() {
              // Use proj4js on error
              defer.resolve(ol.proj.transform(coordinates,
                  gaGlobalOptions.defaultEpsg, gaGlobalOptions.secondaryEpsg));
            });
          } else {
            defer.resolve(ol.proj.transform(coordinates,
                gaGlobalOptions.defaultEpsg, gaGlobalOptions.secondaryEpsg));
          }

          return defer.promise;
        };

        this.getSecondaryToDefault = function(coordinates) {
          var defer = $q.defer();
          if (secondaryToDefaultEpsgUrl) {
            $http.get(secondaryToDefaultEpsgUrl, {
              params: {
                easting: coordinates[0],
                northing: coordinates[1]
              }
            }).then(function(response) {
              defer.resolve(response.data.coordinates);
            }, function() {
              // Use proj4js on error
              defer.resolve(ol.proj.transform(coordinates,
                  gaGlobalOptions.secondaryEpsg, gaGlobalOptions.defaultEpsg));
            });
          } else {
            defer.resolve(ol.proj.transform(coordinates,
                gaGlobalOptions.secondaryEpsg, gaGlobalOptions.defaultEpsg));
          }

          return defer.promise;
        };
      };

      return new Reframe();
    };
  });
})();
