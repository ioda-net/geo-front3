var QUERYSTRING_OF_MOUTIER = "X=236219.67&Y=593440.84";

describe('search', function() {
  it('searches locations', function() {
    // Send "Moutier" to the searchbar
    $("#search-container span.ga-search-input-container input")
        .sendKeys('Moutier').then(function() {
      var locationSearchContainer = $$('#search-container div.ga-search-results').get(0);
      var locationSearchResults = locationSearchContainer.$$('div.ga-search-result');
      expect(locationSearchResults.count()).toBe(50);

      return locationSearchResults.get(0).click();
    }).then(function() {
      return browser.getCurrentUrl();
    }).then(function(url) {
      expect(url).toContain(QUERYSTRING_OF_MOUTIER);
    });
  });

  it('cleans the search input field', function() {
    $('#search-container button.icon-remove-sign').click().then(function() {
      return $("#search-container span.ga-search-input-container input").getText();
    }).then(function(text) {
      expect(text).toBe('');

      return $$('#search-container div.ga-search-results').get(0).getInnerHtml();
    }).then(function(innerHtml) {
      expect(innerHtml.trim()).toBe('<!-- ngRepeat: (i, res) in results -->');
    });
  });

  it('searches layers', function() {
    // Send "bâtiment" to the searchbar
    $("#search-container span.ga-search-input-container input")
        .sendKeys('bâtiments').then(function() {
      var locationSearchContainer = $$('#search-container div.ga-search-results').get(2);
      var locationSearchResults = locationSearchContainer.$$('div.ga-search-result');
      expect(locationSearchResults.count()).toBe(1);

      return locationSearchResults.get(0).click();
    }).then(function() {
      return browser.getCurrentUrl();
    }).then(function(url) {
      expect(url).toContain('BATIMENTS');
    });
  });
});
