#!/usr/bin/env bash
cd `dirname $0`/..

if rm -rf knot-darwin-x64; then

    if ./node_modules/.bin/konrad; then

        IGNORE="/(.*\.dmg$|Icon$|watch$|icons$|.*md$|pug$|styl$|.*\.lock$|img/banner\.png)"
        
        node_modules/.bin/electron-packager . --overwrite --icon=img/app.icns --ignore=$IGNORE
    fi
fi
