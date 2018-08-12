###
00000000   00000000  000   000  0000000    00000000  00000000 
000   000  000       0000  000  000   000  000       000   000
0000000    0000000   000 0 000  000   000  0000000   0000000  
000   000  000       000  0000  000   000  000       000   000
000   000  00000000  000   000  0000000    00000000  000   000
###

{ str, _ } = require 'kxk'

log = console.log

colors = [
    '#222222'
    '#aa0000'
    '#00aa00'
    '#cccc00'
    '#0000ff'
    '#aa00aa'
    '#00aaaa'
    '#aaaaaa'
    # bright
    '#666666'
    '#ff0000'
    '#00ff00'
    '#ffff44'
    '#6666ff'
    '#880088'
    '#00ffff'
    '#ffffff'
    ]

colors[256] = '#000000' # background
colors[257] = '#f0f0f0' # foreground
    
class Render

    @line: (line, buffer) ->

        out = ''
        
        defAttr = (257 << 9) | 256

        lastAttr = null
        
        numCols = Math.min buffer.cols, line.length
        if numCols == 0
            return '<span> </span>'
        
        for i in [0...numCols]
            
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
                    if fg == 257
                        fg = 15
                    else if fg < 8 
                        log "bold #{fg}"
                        fg += 8
                
                if (flags & 2) # underline
                    out += 'text-decoration:underline;'
    
                if (flags & 4) # blink
                    if (flags & 2)
                        out = out.slice(0, -1)
                        out += ' blink;'
                    else
                        out += 'text-decoration:blink;'

                if (flags & 8) # inverse
                    bg = (attr >> 9) & 0x1ff
                    fg = attr & 0x1ff
                    if (flags & 1) and fg < 8 then fg += 8

                # if (flags & 16) # invisible
                    # out += 'visibility:hidden;'
    
                if bg != 256
                    if not colors[bg]
                        log "bgcolor #{bg}"
                    out += "background-color:#{colors[bg]};"
    
                if not colors[fg]
                    log "fgcolor #{fg}"
                out += "color:#{colors[fg]};\">"
    
            switch (ch) 
                when '&' then out += '&amp;'
                when '<' then out += '&lt;'
                when '>' then out += '&gt;'
                else
                    if ch <= ' '
                        out += ' ' # '&nbsp;'
                    else 
                        out += ch
                    
            lastAttr = attr
    
        out += '</span>'
    
        out            

module.exports = Render