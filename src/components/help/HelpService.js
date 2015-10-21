goog.provide('ga_help_service');
(function() {

  var module = angular.module('ga_help_service', [
    'pascalprecht.translate'
  ]);

 /**
   * The gaHelpService.
   *
   * The service provides the following functionality:
   *
   * - Allows the gaHelpDirective to get a html snipped
   *   for a given help-id
   */
  module.provider('gaHelpService', function() {
    this.$get = function($q, $http, $translate, $timeout) {

      var Help = function() {
        //keeps cached versions of help snippets
        var registry = {};
        var url = '/help/texts/{id}-{lang}.json';

        //Returns a promise
        this.get = function(id) {
          var lang = fixLang($translate.use());
          var deferred = $q.defer();
         //We resolve directly when we have it in cache already
          if (angular.isDefined(registry[key(id, lang)])) {
            $timeout(function() {
              deferred.resolve(registry[key(id, lang)]);
            }, 0);
          }

          var helpUrl = url
              .replace('{id}', id)
              .replace('{lang}', lang);
          $http.get(helpUrl).success(function(response) {
            registry[key(id, lang)] = response;
            deferred.resolve(response);
          }).error(function() {
            deferred.reject();
          });

          return deferred.promise;
        };

        //we only support certain languages
        function fixLang(langa) {
          var l = langa;
          if (langa == 'rm') {
            l = 'de';
          }
          return l;
        }

        function key(id, lang) {
          return id + lang;
        };
      };

      return new Help();
    };
  });
})();

