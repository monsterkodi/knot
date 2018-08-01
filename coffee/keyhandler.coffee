###
000   000  00000000  000   000  000   000   0000000   000   000  0000000    000      00000000  00000000 
000  000   000        000 000   000   000  000   000  0000  000  000   000  000      000       000   000
0000000    0000000     00000    000000000  000000000  000 0 000  000   000  000      0000000   0000000  
000  000   000          000     000   000  000   000  000  0000  000   000  000      000       000   000
000   000  00000000     000     000   000  000   000  000   000  0000000    0000000  00000000  000   000
###

{ post, log, _ } = require 'kxk'

class KeyHandler

    constructor: (@term) ->
        
        @term.term.attachCustomKeyEventHandler @customKey
        
        post.on 'combo', @onCombo
        
    #  0000000   0000000   00     00  0000000     0000000   
    # 000       000   000  000   000  000   000  000   000  
    # 000       000   000  000000000  0000000    000   000  
    # 000       000   000  000 0 000  000   000  000   000  
    #  0000000   0000000   000   000  0000000     0000000   

    customKey: (event) => return false
        
    onCombo: (combo, info) =>

        # log info.mod, info.key, info.combo, info.char
        # return stopEvent(info.event) if 'unhandled' != window.keys.globalModKeyComboEvent info.mod, info.key, info.combo, info.event
        
        switch combo
            when 'ctrl+v'           then return @paste()
            when 'ctrl+c'           then return @copy()
            when 'ctrl+x'           then return @cut()
            when 'enter', 'return'  then return @term.shell.write '\n'
            else 
                if info.char
                    @term.shell.write info.char
                else
                    switch info.event.keyCode
                        when 27 then @term.shell.write '\x1b'
                        else
                            log "keyCode #{info.event.keyCode}"
        


module.exports = KeyHandler
