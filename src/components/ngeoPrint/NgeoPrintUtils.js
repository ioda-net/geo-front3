/**
 * @fileoverview Provides a service with print utility functions.
 *
 * This module comes from the ngeo project:
 *  https://github.com/camptocamp/ngeo
 * It is published under the MIT license:
 *  https://github.com/camptocamp/ngeo/blob/master/LICENSE
 *
 * It is used to print with mapfish v3
 */

goog.provide('gf3Ngeo.PrintUtils');

goog.require('gf3Ngeo');



/**
 * @constructor
 */
gf3Ngeo.PrintUtils = function() {
};


/**
 * @const
 * @private
 */
gf3Ngeo.PrintUtils.INCHES_PER_METER_ = 39.37;


/**
 * @const
 * @private
 */
gf3Ngeo.PrintUtils.DOTS_PER_INCH_ = 72;


/**
 * Return a function to use as map postcompose listener for drawing a print
 * mask on the map.
 * @param {function():ol.Size} getSize User-defined function returning the
 * size in dots of the map to print.
 * @param {function(olx.FrameState):number} getScale User-defined function
 * returning the scale of the map to print.
 * @return {function(ol.render.Event)} Function to use as a map postcompose
 * listener.
 */
gf3Ngeo.PrintUtils.prototype.createPrintMaskPostcompose =
    function(getSize, getScale) {
  var self = this;

  return (
      /**
       * @param {ol.render.Event} evt Postcompose event.
       */
      function(evt) {
        var context = evt.context;
        var frameState = evt.frameState;

        var resolution = frameState.viewState.resolution;

        var viewportWidth = frameState.size[0] * frameState.pixelRatio;
        var viewportHeight = frameState.size[1] * frameState.pixelRatio;

        var centerX = viewportWidth / 2;
        var centerY = viewportHeight / 2;

        var size = getSize();
        var scale = getScale(frameState);

        var ppi = gf3Ngeo.PrintUtils.DOTS_PER_INCH_;
        var ipm = gf3Ngeo.PrintUtils.INCHES_PER_METER_;

        var extentHalfWidth =
            (((size[0] / ppi) / ipm) * scale / resolution) / 2;
        self.extentHalfHorizontalDistance_ =
            (((size[0] / ppi) / ipm) * scale) / 2;

        var extentHalfHeight =
            (((size[1] / ppi) / ipm) * scale / resolution) / 2;
        self.extentHalfVerticalDistance_ =
                (((size[1] / ppi) / ipm) * scale) / 2;

        var minx = centerX - extentHalfWidth;
        var miny = centerY - extentHalfHeight;
        var maxx = centerX + extentHalfWidth;
        var maxy = centerY + extentHalfHeight;

        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(viewportWidth, 0);
        context.lineTo(viewportWidth, viewportHeight);
        context.lineTo(0, viewportHeight);
        context.lineTo(0, 0);
        context.closePath();

        context.moveTo(minx, miny);
        context.lineTo(minx, maxy);
        context.lineTo(maxx, maxy);
        context.lineTo(maxx, miny);
        context.lineTo(minx, miny);
        context.closePath();

        context.fillStyle = 'rgba(0, 5, 25, 0.5)';
        context.fill();
      });
};


/**
 * Get the optimal print scale for a map.
 * @param {ol.Size} mapSize Size of the map on the screen (px).
 * @param {number} mapResolution Resolution of the map on the screen.
 * @param {ol.Size} printMapSize Size of the map on the paper (dots).
 * @param {Array.<number>} printMapScales Supported map scales on the paper.
 * @return {number} The best scale.
 */
gf3Ngeo.PrintUtils.prototype.getOptimalScale = function(
    mapSize, mapResolution, printMapSize, printMapScales) {

  var mapWidth = mapSize[0] * mapResolution;
  var mapHeight = mapSize[1] * mapResolution;

  var scaleWidth = mapWidth * gf3Ngeo.PrintUtils.INCHES_PER_METER_ *
      gf3Ngeo.PrintUtils.DOTS_PER_INCH_ / printMapSize[0];
  var scaleHeight = mapHeight * gf3Ngeo.PrintUtils.INCHES_PER_METER_ *
      gf3Ngeo.PrintUtils.DOTS_PER_INCH_ / printMapSize[1];

  var scale = Math.min(scaleWidth, scaleHeight);
  var optimal = printMapScales[0];

  for (var i = 0, ii = printMapScales.length; i < ii; ++i) {
    if (scale > printMapScales[i]) {
      optimal = printMapScales[i];
    }
  }

  return optimal;
};


/**
 * Get the coordinates of the bottom left corner of the printed map.
 * @param {ol.Coordinate} mapCenter Center of the map to print.
 * @return {ol.Coordinate} The coordinates of the bottom left corner.
 */
gf3Ngeo.PrintUtils.prototype.getBottomLeftCorner = function(mapCenter) {
  return [mapCenter[0] - this.extentHalfHorizontalDistance_,
    mapCenter[1] - this.extentHalfVerticalDistance_];
};


/**
 * Get the coordinates of the bottom rigth corner of the printed map.
 * @param {ol.Coordinate} mapCenter Center of the map to print.ç
 * @return {ol.Coordinate} The coordinates of the bottom rigth corner.
 */
gf3Ngeo.PrintUtils.prototype.getBottomRightCorner = function(mapCenter) {
  return [mapCenter[0] + this.extentHalfHorizontalDistance_,
    mapCenter[1] - this.extentHalfVerticalDistance_];
};


/**
 * Get the coordinates of the up left corner of the printed map.
 * @param {ol.Coordinate} mapCenter Center of the map to print.
 * @return {ol.Coordinate} The coordinates of the up left corner.
 */
gf3Ngeo.PrintUtils.prototype.getUpLeftCorner = function(mapCenter) {
  return [mapCenter[0] - this.extentHalfHorizontalDistance_,
    mapCenter[1] + this.extentHalfVerticalDistance_];
};


/**
 * Get the coordinates of the up right corner of the printed map.
 * @param {ol.Coordinate} mapCenter Center of the map to print.
 * @return {ol.Coordinate} The coordinates of the up right corner.
 */
gf3Ngeo.PrintUtils.prototype.getUpRightCorner = function(mapCenter) {
  return [mapCenter[0] + this.extentHalfHorizontalDistance_,
    mapCenter[1] + this.extentHalfVerticalDistance_];
};


gf3NgeoModule
        .service('ngeoPrintUtils', gf3Ngeo.PrintUtils);
