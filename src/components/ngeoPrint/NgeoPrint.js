/**
 * @fileoverview Provides a function to create gf3Ngeo.Print objects used to
 * interact with MapFish Print v3 services.
 *
 * This module comes from the ngeo project:
 *  https://github.com/camptocamp/ngeo
 * It is published under the MIT license:
 *  https://github.com/camptocamp/ngeo/blob/master/LICENSE
 *
 * It is used to print with mapfish v3
 *
 * gf3Ngeo.Print objects expose the following methods:
 *
 * - createSpec: create a report specification object
 * - createReport: send a create report request
 * - getStatus: get the status of a report
 * - getReportUrl: get the URL of a report
 * - getCapabilities: get the capabilities of the server
 *
 * Example:
 *
 * var printBaseUrl = 'http://example.com/print';
 * var print = new gf3Ngeo.Print(printBaseUrl);
 *
 * var scale = 5000;
 * var dpi = 72;
 * var layout = 'A4 portrait';
 * var reportSpec = print.createSpec(map, scale, dpi, layout,
 *     {'title': 'A title for my report'});
 *
 * TODO and limitations:
 *
 * - createSpec should also accept a bbox instead of a center and a scale.
 * - Add support for ol.style.RegularShape. MapFish Print supports symbols
 *   like crosses, stars and squares, so printing regular shapes should be
 *   possible.
 * - ol.style.Icon may use a sprite image, and offsets to define to rectangle
 *   to use within the sprite. This type of icons won't be printed correctly
 *   as MapFish Print does not support sprite icons.
 *
 *
 * READ THIS
 * geo-front3 particularities:
 * - We rewrite the URL of images from KML to remove ogcproxy: this will let
 *   tomcat fetch the resource directly and will prevent authentication issues.
 */

goog.provide('gf3Ngeo.CreatePrint');
goog.provide('gf3Ngeo.Print');

goog.require('gf3Ngeo');
goog.require('goog.asserts');


/**
 * Functions below are taken from closure
 * to avoid goog.require('goog.color') and goog.require('goog.math') which
 * breaks stuff.
 */
gf3Ngeo.color = gf3Ngeo.color || {};
/**
 * To store stuff from goog.math
 * @type gf3Ngeo.math
 */
gf3Ngeo.math = gf3Ngeo.math || {};
/**
 * Takes a hex value and prepends a zero if it's a single digit.
 * Small helper method for use by goog.color and friends.
 * @param {string} hex Hex value to prepend if single digit.
 * @return {string} hex value prepended with zero if it was single digit,
 *     otherwise the same value that was passed in.
 */
gf3Ngeo.color.prependZeroIfNecessaryHelper = function(hex) {
  return hex.length == 1 ? '0' + hex : hex;
};

/**
 * Converts a color from RGB to hex representation.
 * @param {number} r Amount of red, int between 0 and 255.
 * @param {number} g Amount of green, int between 0 and 255.
 * @param {number} b Amount of blue, int between 0 and 255.
 * @return {string} hex representation of the color.
 */
gf3Ngeo.color.rgbToHex = function(r, g, b) {
  r = Number(r);
  g = Number(g);
  b = Number(b);
  if (r != (r & 255) || g != (g & 255) || b != (b & 255)) {
    throw Error('"(' + r + ',' + g + ',' + b + '") is not a valid RGB color');
  }
  var hexR = gf3Ngeo.color.prependZeroIfNecessaryHelper(r.toString(16));
  var hexG = gf3Ngeo.color.prependZeroIfNecessaryHelper(g.toString(16));
  var hexB = gf3Ngeo.color.prependZeroIfNecessaryHelper(b.toString(16));
  return '#' + hexR + hexG + hexB;
};

/**
 * Converts a color from RGB to hex representation.
 * @param {goog.color.Rgb} rgb rgb representation of the color.
 * @return {string} hex representation of the color.
 */
gf3Ngeo.color.rgbArrayToHex = function(rgb) {
  return gf3Ngeo.color.rgbToHex(rgb[0], rgb[1], rgb[2]);
};


/**
 * Converts radians to degrees.
 * @param {number} angleRadians Angle in radians.
 * @return {number} Angle in degrees.
 */
gf3Ngeo.math.toDegrees = function(angleRadians) {
  return angleRadians * 180 / Math.PI;
};


/**
 * @typedef {function(string):!gf3Ngeo.Print}
 */
