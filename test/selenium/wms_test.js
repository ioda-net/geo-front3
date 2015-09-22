/* global browser, $$ */

var QUERYSTRING_WMS = "WMS%7C%7CAGNES%7C%7Chttp:%2F%2Fwms.geo.admin.ch%2F%7C%7Cch.swisstopo.fixpunkte-agnes";

describe('wms', function () {
  it('imports wms with popup', function () {
    // Click on "Werkzeuge"
    $("#toolsHeading").click().then(function () {
      // Click on "WMS Import"
      return $("#tools [data-original-title*='WMS'").click();
    }).then(function () {
      // Write URL of the chosen WMS
      return $("#import-ows-popup[ga-popup='globals.importWmsPopupShown'] input[placeholder*='URL']")
          .sendKeys('http://wms.geo.admin.ch/');
    }).then(function () {
      // Click on "Verbinden"
      return $("#import-ows-popup[ga-popup='globals.importWmsPopupShown'] button.ga-import-ows-connect").click();
    }).then(function () {
      // Click on "AGNES"
      return $$("#import-ows-popup[ga-popup='globals.importWmsPopupShown'] div.ga-import-ows-content li div.ga-header-group").get(0).click();
    }).then(function () {
      // Click on "Layer hinzufügen"
      return $("#import-ows-popup[ga-popup='globals.importWmsPopupShown'] button.ga-import-ows-add").click();
    }).then(function () {
      return browser.sleep(2000);
    }).then(function () {
      return browser.driver.switchTo().alert();
    }).then(function (alert) {
      return alert.accept();
    }).then(function () {
      // Check if the WMS was correctly parsed
      return $("#import-ows-popup[ga-popup='globals.importWmsPopupShown'] div.ga-message").getText();
    }).then(function (text) {
      expect(text).toBe('Couche WMS chargée avec succès');

      // Close popup
      return $("#import-ows-popup[ga-popup='globals.importWmsPopupShown'] button.icon-remove").click();
    }).then(function () {
      return $$("#toptools a").get(3).getAttribute('href');
    }).then(function (value) {
      expect(value).toContain(QUERYSTRING_WMS);
    }).then(function() {
      return $('#selectionHeading').click();
    }).then(function() {
      return $$("#selection label").get(0).getText();
    }).then(function(text) {
      expect(text).toContain('AGNES');
    });
  });

  it('imports WMS directly by URL', function () {
    // Go to the WMS layer page
    browser.get('http://cov.geojb/?layers=' + QUERYSTRING_WMS).then(function () {
      // Check if the WMS Layer is loaded
      return $$("#selection label").get(0).getText();
    }).then(function(text) {
      expect(text).toContain('AGNES');
    });
  });
});
