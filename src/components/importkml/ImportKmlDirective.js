goog.provide('ga_importkml_directive');

goog.require('ga_browsersniffer_service');
goog.require('ga_filereader_service');
goog.require('ga_map_service');
goog.require('ga_urlutils_service');
(function() {

  var module = angular.module('ga_importkml_directive', [
    'ga_browsersniffer_service',
    'ga_filereader_service',
    'ga_map_service',
    'ga_urlutils_service',
    'pascalprecht.translate'
  ]);

  module.controller('GaImportKmlDirectiveController',
      function($scope, $http, $q, $log, $translate, gaBrowserSniffer,
            gaLayers, gaKml, gaUrlUtils, gaFileReader) {
        $scope.isIE9 = (gaBrowserSniffer.msie == 9);
        $scope.isIE = !isNaN(gaBrowserSniffer.msie);
        $scope.currentTab = ($scope.isIE9) ? 2 : 1;
        $scope.file = null;
        $scope.userMessage = '';
        $scope.progress = 0;
        var fileReader = gaFileReader($scope);

        // Tabs management stuff
        $scope.activeTab = function(numTab) {
          $scope.currentTab = numTab;
          $scope.clearUserOutput();
        };
        $scope.getTabClass = function(numTab) {
          return (numTab === $scope.currentTab) ? 'active' : '';
        };

        // Load a KML file
        $scope.loadKML = function() {
          if ($scope.currentTab === 1) {
            $scope.handleFile();
          } else {
            $scope.handleFileUrl();
          }
        };

        // Handle fileURL
        $scope.handleFileUrl = function() {
          if ($scope.fileUrl) {
            $scope.cancel();// Kill the current uploading
            $scope.fileContent = null;
            $scope.userMessage = $translate.instant('uploading_file');
            $scope.progress = 0.1;
            $scope.canceler = $q.defer();

            // Angularjs doesn't handle onprogress event
            $http.get($scope.options.proxyUrl +
                encodeURIComponent($scope.fileUrl), {
              cache: true,
              timeout: $scope.canceler.promise
            }).success(function(data, status, headers, config) {
              var fileSize = headers('content-length');
              if (gaKml.isValidFileContent(data) &&
                  gaKml.isValidFileSize(fileSize)) {
                $scope.userMessage = $translate.instant('upload_succeeded');
                $scope.fileContent = data;
                $scope.fileSize = fileSize;
              } else {
                $scope.userMessage = $translate.instant('upload_failed');
                $scope.progress = 0;
              }
            })
            .error(function(data, status, headers, config) {
              $scope.userMessage = $translate.instant('upload_failed');
              $scope.progress = 0;
            });
          }
          $scope.isDropped = false;
        };

        // Handle a FileList (from input[type=file] or DnD),
        // works only with FileAPI
        $scope.handleFileList = function() {
          if ($scope.files && $scope.files.length > 0) {
            var file = $scope.files[0];
            if (gaKml.isValidFileSize(file.size)) {
              $scope.file = file;
              $scope.fileSize = file.size;
              if ($scope.isDropped) {
                $scope.handleFile();
              }
            }
          }
        };

        $scope.$on('gaFileProgress', function(evt, progress) {
          $scope.$apply(function() {
            $scope.progress = (progress.loaded / progress.total) * 80;
          });
        });

        // Callback when FileReader has finished
        var handleReaderLoadEnd = function(result) {
          if (gaKml.isValidFileContent(result)) {
            $scope.userMessage = $translate.instant('read_succeeded');
            $scope.fileContent = result;
          } else {
            handleReaderError();
          }
        };

        // Callback when FileReader has failed
        var handleReaderError = function() {
          $scope.userMessage = $translate.instant('read_failed');
          $scope.progress = 0;
        };

        // Handle a File (from a FileList),
        // works only with FileAPI
        $scope.handleFile = function() {
          if ($scope.file) {
            $scope.cancel();// Kill the current uploading
            $scope.fileContent = null;
            $scope.userMessage = $translate.instant('reading_file');
            $scope.progress = 0.1;

            // Read the file
            fileReader.readAsText($scope.file).then(function(result) {
              if (result) {
                handleReaderLoadEnd(result);
              }
            }, function() {
              handleReaderError();
            });
          }
          $scope.isDropped = false;
        };

        // Display the KML file content on the map
        $scope.displayFileContent = function() {
          if ($scope.fileContent) {
            $scope.userMessage = $translate.instant('parsing_file');
            $scope.progress = 80;

            try {
              // Add the layer
              gaKml.addKmlToMap($scope.map, $scope.fileContent, {
                url: ($scope.currentTab === 2) ? $scope.fileUrl :
                    $scope.file.name,
                useImageVector: gaKml.useImageVector($scope.fileSize),
                zoomToExtent: true
              });

              $scope.userMessage = $translate.instant('parse_succeeded');
              $scope.progress += 20;

            } catch (e) {
              $scope.userMessage = $translate.instant('parse_failed') +
                                   e.message;
              $scope.progress = 0;
            }
          }
        };

        $scope.clearUserOutput = function() {
          $scope.userMessage = '';
          $scope.progress = 0;
        };

        $scope.cancel = function() {
          $scope.userMessage = $translate.instant('operation_canceled');
          $scope.progress = 0;
          // Kill file reading
          fileReader.abort();
          // Kill $http request
          if ($scope.canceler) {
            $scope.canceler.resolve();
          }
        };

        $scope.reset = function() {
          $scope.cancel();
          $scope.clearUserOutput();
          $scope.file = null;
          $scope.files = null;
          $scope.fileUrl = null;
          $scope.fileContent = null;
        };
      }
  );

  module.directive('gaImportKml',
      function($log, $compile, $document, $translate, gaBrowserSniffer,
          gaUrlUtils) {
        return {
          restrict: 'A',
          templateUrl: 'components/importkml/partials/importkml.html',
          scope: {
            map: '=gaImportKmlMap',
            options: '=gaImportKmlOptions'
          },
          controller: 'GaImportKmlDirectiveController',
          link: function(scope, elt, attrs, controller) {

            // Use a local KML file only available on browser
            // more recent than ie9
            if (!gaBrowserSniffer.msie || gaBrowserSniffer.msie > 9) {

              var triggerInputFileClick = function() {
                elt.find('input[type="file"]').click();
              };

              // Trigger the hidden input[type=file] onclick event
              elt.find('button.ga-import-kml-browse').
                  click(triggerInputFileClick);
              elt.find('input[type=text][readonly]').
                  click(triggerInputFileClick);

              // Register input[type=file] onchange event, use HTML5 File api
              elt.find('input[type=file]').bind('change', function(evt) {
                if (evt.target.files && evt.target.files.length > 0) {
                  scope.clearUserOutput();
                  scope.$apply(function() {
                    scope.files = evt.target.files;
                  });
                }
              });


              // Register drag'n'drop events on <body>
              var dropZone = angular.element(
                  '<div class="ga-import-kml-drop-zone">' +
                  '  <div translate>drop_me_here</div>' +
                  '</div>');

              // Block drag of all elements by default to avoid unwanted display
              // of dropzone.
              $document.on('dragstart', function() {return false;});

              // Hide the drop zone on click, used when for some reasons unknown
              // the element stays displayed. See:
              // https://github.com/geoadmin/mf-geoadmin3/issues/1908
              dropZone.click(function() {
                this.style.display = 'none';
              });

              // We use $compile only for the translation,
              // $translate.instant("drop_me_here") didn't work in prod mode
              $compile(dropZone)(scope);

              var dragEnterZone = angular.element(document.body);
              dragEnterZone.append(dropZone);
              dragEnterZone.bind('dragenter', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                var types = evt.originalEvent.dataTransfer.types;
                if (types) {
                  var i, len = types.length;
                  for (i = 0; i < len; ++i) {
                    if (['files', 'text/plain']
                        .indexOf(types[i].toLowerCase()) > -1) {
                      dropZone.css('display', 'table');
                      break;
                    }
                  }
                }
              });

              dropZone.bind('dragleave', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                this.style.display = 'none';
              });

              dropZone.bind('dragover', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
              });

              dropZone.bind('drop', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
                this.style.display = 'none';

                // A file, an <a> html tag or a plain text url can be dropped
                var files = evt.originalEvent.dataTransfer.files;

                if (files && files.length > 0) {
                  scope.$apply(function() {
                    scope.isDropped = true;
                    scope.files = files;
                    scope.currentTab = 1;
                  });

                } else if (evt.originalEvent.dataTransfer.types) {
                  // No files so may be it's HTML link or a URL which has been
                  // dropped
                  var text = evt.originalEvent.dataTransfer
                      .getData('text/plain');

                  if (gaUrlUtils.isValid(text)) {
                    scope.$apply(function() {
                      scope.isDropped = true;
                      scope.fileUrl = text;
                      scope.currentTab = 2;
                    });

                  } else {
                    alert($translate.instant('drop_invalid_url') + text);
                  }

                } else {
                 // No FileAPI available
                }
              });

              // Watchers
              scope.$watchCollection('files', function() {
                scope.clearUserOutput();
                scope.handleFileList();
              });
            }

            scope.$watch('fileUrl', function() {
              scope.clearUserOutput();
              if (scope.isDropped) {
                scope.handleFileUrl();
              }
            });

            scope.$watch('fileContent', function() {
              scope.displayFileContent();
            });
          }
        };
      }
  );
})();
