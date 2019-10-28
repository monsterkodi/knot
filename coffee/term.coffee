###
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000  
###

{ post, prefs, slash, klor, keyinfo, stopEvent, setStyle, elem, empty, kstr, kpos, klog, os, $ } = require 'kxk'

BaseEditor = require './editor/editor'
TextEditor = require './editor/texteditor'
render     = require './editor/render'
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
                
        @editor = new TextEditor @div, features:[
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
        
        @shell = new Shell @
                        
        post.on 'fontSize' @onFontSize
        post.on 'scrollBy' @onScrollBy
            
    onScrollBy: (delta) =>
        
        @editor.scroll.by delta
    
    # 00000000   00000000   0000000  000  0000000  00000000  
    # 000   000  000       000       000     000   000       
    # 0000000    0000000   0000000   000    000    0000000   
    # 000   000  000            000  000   000     000       
    # 000   000  00000000  0000000   000  0000000  00000000  
    
    resized: => @editor.resized()
        
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: ->
        
        @editor.clear()
        @editor.meta.clear()
        @editor.numbers.onClearLines()
        @pwd()
    
        if empty @shell.queue
            @editor.appendText ''
            @editor.singleCursorAtEnd()
                   
    # 00000000   0000000   000   000  000000000       0000000  000  0000000  00000000  
    # 000       000   000  0000  000     000         000       000     000   000       
    # 000000    000   000  000 0 000     000         0000000   000    000    0000000   
    # 000       000   000  000  0000     000              000  000   000     000       
    # 000        0000000   000   000     000         0000000   000  0000000  00000000  

    onFontSize: (size) =>
        
        @editor.setFontSize size
        @editor.singleCursorAtEnd()
        
    # 00000000   000   000  0000000    
    # 000   000  000 0 000  000   000  
    # 00000000   000000000  000   000  
    # 000        000   000  000   000  
    # 000        00     00  0000000    
    
    pwd: ->
            
        dir = slash.tilde process.cwd()
                
        @editor.appendText dir
        
        @editor.meta.add
            line: @editor.numLines()-1
            clss: 'pwd'
            end: dir.length+1
            click: (meta, event) => 
                pos = kpos event
                if pos.x < 40
                    index = @editor.meta.metas.indexOf meta
                    if index < @editor.meta.metas.length-1
                        @editor.singleCursorAtPos [0,meta[0]]
                        for i in [meta[0]...@editor.meta.metas[index+1][0]]
                            @editor.deleteSelectionOrCursorLines()
                        @editor.singleCursorAtEnd()
                else
                    @shell.chdir @editor.line meta[0]
                            
module.exports = Term
