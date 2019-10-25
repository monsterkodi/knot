###
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000  
###

{ post, keyinfo, stopEvent, setStyle, slash, empty, elem, klog, os, $ } = require 'kxk'

KeyHandler = require './keyhandler'
BaseEditor = require './editor/editor'
TextEditor = require './editor/texteditor'

class Term

    @: ->
        
        @div =$ "#term"

        @num  = 0   
        @rows = 0
        @cols = 0
        @size =
            charWidth:  0
            lineHeight: 0
        
        @keyHandler = new KeyHandler @
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
                
        @editor.setText 'Hello\nWorld'
            
        # @div.addEventListener 'click' @onClick
        
        post.on 'fontSize' @onFontSize
        post.on 'tab'      @onTab

        @onFontSize window.stash.get 'fontSize'

    # 00000000    0000000    0000000  000000000  00000000  
    # 000   000  000   000  000          000     000       
    # 00000000   000000000  0000000      000     0000000   
    # 000        000   000       000     000     000       
    # 000        000   000  0000000      000     00000000  
    
    copy:  ->
    paste: -> klog 'paste' require('electron').clipboard.readText()
    
    # 000000000   0000000   0000000    
    #    000     000   000  000   000  
    #    000     000000000  0000000    
    #    000     000   000  000   000  
    #    000     000   000  0000000    
            
    onTab: (tab) => 
        
        @storeTab()
    
    addTab: (path) ->
        
        klog 'addTab'
        
        tabs = window.tabs
        
        @storeTab()
        
        tab = tabs.addTab path

    storeTab: -> klog 'storeTab'
                
    # 00000000   00000000   0000000  000  0000000  00000000  
    # 000   000  000       000       000     000   000       
    # 0000000    0000000   0000000   000    000    0000000   
    # 000   000  000            000  000   000     000       
    # 000   000  00000000  0000000   000  0000000  00000000  
    
    resized: =>
                
        klog 'resized'
        @editor.resized()
        
        # height = @div.clientHeight
        # width  = @div.clientWidth - 140
#         
        # @cols = parseInt width/@size.charWidth
        # @rows = parseInt height/@size.lineHeight
#         
        # @term.resize @cols, @rows
        
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: -> klog 'clear'
           
    # 00000000   0000000   000   000  000000000       0000000  000  0000000  00000000  
    # 000       000   000  0000  000     000         000       000     000   000       
    # 000000    000   000  000 0 000     000         0000000   000    000    0000000   
    # 000       000   000  000  0000     000              000  000   000     000       
    # 000        0000000   000   000     000         0000000   000  0000000  00000000  

    onFontSize: (size) =>
        
        if @main?
            @resized()
        
module.exports = Term
