###
000000000   0000000   0000000     0000000
   000     000   000  000   000  000     
   000     000000000  0000000    0000000 
   000     000   000  000   000       000
   000     000   000  0000000    0000000 
###

{ post, stopEvent, empty, valid, slash, popup, elem, drag, kpos, $, _ } = require 'kxk'

Tab = require './tab'

class Tabs
    
    @: (titlebar) ->
        
        @tabs = []
        @div = elem class:'tabs'
        
        titlebar.insertBefore @div, $ '.minimize'
        
        @div.addEventListener 'click'       @onClick
        @div.addEventListener 'contextmenu' @onContextMenu
        
        post.on 'stash'   @stash
        post.on 'restore' @restore
        
        @drag = new drag
            target:  @div
            onStart: @onDragStart
            onMove:  @onDragMove
            onStop:  @onDragStop

    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000  
    # 000   000  000       000          000     000   000  000   000  000       
    # 0000000    0000000   0000000      000     000   000  0000000    0000000   
    # 000   000  000            000     000     000   000  000   000  000       
    # 000   000  00000000  0000000      000      0000000   000   000  00000000  

    stash: => 

        paths = ( tab.text for tab in @tabs )
        
        window.stash.set 'tabs', 
            paths:  paths
            active: Math.min @activeTab()?.index(), paths.length-1
    
    restore: =>
        
        active = window.stash.get 'tabs:active' 0
        paths  = window.stash.get 'tabs:paths'
        
        if empty paths # happens when first window opens
            # window.term.addTab '~'
            window.term.addTab slash.tilde process.cwd()
            return
        
        while paths.length
            window.term.addTab paths.shift()
        
        @tabs[active]?.activate()
            
    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onClick: (event) =>
        
        if tab = @tab event.target
            if event.target.classList.contains 'dot'
                @closeTab tab
            else
                tab.activate()
        true

    # 0000000    00000000    0000000    0000000   
    # 000   000  000   000  000   000  000        
    # 000   000  0000000    000000000  000  0000  
    # 000   000  000   000  000   000  000   000  
    # 0000000    000   000  000   000   0000000   
    
    onDragStart: (d, e) => 
        
        # if e.button == 2
            # @closeTab @tab e.target
            # return 'skip'
            
        @dragTab = @tab e.target
        
        return 'skip' if not @dragTab
        return 'skip' if event.button != 1
        
        @dragDiv = @dragTab.div.cloneNode true
        @dragTab.div.style.opacity = '0'
        br = @dragTab.div.getBoundingClientRect()
        @dragDiv.style.position = 'absolute'
        @dragDiv.style.top  = "#{br.top}px"
        @dragDiv.style.left = "#{br.left}px"
        @dragDiv.style.width = "#{br.width-12}px"
        @dragDiv.style.height = "#{br.height-3}px"
        @dragDiv.style.flex = 'unset'
        @dragDiv.style.pointerEvents = 'none'
        document.body.appendChild @dragDiv

    onDragMove: (d,e) =>
        
        @dragDiv.style.transform = "translateX(#{d.deltaSum.x}px)"
        if tab = @tabAtX d.pos.x
            if tab.index() != @dragTab.index()
                @swap tab, @dragTab
        
    onDragStop: (d,e) =>
        
        @dragTab.div.style.opacity = ''
        @dragDiv.remove()

    # 000000000   0000000   0000000    
    #    000     000   000  000   000  
    #    000     000000000  0000000    
    #    000     000   000  000   000  
    #    000     000   000  0000000    
    
    tab: (id) ->
        
        if _.isNumber  id then return @tabs[id]
        if _.isElement id then return _.find @tabs, (t) -> t.div.contains id
        if _.isString  id then return _.find @tabs, (t) -> t.info.text == id

    activeTab: -> _.find @tabs, (t) -> t.isActive()
    numTabs:   -> @tabs.length
    
    tabAtX: (x) -> 
        
        _.find @tabs, (t) -> 
            br = t.div.getBoundingClientRect()
            br.left <= x <= br.left + br.width
    
    #  0000000  000       0000000    0000000  00000000  
    # 000       000      000   000  000       000       
    # 000       000      000   000  0000000   0000000   
    # 000       000      000   000       000  000       
    #  0000000  0000000   0000000   0000000   00000000  
    
    closeTab: (tab = @activeTab()) ->
        
        return if not tab?
                   
        if @tabs.length > 1
            if tab == @activeTab()
                tab.nextOrPrev()?.activate()
            
        tab.close()
        
        _.pull @tabs, tab
        
        if empty @tabs # close the window when last tab was closed
            post.emit 'menuAction', 'Close' 
        
        @
  
    closeOtherTabs: -> 
        
        return if not @activeTab()
        keep = _.pullAt @tabs, @activeTab().index()
        while @numTabs()
            @tabs.pop().close()
        @tabs = keep
    
    closeTabs: =>
        
        while @numTabs()
            @tabs.pop().close()
        
    #  0000000   0000000    0000000          000000000   0000000   0000000    
    # 000   000  000   000  000   000           000     000   000  000   000  
    # 000000000  000   000  000   000           000     000000000  0000000    
    # 000   000  000   000  000   000           000     000   000  000   000  
    # 000   000  0000000    0000000             000     000   000  0000000    
    
    addTab: (text) ->
        
        tab = new Tab @
        if text
            tab.update text
        @tabs.push tab
        tab.activate()
        tab

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000  
    # 0000  000  000   000  000   000  000  000        000   000     000     000       
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000   
    # 000  0000  000   000     000     000  000   000  000   000     000     000       
    # 000   000  000   000      0      000   0000000   000   000     000     00000000  
    
    navigate: (key) ->
        
        index = @activeTab().index()
        index += switch key
            when 'left' then -1
            when 'right' then +1
        index = (@numTabs() + index) % @numTabs()
        @tabs[index].activate()

    swap: (ta, tb) ->
        
        return if not ta? or not tb?
        [ta, tb] = [tb, ta] if ta.index() > tb.index()
        @tabs[ta.index()]   = tb
        @tabs[tb.index()+1] = ta
        @div.insertBefore tb.div, ta.div
    
    move: (key) ->
        
        tab = @activeTab()
        switch key
            when 'left'  then @swap tab, tab.prev() 
            when 'right' then @swap tab, tab.next()
        
    #  0000000   0000000   000   000  000000000  00000000  000   000  000000000  
    # 000       000   000  0000  000     000     000        000 000      000     
    # 000       000   000  000 0 000     000     0000000     00000       000     
    # 000       000   000  000  0000     000     000        000 000      000     
    #  0000000   0000000   000   000     000     00000000  000   000     000     
    
    onContextMenu: (event) => stopEvent event, @showContextMenu pos event
              
    showContextMenu: (absPos) =>
        
        if tab = @tab event.target
            tab.activate()
            
        if not absPos?
            absPos = kpos @view.getBoundingClientRect().left, @view.getBoundingClientRect().top
        
        opt = items: [ 
            text:   'Close Other Tabs'
            combo:  'ctrl+shift+w' 
        # ,
            # text:   'New Window'
            # combo:  'ctrl+shift+n' 
        ]
        
        opt.x = absPos.x
        opt.y = absPos.y
        popup.menu opt        
            
module.exports = Tabs
