###
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000  
###

{ post, setStyle, keyinfo, valid, slash, elem, log, $ } = require 'kxk'

{ Terminal } = require 'xterm'
pty          = require 'node-pty'
Scroll       = require './scroll'
ScrollBar    = require './scrollbar'
Minimap      = require './minimap'

class Term

    constructor: ->
        
        @num = 0   
        @lines =$ '#terminal'
        
        @term = new Terminal
            fontFamily:                 '"Meslo LG S", "Liberation Mono", "Menlo", "Cousine", "Andale Mono"'
            fontSize:                   17
            lineHeight:                 1
            enableBold:                 true
            rendererType:               'dom'
            drawBoldTextInBrightColors: true
        @term.attachCustomKeyEventHandler @customKey
        @term.open @lines
        
        @cache     = []
        @icons     = {}
        @scroll    = new Scroll    @lines
        @scrollBar = new ScrollBar @scroll
        @minimap   = new Minimap   @
        
        @lines.addEventListener 'click', @onClick
        post.on 'combo',        @onCombo
        post.on 'fontSize',     @onFontSize
        post.on 'showLines',    @onShowLines 
        post.on 'shiftLines',   @onShiftLines
        post.on 'clearLines',   @onClearLines
        post.on 'changeLines',  @onChangeLines
        post.on 'selectLine',   @onSelectLine
        
        document.addEventListener 'selectionchange', @onSelectionChange
        window.addEventListener 'resize', @onResize
        
        @spawnShell()
        
    customKey: (event) => return false
        
    #  0000000  000   000  00000000  000      000      
    # 000       000   000  000       000      000      
    # 0000000   000000000  0000000   000      000      
    #      000  000   000  000       000      000      
    # 0000000   000   000  00000000  0000000  0000000  
    
    spawnShell: =>
        @shell = pty.spawn 'C:\\msys64\\usr\\bin\\bash.exe', ['-i'],
            name:   'xterm-256color'
            cwd:    process.env.HOME
            env:    process.env

        @shell.on 'data',  @onShellData
        @shell.on 'error', @onShellError

    restartShell: =>

        @shell.destroy()
        @spawnShell()
        
    onShellError: (err) => log 'error'
    
    onShellData: (data) =>

        log 'shell data', data
        data = data.replace '⏎', ''
        @term.write data
        
    #  0000000   0000000   00     00  0000000     0000000   
    # 000       000   000  000   000  000   000  000   000  
    # 000       000   000  000000000  0000000    000   000  
    # 000       000   000  000 0 000  000   000  000   000  
    #  0000000   0000000   000   000  0000000     0000000   
    
    onCombo: (combo, info) =>

        # log info.mod, info.key, info.combo, info.char
        # return stopEvent(info.event) if 'unhandled' != window.keys.globalModKeyComboEvent info.mod, info.key, info.combo, info.event
        
        switch combo
            when 'ctrl+v'           then return @paste()
            when 'ctrl+c'           then return @copy()
            when 'ctrl+x'           then return @cut()
            when 'enter', 'return'  then return @shell.write '\n'
            else 
                if info.char
                    @shell.write info.char
                else
                    switch info.event.keyCode
                        when 27 then @shell.write '\x1b'
            
    #  0000000  00000000  000      00000000   0000000  000000000  
    # 000       000       000      000       000          000     
    # 0000000   0000000   000      0000000   000          000     
    #      000  000       000      000       000          000     
    # 0000000   00000000  0000000  00000000   0000000     000     
    
    onSelectLine: (lineIndex) => 
        
        if lineIndex < @scroll.top
            delta = - @scroll.lineHeight * (@scroll.top - lineIndex + 5)
            @scroll.by delta
        else if lineIndex > @scroll.bot
            delta = @scroll.lineHeight * (lineIndex - @scroll.bot + 5)
            @scroll.by delta
        
        if lineIndex >= @scroll.top and lineIndex <= @scroll.bot
            $('.selected')?.classList.remove 'selected'
            @lines.children[lineIndex-@scroll.top].classList.add 'selected'
        
    onSelectionChange: =>

        sel = window.getSelection()
        @selectionText = ''
        if sel.rangeCount > 0
            texts = []
            range = sel.getRangeAt 0
            contents = range.cloneContents()
            for node in contents.children
                if node.classList.contains 'line'
                    if not node.classList.contains 'file'
                        texts.push $('.log', node).innerText
                else 
                    log 'nope', node.innerHTML
            @selectionText = texts.join '\n'
            
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    onClearLines: =>
        
        @num = 0  
        @lines.innerHTML = ''
        
    # 000   000  00000000   0000000     0000000   000000000  00000000  00000000    0000000    0000000  
    # 000   000  000   000  000   000  000   000     000     000       000   000  000   000  000       
    # 000   000  00000000   000   000  000000000     000     0000000   00000000   000   000  0000000   
    # 000   000  000        000   000  000   000     000     000       000        000   000       000  
    #  0000000   000        0000000    000   000     000     00000000  000         0000000   0000000   
    
    updatePositions: =>
        
        li = 0
        
        for div in @lines.children
            y = @scroll.lineHeight * li
            div.style.transform = "translate3d(0,#{y}px, 0)"
            div.style.zIndex = li
            li++
        
    #  0000000   00000000   00000000   00000000  000   000  0000000    
    # 000   000  000   000  000   000  000       0000  000  000   000  
    # 000000000  00000000   00000000   0000000   000 0 000  000   000  
    # 000   000  000        000        000       000  0000  000   000  
    # 000   000  000        000        00000000  000   000  0000000    
    
    appendLine: (lineIndex) ->
        
        if lineIndex > @cache.length-1
            return
        
        line = @cache[lineIndex]
        # Highlight.line line

        @lines.appendChild line
        
        if not @sizer.initialized
            @sizer.init()
                
    # 00000000   00000000   00000000  00000000   00000000  000   000  0000000    
    # 000   000  000   000  000       000   000  000       0000  000  000   000  
    # 00000000   0000000    0000000   00000000   0000000   000 0 000  000   000  
    # 000        000   000  000       000        000       000  0000  000   000  
    # 000        000   000  00000000  000        00000000  000   000  0000000    
    
    prependLine: (lineIndex) ->
        
        if lineIndex < 0 or lineIndex > @cache.length-1
            log "skip prepend #{lineIndex}"
            return 
        
        line = @cache[lineIndex]
        Highlight.line line
        
        @lines.insertBefore line, @lines.firstChild
    
    shiftLine: (lineIndex) ->
        
        if lineIndex >= 0 and lineIndex <= @cache.length-1 
            @lines.firstChild.remove() # this should check if line matches!
        
    popLine: (lineIndex) ->
        
        if lineIndex <= @cache.length-1 
            @lines.lastChild.remove() # this should check if line matches!
        
    #  0000000  000   000   0000000   000   000  
    # 000       000   000  000   000  000 0 000  
    # 0000000   000000000  000   000  000000000  
    #      000  000   000  000   000  000   000  
    # 0000000   000   000   0000000   00     00  
    
    onShowLines: (top, bot, num) =>
        
        @lines.innerHTML = ''
        for li in [top..bot]
            @appendLine li
            
        @updatePositions()
        
    #  0000000  000   000   0000000   000   000   0000000   00000000  
    # 000       000   000  000   000  0000  000  000        000       
    # 000       000000000  000000000  000 0 000  000  0000  0000000   
    # 000       000   000  000   000  000  0000  000   000  000       
    #  0000000  000   000  000   000  000   000   0000000   00000000  
    
    onChangeLines: (oldLines, newLines) =>
        
        while newLines > oldLines
            @appendLine oldLines++
            
        while newLines < oldLines
            @popLine oldLines
            oldLines--
            
        @updatePositions()            
            
    #  0000000  000   000  000  00000000  000000000  
    # 000       000   000  000  000          000     
    # 0000000   000000000  000  000000       000     
    #      000  000   000  000  000          000     
    # 0000000   000   000  000  000          000     
    
    onShiftLines: (top, bot, num) =>
        if num > 0
            for n in [0...num]
                @shiftLine  top-num+n
                @appendLine bot-num+n+1
        else
            for n in [0...-num]
                @popLine     bot-num-n
                @prependLine top-num-n-1
                
        @updatePositions()
    
    # 00000000   00000000   0000000  000  0000000  00000000  
    # 000   000  000       000       000     000   000       
    # 0000000    0000000   0000000   000    000    0000000   
    # 000   000  000            000  000   000     000       
    # 000   000  00000000  0000000   000  0000000  00000000  
    
    onResize: =>
        
        @scroll.setViewHeight @lines.parentNode.clientHeight
        
        parentElementStyle = window.getComputedStyle(@term.element.parentElement)
        parentElementHeight = parseInt parentElementStyle.getPropertyValue 'height'
        parentElementWidth = Math.max 0, parseInt parentElementStyle.getPropertyValue 'width'
        elementStyle = window.getComputedStyle @term.element
        elementPadding = 
          top:      parseInt elementStyle.getPropertyValue 'padding-top'
          bottom:   parseInt elementStyle.getPropertyValue 'padding-bottom'
          right:    parseInt elementStyle.getPropertyValue 'padding-right'
          left:     parseInt elementStyle.getPropertyValue 'padding-left'
        elementPaddingVer = elementPadding.top + elementPadding.bottom
        elementPaddingHor = elementPadding.right + elementPadding.left
        availableHeight = parentElementHeight - elementPaddingVer
        availableWidth = parentElementWidth - elementPaddingHor - @term._core.viewport.scrollBarWidth

        cols = Math.floor availableWidth / @term._core.renderer.dimensions.actualCellWidth
        rows = Math.floor availableHeight / @term._core.renderer.dimensions.actualCellHeight
          
        # @term._core.renderer.clear()
        @term.resize cols, rows
        @shell.resize cols, rows
        
    clear: -> 
    
        @scroll.setNumLines 0
        @cache = []
        # @shell.
        # @term._core.renderer.clear()
            
    # 00000000   0000000   000   000  000000000       0000000  000  0000000  00000000  
    # 000       000   000  0000  000     000         000       000     000   000       
    # 000000    000   000  000 0 000     000         0000000   000    000    0000000   
    # 000       000   000  000  0000     000              000  000   000     000       
    # 000        0000000   000   000     000         0000000   000  0000000  00000000  

    onFontSize: (size) =>
        
        return if not @lines?
        
        if @lines.firstChild
            setStyle '.line', 'height', ''
            lineHeight = @lines.firstChild.clientHeight
            if lineHeight > 0
                @scroll?.setLineHeight lineHeight
                setStyle '.line', 'height', "#{lineHeight}px"
        else if size > 0
            @scroll?.setLineHeight size
            setStyle '.line', 'height', "#{lineHeight}px"

    #  0000000  000      000   0000000  000   000  
    # 000       000      000  000       000  000   
    # 000       000      000  000       0000000    
    # 000       000      000  000       000  000   
    #  0000000  0000000  000   0000000  000   000  
    
    onClick: (event) ->
        
        return if event.target.classList.contains 'log'
        return if event.target.classList.contains 'line'
        
        if lineElem = elem.upElem event.target, class:'line'
            file =  $('.src', lineElem).innerText
            if valid file
                
                file = file.replace /[\w\-]+\-x64\/resources\/app\//, ''
                
                if /\/node\_modules\//.test file
                    upFile = file.replace /[\w\-]+\/node\_modules\//, ''
                    if slash.exists upFile
                        file = upFile
                    
                post.emit 'openFile', file
            
module.exports = Term
