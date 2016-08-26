describe('ga_background_service', function() {

  describe('swisstopo', function() {
    describe('gaBackground', function() {
      var gaBg, gaPermalink, gaTopic, deferGaLayers, deferGaTopic, map, $rootScope,
          gaPermalinkMock, $rootScopeMock;
      var topic1 = {
        'defaultBackground': 'bg1',
        'backgroundLayers': [
          'bg2',
          'bg1'
        ]
      };
      var topic2 = {
        'defaultBackground': 'bg3',
        'backgroundLayers': [
          'bg1',
          'bg2',
          'bg3'
        ]
      };
      var topicVoidLayer = {
        'defaultBackground': 'voidLayer',
        'backgroundLayers': [
          'bg1',
          'bg2',
          'bg3'
        ]
      };
      var topicPlConfig = {
        'defaultBackground': 'bg1',
        'plConfig': 'bgLayer=bg3',
        'backgroundLayers': [
          'bg1',
          'bg2',
          'bg3'
        ]
      };

      beforeEach(function() {
        module(function($provide) {
          $provide.value('gaLayers', {
            loadConfig: function() {
              return deferGaLayers.promise;
            },
            getLayerProperty: function() {
              return 'label';
            },
            getOlLayerById: function() {
              return new ol.layer.Layer({});
            }
          });

          $provide.value('gaTopic', {
            loadConfig: function() {
              return deferGaTopic.promise;
            },
            get: function() {}
          });

          $provide.value('gaPermalink', {
            getParams: function() {
              return {};
            },
            updateParams: function() {}
          });

        });

        inject(function($injector) {
          $q = $injector.get('$q');
          $rootScope = $injector.get('$rootScope');
          gaBg = $injector.get('gaBackground');
          gaTopic = $injector.get('gaTopic');
          gaPermalink = $injector.get('gaPermalink');
          gaPermalinkMock = sinon.mock(gaPermalink);
          $rootScopeMock = sinon.mock($rootScope);
        });
        deferGaLayers = $q.defer();
        deferGaTopic = $q.defer();
        map = new ol.Map({});
      });

      describe('init', function() {

        describe('using a basic topic', function() {

          beforeEach(function() {
            gaTopic.get = function() {
              return topic1;
            };
          });

          it('resolves the promise when layers and topics are loaded', function(done) {
            gaBg.init(map).then(function() {
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('rejects the promise when layers loading fails', function(done) {
            gaBg.init(map).then(function() {
            }, function() {
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.reject();
            $rootScope.$digest();
          });

          it('rejects the promise when topics loading fails', function(done) {
            gaBg.init(map).then(function() {
            }, function() {
              done();
            });
            deferGaTopic.reject();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('initializes the list of background layers', function(done) {
            gaBg.init(map).then(function() {
              var bgs = gaBg.getBackgrounds();
              expect(bgs.length).to.equal(3);
              expect(bgs[0].id).to.equal('bg2');
              expect(bgs[0].label).to.equal('label');
              expect(bgs[1].id).to.equal('bg1');
              expect(bgs[1].label).to.equal('label');
              expect(bgs[2].id).to.equal('voidLayer');
              expect(bgs[2].label).to.equal('void_layer');
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('initializes the default background from topic', function(done) {
            gaBg.init(map).then(function() {
              var bg = gaBg.get();
              expect(bg.id).to.equal('bg1');
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('adds a bg layer to the map', function(done) {
            gaBg.init(map).then(function() {
              var bg = gaBg.get();
              expect(bg.id).to.equal('bg1');

              var layer = map.getLayers().item(0);
              expect(layer.background).to.be.ok();
              expect(layer.displayInLayerManager).to.not.be.ok();

              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('doesn\'t add a bg layer if the bg selected is voidLayer', function(done) {
            gaTopic.get = function() {
              return topicVoidLayer;
            };
            gaBg.init(map).then(function() {
              var bg = gaBg.get();
              expect(bg.id).to.equal('voidLayer');

              var length = map.getLayers().getLength();
              expect(length).to.be(0);
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('updates permalink', function(done) {
            var upParams = gaPermalinkMock.expects('updateParams').withArgs({bgLayer: 'bg1'}).once();
            gaBg.init(map).then(function() {
              upParams.verify();
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('broadcast gaBgChange event', function(done) {
            var bcast = $rootScopeMock.expects('$broadcast').withArgs('gaBgChange').once();
            gaBg.init(map).then(function() {
              bcast.verify();
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('listens gaTopicChange event', function(done) {
            var onTopicChange = $rootScopeMock.expects('$on').withArgs('gaTopicChange').once();
            gaBg.init(map).then(function() {
              onTopicChange.verify();
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('changes bg on gaTopicChange event', function(done) {
            gaBg.init(map).then(function() {
              var layers = map.getLayers();
              expect(gaBg.get().id).to.equal('bg1');
              expect(gaBg.getBackgrounds().length).to.equal(3);
              expect(layers.getLength()).to.equal(1);

              $rootScope.$broadcast('gaTopicChange', topic2);
              expect(gaBg.get().id).to.equal('bg3');
              expect(gaBg.getBackgrounds().length).to.equal(4);
              expect(layers.getLength()).to.equal(1);

              $rootScope.$broadcast('gaTopicChange', topicVoidLayer);
              expect(gaBg.get().id).to.equal('voidLayer');
              expect(gaBg.getBackgrounds().length).to.equal(4);
              expect(layers.getLength()).to.equal(0);

              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });
        });

        describe('using a topic with plConfig', function() {

          beforeEach(function() {
            gaTopic.get = function() {
              return topicPlConfig;
            };
          });

          it('uses default bg from plConfig (priority over defaultBackground property)', function(done) {
            gaBg.init(map).then(function() {
              var bg = gaBg.get();
              expect(bg.id).to.equal('bg3');
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });

          it('initializes the default background from permalink (priority over plConfig)', function(done) {
            var getParams = gaPermalinkMock.expects('getParams').twice().returns({bgLayer: 'voidLayer'});
            gaBg.init(map).then(function() {
              getParams.verify();
              var bg = gaBg.get();
              expect(bg.id).to.equal('voidLayer');
              done();
            });
            deferGaTopic.resolve();
            deferGaLayers.resolve();
            $rootScope.$digest();
          });
        });
      });
    });
  });

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