gf3Ngeo.CreatePrint;


// ol.geom.GeometryType is only included in the debug version of OpenLayers.
// See: https://github.com/openlayers/ol3/issues/3671
/**
 * The geometry type. One of `'Point'`, `'LineString'`, `'LinearRing'`,
 * `'Polygon'`, `'MultiPoint'`, `'MultiLineString'`, `'MultiPolygon'`,
 * `'GeometryCollection'`, `'Circle'`.
 * @enum {string}
 */
ol.geom.GeometryType = {
  POINT: 'Point',
  LINE_STRING: 'LineString',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon',
  MULTI_POINT: 'MultiPoint',
  MULTI_LINE_STRING: 'MultiLineString',
  MULTI_POLYGON: 'MultiPolygon',
  GEOMETRY_COLLECTION: 'GeometryCollection',
  CIRCLE: 'Circle'
};


/**
 * @enum {string}
 */
gf3Ngeo.PrintStyleType = {
  LINE_STRING: 'LineString',
  POINT: 'Point',
  POLYGON: 'Polygon'
};


/**
 * @type {Object.<ol.geom.GeometryType, gf3Ngeo.PrintStyleType>}
 * @private
 */
gf3Ngeo.PrintStyleTypes_ = {};

gf3Ngeo.PrintStyleTypes_[ol.geom.GeometryType.LINE_STRING] =
    gf3Ngeo.PrintStyleType.LINE_STRING;
gf3Ngeo.PrintStyleTypes_[ol.geom.GeometryType.POINT] =
    gf3Ngeo.PrintStyleType.POINT;
gf3Ngeo.PrintStyleTypes_[ol.geom.GeometryType.POLYGON] =
    gf3Ngeo.PrintStyleType.POLYGON;
gf3Ngeo.PrintStyleTypes_[ol.geom.GeometryType.MULTI_LINE_STRING] =
    gf3Ngeo.PrintStyleType.LINE_STRING;
gf3Ngeo.PrintStyleTypes_[ol.geom.GeometryType.MULTI_POINT] =
    gf3Ngeo.PrintStyleType.POINT;
gf3Ngeo.PrintStyleTypes_[ol.geom.GeometryType.MULTI_POLYGON] =
    gf3Ngeo.PrintStyleType.POLYGON;



/**
 * @constructor
 * @param {string} url URL to MapFish print web service.
 * @param {angular.$http} $http Angular $http service.
 * @param {object} gaGlobalOptions Global options.
 */
gf3Ngeo.Print = function(url, $http, gaGlobalOptions) {
  /**
   * @type {string}
   * @private
   */
  this.url_ = url;

  /**
   * @type {angular.$http}
   * @private
   */
  this.$http_ = $http;

  this.printImagesUrl_ = gaGlobalOptions.printImagesUrl;
  this.printBaseTextSize_ = gaGlobalOptions.printBaseTextSize || 10;
  this.printBaseTextHaloSize_ = gaGlobalOptions.printBaseTextHaloSize || 1;
  this.printFont_ = gaGlobalOptions.printFont || 'DejaVu Sans';
};


/**
 * @const
 * @private
 */
gf3Ngeo.Print.FEAT_STYLE_PROP_PREFIX_ = '_ngeo_style_';


/**
 * Cancel a report.
 * @param {string} ref Print report reference.
 * @param {angular.$http.Config=} opt_httpConfig $http config object.
 * @return {angular.$http.HttpPromise} HTTP promise.
 */
gf3Ngeo.Print.prototype.cancel = function(ref, opt_httpConfig) {
  var httpConfig = goog.isDef(opt_httpConfig) ? opt_httpConfig :
      /** @type {angular.$http.Config} */ ({});
  var url = this.url_ + '/cancel/' + ref;
  // "delete" is a reserved word, so use ['delete']
  return this.$http_['delete'](url, httpConfig);
};


/**
 * Create a report specification.
 * @param {ol.Map} map Map.
 * @param {number} scale Scale.
 * @param {number} dpi DPI.
 * @param {string} layout Layout.
 * @param {Object.<string, *>} customAttributes Custom attributes.
 * @return {MapFishPrintSpec} The print spec.
 */
