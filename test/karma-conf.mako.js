// Karma configuration

module.exports = function(config) {
  config.set({
  // base path, that will be used to resolve files and exclude
% if mode == 'release':
  basePath: '../prd',
% else:
  basePath: '../src',
% endif

  // list of files / patterns to load in the browser
  files: [
  % if mode == 'release':
    'style/app.css',
    'lib/d3.min.js',
    'lib/Cesium.min.js',
    'lib/ol3cesium.js',
    'lib/build.js',
  % else:
    'style/app.css',
    'lib/jquery.js',
    'lib/jQuery.XDomainRequest.js',
    'lib/slip.js',
    'lib/angular.js',
    'lib/angular-translate.js',
    'lib/angular-translate-loader-static-files.js',
    'lib/d3.js',
    'lib/bootstrap.js',
    'lib/typeahead-0.9.3.js',
    'lib/proj4js-compressed.js',
    'lib/EPSG21781.js',
    'lib/EPSG2056.js',
    'lib/EPSG32631.js',
    'lib/EPSG32632.js',
    'lib/fastclick.js',
    'lib/localforage.js',
    'lib/filesaver.js',
    'lib/moment-with-customlocales.js',
    'lib/Cesium/Cesium.js',
    '../test/closure-loader-globals.js',
    'lib/ol3cesium-debug.js',
    '../.build-artefacts/app-whitespace.js',
  % endif
    '../test/lib/angular-mocks.js',
    '../test/lib/expect.js',
    '../test/lib/sinon.js',
    '../test/specs/Loader.spec.js',
    '../test/specs/**/*.js'
  ],


  // frameworks to use
  // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
  frameworks: ['mocha'],


  preprocessors: {
    // In both release mode (build.js) and debug mode (app-whitespace.js) the
    // partials are pre-cached in Angular's $templateCache. So we don't
    // need to use Karma's html2js preprocessor, and cache partials in
    // tests using ngMock's "module" function.
    //'components/**/*.html': 'html2js'
  % if mode == 'debug':
    '../.build-artefacts/app-whitespace.js': ['coverage']
  % endif
  },


  // list of files to exclude
  exclude: [
  ],


% if mode == 'debug':
  coverageReporter: {
    dir: '../.build-artefacts',
    includeAllSources: true,
    reporters: [
      { type: 'cobertura', subdir: '.', file: 'coverage.xml' },
      { type: 'text-summary', subdir: '.', file: 'coverage.txt' }
    ]
  },
% endif


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
% if mode == 'release':
  reporters: ['progress'],
% else:
  reporters: ['coverage', 'progress'],
% endif


  // web server port
  port: 8081,


  // cli runner port
  runnerPort: 9100,


  // enable / disable colors in the output (reporters and logs)
  colors: true,


  // level of logging
  // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
  logLevel: config.LOG_WARN,


  // enable / disable watching file and executing tests whenever any file changes
  autoWatch: true,


  // Start these browsers, currently available:
  // - Chrome
  // - ChromeCanary
  // - Firefox
  // - Opera
  // - Safari (only Mac)
  // - PhantomJS
  // - IE (only Windows)
  browsers: ['PhantomJS'],


  // If browser does not capture in given timeout [ms], kill it
  captureTimeout: 5000,


  // Continuous Integration mode
  // if true, it capture browsers, run tests and exit
  singleRun: false

  });
};
