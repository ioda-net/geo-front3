// Karma configuration

var path = require('path');

function mergeFilesWithArgv(staticFiles) {
    var common = [
        {% if not prod %}
       'test/lib/jscomp.js',
       {% endif %}
       'test/lib/angular-mocks.js',
       'test/lib/expect.js',
       'test/lib/sinon.js',
       'test/specs/Loader.spec.js',
       'test/specs/**/*.js',
       {
         pattern: 'test/data/*.xml',
         watched: true,
         served:  true,
         included: false
       }
    ];
    var source = staticFiles || [];
    var argv = process.argv;
    var isProd = false;
    var portal = '';

    var infra_dir = '';
    argv.forEach(function (arg) {
      var index = arg.indexOf('--infra-dir=');
      if (index !== -1) {
        infra_dir = arg.substring(12);
        infra_dir = path.join(infra_dir, 'prod');
        isProd = true;
      }
    });

    argv.forEach(function (arg) {
        var index = arg.indexOf('--portal=');
        if (index !== - 1) {
            portal = arg.substring(9);
        }
    });

    if (isProd) {
      source.push('lib/build.js');
      source = source.map(function(src) {
        return path.join(infra_dir, portal, src);
      });
    }

    return source.concat(common);
}


module.exports = function(config) {
    config.set({
	// base path, that will be used to resolve files and exclude
	   basePath: '..',

	// list of files / patterns to load in the browser
	files: mergeFilesWithArgv([
        {% if prod %}
           'lib/d3.min.js',
           'lib/Cesium.min.js',
        {% else %}
	       'src/lib/jquery.js',
           'src/lib/jquery.xdomainrequest.min.js',
           'src/lib/slip.js',
	       'src/lib/angular.js',
	       'src/lib/angular-translate.js',
	       'src/lib/angular-translate-loader-static-files.js',
           'src/lib/d3.js',
	       'src/lib/bootstrap.js',
	       'src/lib/typeahead.jquery.js',
	       'src/lib/proj4js-compressed.js',
	       'src/lib/EPSG21781.js',
	       'src/lib/EPSG2056.js',
	       'src/lib/EPSG32631.js',
	       'src/lib/EPSG32632.js',
           'src/lib/fastclick.js',
           'src/lib/localforage.js',
           'src/lib/filesaver.js',
           'src/lib/Cesium/Cesium.js',
           'src/lib/moment-with-customlocales.js',
           'src/lib/ultimate-datatable.js',
           'src/lib/olcesium.js',
           'test/app-whitespace.js',
	    {% endif %}
	]),


	// frameworks to use
	// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
	frameworks: ['mocha'],


	preprocessors: {
	    // In both prod mode (build.js) and dev mode (app-whitespace.js) the
	    // partials are pre-cached in Angular's $templateCache. So we don't
	    // need to use Karma's html2js preprocessor, and cache partials in
	    // tests using ngMock's "module" function.
	    //'components/**/*.html': 'html2js'
        'js/*.js': ['coverage'],
        'test/specs/importows/*.js': ['babel'],
        'test/specs/gf3Edit/*.js': ['babel'],
        'components/**/*.js': ['coverage']
	},


    // optionally, configure the reporter
    coverageReporter: {
      type : 'html',
      dir : '../coverage/'
    },


	// list of files to exclude
	exclude: [
	],


	// test results reporter to use
	// possible values: 'dots', 'progress', 'junit'
	reporters: ['progress', 'coverage'],


	// web server port
	port: 8081,


	// cli runner port
	runnerPort: 9100,


	// enable / disable colors in the output (reporters and logs)
	colors: true,


	// level of logging
	// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
	logLevel: config.LOG_INFO,


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
	browsers: ${test.karma.browsers},


	// If browser does not capture in given timeout [ms], kill it
	captureTimeout: 5000,


	// Continuous Integration mode
	// if true, it capture browsers, run tests and exit
	singleRun: false,

    // Starting with 1.6
    browserConsoleLogOptions: {
        level: 'log',
        format: '%b %T: %m',
        terminal: true
    }

    });
};
