goog.provide('gf3_edit_save_service');

(function() {
  var module = angular.module('gf3_edit_save_service', []);

  module.factory('gf3EditSave', function($http, $q, $translate) {
    var formatWFS = new ol.format.WFS();
    var xs = new XMLSerializer();

    return {
      save: save
    };

    /**
     * Save the features in the WFS-T server.
     *
     * It returns a promise that will be resolved if the save succeeds and
     * rejected otherwise. The reason for this rejection are passed as a
     * parameter of the reject function.
     *
     * @param {type} url
     * @param {type} addedFeatures
     * @param {type} updatedFeatures
     * @param {type} deletedFeatures
     * @param {type} serializeOptions
     * @return {Promise}
     */
    function save(url, addedFeatures, updatedFeatures, deletedFeatures,
          serializeOptions) {
      var node = formatWFS.writeTransaction(addedFeatures, updatedFeatures,
              deletedFeatures, serializeOptions);
      var saveDefered = $q.defer();

      $http({
        method: 'POST',
        url: url,
        data: xs.serializeToString(node),
        headers: {
          'Content-Type': 'text/xml'
        }
      }).then(function(resp) {
        if (saveResponseContainsError(resp.data)) {
          saveDefered.reject({
            message: 'edit_save_error',
            saveErrors: getErrorMessageFromSaveResponse(resp.data)
          });
        } else {
          saveDefered.resolve('edit_save_success');
        }
      }, function(resp) {
        if (resp.status === 401 || resp.status === 403) {
          saveDefered.reject({
            message: 'edit_auth_required',
            authRequired: true
          });
        } else {
          saveDefered.reject({ message: 'edit_save_error' });
        }
      });

      return saveDefered.promise;
    }

    /**
     * Returns true if the XML response from the WFS-T server contains an error
     * message.
     *
     * @param {type} data
     * @return {Boolean}
     */
    function saveResponseContainsError(data) {
      // Depending of the server and the WFS version, the XML response will
      // be different. Here, we handle GeoServer (1.0.0 and 1.1.0) and
      // tinyOWS (1.0.0).
      if (data.indexOf('ExceptionReport') > -1 ||
          data.indexOf('ServiceExceptionReport') > -1 ||
          (data.indexOf('WFS_TransactionResponse') &&
              data.indexOf('FAILED') > -1)) {
        return true;
      }

      return false;
    }

    /**
     * Gets and returns the error messages from the XML response of the WFS-/T
     * server.
     *
     * @param {type} data
     * @return {Array}
     */
    function getErrorMessageFromSaveResponse(data) {
      var parser = new DOMParser();
      var document = parser.parseFromString(data, 'text/xml');
      var errorMessages = [];
      // Depending of the server and the WFS version, the XML response will
      // be different. Here, we handle GeoServer (1.0.0 and 1.1.0) and
      // tinyOWS (1.0.0).
      var messages = document.getElementsByTagName('Message');
      var serviceExceptions =
          document.getElementsByTagName('ServiceException');
      var exceptionTexts = document.getElementsByTagName('ExceptionText');

      if (messages.length > 0) {
        for (var i = 0; i < messages.length; i++) {
          errorMessages.push(messages[i].textContent);
        }
      } else if (serviceExceptions.length > 0) {
        for (var i = 0; i < serviceExceptions.length; i++) {
          var msgNode = serviceExceptions[i];
          errorMessages.push(msgNode.getAttribute('code') + ' ' +
              msgNode.getAttribute('locator') + ' ' +
              msgNode.textContent);
        }
      } else if (exceptionTexts.length > 0) {
        for (var i = 0; i < exceptionTexts.length; i++) {
          errorMessages.push(exceptionTexts[i].textContent);
        }
      } else {
        errorMessages.push($translate.instant('edit_unknown_save_error'));
      }

      return errorMessages;
    }
  });
})();
