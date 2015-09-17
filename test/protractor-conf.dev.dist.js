var it_root = '../test/integration/';

var istanbul = require('istanbul');
var collector = new istanbul.Collector();
var reporter = new istanbul.Reporter(undefined, 'coverage/integration');
var waitPlugin = require('./waitPlugin');

function report() {
  reporter.add('html');
  reporter.write(collector, true, function () {
    console.log('Coverage report successfully written');
  });
}

exports.config = {
  specs: [it_root + '*.spec.js'],
  seleniumAddress: 'http://localhost:4444/wd/hub',
  maxSessions: 1,
  multiCapabilities: [
    {browserName: 'firefox'}
  ],
  framework: 'jasmine2',
  plugins: [{path: './waitPlugin.js'}],
  onPrepare: function () {
    var jasmineEnv = jasmine.getEnv();
    waitPlugin.setOnComplete(report);

    browser.driver.manage().window().maximize();
    // Set your URL here
    browser.get('http://cov.geojb/');

    jasmineEnv.addReporter(new function () {
      this.specDone = function (spec) {
        if (spec.status !== 'failed') {
          var promise = browser.driver.executeScript('return __coverage__;')
                  .then(function (coverageResults) {
                    collector.add(coverageResults);
                  });
          waitPlugin.waitList.push(promise);
        }
      };
    });
  }
};
