###
 0000000  000   000  00000000  000      000    
000       000   000  000       000      000    
0000000   000000000  0000000   000      000    
     000  000   000  000       000      000    
0000000   000   000  00000000  0000000  0000000
###

{ empty, childp, post, klog } = require 'kxk'

Alias = require './alias'
Chdir = require './chdir'

class Shell

    @: (@term) ->
        
        @alias = new Alias @
        @chdir = new Chdir @
        
        post.on 'execute' @onExecute
        
    onExecute: => 
    
        cmd = @term.editor.lastLine().trim()
        
        if empty(cmd) 
            @term.editor.appendText ''
            return
        
        if @alias.onCommand cmd
            @term.editor.singleCursorAtEnd()
            return

        if @chdir.onCommand cmd
            @term.editor.singleCursorAtEnd()
            return
            
        @executeCommand cmd
            
    executeCommand: (cmd) =>
            
        klog 'shell.executeCommand' cmd
        
        @child = childp.exec cmd
        
        @child.stdout.on 'data' @onStdOut
        @child.stderr.on 'data' @onStdErr
        
    onStdOut: (data) =>
        
        @term.appendAnsi data
        @term.editor.singleCursorAtEnd()

    onStdErr: (data) =>
        
        @term.appendAnsi 'error: ' + data
        @term.editor.singleCursorAtEnd()
        
module.exports = Shell