gf3Ngeo.Print.prototype.createSpec = function(
    map, scale, dpi, layout, customAttributes) {

  var specMap = /** @type {MapFishPrintMap} */ ({
    dpi: dpi
  });

  this.encodeMap_(map, scale, specMap);

  var attributes = /** @type {MapFishPrintAttributes} */ ({
    map: specMap
  });
  angular.extend(attributes, customAttributes);

  var spec = /** @type {MapFishPrintSpec} */ ({
    attributes: attributes,
    layout: layout
  });

  return spec;
};


/**
 * @param {ol.Map} map Map.
 * @param {number} scale Scale.
 * @param {MapFishPrintMap} object Object.
 * @private
 */
gf3Ngeo.Print.prototype.encodeMap_ = function(map, scale, object) {
  var view = map.getView();
  var viewCenter = view.getCenter();
  var viewProjection = view.getProjection();
  var viewResolution = view.getResolution();
  var viewRotation = view.getRotation();

  goog.asserts.assert(goog.isDef(viewCenter));
  goog.asserts.assert(goog.isDef(viewProjection));

  object.center = viewCenter;
  object.projection = viewProjection.getCode();
  object.rotation = viewRotation * 180 / Math.PI;
  object.scale = scale;
  object.layers = [];

  var layersCollection = map.getLayers();
  goog.asserts.assert(!goog.isNull(layersCollection));
  var layers = layersCollection.getArray().slice().reverse();

  this.encodeOverlays_(object.layers, map.getOverlays(), scale);
  layers.forEach(function(layer, idx, layers) {
        if (layer.visible) {
          goog.asserts.assert(goog.isDef(viewResolution));
          this.encodeLayer(object.layers, layer, viewResolution);
        }
      }, this);
};


/**
 * @param {Array.<MapFishPrintLayer>} arr Array.
 * @param {ol.layer.Base} layer Layer.
 * @param {number} resolution Resolution.
 */
gf3Ngeo.Print.prototype.encodeLayer = function(arr, layer, resolution) {
  if (layer instanceof ol.layer.Image) {
    this.encodeImageLayer_(arr, layer);
  } else if (layer instanceof ol.layer.Tile) {
    this.encodeTileLayer_(arr, layer);
  } else if (layer instanceof ol.layer.Vector) {
    this.encodeVectorLayer_(arr, layer, resolution);
  }
};


/**
 * @param {Array.<MapFishPrintLayer>} arr Array.
 * @param {ol.layer.Image} layer Layer.
 * @private
 */
gf3Ngeo.Print.prototype.encodeImageLayer_ = function(arr, layer) {
  goog.asserts.assertInstanceof(layer, ol.layer.Image);
  var source = layer.getSource();
  if (source instanceof ol.source.ImageWMS) {
    this.encodeImageWmsLayer_(arr, layer);
  }
};


/**
 * @param {Array.<MapFishPrintLayer>} arr Array.
 * @param {ol.layer.Image} layer Layer.
 * @private
 */
gf3Ngeo.Print.prototype.encodeImageWmsLayer_ = function(arr, layer) {
  var source = layer.getSource();

  goog.asserts.assertInstanceof(layer, ol.layer.Image);
  goog.asserts.assertInstanceof(source, ol.source.ImageWMS);

  var url = source.getUrl();
  if (goog.isDef(url)) {
    this.encodeWmsLayer_(
        arr, layer.getOpacity(), url, source.getParams());
  }
};


/**
 * @param {Array.<MapFishPrintLayer>} arr Array.
 * @param {number} opacity Opacity of the layer.
 * @param {string} url Url of the WMS server.
 * @param {Object} params Url parameters
 * @private
 */
gf3Ngeo.Print.prototype.encodeWmsLayer_ = function(arr, opacity, url, params) {
  var customParams = {'TRANSPARENT': true};
  angular.extend(customParams, params);

  delete customParams['LAYERS'];
  delete customParams['FORMAT'];
  delete customParams['VERSION'];

  var object = /** @type {MapFishPrintWmsLayer} */ ({
    baseURL: gf3Ngeo.Print.getAbsoluteUrl_(url),
    imageFormat: 'FORMAT' in params ? params['FORMAT'] : 'image/png',
    layers: params['LAYERS'].split(','),
    customParams: customParams,
    type: 'wms',
    opacity: opacity
  });
  arr.push(object);
};


/**
 * @param {string} url
 * @return {string} Absolute URL.
 * @private
 */
gf3Ngeo.Print.getAbsoluteUrl_ = function(url) {
  var a = document.createElement('a');
  a.href = encodeURI(url);
  return decodeURI(a.href);
};


