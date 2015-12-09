describe('gf_features_service', function() {
  describe('gfFeaturesUtils', function() {
    var gfFeaturesUtils;

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

      inject(function(_gfFeaturesUtils_) {
        gfFeaturesUtils = _gfFeaturesUtils_;
      });
    });

    it('detects vector layers', function() {
      var layer = new ol.layer.Vector();
      expect(gfFeaturesUtils.isVectorLayer(layer)).to.be(true);

      layer = new ol.layer.Image({
        source: new ol.source.ImageVector({
          source: new ol.source.Vector(),
          projection: '21781'
        })
      });
      expect(gfFeaturesUtils.isVectorLayer(layer)).to.be(true);

      layer = new ol.layer.Image();
      expect(gfFeaturesUtils.isVectorLayer(layer)).to.be(false);

      layer = new ol.layer.Tile();
      expect(gfFeaturesUtils.isVectorLayer(layer)).to.be(false);
    });

    it('detects queryable bod layer', function() {
      var layer = {
        bodId: 'queryable'
      };
      expect(gfFeaturesUtils.isQueryableBodLayer(layer)).to.be(true);

      layer.bodId = 'not_queryable';
      expect(gfFeaturesUtils.isQueryableBodLayer(layer)).to.be(false);
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
        layers: [layer, vectorLayer, notQueryableLayer]
      });

      var layersToQuery = gfFeaturesUtils.getLayersToQuery(map);
      expect(layersToQuery.length).to.be(2);

      var layersToQueryIds = layersToQuery.map(function(l) {
        return l.bodId;
      });
      expect(layersToQueryIds).to.eql(['queryable', 'vector']);
    });

    it('gets year from string', function() {
      var time = '2015-08-09';
      expect(gfFeaturesUtils.yearFromString(time)).to.be(2015);
    });

    it('clears object', function() {
      var obj = {toto: 'toto'};
      gfFeaturesUtils.clearObject(obj);
      expect(Object.keys(obj).length).to.be(0);
    });

    it('detects name or descriptions', function() {
      var feature = {get: function() {}};
      expect(gfFeaturesUtils.hasNameOrDescription(feature)).to.be(false);

      feature.get = function(type) {
        if (type === 'name') {
          return 'feature_name';
        }
      };
      expect(gfFeaturesUtils.hasNameOrDescription(feature)).to.be(true);

      feature.get = function(type) {
        if (type === 'description') {
          return 'feature_description';
        }
      };
      expect(gfFeaturesUtils.hasNameOrDescription(feature)).to.be(true);
    });

    it('gets coords or extent', function() {
      var coord = [0, 0];
      expect(gfFeaturesUtils.getCoords(coord)).to.be(coord);

      var geom = {
        getExtent: function() {
          return coord;
        }
      };
      expect(gfFeaturesUtils.getCoords(geom)).to.be(coord);
    });

    it('generates random ids', function() {
      var id1 = gfFeaturesUtils.getRandomId();
      var id2 = gfFeaturesUtils.getRandomId();

      expect(id1).not.to.be(id2);
    });
  });
});