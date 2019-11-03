###
 0000000  00     00  00     00  0000000    
000       000   000  000   000  000   000  
000       000000000  000000000  000   000  
000       000 0 000  000 0 000  000   000  
 0000000  000   000  000   000  0000000    
###

{ klog } = require 'kxk'

class Cmmd

    @: (@shell) -> 
        @term   = @shell.term
        @editor = @term.editor
        
    onCommand: (cmd) -> klog 'unhandled cmd' cmd
                
    newLine: ->
        
        @editor.appendText ''
        true
        
    clearLine: ->
        
        @editor.deleteToEndOfLineOrWholeLine()
        true
        
module.exports = Cmmd
