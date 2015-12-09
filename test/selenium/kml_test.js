/* global $$, browser */

var QUERYSTRING_KML = "KML%7C%7Chttp%3A%2F%2Fjenselme.perso.centrale-marseille.fr%2Fvisible%2Fmap.geo.admin.ch_KML_20150918170233.kml";
var POSITION_TO_KML = "X=124759.52&Y=499224.22";

var utils = require('../integration/utils');

if (browser.params.type === 'prod') {
  var config = require('../protractor-conf.prod.js');
} else {
  var config = require('../protractor-conf.dev.js');
}

describe('kml', function () {
  it('imports kml by url with toolbox', function () {
    var kmlUrl = 'http://jenselme.perso.centrale-marseille.fr/visible/map.geo.admin.ch_KML_20150918170233.kml';
    utils.importKmlFromUrl(kmlUrl).then(function () {
      browser.ignoreSynchronization = false;
      // Check that parsing is OK
      return $('#import-kml-popup .ga-import-kml-result').getText();
    }).then(function (text) {
      browser.ignoreSynchronization = false;

      expect(text).toContain('OK');

      // Close popup
      return $("#import-kml-popup .ga-buttons button.icon-remove").click();
    }).then(function () {
      return $('#selectionHeading').click();
    }).then(function () {
      return $$("#selection label").get(0).getText();
    }).then(function (text) {
      expect(text).toContain('Drawing');
    });
  });

  it('imports KML directly with permalink', function () {
    browser.get(config.testPortalAddress.replace('{portal}', browser.params.portal) + '?layers=' + QUERYSTRING_KML)
        .then(function () {
          return $$("#selection label").get(0).getText();
        })
        .then(function (text) {
          expect(text).toContain('Drawing');
        });
  });
});
