describe('SigeomPlugins', function () {
  var plugins;

  beforeEach(inject(function ($injector) {
    plugins = $injector.get('gf3Plugins');
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

    it('returns a commune name', function (done) {
      if (!plugins.communes) {
        console.warn('Plugin communes is not activated.');
        done();
        return;
      }

      $httpBackend.expectGET(gaGlobalOptions.apiUrl + '/communes?x=0&y=0')
              .respond({commune: 'Moutier'});
      plugins.communes([0, 0]).then(function (resp) {
        expect(resp.data.commune).to.be('Moutier');
        done();
      }, function () {
        expect(true).to.be(false);
        done();
      });
      $httpBackend.flush();
    });

    it('should return undefined if no commune at point', function (done) {
      if (!plugins.communes) {
        console.warn('Plugin communes is not activated.');
        done();
        return;
      }

      $httpBackend.expectGET(gaGlobalOptions.apiUrl + '/communes?x=-1&y=-1')
              .respond({});
      plugins.communes([-1, -1]).then(function (resp) {
        expect(resp.data.commune).to.be(undefined);
        done();
      }, function () {
        expect(true).to.be(false);
        done();
      });
      $httpBackend.flush();
    });
  });

});
