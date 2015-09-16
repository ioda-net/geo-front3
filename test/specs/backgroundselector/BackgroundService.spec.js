describe('ga_background_service', function() {

  describe('insert layers not perdefined', function () {
    var map, layer1, layer2, def, gaBackground, rootScope;
    beforeEach(function() {

      map = new ol.Map({});
      layer1 = new ol.layer.Tile();
      layer2 = new ol.layer.Tile();

      module(function($provide) {
        $provide.value('gaLayers', {
          loadConfig: function() {
            return def.promise;
          },
          getLayer: function(id) {
            return {};
          },
          getOlLayerById: function(id) {
            return id === 'bgLayer1' ? layer1 : layer2;
          },
          getLayerProperty: function(layerId, propertyName) {
            if (propertyName === 'label') {
              switch (layerId) {
                case 'bgLayer1':
                  return 'bgLayer1';
                case 'bgLayer2':
                  return 'bgLayer2';
              }
            }
          }
        });
        $provide.value('gaTopic', {
          loadConfig: function() {
            return def.promise;
          },
          get: function() {
            return {
              id: 'sometopic',
              langs: [{
                value: 'somelang',
                label: 'somelang'
              }],
              backgroundLayers: [
                'bgLayer1',
                'bgLayer2'
              ]
            };
          }
        });
      });

      inject(function($q, _gaBackground_, $rootScope) {
        def = $q.defer();
        gaBackground = _gaBackground_;
        rootScope = $rootScope;
      });

      def.resolve();
      gaBackground.init(map);
      rootScope.$digest();
    });

    it('adds layers in the good order', function() {
      var bgs = gaBackground.getBackgrounds();
      var expectedBgs = [{
        id: 'bgLayer1',
        label: 'bgLayer1'
      }, {
        id: 'bgLayer2',
        label: 'bgLayer2'
      }, {
        id: 'voidLayer',
        label: 'void_layer'
      }];
      expect(bgs).to.eql(expectedBgs);
    });

    it('changes layers', function() {
      expect(layer1).to.equal(map.getLayers().getArray()[0]);
      gaBackground.setById(map, 'bgLayer2');
      expect(layer2).to.equal(map.getLayers().getArray()[0]);
    });

    it('switches to voidLayer', function() {
      var numberLayers = map.getLayers().getLength();
      expect(numberLayers).to.be(1);
      gaBackground.setById(map, 'voidLayer');
      numberLayers = map.getLayers().getLength();
      expect(numberLayers).to.be(0);
    });
  });

  describe('uses the first bg layer if default is not defined', function() {
    var map, layer1, layer2, def, gaBackground, rootScope;
    beforeEach(function() {

      map = new ol.Map({});
      layer1 = new ol.layer.Tile();
      layer2 = new ol.layer.Tile();

      module(function($provide) {
        $provide.value('gaLayers', {
          loadConfig: function() {
            return def.promise;
          },
          getLayer: function(id) {
            return {};
          },
          getOlLayerById: function(id) {
            return id === 'bgLayer1' ? layer1 : layer2;
          },
          getLayerProperty: function(layerId, propertyName) {
            if (propertyName === 'label') {
              switch (layerId) {
                case 'bgLayer1':
                  return 'bgLayer1';
                case 'bgLayer2':
                  return 'bgLayer2';
              }
            }
          }
        });
        $provide.value('gaTopic', {
          loadConfig: function() {
            return def.promise;
          },
          get: function() {
            return {
              id: 'sometopic',
              langs: [{
                value: 'somelang',
                label: 'somelang'
              }],
              backgroundLayers: [
                'bgLayer1',
                'bgLayer2'
              ]
            };
          }
        });
      });

      inject(function($q, _gaBackground_, $rootScope) {
        def = $q.defer();
        gaBackground = _gaBackground_;
        rootScope = $rootScope;
      });

      def.resolve();
      gaBackground.init(map);
      rootScope.$digest();
    });

    it('the first background layer if topic has no default bg', function() {
      var bg = gaBackground.getBackgrounds()[0];
      expect(gaBackground.get()).eql(bg);
    });
  });

  describe('uses the default bg layer if defined', function() {
    var map, layer1, layer2, def, gaBackground, rootScope;
    beforeEach(function() {

      map = new ol.Map({});
      layer1 = new ol.layer.Tile();
      layer2 = new ol.layer.Tile();

      module(function($provide) {
        $provide.value('gaLayers', {
          loadConfig: function() {
            return def.promise;
          },
          getLayer: function(id) {
            return {};
          },
          getOlLayerById: function(id) {
            return id === 'bgLayer1' ? layer1 : layer2;
          },
          getLayerProperty: function(layerId, propertyName) {
            if (propertyName === 'label') {
              switch (layerId) {
                case 'notDefaultBg':
                  return 'notDefaultBg';
                case 'defaultBg':
                  return 'defaultBg';
              }
            }
          }
        });
        $provide.value('gaTopic', {
          loadConfig: function() {
            return def.promise;
          },
          get: function() {
            return {
              id: 'topic_with_default_bg',
              langs: [{
                value: 'somelang',
                label: 'somelang'
              }],
              backgroundLayers: [
                'notDefaultBg',
                'defaultBg'
              ],
              defaultBackground: 'defaultBg'
            };
          }
        });
      });

      inject(function($q, _gaBackground_, $rootScope) {
        def = $q.defer();
        gaBackground = _gaBackground_;
        rootScope = $rootScope;
      });

      def.resolve();
      rootScope.$digest();
      gaBackground.init(map);
      rootScope.$emit('gaTopicChange');
      rootScope.$digest();
    });

    it('the first background layer if topic has no default bg', function() {
      var bg = gaBackground.getBackgrounds()[1];
      expect(gaBackground.get()).eql(bg);
    });
  });
});