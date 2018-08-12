###
00000000    0000000   00000000    0000000  00000000
000   000  000   000  000   000  000       000     
00000000   000000000  0000000    0000000   0000000 
000        000   000  000   000       000  000     
000        000   000  000   000  0000000   00000000
###

{ valid, empty, clamp, log } = require 'kxk'

Attr = require './attr'
Mode = require './mode'

defAttr = (257 << 9) | 256

class Parse

    constructor: (@buffer) ->
        
    @parse: (data, buffer) -> 
    
        parser = new Parse buffer
        parser.parseData data
        buffer
            
    parseData: (data) -> 
        
        @buffer.prefix  = ''
        @buffer.postfix = ''
        @buffer.state = 0
        @buffer.attr = defAttr

        l  = data.length
        j  = 0 
        ch = null
        
        # log 'parse', JSON.stringify data.replace /\x1b/g, '🅴'

        for i in [0...l]
            
            @buffer.lch = ch
            ch = data[i]
            
            switch @buffer.state
                
                when 0 # normal
                    
                    switch ch
                        when '\x07'
                            # @bell()
                            log 'bell!'
                        when '\n', '\x0b', '\x0c'
                            @buffer.y += 1
                            if @buffer.y >= @buffer.lines.length
                                @buffer.lines.push []
                            @buffer.y = Math.min @buffer.lines.length-1, @buffer.y
                            @buffer.x = 0
                        when '\r'
                            @buffer.x = 0
                            @buffer.attr = defAttr
                            @buffer.prefix = ''
                        when '\x08'
                            log 'backspace?'
                            if @buffer.x > 0 
                              @buffer.x--
                        when '\t'
                            @buffer.x = @nextStop()
                        when '\x1b'
                            @buffer.state = 1 # escaped
                        else
                            if @buffer.x <= @buffer.lines[@buffer.y].length-1
                                @buffer.lines[@buffer.y][@buffer.x] = [@buffer.attr, ch]
                            else
                                @buffer.lines[@buffer.y].push [@buffer.attr, ch]
                                
                            @buffer.x++
                
                when 1 # escaped
                    
                    switch ch
                        when '[' # Control Sequence Introducer CSI 0x9b
                            @currentParam = 0
                            @params = []
                            @buffer.state = 2
                       
                        when ']' # Operating System Command OSC 0x9d
                            @params = []
                            @currentParam = 0
                            @buffer.state = 3
                        
                        else
                            
                            log "unhandled ESC '#{ch}'"

                #  0000000    0000000   0000000  
                # 000   000  000       000       
                # 000   000  0000000   000       
                # 000   000       000  000       
                #  0000000   0000000    0000000  
                
                when 3 # OSC
                    if (@buffer.lch == '\x1b' and ch == '\\') or ch == '\x07'
                        
                        
                        if @buffer.lch == '\x1b'
                            if typeof(@currentParam) == 'string'
                               @currentParam = @currentParam.slice(0, -1);
                            else if typeof(@currentParam) == 'number'
                               @currentParam = (@currentParam - ('\x1b'.charCodeAt(0) - 48)) / 10

                        @params.push @currentParam
    
                        if @params[0] == 0 and valid @params[1]
                            @buffer.title = @params[1]

                        @params = []
                        @currentParam = 0
                        @buffer.state = 0
                        
                    else
                        
                        if empty @params
                            
                            if '0' <= ch <= '9'
                                @currentParam = @currentParam * 10 + ch.charCodeAt(0) - 48
                            else if ch == ';'
                                @params.push @currentParam
                                @currentParam = ''
                            else 
                                @currentParam += ch
                        else
                            @currentParam += ch

                #  0000000   0000000  000  
                # 000       000       000  
                # 000       0000000   000  
                # 000            000  000  
                #  0000000  0000000   000  
                
                when 2 # CSI
                    
                    # log "CSI '#{ch}'"
                    
                    if ch in '?>!'
                        @buffer.prefix = ch
                        # log "CSI @buffer.prefix '#{ch}'"
                    else if '0' <= ch <= '9'
                        @currentParam = @currentParam * 10 + ch.charCodeAt(0) - 48
                        # log "CSI @currentParam '#{@currentParam}'"
                    else if ch in '$" \''
                        @buffer.postfix = ch
                    else
                        @params.push @currentParam
                        @currentParam = 0
                
                        if ch != ';'
                            @buffer.state = 0
            
                        switch ch
                            # cursor up, down, right, left
                            when 'A' then @buffer.y = clamp 0, @buffer.rows-1, @buffer.y - Math.max 1, @params[0]
                            when 'B' then @buffer.y = clamp 0, @buffer.rows-1, @buffer.y + Math.max 1, @params[0]
                            when 'C' then @buffer.x = clamp 0, @buffer.cols-1, @buffer.x + Math.max 1, @params[0]
                            when 'D' then @buffer.x = clamp 0, @buffer.cols-1, @buffer.x - Math.max 1, @params[0]

                            when 'H' # cursor position

                                row = @params[0] - 1
                                
                                if @params.length >= 2
                                    col = @params[1] - 1
                                else 
                                    col = 0
                                
                                col = clamp 0, @buffer.cols-1, col
                                row = clamp 0, @buffer.rows-1, col
                                    
                                @buffer.x = col
                                @buffer.y = row
                                
                                log "cursor position #{@buffer.x} #{@buffer.y}"

                            when 'G' # cursor absolute column 
                                
                                @buffer.x = Math.max 0, @params[0] - 1
            
                            when 'J' # erase in display
                                switch @params[0]
                                    when 0
                                        log 'erase in display', @params[0]
                                        @eraseRight @buffer.x, @buffer.y
                                        for j in [@buffer.y + 1...@buffer.rows]
                                            @eraseLine j
                                    when 1
                                        log 'erase in display', @params[0]
                                        @eraseLeft @buffer.x, @buffer.y
                                        for j in [@buffer.y-1..0]
                                            @eraseLine j
                                    when 2
                                        log 'CLEAR SCREEN'
                                        @buffer.lines = [[]]
                                        @buffer.cache = [[]]
                                            
                            when 'K' # erase in line EL
                                switch @params[0]
                                    when 0 then @eraseRight @buffer.x, @buffer.y
                                    when 1 then @eraseLeft  @buffer.x, @buffer.y
                                    when 2 then @eraseLine  @buffer.y
                            
                            when 'm' # character attributes SGR
                                if empty @buffer.prefix
                                    @buffer.attr = Attr.set @params, @buffer.attr
    
                            when 'h' # mouse escape codes, cursor escape codes
                                # log 'CSI mouse/cursor escape', @buffer.prefix
                                Mode.set @buffer, @params

                            when 'l' # reset mode
                                # log 'CSI mode reset', @buffer.prefix
                                Mode.reset @buffer, @params
                                
                            when '@' # @ - blank character(s) ICH
                                @insertChars @params
                                
                            when ';' then # argument
                                
                            else
                                log "unhandled CSI character: '#{ch}'"
                                
    eraseAttr: -> (defAttr & ~0x1ff) | (@buffer.attr & 0x1ff) 
    
    eraseLine: (y) -> @eraseRight 0, y
    
    eraseRight: (x, y) ->
        
        # log "erase in line #{y} from col #{x}"
        line = @buffer.lines[y]
        if line?
            line = line.splice x, line.length

    eraseLeft: (x, y) ->
        
        log "erase ---- left #{y} from col #{x}"
        line = @buffer.lines[y]
        ch = [@eraseAttr(), ' ']
        @buffer.x++ # ???
        for i in [x..0]
            line[x] = ch

    dump: (msg) -> log '---------------', msg, @buffer, "\nprefix '#{@buffer.prefix}' postfix '#{@buffer.postfix}'", "\nparam #{@currentParam} params #{@params.length}", @params, '\n---------------'
        
module.exports = Parse.parse
