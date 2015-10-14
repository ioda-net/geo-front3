describe('ga_popup_service', function() {
  var popup, rootScope, gaPopup, $timeout, htmlPrintoutSpy;

  beforeEach(function() {
    module(function($provide) {
      htmlPrintoutSpy = sinon.spy();

      $provide.value('gaPrintService', {
        htmlPrintout: htmlPrintoutSpy
      });
    });

    inject(function($injector, $rootScope, _$timeout_) {
        gaPopup = $injector.get('gaPopup');
        rootScope = $rootScope;
        $timeout = _$timeout_;
      });

      popup = gaPopup.create({
        className: 'custom-class',
        content: '<div> content </div>'
      });

      rootScope.$digest();
  });
  
  it('creates a popup with a content', function() {
    expect(popup.scope).not.to.be(null);
    expect(popup.element).not.to.be(null);
    expect(popup.scope.toggle).to.be(false);
    expect(popup.element.css('display')).to.be('none');
    expect(popup.element.hasClass('custom-class')).to.be(true);
    expect(popup.element.find('.ga-popup-content').html()).to.be('<div class="ng-scope"> content </div>');
  });
  
  it('opens/closes/destroys a popup', function() {
    popup.open();
    rootScope.$digest();
    expect(popup.scope.toggle).to.be(true);
    expect(popup.element.css('display')).to.be('block');

    popup.close();
    rootScope.$digest();
    expect(popup.scope.toggle).to.be(false);
    expect(popup.element.css('display')).to.be('none');
    
    popup.open();
    rootScope.$digest();
    expect(popup.scope.toggle).to.be(true);
    expect(popup.element.css('display')).to.be('block');

    popup.destroy();
    expect(popup.scope).to.be(null);
    expect(popup.element).to.be(null);
  });

  it('call onCloseCallback when closing', function() {
    var spy = sinon.spy();

    popup = gaPopup.create({
      className: 'custom-class',
      content: '<div> content </div>',
      onCloseCallback: spy
    });
    popup.open();
    rootScope.$digest();
    popup.close();
    rootScope.$digest();

    sinon.assert.calledOnce(spy);
  });

  describe('print', function() {
    it('default print', function() {
      popup.open();
      rootScope.$digest();
      popup.print();
      $timeout.flush();
      sinon.assert.calledOnce(htmlPrintoutSpy);
    });

    it('custom print', function () {
      var spy = sinon.spy();

      popup = gaPopup.create({
        className: 'custom-class',
        content: '<div> content </div>',
        print: spy
      });
      popup.open();
      rootScope.$digest();
      popup.print();
      $timeout.flush();

      sinon.assert.calledOnce(spy);
    });
  });
});

