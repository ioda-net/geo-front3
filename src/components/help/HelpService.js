goog.provide('ga_help_service');

goog.require('ga_translation_service');

(function() {

  var module = angular.module('ga_help_service', [
    'ga_translation_service'
  ]);

 /**
   * The gaHelp service.
   *
   * The service provides the following functionality:
   *
   * - Allows the gaHelpDirective to get a html snipped
   *   for a given help-id
   */
  module.provider('gaHelp', function() {
    this.$get = function($http, gaLang) {

      var Help = function() {
        var url = '/help/texts/{id}-{lang}.json';

        //Returns a promise
        this.get = function(id) {
          var lang = gaLang.getNoRm();

          var helpUrl = url
              .replace('{id}', id)
              .replace('{lang}', lang);
          return $http.get(helpUrl, {
            cache: true
          }).then(function(response) {
            return response.data;
          });
        };
      };

      return new Help();
    };
  });
})();

