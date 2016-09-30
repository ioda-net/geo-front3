#!/usr/bin/env bash

set -e
set -u


geo_front_root="$(pwd)"
# Remove /scripts if present
geo_front_root="${geo_front_root/scripts/}"
# Remove trailing /
geo_front_root="${geo_front_root%/}"

patch_dir="${geo_front_root}/scripts/ol3-patches"

cd "${geo_front_root}"


# Get Open Layers version
ol_version=$(grep 'OL3_VERSION ?=' Makefile | cut -f 3 -d ' ')
ol_cesium_version=$(grep 'OL3_CESIUM_VERSION ?=' Makefile | cut -f 3 -d ' ')
cesium_version=$(grep '^CESIUM_VERSION' Makefile | cut -f 3 -d ' ')

if [[ ! -d "${geo_front_root}/.build" ]]; then
    mkdir "${geo_front_root}/.build"
fi

# Cesium
cd "${geo_front_root}/.build"
if [[ ! -d ol3-cesium ]]; then
    git clone --recursive https://github.com/openlayers/ol3-cesium.git ol3-cesium
fi
cd ol3-cesium
git reset HEAD --hard
git fetch --all
## Switch to the proper tag
git checkout "${ol_cesium_version}"
git submodule update --recursive --init --force

## Build ol3
cd ol3
git reset HEAD --hard
git fetch --all
git checkout "${ol_version}"

### Apply patches by Swisstopo
cat "${geo_front_root}/scripts/ga-ol3-reproj.exports" >> src/ol/reproj/reproj.js
cat "${geo_front_root}/scripts/ga-ol3-style.exports" >> src/ol/style/style.js
cat "${geo_front_root}/scripts/ga-ol3-tilegrid.exports" >> src/ol/tilegrid/tilegrid.js
cat "${geo_front_root}/scripts/ga-ol3-tilerange.exports" >> src/ol/tilerange.js
cat "${geo_front_root}/scripts/ga-ol3-view.exports" >> src/ol/view.js

for patchfile in ${patch_dir}/*.patch; do
    patch -p1 < "${patchfile}"
done

npm install --production
node tasks/build-ext.js

cd ../cesium

git remote | grep c2c || git remote add c2c git://github.com/camptocamp/cesium
git fetch --all
git checkout "${cesium_version}"
cd ..

ln -T -f -s "${geo_front_root}/ol3-cesium-plugin/" src/plugins/geoadmin
( cd cesium; [ -f node_modules/.bin/gulp ] || npm install )
( cd cesium; if [ -f "Build/Cesium/Cesium.js" ] ; then echo 'Skipping Cesium minified build'; else node_modules/.bin/gulp minifyRelease; fi )
( cd cesium; if [ -f "Build/CesiumUnminified/Cesium.js" ] ; then echo 'Skipping Cesium debug build'; else node_modules/.bin/gulp generateStubs combine; fi )

npm install
node build/generate-exports.js dist/exports.js
node build/build.js build/ol3cesium-debug.json "${geo_front_root}/src/lib/ol3cesium-debug.js"
node build/build.js "${geo_front_root}/scripts/ol3cesium-geoadmin.json" "${geo_front_root}/src/lib/ol3cesium.js"
rm -rf "${geo_front_root}/src/lib/Cesium"
cp -r cesium/Build/CesiumUnminified "${geo_front_root}/src/lib/Cesium"
cp cesium/Build/Cesium/Cesium.js "${geo_front_root}/src/lib/Cesium.min.js"


#### Build ol for WMTS
cd ol3
node tasks/build.js "${geo_front_root}/scripts/ol3.json" "${geo_front_root}/src/lib/ol3.js"