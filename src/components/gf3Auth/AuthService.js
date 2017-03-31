goog.provide('gf3_auth_service');

/**
 * HTTP interceptor in charge of adding authentication information to relevant
 * HTTP requests.
 *
 * For each URL, it will store:
 * <ul>
 *   <li>The username</li>
 *   <li>The password</li>
 *   <li>The kind of authentication. Currently we only support HTTP Basic
 *     Authentication. We may support other kind of authentication (eg JWT) in
 *     the future. Thanks to this property, we will be able to add the correct
 *     header with the correct value.</li>
 * </ul>
 *
 * It also provides methods to:
 * <ul>
 *   <li>Know if ids are avaible for a given URL.</li>
 *   <li>Register ids for a URL.</li>
 *   <li>Get the $http authentication configuration for a URL.</li>
 * </ul>
 */
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

    function getAuthenticationConfigFromUrl(url) {
      var login = logins[url];
      return getAuthenticationConfig(login);
    }

    function getAuthenticationConfig(login) {
      switch (login.kind) {
        case 'basic':
          return {
            withCredentials: true,
            headers: {
              Authorization: 'Basic ' +
                  btoa(login.username + ':' + login.password)
            }
          };
          break;
        default:
          throw new Error('Unknown authentication kind: ' + login.kind);
          break;
      }
    }

    function request(config) {
      if (config.url in logins) {
        var authConfig = getAuthenticationConfigFromUrl(config.url);

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
