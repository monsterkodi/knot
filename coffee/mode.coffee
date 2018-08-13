###
00     00   0000000   0000000    00000000
000   000  000   000  000   000  000     
000000000  000   000  000   000  0000000 
000 0 000  000   000  000   000  000     
000   000   0000000   0000000    00000000
###

{ empty, log } = require 'kxk'

class Mode
    
    #  0000000  00000000  000000000  
    # 000       000          000     
    # 0000000   0000000      000     
    #      000  000          000     
    # 0000000   00000000     000     
    
    @set: (buffer, params) ->
        
        if typeof(params) == 'object'
            for i in [0...params.length]
                Mode.set buffer, params[i]
            return
      
        if empty buffer.prefix
            
            switch params
                when 4
                    buffer.insertMode = true
                  
        else if buffer.prefix == '?'
            
            switch params
                when 1
                    log 'applicationCursor!'
                    buffer.applicationCursor = true
                  
                when 2
                    buffer.setgCharset(0, Terminal.charsets.US)
                    buffer.setgCharset(1, Terminal.charsets.US)
                    buffer.setgCharset(2, Terminal.charsets.US)
                    buffer.setgCharset(3, Terminal.charsets.US)
                  
                when 3 
                    buffer.savedCols = buffer.cols
                    buffer.resize 132, buffer.rows
                  
                when 6
                    buffer.originMode = true
                  
                when 7
                    buffer.wraparoundMode = true
                  
                when 1003 # any event mouse
                    buffer.x10Mouse = params == 9
                    buffer.vt200Mouse = params == 1000
                    buffer.normalMouse = params > 1000
                    buffer.mouseEvents = true
                    buffer.element.style.cursor = 'default'
                    log 'Binding to mouse events'
                  
                when 1004 # send focusin/focusout events
                    buffer.sendFocus = true
                  
                when 1005 # utf8 ext mode mouse
                    buffer.utfMouse = true
                  
                when 1006 # sgr ext mode mouse
                    buffer.sgrMouse = true
                  
                when 1015 # urxvt ext mode mouse
                    buffer.urxvtMouse = true
                  
                when 25
                    buffer.cursorHidden = false
                  
                when 1049
                    log 'alt screen buffer cursor'
                when 47  
                    log 'alt screen buffer'
                else
                    log "unhandled mode ? #{params}"
                # when 1047 # alt screen buffer
                  # if (!buffer.normal) {
                    # normal = {
                      # lines buffer.lines,
                      # ybase buffer.ybase,
                      # ydisp buffer.ydisp,
                      # x buffer.x,
                      # y buffer.y,
                      # scrollTop buffer.scrollTop,
                      # scrollBottom buffer.scrollBottom,
                      # tabs buffer.tabs
                    # }
                    # buffer.reset()
                    # buffer.normal = normal
                    # buffer.showCursor()

    # 00000000   00000000   0000000  00000000  000000000  
    # 000   000  000       000       000          000     
    # 0000000    0000000   0000000   0000000      000     
    # 000   000  000            000  000          000     
    # 000   000  00000000  0000000   00000000     000     
    
    @reset: (buffer, params) ->
        
        if typeof(params) == 'object'
            for i in [0...params.length]
                Mode.reset buffer, params[i]
            return
        
        # log 'Mode.reset params', params, buffer.prefix
            
        if empty buffer.prefix
            
            switch params
                when 4
                    buffer.insertMode = false
                    
                when 20
                    buffer.convertEol = false
                    
        else if buffer.prefix == '?'
        
            # log 'Mode.reset'
            
            switch params
                                
                when 1
                    buffer.applicationCursor = false
                    
                when 3
                    if buffer.cols == 132 and buffer.savedCols
                        buffer.resize buffer.savedCols, buffer.rows
                    delete buffer.savedCols
                    
                when 6
                    buffer.originMode = false
                    
                when 7
                    buffer.wraparoundMode = false
                    
                when 12
                    buffer.cursorBlink = false
                
                when 25 # hide cursor
                    buffer.cursorHidden = true
                    
                when 66
                    buffer.applicationKeypad = false
                
                when 9, 1000, 1002, 1003 # any event mouse
                    buffer.x10Mouse = false
                    buffer.vt200Mouse = false
                    buffer.normalMouse = false
                    buffer.mouseEvents = false
                    buffer.element.style.cursor = ''
                
                when 1004 # send focusin/focusout events
                    buffer.sendFocus = false
                
                when 1005 # utf8 ext mode mouse
                    buffer.utfMouse = false
                
                when 1006 # sgr ext mode mouse
                    buffer.sgrMouse = false
                
                when 1015 # urxvt ext mode mouse
                    buffer.urxvtMouse = false
                                
                when 1047, 1049, 47 # normal screen buffer - clearing it first
                    log 'normal'
                    # if buffer.normal
                        # this.lines = this.normal.lines
                        # this.ybase = this.normal.ybase
                        # this.ydisp = this.normal.ydisp
                        # buffer.x = this.normal.x
                        # buffer.y = this.normal.y
                        # this.scrollTop = this.normal.scrollTop
                        # this.scrollBottom = this.normal.scrollBottom
                        # this.tabs = this.normal.tabs
                        # this.normal = null
                        # this.refresh(0, this.rows - 1)
                        # this.showCursor()
                    
module.exports = Mode
