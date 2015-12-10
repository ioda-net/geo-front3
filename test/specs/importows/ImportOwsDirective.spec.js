describe('gf3_importows_directive', function() {

  describe('a good WMS GetCapabilities is received', function() {
    var element, scope, map;

    beforeEach(function() {

      module(function($provide) {
        $provide.value('gaLayers', {});
        $provide.value('gaTopic', {});
        $provide.value('gaLang', {
          get: function() {
            return 'somelang';
          }
        });
      });

      inject(function($injector, $rootScope, $compile, $translate, gaGlobalOptions) {
        map = new ol.Map({});
        map.setSize([600, 300]);
        map.getView().fit([-20000000, -20000000, 20000000, 20000000], map.getSize());

        element = angular.element(
            '<div gf3-import-ows gf3-import-ows-map="map" ' +
            'gf3-import-ows-options="options">' +
            '</div>');
        scope = $rootScope.$new();
        scope.map = map;
        scope.options = {
          owsType: 'WMS',
          proxyUrl: 'http://admin.ch/ogcproxy?url=',
          defaultGetCapParams: 'SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0',
          defaultOWSList: [
            'http://wms.geo.admin.ch/',
            'http://ogc.heig-vd.ch/mapserver/wms?',
            'http://www.wms.stadt-zuerich.ch/WMS-ZH-STZH-OGD/MapServer/WMSServer?',
            'http://wms.geo.gl.ch/?',
            'http://mapserver1.gr.ch/wms/admineinteilung?'
          ]
        };
        $injector.get('$controller')('GfImportOwsDirectiveController', {'$scope': scope});
        $injector.get('$controller')('GfImportOwsItemDirectiveController', {'$scope': scope});
        $compile(element)(scope);
        $rootScope.$digest();
        $translate.use('fr');
      });
    });

    it('verifies html elements', inject(function($rootScope) {
      var form = element.find('form');
      expect(form.find('input[type=url][ng-model=fileUrl]').length).to.be(1);
      expect(form.find('.twitter-typeahead').length).to.be(1);
      expect(form.find('.gf3-import-ows-open').length).to.be(1);
      expect(form.find('.gf3-import-ows-connect').length).to.be(1);
      expect(element.find('.gf3-import-ows-container').length).to.be(1);
      expect(element.find('.gf3-import-ows-content').length).to.be(1);
      expect(element.find('textarea').length).to.be(1);
      expect(element.find('.gf3-import-ows-add').length).to.be(1);
      form.find('.gf3-import-ows-open').click();
      expect(element.find('.tt-dropdown-menu').css('display')).not.to.be('none');
      expect(element.find('.tt-suggestion').length).to.be(5);
    }));

    var $httpBackend;
    var expectedWmsGetCapAdminUrl = "http://admin.ch/ogcproxy?url=http%3A%2F%2Fwms.geo.admin.ch%2F%3FSERVICE%3DWMS%26REQUEST%3DGetCapabilities%26VERSION%3D1.3.0%26lang%3Dfr";

    beforeEach(inject(function($injector, $rootScope) {
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.whenGET(expectedWmsGetCapAdminUrl).respond('<?xml version=\'1.0\' encoding="UTF-8" standalone="no" ?>' +
         '<WMS_Capabilities version="1.3.0"  xmlns="http://www.opengis.net/wms">' +
           '<Service>' +
             '<Name>WMS</Name>' +
             '<Title>Title WMS</Title>' +
             '<Abstract>Abstract WMS</Abstract>' +
             '<OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://wms.geo.admin.ch/?"/>' +
           '</Service>' +
           '<Capability>' + 
             '<Request>' +
               '<GetCapabilities>' +
                 '<Format>text/xml</Format>' +
                 '<DCPType>' +
                   '<HTTP>' +
                     '<Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://wms.geo.admin.ch/?"/></Get>' +
                     '<Post><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://wms.geo.admin.ch/?"/></Post>' +
                   '</HTTP>' +
                 '</DCPType>' +
               '</GetCapabilities>' +
               '<GetMap>' +
               '</GetMap>' +
               '<GetFeatureInfo>' +
               '</GetFeatureInfo>' +
             '</Request>' +
             '<Exception>' +
               '<Format>XML</Format>' +
               '<Format>INIMAGE</Format>' +
               '<Format>BLANK</Format>' +
             '</Exception>' +
             '<Layer>' +
                 '<Name>main</Name>' +
                 '<Title>Title main</Title>' +
                 '<Abstract>Abstract main</Abstract>' +
                 '<CRS>EPSG:3857</CRS>' +
                 '<CRS>EPSG:21781</CRS>' +
                 '<BoundingBox CRS="EPSG:21781" minx="317000" miny="-87000" maxx="1.057e+06" maxy="413000" />' +
                 '<Layer queryable="1" opaque="0" cascaded="0">' +
                   '<Name>foo</Name>' +
                   '<Title>Title foo</Title>' +
                   '<Abstract>Abstract foo</Abstract>' +
                   '<CRS>EPSG:3857</CRS>' +
                   '<BoundingBox CRS="EPSG:21781" minx="317000" miny="-87000" maxx="1.057e+06" maxy="413000" />' +
                 '</Layer>' +
                 '<Layer queryable="1" opaque="0" cascaded="0">' +
                   '<Name>bar</Name>' +
                   '<Title>Title bar</Title>' +
                   '<Abstract>Abstract bar</Abstract>' +
                   '<CRS>EPSG:3857</CRS>' +
                   '<BoundingBox CRS="EPSG:3857" minx="317000" miny="-87000" maxx="1.057e+06" maxy="413000" />' +
                   '<Layer queryable="1" opaque="0" cascaded="0">' +
                     '<Name>bar</Name>' +
                     '<Title>Title bar</Title>' +
                     '<Abstract>Abstract bar</Abstract>' +
                     '<CRS>EPSG:3857</CRS>' +
                     '<BoundingBox CRS="EPSG:3857" minx="317000" miny="-87000" maxx="1.057e+06" maxy="413000" />' +
                   '</Layer>' +
                   '<Layer queryable="1" opaque="0" cascaded="0">' +
                     '<Title>Layer not added beacause it has no name</Title>' +
                     '<Abstract>Abstract bar2</Abstract>' +
                     '<CRS>EPSG:3857</CRS>' +
                     '<BoundingBox CRS="EPSG:21781" minx="317000" miny="-87000" maxx="1.057e+06" maxy="413000" />' +
                   '</Layer>' +
                 '</Layer>' +
                 '<Layer queryable="1" opaque="0" cascaded="0">' +
                   '<Title>Layer not added beacause it has no name</Title>' +
                   '<Abstract>Abstract bar2</Abstract>' +
                   '<CRS>EPSG:3857</CRS>' +
                   '<BoundingBox CRS="EPSG:21781" minx="317000" miny="-87000" maxx="1.057e+06" maxy="413000" />' +
                 '</Layer>' +
               '</Layer>' +
             '</Capability>' +
           '</WMS_Capabilities>'
      );
      $httpBackend.expectGET(expectedWmsGetCapAdminUrl);
      scope.fileUrl = scope.options.defaultOWSList[0];
      scope.handleFileUrl(); 
      $httpBackend.flush(); 
      $rootScope.$digest();
    }));

    afterEach(function () {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('uploads and parses successfully', inject(function() {
      expect(scope.userMessage).to.be('parse_succeeded');
      expect(scope.layers.length).to.be(2); 
      expect(scope.layers[1].Layer.length).to.be(1);
    }));
    
    describe('gf3_importows_item_directive', function() {
      var evt = {
        stopPropagation: function(){}
      };

      it('adds/removes a preview layer to the map', inject(function() {
        scope.addPreviewLayer(evt, scope.layers[0]);
        expect(scope.map.getLayers().getLength()).to.be(1);      
        expect(scope.map.getLayers().item(0).preview).to.be(true);
        scope.removePreviewLayer(evt);   
        expect(scope.map.getLayers().getLength()).to.be(0);
        expect(scope.options.layerHovered).to.be(null);
      }));
      
      it('selects/unselects a layer', inject(function() {
        scope.toggleLayerSelected(evt, scope.layers[0]);
        expect(scope.options.layerSelected.Title).to.be('Title foo');
        scope.toggleLayerSelected(evt, scope.layers[0]);
        expect(scope.options.layerSelected).to.be(null);
      }));
      
      it('adds a selected layer to the map', inject(function() {
        scope.toggleLayerSelected(evt, scope.layers[0]);
        scope.addLayerSelected();
        expect(scope.map.getLayers().getLength()).to.be(1);      
        expect(scope.map.getLayers().item(0).preview).to.be(undefined);
      }));
    });
  });

  describe('A good WMTS capabilities.xml is recieved', function() {
    var element, scope, map;

    beforeEach(function() {

      module(function($provide) {
        $provide.value('gaLayers', {});
        $provide.value('gaTopic', {});
        $provide.value('gaLang', {
          get: function() {
            return 'somelang';
          }
        });
      });

      inject(function($injector, $rootScope, $compile, $translate, gaGlobalOptions) {
        map = new ol.Map({});
        map.setSize([600, 300]);
        map.getView().fit([-20000000, -20000000, 20000000, 20000000], map.getSize());

        element = angular.element(
            '<div gf3-import-ows gf3-import-ows-map="map" ' +
            'gf3-import-ows-options="options">' +
            '</div>');
        scope = $rootScope.$new();
        scope.map = map;
        scope.options = {
          owsType: 'WMTS',
          proxyUrl: 'http://admin.ch/ogcproxy?url=',
          defaultOWSList: [
            'https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml'
          ]
        };
        $injector.get('$controller')('GfImportOwsDirectiveController', {'$scope': scope});
        $injector.get('$controller')('GfImportOwsItemDirectiveController', {'$scope': scope});
        $compile(element)(scope);
        $rootScope.$digest();
        $translate.use('fr');
      });
    });

    it('verifies html elements', inject(function($rootScope) {
      var form = element.find('form');
      expect(form.find('input[type=url][ng-model=fileUrl]').length).to.be(1);
      expect(form.find('.twitter-typeahead').length).to.be(1);
      expect(form.find('.gf3-import-ows-open').length).to.be(1);
      expect(form.find('.gf3-import-ows-connect').length).to.be(1);
      expect(element.find('.gf3-import-ows-container').length).to.be(1);
      expect(element.find('.gf3-import-ows-content').length).to.be(1);
      expect(element.find('textarea').length).to.be(1);
      expect(element.find('.gf3-import-ows-add').length).to.be(1);
      form.find('.gf3-import-ows-open').click();
      expect(element.find('.tt-dropdown-menu').css('display')).not.to.be('none');
      expect(element.find('.tt-suggestion').length).to.be(1);
    }));

    var $httpBackend;
    var expectedWtmsGetCapAdminUrl = "http://admin.ch/ogcproxy?url=https%3A%2F%2Fwmts.geo.admin.ch%2F1.0.0%2FWMTSCapabilities.xml%3Flang%3Dfr";

    beforeEach(inject(function($injector, $rootScope) {
      $httpBackend = $injector.get('$httpBackend');
      $httpBackend.whenGET(expectedWtmsGetCapAdminUrl).respond(`<?xml version="1.0" encoding="UTF-8"?>
<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:gml="http://www.opengis.net/gml" xsi:schemaLocation="http://www.opengis.net/wmts/1.0 http://schemas.opengis.net/wmts/1.0/wmtsGetCapabilities_response.xsd" version="1.0.0">
<!-- Revision: $Rev$ -->
<ows:ServiceIdentification>
        <ows:Title>WMTS IFDG</ows:Title>
        <ows:Abstract>None</ows:Abstract>
        <ows:Keywords>
            <ows:Keyword>Switzerland</ows:Keyword>
            <ows:Keyword>Web Map Service</ows:Keyword>
            <ows:Keyword>Suisse</ows:Keyword>
            <ows:Keyword>OGC</ows:Keyword>
            <ows:Keyword>WMS</ows:Keyword>
            <ows:Keyword>swisstopo</ows:Keyword>
            <ows:Keyword>Office federal de topographie</ows:Keyword>
            <ows:Keyword>Carte nationale</ows:Keyword>
            <ows:Keyword>Cartes-pixel</ows:Keyword>
            <ows:Keyword>Images aeriennes</ows:Keyword>
            <ows:Keyword>SWISSIMAGE</ows:Keyword>
            <ows:Keyword>Frontieres</ows:Keyword>
            <ows:Keyword>swissBOUNDARIES3D</ows:Keyword>
            <ows:Keyword>Cartes historiques</ows:Keyword>
            <ows:Keyword>Atlas Siegf3ried</ows:Keyword>
            <ows:Keyword>Carte Dufour</ows:Keyword>
        </ows:Keywords>
        <ows:ServiceType>OGC WMTS</ows:ServiceType>
        <ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>
        <ows:Fees>None</ows:Fees>
        <ows:AccessConstraints>None</ows:AccessConstraints>
</ows:ServiceIdentification>
<ows:ServiceProvider>
        <ows:ProviderName>Office fédéral de topographie swisstopo </ows:ProviderName>
        <ows:ProviderSite xlink:href="http://www.swisstopo.admin.ch"/>
        <ows:ServiceContact>
            <ows:IndividualName>David Oesch</ows:IndividualName>
            <ows:PositionName/>
            <ows:ContactInfo>
                <ows:Phone>
                    <ows:Voice>+41 (0)31 / 963 21 11</ows:Voice>
                    <ows:Facsimile>+41 (0)31 / 963 24 59</ows:Facsimile>
                </ows:Phone>
                <ows:Address>
                    <ows:DeliveryPoint>swisstopo</ows:DeliveryPoint>
                    <ows:City>Bern</ows:City>
                    <ows:AdministrativeArea>BE</ows:AdministrativeArea>
                    <ows:PostalCode>3084</ows:PostalCode>
                    <ows:Country>Switzerland</ows:Country>
                    <ows:ElectronicMailAddress>webgis@swisstopo.ch</ows:ElectronicMailAddress>
                </ows:Address>
            </ows:ContactInfo>
        </ows:ServiceContact>
</ows:ServiceProvider>

   <ows:OperationsMetadata>
        <ows:Operation name="GetCapabilities">
            <ows:DCP>
                <ows:HTTP>
                    <ows:Get xlink:href="https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml">
                        <ows:Constraint name="GetEncoding">
                            <ows:AllowedValues>
                                <ows:Value>REST</ows:Value>
                            </ows:AllowedValues>
                        </ows:Constraint>
                    </ows:Get>
                </ows:HTTP>
            </ows:DCP>
        </ows:Operation>
        <ows:Operation name="GetTile">
            <ows:DCP>
                <ows:HTTP>
                    <ows:Get xlink:href="https://wmts.geo.admin.ch/">
                        <ows:Constraint name="GetEncoding">
                            <ows:AllowedValues>
                                <ows:Value>REST</ows:Value>
                            </ows:AllowedValues>
                        </ows:Constraint>
                    </ows:Get>
                </ows:HTTP>
            </ows:DCP>
        </ows:Operation>
    </ows:OperationsMetadata>
    <Contents>

        <Layer>
            <ows:Title>Convention des Alpes</ows:Title>
            <ows:Abstract>Périmètre de la Convention alpine en Suisse. La Convention alpine est un traité de droit international conclu par huit Etats alpins (Allemagne, Autriche, France, Italie, Liechtenstein, Monaco, Suisse, Slovénie) et l'Union européenne. L'accord vise à assurer la préservation et la protection des Alpes à travers une politique plurisectorielle, globale et durable.</ows:Abstract>
            <ows:WGS84BoundingBox>
                <ows:LowerCorner>5.140242 45.398181</ows:LowerCorner>
                <ows:UpperCorner>11.47757 48.230651</ows:UpperCorner>
            </ows:WGS84BoundingBox>
            <ows:Identifier>ch.are.alpenkonvention</ows:Identifier>
            <ows:Metadata xlink:href="http://www.geocat.ch/geonetwork/srv/deu/metadata.show?uuid=8698bf0b-fceb-4f0f-989b-111e7c4af0a4"/>
            <Style>
                <ows:Title>Convention des Alpes</ows:Title>
                <ows:Identifier>ch.are.alpenkonvention</ows:Identifier>



                <LegendURL format="image/png" xlink:href="https://api3.geo.admin.ch/static/images/legends/ch.are.alpenkonvention_fr.png"/>
            </Style>
            <Format>image/png</Format>
            <Dimension>
                <ows:Identifier>Time</ows:Identifier>
                <Default>20090101</Default>
                <Value>20090101</Value>
            </Dimension>
            <TileMatrixSetLink>
                    <TileMatrixSet>21781_24</TileMatrixSet>
            </TileMatrixSetLink>
                <ResourceURL format="image/png" resourceType="tile" template="https://wmts.geo.admin.ch/1.0.0/ch.are.alpenkonvention/default/{Time}/21781/{TileMatrix}/{TileRow}/{TileCol}.png"/>
        </Layer>

        <Layer>
            <ows:Title>Chèvrefeuille du Japon</ows:Title>
            <ows:Abstract>Le set « plantes exotiques envahissantes » contient les cartes de distribution potentielle pour 56 plantes exotiques envahissantes en Suisse et répertoriées dans la Liste Noire et la Watch-List, ou présentes dans les pays voisins et ayant le potentiel de coloniser la Suisse. Les cartes sont le résultat de modélisation de l'Université de Lausanne et prédisent leur potentiel de propagation de ces espèces en Suisse. Les modèles sont basés respectivement sur les données d’occurrence du GBIF (Global Biodiversity Information Facility) et associées aux données climatiques de Worldclim (résolution de 1km), et sur les données d’occurrence d'infoflora associées aux données climatiques du WSL (résolution de 100m). Les cartes à 100m utilisent également d’autres variables telles que l'utilisation du sol et de la géologie.</ows:Abstract>
            <ows:WGS84BoundingBox>
                <ows:LowerCorner>5.140242 45.398181</ows:LowerCorner>
                <ows:UpperCorner>11.47757 48.230651</ows:UpperCorner>
            </ows:WGS84BoundingBox>
            <ows:Identifier>ch.bafu.neophyten-japanisches_geissblatt</ows:Identifier>
            <ows:Metadata xlink:href="http://www.geocat.ch/geonetwork/srv/deu/metadata.show?uuid=a5bd8033-8457-486b-b099-2e6f3f7864a8"/>
            <Style>
                <ows:Title>Chèvrefeuille du Japon</ows:Title>
                <ows:Identifier>ch.bafu.neophyten-japanisches_geissblatt</ows:Identifier>



                <LegendURL format="image/png" xlink:href="https://api3.geo.admin.ch/static/images/legends/ch.bafu.neophyten-japanisches_geissblatt_fr.png"/>
            </Style>
            <Format>image/png</Format>
            <Dimension>
                <ows:Identifier>Time</ows:Identifier>
                <Default>20140825</Default>
                <Value>20140825</Value>
            </Dimension>
            <TileMatrixSetLink>
                    <TileMatrixSet>21781_24</TileMatrixSet>
            </TileMatrixSetLink>
                <ResourceURL format="image/png" resourceType="tile" template="https://wmts.geo.admin.ch/1.0.0/ch.bafu.neophyten-japanisches_geissblatt/default/{Time}/21781/{TileMatrix}/{TileRow}/{TileCol}.png"/>
        </Layer>
<TileMatrixSet>
        <ows:Identifier>21781_24</ows:Identifier>
        <ows:SupportedCRS>urn:ogc:def:crs:EPSG:21781</ows:SupportedCRS>
        <!-- This tileMatrixSet in **only** for tiles generated through TileGenerator ! -->

<TileMatrix>
    <ows:Identifier>0</ows:Identifier>
    <ScaleDenominator>14285750.5715</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>1</ows:Identifier>
    <ScaleDenominator>13392891.1608</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>2</ows:Identifier>
    <ScaleDenominator>12500031.7501</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>3</ows:Identifier>
    <ScaleDenominator>11607172.3393</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>4</ows:Identifier>
    <ScaleDenominator>10714312.9286</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>5</ows:Identifier>
    <ScaleDenominator>9821453.51791</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>6</ows:Identifier>
    <ScaleDenominator>8928594.10719</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>7</ows:Identifier>
    <ScaleDenominator>8035734.69647</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>8</ows:Identifier>
    <ScaleDenominator>7142875.28575</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>9</ows:Identifier>
    <ScaleDenominator>6250015.87503</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>2</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>10</ows:Identifier>
    <ScaleDenominator>5357156.46431</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>2</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>11</ows:Identifier>
    <ScaleDenominator>4464297.05359</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>2</MatrixWidth>
    <MatrixHeight>1</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>12</ows:Identifier>
    <ScaleDenominator>3571437.64288</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>2</MatrixWidth>
    <MatrixHeight>2</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>13</ows:Identifier>
    <ScaleDenominator>2678578.23216</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>3</MatrixWidth>
    <MatrixHeight>2</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>14</ows:Identifier>
    <ScaleDenominator>2321434.46787</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>3</MatrixWidth>
    <MatrixHeight>2</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>15</ows:Identifier>
    <ScaleDenominator>1785718.82144</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>4</MatrixWidth>
    <MatrixHeight>3</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>16</ows:Identifier>
    <ScaleDenominator>892859.410719</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>8</MatrixWidth>
    <MatrixHeight>5</MatrixHeight>
</TileMatrix>

<TileMatrix>
    <ows:Identifier>17</ows:Identifier>
    <ScaleDenominator>357143.764288</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>19</MatrixWidth>
    <MatrixHeight>13</MatrixHeight>
</TileMatrix>

        <TileMatrix>
    <ows:Identifier>18</ows:Identifier>
    <ScaleDenominator>178571.882144</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>38</MatrixWidth>
    <MatrixHeight>25</MatrixHeight>
</TileMatrix>

        <TileMatrix>
    <ows:Identifier>19</ows:Identifier>
    <ScaleDenominator>71428.7528575</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>94</MatrixWidth>
    <MatrixHeight>63</MatrixHeight>
</TileMatrix>

        <TileMatrix>
    <ows:Identifier>20</ows:Identifier>
    <ScaleDenominator>35714.3764288</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>188</MatrixWidth>
    <MatrixHeight>125</MatrixHeight>
</TileMatrix>

        <TileMatrix>
    <ows:Identifier>21</ows:Identifier>
    <ScaleDenominator>17857.1882144</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>375</MatrixWidth>
    <MatrixHeight>250</MatrixHeight>
</TileMatrix>

        <TileMatrix>
    <ows:Identifier>22</ows:Identifier>
    <ScaleDenominator>8928.59410719</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>750</MatrixWidth>
    <MatrixHeight>500</MatrixHeight>
</TileMatrix>

        <TileMatrix>
    <ows:Identifier>23</ows:Identifier>
    <ScaleDenominator>7142.87528575</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>938</MatrixWidth>
    <MatrixHeight>625</MatrixHeight>
</TileMatrix>

        <TileMatrix>
    <ows:Identifier>24</ows:Identifier>
    <ScaleDenominator>5357.15646431</ScaleDenominator>
    <TopLeftCorner>420000.0 350000.0</TopLeftCorner>
    <TileWidth>256</TileWidth>
    <TileHeight>256</TileHeight>
    <MatrixWidth>1250</MatrixWidth>
    <MatrixHeight>834</MatrixHeight>
</TileMatrix>

    </TileMatrixSet>

    </Contents>
    <ServiceMetadataURL xlink:href="http://www.opengis.uab.es/SITiled/world/1.0.0/WMTSCapabilities.xml"/>
</Capabilities>`);
      $httpBackend.expectGET(expectedWtmsGetCapAdminUrl);
      scope.fileUrl = scope.options.defaultOWSList[0];
      scope.handleFileUrl();
      $httpBackend.flush();
      $rootScope.$digest();
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('uploads and parses successfully', inject(function() {
      expect(scope.userMessage).to.be('parse_succeeded');
      expect(scope.layers.length).to.be(2);

      var layer = scope.layers[1];
      expect(layer.id).to.be('WMTS||ch.bafu.neophyten-japanisches_geissblatt||Time:20140825||https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml');
      expect(layer.layer).to.be('ch.bafu.neophyten-japanisches_geissblatt');
      expect(layer.matrixSet).to.be('21781_24');
    }));

    describe('gf3_importows_item_directive', function() {
      var evt = {
        stopPropagation: function() {}
      };

      it('adds/removes a preview layer to the map', inject(function() {
        scope.addPreviewLayer(evt, scope.layers[0]);
        expect(scope.map.getLayers().getLength()).to.be(1);
        expect(scope.map.getLayers().item(0).preview).to.be(true);
        scope.removePreviewLayer(evt);
        expect(scope.map.getLayers().getLength()).to.be(0);
        expect(scope.options.layerHovered).to.be(null);
      }));

      it('selects/unselects a layer', inject(function() {
        scope.toggleLayerSelected(evt, scope.layers[0]);
        expect(scope.options.layerSelected.Title).to.be('Convention des Alpes');
        scope.toggleLayerSelected(evt, scope.layers[0]);
        expect(scope.options.layerSelected).to.be(null);
      }));

      it('adds a selected layer to the map', inject(function() {
        scope.toggleLayerSelected(evt, scope.layers[0]);
        scope.addLayerSelected();
        expect(scope.map.getLayers().getLength()).to.be(1);
        expect(scope.map.getLayers().item(0).preview).to.be(false);
      }));
    });
  });
});
