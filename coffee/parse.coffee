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
        # log 'parsed lines', buffer.lines
        buffer
            
    parseData: (data) -> 
        
        @buffer.prefix  = ''
        @buffer.postfix = ''
        @buffer.state = 0
        @buffer.attr = defAttr

        l  = data.length
        j  = 0 
        ch = null
        
        log 'parse', JSON.stringify data.replace /\x1b/g, '🅴'

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

          # # ESC P Device Control String ( DCS is 0x90).
          # case 'P':
            # this.params = [];
            # this.prefix = '';
            # this.currentParam = '';
            # this.state = dcs;
            # break;

          # # ESC _ Application Program Command ( APC is 0x9f).
          # case '_':
            # this.state = ignore;
            # break;

          # # ESC ^ Privacy Message ( PM is 0x9e).
          # case '^':
            # this.state = ignore;
            # break;

          # # ESC c Full Reset (RIS).
          # case 'c':
            # this.reset();
            # break;

          # # ESC E Next Line ( NEL is 0x85).
          # # ESC D Index ( IND is 0x84).
          # case 'E':
            # this.x = 0;
            # ;
          # case 'D':
            # this.index();
            # break;

          # # ESC M Reverse Index ( RI is 0x8d).
          # case 'M':
            # this.reverseIndex();
            # break;

          # # ESC % Select default/utf-8 character set.
          # # @ = default, G = utf-8
          # case '%':
            # //this.charset = null;
            # this.setgLevel(0);
            # this.setgCharset(0, Terminal.charsets.US);
            # this.state = normal;
            # i++;
            # break;

          # # ESC 7 Save Cursor (DECSC).
          # case '7':
            # this.saveCursor();
            # this.state = normal;
            # break;

          # # ESC 8 Restore Cursor (DECRC).
          # case '8':
            # this.restoreCursor();
            # this.state = normal;
            # break;

          # # ESC # 3 DEC line height/width
          # case '#':
            # this.state = normal;
            # i++;
            # break;

          # # ESC H Tab Set (HTS is 0x88).
          # case 'H':
            # this.tabSet();
            # break;

          # default:
            # this.state = normal;
            # this.error('Unknown ESC control: %s.', ch);
            # break;
        # }
        # break;

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
                                # if @buffer.y == 0
                                    # log "cursor absolute '#{@params[0]}' column #{@buffer.x} line #{@buffer.y}"
                                    # # @buffer.lines[@buffer.y] = @buffer.lines[@buffer.y].slice 0, @buffer.x
                                    # @buffer.lines = @buffer.lines.slice 0, 1
                                    # @eraseRight @buffer.x, @buffer.y
            
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
                                
          # # CSI Ps E
          # # Cursor Next Line Ps Times (default = 1) (CNL).
          # case 'E':
            # this.cursorNextLine(this.params);
            # break;

          # # CSI Ps F
          # # Cursor Preceding Line Ps Times (default = 1) (CNL).
          # case 'F':
            # this.cursorPrecedingLine(this.params);
            # break;

          # # CSI Ps L
          # # Insert Ps Line(s) (default = 1) (IL).
          # case 'L':
            # this.insertLines(this.params);
            # break;

          # # CSI Ps M
          # # Delete Ps Line(s) (default = 1) (DL).
          # case 'M':
            # this.deleteLines(this.params);
            # break;

          # # CSI Ps P
          # # Delete Ps Character(s) (default = 1) (DCH).
          # case 'P':
            # this.deleteChars(this.params);
            # break;

          # # CSI Ps X
          # # Erase Ps Character(s) (default = 1) (ECH).
          # case 'X':
            # this.eraseChars(this.params);
            # break;

          # # CSI Pm `  Character Position Absolute
          # #   [column] (default = [row,1]) (HPA).
          # case '`':
            # this.charPosAbsolute(this.params);
            # break;

          # # 141 61 a * HPR -
          # # Horizontal Position Relative
          # case 'a':
            # this.HPositionRelative(this.params);
            # break;

          # # CSI P s c
          # # Send Device Attributes (Primary DA).
          # # CSI > P s c
          # # Send Device Attributes (Secondary DA)
          # case 'c':
            # this.sendDeviceAttributes(this.params);
            # break;

          # # CSI Pm d
          # # Line Position Absolute  [row] (default = [1,column]) (VPA).
          # case 'd':
            # this.linePosAbsolute(this.params);
            # break;

          # # 145 65 e * VPR - Vertical Position Relative
          # case 'e':
            # this.VPositionRelative(this.params);
            # break;

          # # CSI Ps ; Ps f
          # #   Horizontal and Vertical Position [row;column] (default =
          # #   [1,1]) (HVP).
          # case 'f':
            # this.HVPosition(this.params);
            # break;

          # # CSI Ps ; Ps r
          # #   Set Scrolling Region [top;bottom] (default = full size of win-
          # #   dow) (DECSTBM).
          # # CSI ? Pm r
          # case 'r':
            # this.setScrollRegion(this.params);
            # break;

          # # CSI s
          # #   Save cursor (ANSI.SYS).
          # case 's':
            # this.saveCursor(this.params);
            # break;

          # # CSI u
          # #   Restore cursor (ANSI.SYS).
          # case 'u':
            # this.restoreCursor(this.params);
            # break;

          # /**
           # * Lesser Used
           # */

          # # CSI Ps I
          # # Cursor Forward Tabulation Ps tab stops (default = 1) (CHT).
          # case 'I':
            # this.cursorForwardTab(this.params);
            # break;

          # # CSI Ps S  Scroll up Ps lines (default = 1) (SU).
          # case 'S':
            # this.scrollUp(this.params);
            # break;

          # # CSI Ps T  Scroll down Ps lines (default = 1) (SD).
          # # CSI Ps ; Ps ; Ps ; Ps ; Ps T
          # # CSI > Ps; Ps T
          # case 'T':
            # # if (this.prefix == '>') {
            # #   this.resetTitleModes(this.params);
            # #   break;
            # # }
            # # if (this.params.length > 2) {
            # #   this.initMouseTracking(this.params);
            # #   break;
            # # }
            # if (this.params.length < 2 && !this.prefix) {
              # this.scrollDown(this.params);
            # }
            # break;

          # # CSI Ps Z
          # # Cursor Backward Tabulation Ps tab stops (default = 1) (CBT).
          # case 'Z':
            # this.cursorBackwardTab(this.params);
            # break;

          # # CSI Ps b  Repeat the preceding graphic character Ps times (REP).
          # case 'b':
            # this.repeatPrecedingCharacter(this.params);
            # break;

          # # CSI Ps g  Tab Clear (TBC).
          # case 'g':
            # this.tabClear(this.params);
            # break;

          # # CSI > Ps p  Set pointer mode.
          # # CSI ! p   Soft terminal reset (DECSTR).
          # # CSI Ps$ p
          # #   Request ANSI mode (DECRQM).
          # # CSI ? Ps$ p
          # #   Request DEC private mode (DECRQM).
          # # CSI Ps ; Ps " p
          # case 'p':
            # switch (this.prefix) {
              # # case '>':
              # #   this.setPointerMode(this.params);
              # #   break;
              # case '!':
                # this.softReset(this.params);
                # break;
              # # case '?':
              # #   if (this.postfix == '$') {
              # #     this.requestPrivateMode(this.params);
              # #   }
              # #   break;
              # # default:
              # #   if (this.postfix == '"') {
              # #     this.setConformanceLevel(this.params);
              # #   } else if (this.postfix == '$') {
              # #     this.requestAnsiMode(this.params);
              # #   }
              # #   break;
            # }
            # break;

          # default:
            # this.error('Unknown CSI code: %s.', ch);
            # break;
        # }
             
    eraseAttr: -> (defAttr & ~0x1ff) | (@buffer.attr & 0x1ff) 
    
    eraseLine: (y) -> @eraseRight 0, y
    
    eraseRight: (x, y) ->
        
        log "erase in line #{y} from col #{x}"
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
