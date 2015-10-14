describe('print', function() {
  it('prints', function() {
    var printSubmit;
    // Click on "Drucken"
    $("#printHeading").click().then(function() {
      // Wait for mapfish print capabilities
      return browser.sleep(5000);
    }).then(function() {
      printSubmit = $('#print button[type*="submit"]');
      return printSubmit.click();
    }).then(function() {
      return printSubmit.isDisplayed();
    }).then(function(printButtonDisplayed) {
      expect(printButtonDisplayed).toBe(true);

      return $('#print button[ng-show="printError"]').isDisplayed();
    }).then(function(printErrorDisplayed) {
      expect(printErrorDisplayed).toBe(false);
    });
  });
});
