###
000   000  000   000  00000000  00000000  000    
000 0 000  000   000  000       000       000    
000000000  000000000  0000000   0000000   000    
000   000  000   000  000       000       000    
00     00  000   000  00000000  00000000  0000000
###

{ post, keyinfo, clamp } = require 'kxk'

class Wheel

    @: ->
        
        @accum = 0
        
        document.addEventListener 'mousedown' @onMouseDown, true
        post.on 'stopWheel' => @accum = 0
        
    onWheel: (event) =>
                
        { mod, key, combo } = keyinfo.forEvent event
    
        scrollFactor = ->
            f  = 1
            f *= 1 + 3 * event.shiftKey
            f *= 1 + 7 * event.altKey
        
        delta = event.deltaY * scrollFactor()
        
        if (@accum < 0 and delta > 0) or (@accum > 0 and delta < 0)
            @accum = 0
        else
            if @accum == 0
                window.requestAnimationFrame @onAnimation
            @accum += delta
            post.emit 'scrollBy' @accum/20
      
    onMouseDown: (event) =>
        
        @accum = 0
            
    onAnimation: (now) =>
        
        @accum = clamp -100000, 100000, @accum * 0.99
            
        delta = @accum/20
        post.emit 'scrollBy' delta 

        if Math.abs(@accum) < 10 
            @accum = 0
        else
            window.requestAnimationFrame @onAnimation
            
module.exports = Wheel
