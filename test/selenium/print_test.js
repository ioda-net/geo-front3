describe('print', function() {
  it('prints', function() {
    // Click on "Drucken"
    $("#printHeading").click().then(function() {
      // Wait for mapfish print capabilities
      return browser.sleep(5000);
    }).then(function() {
      $('#print button[type*="submit"]').click();
    }).then(function() {
      return $('#print button[type*="submit"]').isDisplayed();
    }).then(function(printButtonDisplayed) {
      expect(printButtonDisplayed).toBe(true);

      return $('#print button[ng-show="printError"]').isDisplayed();
    }).then(function(printErrorDisplayed) {
      expect(printErrorDisplayed).toBe(false);
    });
  });
});
