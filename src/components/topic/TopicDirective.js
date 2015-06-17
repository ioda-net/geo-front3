goog.provide('ga_topic_directive');

goog.require('ga_map_service');
goog.require('ga_permalink');
(function() {

  var module = angular.module('ga_topic_directive', [
    'pascalprecht.translate',
    'ga_map_service',
    'ga_permalink'
  ]);

  module.directive('gaTopic',
      function($rootScope, $http, $q, gaPermalink, gaLayers) {
        return {
          restrict: 'A',
          replace: true,
          templateUrl: function(element, attrs) {
            return 'components/topic/partials/topic.' +
              ((attrs.gaTopicUi == 'select') ? 'select.html' : 'html');
          },
          scope: {
            options: '=gaTopicOptions',
            map: '=gaTopicMap'
          },
          link: function(scope, element, attrs) {
            var options = scope.options;

            function isValidTopicId(id) {
              var i, len = scope.topics.length;
              for (i = 0; i < len; i++) {
                if (scope.topics[i].id == id) {
                  return true;
                }
              }
              return false;
            }

            function initTopics() {
              var topicId = gaPermalink.getParams().topic;
              if (isValidTopicId(topicId)) {
                scope.activeTopic = topicId;
              } else {
                scope.activeTopic = options.defaultTopicId;
              }
            }

            function extendLangs(langs) {
              var res = [];
              angular.forEach(langs.split(','), function(lang) {
                res.push({
                  label: angular.uppercase(lang),
                  value: lang
                });
              });
              return res;
            }

            var loadTopics = function(url) {
              var deferred = $q.defer();
              $http.get(url).
                success(function(data) {
                  var topics = data.topics;
                  angular.forEach(topics, function(value) {
                    value.tooltip = 'topic_' + value.id + '_tooltip';
                    value.thumbnail =
                        options.thumbnailUrlTemplate.
                            replace('{Topic}', value.id);
                    value.langs = extendLangs(value.langs);
                  });
                  deferred.resolve(topics);
                }).
                error(function() {
                  deferred.reject();
                });
              return deferred.promise;
            };

            // Because ng-repeat creates a new scope for each item in the
            // collection we can't use ng-click="activeTopic = topic" in
            // the template. Hence this intermediate function.
            // see: https://groups.google.com/forum/#!topic/angular/nS80gSdZBsE
            scope.setActiveTopic = function(topicId) {
              scope.activeTopic = topicId;
            };

            var find = function(id) {
              for (var i = 0, len = scope.topics.length; i < len; i++) {
                var topic = scope.topics[i];
                if (topic.id == id) {
                  return topic;
                }
              }
            };
            scope.$watch('activeTopic', function(newVal) {
              if (newVal && scope.topics) {
                var topic = find(newVal);
                if (topic) {
                  gaPermalink.updateParams({topic: newVal});
                  $rootScope.$broadcast('gaTopicChange', topic);
                }
              }
              $('.ga-topic-item').tooltip({
                placement: 'bottom'
              });
            });

            $rootScope.$on('gaNetworkStatusChange', function(evt, offline) {
              // When page is loaded directly in  offline mode we use the
              // default (ech) topic, so when we go back to online mode
              // we must reload the correct topic. The event reload the catalog
              // too.
              if (!offline) {
                $rootScope.$broadcast('gaTopicChange', find(scope.activeTopic));
              }
            });

            $rootScope.$on('$translateChangeEnd', function() {
              if (!scope.topics) {
                loadTopics(options.url).then(
                  function(topics) {
                    scope.topics = topics;
                    initTopics();
                  }
                );
              }
            });
         }
       };
      });
})();
