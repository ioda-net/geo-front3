function communes(mapCenter) {
  var commune;
  return $http.get(gaGlobalOptions.apiUrl + '/communes?x=' + mapCenter[0] + '&y=' + mapCenter[1]);
}
