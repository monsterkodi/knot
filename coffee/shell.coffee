###
 0000000  000   000  00000000  000      000    
000       000   000  000       000      000    
0000000   000000000  0000000   000      000    
     000  000   000  000       000      000    
0000000   000   000  00000000  0000000  0000000
###

{ empty, childp, post, klog } = require 'kxk'

Alias = require './alias'

class Shell

    @: (@term) ->
        
        @alias = new Alias @
        
        post.on 'execute' @onExecute
        
    onExecute: => 
    
        cmd = @term.editor.lastLine()
        
        if empty(cmd) 
            @term.editor.appendText ''
            return
        
        if @alias.onCommand cmd
            @term.editor.singleCursorAtEnd()
            return
        
        klog 'shell.execute' cmd
        
        @child = childp.exec @term.editor.lastLine()
        
        @child.stdout.on 'data' @onStdOut
        
    onStdOut: (data) =>
        
        @term.appendAnsi data
        @term.editor.singleCursorAtEnd()

module.exports = Shell
