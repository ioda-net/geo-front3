/* global by, element, browser, expect, $$, protractor */

var utils = require('./utils');

describe('features', function() {
  function featureClick() {
    var map = $('.ol-viewport canvas');

    return $('.gf3-features-popup').isDisplayed()
        .then(function(visible) {
          expect(visible).toBe(false);
          return map.getSize();
        })
        .then(function(size) {
          browser.actions()
              .mouseMove(map, {x: size.width / 2, y: size.height / 2})
              .click()
              .perform();
          return browser.sleep(5000);
        });
  }

  function featureSelectByRectangle() {
    var map = $('.ol-viewport canvas');
    browser.actions()
        .keyDown(protractor.Key.CONTROL)
        .perform();

    return map.getSize()
        .then(function(size) {
          browser.actions()
              .mouseMove(map, {x: size.width / 2, y: size.height / 2})
              .mouseDown()
              .perform();
          browser.actions()
              .mouseMove(map, {x: size.width / 2 + 10, y: size.height / 2 + 10})
              .perform();
          browser.actions()
              .mouseUp()
              .perform();
          browser.actions()
              .keyUp(protractor.Key.CONTROL)
              .perform();
        });
  }

  function featureClose() {
    return $('.gf3-features-popup')
        .element(by.xpath('..'))
        .element(by.xpath('..'))
        .element(by.css('button.icon-remove'))
        .click();
  }

  it('should appear when the user click on the map', function () {
    featureClick()
        .then(function () {
          return $('.gf3-features-popup').isDisplayed();
        })
        .then(function (visible) {
          expect(visible).toBe(true);
        });
  });

  it('should appear when the user draw a rectangle', function() {
    featureSelectByRectangle().then(function() {
      return $('.gf3-features-popup').isDisplayed();
    }).then(function(visible) {
      expect(visible).toBe(true);

      return featureClose();
    });
  });

  it('should use tabs to navigate', function() {
    var tabs;

    featureClick().then(function() {
      tabs = $$('.gf3-features-popup .htmlpopup-content .nav-tabs li a');
      // Only the first tab should be active
      return tabs.first().getAttribute('class');
    }).then(function(classes) {
      expect(classes.indexOf('ga-active')).not.toBe(-1);

      return tabs.count();
    }).then(function(count) {
      var promises = [];
      for (var i = 1; i < count; i++) {
        promises.push(tabs.get(i).getAttribute('class'));
      }

      return protractor.promise.all(promises);
    }).then(function(classes) {
      for (var i = 0; i < classes.length; i++) {
        expect(classes[i].indexOf('ga-active')).toBe(-1);
      }

      return tabs.get(1).click();
    }).then(function() {
      return tabs.first().getAttribute('class');
    }).then(function(classes) {
      expect(classes.indexOf('ga-active')).toBe(-1);

      return tabs.get(1).getAttribute('class');
    }).then(function(classes) {
      expect(classes.indexOf('ga-active')).not.toBe(-1);

      return featureClose();
    });
  });

  it('should work with KML', function() {
    var tabs;
    var kmlUrl = 'http://jenselme.perso.centrale-marseille.fr/visible/kml-attributes.kml';

    utils.importKmlFromUrl(kmlUrl, true).then(function() {
      return featureClick();
    }).then(function() {
      tabs = $$('.gf3-features-popup .htmlpopup-content .nav-tabs li a');

      return tabs.count();
    }).then(function(numberTabs) {
      var promises = [];
      for (var i = 0; i < numberTabs; i++) {
        promises.push(tabs.get(i).getText());
      }

      return protractor.promise.all(promises);
    }).then(function(tabsText) {
      expect(tabsText.indexOf('KML||' + kmlUrl)).not.toBe(-1);

      return featureClose();
    });
  });

  it('should work with KML and rectangle select', function() {
    var tabs;
    var kmlUrl = 'http://jenselme.perso.centrale-marseille.fr/visible/kml-attributes.kml';

    featureSelectByRectangle().then(function() {
      tabs = $$('.gf3-features-popup .htmlpopup-content .nav-tabs li a');

      return tabs.count();
    }).then(function(numberTabs) {
      var promises = [];
      for (var i = 0; i < numberTabs; i++) {
        promises.push(tabs.get(i).getText());
      }

      return protractor.promise.all(promises);
    }).then(function(tabsText) {
      expect(tabsText.indexOf('KML||' + kmlUrl)).not.toBe(-1);

      return featureClose();
    });
  });

  it('shouldn\'t do anything with KML without name or description', function() {
    var tabs;
    var kmlUrl = 'http://jenselme.perso.centrale-marseille.fr/visible/map.geo.admin.ch_KML_20150918170233.kml';

    utils.importKmlFromUrl(kmlUrl, true).then(function() {
      return featureClick();
    }).then(function() {
      tabs = $$('.gf3-features-popup .htmlpopup-content .nav-tabs li a');

      return tabs.count();
    }).then(function(numberTabs) {
      var promises = [];
      for (var i = 0; i < numberTabs; i++) {
        promises.push(tabs.get(i).getText());
      }

      return protractor.promise.all(promises);
    }).then(function(tabsText) {
      expect(tabsText.indexOf('KML||' + kmlUrl)).toBe(-1);

      return featureClose();
    });
  });
});
