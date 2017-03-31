goog.provide('gf3_login_service');

(function() {
  var module = angular.module('gf3_login_service', []);

  module.factory('gf3Login', function($http, gf3Auth) {
    return {
      login: login
    };

    function login(url, kind, username, password) {
      var config = gf3Auth.getAuthenticationConfig(kind, username, password);
      // We need to use a post request to check that the logins are correct:
      // anonymous users are allowed to do GET requests.
      config.method = 'POST';
      config.url = url;

      return $http(config).then(function(resp) {
        // The supplied ids are correct, store them.
        gf3Auth.saveLogin(url, kind, username, password);

        return resp;
      });
    }
  });
})();
