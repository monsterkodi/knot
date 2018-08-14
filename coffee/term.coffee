###
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000  
###

{ post, setStyle, prefs, empty, elem, log, $ } = require 'kxk'

{ Terminal } = require 'term.js'
pty          = require 'node-pty'
Scroll       = require './scroll'
ScrollBar    = require './scrollbar'
Minimap      = require './minimap'
KeyHandler   = require './keyhandler'
Render       = require './render'
Lines        = require './lines'
Cursor       = require './cursor'
Buffer       = require './buffer'

class Term

    constructor: ->
        
        @num   = 0   
        @main  =$ '#main' 
        
        @rows = 200
        @cols = 1000
        
        @size =
            charWidth:  12
            lineHeight: 20
        
        window.tabs.addTab '~'
        
        @keyHandler = new KeyHandler @
        @cursor     = new Cursor @
        @lines      = new Lines @
                    
        fromHex = (css) ->
            css:  css
            rgba: parseInt(css.slice(1), 16) << 8 | 0xFF
        
        @scroll     = new Scroll    $ '#terminal'
        @scrollBar  = new ScrollBar @scroll
        @minimap    = new Minimap   @
        
        @main.addEventListener 'click', @onClick
        
        post.on 'fontSize', @onFontSize
        post.on 'tab',      @onTab
        @onFontSize prefs.get 'fontSize'

        document.addEventListener 'selectionchange', @onSelectionChange
        window.addEventListener 'resize', @onResize
        
        document.defaultView.addEventListener 'paste', @onPaste
        
        @spawnShell()
        
    # 00000000    0000000    0000000  000000000  00000000  
    # 000   000  000   000  000          000     000       
    # 00000000   000000000  0000000      000     0000000   
    # 000        000   000       000     000     000       
    # 000        000   000  0000000      000     00000000  
    
    onPaste: (event) =>

        if event.clipboardData
            @shell.write event.clipboardData.getData 'text/plain'
        
    # 000000000   0000000   0000000    
    #    000     000   000  000   000  
    #    000     000000000  0000000    
    #    000     000   000  000   000  
    #    000     000   000  0000000    
            
    onTab: (tab) => 
        
        @storeTab()
        
        @shell        = tab.shell
        @lines.buffer = tab.buffer
        @lines.refresh()
        @scroll.restore tab.scroll
        @minimap.drawLines()
        @updateCursor()
    
    addTab: ->
        
        tabs = window.tabs
        
        @storeTab()
        
        tab = tabs.addTab ''
        @scroll.reset()
        @lines.reset()
        @spawnShell()

    storeTab: ->
        
        tabs.activeTab().shell  = @shell
        tabs.activeTab().scroll = @scroll.data()
        tabs.activeTab().buffer = @lines.buffer
        
    #  0000000  000   000  00000000  000      000      
    # 000       000   000  000       000      000      
    # 0000000   000000000  0000000   000      000      
    #      000  000   000  000       000      000      
    # 0000000   000   000  00000000  0000000  0000000  
    
    spawnShell: =>
        
        process.env.TERM = 'xterm-color'
        process.env.LANG = 'en_US.UTF-8'

        log 'spawnShell', process.env.TERM
        
        # @shell = pty.spawn 'C:\\msys64\\usr\\bin\\bash.exe', ['-i'],
        @shell = pty.spawn 'C:\\msys64\\usr\\bin\\fish.exe', [],
            name: process.env.TERM
            cwd:  process.env.HOME
            env:  process.env
            cols: @cols
            rows: @rows

        onShell = (shell) => (data) =>@onShellData shell, data
            
        @shell.on 'data',  onShell @shell
        @shell.on 'error', @onShellError

    restartShell: =>

        @shell.destroy()
        @spawnShell()
        
    onShellError: (err) => log 'error'
        
    onShellData: (shell, data) =>

        data = data.replace /⏎\x1b\[0m\x1b\[0K(\x1b\[\?25l)?\r\n/g, '' # hack around fish hack
        
        if shell != @shell
            for tab in tabs.tabs
                if tab.shell == shell
                    # log 'tabbed shell data!', data
                    @lines.writeBufferData tab.buffer, data, tab
            return
            
        @lines.writeData data
        
        @minimap.drawLine @lines.buffer.lines.length-1
        
        @scroll.setNumLines @lines.buffer.lines.length
        @scroll.by @size.lineHeight * @lines.buffer.lines.length
                
    updateCursor: ->

        @cursor.setPos @lines.buffer.x, @lines.buffer.y - @lines.buffer.top
        
    #  0000000  00000000  000      00000000   0000000  000000000  
    # 000       000       000      000       000          000     
    # 0000000   0000000   000      0000000   000          000     
    #      000  000       000      000       000          000     
    # 0000000   00000000  0000000  00000000   0000000     000     
    
    onSelectionChange: =>

        sel = window.getSelection()
        @selectionText = ''
        if sel.rangeCount > 0
            texts = []
            range = sel.getRangeAt 0
            contents = range.cloneContents()
            for node in contents.children
                texts.push node.innerText
            @selectionText = texts.join '\n'
            
    # 00000000   00000000   0000000  000  0000000  00000000  
    # 000   000  000       000       000     000   000       
    # 0000000    0000000   0000000   000    000    0000000   
    # 000   000  000            000  000   000     000       
    # 000   000  00000000  0000000   000  0000000  00000000  
    
    onResize: =>
        
        @scroll.setViewHeight @main.clientHeight
        
        availableHeight = @main.clientHeight
        availableWidth  = @main.clientWidth - 130

        @calcSize()
        @scroll.setViewHeight availableHeight
        
        @cols = Math.max 1, Math.floor availableWidth / @size.charWidth
        @rows = Math.max 1, Math.floor availableHeight / @size.lineHeight
        
        @rows = @scroll.fullLines
        log "resize cols:#{@cols} rows:#{@rows} #{@scroll.fullLines}"
        
        @lines.buffer?.resize @cols, @rows
        @shell?.resize @cols, 1
        @shell?.resize @cols, @rows
        
    #  0000000   0000000   000       0000000  
    # 000       000   000  000      000       
    # 000       000000000  000      000       
    # 000       000   000  000      000       
    #  0000000  000   000  0000000   0000000  
    
    calcSize: =>
        
        terminal =$ '#terminal'
        
        return if not terminal
        
        defAttr = (257 << 9) | 256
        html = Render.line [[256, 'x'], [0, 'y']], new Buffer @
        
        if empty terminal.children
            line = elem class:'line', html:html
            terminal.appendChild line
        else
            line = terminal.firstChild
            old = line.innerHTML
            line.innerHTML = html
        
        if not line.children[0]
            log 'line????', line.innerHTML, empty terminal.children
            return
            
        tr = terminal.getBoundingClientRect()
        br = line.children[0].getBoundingClientRect()
        
        if old
            terminal.firstChild.innerHTML = old
            
        @size.lineHeight = br.height
        @size.charWidth  = br.width
        @size.offsetTop  = br.top - tr.top
        @size.offsetLeft = br.left - tr.left
        
        @scroll.setLineHeight @size.lineHeight
        
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: -> 
        @shell.write 'c\n\x08'
            
    # 00000000   0000000   000   000  000000000       0000000  000  0000000  00000000  
    # 000       000   000  0000  000     000         000       000     000   000       
    # 000000    000   000  000 0 000     000         0000000   000    000    0000000   
    # 000       000   000  000  0000     000              000  000   000     000       
    # 000        0000000   000   000     000         0000000   000  0000000  00000000  

    onFontSize: (size) =>
        
        return if not @main?
        return if size <= 0
        
        setStyle "#terminal", 'fontSize', "#{size}px"
        @onResize()
        setStyle "#cursor", 'width', "#{@size.charWidth-1}px"
        setStyle "#cursor", 'height', "#{@size.lineHeight-1}px"
        @updateCursor()

    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onClick: (event) ->
        
module.exports = Term
