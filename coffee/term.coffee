###
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000  
###

{ post, elem, log, $ } = require 'kxk'

# { Terminal } = require 'xterm'
{ Terminal } = require 'term.js'
pty          = require 'node-pty'
Scroll       = require './scroll'
ScrollBar    = require './scrollbar'
Minimap      = require './minimap'
KeyHandler   = require './keyhandler'
Render       = require './render'
Lines        = require './lines'

class Term

    constructor: ->
        
        @num   = 0   
        @main  =$ '#main' 
        @cache = []
        
        # @term = new Terminal
            # cursorBlink: false
            # screenKeys: true
            # fontFamily:                 '"Meslo LG S", "Liberation Mono", "Menlo", "Cousine", "Andale Mono"'
            # fontSize:                   prefs.get 'fontSize', 18
            # lineHeight:                 1
            # rendererType:               'dom'
            # enableBold:                 true
            # drawBoldTextInBrightColors: true
            # theme:
                # foreground:    '#cccccc'
                # background:    '#000000'
                # cursor:        '#ffff00'
                # cursorAccent:  '#ffff88'
                # selection:     'rgba(128,128,128,0.2)'
                # black:         '#222222'
                # red:           '#880000'
                # green:         '#008800'
                # yellow:        '#aaaa00'
                # blue:          '#0000ff'
                # magenta:       '#aa00aa'
                # cyan:          '#00aaaa'
                # white:         '#aaaaaa'
                # brightBlack:   '#444444'
                # brightRed:     '#ff0000'
                # brightGreen:   '#00ff00'
                # brightYellow:  '#ffff44'
                # brightBlue:    '#6666ff'
                # brightMagenta: '#ff44ff'
                # brightCyan:    '#00dddd'
                # brightWhite:   '#ffffff'
            
        window.tabs.addTab '~'
        
        @keyHandler = new KeyHandler @
        @lines      = new Lines @
        
        # @term.open $ '#terminal'
        
        # @term.on 'title', (title) -> 
            # window.tabs.activeTab()?.update title
            
        # @term.on 'refresh', @onTermRefresh
        
        fromHex = (css) ->
            css:  css
            rgba: parseInt(css.slice(1), 16) << 8 | 0xFF
        
        @cache      = []
        @scroll     = new Scroll    $ '#terminal'
        @scrollBar  = new ScrollBar @scroll
        @minimap    = new Minimap   @
        
        # @lines.addEventListener 'click', @onClick
        @main.addEventListener 'click', @onClick
        
        post.on 'fontSize',     @onFontSize

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
            cols: 1000

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
        for index in [info.start..info.end]
            html = Render.line @lines.buffer.lines[index]
            log "html[#{index}]", html
            terminal.appendChild elem class:'line', html:html
        
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

        cols = 1000 # Math.floor availableWidth  / @term._core.renderer.dimensions.actualCellWidth
        rows = Math.floor availableHeight / 20 # @term._core.renderer.dimensions.actualCellHeight
        
        # log "Term.onResize cols:#{str cols} rows:#{str rows} w:#{availableWidth} h:#{availableHeight}"
        
        log "resize #{cols} #{rows}"
        # @term.resize  cols, rows
        @shell.resize cols, rows
        
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
        if size > 0
            # @scroll?.setLineHeight size
            log "size #{size}"
            # @term.setOption 'fontSize', size

    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onClick: (event) ->
        
module.exports = Term
