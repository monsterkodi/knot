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
        
        @editor = @term.editor
        @alias = new Alias @
        @chdir = new Chdir @
        
        post.on 'execute' @onExecute
        
    onExecute: => 
    
        cmd = @term.editor.lastLine().trim()
        
        if empty(cmd) 
            @editor.appendText ''
            return
        
        if @alias.onCommand cmd
            @editor.singleCursorAtEnd()
            return

        if @chdir.onCommand cmd
            @editor.singleCursorAtEnd()
            return
            
        @executeCommand cmd
            
    executeCommand: (cmd) =>
            
        klog 'shell.executeCommand' cmd
        
        @child = childp.exec cmd
        
        @child.stdout.on 'data' @onStdOut
        @child.stderr.on 'data' @onStdErr
        
    onStdOut: (data) =>
        
        @editor.appendText data
        @editor.singleCursorAtEnd()

    onStdErr: (data) =>
        
        @editor.appendText 'error: ' + data
        @editor.singleCursorAtEnd()
        
module.exports = Shell
