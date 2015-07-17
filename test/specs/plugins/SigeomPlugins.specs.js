describe('SigeomPlugins', function () {
  var plugins;

  beforeEach(inject(function ($injector) {
    plugins = $injector.get('sgPlugins');
  }));

  it('plugin not activated should returns undefined', function () {
    expect(plugins.notActivated()).to.be(undefined);
  });

  describe('communes', function () {

    it('returns something', function () {
      expect(plugins.communes()).to.be.eql({communes: true});
    });
  });
});
