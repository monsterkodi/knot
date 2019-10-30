###
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000  
###

{ post, kerror, slash, elem, klog, kpos, $ } = require 'kxk'

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
        
        @shell   = new Shell @
        @history = new History @
                        
        post.on 'fontSize' @onFontSize
                                
    # 00     00  00000000  000000000   0000000   
    # 000   000  000          000     000   000  
    # 000000000  0000000      000     000000000  
    # 000 0 000  000          000     000   000  
    # 000   000  00000000     000     000   000  
    
    failMeta: (meta) ->

        meta[2].number = text:'✖' clss:'fail'
        meta[2].clss = 'fail'
        @editor.meta.update meta
        
    succMeta: (meta) ->

        meta[2].number = text:'▶' clss:'succ'
        meta[2].clss = 'succ'
        @editor.meta.update meta
        
    insertCmdMeta: (li, cmd) ->
        
        @editor.meta.add 
            line: li
            clss: 'cmd'
            number: 
                text: '▶'
                clss: 'cmd'
            end: cmd.length+1
            click: (meta, event) =>
                @editor.singleCursorAtEnd()
                @editor.insertSingleLine @editor.line meta[0]
                @shell.execute @editor.line meta[0]
    
    moveInputMeta: ->
        
        if @editor.numLines()-1 > @inputMeta[0]
            @editor.meta.moveLineMeta @inputMeta, @editor.numLines()-1-@inputMeta[0]
        else
            if @inputMeta[0] != @editor.numLines()-1
                kerror 'input meta not at end?' @inputMeta[0], @editor.numLines()-1
              
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: -> 
    
        @editor.clear()
        @inputMeta = @editor.meta.add
            line: 0
            clss: 'input'
            number: text: '▶'
            click: (meta, event) =>
                pos = kpos event
                if pos.x < 40
                    klog 'input number'
                else
                    klog 'input text?'
                
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
                    
        true
                     
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    handleKey: (mod, key, combo, char, event) ->        
        
        # klog 'term.handleKey' mod, key, combo
        
        if @editor.isInputCursor()
            switch combo
                when 'alt+up' then return @editor.moveCursorsUp()
                when 'up'     then return @history.prev()
                when 'down'   then return @history.next()
                when 'ctrl+c' then return @shell.handleCancel()
        
        'unhandled'
        
module.exports = Term