/**
 * @param {Array.<MapFishPrintLayer>} arr Array.
 * @param {ol.layer.Tile} layer Layer.
 * @private
 */
gf3Ngeo.Print.prototype.encodeTileLayer_ = function(arr, layer) {
  goog.asserts.assertInstanceof(layer, ol.layer.Tile);
  var source = layer.getSource();
  if (source instanceof ol.source.WMTS) {
    this.encodeTileWmtsLayer_(arr, layer);
  } else if (source instanceof ol.source.TileWMS) {
    this.encodeTileWmsLayer_(arr, layer);
  }
};


/**
 * @param {Array.<MapFishPrintLayer>} arr Array.
 * @param {ol.layer.Tile} layer Layer.
 * @private
 */
gf3Ngeo.Print.prototype.encodeTileWmtsLayer_ = function(arr, layer) {
  goog.asserts.assertInstanceof(layer, ol.layer.Tile);
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.WMTS);

  var projection = source.getProjection();
  var tileGrid = source.getTileGrid();
  goog.asserts.assertInstanceof(tileGrid, ol.tilegrid.WMTS);
  var matrixIds = tileGrid.getMatrixIds();

  // FIXME:
  // matrixSize assumes a regular grid

  /** @type {Array.<MapFishPrintWmtsMatrix>} */
  var matrices = [];

  for (var i = 0, ii = matrixIds.length; i < ii; ++i) {
    var sqrZ = Math.pow(2, i);
    matrices.push(/** @type {MapFishPrintWmtsMatrix} */ ({
      identifier: matrixIds[i],
      scaleDenominator: tileGrid.getResolution(i) *
          projection.getMetersPerUnit() / 0.28E-3,
      tileSize: ol.size.toSize(tileGrid.getTileSize(i)),
      topLeftCorner: tileGrid.getOrigin(i),
      matrixSize: [sqrZ, sqrZ]
    }));
  }

  var dimensions = source.getDimensions();
  var dimensionKeys = Object.keys(dimensions);

  var object = /** @type {MapFishPrintWmtsLayer} */ ({
    baseURL: this.getWmtsUrl_(source),
    dimensions: dimensionKeys,
    dimensionParams: dimensions,
    imageFormat: source.getFormat(),
    layer: source.getLayer(),
    matrices: matrices,
    matrixSet: source.getMatrixSet(),
    opacity: layer.getOpacity(),
    requestEncoding: /** @type {string} */ (source.getRequestEncoding()),
    style: source.getStyle(),
    type: 'WMTS',
    version: source.getVersion()
  });

  arr.push(object);
};


/**
 * @param {Array.<MapFishPrintLayer>} arr Array.
 * @param {ol.layer.Tile} layer Layer.
 * @private
 */
gf3Ngeo.Print.prototype.encodeTileWmsLayer_ = function(arr, layer) {
  var source = layer.getSource();

  goog.asserts.assertInstanceof(layer, ol.layer.Tile);
  goog.asserts.assertInstanceof(source, ol.source.TileWMS);

  this.encodeWmsLayer_(
      arr, layer.getOpacity(), source.getUrls()[0], source.getParams());
};


/**
 * @param {Array.<MapFishPrintLayer>} arr Array.
 * @param {ol.layer.Vector} layer Layer.
 * @param {number} resolution Resolution.
 * @private
 */
