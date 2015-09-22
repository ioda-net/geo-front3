var istanbul = require('istanbul');
var collector = new istanbul.Collector();
var reporter;
var waitPlugin = require('./waitPlugin');

function report() {
  reporter.add('json');
  reporter.write(collector, true, function () {
    console.log('Coverage report successfully written');
  });
}

exports.config = {
  specs: [
    '../test/integration/*.spec.js',
    '../test/selenium/*_test.js'
  ],
  seleniumAddress: 'http://localhost:4444/wd/hub',
  maxSessions: 1,
  multiCapabilities: [
    {browserName: 'firefox', shardTestFiles: true, maxInstances: 1}
  ],
  framework: 'jasmine2',
  plugins: [{path: './waitPlugin.js'}],
  onPrepare: function () {
    var jasmineEnv = jasmine.getEnv();
    waitPlugin.setOnComplete(report);
    browser.driver.manage().window().maximize();
    browser.get('http://cov.geojb/');

    jasmineEnv.addReporter(new function () {
      this.specDone = function (spec) {
        if (spec.status !== 'failed') {
          var name = spec.fullName.replace(/ /g, '_');
          var reportfile = 'coverage/integration/json/' + name;
          reporter = new istanbul.Reporter(undefined, reportfile);
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
