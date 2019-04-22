###
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000  
###

{ post, keyinfo, stopEvent, setStyle, slash, empty, elem, os, str, log, $ } = require 'kxk'

{ Terminal } = require 'xterm'
pty          = require 'node-pty'
Scroll       = require './scroll'
ScrollBar    = require './scrollbar'
Minimap      = require './minimap'
KeyHandler   = require './keyhandler'

class Term

    constructor: ->
        
        @term = new Terminal enableBold: true
            
        @term.attachCustomKeyEventHandler (event) => 

            info = keyinfo.forEvent event
            info.event = event
            
            if (event.getModifierState('Control') or event.getModifierState('Meta')) and event.key.toLowerCase() == 'v' 
                event.preventDefault()
                return false

            if event.getModifierState('Meta') and event.key.startsWith('Arrow') 
                return false

            post.emit 'combo', info.combo, info
            true
            
        @term.open $ '#terminal'
        
        @term.setOption 'fontFamily', '"Meslo LG S", "Bitstream Vera Sans Mono", "Menlo", "Cousine", "DejaVu Sans Mono", "Andale Mono", "monospace-fallback", monospace'
        @term.setOption 'scrollback', 100000
        @term.setOption 'cursorBlink', true
        @term.setOption 'fontSize', 18

        @term.on 'scroll', (top) => 
            @scroll.to Math.round top*@size.lineHeight
            
        @term.on 'refresh', (info) => 
            @minimap.drawLines info.start, info.end
        
        @main =$ '#main' 
        @num  = 0   
        @rows = 0
        @cols = 0
        @size =
            charWidth:  0
            lineHeight: 0
        
        @keyHandler = new KeyHandler @
                            
        @scroll     = new Scroll    $ '#terminal'
        @scrollBar  = new ScrollBar @scroll
        @minimap    = new Minimap   @
        
        @main.addEventListener 'click', @onClick
        
        post.on 'fontSize', @onFontSize
        post.on 'scroll',   @onScroll
        post.on 'tab',      @onTab
        @onFontSize window.stash.get 'fontSize'

        # document.addEventListener 'selectionchange', @onSelectionChange
        window.addEventListener 'resize', @onResize
        document.addEventListener 'paste', @onPaste
        
    # 00000000    0000000    0000000  000000000  00000000  
    # 000   000  000   000  000          000     000       
    # 00000000   000000000  0000000      000     0000000   
    # 000        000   000       000     000     000       
    # 000        000   000  0000000      000     00000000  
    
    currentSelection: ->
        
        selection = document.getSelection().toString()
        if selection.length
            return selection
        ''
    
    copy: ->
        if selection = @currentSelection()
            require('electron').clipboard.writeText selection
    
    paste: ->
        
        @shell.write require('electron').clipboard.readText()
    
    onPaste: (event) =>

        log 'paste'
        if event.clipboardData
            @shell.write event.clipboardData.getData 'text/plain'
            
        stopEvent event
        
    # 000000000   0000000   0000000    
    #    000     000   000  000   000  
    #    000     000000000  0000000    
    #    000     000   000  000   000  
    #    000     000   000  0000000    
            
    onTab: (tab) => 
        
        @storeTab()
        
        @shell        = tab.shell
        @scroll.restore tab.scroll
        @minimap.drawLines()
    
    addTab: (path) ->
        
        tabs = window.tabs
        
        @storeTab()
        
        tab = tabs.addTab path
        @scroll.reset()
        @spawnShell path

    storeTab: ->
        
        if tab = tabs.activeTab()
            tab.shell  = @shell
            tab.scroll = @scroll.data()
        
    tabForShell: (shell) ->
        
        for tab in tabs.tabs
            if tab.shell == shell
                return tab
                
        if shell = @shell
            return tabs.activeTab()
            
        null
        
    #  0000000  000   000  00000000  000      000      
    # 000       000   000  000       000      000      
    # 0000000   000000000  0000000   000      000      
    #      000  000   000  000       000      000      
    # 0000000   000   000  00000000  0000000  0000000  
    
    spawnShell: (path=process.env.HOME) =>
        
        process.env.TERM = 'xterm-256color'
        process.env.LANG = 'en_US.UTF-8'
        process.env.TERM_PROGRAM = 'knot'

        log 'spawnShell', process.env, path
        
        argl = []
        if slash.win()
            shell = 'C:\\msys64\\usr\\bin\\fish.exe'
            # shell = 'C:\\msys64\\usr\\bin\\bash.exe'; argl = ['-i']
        else
            if os.platform() == 'darwin'
                shell = '/usr/local/bin/fish'
            else
                shell = '/usr/bin/fish'
        
        @shell = pty.spawn shell, argl,
            name: process.env.TERM
            cwd:  slash.resolve path
            env:  process.env
            cols: @cols
            rows: @rows

        onShell = (shell) => (data) => @onShellData shell, data
        onExit  = (shell) => () => @onShellExit shell
            
        @shell.on 'data',  onShell @shell
        @shell.on 'exit',  onExit  @shell
        @shell.on 'error', @onShellError
        
        @onResize()
        @clear()
        @clear()
        
    restartShell: =>

        @shell.destroy()
        @spawnShell()
                
    onShellError: (err) => log 'error'
        
    onShellExit: (shell) => tabs.closeTab @tabForShell shell
    onShellData: (shell, data) =>

        # if shell != @shell
            # if tab = @tabForShell shell
                # @lines.writeBufferData tab.buffer, data, tab
            # return

        @term.write data
            
        # @minimap.drawLine @lines.buffer.lines.length-1
