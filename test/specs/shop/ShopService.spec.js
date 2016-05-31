describe('ga_shop_service', function() {
  var gaShop;
  var shopUrl = 'http://shop.bgdi.ch';
  var mapsheetParams = '?layer=layerBodId&featureid=featureId';
  var mapsheetWithClipperParamsTpl = '?layer={layerBodId}&clipper={clipper}&featureid=featureId';
  var communeParams = '?layer=layerBodId&clipper=ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill&featureid=featureId';
  var districtParams = '?layer=layerBodId&clipper=ch.swisstopo.swissboundaries3d-bezirk-flaeche.fill&featureid=featureId';
  var cantonParams = '?layer=layerBodId&clipper=ch.swisstopo.swissboundaries3d-kanton-flaeche.fill&featureid=featureId';
  var rectangleParams = '?layer=layerBodId&geometry=geometry';
  var wholeParams = '?layer=layerBodId&clipper=layerBodId';
  var mapsheetClippers = {
    'ch.swisstopo.pixelkarte-farbe-pk25.noscale': 'ch.swisstopo.pixelkarte-pk25.metadata',
    'ch.swisstopo.pixelkarte-farbe-pk50.noscale': 'ch.swisstopo.pixelkarte-pk50.metadata',
    'ch.swisstopo.pixelkarte-farbe-pk100.noscale': 'ch.swisstopo.pixelkarte-pk100.metadata',
    'ch.swisstopo.pixelkarte-farbe-pk200.noscale': 'ch.swisstopo.pixelkarte-pk200.metadata'
    //,'ch.swisstopo.digitales-hoehenmodell_25_reliefschattierung': '
  };

  beforeEach(function() {
    module(function($provide) {
      $provide.value('gaTopic', {
        get: function() {}
      });
      $provide.value('gaLang', {
        get: function() {
          return 'custom';
        }
      })
    });

    inject(function($injector, gaGlobalOptions) {
      gaShop = $injector.get('gaShop');
    });
  });

  describe('#dispatch()', function() {
    var closeSpy, openStub, clock, $window;
    var dispatchUrl = shopUrl + '/custom/dispatcher';
    var dfltDispatchUrl = dispatchUrl + '?layer=layerBodId';
    var fakeWindow = {
      close: function(){}
    };

    beforeEach(function() {
      inject(function($injector) {
        $window = $injector.get('$window');
      });

      clock = sinon.useFakeTimers();
      openStub = sinon.stub($window, 'open');
      closeSpy = sinon.spy($window, 'close');
    });

    afterEach(function() {
      openStub.restore();
      closeSpy.restore();
    });

     
    it('do nothing if orderType or layerBodId are not defined', function() {
      gaShop.dispatch();
      sinon.assert.notCalled(openStub);
      sinon.assert.notCalled(closeSpy);

      gaShop.dispatch('order');
      sinon.assert.notCalled(openStub);
      sinon.assert.notCalled(closeSpy);

      gaShop.dispatch(null, 'layerBodId');
      sinon.assert.notCalled(openStub);
    });

    it('opens a new window (setting a new sessionId)', function() {
      gaShop.dispatch('orderType', 'layerBodId');
      sinon.assert.calledWith(openStub, dfltDispatchUrl, 'toposhop-' + new Date());
    });

    it('closes the previous window opened ', function() {
      openStub = openStub.returns(fakeWindow);
      var fakeCloseSpy = sinon.spy(fakeWindow, 'close');
      gaShop.dispatch('orderType', 'layerBodId');
      sinon.assert.calledOnce(openStub);
    
      gaShop.dispatch('orderType', 'layerBodId');
      sinon.assert.calledOnce(fakeCloseSpy);
      sinon.assert.calledTwice(openStub);
      fakeCloseSpy.restore();
    });
     
    it('closes the shop window then opens the new one keeping the sessionId', function() {
      var tpshopId = 'toposhop-344';  
      $window.name = 'map-' + tpshopId; 
      $window.opener = fakeWindow; 
      var openerCloseSpy = sinon.spy($window.opener, 'close');

      gaShop.dispatch('orderType', 'layerBodId');
      sinon.assert.calledOnce(openerCloseSpy);
      sinon.assert.notCalled(closeSpy);
      sinon.assert.calledWith(openStub, dfltDispatchUrl, tpshopId);
    });
     
    it('opens a good mapsheet url', function() {
      gaShop.dispatch('mapsheet', 'layerBodId', 'featureId');
      sinon.assert.calledWith(openStub, dispatchUrl + mapsheetParams);
    });

    for (var i in mapsheetClippers) {
      it('opens a good mapsheet url with clipper', function() {
        gaShop.dispatch('mapsheet', i, 'featureId');
        var mapsheetWithClipperParams = mapsheetWithClipperParamsTpl
          .replace('{layerBodId}', i)
          .replace('{clipper}', mapsheetClippers[i]);
        sinon.assert.calledWith(openStub, dispatchUrl + mapsheetWithClipperParams);
      });
    }

    it('opens a good commune url', function() {
      gaShop.dispatch('commune', 'layerBodId', 'featureId');
      sinon.assert.calledWith(openStub, dispatchUrl + communeParams);
    });

    it('opens a good district url', function() {
      gaShop.dispatch('district', 'layerBodId', 'featureId');
      sinon.assert.calledWith(openStub, dispatchUrl + districtParams);
    });

    it('opens a good canton url', function() {
      gaShop.dispatch('canton', 'layerBodId', 'featureId');
      sinon.assert.calledWith(openStub, dispatchUrl + cantonParams);
    });

    it('opens a good rectangle url', function() {
      gaShop.dispatch('rectangle', 'layerBodId', 'featureId', 'geometry');
      sinon.assert.calledWith(openStub, dispatchUrl + rectangleParams);
    });

    it('opens a good whole url', function() {
      gaShop.dispatch('whole', 'layerBodId', 'featureId');
      sinon.assert.calledWith(openStub, dispatchUrl + wholeParams);
    });
  });

  describe('#getPrice()', function() {
    var $httpBackend, $rootScope;
    var priceUrl = shopUrl + '/shop-server/resources/products/price';
    
    beforeEach(function() {
      inject(function($injector) {
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');
      });
    });
    
    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('returns a promise', function(done) {
      gaShop.getPrice().catch(function() {
        done();
      });
      $rootScope.$digest();
    });

    it('send a good mapsheet url', function(done) {
      $httpBackend.expectGET(priceUrl + mapsheetParams).respond(200, {productPrice: 30});
      gaShop.getPrice('mapsheet', 'layerBodId', 'featureId').then(function(price) {
        expect(price).to.eql(30);
        done();
      });
      $rootScope.$digest();
      $httpBackend.flush();
    });

    for (var i in mapsheetClippers) {
      it('send a good mapsheet with clipper url', function(done) {
        var mapsheetWithClipperParams = mapsheetWithClipperParamsTpl
            .replace('{layerBodId}', i)
            .replace('{clipper}', mapsheetClippers[i]);
        $httpBackend.expectGET(priceUrl + mapsheetWithClipperParams).respond(200, {productPrice: 30});
        gaShop.getPrice('mapsheet', i, 'featureId').then(function(price) {
          expect(price).to.eql(30);
          done();
        });
        $rootScope.$digest();
        $httpBackend.flush();
      });
    };

    it('send a good commune url', function(done) {
      $httpBackend.expectGET(priceUrl + communeParams).respond(200, {productPrice: 30});
      gaShop.getPrice('commune', 'layerBodId', 'featureId').then(function(price) {
        expect(price).to.eql(30);
        done();
      });
      $rootScope.$digest();
      $httpBackend.flush();
    });

    it('send a good district url', function(done) {
      $httpBackend.expectGET(priceUrl + districtParams).respond(200, {productPrice: 30});
      gaShop.getPrice('district', 'layerBodId', 'featureId').then(function(price) {
        expect(price).to.eql(30);
        done();
      });
      $rootScope.$digest();
      $httpBackend.flush();
    });

    it('send a good canton url', function(done) {
      $httpBackend.expectGET(priceUrl + cantonParams).respond(200, {productPrice: 30});
      gaShop.getPrice('canton', 'layerBodId', 'featureId').then(function(price) {
        expect(price).to.eql(30);
        done();
      });
      $rootScope.$digest();
      $httpBackend.flush();
    });

    it('send a good rectangle url', function(done) {
      $httpBackend.expectGET(priceUrl + rectangleParams).respond(200, {productPrice: 30});
      gaShop.getPrice('rectangle', 'layerBodId', 'featureId', 'geometry').then(function(price) {
        expect(price).to.eql(30);
        done();
      });
      $rootScope.$digest();
      $httpBackend.flush();
    });

    it('send a good whole url', function(done) {
      $httpBackend.expectGET(priceUrl + wholeParams).respond(200, {productPrice: 30});
      gaShop.getPrice('whole', 'layerBodId', 'featureId').then(function(price) {
        expect(price).to.eql(30);
        done();
      });
      $rootScope.$digest();
      $httpBackend.flush();
    });
  });
});
