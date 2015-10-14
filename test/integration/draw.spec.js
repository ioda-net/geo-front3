/* global browser, $$, protractor */

describe('draw', function() {
  function enableDraw() {
    return $('#drawHeading').click();
  }

  function draw() {
    var map = $('.ol-viewport canvas');

    return $$('#draw .ga-draw-buttons button').first().click().then(function() {
      return map.getSize();
    }).then(function(size) {
      browser.actions()
          .mouseMove(map, {x: size.width / 2, y: size.height / 2})
          .click()
          .perform();

      return browser.sleep(1000);
    });
  }

  function disableDraw() {
    return $$('#drawModeHeader button').first().click().then(function() {
      return browser.sleep(1000);
    });
  }

  it('should add a drawnig layer', function() {
    enableDraw().then(function() {

      // Normal tools must not be visible
      var promises = [];
      var ids = [
        '#shareHeading',
        '#printHeading',
        '#drawHeading',
        '#toolsHeading',
        '#catalogHeading',
        '#selectionHeading'
      ];
      ids.forEach(function(id) {
        promises.push($(id).isDisplayed());
      });

      return protractor.promise.all(promises);
    }).then(function(toolsVisibility) {
      var sum = 0;
      toolsVisibility.forEach(function(visible) {
        sum += visible;
      });
      expect(sum).toBe(0);
    }).then(draw).then(function() {
      // Should save the map by default
      return $('#draw .ga-draw-info-save span').getText();
    }).then(function(drawStatusText) {
      expect(drawStatusText).toBe('Carte sauvegardée.');
    }).then(disableDraw).then(function() {
      return $('#selectionHeading').click();
    }).then(function() {
      expect($$('#selection li').count()).toBe(2);
    });
  });


  it('should add only on drawing layer', function() {
    enableDraw().then(draw)
        .then(disableDraw)
        .then(enableDraw)
        .then(draw)
        .then(disableDraw)
        .then(function() {
          return $('#selectionHeading').click();
        }).then(function() {
      expect($$('#selection li').count()).toBe(2);
    });
  });


  it('should not save the drawing if the user ask for it', function() {
    enableDraw().then(function() {
      return $$('#draw .ga-draw-buttons input').first().click();
    }).then(draw).then(function() {
      return $('#draw .ga-draw-info-save span').getText();
    }).then(function(drawStatusText) {
      expect(drawStatusText).toBe('');

      return disableDraw();
    });
  });


  it('should save the drawing on owncloud if the use ask for it', function() {
    var webdavConnect = $('#draw-webdav-connect');

    enableDraw().then(function() {
      return webdavConnect.isPresent();
    }).then(function(isWebdavConnectPresent) {
      expect(isWebdavConnectPresent).toBe(false);

      return $$('#draw .ga-draw-buttons input').get(2).click();
    }).then(function() {
      return webdavConnect.isDisplayed();
    }).then(function(isWebdavConnectDisplayed) {
      expect(isWebdavConnectDisplayed).toBe(true);
    });
  });
});