#         
        @scroll.setNumLines @bufferLength()
        # @scroll.by @size.lineHeight * @bufferLength()
              
    bufferLength: -> @term._core.buffer.lines.length
    bufferLines: -> @term._core.buffer.lines
        
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
         
        cme = $ '.xterm-char-measure-element'
        @size.lineHeight = cme.clientHeight
        @size.charWidth  = cme.clientWidth
                
        height = @main.clientHeight
        width  = @main.clientWidth - 140
        
        @cols = parseInt width/@size.charWidth
        @rows = parseInt height/@size.lineHeight
        
        @scroll.setLineHeight @size.lineHeight
        @scroll.setViewHeight height
        log @scroll.fullLines, @rows
        @term.resize @cols, @rows
        @shell?.resize @cols, @rows

        # for tab in tabs.tabs
            # if tab.shell != @shell
                # delete tab.scroll
                # tab.shell?.resize @cols, @rows
                # tab.buffer?.resize @cols, @rows
        
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: -> 
        
        @minimap.clearAll()
        
        @shell.write 'c\n\x08'
            
    # 00000000   0000000   000   000  000000000       0000000  000  0000000  00000000  
    # 000       000   000  0000  000     000         000       000     000   000       
    # 000000    000   000  000 0 000     000         0000000   000    000    0000000   
    # 000       000   000  000  0000     000              000  000   000     000       
    # 000        0000000   000   000     000         0000000   000  0000000  00000000  

    onFontSize: (size) =>
        
        # return if not @main?
        # return if size <= 0
#         
        # setStyle "#terminal", 'fontSize', "#{size}px"
        # @onResize()
        # setStyle "#cursor", 'width', "#{@size.charWidth-1}px"
        # setStyle "#cursor", 'height', "#{@size.lineHeight-1}px"
        # @updateCursor()

    #  0000000   0000000  00000000    0000000   000      000      
    # 000       000       000   000  000   000  000      000      
    # 0000000   000       0000000    000   000  000      000      
    #      000  000       000   000  000   000  000      000      
    # 0000000    0000000  000   000   0000000   0000000  0000000  
    
    onScroll: (scroll) =>
        
        top = Math.round(scroll / @size.lineHeight)
        
        scrollAmount = top - @term._core.buffer.ydisp
        # log "onScroll #{top} #{scrollAmount}"
        if scrollAmount != 0
            @term.scrollLines scrollAmount, true
        
    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onClick: (event) ->
        
module.exports = Term
