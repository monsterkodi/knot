###
000   000  00000000  000   000  000   000   0000000   000   000  0000000    000      00000000  00000000 
000  000   000        000 000   000   000  000   000  0000  000  000   000  000      000       000   000
0000000    0000000     00000    000000000  000000000  000 0 000  000   000  000      0000000   0000000  
000  000   000          000     000   000  000   000  000  0000  000   000  000      000       000   000
000   000  00000000     000     000   000  000   000  000   000  0000000    0000000  00000000  000   000
###

{ post, stopEvent, empty, log, $ } = require 'kxk'

ESC = '\x1b'
electron = require 'electron'

class KeyHandler

    constructor: (@term) -> 
    
        post.on 'combo', @onCombo
        
    write: (data) => 
    
        @term.shell.write data
        
    #  0000000   0000000   00     00  0000000     0000000   
    # 000       000   000  000   000  000   000  000   000  
    # 000       000   000  000000000  0000000    000   000  
    # 000       000   000  000 0 000  000   000  000   000  
    #  0000000   0000000   000   000  0000000     0000000   

    onCombo: (combo, info) =>

        # log 'keyhandler.onCombo', info.mod, info.key, info.combo, info.char
        # return stopEvent(info.event) if 'unhandled' != window.keys.globalModKeyComboEvent info.mod, info.key, info.combo, info.event
        
        switch combo
            when 'enter'
                return @write '\x0d'
            
        event = info.event
        if info.char and event.keyCode not in [9]
            @write info.char
        else
            modifiers = (event.shiftKey and 1 or 0) | (event.altKey and 2 or 0) | (event.ctrlKey and 4 or 0) | (event.metaKey and 8 or 0)
            @onKeyCode event.keyCode, modifiers, info
        
    selectionText: -> window.getSelection().toString()
            
    onKeyCode: (keyCode, modifiers, info) ->
            
        if info.mod == 'ctrl'
            if keyCode >= 65 and keyCode <= 90
                if keyCode != 86 and (keyCode != 67 or empty @selectionText()) 
                    @write String.fromCharCode keyCode - 64
                switch keyCode
                    when 86, 67 then # ctrl+v, ctrl+c
                    else
                        stopEvent info.event
                return
        
        writeMod = (mpre, mpost, pure, square=true) =>
            if modifiers
                @write ESC + '[' + mpre + ';' + (modifiers + 1) + mpost
            else
                if square
                    @write ESC + '[' + pure
                else
                    @write ESC + pure
               
        switch keyCode
            when 27  then @write ESC
            when 9  # tab
                if 'shift' in info.mod
                    @write ESC + '[Z'
                else
                    stopEvent info.event
                    @write '\t'
                    
            when 37  then stopEvent event, writeMod '1', 'D', 'D'  # left-arrow 
            when 39  then stopEvent event, writeMod '1', 'C', 'C'  # right-arrow
            when 38  then stopEvent event, writeMod '1', 'A', 'A'  # up   ^[OA if @applicationCursor?
            when 40  then stopEvent event, writeMod '1', 'B', 'B'  # down ^[OB if @applicationCursor?
            when 33  then stopEvent event, writeMod '5', '~', '5~' # page up
            when 34  then stopEvent event, writeMod '6', '~', '6~' # page down
            when 35  then stopEvent event, writeMod '1', 'F', 'F'  # end
            when 36  then stopEvent event, writeMod '1', 'H', 'H'  # home
            else
                log "keyhandler.keyCode #{keyCode}"
                
module.exports = KeyHandler
