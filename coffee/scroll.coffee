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

        post.on 'combo',    @onCombo
        post.on 'scrollBy', @onScrollBy
                
        @resetSize()
        @resetLines()
        
        # @wheel = new Wheel @
        
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
        
    data: ->
        
        lineHeight: @lineHeight 
        viewHeight: @viewHeight 
        fullHeight: @fullHeight 
        scrollMax:  @scrollMax  
        fullLines:  @fullLines  
        viewLines:  @viewLines  
        scroll:     @scroll     
        offsetTop:  @offsetTop  
        numLines:   @numLines   
        top:        @top        
        bot:        @bot        
        
    restore: (data) ->
        
        if not data
            @resetSize()
            @resetLines()
            return
            
        @lineHeight = data.lineHeight
        @viewHeight = data.viewHeight
        @fullHeight = data.fullHeight
        @scrollMax  = data.scrollMax
        @fullLines  = data.fullLines
        @viewLines  = data.viewLines
        @scroll     = data.scroll
        @offsetTop  = data.offsetTop
        @numLines   = data.numLines
        @top        = data.top
        @bot        = data.bot
        post.emit 'scroll', @scroll, @
        
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
    
    onScrollBy: (delta) => # emitted by wheel
    
        @by delta
            
    # 0000000    000   000
    # 000   000   000 000 
    # 0000000      00000  
    # 000   000     000   
    # 0000000       000   
        
    to: (p) => @by p-@scroll
    
    by: (delta, x) =>
        
        return if @viewLines < 0
                
        oldTop = @top
        oldBot = @bot
        
        scroll = @scroll
        delta  = 0 if Number.isNaN delta
        
        @scroll = parseInt clamp 0, @scrollMax, @scroll+delta
        
        top  = parseInt @scroll / @lineHeight
        
        @top = Math.max 0, top
        @bot = Math.min @top+@viewLines-1
        
        offset = @scroll - @top * @lineHeight
        
        if offset != @offsetTop or scroll != @scroll
                        
            @offsetTop = offset
            @updateOffset()
            log "emit scroll #{@scroll}"
            post.emit 'scroll', @scroll, @      
            
    #  0000000   00000000  00000000   0000000  00000000  000000000  
    # 000   000  000       000       000       000          000     
    # 000   000  000000    000000    0000000   0000000      000     
    # 000   000  000       000            000  000          000     
    #  0000000   000       000       0000000   00000000     000     
    
    updateOffset: ->
        
    toBottom: ->
        log "toBottom #{@scroll} #{@scrollMax}"
        @to @scrollMax
        log "toBottom emit #{@scroll}"
        post.emit 'scroll', @scroll, @
        
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
