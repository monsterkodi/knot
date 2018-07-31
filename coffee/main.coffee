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
    args: """
        ping    send ping every ms   0
        log     log every ms         0
        """
    
if args.ping
        
    udpSend = new udp debug:true
    n = 0
    ping = -> 
        n += 1
        udpSend.send 'ping', n
      
    setInterval ping, args.ping
    
if args.log
    
    l = 0
    logm = ->
        l += 1
        log 'log', l
        
    setInterval logm, args.log
    