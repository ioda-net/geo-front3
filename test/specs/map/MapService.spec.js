describe('ga_map_service', function() {
  var map;

  var addLayerGroupToMap = function(bodId) {
    var layer = new ol.layer.Group();
    layer.displayInLayerManager = true;
    map.addLayer(layer);
    return layer;
  };

  var addLayerToMap = function(bodId) {
    var layer = new ol.layer.Tile();
    layer.bodId = bodId;
    layer.displayInLayerManager = true;
    map.addLayer(layer);
    return layer;
  };

  var addLocalKmlLayerToMap = function() {
    var kmlFormat = new ol.format.KML({
      extractStyles: true,
      extractAttributes: true
    });
    var layer = new ol.layer.Vector({
      id: 'KML||documents/kml/bar.kml',
      url: 'documents/kml/bar.kml',
      type: 'KML',
      label: 'KML',
      opacity: 0.1,
      visible: false,
      source: new ol.source.Vector({
        features: kmlFormat.readFeatures('<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:gx="http://www.google.com/kml/ext/2.2"></kml>')
      })
    });
    layer.displayInLayerManager = true;
    map.addLayer(layer);
    return layer;
  };

  var addKmlLayerToMap = function() {
    var kmlFormat = new ol.format.KML({
      extractStyles: true,
      extractAttributes: true
    });
    var layer = new ol.layer.Vector({
      id: 'KML||http://foo.ch/bar.kml',
      url: 'http://foo.ch/bar.kml',
      type: 'KML',
      label: 'KML',
      opacity: 0.1,
      visible: false,
      source: new ol.source.Vector({
        features: kmlFormat.readFeatures('<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:gx="http://www.google.com/kml/ext/2.2"></kml>')
      })
    });
    layer.displayInLayerManager = true;
    map.addLayer(layer);
    return layer;
  };

  var addStoredKmlLayerToMap = function() {
    var kmlFormat = new ol.format.KML({
      extractStyles: true,
      extractAttributes: true
    });
    var layer = new ol.layer.Vector({
      id: 'KML||http://public.geo.admin.ch/nciusdhfjsbnduvishfjknl',
      url: 'http://public.geo.admin.ch/nciusdhfjsbnduvishfjknl',
      type: 'KML',
      label: 'nciusdhfjsbnduvishfjknl',
      opacity: 0.1,
      visible: false,
      source: new ol.source.Vector({
        features: kmlFormat.readFeatures('<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:gx="http://www.google.com/kml/ext/2.2"></kml>')
      })
    });
    layer.displayInLayerManager = true;
    map.addLayer(layer);
    return layer;
  };

  var addExternalWmsLayerToMap = function() {
    var source = new ol.source.ImageWMS({
      params: {LAYERS: 'ch.wms.name'},
      url: 'http://foo.ch/wms',
    });
    var layer = new ol.layer.Image({
      id: 'WMS||The wms layer||http://foo.ch/wms||ch.wms.name',
      url: 'http://foo.ch/wms',
      type: 'WMS',
      label: 'The wms layer',
      opacity: 0.4,
      visible: false,
      source: source
    });
    layer.displayInLayerManager = true;
    map.addLayer(layer);
    return layer;
  };

  describe('gaDefinePropertiesForLayer', function() {
    var gaDefine;

    var addLayerToMap = function() {
      var layer = new ol.layer.Tile();
      map.addLayer(layer);
      return layer;
    };

    beforeEach(function() {
      map = new ol.Map({});

      inject(function($injector) {
        gaDefine = $injector.get('gaDefinePropertiesForLayer');
      });

      it('verifies default value and writablity of propertiesi added', function() {
        var layer = addLayerToMap();
        var userVisible = layer.getVisible();
        gaDefine(layer);
        expect(layer.get('altitudeMode')).to.be('clampToGround');
        expect(layer.background).to.be(false);
        layer.background = true;
        expect(layer.background).to.be(true);
        expect(layer.displayInLayerManager).to.be(true);
        layer.displayInLayerManager = false;
        expect(layer.displayInLayerManager).to.be(false);
        expect(layer.useThirdPartyData).to.be(false);
        layer.useThirdPartyData = true;
        expect(layer.useThirdPartyData).to.be(true);
        expect(layer.preview).to.be(false);
        layer.preview = true;
        expect(layer.preview).to.be(true);
        expect(layer.geojsonUrl).to.be(null);
        layer.geojsonUrl = 'test';
        expect(layer.geojsonUrl).to.be('test');
        expect(layer.updateDelay).to.be(null);
        layer.updateDelay = 60;
        expect(layer.updateDelay).to.be(60);
        expect(layer.userVisible).to.be(userVisible);
        layer.userVisible = !userVisible;
        expect(layer.userVisible).to.be(!userVisible);
      });

      it('set userVisible initially to false', function() {
        var layer = addLayerToMap();
        layer.setVisible(false);
        gaDefine(layer);
        expect(layer.userVisible).to.be(false);
      });
    });
  });

  describe('gaLayers', function() {
    var layers, $httpBackend, $rootScope;


    beforeEach(function() {

      module(function($provide) {
        $provide.value('gaTopic', {
          get: function() {
            return {
              id: 'sometopic',
              backgroundLayers: ['bar']
            }
          }
        });
        $provide.value('gaLang',{
          get: function() {
            return 'somelang';
          }
        });
      });

      inject(function($injector) {
        $rootScope = $injector.get('$rootScope');
        $httpBackend = $injector.get('$httpBackend');
        layers = $injector.get('gaLayers');
      });

      var expectedUrl = 'http://example.com/all?lang=somelang';
      $httpBackend.whenGET(expectedUrl).respond({
        foo: {
          type: 'wmts',
          matrixSet: 'set1',
          timestamps: ['t1', 't2']
        },
        bar: {
          type: 'wmts',
          matrixSet: 'set2',
          timestamps: ['t3', 't4']
        },
        "ch.bafu.wrz-wildruhezonen_portal": {},
        "ch.swisstopo.swisstlm3d-wanderwege": {},
        "ch.swisstopo.fixpunkte-agnes": {},
        "ch.bfe.sachplan-geologie-tiefenlager": {},
        "ch.vbs.patrouilledesglaciers-z_rennen": {},
        "ch.swisstopo.swissimage-product": {},
        "ch.swisstopo.pixelkarte-farbe-pk25.noscale": {},
        "ch.swisstopo.pixelkarte-farbe-pk50.noscale": {},
        "ch.swisstopo.pixelkarte-farbe-pk100.noscale": {},
        "ch.swisstopo.pixelkarte-farbe-pk200.noscale": {},
        "ch.swisstopo.pixelkarte-farbe-pk500.noscale": {},
        "ch.swisstopo.pixelkarte-farbe-pk1000.noscale": {},
        "ch.swisstopo.swisstlm3d-karte-farbe": {},
        "ch.swisstopo.swisstlm3d-karte-grau": {},
        "ch.swisstopo.pixelkarte-farbe": {},
        "ch.swisstopo.pixelkarte-grau": {}
      });
      $httpBackend.expectGET(expectedUrl);
      $rootScope.$digest();
      $httpBackend.flush();
    });

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });


    describe('getOlLayerById', function() {
      it('returns layers with correct settings', function() {
        var layer = layers.getOlLayerById('foo');
        expect(layer instanceof ol.layer.Tile).to.be.ok();
        var source = layer.getSource();
        expect(source instanceof ol.source.WMTS).to.be.ok();
        var tileGrid = source.getTileGrid();
        expect(tileGrid instanceof ol.tilegrid.WMTS).to.be.ok();
        var resolutions = tileGrid.getResolutions();
        expect(resolutions.length).to.eql(27);
      });
    });

    describe('getMetaDataOfLayer', function() {
      it('returns correct metadata url from a bod id', function() {
        var expectedMdUrl = 'http://legendservice.com/all/somelayer?lang=somelang';
        $httpBackend.whenGET(expectedMdUrl).respond({});
        $httpBackend.expectGET(expectedMdUrl);
        layers.getMetaDataOfLayer('somelayer');
        $httpBackend.flush();
      });
    });

    describe('set layer visibility through accessor', function() {
      it('sets the visibility as expected', function() {
        var layer = layers.getOlLayerById('foo');
        expect(layer.getVisible()).to.be.ok();
        expect(layer.visible).to.be.ok();
        layer.visible = false;
        expect(layer.getVisible()).not.to.be.ok();
        expect(layer.visible).not.to.be.ok();
        layer.visible = true;
        expect(layer.getVisible()).to.be.ok();
        expect(layer.visible).to.be.ok();
      });
    });

    describe('set layer opacity through accessor', function() {
      it('sets the visibility as expected', function() {
        var layer = layers.getOlLayerById('foo');
        expect(layer.getOpacity()).to.be(1);
        expect(layer.invertedOpacity).to.be("0");
        layer.invertedOpacity = 0.2;
        expect(layer.getOpacity()).to.be(0.8);
        expect(typeof layer.invertedOpacity).to.eql('string');
        layer.invertedOpacity = 1;
        expect(layer.getOpacity()).to.be(0);
        expect(layer.invertedOpacity).to.be("1");
      });
    });
  });

  describe('gaMapUtils', function() {
    var gaMapUtils;

    var addLayerToMap = function(bodId) {
      var layer = new ol.layer.Tile();
      map.addLayer(layer);
      return layer;
    };

    beforeEach(function() {
      map = new ol.Map({});

      inject(function($injector) {
        gaMapUtils = $injector.get('gaMapUtils');
      });
    });

    it('tests constants', function() {
      expect(gaMapUtils.Z_PREVIEW_LAYER).to.eql(1000);
      expect(gaMapUtils.Z_PREVIEW_FEATURE).to.eql(1100);
      expect(gaMapUtils.Z_FEATURE_OVERLAY).to.eql(2000);
      expect(gaMapUtils.preload).to.eql(6);
      expect(gaMapUtils.defaultExtent).to.eql([420000, 30000, 900000, 350000]);
      expect(gaMapUtils.viewResolutions).to.eql([650.0, 500.0, 250.0, 100.0, 50.0, 20.0, 10.0, 5.0,
          2.5, 2.0, 1.0, 0.5, 0.25, 0.1]);
      expect(gaMapUtils.defaultResolution).to.eql(500);
    });

    it('tests getViewResolutionForZoom', function() {
      expect(gaMapUtils.getViewResolutionForZoom(10)).to.eql(1);
    });

    it('transforms a data URI in Blob', function() {
      // base 64 representation of the background image of the map
      var blob = gaMapUtils.dataURIToBlob("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAAAAABzHgM7AAAAAnRSTlMAAHaTzTgAAAARSURBVHgBY3iKBFEAOp/+MgB+UQnYeBZPWAAAAABJRU5ErkJggg==");
      expect(blob.size).to.eql(88);
      expect(blob.type).to.eql('image/png');
    });

    describe.skip('transforms an ol.extent to a Cesium.Rectangle object', function() {

      it('using the default projection', function() {
        var rect = gaMapUtils.extentToRectangle([0, 0, 30, 30]);
        expect(rect).to.be.a(Cesium.Rectangle);
        expect([rect.west, rect.south, rect.east, rect.north]).to.eql([-0.002860778099859713, 0.7834821027741324, -0.0028535435287705122, 0.783487245504938]);
      });

      it('using a user defined projection', function() {
        var rect = gaMapUtils.extentToRectangle([0, 0, 20000000, 10000000], ol.proj.get('EPSG:3857'));
        expect(rect).to.be.a(Cesium.Rectangle);
        expect([rect.west, rect.south, rect.east, rect.north]).to.eql([0, 0, 3.1357118857747954, 1.1597019584657118]);
      });
    });

    it('tests getTileKey', function() {
      var tileUrl = "//wmts5.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/20140520/21781/18/15/20.jpeg";
      expect(gaMapUtils.getTileKey(tileUrl)).to.eql(".geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/20140520/21781/18/15/20.jpeg");
    });

    it('tests getMapLayerForBodId', inject(function(gaDefinePropertiesForLayer) {
       var foundLayer;
       var nonBodLayer = addLayerToMap();
       gaDefinePropertiesForLayer(nonBodLayer);
       foundLayer = gaMapUtils.getMapLayerForBodId(map, 'ch.bod.layer');
       expect(foundLayer).to.eql(undefined);

       var prevLayer = addLayerToMap();
       gaDefinePropertiesForLayer(prevLayer);
       prevLayer.bodId = 'ch.bod.layer';
       prevLayer.preview = true;
       foundLayer = gaMapUtils.getMapLayerForBodId(map, 'ch.bod.layer');
       expect(foundLayer).to.eql(undefined);

       var bgLayer = addLayerToMap();
       gaDefinePropertiesForLayer(bgLayer);
       bgLayer.bodId = 'ch.bod.layer';
       bgLayer.background = true;
       foundLayer = gaMapUtils.getMapLayerForBodId(map, 'ch.bod.layer');
       expect(foundLayer).to.eql(bgLayer);

       var bodLayer = addLayerToMap();
       gaDefinePropertiesForLayer(bodLayer);
       bodLayer.bodId = 'ch.bod.layer';
       foundLayer = gaMapUtils.getMapLayerForBodId(map, 'ch.bod.layer');
       expect(foundLayer).to.eql(bodLayer);
    }));

    it('tests getMapOverlayForBodId', inject(function(gaDefinePropertiesForLayer) {
       var foundLayer;
       var nonBodLayer = addLayerToMap();
       gaDefinePropertiesForLayer(nonBodLayer);
       foundLayer = gaMapUtils.getMapOverlayForBodId(map, 'ch.bod.layer');
       expect(foundLayer).to.eql(undefined);

       var prevLayer = addLayerToMap();
       gaDefinePropertiesForLayer(prevLayer);
       prevLayer.bodId = 'ch.bod.layer';
       prevLayer.preview = true;
       foundLayer = gaMapUtils.getMapOverlayForBodId(map, 'ch.bod.layer');
       expect(foundLayer).to.eql(undefined);

       var bgLayer = addLayerToMap();
       gaDefinePropertiesForLayer(bgLayer);
       bgLayer.bodId = 'ch.bod.layer';
       bgLayer.background = true;
       foundLayer = gaMapUtils.getMapOverlayForBodId(map, 'ch.bod.layer');
       expect(foundLayer).to.eql(undefined);

       var bodLayer = addLayerToMap();
       gaDefinePropertiesForLayer(bodLayer);
       bodLayer.bodId = 'ch.bod.layer';
       foundLayer = gaMapUtils.getMapOverlayForBodId(map, 'ch.bod.layer');
       expect(foundLayer).to.eql(bodLayer);
    }));

    it('tests isKmlLayer', inject(function(gaDefinePropertiesForLayer) {
      expect(gaMapUtils.isKmlLayer(undefined)).to.eql(false);
      expect(gaMapUtils.isKmlLayer(null)).to.eql(false);
      expect(gaMapUtils.isKmlLayer('')).to.eql(false);

      // with a layer id
      expect(gaMapUtils.isKmlLayer('ch.bod.layer')).to.eql(false);
      expect(gaMapUtils.isKmlLayer('WMS||aa||aa||aa')).to.eql(false);
      expect(gaMapUtils.isKmlLayer('KML||test/local/foo.kml')).to.eql(true);
      expect(gaMapUtils.isKmlLayer('KML||http://test:com/foo.kml')).to.eql(true);
      expect(gaMapUtils.isKmlLayer('KML||https://test:com/foo.kml')).to.eql(true);

      // with an ol.layer
      var layer = addLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isKmlLayer(layer)).to.eql(false);
      layer = addLayerGroupToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isKmlLayer(layer)).to.eql(false);
      layer = addExternalWmsLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isKmlLayer(layer)).to.eql(false);
      layer = addKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isKmlLayer(layer)).to.eql(true);
      layer = addLocalKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isKmlLayer(layer)).to.eql(true);
      layer = addStoredKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isKmlLayer(layer)).to.eql(true);
    }));
    
    it('tests isLocalKmlLayer', inject(function(gaDefinePropertiesForLayer) {
      expect(gaMapUtils.isLocalKmlLayer(undefined)).to.eql(false);
      expect(gaMapUtils.isLocalKmlLayer(null)).to.eql(false);
      expect(gaMapUtils.isLocalKmlLayer('')).to.eql(false);

      // with an ol.layer
      var layer = addLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isLocalKmlLayer(layer)).to.eql(false);
      layer = addLayerGroupToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isLocalKmlLayer(layer)).to.eql(false);
      layer = addExternalWmsLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isLocalKmlLayer(layer)).to.eql(false);
      layer = addKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isLocalKmlLayer(layer)).to.eql(false);
      layer = addLocalKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isLocalKmlLayer(layer)).to.eql(true);
      layer = addStoredKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isLocalKmlLayer(layer)).to.eql(false);

    }));

    it('tests isStoredKmlLayer', inject(function(gaDefinePropertiesForLayer) {
      expect(gaMapUtils.isStoredKmlLayer(undefined)).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer(null)).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer('')).to.eql(false);

      // with a layer id
      expect(gaMapUtils.isStoredKmlLayer('ch.bod.layer')).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer('WMS||aa||aa||aa')).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer('KML||test/local/foo.kml')).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer('KML||http://test:com/foo.kml')).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer('KML||https://test:com/foo.kml')).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer('ch.bod.layer')).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer('KML||http://public.bgdi.ch/ggggg.kml')).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer('KML||http://public.admin.ch/gggg.kml')).to.eql(false);
      expect(gaMapUtils.isStoredKmlLayer('KML||http://public.dev.bgdi.ch/ggggg.kml')).to.eql(true);
      expect(gaMapUtils.isStoredKmlLayer('KML||http://public.geo.admin.ch/gggg.kml')).to.eql(true)
      expect(gaMapUtils.isStoredKmlLayer('KML||https://public.dev.bgdi.ch/ggggg.kml')).to.eql(true);
      expect(gaMapUtils.isStoredKmlLayer('KML||https://public.geo.admin.ch/gggg.kml')).to.eql(true);

      // with an ol.layer
      var layer = addLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isStoredKmlLayer(layer)).to.eql(false);
      layer = addLayerGroupToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isStoredKmlLayer(layer)).to.eql(false);
      layer = addExternalWmsLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isStoredKmlLayer(layer)).to.eql(false);
      layer = addKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isStoredKmlLayer(layer)).to.eql(false);
      layer = addLocalKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isStoredKmlLayer(layer)).to.eql(false);
      layer = addStoredKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isStoredKmlLayer(layer)).to.eql(true);
    }));

    it('tests isExternalWmsLayer', inject(function(gaDefinePropertiesForLayer) {
      expect(gaMapUtils.isExternalWmsLayer(undefined)).to.eql(false);
      expect(gaMapUtils.isExternalWmsLayer(null)).to.eql(false);
      expect(gaMapUtils.isExternalWmsLayer('')).to.eql(false);

      // with a layer id
      expect(gaMapUtils.isExternalWmsLayer('ch.bod.layer')).to.eql(false);
      expect(gaMapUtils.isExternalWmsLayer('WMS||aa')).to.eql(false);
      expect(gaMapUtils.isExternalWmsLayer('WMS||aa||aa')).to.eql(false);
      expect(gaMapUtils.isExternalWmsLayer('WMS||aa||aa||aa')).to.eql(true);
      expect(gaMapUtils.isExternalWmsLayer('KML||test/local/foo.kml')).to.eql(false);
      expect(gaMapUtils.isExternalWmsLayer('KML||http://test:com/foo.kml')).to.eql(false);

      // with an ol.layer
      var layer = addLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isExternalWmsLayer(layer)).to.eql(false);
      layer = addLayerGroupToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isStoredKmlLayer(layer)).to.eql(false);
      layer = addExternalWmsLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isExternalWmsLayer(layer)).to.eql(true);
      layer = addKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isExternalWmsLayer(layer)).to.eql(false);
      layer = addLocalKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isExternalWmsLayer(layer)).to.eql(false);
      layer = addStoredKmlLayerToMap();
      gaDefinePropertiesForLayer(layer);
      expect(gaMapUtils.isExternalWmsLayer(layer)).to.eql(false);
    }));

    it('test if a feature has been created by the measure tool', function() {
      var feat = new ol.Feature();
      expect(gaMapUtils.isMeasureFeature(feat)).to.eql(false);

      feat.setId('mymeasure');
      expect(gaMapUtils.isMeasureFeature(feat)).to.eql(false);

      feat.setId('measure_343434');
      expect(gaMapUtils.isMeasureFeature(feat)).to.eql(true);

      feat.setId(null);
      feat.set('type', 'measure');
      expect(gaMapUtils.isMeasureFeature(feat)).to.eql(true);

      feat.set('type', 'mymeasure');
      expect(gaMapUtils.isMeasureFeature(feat)).to.eql(false);
    });

    it('tests moveLayerOnTop', inject(function(gaDefinePropertiesForLayer) {
      var firstLayerAdded = addLayerToMap();
      var secondLayerAdded = addLayerToMap();
      var thirdLayerAdded = addLayerToMap();

      gaMapUtils.moveLayerOnTop(map, firstLayerAdded);
      expect(firstLayerAdded).to.eql(map.getLayers().getArray()[2]);
      expect(thirdLayerAdded).to.eql(map.getLayers().getArray()[1]);
      expect(secondLayerAdded).to.eql(map.getLayers().getArray()[0]);

      gaMapUtils.moveLayerOnTop(map, secondLayerAdded);
      expect(secondLayerAdded).to.eql(map.getLayers().getArray()[2]);
      expect(firstLayerAdded).to.eql(map.getLayers().getArray()[1]);
      expect(thirdLayerAdded).to.eql(map.getLayers().getArray()[0]);
    }));

    it('reset map to north', function() {
      map.getView().setRotation(90);
      expect(map.getView().getRotation()).to.be(90);
      gaMapUtils.resetMapToNorth(map);
      expect(map.getView().getRotation()).to.be(0);
    });

    describe('intersects with default extent', function() {
      var dflt = [420000, 30000, 900000, 350000];

      it('returns the default extent if the extent is not valid', function() {
        expect(gaMapUtils.intersectWithDefaultExtent()).to.eql(dflt);
        expect(gaMapUtils.intersectWithDefaultExtent([1,2])).to.eql(dflt);
      });

      it('returns undefined if there is no intersection', function() {
        expect(gaMapUtils.intersectWithDefaultExtent([0, 0, 1, 1])).to.eql(undefined);
      });

      it('returns the intersection', function() {
        expect(gaMapUtils.intersectWithDefaultExtent([320000, 310000, 800000, 450000])).to.eql([420000, 310000, 800000, 350000]);
      });
    });

    it('creates a feature overlay', function() {
      var feats = [new ol.Feature(), new ol.Feature()];
      var style =  new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'red'
        })
      });
      var layer = gaMapUtils.getFeatureOverlay(feats, style);
      expect(layer).to.be.an(ol.layer.Vector);
      expect(layer.getStyle().getFill().getColor()).to.eql('red');
      expect(layer.getSource()).to.be.an(ol.source.Vector);
      expect(layer.getZIndex()).to.eql(gaMapUtils.Z_FEATURE_OVERLAY);
      expect(layer.getSource().getFeatures().length).to.eql(2);
      expect(layer.displayInLayerManager).to.eql(false);
    });

    it('gets lod from resolution', function() {
      expect(gaMapUtils.getLodFromRes()).to.eql(undefined);
      expect(gaMapUtils.getLodFromRes(500)).to.eql(7);
    });

    it('gets the extent of an ol.source.Vector', function() {
      var feat = new ol.Feature(new ol.geom.Point([1, 2]));
      var feat2 = new ol.Feature(new ol.geom.LineString([[-1, -1], [1, 2], [0, 0]]));
      var src = new ol.source.Vector({
        features: [feat, feat2]
      });
      expect(gaMapUtils.getVectorSourceExtent(src)).to.eql([-1, -1, 1, 2]);

      var src2 = new ol.source.Vector({
        features: [feat, feat2],
        useSpatialIndex: false
      });
      expect(gaMapUtils.getVectorSourceExtent(src2)).to.eql([-1, -1, 1, 2]);
    });
  });
});
