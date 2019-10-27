###
000000000   0000000   0000000  
   000     000   000  000   000
   000     000000000  0000000  
   000     000   000  000   000
   000     000   000  0000000  
###

{ slash, post, klog, kpos, elem } = require 'kxk'

class Tab
    
    @: (@tabs) ->
        
        @div  = elem class:'tab' 
        @update slash.tilde process.cwd()
        @tabs.div.appendChild @div

        @div.addEventListener 'mousedown' @onMouseDown
        @div.addEventListener 'mouseup'   @onMouseUp

    # 00     00   0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000       000       
    # 000000000  000   000  000   000  0000000   0000000   
    # 000 0 000  000   000  000   000       000  000       
    # 000   000   0000000    0000000   0000000   00000000  
    
    onMouseDown: (event) =>
        
        @downPos = kpos window.win.getBounds()
            
    onMouseUp: (event) =>
        
        return if not @downPos
        
        upPos = kpos window.win.getBounds()
        
        if upPos.to(@downPos).length() > 0
            delete @downPos
            return
        
        if event.target.id
            post.emit 'cd' event.target.id
        delete @downPos
        
    # 000   000  00000000   0000000     0000000   000000000  00000000  
    # 000   000  000   000  000   000  000   000     000     000       
    # 000   000  00000000   000   000  000000000     000     0000000   
    # 000   000  000        000   000  000   000     000     000       
    #  0000000   000        0000000    000   000     000     00000000  
    
    update: (@text) ->
            
        @div.innerHTML = ''
        @div.appendChild elem 'span' class:'dot' text:'●'
        
        if @text in ['/' '']
            @div.appendChild elem 'span' class:'path top' text:'/'
        else            
            split = slash.split @text
            for i in [0...split.length-1]
                s = split[i]
                @div.appendChild elem 'span' class:'path' text:s, id:split[0..i].join '/'
                @div.appendChild elem 'span' class:'path sep' text:'/'
            @div.appendChild elem 'span' class:'path top' text:split[-1], id:@text
        @

    index: -> @tabs.tabs.indexOf @
    prev:  -> @tabs.tab @index()-1 if @index() > 0
    next:  -> @tabs.tab @index()+1 if @index() < @tabs.numTabs()-1
    nextOrPrev: -> @next() ? @prev()
    
    close: -> @div.remove()
    
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: ->
        
        post.emit 'tab' @
        @setActive()

    isActive: -> @div.classList.contains 'active'
    
    setActive: -> 
        
        if not @isActive()
            @tabs.activeTab()?.clearActive()
            @div.classList.add 'active'
            
    clearActive: -> @div.classList.remove 'active'
        
module.exports = Tab
