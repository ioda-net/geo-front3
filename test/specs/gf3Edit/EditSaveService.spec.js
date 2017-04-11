describe('gf3_edit_save_service', function() {
  var $httpBackend;
  var $rootScope;
  var gf3EditSave;
  var addedFeatures;
  var updatedFeatures;
  var deletedFeatures;
  var options;
  var url;

  beforeEach(function() {
    inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      gf3EditSave = $injector.get('gf3EditSave');
    });
  });

  beforeEach(function() {
    addedFeatures = [new ol.Feature()];
    updatedFeatures = [new ol.Feature()];
    updatedFeatures.forEach(function(feature, index) {
      feature.setId(index);
    });
    deletedFeatures = [new ol.Feature()];
    deletedFeatures.forEach(function(feature, index) {
      feature.setId(index);
    });
    options = {
      featureNS: 'test',
      featureType: 'Point',
      srsName: '2056',
      featurePrefix: 'test',
      version: '1.1.0'
    };
    url = '//wfs.local/';
  });

  it('should save the layer', function(done) {
    $httpBackend.expectPOST(url);
    $httpBackend.whenPOST(url).respond('<xml></xml>');

    gf3EditSave.save(url, addedFeatures, updatedFeatures, deletedFeatures, options)
        .then(function(message) {
          expect(message).to.be('edit_save_success');
          done();
        });

    $httpBackend.flush();
    $rootScope.$digest();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('error reporting', function() {
    describe('WFS transaction errors', function() {
      it('should report errors for GeoServer in WFS 1.1.0', function(done) {
        $httpBackend.expectPOST(url);
        $httpBackend.whenPOST(url).respond(`<ows:ExceptionReport xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ows="http://www.opengis.net/ows" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/ows http://localhost:8080/geoserver/schemas/ows/1.0.0/owsExceptionReport.xsd">
  <ows:Exception exceptionCode="InvalidParameterValue">
    <ows:ExceptionText>Update error: Error occured updating features</ows:ExceptionText>
  </ows:Exception>
</ows:ExceptionReport>`);

        gf3EditSave.save(url, addedFeatures, updatedFeatures, deletedFeatures, options)
            .then(function() {
              expect(true).to.be(false);
              done();
            }, function(rejectionInfos) {
              expect(rejectionInfos.message).to.be('edit_save_error');
              expect(rejectionInfos.saveErrors).to.eql(['Update error: Error occured updating features']);
              done();
            });

        $httpBackend.flush();
        $rootScope.$digest();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });

      it('should report errors for GeoServer in WFS 1.0.0', function(done) {
        $httpBackend.expectPOST(url);
        $httpBackend.whenPOST(url).respond(`<wfs:WFS_TransactionResponse version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs http://localhost:8080/geoserver/schemas/wfs/1.0.0/WFS-transaction.xsd">
  <wfs:InsertResult>
    <ogc:FeatureId fid="none"/>
  </wfs:InsertResult>
  <wfs:TransactionResult>
    <wfs:Status>
      <wfs:FAILED/>
    </wfs:Status>
    <wfs:Message>Update error: Error occured updating features</wfs:Message>
  </wfs:TransactionResult>
</wfs:WFS_TransactionResponse>`);

        gf3EditSave.save(url, addedFeatures, updatedFeatures, deletedFeatures, options)
            .then(function() {
              expect(true).to.be(false);
              done();
            }, function(rejectionInfos) {
              expect(rejectionInfos.message).to.be('edit_save_error');
              expect(rejectionInfos.saveErrors).to.eql(['Update error: Error occured updating features']);
              done();
            });

        $httpBackend.flush();
        $rootScope.$digest();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });

      it('should report errors for TinyOWS in WFS 1.0.0', function(done) {
        $httpBackend.expectPOST(url);
        $httpBackend.whenPOST(url).respond(`<ServiceExceptionReport
 xmlns="http://www.opengis.net/ogc"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:schemaLocation="http://www.opengis.net/ogc http://schemas.opengis.net/wms/1.1.1/OGC-exception.xsd"
version="1.2.0">
<ServiceException code="InvalidParameterValue" locator="Update">
ERROR:  invalid input syntax for integer: "aUEAUIE"
LINE 1: UPDATE "userdata"."points3d" SET "fid" = 'aUEAUIE',"nom" = '...
</ServiceException>
</ServiceExceptionReport>`);

        gf3EditSave.save(url, addedFeatures, updatedFeatures, deletedFeatures, options)
            .then(function() {
              expect(true).to.be(false);
              done();
            }, function(rejectionInfos) {
              expect(rejectionInfos.message).to.be('edit_save_error');
              expect(rejectionInfos.saveErrors).to.eql([`InvalidParameterValue Update \nERROR:  invalid input syntax for integer: "aUEAUIE"\nLINE 1: UPDATE "userdata"."points3d" SET "fid" = \'aUEAUIE\',"nom" = \'...\n`]);
              done();
            });

        $httpBackend.flush();
        $rootScope.$digest();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
      });
    });

    it('should detect unforseen errors', function(done) {
      $httpBackend.expectPOST(url);
      $httpBackend.whenPOST(url).respond(500);

      gf3EditSave.save(url, addedFeatures, updatedFeatures, deletedFeatures, options)
          .then(function() {
            expect(true).to.be(false);
            done();
          }, function(rejectionInfos) {
            expect(rejectionInfos.message).to.be('edit_save_error');
            done();
          });

      $httpBackend.flush();
      $rootScope.$digest();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should detect authentication errors', function(done) {
      $httpBackend.expectPOST(url);
      $httpBackend.whenPOST(url).respond(401);

      gf3EditSave.save(url, addedFeatures, updatedFeatures, deletedFeatures, options)
          .then(function() {
            expect(true).to.be(false);
            done();
          }, function(rejectionInfos) {
            expect(rejectionInfos.message).to.be('edit_auth_required');
            expect(rejectionInfos.authRequired).to.be(true);
            done();
          });

      $httpBackend.flush();
      $rootScope.$digest();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });
  });

  it('should report errors the layer', function(done) {
    $httpBackend.expectPOST(url);
    $httpBackend.whenPOST(url).respond('<xml></xml>');

    gf3EditSave.save(url, addedFeatures, updatedFeatures, deletedFeatures, options)
        .then(function(message) {
          expect(message).to.be('edit_save_success');
          done();
        });

    $httpBackend.flush();
    $rootScope.$digest();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
});
