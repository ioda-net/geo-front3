function communes(mapCenter) {
  var commune;
  return $http.get(gaGlobalOptions.apiUrl + '/communes', {
    params: {
      x: mapCenter[0],
      y: mapCenter[1]
    }
  });
}
