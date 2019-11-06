###
00000000   000000000  000   000  
000   000     000      000 000   
00000000      000       00000    
000           000        000     
000           000        000     
###

{ title, klog } = require 'kxk'

pty = require 'node-pty'

class PTY

    @: (@term) ->
        
        @editor = @term.editor
        @spawn()             

    #  0000000  00000000    0000000   000   000  000   000  
    # 000       000   000  000   000  000 0 000  0000  000  
    # 0000000   00000000   000000000  000000000  000 0 000  
    #      000  000        000   000  000   000  000  0000  
    # 0000000   000        000   000  00     00  000   000  
    
    spawn: ->
        
        # shell = os.platform() == 'win32' and 'cmd' or 'bash'
        shell = 'C:/msys64/usr/bin/bash.exe'
        @pty = pty.spawn shell, [],
            useConpty: true 
            name: 'xterm-256color'
            cols: parseInt (@editor.layers.offsetWidth - @editor.size.numbersWidth) / @editor.size.charWidth
            rows: @editor.scroll.fullLines
            cwd: process.cwd()
            env: process.env
         
        klog '@pty rows' @pty.rows, 'cols' @pty.cols, @editor.layers.offsetWidth, @editor.size.charWidth, @editor.layers.offsetWidth / @editor.size.charWidth
        @pty.onData @onData
                  
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    handleKey: (mod, key, combo, char, event) ->
        
        switch key
            when 'enter'     then @pty.write '\r'
            when 'backspace' then @pty.write '\x08'
            else
                if char
                    @pty.write char
                else
                    klog 'key' mod, key, combo
        
    #  0000000   000   000  0000000     0000000   000000000   0000000   
    # 000   000  0000  000  000   000  000   000     000     000   000  
    # 000   000  000 0 000  000   000  000000000     000     000000000  
    # 000   000  000  0000  000   000  000   000     000     000   000  
    #  0000000   000   000  0000000    000   000     000     000   000  
    
    onData: (data) =>
        
        # klog "--------------------------------------"
        # klog "|#{data}|"
        
        line = ''
        code = 0
        ci   = -1
        ch   = null
        
        crazyNewlines = 0
        
        next = -> 
            ci += 1
            ch = data[ci]
            code = ch.charCodeAt(0)
            # klog "#{kstr.pad code, 3} 0x#{code.toString(16)} #{ch}"
        
        while ci < data.length-1
                        
            next()
            
            switch code
                when 7  then klog '🔔'
                when 8  
                    @editor.deleteBackward singleCharacter:true
                    if data[ci+1] == ' ' and data[ci+2].charCodeAt(0) == 8
                        next()
                        next()
                when 27 # ESC
                    next()
                    if 0x40 <= code <= 0x5f # @A–Z[\]^_
                        switch ch 
                            
                            #  0000000   0000000  000  
                            # 000       000       000  
                            # 000       0000000   000  
                            # 000            000  000  
                            #  0000000  0000000   000  
                            
                            when '[' # CSI 
                                param = ''
                                imeds = ''
                                next()
                                while 0x30 <= code <= 0x3F # 0–9:;<=>?
                                    param += ch
                                    next()
                                while 0x20 <= code <= 0x2F # !"#$%&'()*+,-./
                                    imeds += ch
                                    next()
                                if 0x40 <= code <= 0x7E # @A–Z[\]^_`a–z{|}~
                                    klog "    esc[#{param}#{imeds}#{ch}"
                                    switch ch
                                        
                                        when 'm'
                                            line += "\x1B[#{param}#{imeds}#{ch}"                    
                                            
                                        when 'X'
                                            
                                            if data[ci+1..] == "\x1b[#{param}C\x0d" # crazy cmd.exe newline
                                                ci += 3+param.length
                                                klog 'skipped crazy newline' data[ci+1]
                                            
                                        when 'C'
                                            
                                            if data[ci+1] == '\r' and data[ci+2] == '\n' # more crazyness
                                                if parseInt(param) == @pty.cols
                                                    ci += 2
                                                    crazyNewlines += 1
                                                    # klog "crazy newline #{crazyNewlines}" data[ci+1]
                                            
                                        when 'J'
                                            
                                            switch param
                                                when '0' '' then klog 'erase below'
                                                when '1'    then klog 'erase above'
                                                when '2'    then klog 'erase all'
                                                when '3'    then klog 'erase saved'
                                                else
                                                    log 'erase ???'
                                        when 'H'
                                            
                                            if param.length
                                                [row,col] = param.split ';'
                                                col ?= 1
                                            else
                                                row = col = 1
                                                crazyNewlines = 0
                                                while data[ci+1] == '\r' and data[ci+2] == '\n'
                                                    ci += 2
                                                
                                            klog "    move cursor row #{row} col #{col}"
                                            
                                        # when 'h' 
                                            # if param == '?25'
                                                # klog '    show cursor'
                                        # when 'l'
                                            # if param == '?25'
                                                # klog '    hide cursor'
                                            
                            when ']'
                                if data[ci+1] == '0' and data[ci+2] == ';'
                                    next()
                                    next()
                                    next()
                                    title = ''
                                    while code != 7
                                        title += ch
                                        next()
                                    # klog "title: #{title}"
                # when 13 # \r
                    # klog '    \r'
                when 10 # \n 
                    
                    while crazyNewlines > 0
                        # klog 'not so crazy'
                        @editor.appendText ''
                        @editor.singleCursorAtEnd()
                        crazyNewlines -= 1
                    
                    klog ">>>|#{line}|"
                    @editor.appendInputText line
                    @editor.appendText ''
                    @editor.singleCursorAtEnd()
                    line = ''
                else
                    line += ch
                    
        if line.trim().length
            klog "!!!|#{line}|"
            @editor.appendInputText line
            # @editor.singleCursorAtEnd()
        else if data == ' '
            @editor.appendInputText ' '

module.exports = PTY
