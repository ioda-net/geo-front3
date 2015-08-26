goog.provide('ga_webdav_service');

goog.require('ga_export_kml_service');
(function() {
  var module = angular.module('ga_webdav_service', [
    'ga_export_kml_service',
    'pascalprecht.translate'
  ]);

  module.factory('gaWebdav', function(gaKml, gaExportKml, $http, $translate) {
    return {
      load: load,
      getErrorMessage: getErrorMessage,
      delete: webdavDelete,
      save: save,
      getKmlString: getKmlString
    };

    function load(def, layer, map, url, file, user, password) {
      var req = getWebdavRequest('GET', getKmlString(layer, map), url, file,
        user, password);

      return $http(req).success(function(data, status, headers) {
        var fileSize = headers('content-length');
        if (gaKml.isValidFileContent(data) &&
          gaKml.isValidFileSize(fileSize)) {
          gaKml.addKmlToMap(map, data, {
            url: getWebdavUrl(url, file),
            useImageVector: gaKml.useImageVector(fileSize),
            zoomToExtent: true
          });
          def.resolve($translate.instant('draw_load_success'));
        } else {
          def.reject();
        }
      }).error(function(data, status) {
        def.resolve(getErrorMessage(
                  $translate.instant('draw_load_error'), status));
      });
    }

    function getKmlString(layer, map) {
      return gaExportKml.create(layer, map.getView().getProjection());
    }

    function getWebdavRequest(method, data, url, file, user, password) {
      method = method || 'GET';

      return {
          method: method,
          url: getWebdavUrl(url, file),
          withCredentials: true,
          headers: {
            Authorization: 'Basic ' + btoa(user + ':' + password),
            'Content-Type': 'application/vnd.google-earth.kml+xml; charset=utf-8'
          },
          data: data
        };
    }

    function getWebdavUrl(url, file) {
      if (!url.endsWith('/')) {
        url += '/';
      }

      return url + file;
    }

    function getErrorMessage(message, status) {
      message = message || '';
      message += '. ';
      switch (status) {
        case 404:
          message += $translate.instant('Not found');
          break;
        case 405:
        case 401:
          message += $translate.instant('Not Allowed');
          break;
        case 409:
          message += $translate.instant('Cannot save KML here');
          break;
        case 0: // Browser OPTIONS requests failed
          message += 'draw_webdav_options_failed';
      }

      return message;
    }

    function webdavDelete(layer, map, url, file, user, password) {
      if (url) {
        var req = getWebdavRequest('DELETE', getKmlString(layer, map), url, file, user, password);

        return $http(req);
      }
    }

    function save(layer, map, url, file, user, password) {
      // user and password are optional, webdav can be anonymous
      var req = getWebdavRequest('PUT', getKmlString(layer, map), url, file, user, password);
      return $http(req);
    }
  });
})();
