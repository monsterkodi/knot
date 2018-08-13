###
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
###

{ args, udp, app, log } = require 'kxk'

new app
    dir:        __dirname
    pkg:        require '../package.json'
    shortcut:   'Alt+K'
    index:      'index.html'
    icon:       '../img/app.ico'
    tray:       '../img/menu.png'
    about:      '../img/about.png'
    aboutDebug: false  
    minWidth:   500 
    