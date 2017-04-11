goog.provide('gf3_edit_utils_service');

(function() {
  var module = angular.module('gf3_edit_utils_service', []);

  module.factory('gf3EditUtils', function() {
    var MIN_NB_POINTS = {
      'point': 1,
      'line': 2,
      'linestring': 2,
      'polygon': 3
    };

    return {
      hasFeatureEnoughPoints: hasFeatureEnoughPoints,
      isInInputField: isInInputField,
      onEdge: onEdge,
      onVertex: onVertex,
      removeLastPoint: removeLastPoint
    };

    function onEdge(feature, coords) {
      var featureGeom = feature.getGeometry();
      var closestPoint = featureGeom.getClosestPoint(coords);

      return closestPoint[0] === coords[0] &&
          closestPoint[1] === coords[1];
    }

    function onVertex(layer, feature, coords) {
      var onPoint = false;

      var featureCoords = feature.getGeometry().getCoordinates();
      var featurePoints =
          getPointsList(featureCoords, layer.geometry);
      featurePoints.forEach(function(point) {
        if (point[0] === coords[0] && point[1] === coords[1]) {
          onPoint = true;
        }
      });

      return onPoint;
    }

    function getPointsList(coords, geometryType) {
      switch (geometryType) {
        case 'line':
          return coords;
        case 'polygon':
          return coords[0];
        case 'point':
          return [coords];
        default:
          return coords;
      }
    }

    function hasFeatureEnoughPoints(layer, feature) {
      if (!feature) {
        return;
      }

      var minNbPoints = MIN_NB_POINTS[layer.geometry];
      var points = getPointsList(feature.getGeometry().getCoordinates());

      // We need to use a strict comparision: when we are adding a feature,
      // the position of the cursor (point not added yet) is counted among
      // the points. It means that when drawing a line, if the user has
      // only added one points, the feature has two.
      return points.length > minNbPoints;
    }

    // Taken from the draw directive.
    function removeLastPoint(event) {
      if (event.data && event.which === 46 &&
          !isInInputField(event)) {
        event.data.removeLastPoint();
      }
    }

    function isInInputField(event) {
      return /^(input|textarea)$/i.test(event.target.nodeName);
    }
  });
})();
