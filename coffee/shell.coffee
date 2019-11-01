###
 0000000  000   000  00000000  000      000    
000       000   000  000       000      000    
0000000   000000000  0000000   000      000    
     000  000   000  000       000      000    
0000000   000   000  00000000  0000000  0000000
###

{ post, history, childp, slash, empty, args, klog, _ } = require 'kxk'

History = require './history'
Alias   = require './alias'
Chdir   = require './chdir'
psTree  = require 'ps-tree'
wxw     = require 'wxw'

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
        
    substitute: (cmd) ->
        
        cmd = @alias.substitute cmd
        cmd = cmd.replace /\~/g, slash.home()
        cmd
            
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000  
    # 000        000 000   000       000       000   000     000     000       
    # 0000000     00000    0000000   000       000   000     000     0000000   
    # 000        000 000   000       000       000   000     000     000       
    # 00000000  000   000  00000000   0000000   0000000      000     00000000  
    
    execute: (@cmd:, fallback:) =>
    
        @cmd ?= @editor.lastLine()
        @cmd = @cmd.trim()
        
        if @child
            @inputQueue.push @cmd
            @editor.setInputText ''
            return
        
        @errorText = ''
        
        if @cmd != hsub = History.substitute @cmd
            @cmd = hsub
            @editor.setInputText @cmd
        
        @editor.appendText ''
        @editor.singleCursorAtEnd()
            
        if empty @cmd then return
        
        @term.history.shellCmd @cmd # might reset history pointer to last

        @last =
            cmd:      @cmd
            cwd:      process.cwd()
            meta:     @term.insertCmdMeta @editor.numLines()-2 @cmd
            
        @last.fallback = fallback if fallback
        
        @executeCmd @substitute @cmd
                
    # 00000000  000   000  00000000   0000000        0000000  00     00  0000000    
    # 000        000 000   000       000            000       000   000  000   000  
    # 0000000     00000    0000000   000            000       000000000  000   000  
    # 000        000 000   000       000            000       000 0 000  000   000  
    # 00000000  000   000  00000000   0000000        0000000  000   000  0000000    
    
    executeCmd: (@cmd) =>
        klog 'executeCmd' @cmd
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
            
            klog 'chdir' @cmd
            @dequeue()
            return true
            
        klog 'shellCmd' @cmd    
        @shellCmd @cmd
                    
    #  0000000  000   000  00000000  000      000           0000000  00     00  0000000    
    # 000       000   000  000       000      000          000       000   000  000   000  
    # 0000000   000000000  0000000   000      000          000       000000000  000   000  
    #      000  000   000  000       000      000          000       000 0 000  000   000  
    # 0000000   000   000  00000000  0000000  0000000       0000000  000   000  0000000    
    
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
        
    #  0000000   0000000   000   000   0000000  00000000  000      
    # 000       000   000  0000  000  000       000       000      
    # 000       000000000  000 0 000  000       0000000   000      
    # 000       000   000  000  0000  000       000       000      
    #  0000000  000   000  000   000   0000000  00000000  0000000  
    
    handleCancel: ->
        
        return 'unhandled' if not @child
        
        psTree @child.pid, (err, children) =>
            
            args = children.map (p) -> p.PID
            args.unshift @child.pid
            args.reverse()
            @child.kill()
            for arg in args
                klog arg, wxw 'terminate' arg
        true
        
    # 00000000  000   000  000  000000000  
    # 000        000 000   000     000     
    # 0000000     00000    000     000     
    # 000        000 000   000     000     
    # 00000000  000   000  000     000     
        
    onExit: (code) =>

        killed = @child.killed
        # klog 'onExit' @child.pid, killed and 'killed' or code
        delete @child
        if code == 0 or killed 
            setImmediate @onDone
        else if @fallback()
            @dequeue()
        else
            klog 'exit fail' @last
            @term.failMeta @last.meta
            if not /is not recognized/.test @errorText
                @editor.appendOutput '\n'+@errorText
            @dequeue 'fail'
          
    # 00000000   0000000   000      000      0000000     0000000    0000000  000   000  
    # 000       000   000  000      000      000   000  000   000  000       000  000   
    # 000000    000000000  000      000      0000000    000000000  000       0000000    
    # 000       000   000  000      000      000   000  000   000  000       000  000   
    # 000       000   000  0000000  0000000  0000000    000   000   0000000  000   000  
    
    fallback: ->
        
        if @last.fallback
            klog 'fallback' @last.fallback
            @enqueue cmd:@last.fallback, update:true
            delete @last.fallback
            return true
        
    # 0000000     0000000   000   000  00000000  
    # 000   000  000   000  0000  000  000       
    # 000   000  000   000  000 0 000  0000000   
    # 000   000  000   000  000  0000  000       
    # 0000000     0000000   000   000  00000000  
    
    onDone: (lastCode) =>

        if lastCode != 'fail' 
            if @last.meta?
                info = _.clone @last
                delete info.meta
                post.emit 'cmd' info # insert into global history and brain
                @term.succMeta @last.meta
        if empty(@queue) and empty(@inputQueue)
            @term.pwd()
        else
            @dequeue()
           
    # 00000000  000   000   0000000   000   000  00000000  000   000  00000000  
    # 000       0000  000  000   000  000   000  000       000   000  000       
    # 0000000   000 0 000  000 00 00  000   000  0000000   000   000  0000000   
    # 000       000  0000  000 0000   000   000  000       000   000  000       
    # 00000000  000   000   00000 00   0000000   00000000   0000000   00000000  
    
    enqueue: (cmd:'' front:false update:false) -> 
    
        if update
            @last.cmd = cmd
            if @last.meta
                @editor.replaceTextInLine @last.meta[0], cmd
                @editor.meta.update @last.meta
            
        cmd = cmd.replace /\~/g, slash.home()
        
        if front
            @queue.unshift cmd
        else
            @queue.push cmd
        cmd
                    
    # 0000000    00000000   0000000   000   000  00000000  000   000  00000000  
    # 000   000  000       000   000  000   000  000       000   000  000       
    # 000   000  0000000   000 00 00  000   000  0000000   000   000  0000000   
    # 000   000  000       000 0000   000   000  000       000   000  000       
    # 0000000    00000000   00000 00   0000000   00000000   0000000   00000000  
    
    dequeue: (lastCode) =>
 
        if @queue.length
            @executeCmd @queue.shift()
        else if @inputQueue.length
            cmd = @inputQueue.shift()
            @editor.setInputText cmd
            @execute cmd
        else
            @onDone lastCode
        
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
