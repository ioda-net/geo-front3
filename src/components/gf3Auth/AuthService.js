goog.provide('gf3_auth_service');

(function() {
  var module = angular.module('gf3_auth_service', []);

  module.config(function($httpProvider) {
    $httpProvider.interceptors.push('gf3Auth');
  });

  module.factory('gf3Auth', function() {
    // Associate each URL with its login.
    var logins = {};

    return {
      getAuthenticationConfig: getAuthenticationConfig,
      hasLogin: hasLogin,
      request: request,
      saveLogin: saveLogin
    };


    function hasLogin(url) {
      return (url in logins);
    }

    function getAuthenticationConfig(kind, username, password) {
      switch (kind) {
        case 'basic':
          return {
            withCredentials: true,
            headers: {
              Authorization: 'Basic ' + btoa(username + ':' + password)
            }
          };
          break;
        default:
          throw new Error('Unknown authentication kind: ' + kind);
          break;
      }
    }

    function request(config) {
      if (config.url in logins) {
        var login = logins[config.url];
        var authConfig =
           getAuthenticationConfig(login.kind, login.username, login.password);

        angular.extend(config, authConfig);
      }

      return config;
    }

    function saveLogin(url, kind, username, password) {
        logins[url] = {
          username: username,
          kind: kind,
          password: password
        };
    }
  });
})();
