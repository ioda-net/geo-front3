describe('ga_layer_metadata_popup_service', function() {
  var gaLayerMetadataPopup,
      $httpBackend,
      $rootScope,
      $translate;

  beforeEach(function() {
    module(function($provide) {
      $provide.value('gaTopic', {
        get: function() {
          return {
            id: "sometopic",
            langs: {
              label: "somelang",
              value: "somelang"
            }
          };
        }
      });
      $provide.value('gaLang', new (function() {
        var lang = 'somelang';
        this.get = function() {
          return lang;
        };
        this.set = function(newLang) {
          lang = newLang;
          $translate.use(newLang);
        };
      })());
    });

    inject(function($injector) {
      gaLayerMetadataPopup = $injector.get('gaLayerMetadataPopup');
      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      $translate = $injector.get('$translate');
    });

    $translate.use('somelang');
    $httpBackend.whenGET('http://example.com/all?lang=somelang').respond({});
    $httpBackend.flush();
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('creates a legend popup with the right content', function() {
    gaLayerMetadataPopup.toggle('somelayer');
    $rootScope.$digest();

    var popupLegend = $('.ga-tooltip-metadata');
    expect(popupLegend.length).to.be(1);
    expect(popupLegend.parents().length).to.be(2);
    expect(popupLegend.css('display')).to.be('block');
    var popupContent = '<span class="ng-binding"></span>';
    expect(popupLegend.find('.ga-popup-content').html().indexOf(popupContent) > -1).to.be(true);

    gaLayerMetadataPopup.toggle('somelayer');
    $rootScope.$digest();

    // We don't create a new one because we have the same id
    popupLegend = $('.ga-tooltip-metadata');
    expect(popupLegend.length).to.be(1);
    expect(popupLegend.css('display')).to.be('none');

    //With a new url -> request and a new popup
    gaLayerMetadataPopup.toggle('somelayer');
    $rootScope.$digest();

    popupLegend = $('.ga-tooltip-metadata');
    expect(popupLegend.length).to.be(1);
    expect(popupLegend.css('display')).to.be('block');

    gaLayerMetadataPopup.toggle('somenewlayer');
    $rootScope.$digest();

    popupLegend = $('.ga-tooltip-metadata');
    expect(popupLegend.length).to.be(2);

    // 2 popups so far, on translation end -> 2 new requests
    var expectedUrlLayersConfig = 'http://example.com/sometopic?lang=someotherlang';
    $httpBackend.whenGET(expectedUrlLayersConfig).respond({});
    $translate.use('someotherlang');

    $rootScope.$digest();

    popupLegend = $('.ga-tooltip-metadata');
    expect(popupLegend.length).to.be(2);
  });
});
