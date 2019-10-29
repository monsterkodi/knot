###
 0000000  000   000  00000000  000      000    
000       000   000  000       000      000    
0000000   000000000  0000000   000      000    
     000  000   000  000       000      000    
0000000   000   000  00000000  0000000  0000000
###

{ empty, slash, childp, post, kstr, klog } = require 'kxk'

Alias = require './alias'
Chdir = require './chdir'

class Shell

    @: (@term) ->
        
        @editor = @term.editor
        @alias = new Alias @
        @chdir = new Chdir @
        @queue = []
        @inputQueue = []
        
    cd: (dir) =>
        
        if not slash.samePath dir, process.cwd()
            @executeCmd 'cd ' + dir
            @editor.focus()
        
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000  
    # 000        000 000   000       000       000   000     000     000       
    # 0000000     00000    0000000   000       000   000     000     0000000   
    # 000        000 000   000       000       000   000     000     000       
    # 00000000  000   000  00000000   0000000   0000000      000     00000000  
    
    execute: (@cmd) =>
    
        if @child
            cmd = @cmd ? @editor.lastLine()
            klog 'child active?' @child.pid, cmd
            @inputQueue.push cmd
            @editor.insertSingleLine ''
            return
        
        @errorText = ''
        @cmd ?= @editor.lastLine()
        @cmd  = @cmd.trim()
        
        @editor.appendText ''
        @editor.singleCursorAtEnd()
            
        if empty @cmd
            return
        
        @term.history.onCmd @cmd
        post.emit 'cmd' @cmd, @term.tab.text
        
        @term.insertCmdMeta @editor.numLines()-2, @cmd
        
        @executeCmd @substitute @cmd
                
    executeCmd: (@cmd) =>
        
        split = @cmd.split '&&'
        if split.length > 1
            @cmd = split[0].trim()
            @queue = @queue.concat split[1..]
        else
            @cmd = @cmd.trim()
        
        if empty @cmd
            @dequeue()
            return true
        
        if @alias.onCommand @cmd
            @dequeue()
            return true

        if @chdir.onCommand @cmd
            @dequeue()
            return true
            
        @shellCmd @cmd
            
    enqueue: (cmd) -> 
    
        @queue.push cmd
        true
        
    substitute: (cmd) ->
        
        cmd = @alias.substitute cmd
        
    #  0000000  000   000  00000000  000      000       0000000  00     00  0000000    
    # 000       000   000  000       000      000      000       000   000  000   000  
    # 0000000   000000000  0000000   000      000      000       000000000  000   000  
    #      000  000   000  000       000      000      000       000 0 000  000   000  
    # 0000000   000   000  00000000  0000000  0000000   0000000  000   000  0000000    
    
    shellCmd: (@cmd) =>
            
        split = @cmd.split '|'
        
        if split.length > 1
            
            # 00000000   000  00000000   00000000  
            # 000   000  000  000   000  000       
            # 00000000   000  00000000   0000000   
            # 000        000  000        000       
            # 000        000  000        00000000  
            
            pipe = (child, stdout, stderr) ->
                
                child.stdin.on 'error' (err) -> stderr.write 'stdin error' + err + '\n'
                child.stderr.on 'data' (data) -> if not /^execvp\(\)/.test data then stderr.write data
                child.stdout.pipe stdout
            
                child.on 'error' (err) ->
                    process.stderr.write 'Failed to execute ' + err + '\n'
                    firstChild.kill()

            currentCommand = split[0]
            args = currentCommand.split ' '
            cmd = args.shift()
            opt = encoding:'utf8' shell:true
            firstChild = previousChild = @child = childp.spawn cmd, args, opt
        
            for i in [1...split.length]
                currentCommand = split[i].trim()
                args = currentCommand.split ' '
                cmd = args.shift()
                @child = childp.spawn cmd, args, opt
                
                pipe previousChild, @child.stdin, process.stderr
        
                previousChild = @child
        
            @child.stdout.on 'data' @onStdOut
            @child.stderr.on 'data' @onStdErr
        
            # process.stdin.pipe firstChild.stdin
            
            @child.on 'close' (code) =>
                firstChild.kill()
                @onExit code
        else
        
            # 00000000  000   000  00000000   0000000  
            # 000        000 000   000       000       
            # 0000000     00000    0000000   000       
            # 000        000 000   000       000       
            # 00000000  000   000  00000000   0000000  
            
            @child = childp.exec @cmd, shell:true
            
            @child.stdout.on 'data'  @onStdOut
            @child.stderr.on 'data'  @onStdErr
            @child.on        'close' @onExit
        
        true
        
    # 00000000  000   000  000  000000000  
    # 000        000 000   000     000     
    # 0000000     00000    000     000     
    # 000        000 000   000     000     
    # 00000000  000   000  000     000     
    
    onExit: (code) =>

        delete @child
        if code == 0
            setImmediate @onDone
        else
            if @chdir.onFallback @cmd
                klog 'fallback'
            else
                @editor.appendText 'error: ' + @errorText
            @dequeue()
            
    onDone: =>

        if empty(@queue) and empty(@inputQueue)
            @term.pwd()
        else
            @dequeue()

    # 0000000    00000000   0000000   000   000  00000000  000   000  00000000  
    # 000   000  000       000   000  000   000  000       000   000  000       
    # 000   000  0000000   000 00 00  000   000  0000000   000   000  0000000   
    # 000   000  000       000 0000   000   000  000       000   000  000       
    # 0000000    00000000   00000 00   0000000   00000000   0000000   00000000  
    
    dequeue: =>
 
        if @queue.length
            @executeCmd @queue.shift()
        else if @inputQueue.length
            cmd = @inputQueue.shift()
            @editor.insertSingleLine cmd
            @execute cmd
        else
            @onDone()
        
    #  0000000  000000000  0000000    
    # 000          000     000   000  
    # 0000000      000     000   000  
    #      000     000     000   000  
    # 0000000      000     0000000    
    
    onStdOut: (data) =>
        
        if not data.replace?
            data = data.toString 'utf8'
        if data[-1] == '\n'
            data = data[0..data.length-2]
            
        @editor.appendOutput data
        @editor.singleCursorAtEnd()

    onStdErr: (data) =>

        @errorText += data
        
module.exports = Shell
