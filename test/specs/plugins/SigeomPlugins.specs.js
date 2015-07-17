describe('SigeomPlugins', function () {
  var plugins;

  beforeEach(inject(function ($injector) {
    plugins = $injector.get('sgPlugins');
  }));

  it('plugin not activated should returns undefined', function () {
    expect(plugins.unknown).to.be(undefined);
  });

  describe('communes', function () {
    var $httpBackend, gaGlobalOptions;

    beforeEach(inject(function ($injector, _gaGlobalOptions_) {
      $httpBackend = $injector.get('$httpBackend');
      gaGlobalOptions = _gaGlobalOptions_;
    }));

    it('returns a commune name', function () {
      $httpBackend.expectGET(gaGlobalOptions.apiUrl + '/communes?x=0&y=0')
              .respond({commune: 'Moutier'});
      plugins.communes([0, 0]).success(function (data) {
        expect(data.commune).to.be('Moutier');
      }).error(function () {
        expect(true).to.be(false);
      });
      $httpBackend.flush();
    });

    it('should return undefined if no commune at point', function () {
      $httpBackend.expectGET(gaGlobalOptions.apiUrl + '/communes?x=-1&y=-1')
              .respond({});
      plugins.communes([-1, -1]).success(function (data) {
        expect(data.commune).to.be(undefined);
      }).error(function () {
        expect(true).to.be(false);
      });
      $httpBackend.flush();
    });
  });

});
