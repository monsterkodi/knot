###
 0000000   0000000  00000000    0000000   000      000      
000       000       000   000  000   000  000      000      
0000000   000       0000000    000   000  000      000      
     000  000       000   000  000   000  000      000      
0000000    0000000  000   000   0000000   0000000  0000000  
###

{ post, clamp, str } = require 'kxk'

log   = console.log
Wheel = require './wheel'

class Scroll

    constructor: (@view) ->

        post.on 'combo', @onCombo
                
        @resetSize()
        @resetLines()
        
        @wheel = new Wheel @
        
    resetSize: ->
        
        @lineHeight   =  0 # height of single line (pixels)
        @viewHeight   = -1 # height of scroll view (pixels)
        @fullLines    = -1 # number of full lines fitting in view (excluding partials)
        @viewLines    = -1 # number of lines fitting in view (including partials)
        @scrollMax    = -1 # maximum scroll offset (pixels)
        
    resetLines: ->
        
        @top          = -1 # index of first visible line in view
        @bot          = -1 # index of last  visible line in view
        @fullHeight   =  0 # total height of all lines (pixels)
        @scroll       =  0 # current scroll value from document start (pixels)
        @offsetTop    =  0 # height of view above first visible line (pixels)
        @numLines     =  0 # total number of lines in buffer
        
    # 00000000   00000000   0000000  00000000  000000000
    # 000   000  000       000       000          000   
    # 0000000    0000000   0000000   0000000      000   
    # 000   000  000            000  000          000   
    # 000   000  00000000  0000000   00000000     000   
    
    reset: =>
        
        @resetLines()
        
        post.emit 'clearLines'
        
        @updateOffset()
        
    # 000  000   000  00000000   0000000 
    # 000  0000  000  000       000   000
    # 000  000 0 000  000000    000   000
    # 000  000  0000  000       000   000
    # 000  000   000  000        0000000 
    
    info: ->
        
        topbot: "#{@top} .. #{@bot} = #{@bot-@top} / #{@numLines} lines"
        scroll: "#{@scroll} offsetTop #{@offsetTop} viewHeight #{@viewHeight} lineHeight #{@lineHeight} scrollMax #{@scrollMax} fullLines #{@fullLines} viewLines #{@viewLines}"
        
    #  0000000   0000000   000       0000000  
    # 000       000   000  000      000       
    # 000       000000000  000      000       
    # 000       000   000  000      000       
    #  0000000  000   000  0000000   0000000  
    
    calc: ->
        
        if @viewHeight <= 0
            return
            
        @scrollMax = Math.max(0,@fullHeight - @viewHeight)   # maximum scroll offset (pixels)
        @fullLines = Math.floor(@viewHeight / @lineHeight)   # number of lines in view (excluding partials)
        @viewLines = Math.ceil(@viewHeight / @lineHeight)+1  # number of lines in view (including partials)
        
        @by 0
        post.emit 'scroll', @scroll, @
        
    #  0000000   0000000   00     00  0000000     0000000   
    # 000       000   000  000   000  000   000  000   000  
    # 000       000   000  000000000  0000000    000   000  
    # 000       000   000  000 0 000  000   000  000   000  
    #  0000000   0000000   000   000  0000000     0000000   
    
    onCombo: (combo) =>
        
        switch combo
            when 'page up'   then @by -@lineHeight*@viewLines
            when 'page down' then @by @lineHeight*@viewLines
            when 'up'        then @by -@lineHeight
            when 'down'      then @by @lineHeight
            when 'home'      then @to 0
            when 'end'       then @to @scrollMax
    
    # 0000000    000   000
    # 000   000   000 000 
    # 0000000      00000  
    # 000   000     000   
    # 0000000       000   
        
    to: (p) => @by p-@scroll
    
    by: (delta, x) =>
        
        return if @viewLines < 0
        
        @view.scrollLeft += x if x
        
        oldTop = @top
        oldBot = @bot
        
        scroll = @scroll
        delta  = 0 if Number.isNaN delta
        
        @scroll = parseInt clamp 0, @scrollMax, @scroll+delta
        
        top = parseInt @scroll / @lineHeight
        
        @top = Math.max 0, top
        @bot = Math.min @top+@viewLines-1
        
        # log 'oldTop', oldTop, oldBot, @top, @bot
        
        if oldTop != @top or oldBot != @bot
        
            if (@top > oldBot) or (@bot < oldTop) or (oldBot < oldTop) 
                # new range outside, start from scratch
                num = @bot - @top + 1
                
                if num > 0 
                    post.emit 'showLines', @top, @bot, num
    
            else   
                
                num = @top - oldTop
                
                if 0 < Math.abs num
                    post.emit 'shiftLines', @top, @bot, num
                    
        if oldBot > -1 and oldTop > -1 and oldBot - oldTop != @bot - @top
            # log 'changeLines'
            post.emit 'changeLines', oldBot-oldTop, @bot-@top

        offset = @scroll - @top * @lineHeight
        
        if offset != @offsetTop or scroll != @scroll
                        
            @offsetTop = offset
            @updateOffset()
            post.emit 'scroll', @scroll, @                       
            
    #  0000000   00000000  00000000   0000000  00000000  000000000  
    # 000   000  000       000       000       000          000     
    # 000   000  000000    000000    0000000   0000000      000     
    # 000   000  000       000            000  000          000     
    #  0000000   000       000       0000000   00000000     000     
    
    updateOffset: ->
        
        log @offsetTop, @scroll, @top, @bot
        window.term?.lines.scrollTop @top
        @view.style.transform = "translate3d(0,-#{@offsetTop}px, 0)"
                            
    # 000   000  000   000  00     00  000      000  000   000  00000000   0000000
    # 0000  000  000   000  000   000  000      000  0000  000  000       000     
    # 000 0 000  000   000  000000000  000      000  000 0 000  0000000   0000000 
    # 000  0000  000   000  000 0 000  000      000  000  0000  000            000
    # 000   000   0000000   000   000  0000000  000  000   000  00000000  0000000 
        
    setNumLines: (n) =>
        
        if @numLines != n
            @fullHeight = n * @lineHeight
            if n
                @numLines = n
                @calc()
            else
                @reset() 

    # 000   000  000  00000000  000   000  000   000  00000000  000   0000000   000   000  000000000
    # 000   000  000  000       000 0 000  000   000  000       000  000        000   000     000   
    #  000 000   000  0000000   000000000  000000000  0000000   000  000  0000  000000000     000   
    #    000     000  000       000   000  000   000  000       000  000   000  000   000     000   
    #     0      000  00000000  00     00  000   000  00000000  000   0000000   000   000     000   

    setViewHeight: (h) =>
        
        if @viewHeight != h
            
            @viewHeight = h
            @calc()
                        
    # 000      000  000   000  00000000  000   000  00000000  000   0000000   000   000  000000000
    # 000      000  0000  000  000       000   000  000       000  000        000   000     000   
    # 000      000  000 0 000  0000000   000000000  0000000   000  000  0000  000000000     000   
    # 000      000  000  0000  000       000   000  000       000  000   000  000   000     000   
    # 0000000  000  000   000  00000000  000   000  00000000  000   0000000   000   000     000   

    setLineHeight: (h) =>
            
        if @lineHeight != h
            @lineHeight = h
            @fullHeight = @numLines * @lineHeight            
            @calc()
            post.emit 'clearLines'
            post.emit 'showLines', @top, @bot, @bot - @top + 1
                                    
module.exports = Scroll