gf3Ngeo.Print.prototype.encodeVectorLayer_ = function(arr, layer, resolution) {
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.Vector);

  var features = source.getFeatures();

  var geojsonFormat = new ol.format.GeoJSON();

  var /** @type {Array.<GeoJSONFeature>} */ geojsonFeatures = [];
  var mapfishStyleObject = /** @type {MapFishPrintVectorStyle} */ ({
    version: 2
  });

  for (var i = 0, ii = features.length; i < ii; ++i) {
    var feature = features[i];
    // Skip features that must not be printed
    if ('properties' in feature && 'print' in feature.properties &&
        !feature.properties.print) {
      continue;
    }

    var geometry = feature.getGeometry();

    // no need to encode features with no geometry
    if (!goog.isDefAndNotNull(geometry)) {
      continue;
    }

    var geometryType = geometry.getType();
    var geojsonFeature = geojsonFormat.writeFeatureObject(feature);

    if (geojsonFeature.hasOwnProperty('properties') &&
            geojsonFeature.properties &&
            geojsonFeature.properties.hasOwnProperty('overlays')) {
      delete geojsonFeature.properties.overlays;
    }

    var styles = null;
    var styleFunction = feature.getStyleFunction();
    if (goog.isDef(styleFunction)) {
      styles = styleFunction.call(feature, resolution);
    } else {
      styleFunction = layer.getStyleFunction();
      if (goog.isDef(styleFunction)) {
        styles = styleFunction.call(layer, feature, resolution);
      }
    }
    if (!goog.isNull(styles) && styles.length > 0) {
      geojsonFeatures.push(geojsonFeature);
      if (goog.isNull(geojsonFeature.properties)) {
        geojsonFeature.properties = {};
      }
      for (var j = 0, jj = styles.length; j < jj; ++j) {
        var style = styles[j];
        var styleId = goog.getUid(style).toString();
        var featureStyleProp = gf3Ngeo.Print.FEAT_STYLE_PROP_PREFIX_ + j;
        // A line can have multiple style. If the first has a dash style but
        // not the others, a solid line will be drawn. We check if the previous
        // style is dashed. If so, we force all the other style to be.
        var mustAddDash = this.isPreviousDashed_(styles, j);
        this.encodeVectorStyle_(
            mapfishStyleObject, geometryType, style, styleId, featureStyleProp,
            mustAddDash);
        geojsonFeature.properties[featureStyleProp] = styleId;
      }
    }
  }

  // MapFish Print fails if there are no style rules, even if there are no
  // features either. To work around this we just ignore the layer if the
  // array of GeoJSON features is empty.
  // See https://github.com/mapfish/mapfish-print/issues/279

  if (geojsonFeatures.length > 0) {
    var geojsonFeatureCollection = /** @type {GeoJSONFeatureCollection} */ ({
      type: 'FeatureCollection',
      features: geojsonFeatures
    });
    var object = /** @type {MapFishPrintVectorLayer} */ ({
      geoJson: geojsonFeatureCollection,
      opacity: layer.getOpacity(),
      style: mapfishStyleObject,
      type: 'geojson'
    });
    arr.push(object);
  }
};


/**
 *
 * @param {Array} styles Array of style for this feature.
 * @param {int} j Index of current style.
 * @return {bool} Return if the previous style has a dash style.
 * @private
 */
gf3Ngeo.Print.prototype.isPreviousDashed_ = function(styles, j) {
  if (j > 0) {
    var previousStyle = styles[j - 1];
    var strokeStyle = previousStyle.getStroke();
    if (!goog.isNull(strokeStyle)) {
      return !goog.isNull(strokeStyle.getLineDash());
    } else {
      return false;
    }
  } else {
    return false;
  }
};


/**
 * @param {MapFishPrintVectorStyle} object MapFish style object.
 * @param {ol.geom.GeometryType} geometryType Type of the GeoJSON geometry
 * @param {ol.style.Style} style Style.
 * @param {string} styleId Style id.
 * @param {string} featureStyleProp Feature style property name.
 * @param {bool} mustAddDashStyle
 * @private
 */
gf3Ngeo.Print.prototype.encodeVectorStyle_ =
    function(object, geometryType, style, styleId, featureStyleProp,
      mustAddDashStyle) {
  if (!(geometryType in gf3Ngeo.PrintStyleTypes_)) {
    // unsupported geometry type
    return;
  }
  var styleType = gf3Ngeo.PrintStyleTypes_[geometryType];
  var key = '[' + featureStyleProp + ' = \'' + styleId + '\']';
  if (key in object) {
    // do nothing if we already have a style object for this CQL rule
    return;
  }
  var styleObject = /** @type {MapFishPrintSymbolizers} */ ({
    symbolizers: []
  });
  object[key] = styleObject;
  var fillStyle = style.getFill();
  var imageStyle = style.getImage();
  var strokeStyle = style.getStroke();
  var textStyle = style.getText();
  if (styleType == gf3Ngeo.PrintStyleType.POLYGON) {
    if (!goog.isNull(fillStyle)) {
      this.encodeVectorStylePolygon_(
          styleObject.symbolizers, fillStyle, strokeStyle, mustAddDashStyle);
    }
  } else if (styleType == gf3Ngeo.PrintStyleType.LINE_STRING) {
    if (!goog.isNull(strokeStyle)) {
      this.encodeVectorStyleLine_(
          styleObject.symbolizers, strokeStyle, mustAddDashStyle);
    }
  } else if (styleType == gf3Ngeo.PrintStyleType.POINT) {
    if (!goog.isNull(imageStyle)) {
      this.encodeVectorStylePoint_(styleObject.symbolizers, imageStyle);
    }
  }
  if (!goog.isNull(textStyle)) {
    this.encodeTextStyle_(styleObject.symbolizers, textStyle);
  }
};


