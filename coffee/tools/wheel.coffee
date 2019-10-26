###
000   000  000   000  00000000  00000000  000    
000 0 000  000   000  000       000       000    
000000000  000000000  0000000   0000000   000    
000   000  000   000  000       000       000    
00     00  000   000  00000000  00000000  0000000
###

{ keyinfo, klog, post, absMax, clamp } = require 'kxk'

class Wheel

    @: (@scroll) ->
        
        @accum = 0
        
        document.addEventListener 'mousedown' @onMouseDown, true
        
    onWheel: (event) =>
        
        { mod, key, combo } = keyinfo.forEvent event
    
        scrollFactor = ->
            f  = 1
            f *= 1 + 1 * event.shiftKey
            f *= 1 + 3 * event.ctrlKey
            f *= 1 + 7 * event.altKey
        
        delta = event.deltaY * scrollFactor()
        
        if (@accum < 0 and delta > 0) or (@accum > 0 and delta < 0)
            @accum = 0
        else
            post.emit 'scrollBy' Math.sign(delta) * @scroll.lineHeight
            if @accum == 0
                window.requestAnimationFrame @onAnimation
            @accum += delta
      
    onMouseDown: (event) =>
        
        @accum = 0
            
    onAnimation: (now) =>
        
        
        @accum = clamp -100000, 100000, @accum * 0.991
            
        # delta = @accum/100
        delta = @accum/5
        post.emit 'scrollBy' delta 

        if Math.abs(@accum) < 10 or not (0 < @scroll.scroll < @scroll.scrollMax)
            @accum = 0
        else
            window.requestAnimationFrame @onAnimation
            
module.exports = Wheel
