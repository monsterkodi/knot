#!/usr/bin/env bash
cd `dirname $0`/..

if rm -rf /Applications/knot.app; then

    cp -R knot-darwin-x64/knot.app /Applications

    open /Applications/knot.app 
fi