/**
 * @param {MapFishPrintSymbolizer} symbolizer MapFish Print symbolizer.
 * @param {!ol.style.Fill} fillStyle Fill style.
 * @private
 */
gf3Ngeo.Print.prototype.encodeVectorStyleFill_ =
    function(symbolizer, fillStyle) {
  var fillColor = fillStyle.getColor();
  if (!goog.isNull(fillColor)) {
    var fillColorRgba = ol.color.asArray(fillColor);
    symbolizer.fillColor = gf3Ngeo.color.rgbArrayToHex(fillColorRgba);
    symbolizer.fillOpacity = fillColorRgba[3];
  }
};


/**
 * @param {Array.<MapFishPrintSymbolizer>} symbolizers Array of MapFish Print
 *     symbolizers.
 * @param {!ol.style.Stroke} strokeStyle Stroke style.
 * @param {bool} mustAddDashStyle Whether to force a dash style to be appended.
 * @private
 */
gf3Ngeo.Print.prototype.encodeVectorStyleLine_ =
    function(symbolizers, strokeStyle, mustAddDashStyle) {
  var symbolizer = /** @type {MapFishPrintSymbolizerLine} */ ({
    type: 'line'
  });
  this.encodeVectorStyleStroke_(symbolizer, strokeStyle, mustAddDashStyle);
  symbolizers.push(symbolizer);
};


/**
 * @param {Array.<MapFishPrintSymbolizer>} symbolizers Array of MapFish Print
 *     symbolizers.
 * @param {!ol.style.Image} imageStyle Image style.
 * @private
 */
gf3Ngeo.Print.prototype.encodeVectorStylePoint_ =
    function(symbolizers, imageStyle) {
  var symbolizer;
  if (imageStyle instanceof ol.style.Circle) {
    symbolizer = /** @type {MapFishPrintSymbolizerPoint} */ ({
      type: 'point'
    });
    symbolizer.pointRadius = imageStyle.getRadius();
    var fillStyle = imageStyle.getFill();
    if (!goog.isNull(fillStyle)) {
      this.encodeVectorStyleFill_(symbolizer, fillStyle);
    }
    var strokeStyle = imageStyle.getStroke();
    if (!goog.isNull(strokeStyle)) {
      this.encodeVectorStyleStroke_(symbolizer, strokeStyle);
    }
  } else if (imageStyle instanceof ol.style.Icon) {
    var src = imageStyle.getSrc();
    if (goog.isDef(src)) {
      var re = new RegExp('^https?:\\/\\/' +
          location.host.replace(/\./g, '\\.') +
          '\\/api\\/ogcproxy\\?url=(.*)');
      var match = re.exec(src);
      if (match !== null) {
        src = match[1];
      }
      symbolizer = /** @type {MapFishPrintSymbolizerPoint} */ ({
        type: 'point',
        externalGraphic: src
      });
      var rotation = imageStyle.getRotation();
      if (rotation !== 0) {
        symbolizer.rotation = gf3Ngeo.math.toDegrees(rotation);
      }
    }
  }
  if (goog.isDef(symbolizer)) {
    symbolizers.push(symbolizer);
  }
};


/**
 * @param {Array.<MapFishPrintSymbolizer>} symbolizers Array of MapFish Print
 *     symbolizers.
 * @param {!ol.style.Fill} fillStyle Fill style.
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 * @param {bool} mustAddDashStyle Whether to force a dash style to be appended.
 * @private
 */
gf3Ngeo.Print.prototype.encodeVectorStylePolygon_ =
    function(symbolizers, fillStyle, strokeStyle, mustAddDashStyle) {
  var symbolizer = /** @type {MapFishPrintSymbolizerPolygon} */ ({
    type: 'polygon'
  });
  this.encodeVectorStyleFill_(symbolizer, fillStyle);
  if (!goog.isNull(strokeStyle)) {
    this.encodeVectorStyleStroke_(symbolizer, strokeStyle, mustAddDashStyle);
  }
  symbolizers.push(symbolizer);
};


