// Karma configuration

function mergeFilesWithArgv(staticFiles) {
    var common = [
       '../test/angular/angular-mocks.js',
       '../test/expect-0.2.0/expect.js',
       '../test/sinon-1.7.3/sinon.js',
       '../test/specs/Loader.spec.js',
       '../test/specs/**/*.js'
    ];
    var source = staticFiles || [];
    var argv = process.argv;

    argv.forEach(function (arg) {
        var index = arg.indexOf('--portal=');
        if (index !== - 1) {
            source.push(arg.substring(9) + '/lib/build.js');
        }
    });

    return source.concat(common);
}


module.exports = function(config) {
    config.set({
	// base path, that will be used to resolve files and exclude
	{% if prod %}
	   basePath: '../prod',
	{% else %}
	   basePath: '../src',
	{% endif %}

	// list of files / patterns to load in the browser
	files: mergeFilesWithArgv([
	    {% if not prod %}
	       'lib/jquery-2.1.4.js',
	       'lib/angular.js',
	       'lib/angular-translate.js',
	       'lib/angular-translate-loader-static-files.js',
           'lib/ultimate-datatable-3.2.2-SNAPSHOT.js',
	       'lib/bootstrap-3.3.1.js',
	       'lib/typeahead-0.9.3.js',
	       'lib/proj4js-compressed.js',
	       'lib/EPSG21781.js',
	       'lib/EPSG2056.js',
	       'lib/EPSG32631.js',
	       'lib/EPSG32632.js',
           'lib/ol3.js',
           ${js_files}
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
        '../test/specs/importows/*.js': ['babel'],
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

    });
};
