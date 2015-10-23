#!/usr/bin/env bash

set -e


geo_front_root="$(pwd)"
# Remove /scripts if present
geo_front_root="${geo_front_root/scripts/}"
# Remove trailing /
geo_front_root="${geo_front_root%/}"

patch_dir="${geo_front_root}/patches"

cd "${geo_front_root}"


# Get Open Layers version
ol_version=$(grep 'OL3_VERSION ?=' Makefile | cut -f 3 -d ' ')
ol_cesium_version=$(grep 'OL3_CESIUM_VERSION ?=' Makefile | cut -f 3 -d ' ')


# Open Layers
# Clone Open Layers 3
mkdir -p .build
cd .build
if [[ ! -d ol3 ]]; then
    git clone https://github.com/openlayers/ol3 ol3
fi
cd ol3
git reset HEAD --hard
git checkout master
git fetch -a

# Switch to the proper tag
git checkout "${ol_version}"

# Apply patch (should be merged in 3.10.0)
# See https://github.com/openlayers/ol3/pull/4045
patch -p1 < "${patch_dir}/wmts-import.patch"

# Apply patches by Swisstopo
cat ../../scripts/ga-ol3-style.exports >> src/ol/style/style.js
cat ../../scripts/ga-ol3-tilegrid.exports >> src/ol/tilegrid/tilegrid.js
cat ../../scripts/ga-ol3-tilerange.exports >> src/ol/tilerange.js
cat ../../scripts/ga-ol3-view.exports >> src/ol/view.js

# Build Open Layers
npm install
node tasks/build.js config/ol-debug.json "${geo_front_root}/src/lib/ol-debug.js"
node tasks/build.js "${geo_front_root}/scripts/ol-geoadmin.json" "${geo_front_root}/src/lib/ol.js"


# Cesium
cd "${geo_front_root}/.build"
if [[ ! -d ol3-cesium ]]; then
    git clone --recursive https://github.com/openlayers/ol3-cesium.git ol3-cesium
fi
cd ol3-cesium
git reset HEAD --hard
git fetch -a

# Switch to the proper tag
git checkout "${ol_cesium_version}"
git submodule update --recursive --init --force

# Build (from swisstopo's Makefile)
make dist
node build/build.js "${geo_front_root}/scripts/ol3cesium-debug-geoadmin.json" "${geo_front_root}/src/lib/ol3cesium-debug.js"
make cesium/Build/Cesium/Cesium.js
cat cesium/Build/Cesium/Cesium.js dist/ol3cesium.js > "${geo_front_root}/src/lib/ol3cesium.js"
rm -rf "${geo_front_root}/src/lib/Cesium/*"
cp -r cesium/Build/CesiumUnminified/* "${geo_front_root}/src/lib/Cesium/"
