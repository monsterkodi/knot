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

class Render

    @line: (line, buffer) ->

        out = ''
        
        defAttr = (257 << 9) | 256

        lastAttr = null
        
        for i in [0...buffer.cols]
            
            if i >= line.length
                if lastAttr
                    out += '</span>'
                return out 
            
            attr = line[i][0]
            ch   = line[i][1]
            
            if attr != lastAttr 
                
                if lastAttr
                    out += '</span>'

                out += '<span style="'
    
                bg = attr & 0x1ff
                fg = (attr >> 9) & 0x1ff
                flags = attr >> 18
    
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
                  # bg = (attr >> 9) & 0x1ff;
                  # fg = attr & 0x1ff;
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
                    
            lastAttr = attr
    
        if lastAttr
            out += '</span>'
    
        out            

module.exports = Render
