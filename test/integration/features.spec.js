/* global by, element, browser, expect, $$ */

var fs = require('fs');

describe('features', function () {
  function featureClick() {
    var map = $('.ol-viewport canvas');

    return $('.ga-features-popup').isDisplayed()
        .then(function (visible) {
          expect(visible).toBe(false);
          return map.getSize();
        })
        .then(function (size) {
          browser.actions()
              .mouseMove(map, {x: size.width / 2, y: size.height / 2})
              .click()
              .perform();
          browser.sleep(2000);
        });
  }

  it('should appear when the user click on the map', function () {
    featureClick()
        .then(function () {
          return $('.ga-features-popup').isDisplayed();
        })
        .then(function (visible) {
          expect(visible).toBe(true);

          return $('.ga-features-popup')
              .element(by.xpath('..'))
              .element(by.xpath('..'))
              .element(by.css('button.icon-remove'))
              .click();
        });
  });
});
