goog.provide('gf3_auth');


goog.require('gf3_auth_service');
goog.require('gf3_login_directive');
goog.require('gf3_login_service');

(function() {
  angular.module('gf3_auth', [
    'gf3_auth_service',
    'gf3_login_directive',
    'gf3_login_service'
  ]);
})();
