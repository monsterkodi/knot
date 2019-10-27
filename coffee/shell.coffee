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
        
    onExecute: (@cmd) => 
    
        @errorText = ''
        @cmd ?= @term.editor.lastLine()
        @cmd  = @cmd.trim()
        
        if empty @cmd
            @editor.appendText ''
            @editor.singleCursorAtEnd()
            return
        
        @executeAlias @cmd
        
    executeAlias: (@cmd) =>
        
        if @alias.onCommand @cmd
            @editor.singleCursorAtEnd()
            return true

        if @chdir.onCommand @cmd
            @editor.singleCursorAtEnd()
            return true
            
        @executeCommand @cmd
            
    executeCommand: (@cmd) =>
            
        @child = childp.exec @cmd
        
        @child.stdout.on 'data' @onStdOut
        @child.stderr.on 'data' @onStdErr
        @child.on 'exit' @onExit
        
        true
        
    onExit: (code) =>

        if code == 0
            setImmediate @onDone
        else
            if @chdir.onFallback @cmd
                @editor.singleCursorAtEnd()
            else
                @editor.appendText 'error: ' + @errorText
                @editor.singleCursorAtEnd()
        
    onDone: =>

        @term.pwd()
        @editor.appendText ''
        @editor.singleCursorAtEnd()
        
    onStdOut: (data) =>
        
        if data[-1] == '\n'
            data = data[0...data.length-1]
        @editor.appendText data
        @editor.singleCursorAtEnd()

    onStdErr: (data) =>
        
        @errorText += data
        # @editor.appendText 'error: ' + data
        # @editor.singleCursorAtEnd()
        
module.exports = Shell
