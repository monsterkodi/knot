###
000   000  00000000  000   000  000   000   0000000   000   000  0000000    000      00000000  00000000 
000  000   000        000 000   000   000  000   000  0000  000  000   000  000      000       000   000
0000000    0000000     00000    000000000  000000000  000 0 000  000   000  000      0000000   0000000  
000  000   000          000     000   000  000   000  000  0000  000   000  000      000       000   000
000   000  00000000     000     000   000  000   000  000   000  0000000    0000000  00000000  000   000
###

{ post, stopEvent, valid, log } = require 'kxk'

ESC = '\x1b'
electron = require 'electron'


class KeyHandler

    constructor: (@term) -> 
    
        post.on 'combo', @onCombo
        
    write: (data) => @term.shell.write data
        
    #  0000000   0000000   00     00  0000000     0000000   
    # 000       000   000  000   000  000   000  000   000  
    # 000       000   000  000000000  0000000    000   000  
    # 000       000   000  000 0 000  000   000  000   000  
    #  0000000   0000000   000   000  0000000     0000000   

    onCombo: (combo, info) =>

        # log 'keyhandler.onCombo', info.mod, info.key, info.combo, info.char
        # return stopEvent(info.event) if 'unhandled' != window.keys.globalModKeyComboEvent info.mod, info.key, info.combo, info.event
        
        switch combo
            # when 'ctrl+v'           then return @paste()
            # when 'ctrl+c'    
                # selection = @term.term._core.selectionManager?.selectionText
                # if valid selection
                    # electron.clipboard.writeText selection
            # when 'ctrl+x'           
                # selection = @term.term._core.selectionManager?.selectionText
                # if valid selection
                    # electron.clipboard.writeText selection
                    
            when 'enter'
                return @write '\x0d'
            
        event = info.event
        if info.char and event.keyCode not in [9]
            @write info.char
        else
            modifiers = (event.shiftKey and 1 or 0) | (event.altKey and 2 or 0) | (event.ctrlKey and 4 or 0) | (event.metaKey and 8 or 0)
            @onKeyCode event.keyCode, modifiers, info
        
    onKeyCode: (keyCode, modifiers, info) ->
            
        if info.mod == 'ctrl'
            if keyCode >= 65 and keyCode <= 90
                @write String.fromCharCode keyCode - 64
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
                    @write '\t' # '\x09'
                    
            when 37  then writeMod '1', 'D', 'D'  # left-arrow 
            when 39  then writeMod '1', 'C', 'C'  # right-arrow
            when 38  then writeMod '1', 'A', 'A'  # up-arrow    ^[OA if @applicationCursor?
            when 40  then writeMod '1', 'B', 'B'  # down-arrow  ^[OB if @applicationCursor?
            when 33  then writeMod '5', '~', '5~' # page up
            when 34  then writeMod '6', '~', '6~' # page down
            when 35  then writeMod '1', 'F', 'F'  # end
            when 36  then writeMod '1', 'H', 'H'  # home
            when 46  then writeMod '3', '~', '3~' # delete
            when 112 then writeMod '1', 'P', 'OP', false # F1
            when 113 then writeMod '1', 'Q', 'OQ', false # F2
            when 114 then writeMod '1', 'R', 'OR', false # F3
            when 115 then writeMod '1', 'S', 'OS', false # F4
            when 115 then writeMod '1', 'S', 'OS', false # F5
            when 116 then writeMod '16', '~', '16~' # F6
            when 117 then writeMod '17', '~', '17~' # F7
            when 118 then writeMod '18', '~', '18~' # F8
            when 119 then writeMod '19', '~', '19~' # F9
            when 120 then writeMod '20', '~', '20~' # F10
            when 121 then writeMod '21', '~', '21~' # F11 +1?
            when 122 then writeMod '22', '~', '22~' # F12 +1?
            when 56  then @write String.fromCharCode 127 # another delete?
            when 219 then @write String.fromCharCode 27  # control sequence introducer?
            when 220 then @write String.fromCharCode 28  # string terminator?
            when 221 then @write String.fromCharCode 29  # operating system command?
            when 17, 16, 18, 92 then # ctrl, shift, alt, win
            else
                log "keyhandler.keyCode #{keyCode}"
                
module.exports = KeyHandler
