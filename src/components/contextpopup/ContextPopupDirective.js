goog.provide('ga_contextpopup_directive');

goog.require('ga_networkstatus_service');
goog.require('ga_permalink');
goog.require('ga_what3words_service');
goog.require('gf3_plugins');
(function() {

  var module = angular.module('ga_contextpopup_directive', [
    'ga_networkstatus_service',
    'ga_permalink',
    'ga_what3words_service',
    'pascalprecht.translate'
  ]);

  module.directive('gaContextPopup',
      function($rootScope, $http, $translate, $q, $timeout, $window,
          gaBrowserSniffer, gaNetworkStatus, gaPermalink, gaGlobalOptions,
          gaWhat3Words, gf3Plugins) {
        return {
          restrict: 'A',
          replace: true,
          templateUrl: 'components/contextpopup/partials/contextpopup.html',
          scope: {
            map: '=gaContextPopupMap',
            options: '=gaContextPopupOptions',
            is3dActive: '=gaContextPopupIs3d'
          },
          link: function(scope, element, attrs) {
            var heightUrl = scope.options.heightUrl;
            var qrcodeUrl = scope.options.qrcodeUrl;
            var defaultToSecondaryEpsgUrl =
                scope.options.defaultToSecondaryEpsgUrl;

            scope.titleClose = $translate.instant('close');
            scope.defaultEpsgContextPopupTitle =
                gaGlobalOptions.defaultEpsgContextPopupTitle;
            scope.secondaryEpsgContextPopupTitle =
                gaGlobalOptions.secondaryEpsgContextPopupTitle;

            // The popup content is updated (a) on contextmenu events,
            // and (b) when the permalink is updated.

            var map = scope.map;
            var view = map.getView();

            var coordDefaultEpsg, coord4326, coordSecondaryEpsg;
            var popoverShown = false;

            var overlay = new ol.Overlay({
              element: element[0],
              stopEvent: true
            });
            map.addOverlay(overlay);

            scope.showQR = function() {
              return !gaBrowserSniffer.mobile && !gaNetworkStatus.offline;
            };

            var formatCoordinates = function(coord, prec, ignoreThousand) {
              var fCoord = ol.coordinate.toStringXY(coord, prec);
              if (!ignoreThousand) {
                fCoord = fCoord.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
              }
              return fCoord;
            };

            var coordinatesFormatUTM = function(coordinates, zone) {
              var coord = ol.coordinate.toStringXY(coordinates, 0).
                  replace(/\B(?=(\d{3})+(?!\d))/g, "'");
              return coord + ' ' + zone;
            };

            var updateW3W = function() {
              gaWhat3Words.getWords(coord4326[1],
                                    coord4326[0]).then(function(res) {
                scope.w3w = res;
              });
            };

            var handler = function(event) {
              if (scope.is3dActive) {
                return;
              }
              event.stopPropagation();
              event.preventDefault();

              //On Mac, left-click with ctrlKey also fires
              //the 'contextmenu' event. But this conflicts
              //with selectByRectangle feature (in featuretree
              //directive). So we bail out here if
              //ctrlKey is pressed
              /* istanbul ignore next */
              if (event.ctrlKey) {
                return;
              }

              var pixel = (event.originalEvent) ?
                  map.getEventPixel(event.originalEvent) :
                  event.pixel;
              coordDefaultEpsg = (event.originalEvent) ?
                  map.getEventCoordinate(event.originalEvent) :
                  event.coordinate;
              coord4326 = ol.proj.transform(coordDefaultEpsg,
                  gaGlobalOptions.defaultEpsg, 'EPSG:4326');
              coordSecondaryEpsg = ol.proj.transform(coordDefaultEpsg,
                  gaGlobalOptions.defaultEpsg, gaGlobalOptions.secondaryEpsg);

              // recenter on phones
              /* istanbul ignore next */
              if (gaBrowserSniffer.phone) {
                var pan = ol.animation.pan({
                  duration: 200,
                  source: view.getCenter()
                });
                map.beforeRender(pan);
                view.setCenter(coordDefaultEpsg);
              }

              scope.coordDefaultEpsg = formatCoordinates(coordDefaultEpsg, 1);
              scope.coord4326 = ol.coordinate.format(coord4326, '{y}, {x}', 5);
              var coord4326String = ol.coordinate.toStringHDMS(coord4326, 3).
                                   replace(/ /g, '');
              scope.coordiso4326 = coord4326String.replace(/N/g, 'N ');
              scope.coordSecondaryEpsg =
                  formatCoordinates(coordSecondaryEpsg, 2) + ' *';
              /* istanbul ignore next */
              if (coord4326[0] < 6 && coord4326[0] >= 0) {
                var utm_31t = ol.proj.transform(coord4326,
                    'EPSG:4326', 'EPSG:32631');
                scope.coordutm = coordinatesFormatUTM(utm_31t, '(zone 31T)');
              } else if (coord4326[0] < 12 && coord4326[0] >= 6) {
                var utm_32t = ol.proj.transform(coord4326,
                    'EPSG:4326', 'EPSG:32632');
                scope.coordutm = coordinatesFormatUTM(utm_32t, '(zone 32T)');
              } else {
                return '-';
              }

              coord4326['lon'] = coord4326[0];
              coord4326['lat'] = coord4326[1];
              scope.coordmgrs = $window.proj4.mgrs.forward(coord4326).
                  replace(/(.{5})/g, '$1 ');

              // A digest cycle is necessary for $http requests to be
              // actually sent out. Angular-1.2.0rc2 changed the $evalSync
              // function of the $rootScope service for exactly this. See
              // Angular commit 6b91aa0a18098100e5f50ea911ee135b50680d67.
              // We use a conservative approach and call $apply ourselves
              // here, but we instead could also let $evalSync trigger a
              // digest cycle for us.
              scope.$apply(function() {

                $http.get(heightUrl, {
                  params: {
                    easting: coordDefaultEpsg[0],
                    northing: coordDefaultEpsg[1],
                    elevationModel: gaGlobalOptions.defaultElevationModel
                  }
                }).success(function(response) {
                  scope.altitude = parseFloat(response.height);
                });

                if (defaultToSecondaryEpsgUrl) {
                  $http.get(defaultToSecondaryEpsgUrl, {
                    params: {
                      easting: coordDefaultEpsg[0],
                      northing: coordDefaultEpsg[1]
                    }
                  }).success(function(response) {
                    coordSecondaryEpsg = response.coordinates;
                    scope.coordSecondaryEpsg =
                        formatCoordinates(coordSecondaryEpsg, 1);
                  });

                  updateW3W();
                }
              });


              if (gf3Plugins.communes) {
                scope.commune = undefined;
                gf3Plugins.communes(coordDefaultEpsg)
                  .success(function(response) {
                    scope.commune = response.commune;
                  });
              }

              updatePopupLinks();

              /* istanbul ignore next: didn't find out a way to test this. */
              view.once('change:center', function() {
                hidePopover();
              });

              overlay.setPosition(coordDefaultEpsg);
              showPopover();
            };


            if (!gaBrowserSniffer.mobile && gaBrowserSniffer.events.menu) {
              $(map.getViewport()).on(gaBrowserSniffer.events.menu, handler);
              /* istanbul ignore next */
              element.on(gaBrowserSniffer.events.menu, 'a', function(e) {
                e.stopPropagation();
              });

            } else {
              // On touch devices and browsers others than ie10, display the
              // context popup after a long press (300ms)
              var startPixel, holdPromise;
              map.on('pointerdown', function(event) {
                $timeout.cancel(holdPromise);
                startPixel = event.pixel;
                holdPromise = $timeout(function() {
                  handler(event);
                }, 300, false);
              });
              map.on('pointerup', function(event) {
                $timeout.cancel(holdPromise);
                startPixel = undefined;
              });
              map.on('pointermove', function(event) {
                if (startPixel) {
                  var pixel = event.pixel;
                  var deltaX = Math.abs(startPixel[0] - pixel[0]);
                  var deltaY = Math.abs(startPixel[1] - pixel[1]);
                  if (deltaX + deltaY > 6) {
                    $timeout.cancel(holdPromise);
                    startPixel = undefined;
                  }
                }
              });
            }

            /* istanbul ignore next */
            $rootScope.$on('$translateChangeEnd', function() {
              scope.titleClose = $translate.instant('close');
              if (popoverShown) {
                updateW3W();
              }
            });

            // Listen to permalink change events from the scope.
            /* istanbul ignore next */
            scope.$on('gaPermalinkChange', function(event) {
              if (angular.isDefined(coordDefaultEpsg) && popoverShown) {
                updatePopupLinks();
              }
            });

            scope.hidePopover = function(evt) {
              /* istanbul ignore next */
              if (evt) {
                evt.stopPropagation();
              }
              hidePopover();
            };

            function showPopover() {
              element.css('display', 'block');
              popoverShown = true;
            }

            function hidePopover() {
              element.css('display', 'none');
              popoverShown = false;
            }

            function updatePopupLinks() {
              var p = {
                X: Math.round(coordDefaultEpsg[1], 1),
                Y: Math.round(coordDefaultEpsg[0], 1)
              };

              var contextPermalink = gaPermalink.getHref(p);
              scope.contextPermalink = contextPermalink;

              scope.crosshairPermalink = gaPermalink.getHref(
                  angular.extend({crosshair: 'marker'}, p));

              if (!gaBrowserSniffer.mobile) {
                scope.qrcodeUrl = qrcodeUrl + '?url=' +
                    escape(contextPermalink);
              }
            }
          }
        };
      });
})();
