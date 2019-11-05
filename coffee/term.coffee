###
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000  
###

{ post, slash, elem, kpos, klog, $ } = require 'kxk'

BaseEditor = require './editor/editor'
TextEditor = require './editor/texteditor'
render     = require './editor/render'
History    = require './history'
Shell      = require './shell'

class Term

    @: ->
        
        main =$ '#main'
        @div = elem class:'term' 
        main.appendChild @div

        @num  = 0   
        @rows = 0
        @cols = 0
        @size =
            charWidth:  0
            lineHeight: 0
                
        @editor = new TextEditor @, features:[
            'Scrollbar'
            'Minimap'
            'Meta'
            'Numbers'
            'Autocomplete'
            'Brackets'
            'Strings'
            'CursorLine'
        ]
                
        @editor.setText ''
        
        @editor.on 'changed' @onChanged
        
        @shell   = new Shell @
        @history = new History @
        @autocomplete = @editor.autocomplete
                        
        post.on 'fontSize' @onFontSize
                                
    # 00     00  00000000  000000000   0000000   
    # 000   000  000          000     000   000  
    # 000000000  0000000      000     000000000  
    # 000 0 000  000          000     000   000  
    # 000   000  00000000     000     000   000  

    addDirMeta: (dir) ->
        @editor.meta.add
            line: Math.max 0, @editor.numLines()-2
            clss: 'pwd'
            number: 
                text: ' '
                clss: 'pwd'
            end: dir.length+1
            click: (meta, event) =>
                pos = kpos event
                if pos.x < 40
                    index = @editor.meta.metas.indexOf meta
                    if index < @editor.meta.metas.length-1
                        @editor.singleCursorAtPos [0,meta[0]]
                        if next = @editor.meta.nextMetaOfSameClass meta
                            for i in [meta[0]...next[0]]
                                @editor.deleteSelectionOrCursorLines()
                        @editor.moveCursorsDown()
                else
                    @editor.singleCursorAtEnd()
                    @shell.cd @editor.line meta[0]

    addInputMeta: ->
        
        @inputMeta = @editor.meta.add
            line: 0
            clss: 'input'
            number: 
                text: '▶'
                clss: 'input'
            click: (meta, event) =>
                pos = kpos event
                if pos.x < 40
                    klog 'input number'
                else
                    klog 'input text?'
  
        if @shell.child
            @busyInput()
                    
    busyInput: ->

        @inputMeta[2]?.number.text = '\uf013'
        @inputMeta[2]?.number.clss = 'input busy'
        @editor.meta.update @inputMeta
        
    resetInput: ->
        
        @inputMeta[2]?.number.text = '▶'
        @inputMeta[2]?.number.clss = 'input'
        @editor.meta.update @inputMeta
    
    failMeta: (meta) ->

        @resetInput()
        
        meta[2].number = text:'✖' clss:'fail'
        meta[2].clss = 'fail'
        @editor.minimap.drawLines meta[0], meta[0]
        @editor.meta.update meta
        
    succMeta: (meta) ->

        @resetInput()
        
        meta[2].number = text:'▶' clss:'succ'
        meta[2].clss = 'succ'
        @editor.minimap.drawLines meta[0], meta[0]
        @editor.meta.update meta
        
    insertCmdMeta: (li, cmd) ->

        @busyInput()
        
        @editor.meta.add 
            line: li
            clss: 'cmd'
            number: 
                text: '\uf013'
                clss: 'cmd'
            end: cmd.length+1
            click: (meta, event) =>
                @editor.singleCursorAtEnd()
                @editor.setInputText @editor.line meta[0]
                @shell.execute cmd:@editor.line meta[0]
    
    moveInputMeta: ->
        
        if @editor.numLines()-1 != @inputMeta[0]
            oldLine = @inputMeta[0]
            @editor.meta.moveLineMeta @inputMeta, @editor.numLines()-1-@inputMeta[0]            
            @editor.numbers.updateColor oldLine
            
    onChanged: (changeInfo) =>
        
        if changeInfo.changes.length
            @moveInputMeta()
                                
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: -> 
    
        delete @shell.last?.meta
        @editor.clear()
                    
        @addInputMeta()
        true
                
    # 00000000   0000000   000   000  000000000       0000000  000  0000000  00000000  
    # 000       000   000  0000  000     000         000       000     000   000       
    # 000000    000   000  000 0 000     000         0000000   000    000    0000000   
    # 000       000   000  000  0000     000              000  000   000     000       
    # 000        0000000   000   000     000         0000000   000  0000000  00000000  

    onFontSize: (size) =>
        
        @editor.setFontSize size
        @editor.singleCursorAtEnd()
        
    resized: => @editor.resized()
    
    scrollBy: (delta) =>
        
        if @autocomplete.list
            @autocomplete.close()
        @editor.scroll.by delta
        if not (0 < @editor.scroll.scroll < @editor.scroll.scrollMax-1)
            post.emit 'stopWheel'
    
    # 00000000   000   000  0000000    
    # 000   000  000 0 000  000   000  
    # 00000000   000000000  000   000  
    # 000        000   000  000   000  
    # 000        00     00  0000000    
    
    pwd: ->
        
        dir = slash.tilde process.cwd()
                
        @editor.appendOutput dir
        @addDirMeta dir
                    
        true
               
    # 00000000  000   000  000000000  00000000  00000000   
    # 000       0000  000     000     000       000   000  
    # 0000000   000 0 000     000     0000000   0000000    
    # 000       000  0000     000     000       000   000  
    # 00000000  000   000     000     00000000  000   000  
    
    onEnter: ->
        
        if @editor.isInputCursor()
            if @shell.child #and @shell.last.cmd == 'koffee'
                @shell.child.stdin.write '\n'
                if @shell.last.cmd == 'koffee'
                    @editor.setInputText ''
                    return
            if @autocomplete.isListItemSelected()
                @autocomplete.complete {}
            else if @autocomplete.selectedCompletion()
                return @shell.execute fallback:@editor.lastLine() + @autocomplete.selectedCompletion()
            @shell.execute {}
        else
            @editor.singleCursorAtEnd()
        
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    handleKey: (mod, key, combo, char, event) ->        
        
        # klog 'term.handleKey' mod, key, combo
                
        switch combo
            when 'enter'    then return @onEnter()
            when 'alt+up'   then return @editor.moveCursorsUp()
            when 'alt+down' then return @editor.moveCursorsDown()
            when 'ctrl+c'   then return @shell.handleCancel()
        
        if @shell.child # and @shell.last.cmd == 'koffee'
            if char
                switch key
                    when 'backspace'
                        @shell.child.stdin.write '\x08'
                    else
                        klog 'pipe char' char
                        @shell.child.stdin.write char
            else
                klog 'pipe key' key, combo
        else            
            return if 'unhandled' != @autocomplete.handleModKeyComboEvent mod, key, combo, event
            
            if @editor.isInputCursor()
                switch combo
                    when 'up'     then return @history.prev()
                    when 'down'   then return @history.next()
        
        'unhandled'
        
module.exports = Term
