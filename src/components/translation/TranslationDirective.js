goog.provide('ga_translation_directive');
(function() {

  var module = angular.module('ga_translation_directive', [
    'ga_permalink',
    'pascalprecht.translate'
  ]);

  module.directive('gaTranslationSelector', function($translate, $window,
      gaBrowserSniffer, gaPermalink) {
    return {
      restrict: 'A',
      scope: {
        options: '=gaTranslationSelectorOptions'
      },
      templateUrl: function() {
        return 'components/translation/partials/translation' +
            ((gaBrowserSniffer.mobile) ? 'mobile' : 'desktop') + '.html';
      },
      link: function(scope, element, attrs) {
        scope.$watch('lang', function(value) {
          $translate.use(value).then(angular.noop, function(lang) {
            // failed to load lang from server, fallback to default code.
            scope.lang = scope.options.fallbackCode;
          });
          gaPermalink.updateParams({lang: value});
        });

        function topicSupportsLang(topic, lang) {
          var i;
          var langs = topic.langs;
          for (i = 0; i < langs.length; i++) {
            if (langs[i].value === lang) {
              return true;
            }
          }
          return false;
        }

        scope.$on('gaTopicChange', function(event, topic) {
          if (!topicSupportsLang(topic, scope.lang)) {
            // fallback to default code
            scope.lang = scope.options.fallbackCode;
          }
          scope.options.langs = topic.langs;
        });

        scope.lang = gaPermalink.getParams().lang ||
            ($window.navigator.userLanguage ||
             $window.navigator.language).split('-')[0];

        scope.selectLang = function(value) {
          scope.lang = value;
        };
      }
    };
  });
})();
