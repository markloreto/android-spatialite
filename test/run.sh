#!/usr/bin/env bash
cd "$( dirname "${BASH_SOURCE[0]}" )"

cordova plugin remove org.yagajs.spatialite
cordova plugin add ..
cordova emulate
