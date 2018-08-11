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
        @cache = []
        
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
        
        @cache      = []
        @scroll     = new Scroll    $ '#terminal'
        @scrollBar  = new ScrollBar @scroll
        @minimap    = new Minimap   @
        
        @main.addEventListener 'click', @onClick
        
        post.on 'fontSize', @onFontSize
        @onFontSize prefs.get 'fontSize'

        document.addEventListener 'selectionchange', @onSelectionChange
        window.addEventListener 'resize', @onResize
        
        @spawnShell()
                
    #  0000000  000   000  00000000  000      000      
    # 000       000   000  000       000      000      
    # 0000000   000000000  0000000   000      000      
    #      000  000   000  000       000      000      
    # 0000000   000   000  00000000  0000000  0000000  
    
    spawnShell: =>
        
        process.env.TERM = 'cygwin'
        
        env = Object.assign {}, process.env,
            LANG: 'en_US.UTF-8',
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor'
        
        @shell = pty.spawn 'C:\\msys64\\usr\\bin\\bash.exe', ['-i'],
        # @shell = pty.spawn 'C:\\msys64\\usr\\bin\\fish.exe', [],
            name: 'knot'
            cwd:  process.env.HOME
            env:  env
            cols: @cols
            rows: @rows

        @shell.on 'data',  @onShellData
        @shell.on 'error', @onShellError

    restartShell: =>

        @shell.destroy()
        @spawnShell()
        
    onShellError: (err) => log 'error'
    
    onShellData: (data) =>

        # log 'shell data', data
        data = data.replace '⏎', ''
        @lines.write data
        
    refresh: (info) =>
        # top = @term._core.buffer.ydisp
        # dat = @term._core.buffer.lines.get info.start+top
        # num = info.end - info.start
        # log 'term.onRefresh', num, top, dat
        # for index in [info.start...info.end]
            # log @term._core.buffer.translateBufferLineToString index+top
            
        terminal =$ '#terminal'
        terminal.innerHTML = ''
        # log info
        # for index in [info.start..info.end]
            # html = Render.line @lines.buffer.lines[index]
            # log "html[#{index}]", html
            # terminal.appendChild elem class:'line', html:html
        for index in [0...@lines.buffer.lines.length]
            html = Render.line @lines.buffer.lines[index], @lines.buffer
            terminal.appendChild elem class:'line', html:html
            
        @updateCursor()
        
    updateCursor: ->
        
        @cursor.setPos @lines.buffer.x, @lines.buffer.y
        
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
        
        availableHeight = @main.clientHeight - 10
        availableWidth  = @main.clientWidth - 130

        @calcSize()
        
        @cols = 1000 # Math.floor availableWidth  / @term._core.renderer.dimensions.actualCellWidth
        @rows = Math.floor availableHeight / @size.lineHeight
        
        log "resize cols:#{@cols} rows:#{@rows}"
        
        @lines.buffer?.resize @cols, @rows
        @shell?.resize @cols, @rows
                
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
        
        log 'Term.calcSize', @size
        
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: -> 
    
        @scroll.setNumLines 0
        @lines.reset()
        @cache = []
        @shell.write 'clear\n'
            
    # 00000000   0000000   000   000  000000000       0000000  000  0000000  00000000  
    # 000       000   000  0000  000     000         000       000     000   000       
    # 000000    000   000  000 0 000     000         0000000   000    000    0000000   
    # 000       000   000  000  0000     000              000  000   000     000       
    # 000        0000000   000   000     000         0000000   000  0000000  00000000  

    onFontSize: (size) =>
        
        return if not @main?
        return if size <= 0
        
        # log "Term.onFontSize #{size}"
        # @scroll?.setLineHeight size
        
        setStyle "#terminal", 'fontSize', "#{size}px"
        @onResize()
        setStyle "#cursor", 'width', "#{@size.charWidth}px"
        setStyle "#cursor", 'height', "#{@size.lineHeight}px"
        @updateCursor()

    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onClick: (event) ->
        
module.exports = Term
