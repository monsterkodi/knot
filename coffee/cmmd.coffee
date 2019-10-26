###
 0000000  00     00  00     00  0000000    
000       000   000  000   000  000   000  
000       000000000  000000000  000   000  
000       000 0 000  000 0 000  000   000  
 0000000  000   000  000   000  0000000    
###

{ post, klog } = require 'kxk'

class Cmmd

    @: (@shell) -> @editor = @shell.term.editor
        
    onCommand: (cmd) -> klog 'unhandled cmd' cmd
                
    newLine: ->
        
        @editor.appendText ''
        true
        
    clearLine: ->
        
        @editor.deleteToEndOfLineOrWholeLine()
        true
        
module.exports = Cmmd
