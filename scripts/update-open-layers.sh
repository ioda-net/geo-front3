#!/usr/bin/env bash

set -e
set -u


geo_front_root="$(pwd)"
# Remove /scripts if present
geo_front_root="${geo_front_root/scripts/}"
# Remove trailing /
geo_front_root="${geo_front_root%/}"

patch_dir="${geo_front_root}/scripts/ol-patches"

cd "${geo_front_root}"


# Get Open Layers version
ol_version=$(grep 'OL_VERSION ?=' Makefile | cut -f 3 -d ' ')
ol_cesium_version=$(grep 'OL_CESIUM_VERSION ?=' Makefile | cut -f 3 -d ' ')
cesium_version=$(grep '^CESIUM_VERSION' Makefile | cut -f 3 -d ' ')

if [[ ! -d "${geo_front_root}/.build" ]]; then
    mkdir "${geo_front_root}/.build"
fi

# Cesium
cd "${geo_front_root}/.build"
if [[ ! -d ol-cesium ]]; then
    git clone --recursive https://github.com/openlayers/ol-cesium.git ol-cesium
fi
cd ol-cesium
git reset HEAD --hard
git fetch --all
## Switch to the proper tag
git checkout "${ol_cesium_version}"
git submodule update --recursive --init --force

## Build ol
cd ol
git reset HEAD --hard
git fetch --all
git checkout "${ol_version}"

### Apply patches by Swisstopo
cat "${geo_front_root}/scripts/ga-ol-reproj.exports" >> src/ol/reproj/reproj.js
cat "${geo_front_root}/scripts/ga-ol-style.exports" >> src/ol/style/style.js
cat "${geo_front_root}/scripts/ga-ol-tilegrid.exports" >> src/ol/tilegrid/tilegrid.js
cat "${geo_front_root}/scripts/ga-ol-tilerange.exports" >> src/ol/tilerange.js
cat "${geo_front_root}/scripts/ga-ol-view.exports" >> src/ol/view.js

if [[ -d ${patch_dir} && -n "$(ls -A ${patch_dir})" ]]; then
  for patchfile in ${patch_dir}/*.patch; do
      patch -p1 < "${patchfile}"
  done
fi

npm install --production
node tasks/build-ext.js

cd ../cesium

git remote | grep c2c || git remote add c2c git://github.com/camptocamp/cesium
git fetch --all
git checkout "${cesium_version}"
cd ..

ln -T -f -s "${geo_front_root}/ol-cesium-plugin/" src/plugins/geoadmin
( cd cesium; [ -f node_modules/.bin/gulp ] || npm install )
( cd cesium; if [ -f "Build/Cesium/Cesium.js" ] ; then echo 'Skipping Cesium minified build'; else node_modules/.bin/gulp minifyRelease; fi )
( cd cesium; if [ -f "Build/CesiumUnminified/Cesium.js" ] ; then echo 'Skipping Cesium debug build'; else node_modules/.bin/gulp generateStubs combine; fi )

npm install
node build/generate-exports.js dist/exports.js
node build/build.js build/olcesium-debug.json "${geo_front_root}/src/lib/olcesium-debug.js"
node build/build.js "${geo_front_root}/scripts/olcesium-geoadmin.json" "${geo_front_root}/src/lib/olcesium.js"
rm -rf "${geo_front_root}/src/lib/Cesium"
cp -r cesium/Build/CesiumUnminified "${geo_front_root}/src/lib/Cesium"
cp cesium/Build/Cesium/Cesium.js "${geo_front_root}/src/lib/Cesium.min.js"
