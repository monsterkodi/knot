###
00000000    0000000   00000000    0000000  00000000
000   000  000   000  000   000  000       000     
00000000   000000000  0000000    0000000   0000000 
000        000   000  000   000       000  000     
000        000   000  000   000  0000000   00000000
###

{ empty, log } = require 'kxk'

Attr  = require './attr'
Mode  = require './mode'

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
        
        # if  @buffer.ybase !== @buffer.ydisp 
            # @buffer.ydisp = @buffer.ybase
            # @maxRange()

        log 'parse', JSON.stringify data.replace /\x1b/g, '^['

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
                            @buffer.lines.push []
                            @buffer.y = @buffer.lines.length-1
                            @buffer.x = 0
                        when '\r'
                            @buffer.x = 0
                            @buffer.attr = defAttr
                            @buffer.prefix = '' # sure ???
                        when '\x08'
                            log 'backspace?'
                            if @buffer.x > 0 
                              @buffer.x--
                        when '\t'
                            @buffer.x = @nextStop()
                        # when '\x0e'
                            # @setgLevel(1)
                        # when '\x0f'
                            # @setgLevel(0)
                        when '\x1b'
                            @buffer.state = 1 # escaped
                        else
                            # if ch >= ' ' 
                                # if @charset and @charset[ch]
                                    # ch = @charset[ch]
                
                            # if @buffer.x >= @cols
                                # @buffer.x = 0
                                # @buffer.y++
                                
                            # if @buffer.y > @scrollBottom
                                  # @buffer.y--
                                  # @scroll()
                
                            if @buffer.x <= @buffer.lines[@buffer.y].length-1
                                @buffer.lines[@buffer.y][@buffer.x] = [@buffer.attr, ch]
                            else
                                @buffer.lines[@buffer.y].push [@buffer.attr, ch]
                                
                            @buffer.x++
                
                            # if isWide(ch)
                                # j = this.y + this.ybase
                                # if (this.cols < 2 || this.x >= this.cols)
                                    # this.lines[j][this.x - 1] = [this.buffer.attr, ' ']
                                # else
                                    # this.lines[j][this.x] = [this.buffer.attr, ' ']
                                    # this.x++
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

          # # ESC (,),*,+,-,. Designate G0-G2 Character Set.
          # case '(': # <-- this seems to get all the attention
          # case ')':
          # case '*':
          # case '+':
          # case '-':
          # case '.':
            # switch (ch) {
              # case '(':
                # this.gcharset = 0;
                # break;
              # case ')':
                # this.gcharset = 1;
                # break;
              # case '*':
                # this.gcharset = 2;
                # break;
              # case '+':
                # this.gcharset = 3;
                # break;
              # case '-':
                # this.gcharset = 1;
                # break;
              # case '.':
                # this.gcharset = 2;
                # break;
            # }
            # this.state = charset;
            # break;

          # # Designate G3 Character Set (VT300).
          # # A = ISO Latin-1 Supplemental.
          # # Not implemented.
          # case '/':
            # this.gcharset = 3;
            # this.state = charset;
            # i--;
            # break;

          # # ESC N
          # # Single Shift Select of G2 Character Set
          # # ( SS2 is 0x8e). This affects next character only.
          # case 'N':
            # break;
          # # ESC O
          # # Single Shift Select of G3 Character Set
          # # ( SS3 is 0x8f). This affects next character only.
          # case 'O':
            # break;
          # # ESC n
          # # Invoke the G2 Character Set as GL (LS2).
          # case 'n':
            # this.setgLevel(2);
            # break;
          # # ESC o
          # # Invoke the G3 Character Set as GL (LS3).
          # case 'o':
            # this.setgLevel(3);
            # break;
          # # ESC |
          # # Invoke the G3 Character Set as GR (LS3R).
          # case '|':
            # this.setgLevel(3);
            # break;
          # # ESC }
          # # Invoke the G2 Character Set as GR (LS2R).
          # case '}':
            # this.setgLevel(2);
            # break;
          # # ESC ~
          # # Invoke the G1 Character Set as GR (LS1R).
          # case '~':
            # this.setgLevel(1);
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

                when 3
                    if (@buffer.lch == '\x1b' and ch == '\\') or ch == '\x07'
                        if @buffer.lch == '\x1b'
                            if typeof(@currentParam) == 'string'
                               @currentParam = @currentParam.slice(0, -1);
                            else if typeof(@currentParam) == 'number'
                               @currentParam = (@currentParam - ('\x1b'.charCodeAt(0) - 48)) / 10

                        @params.push @currentParam
    
                        # switch @params[0]
                            # when 2
                                # if @params[1]
                                   # @handleTitle @params[1]

                        @params = []
                        @currentParam = 0
                        @buffer.state = 0
                        
                    else
                        if not @params.length
                            if '0' <= ch <= '9'
                                @currentParam = @currentParam * 10 + ch.charCodeAt(0) - 48
                            else if ch == ';'
                                @params.push @currentParam
                                @currentParam = ''
                            else 
                                @currentParam += ch

                when 2 # CSI
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
                
                        # # ';'
                        # if (ch == ';') break;
                        # this.state = normal;
                        
                        if ch != ';'
                            @buffer.state = 0
            
                        # log "CSI '#{ch}'"
                            
                        switch ch
          # # CSI Ps A
          # # Cursor Up Ps Times (default = 1) (CUU).
          # case 'A':
            # this.cursorUp(this.params);
            # break;

          # # CSI Ps B
          # # Cursor Down Ps Times (default = 1) (CUD).
          # case 'B':
            # this.cursorDown(this.params);
            # break;

          # # CSI Ps C
          # # Cursor Forward Ps Times (default = 1) (CUF).
          # case 'C':
            # this.cursorForward(this.params);
            # break;

          # # CSI Ps D
          # # Cursor Backward Ps Times (default = 1) (CUB).
          # case 'D':
            # this.cursorBackward(this.params);
            # break;

          # # CSI Ps ; Ps H
          # # Cursor Position [row;column] (default = [1,1]) (CUP).
          # case 'H':
            # this.cursorPos(this.params);
            # break;

          # # CSI Ps J  Erase in Display (ED).
          # case 'J':
            # this.eraseInDisplay(this.params);
            # break;

                            when 'G': # cursor absolute column 
                                log "cursor absolute column #{Math.max 0, @params[0] - 1}"
                                @buffer.x = Math.max 0, @params[0] - 1
            
                            when 'K' # erase in line EL
                                switch @params[0]
                                    when 0 then @eraseRight @buffer.x, @buffer.y
                                    when 1 then @eraseLeft  @buffer.x, @buffer.y
                                    when 2 then @eraseRight  0, @buffer.y
                            
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
                                
          # # CSI Ps n  Device Status Report (DSR).
          # case 'n':
            # if (!this.prefix) {
              # this.deviceStatus(this.params);
            # }
            # break;

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
    
    eraseRight: (x, y) ->
        
        line = @buffer.lines[y]
        ch = [@eraseAttr(), ' ']
        for i in [x...@buffer.cols]
            line[i] = ch

    eraseLeft: (x, y) ->
        line = @buffer.lines[y]
        ch = [@eraseAttr(), ' ']
        @buffer.x++ # ???
        for i in [x..0]
            line[x] = ch

    dump: (msg) -> log '---------------', msg, @buffer, "\nprefix '#{@buffer.prefix}' postfix '#{@buffer.postfix}'", "\nparam #{@currentParam} params #{@params.length}", @params, '\n---------------'
        
module.exports = Parse.parse
