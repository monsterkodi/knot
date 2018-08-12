###
 0000000   000000000  000000000  00000000 
000   000     000        000     000   000
000000000     000        000     0000000  
000   000     000        000     000   000
000   000     000        000     000   000
###

{ log, _ } = require 'kxk'
        
defAttr = (257 << 9) | 256

class Attr
    
    @set: (params, curAttr) ->
        
        if params.length == 1 and params[0] == 0
            return defAttr
    
        flags = curAttr >> 18
        fg    = (curAttr >> 9) & 0x1ff
        bg    = curAttr & 0x1ff
    
        i = 0
        while i < params.length
            p = params[i]
            # log 'p:', p
            switch p
                when 0 # default
                    flags = defAttr >> 18
                    fg = (defAttr >> 9) & 0x1ff
                    bg = defAttr & 0x1ff
                when 1 # bold text
                    flags |= 1
                when 4 # underlined text
                    flags |= 2
                when 5 # blink
                    flags |= 4
                when 7 # inverse and positive
                    # test with: echo -e '\e[31m\e[42mhello\e[7mworld\e[27mhi\e[m'
                    flags |= 8
                when 8 # invisible
                    flags |= 16
                when 22 # not bold
                    flags &= ~1
                when 24 # not underlined
                    flags &= ~2
                when 25 # not blink
                    flags &= ~4
                when 27 # not inverse
                    flags &= ~8
                when 28 # not invisible
                    flags &= ~16
                when 39 # reset fg
                    fg = (defAttr >> 9) & 0x1ff
                when 49# reset bg
                    bg = defAttr & 0x1ff
                when 38 # fg color 256
                    if params[i + 1] == 2
                        i += 2
                        fg = matchColor(params[i] & 0xff, params[i + 1] & 0xff, params[i + 2] & 0xff)
                        if fg == -1 then fg = 0x1ff
                        i += 2
                    if params[i + 1] == 5
                        i += 2
                        p = params[i] & 0xff
                        fg = p
                when 48 # bg color 256
                    if params[i + 1] == 2
                        i += 2
                        bg = matchColor(params[i] & 0xff, params[i + 1] & 0xff, params[i + 2] & 0xff)
                        if bg == -1 then bg = 0x1ff
                        i += 2
                    if params[i + 1] == 5
                        i += 2
                        p = params[i] & 0xff
                        bg = p

                # when 100 # reset fg/bg
                    # fg = (defAttr >> 9) & 0x1ff
                    # bg = defAttr & 0x1ff
                    
                else
                    if p >= 30 and p <= 37
                        fg = p - 30
                    else if p >= 40 and p <= 47
                        bg = p - 40
                    else if p >= 90 and p <= 97
                        fg = p - 90 + 8
                        # flags |= 2 if p == 96
                    else if p >= 100 and p <= 107
                        bg = p - 100 + 8
                        
            i += 1
    
        return (flags << 18) | (fg << 9) | bg

module.exports = Attr
