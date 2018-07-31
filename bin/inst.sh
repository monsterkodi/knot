#!/usr/bin/env bash
cd `dirname $0`/..

if rm -rf /Applications/koks.app; then

    cp -R koks-darwin-x64/koks.app /Applications

    open /Applications/koks.app 
fi