/**
 * @param {MapFishPrintSymbolizer} symbolizer MapFish Print symbolizer.
 * @param {!ol.style.Stroke} strokeStyle Stroke style.
 * @param {bool} mustAddDashStyle Whether to force a dash style to be appended.
 * @private
 */
gf3Ngeo.Print.prototype.encodeVectorStyleStroke_ =
    function(symbolizer, strokeStyle, mustAddDashStyle) {
  var strokeColor = strokeStyle.getColor();
  if (!goog.isNull(strokeColor)) {
    var strokeColorRgba = ol.color.asArray(strokeColor);
    symbolizer.strokeColor = gf3Ngeo.color.rgbArrayToHex(strokeColorRgba);
    symbolizer.strokeOpacity = strokeColorRgba[3];
  }
  var strokeWidth = strokeStyle.getWidth();
  if (goog.isDef(strokeWidth)) {
    symbolizer.strokeWidth = strokeWidth;
  }
  var strokeDash = strokeStyle.getLineDash();
  if (!goog.isNull(strokeDash) || mustAddDashStyle) {
    symbolizer.strokeDashstyle = 'dash';
  }
};


/**
 * @param {Array.<MapFishPrintSymbolizer>} symbolizers Array of MapFish Print
 *     symbolizers.
 * @param {!ol.style.Text} textStyle Text style.
 * @private
 */
gf3Ngeo.Print.prototype.encodeTextStyle_ = function(symbolizers, textStyle) {
  var symbolizer = /** @type {MapFishPrintSymbolizerText} */ ({
    type: 'Text'
  });
  var label = textStyle.getText();
  if (goog.isDef(label)) {
    symbolizer.label = label;

    var labelAlign = textStyle.getTextAlign();
    if (goog.isDef(labelAlign)) {
      symbolizer.labelAlign = labelAlign;
    }

    var labelRotation = textStyle.getRotation();
    if (goog.isDef(labelRotation)) {
      // Mapfish Print expects a string, not a number to rotate text
      symbolizer.labelRotation = (labelRotation * 180 / Math.PI).toString();
    }

    var fontStyle = textStyle.getFont();
    if (goog.isDef(fontStyle)) {
      var font = fontStyle.split(' ');
      var scale = textStyle.getScale() || 1;
      if (font.length >= 3) {
        symbolizer.fontWeight = font[0];
        symbolizer.fontSize = this.printBaseTextSize_ * scale + 'px';
        symbolizer.fontFamily = font.splice(2).join(' ');
      }
    }

    var strokeStyle = textStyle.getStroke();
    if (!goog.isNull(strokeStyle)) {
      var strokeColorRgba = ol.color.asArray(strokeStyle.getColor());
      symbolizer.haloColor = gf3Ngeo.color.rgbArrayToHex(strokeColorRgba);
      symbolizer.haloOpacity = strokeColorRgba[3];
      var width = strokeStyle.getWidth();
      if (goog.isDef(width)) {
        symbolizer.haloRadius = this.printBaseTextHaloSize_;
      }
    }

    var fillStyle = textStyle.getFill();
    if (!goog.isNull(fillStyle)) {
      var fillColorRgba = ol.color.asArray(fillStyle.getColor());
      symbolizer.fontColor = gf3Ngeo.color.rgbArrayToHex(fillColorRgba);
    }

    // Mapfish Print allows offset only if labelAlign is defined.
    if (goog.isDef(symbolizer.labelAlign)) {
      symbolizer.labelXOffset = textStyle.getOffsetX();
      // Mapfish uses the opposite direction of OpenLayers for y axis, so the
      // minus sign is required for the y offset to be identical.
      symbolizer.labelYOffset = -textStyle.getOffsetY();
    }

    symbolizers.push(symbolizer);
  }
};


/**
 * Return the WMTS URL to use in the print spec.
 * @param {ol.source.WMTS} source The WMTS source.
 * @return {string} URL.
 * @private
 */
gf3Ngeo.Print.prototype.getWmtsUrl_ = function(source) {
  var urls = source.getUrls();
  goog.asserts.assert(urls.length > 0);
  var url = urls[0];
  // Replace {Layer} in the URL
  // See <https://github.com/mapfish/mapfish-print/issues/236>
  var layer = source.getLayer();
  if (url.indexOf('{Layer}') >= 0) {
    url = url.replace('{Layer}', layer);
  }
  return gf3Ngeo.Print.getAbsoluteUrl_(url);
};


