describe('ga_reframe_service', function() {
  var $rootScope, $httpBackend, gaReframe, lv03tolv95Url, lv95tolv03Url;
  var defaultToSecondaryEpsgUrl;
  var secondaryToDefaultEpsgUrl;

  var buildUrl = function(baseUrl, coords) {
    return baseUrl + '?easting=' + coords[0] + '&northing=' + coords[1];
  };

  describe('gaReframeService', function() {

    beforeEach(function() {
      inject(function($injector, gaGlobalOptions) {
        $rootScope = $injector.get('$rootScope');
        $httpBackend = $injector.get('$httpBackend');
        gaReframe = $injector.get('gaReframe');
        lv03tolv95Url = gaGlobalOptions.lv03tolv95Url;
        lv95tolv03Url = gaGlobalOptions.lv95tolv03Url;
        defaultToSecondaryEpsgUrl = gaGlobalOptions.defaultToSecondaryEpsgUrl;
        secondaryToDefaultEpsgUrl = gaGlobalOptions.secondaryToDefaultEpsgUrl;
      });
    });

    it('transforms coordinates using the reframe service from LV03 to LV95',
        function(done) {
      var coordinates = [620116.6, 142771.3];
      var url = buildUrl(lv03tolv95Url, coordinates);
      var response = [2620116.600000524, 1142771.299843073];
      $httpBackend.expectGET(url).respond({ c: response });

      gaReframe.get03To95(coordinates).then(function(coords) {
        expect(coords).to.eql(response.c);
        done();
      });
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('transforms coordinates using the reframe service from LV95 to LV03',
        function(done) {
      var coordinates = [2620116.600000524, 1142771.299843073];
      var url = buildUrl(lv95tolv03Url, coordinates);
      var response = [620116.600001048, 142771.2996861463];
      $httpBackend.expectGET(url).respond({ c: response });

      gaReframe.get95To03(coordinates).then(function(coords) {
        expect(coords).to.eql(response.c);
        done();
      });
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('falls back on proj4js on error for LV03 to LV95', function(done) {
      var coordinates = [620116.6, 142771.3];
      var url = buildUrl(lv03tolv95Url, coordinates);
      $httpBackend.expectGET(url).respond(400);

      gaReframe.get03To95(coordinates).then(function(coords) {
        // On Chrome we have a higher accuracy than on PhantomJS. We round the
        // numbers for the tests to pass.
        // Math.trunc is not defined in PhantomJS
        if (Math.trunc) {
          coords = [
             Math.trunc(coords[0] * 1000000000) / 1000000000,
             Math.trunc(coords[1] * 10000000000) / 10000000000
          ];
        }
        expect(coords).to.eql([2620116.600000524, 1142771.299843073]);
        done();
      });
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('falls back on proj4js on error for LV95 to LV03', function(done) {
      var coordinates = [2620116.600000524, 1142771.299843073];
      var url = buildUrl(lv95tolv03Url, coordinates);
      $httpBackend.expectGET(url).respond(400);

      gaReframe.get95To03(coordinates).then(function(coords) {
        // On Chrome we have a higher accuracy than on PhantomJS. We round the
        // numbers for the tests to pass.
        // Math.trunc is not defined in PhantomJS
        if (Math.trunc) {
          coords = [
             Math.trunc(coords[0] * 1000000000) / 1000000000,
             Math.trunc(coords[1] * 10000000000) / 10000000000
          ];
        }
        expect(coords).to.eql([620116.600001048, 142771.2996861463]);
        done();
      });
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('transforms coordinates using the reframe service from default to secondary',
        function(done) {
      var coordinates = [620116.600001048, 142771.2996861463];
      var url = buildUrl(defaultToSecondaryEpsgUrl, coordinates);
      var response = [2620116.600000524, 1142771.299843073];
      $httpBackend.expectGET(url).respond({ c: response });

      gaReframe.getDefaultToSecondary(coordinates).then(function(coords) {
        expect(coords).to.eql(response.c);
        done();
      });
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('transforms coordinates using the reframe service from secondary to default',
        function(done) {
      var coordinates = [2620116.600000524, 1142771.299843073];
      var url = buildUrl(secondaryToDefaultEpsgUrl, coordinates);
      var response = [620116.6, 142771.3];
      $httpBackend.expectGET(url).respond({ c: response });

      gaReframe.getSecondaryToDefault(coordinates).then(function(coords) {
        expect(coords).to.eql(response.c);
        done();
      });
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('falls back on proj4js on error for default to secondary', function(done) {
      var coordinates = [620116.6, 142771.3];
      var url = buildUrl(defaultToSecondaryEpsgUrl, coordinates);
      $httpBackend.expectGET(url).respond(400);

      gaReframe.getDefaultToSecondary(coordinates).then(function(coords) {
        // On Chrome we have a higher accuracy than on PhantomJS. We round the
        // numbers for the tests to pass.
        // Math.trunc is not defined in PhantomJS
        if (Math.trunc) {
          coords = [
             Math.trunc(coords[0] * 1000000000) / 1000000000,
             Math.trunc(coords[1] * 10000000000) / 10000000000
          ];
        }
        expect(coords).to.eql([2620116.600000524, 1142771.299843073]);
        done();
      });
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('falls back on proj4js on error for secondary to defalut', function(done) {
      var coordinates = [2620116.600000524, 1142771.299843073];
      var url = buildUrl(secondaryToDefaultEpsgUrl, coordinates);
      $httpBackend.expectGET(url).respond(400);

      gaReframe.getSecondaryToDefault(coordinates).then(function(coords) {
        // On Chrome we have a higher accuracy than on PhantomJS. We round the
        // numbers for the tests to pass.
        // Math.trunc is not defined in PhantomJS
        if (Math.trunc) {
          coords = [
             Math.trunc(coords[0] * 1000000000) / 1000000000,
             Math.trunc(coords[1] * 10000000000) / 10000000000
          ];
        }
        expect(coords).to.eql([620116.600001048, 142771.2996861463]);
        done();
      });
      $httpBackend.flush();
      $rootScope.$digest();
    });
  });
});
