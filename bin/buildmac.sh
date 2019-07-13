#!/usr/bin/env bash

DIR=`dirname $0`
BIN=$DIR/../node_modules/.bin
cd $DIR/..

if rm -rf knot-darwin-x64; then

    if $BIN/konrad; then
    
        $BIN/electron-rebuild
    
        IGNORE="/(.*\.dmg$|Icon$|watch$|icons$|.*md$|pug$|styl$|.*\.lock$|img/banner\.png)"
        
        if $BIN/electron-packager . --overwrite --icon=img/app.icns --darwinDarkModeSupport --ignore=$IGNORE; then
        
            rm -rf /Applications/knot.app
            cp -R knot-darwin-x64/knot.app /Applications
            
            open /Applications/knot.app 
        fi
    fi
fi
