###
000      000  000   000  00000000   0000000
000      000  0000  000  000       000     
000      000  000 0 000  0000000   0000000 
000      000  000  0000  000            000
0000000  000  000   000  00000000  0000000 
###

{ clamp, elem, str, log, $ } = require 'kxk'

parse  = require './parse'
Buffer = require './buffer'
Render = require './render'

class Lines
    
    constructor: (@term) ->
        
        @reset()
                
    # 000   000  00000000   000  000000000  00000000  
    # 000 0 000  000   000  000     000     000       
    # 000000000  0000000    000     000     0000000   
    # 000   000  000   000  000     000     000       
    # 00     00  000   000  000     000     00000000  
    
    write: (data) =>
        
        start = @buffer.y
        
        parse data, @buffer
                
        if @buffer.lines.length > @buffer.cache.length
            while @buffer.lines.length > @buffer.cache.length
                @buffer.cache.push diss:@dissForLine @buffer.lines[@buffer.cache.length]
                @buffer.changed.delete @buffer.cache.length-1
        else
            @buffer.cache[@buffer.lines.length-1] = diss:@dissForLine @buffer.lines[@buffer.lines.length-1]
            @buffer.changed.delete @buffer.lines.length-1
            
        for lineIndex in Array.from @buffer.changed.values()
            @buffer.cache[lineIndex] = diss:@dissForLine @buffer.lines[lineIndex]
            @term.minimap.drawLines lineIndex, lineIndex
        delete @buffer.changed
        
        if @buffer.title
            window.tabs.activeTab()?.update @buffer.title
            delete @buffer.title
        
        @buffer.top = Math.max 0, @buffer.lines.length - @buffer.rows
        @refresh()
       
    # 0000000    000   0000000   0000000  
    # 000   000  000  000       000       
    # 000   000  000  0000000   0000000   
    # 000   000  000       000       000  
    # 0000000    000  0000000   0000000   
    
    dissForLine: (line) -> 
    
        diss = []
        
        numCols = Math.min 130, line.length
        
        if numCols == 0
            return diss
            
        for i in [0...numCols]
            
            attr = line[i][0]
            ch   = line[i][1]
            if ch == ' '
                color = attr & 0x1ff
            else
                color = (attr >> 9) & 0x1ff
                
            dss =
                start:  i
                length: 1
                color:  color
                
            diss.push dss
        
        diss
        
    #  0000000   0000000  00000000    0000000   000      000      
    # 000       000       000   000  000   000  000      000      
    # 0000000   000       0000000    000   000  000      000      
    #      000  000       000   000  000   000  000      000      
    # 0000000    0000000  000   000   0000000   0000000  0000000  
    
    scrollTop: (top) ->
        
        @buffer.top = top
        @refresh()
        
    # 00000000   00000000  00000000  00000000   00000000   0000000  000   000  
    # 000   000  000       000       000   000  000       000       000   000  
    # 0000000    0000000   000000    0000000    0000000   0000000   000000000  
    # 000   000  000       000       000   000  000            000  000   000  
    # 000   000  00000000  000       000   000  00000000  0000000   000   000  
    
    refresh: =>
            
        terminal =$ '#terminal'
        terminal.innerHTML = ''
        
        @buffer.top = clamp 0, Math.max(0, @buffer.lines.length-@buffer.rows), @buffer.top
        bot = clamp 0, @buffer.lines.length-1, @buffer.top + @buffer.rows
        for index in [@buffer.top..bot]
            html = Render.line @buffer.lines[index], @buffer
            terminal.appendChild elem class:'line', html:html
            
        @term.updateCursor()
        
    # 00000000   00000000   0000000  00000000  000000000  
    # 000   000  000       000       000          000     
    # 0000000    0000000   0000000   0000000      000     
    # 000   000  000            000  000          000     
    # 000   000  00000000  0000000   00000000     000     
    
    reset: ->
        
        @buffer = new Buffer @term
        
module.exports = Lines
