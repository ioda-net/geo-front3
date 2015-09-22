exports.config = {
  specs: [
    '../test/integration/*.spec.js',
    '../test/selenium/*_test.js',
  ],
  seleniumAddress: 'http://localhost:4444/wd/hub',
  maxSessions: 1,
  multiCapabilities: [
    {browserName: 'firefox', 'shardTestFiles': true, 'maxInstances': 1}
  ],
  framework: 'jasmine2',
  onPrepare: function () {
    browser.driver.manage().window().maximize();
    // Set your URL here
    browser.get('http://geojb/');
  }
};
