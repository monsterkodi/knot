###
 0000000  000   000  00000000  000      000    
000       000   000  000       000      000    
0000000   000000000  0000000   000      000    
     000  000   000  000       000      000    
0000000   000   000  00000000  0000000  0000000
###

{ childp, post, klog } = require 'kxk'

class Shell

    @: (@term) ->
        
        post.on 'execute' @onExecute
        
    onExecute: => 
    
        klog 'execute' @term.editor.lastLine()
        
        @child = childp.exec @term.editor.lastLine()
        
        @child.stdout.on 'data' @onStdOut
        
    onStdOut: (data) =>
        
        @term.editor.appendText data
        @term.editor.singleCursorAtEnd()

module.exports = Shell
