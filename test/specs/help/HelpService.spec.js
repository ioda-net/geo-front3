describe('ga_help_service', function() {

  describe('gaHelp', function() {
    var gaHelp, $httpBackend, gaLang, $rootScope;
    var frUrl = '/help/texts/31-fr.json';
    var deUrl = '/help/texts/31-de.json';

    beforeEach(function() {
      module(function($provide) {
        $provide.value('gaLang', {
          get: function() {
            return 'fr';
          },
          getNoRm: function() {
            return 'fr';
          }
        });
      });

      inject(function($injector) {
        gaHelp = $injector.get('gaHelp');
        gaLang = $injector.get('gaLang');
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = $injector.get('$rootScope');
      });
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    describe('#get()', function() {

      it('gets help from id', function(done) {
        $httpBackend.expectGET(frUrl).respond({columns: [], rows: []});

        gaHelp.get('31').then(function(data) {
          expect(data.columns).to.be.an(Array);
          expect(data.rows).to.be.an(Array);
          done();
        });
        $httpBackend.flush();
        $rootScope.$digest();
      });

      it('gets help from cache the 2nd time', function(done) {
        $httpBackend.expectGET(frUrl).respond({columns: [], rows: []});
        gaHelp.get('31');
        $httpBackend.flush();
        $rootScope.$digest();

        gaHelp.get('31').then(function(data) {
          done();
        });
        $httpBackend.flush();
        $rootScope.$digest();
      });

      it('gets help in de when lang is rm', function(done) {
        gaLang.getNoRm = function() {return 'de';};
        $httpBackend.expectGET(deUrl).respond({columns: [], rows: []});
        gaHelp.get('31').then(function() {
          done();
        });
        $httpBackend.flush();
        $rootScope.$digest();
      });
    });
  });
});