/**
 * Encode map overlays. Imported from Swisstopo.
 * @param {type} arr
 * @param {Array} overlays
 * @param {int} scale
 * @private
 */
gf3Ngeo.Print.prototype.encodeOverlays_ = function(arr, overlays, scale) {
  var printImagesUrl = this.printImagesUrl_;
  var yOffset =
      (27 / gf3Ngeo.PrintUtils.DOTS_PER_INCH_ /
        gf3Ngeo.PrintUtils.INCHES_PER_METER_ * scale);
  var bubbleYOffset = yOffset / 2.7;
  overlays.forEach(function(overlay) {
    var elt = overlay.getElement();
    // We print only overlay for measure
    if ($(elt).hasClass('popover') || $(elt).hasClass('marker')) {
      return;
    }
    var center = overlay.getPosition();

    if (center) {
      var encOverlayLayer = {
        type: 'geoJson',
        style: {
          version: 2,
          "[_ngeo_style_0 = 'measure']": {
            symbolizers: [{
                type: 'Text',
                label: $(elt).text(),
                labelAlign: 'center',
                fontColor: '#ffffff',
                fontSize: 7,
                fontWeight: 'bold',
                fontFamily: this.printFont_
              }, {
                type: 'Point',
                externalGraphic: printImagesUrl + '/print-bubble.png',
                graphicWidth: $(elt).width() / 5
              }]
          }
        },
        geoJson: {
          type: 'FeatureCollection',
          features: [{
              type: 'Feature',
              properties: {
                name: $(elt).text(),
                type: 'annotation',
                _ngeo_style_0: 'measure'
              },
              geometry: {
                type: 'Point',
                coordinates: [center[0], center[1] + bubbleYOffset, 0]
              }
            }]
        },
        opacity: 1
      };
      arr.push(encOverlayLayer);
    }
  });
};


/**
 * Send a create report request to the MapFish Print service.
 * @param {MapFishPrintSpec} printSpec Print specification.
 * @param {angular.$http.Config=} opt_httpConfig $http config object.
 * @return {angular.$http.HttpPromise} HTTP promise.
 */
gf3Ngeo.Print.prototype.createReport = function(printSpec, opt_httpConfig) {
  var url = this.url_ + '/report.pdf';
  var httpConfig = /** @type {angular.$http.Config} */ ({
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    }
  });
  angular.extend(httpConfig,
      goog.isDef(opt_httpConfig) ? opt_httpConfig : {});
  return this.$http_.post(url, printSpec, httpConfig);
};


/**
 * Get the status of a report.
 * @param {string} ref Print report reference.
 * @param {angular.$http.Config=} opt_httpConfig $http config object.
 * @return {angular.$http.HttpPromise} HTTP promise.
 */
gf3Ngeo.Print.prototype.getStatus = function(ref, opt_httpConfig) {
  var httpConfig = goog.isDef(opt_httpConfig) ? opt_httpConfig :
      /** @type {angular.$http.Config} */ ({});
  var url = this.url_ + '/status/' + ref + '.json';
  return this.$http_.get(url, httpConfig);
};


/**
 * Get the URL of a report.
 * @param {string} ref Print report reference.
 * @return {string} The report URL for this ref.
 */
gf3Ngeo.Print.prototype.getReportUrl = function(ref) {
  return this.url_ + '/report/' + ref;
};


/**
 * Get the print capabilities from MapFish Print.
 * @param {angular.$http.Config=} opt_httpConfig $http config object.
 * @return {angular.$http.HttpPromise} HTTP promise.
 */
gf3Ngeo.Print.prototype.getCapabilities = function(opt_httpConfig) {
  var httpConfig = goog.isDef(opt_httpConfig) ? opt_httpConfig :
          /** @type {angular.$http.Config} */ ({});
  var url = this.url_ + '/capabilities.json';
  return this.$http_.get(url, httpConfig);
};


/**
 * @param {angular.$http} $http Angular $http service.
 * @return {gf3Ngeo.CreatePrint} The function to create a print service.
 * @param {object} gaGlobalOptions Global options.
 * @ngInject
 */
gf3Ngeo.createPrintServiceFactory = function($http, gaGlobalOptions) {
  return (
      /**
       * @param {string} url URL to MapFish print service.
       */
      function(url) {
        return new gf3Ngeo.Print(url, $http, gaGlobalOptions);
      });
};


gf3NgeoModule.factory('ngeoCreatePrint', gf3Ngeo.createPrintServiceFactory);
