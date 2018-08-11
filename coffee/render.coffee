###
00000000   00000000  000   000  0000000    00000000  00000000 
000   000  000       0000  000  000   000  000       000   000
0000000    0000000   000 0 000  000   000  0000000   0000000  
000   000  000       000  0000  000   000  000       000   000
000   000  00000000  000   000  0000000    00000000  000   000
###

{ str, _ } = require 'kxk'

log = console.log

fgcolors = [
    '#222222'
    '#880000'
    '#008800'
    '#aaaa00'
    '#0000ff'
    '#aa00aa'
    '#00aaaa'
    '#aaaaaa'
    '#444444'
    '#ff0000'
    '#00ff00'
    '#ffff44'
    '#6666ff'
    ]
                # foreground:    '#cccccc'
                # background:    '#000000'
                # cursor:        '#ffff00'
                # cursorAccent:  '#ffff88'
                # selection:     'rgba(128,128,128,0.2)'
              # 0 # black:         '#222222'
              # 1 # red:           '#880000'
              # 2 # green:         '#008800'
              # 3 # yellow:        '#aaaa00'
              # 4 # blue:          '#0000ff'
              # 5 # magenta:       '#aa00aa'
              # 6 # cyan:          '#00aaaa'
              # 7 # white:         '#aaaaaa'
              # 8 # brightBlack:   '#444444'
              # 9 # brightRed:     '#ff0000'
             # 10 # brightGreen:   '#00ff00'
             # 11 # brightYellow:  '#ffff44'
             # 12 # brightBlue:    '#6666ff'
                # brightMagenta: '#ff44ff'
                # brightCyan:    '#00dddd'
                # brightWhite:   '#ffffff'

class Render

    @line: (line, buffer) ->

        out = ''
        
        defAttr = (257 << 9) | 256
        # log "Render.line:", str line
        attr = defAttr
        
        for i in [0...buffer.cols]
            
            return out if i >= line.length
            
            data = line[i][0]
            ch   = line[i][1]
            
            # log "Render.line col:#{i} data: #{data} ch:'#{ch}'"
    
            # if (i == x) data = -1
    
            if data != attr
                if attr != defAttr
                    out += '</span>'

            if data != defAttr
                out += '<span style="'
    
                bg = data & 0x1ff
                fg = (data >> 9) & 0x1ff
                flags = data >> 18
    
                # log "Render.line bg #{bg} fg #{fg} flags #{flags}"
                
                if (flags & 1) # bold
                    out += 'font-weight:bold;'
                    if fg < 8 then fg += 8
                
                if (flags & 2) # underline
                    out += 'text-decoration:underline;'
    
                # # blink
                # if (flags & 4) {
                  # if (flags & 2) {
                    # out = out.slice(0, -1);
                    # out += ' blink;';
                  # } else {
                    # out += 'text-decoration:blink;';
                  # }
                # }
#     
                # # inverse
                # if (flags & 8) {
                  # bg = (data >> 9) & 0x1ff;
                  # fg = data & 0x1ff;
                  # # Should inverse just be before the
                  # # above boldColors effect instead?
                  # if ((flags & 1) && fg < 8) fg += 8;
                # }
#     
                # # invisible
                # if (flags & 16) {
                  # out += 'visibility:hidden;';
                # }
    
                # out += '" class="'
                #   + 'term-bg-color-' + bg
                #   + ' '
                #   + 'term-fg-color-' + fg
                #   + '">';
    
                if bg != 256
                    # out += 'background-color:' + this.colors[bg] + ';'
                    out += "background-color:#{bg};"
    
                if fg != 257 
                    # out += 'color:' + this.colors[fg] + ';'
                    out += "color:#{fgcolors[fg]};"
    
                out += '">'
    
            switch (ch) 
                when '&' then out += '&amp;'
                when '<' then out += '&lt;'
                when '>' then out += '&gt;'
                else
                    if ch <= ' '
                        out += '&nbsp;'
                    else 
                        # if (isWide(ch)) i++
                        out += ch
                    
            attr = data
    
        if attr != defAttr
            out += '</span>'
    
        # log "out:'#{out}'"
        out            

module.exports = Render
