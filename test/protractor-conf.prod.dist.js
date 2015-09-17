it_root = '../test/integration/';

exports.config = {
  specs: [it_root + '*.spec.js'],
  seleniumAddress: 'http://localhost:4444/wd/hub',
  maxSessions: 1,
  multiCapabilities: [
    {browserName: 'firefox'}
  ],
  framework: 'jasmine2',
  onPrepare: function () {
    browser.driver.manage().window().maximize();
    // Set your URL here
    browser.get('http://geojb/');
  }
};
