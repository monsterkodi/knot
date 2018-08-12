###
000   000  000   000  00000000  00000000  000    
000 0 000  000   000  000       000       000    
000000000  000000000  0000000   0000000   000    
000   000  000   000  000       000       000    
00     00  000   000  00000000  00000000  0000000
###

{ stopEvent, keyinfo, clamp, log } = require 'kxk'

log = console.log

class Wheel

    constructor: (@scroll) ->
        
        @last  = 0
        @accum = 0
        document.addEventListener 'wheel', @onWheel
        
    onWheel: (event) =>
        
        { mod, key, combo } = keyinfo.forEvent event
    
        if mod == 'ctrl'
            return

        scrollFactor = ->
            f  = 1
            f *= 1 + 1 * event.shiftKey
            f *= 1 + 3 * event.ctrlKey
            f *= 1 + 7 * event.altKey
        
        delta = event.deltaY * scrollFactor()
        
        if event.target.className != 'minimap'
            window.term.scroll.by 1 * window.term.scroll.lineHeight * delta/100
            @accum = 0
        else
            if (@accum < 0 and delta > 0) or (@accum > 0 and delta < 0)
                @accum = 0
                return
                
            @accum += delta
            window.requestAnimationFrame @onAnimation
            
        stopEvent event
        
    onAnimation: (now) =>
        
        @accum = clamp -10000, 10000, @accum * 0.999
            
        window.term.scroll.by @accum/100        

        if Math.abs(@accum) < 2
            @accum = 0
        else
            window.requestAnimationFrame @onAnimation
            
module.exports = Wheel
