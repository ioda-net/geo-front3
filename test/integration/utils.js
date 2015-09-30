function importKmlFromUrl(url, close) {
  browser.ignoreSynchronization = true;
  var kmlImportTool = $("#tools [data-original-title*='KML'");
  var urlPlaceholder = $("#import-kml-popup input[placeholder *= 'URL']");

  return kmlImportTool.isDisplayed().then(function(isDisplayed) {
    if (!isDisplayed) {
      return $("#toolsHeading").click();
    }
  }).then(function() {
    // Click on "KML Import"
    return kmlImportTool.click();
  }).then(function() {
    // Click on "URL"
    return $$("#import-kml-popup a").get(1).click();
  }).then(function() {
    return urlPlaceholder.clear();
  }).then(function() {
    // Write URL of the chosen KML
    return urlPlaceholder.sendKeys(url);
  }).then(function() {
    // Load the KML
    return $("#import-kml-popup button.ga-import-kml-load").click();
  }).then(function() {
    return browser.sleep(5000);
  }).then(function() {
    if (close) {
      return $("#import-kml-popup .ga-buttons button.icon-remove").click();
    }
  });
}


module.exports.importKmlFromUrl = importKmlFromUrl;
