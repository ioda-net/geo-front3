goog.provide('gf3_auth');


goog.require('gf3_auth_service');
goog.require('gf3_login_directive');
goog.require('gf3_login_service');

/**
 * General overview of how authentication works
 *
 * The goal of this suite of modules is to store for each URL a username and a
 * password. It will then add the proper header to each HTTP requests made to
 * the registered URL. This allows the user to access to protected resources
 * withing the geoportal.
 *
 * Sub-modules:
 * <ul>
 *   <li>gf3_auth_service: HTTP interceptor to add the proper headers to
 *     relevant HTTP requests</li>
 *   <li>gf3_login_directive: login user interaction</li>
 *   <li>gf3_login_service: utilities for the login directive</li>
 * </ul>
 */

(function() {
  angular.module('gf3_auth', [
    'gf3_auth_service',
    'gf3_login_directive',
    'gf3_login_service'
  ]);
})();
