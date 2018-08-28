###
00000000    0000000   00000000    0000000  00000000
000   000  000   000  000   000  000       000     
00000000   000000000  0000000    0000000   0000000 
000        000   000  000   000       000  000     
000        000   000  000   000  0000000   00000000
###

{ clamp, empty, valid, slash, str, log } = require 'kxk'

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
        
        return if empty data

        @buffer.changed = new Set()

        ch = null
        
        # log 'parse', JSON.stringify data.replace /\x1b/g, '🅴'

        for i in [0...data.length]
            
            @buffer.lch = ch
            ch = data[i]
            
            switch @buffer.state
                
                when 0 # normal
                    
                    switch ch
                        
                        when '\n', '\x0b', '\x0c'
                            
                            if @buffer.ignoreNextNewline
                                # log 'ignoreNextNewline'
                                delete @buffer.ignoreNextNewline
                                continue
                            
                            @buffer.y += 1
                            
                            if @buffer.y >= @buffer.lines.length
                                @buffer.lines.push []
                                # log "newline push #{@buffer.y} #{@buffer.lines.length}"
                                # @buffer.y = Math.min @buffer.lines.length-1, @buffer.y
                                @buffer.changed.add @buffer.y
                                
                            @buffer.x = 0
                            
                        when '\r'
                            @buffer.x = 0
                            
                        when '\x1b'
                            @buffer.state = 1 # escaped
                            
                        when '\x08'
                            #log 'backspace?'
                            if @buffer.x > 0 
                                @buffer.x--

                        when '\x07'
                            log 'bell!'
                              
                        when '\t'
                            @buffer.x = @nextStop()
                                                                                    
                        else

                            if ch == '⏎' 
                                if slash.win()
                                    @buffer.ignoreNextNewline = true
                                    # continue?
                            
                            if @buffer.x >= @buffer.cols
                                @buffer.x = 0
                                @buffer.y++
                                if @buffer.y >= @buffer.lines.length
                                    @buffer.lines.push []
                                    # log "wrap line push #{@buffer.y} #{@buffer.lines.length}"
                                
                            if not @buffer.lines[@buffer.y]
                                log "dafuk? #{@buffer.y} #{@buffer.lines.length}"
                                return
                            
                            if @buffer.x <= @buffer.lines[@buffer.y].length-1
                                @buffer.lines[@buffer.y][@buffer.x] = [@buffer.attr, ch]
                            else
                                @buffer.lines[@buffer.y].push [@buffer.attr, ch]
                            @buffer.changed.add @buffer.y 
                            @buffer.x++
                
                # 00000000   0000000   0000000  
                # 000       000       000       
                # 0000000   0000000   000       
                # 000            000  000       
                # 00000000  0000000    0000000  
                
                when 1 # escaped
                    
                    switch ch
                        when '[' # Control Sequence Introducer CSI 0x9b
                            @buffer.currentParam = 0
                            @buffer.params = []
                            @buffer.state = 2
                       
                        when ']' # Operating System Command OSC 0x9d
                            @buffer.params = []
                            @buffer.currentParam = 0
                            @buffer.state = 3
                        
                        when 'c'
                            @buffer.reset()
                            
                        else
                            
                            log "unhandled ESC '#{ch}' "

                #  0000000   0000000  000  
                # 000       000       000  
                # 000       0000000   000  
                # 000            000  000  
                #  0000000  0000000   000  
                
                when 2 # CSI
                    
                    # log "CSI '#{ch}'"
                    
                    if ch in '?>!'
                        @buffer.prefix = ch
                    else if '0' <= ch <= '9'
                        @buffer.currentParam = @buffer.currentParam * 10 + ch.charCodeAt(0) - 48
                    else if ch in '$" \''
                        @buffer.postfix = ch
                    else
                        @buffer.params.push @buffer.currentParam
                        @buffer.currentParam = 0
                
                        if ch != ';'
                            @buffer.state = 0
            
                        switch ch
                            # cursor up, down, right, left
                            when 'A' then @buffer.y = clamp 0, @buffer.rows-1, @buffer.y - Math.max 1, @buffer.params[0]
                            when 'B' then @buffer.y = clamp 0, @buffer.rows-1, @buffer.y + Math.max 1, @buffer.params[0]
                            when 'C' then @buffer.x = clamp 0, @buffer.cols-1, @buffer.x + Math.max 1, @buffer.params[0]
                            when 'D' then @buffer.x = clamp 0, @buffer.cols-1, @buffer.x - Math.max 1, @buffer.params[0]

                            when 'E' # cursor next line
                                
                                @buffer.y = @buffer.y = clamp 0, @buffer.rows-1, @buffer.y + Math.max 1, @buffer.params[0]
                                @buffer.x = 0

                            when 'F' # cursor prev line    
                                
                                @buffer.y = @buffer.y = clamp 0, @buffer.rows-1, @buffer.y - Math.max 1, @buffer.params[0]
                                @buffer.x = 0
                                
                            when 'G' # cursor absolute column 
                                
                                @buffer.x = Math.max 0, @buffer.params[0] - 1
            
                            when 'H' # cursor position

                                row = @buffer.params[0] - 1
                                
                                if @buffer.params.length >= 2
                                    col = @buffer.params[1] - 1
                                else 
                                    col = 0
                                
                                col = clamp 0, @buffer.cols-1, col
                                row = clamp 0, @buffer.rows-1, row
                                    
                                @buffer.x = col
                                @buffer.y = row
                                
                                while @buffer.y >= @buffer.lines.length
                                    @buffer.lines.push []
            
                            when 'J' # erase in display
                                switch @buffer.params[0]
                                    when 0
                                        # log 'erase in display', @buffer.params[0]
                                        @eraseRight @buffer.x, @buffer.y
                                        for j in [@buffer.y + 1...@buffer.rows]
                                            @eraseLine j
                                    when 1
                                        # log 'erase in display', @buffer.params[0]
                                        @eraseLeft @buffer.x, @buffer.y
                                        for j in [@buffer.y-1..0]
                                            @eraseLine j
                                    when 2
                                        log 'CLEAR SCREEN'
                                        @buffer.reset()
                                            
                            when 'K' # erase in line EL
                                switch @buffer.params[0]
                                    when 0 then @eraseRight @buffer.x, @buffer.y
                                    when 1 then @eraseLeft  @buffer.x, @buffer.y
                                    when 2 then @eraseLine  @buffer.y
                            
                            when 'c' then @sendDeviceAttributes()
                                    
                            when 'm' # character attributes SGR
                                if empty @buffer.prefix
                                    @buffer.attr = Attr.set @buffer.params, @buffer.attr
    
                            when 'h' # mouse escape codes, cursor escape codes
                                Mode.set @buffer, @buffer.params

                            when 'l' # reset mode
                                Mode.reset @buffer, @buffer.params
                                
                            when 'n' # status report
                                if not @buffer.prefix
                                    switch @buffer.params[0]
                                        when 5 # status report
                                            # log 'status'
                                            @send '\x1b[0n'
                                        when 6 # cursor position
                                            log 'cursor', (@buffer.y + 1), (@buffer.x + 1) 
                                            @send  '\x1b[' + (@buffer.y + 1) + ';' + (@buffer.x + 1) + 'R'
                                        else
                                            log "unhandled CSI status report: '#{@buffer.params[0]}'"
                                else
                                    log "unhandled CSI status report with prefix: '#{@buffer.prefix}'"
                                
                            when '@' # @ - blank character(s) ICH
                                @insertChars @buffer.params
                                
                            when 'r'
                                if empty @buffer.prefix
                                    @buffer.top = (@buffer.params[0] ? 1) - 1
                                    @buffer.bot = (@buffer.params[1] ? @buffer.rows) - 1
                                    log "scroll region #{@buffer.top} #{@buffer.bot}"
                                    @buffer.x = 0
                                    @buffer.y = 0
                                
                            when ';' then # argument
                                
                            else
                                log "unhandled CSI character: '#{ch}'"
                    
                    @buffer.prefix  = ''
                    @buffer.postfix = ''
                                
                #  0000000    0000000   0000000  
                # 000   000  000       000       
                # 000   000  0000000   000       
                # 000   000       000  000       
                #  0000000   0000000    0000000  
                
                when 3 # OSC
                    
                    if (@buffer.lch == '\x1b' and ch == '\\') or ch == '\x07'
                                                
                        if @buffer.lch == '\x1b'
                            if typeof(@buffer.currentParam) == 'string'
                               @buffer.currentParam = @buffer.currentParam.slice(0, -1);
                            else if typeof(@buffer.currentParam) == 'number'
                               @buffer.currentParam = (@buffer.currentParam - ('\x1b'.charCodeAt(0) - 48)) / 10

                        @buffer.params.push @buffer.currentParam
    
                        if @buffer.params[0] == 0 and valid @buffer.params[1]
                            if not process.env.HOME
                                process.env.HOME = slash.path process.env.HOMEDRIVE + process.env.HOMEPATH
                            @buffer.title = slash.tilde @buffer.params[1].replace '/c/', 'C:/'

                        @buffer.params = []
                        @buffer.currentParam = 0
                        @buffer.state = 0
                        
                    else
                        
                        if empty @buffer.params
                            
                            if '0' <= ch <= '9'
                                @buffer.currentParam = @buffer.currentParam * 10 + ch.charCodeAt(0) - 48
                            else if ch == ';'
                                @buffer.params.push @buffer.currentParam
                                @buffer.currentParam = ''
                            else 
                                @buffer.currentParam += ch
                        else
                            @buffer.currentParam += ch
                            
    # 00000000  00000000    0000000    0000000  00000000  
    # 000       000   000  000   000  000       000       
    # 0000000   0000000    000000000  0000000   0000000   
    # 000       000   000  000   000       000  000       
    # 00000000  000   000  000   000  0000000   00000000
    
    eraseAttr: -> (defAttr & ~0x1ff) | (@buffer.attr & 0x1ff) 
    
    eraseLine: (y) -> @eraseRight 0, y
    
    eraseRight: (x, y) ->
        
        # log "erase in line #{y} from col #{x}"
        line = @buffer.lines[y]
        if line?
            @buffer.changed.add y
            line.splice x, line.length

    eraseLeft: (x, y) ->
        
        log "erase ---- left #{y} from col #{x}"
        line = @buffer.lines[y]
        ch = [@eraseAttr(), ' ']
        @buffer.x++ # ???\
        @buffer.changed.add y
        for i in [x..0]
            line[x] = ch

    nextStop: ->
        while @buffer.x % 4 != 0
            @buffer.x += 1
        clamp 0, @buffer.cols - 1, @buffer.x
               
    send: (data) -> window.term.shell.write data
    
    sendDeviceAttributes: ->
        
        log "device attributes #{@buffer.params[0]}"
        return if @buffer.params[0] > 0 
        
        if empty @buffer.prefix
            @send '\x1b[?1;2c' # '\x1b[?6c'
        else if @buffer.prefix == '>'
            @send '\x1b[>0;276;0c' # params[0] + 'c'
        
    dump: (msg) -> log '---------------', msg, @buffer, "\nprefix '#{@buffer.prefix}' postfix '#{@buffer.postfix}'", "\nparam #{@buffer.currentParam} params #{@buffer.params.length}", @buffer.params, '\n---------------'
        
module.exports = Parse.parse
