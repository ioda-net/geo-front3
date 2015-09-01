geo-front3
==========

# Getting started

Checkout the source code:

    $ git clone https://github.com/ioda-net/mf-geoadmin3.git


The build process relies on gulp and closure. Before building the project, you
must run `npm install` in the root folder of the project in order to download
all the dependencies.

You must use `gulp dev --portal <portalname>` to build the given portal for
development. The output will be produced in `dev/portalname`. If portalname is
not precised, it will default to geojb.

You must use `gulp prod --portal <portalname>` to build the specified portal for
production. The output will be produced in `prod/protalname`.


# How to update Open Layer

We currently need a [custom patch](https://github.com/openlayers/ol3/pull/4045)
in Open Layer for WMTS import to work correctly. So if swisstopo updates Open
Layers, we must reapply it. Furthermore, the script from swisstopo that builds
Open Layers for production `scripts/ol-geoadmin.json` doesn't export
`ol.format.WMTSCapabilities` nor `ol.format.WMTSCapabilities#*` so we also need
to patch this.

HOWTO:

- Go in mf-geoadmin3
- Do a hard reset on mf-geoadmin3 and `.build-artefacts/ol3` with `git reset
  --hard`
- Apply `ol-prod-build-script-wmts-import.patch` (in owncloud)
- Go to `.build-artefacts/ol3`
- Apply `wmts-import.patch` (in owncloud)
- Run `node tasks/build.js ../../scripts/ol-geoadmin.json build/ol.js` to build
  for production
- Copy `build/ol.js` to `geo-front3/src/lib/`
- Go to `.build-artefacts/ol3-cesium`
- Run `make dist`
- Run `node build/build.js ../../scripts/ol3cesium-debug-geoadmin.json
  dist/ol3cesium-debug.js`
- Copy `ol3cesium-debug.js` to `geo-front3/src/lib`

TODO: Improve this, see #71.
