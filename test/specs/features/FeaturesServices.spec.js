describe('gf3_features_service', function() {
  describe('gf3FeaturesUtils', function() {
    var gf3FeaturesUtils;

    beforeEach(function() {
      module(function($provide) {
        $provide.value('gaLayers', {
          getLayerProperty: function(id, propertyName) {
            if (propertyName === 'parentLayerId') {
              return id;
            } else if (propertyName === 'queryable') {
              return id === 'queryable';
            }
          }
        });
      });

      inject(function(_gf3FeaturesUtils_) {
        gf3FeaturesUtils = _gf3FeaturesUtils_;
      });
    });

    it('detects vector layers', function() {
      var layer = new ol.layer.Vector();
      expect(gf3FeaturesUtils.isVectorLayer(layer)).to.be(true);

      layer = new ol.layer.Image({
        source: new ol.source.ImageVector({
          source: new ol.source.Vector(),
          projection: '21781'
        })
      });
      expect(gf3FeaturesUtils.isVectorLayer(layer)).to.be(true);

      layer = new ol.layer.Image();
      expect(gf3FeaturesUtils.isVectorLayer(layer)).to.be(false);

      layer = new ol.layer.Tile();
      expect(gf3FeaturesUtils.isVectorLayer(layer)).to.be(false);
    });

    it('detects queryable bod layer', function() {
      var layer = {
        bodId: 'queryable'
      };
      expect(gf3FeaturesUtils.isQueryableBodLayer(layer)).to.be(true);

      layer.bodId = 'not_queryable';
      expect(gf3FeaturesUtils.isQueryableBodLayer(layer)).to.be(false);
    });

    it('lists the queryablbe layers of a map', function() {
      var layer = new ol.layer.Tile({
        source: new ol.source.TileImage({
          projection: '21781'
        })
      });
      layer.bodId = 'queryable';
      layer.visible = true;
      var vectorLayer = new ol.layer.Vector();
      vectorLayer.visible = true;
      vectorLayer.bodId = 'vector';
      var wmsImageLayer = new ol.layer.Image({
        source: new ol.source.ImageWMS()
      });
      wmsImageLayer.visible = true;
      wmsImageLayer.bodId = 'wmsImageLayer';
      var wmsTiledLayer = new ol.layer.Tile({
        source: new ol.source.TileWMS()
      });
      wmsTiledLayer.visible = true;
      wmsTiledLayer.bodId = 'wmsTiledLayer';
      var notQueryableLayer = new ol.layer.Tile({
        source: new ol.source.TileImage({
          projection: '21781'
        })
      });
      notQueryableLayer.bodId = 'not_queryable';
      notQueryableLayer.visible = true;
      var hiddenLayer = new ol.layer.Tile({
        source: new ol.source.TileImage({
          projection: '21781'
        })
      });
      hiddenLayer.bodId = 'hidden';
      hiddenLayer.visible = false;
      var previewLayer = new ol.layer.Tile({
        source: new ol.source.TileImage({
          projection: '21781'
        })
      });
      previewLayer.visible = true;
      previewLayer.preview = true;
      previewLayer.bodId = 'preview';

      var map = new ol.Map({
        layers: [
          layer,
          vectorLayer,
          wmsImageLayer,
          wmsTiledLayer,
          notQueryableLayer,
          hiddenLayer,
          previewLayer
        ]
      });

      var layersToQuery = gf3FeaturesUtils.getLayersToQuery(map);
      expect(layersToQuery.bodLayers.length).to.be(1);
      expect(layersToQuery.vectorLayers.length).to.be(1);
      expect(layersToQuery.wmsLayers.length).to.be(2);

      var all = layersToQuery.bodLayers.slice();
      all = all.concat(layersToQuery.vectorLayers);
      all = all.concat(layersToQuery.wmsLayers);
      console.log(all.length)
      var layersToQueryIds = all.map(function(l) {
        return l.bodId;
      });
      expect(layersToQueryIds).to.eql(['queryable', 'vector', 'wmsImageLayer', 'wmsTiledLayer']);
    });

    it('gets year from string', function() {
      var time = '2015-08-09';
      expect(gf3FeaturesUtils.yearFromString(time)).to.be(2015);
    });

    it('clears object', function() {
      var obj = {toto: 'toto'};
      gf3FeaturesUtils.clearObject(obj);
      expect(Object.keys(obj).length).to.be(0);
    });

    it('detects name or descriptions', function() {
      var feature = {get: function() {}};
      expect(gf3FeaturesUtils.hasNameOrDescription(feature)).to.be(false);

      feature.get = function(type) {
        if (type === 'name') {
          return 'feature_name';
        }
      };
      expect(gf3FeaturesUtils.hasNameOrDescription(feature)).to.be(true);

      feature.get = function(type) {
        if (type === 'description') {
          return 'feature_description';
        }
      };
      expect(gf3FeaturesUtils.hasNameOrDescription(feature)).to.be(true);
    });

    it('gets coords or extent', function() {
      var coord = [0, 0];
      expect(gf3FeaturesUtils.getCoords(coord)).to.be(coord);

      var geom = {
        getExtent: function() {
          return coord;
        }
      };
      expect(gf3FeaturesUtils.getCoords(geom)).to.be(coord);
    });

    it('generates random ids', function() {
      var id1 = gf3FeaturesUtils.getRandomId();
      var id2 = gf3FeaturesUtils.getRandomId();

      expect(id1).not.to.be(id2);
    });
  });
});