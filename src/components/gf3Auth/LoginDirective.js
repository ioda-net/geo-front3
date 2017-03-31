goog.provide('gf3_login_directive');

/**
 * This provides an HTML template and JS logic to handle login.
 *
 * If the login fails, we display a relevant message. Once the user was able
 * to login, the gf3-login-callback will be called.
 */
(function() {
  var module = angular.module('gf3_login_directive', [
    'gf3_login_service',
    'pascalprecht.translate'
  ]);

  module.directive('gf3Login', function($translate, gf3Login) {
    return {
      restrict: 'A',
      templateUrl: 'components/gf3Auth/partials/login.html',
      scope: {
        loginCb: '&gf3LoginCallback',
        type: '=gf3LoginType',
        url: '=gf3AuthUrl'
      },
      link: function(scope) {
        scope.login = function() {
          scope.message = '';

          gf3Login.login(scope.url, scope.type, scope.username, scope.password)
              .then(function() {
                scope.loginCb();
              }, function(resp) {
                if (resp.status === 401 || resp.status === 403) {
                  scope.message = $translate.instant('auth_invalid_login');
                } else {
                  scope.message = $translate.instant('auth_unknown_error');
                }
              });
        };
      }
    };
  });
})();
