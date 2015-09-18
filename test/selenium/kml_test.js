/* global $$, browser */

var QUERYSTRING_KML = "KML%7C%7Chttp%3A%2F%2Fjenselme.perso.centrale-marseille.fr%2Fvisible%2Fmap.geo.admin.ch_KML_20150918170233.kml";
var POSITION_TO_KML = "X=124759.52&Y=499224.22";

describe('kml', function () {
  it('imports kml by url with toolbox', function () {
    browser.ignoreSynchronization = true;
    $("#toolsHeading").click().then(function () {
      // Click on "KML Import"
      return $("#tools [data-original-title*='KML'").click();
    }).then(function () {
      // Click on "URL"
      return $$("#import-kml-popup a").get(1).click();
    }).then(function () {
      // Write URL of the chosen KML
      return $("#import-kml-popup input[placeholder *= 'URL']")
          .sendKeys('http://jenselme.perso.centrale-marseille.fr/visible/map.geo.admin.ch_KML_20150918170233.kml');
    }).then(function () {
      browser.ignoreSynchronization = true;
      // Load the KML
      return $("#import-kml-popup button.ga-import-kml-load").click();
    }).then(function() {
      // Wait for the KML to be fetched
      return browser.sleep(3000);
    }).then(function() {
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
    browser.get('http://cov.geojb/?layers=' + QUERYSTRING_KML);

    // Check if KML has correctly been loaded
    browser.sleep(3000)
        .then(function () {
          return $$("#selection label").get(0).getText();
        })
        .then(function (text) {
          expect(text).toContain('Drawing');
        });
  });
});
