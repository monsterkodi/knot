###
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000  
###

{ post, keyinfo, stopEvent, setStyle, slash, empty, elem, kstr, klog, os, $ } = require 'kxk'

BaseEditor = require './editor/editor'
TextEditor = require './editor/texteditor'
render     = require './editor/render'
Wheel      = require './tools/wheel'
Shell      = require './shell'

class Term

    @: ->
        
        @div =$ "#term"

        @num  = 0   
        @rows = 0
        @cols = 0
        @size =
            charWidth:  0
            lineHeight: 0
        
        @editor = new TextEditor $(".editor"),
            features: [
                'Scrollbar'
                'Minimap'
                'Meta'
                'Numbers'
                'Autocomplete'
                'Brackets'
                'Strings'
                'CursorLine'
            ],
            fontSize: 19
                
        @wheel = new Wheel @editor.scroll
        @shell = new Shell @
            
        @editor.setText ''
        @editor.focus()
            
        post.on 'fontSize' @onFontSize
        post.on 'scrollBy' @onScrollBy
        post.on 'tab'      @onTab

        @onFontSize window.stash.get 'fontSize'
        
    # 000000000   0000000   0000000    
    #    000     000   000  000   000  
    #    000     000000000  0000000    
    #    000     000   000  000   000  
    #    000     000   000  0000000    
            
    onTab: (tab) => 
        
        @storeTab()
        @editor.setText tab.buffer ? ''
        @editor.singleCursorAtEnd()
        @editor.focus()
        process.chdir slash.untilde tab.text
    
    addTab: (path) ->
        
        window.tabs.addTab path ? slash.tilde process.cwd()

    storeTab: -> 
    
        tabs = window.tabs
        if tab = tabs.activeTab()
            tab.buffer = @editor.text()
            
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
    
    clear: -> @editor.setText ''
           
    # 00000000   0000000   000   000  000000000       0000000  000  0000000  00000000  
    # 000       000   000  0000  000     000         000       000     000   000       
    # 000000    000   000  000 0 000     000         0000000   000    000    0000000   
    # 000       000   000  000  0000     000              000  000   000     000       
    # 000        0000000   000   000     000         0000000   000  0000000  00000000  

    onFontSize: (size) =>
        
        klog 'onFontSize' size
        
        @editor.setFontSize size
        # @resized()
        
module.exports = Term
