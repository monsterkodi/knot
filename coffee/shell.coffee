###
 0000000  000   000  00000000  000      000    
000       000   000  000       000      000    
0000000   000000000  0000000   000      000    
     000  000   000  000       000      000    
0000000   000   000  00000000  0000000  0000000
###

{ post, history, childp, slash, valid, empty, args, klog, _ } = require 'kxk'

History = require './history'
Alias   = require './alias'
Chdir   = require './chdir'
Paths   = require './paths'
psTree  = require 'ps-tree'
wxw     = require 'wxw'

class Shell

    @: (@term) ->
        
        @shellPath = 'C:/msys64/usr/bin/bash.exe'
        if not slash.fileExists @shellPath
            @shellPath = true
        
        @editor = @term.editor
        @alias = new Alias @
        @chdir = new Chdir @
        @paths = new Paths @
        @queue = []
        @inputQueue = []
    
        @paths.init()
            
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
    
        if @cmd == '.' and valid fallback
            @cmd = fallback
        
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
            
        if empty @cmd 
            @term.moveInputMeta()
            return
        
        @term.history.shellCmd @cmd # reset history pointer to last

        @last =
            cmd:      @cmd
            cwd:      slash.tilde process.cwd()
            meta:     @term.insertCmdMeta @editor.numLines()-2 @cmd
            
        @last.fallback = fallback if fallback
        
        @executeCmd @substitute @cmd
                
    # 00000000  000   000  00000000   0000000        0000000  00     00  0000000    
    # 000        000 000   000       000            000       000   000  000   000  
    # 0000000     00000    0000000   000            000       000000000  000   000  
    # 000        000 000   000       000            000       000 0 000  000   000  
    # 00000000  000   000  00000000   0000000        0000000  000   000  0000000    
    
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
                    
    #  0000000  000   000  00000000  000      000           0000000  00     00  0000000    
    # 000       000   000  000       000      000          000       000   000  000   000  
    # 0000000   000000000  0000000   000      000          000       000000000  000   000  
    #      000  000   000  000       000      000          000       000 0 000  000   000  
    # 0000000   000   000  00000000  0000000  0000000       0000000  000   000  0000000    
    
    seperateCmdArgs: (cmd) ->
        
        next = (c, s) -> 
            n = cmd.indexOf c, s+1
            n = cmd.length if n<0
            n
        i = next ' '  0
        n = next '"', -1
        if n < i then i = 1 + next '"' n
        exe = cmd[0...i]
        args = []
        while i++ < cmd.length
            if cmd[i] != ' '
                if cmd[i] == '"'
                    n = next '"' i
                    args.push cmd[i...n]
                else
                    n = next ' ' i
                    args.push cmd[i...n]
                i = n
        [exe, args]        
    
    shellCmd: (@cmd) =>
            
        process.env.LINES   = @editor.scroll.fullLines
        process.env.COLUMNS = parseInt @editor.layersWidth / @editor.size.charWidth
        process.env.ADBLOCK = true
        
        if @cmd.endsWith '&'
            
            [cmd, args] = @seperateCmdArgs @cmd[0...@cmd.length-1]
                
            # klog "detach |#{cmd}|" args
            @spawn = childp.spawn cmd, args, detached:true, shell:@shellPath, env:process.env, cwd:process.cwd()    
            @last.meta.pid = @spawn.pid
            @spawn.on 'close' ((pid) => (code) => 
                    klog 'spawn exit' code, pid
                    for meta in @editor.meta.metasOfClass 'succ'
                        if meta.pid == pid
                            meta[2].number.text = '▶'
                            meta[2].number.clss = 'succ'
                            @editor.meta.update meta
                            break
                ) @spawn.pid
            @onDone 'busy'
        else
        
            @child = childp.exec @cmd, shell:@shellPath, env:process.env, cwd:process.cwd()    
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
        
        @queue = []
        @inputQueue = []
        
        klog 'handleCancel' @child.pid
        
        if not @child
            klog 'no child?'
            return 'unhandled'
        
        psTree @child.pid, (err, children) =>
            
            args = children.map (p) -> p.PID
            args.unshift @child.pid
            args.reverse()
            @child.kill()
            for arg in args
                wxw 'terminate' arg
        true
        
    # 00000000  000   000  000  000000000  
    # 000        000 000   000     000     
    # 0000000     00000    000     000     
    # 000        000 000   000     000     
    # 00000000  000   000  000     000     
        
    onExit: (code) =>

        # klog 'onExit' @child.pid
        killed = @child.killed
        delete @child
        
        if code == 0 or killed 
            setImmediate @onDone
        else if @fallback()
            @dequeue()
        else
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
            if @last?.meta?
                info = _.clone @last
                delete info.meta
                post.emit 'cmd' info # insert into global history and brain
                @term.succMeta @last.meta, lastCode
        if empty(@queue) and empty(@inputQueue)
            @term.pwd()
        else
            @dequeue()
           
    # 00000000  000   000   0000000   000   000  00000000  000   000  00000000  
    # 000       0000  000  000   000  000   000  000       000   000  000       
    # 0000000   000 0 000  000 00 00  000   000  0000000   000   000  0000000   
    # 000       000  0000  000 0000   000   000  000       000   000  000       
    # 00000000  000   000   00000 00   0000000   00000000   0000000   00000000  
    
    enqueue: (cmd:'' front:false update:false alias:false) -> 
    
        if update
            @last.orig = @last.cmd
            @last.cmd = cmd
            if @last.meta
                @editor.replaceTextInLine @last.meta[0], cmd
                @editor.meta.update @last.meta
            
        if alias
            @last.alias = cmd
                
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
        
        if data[-1] == '\n'
            data = data[0..data.length-2]

        # data = data.replace /(\x1B\[\?25[hl])|(\x0a)/g, ''
            
        # buf = Buffer.from data, 'utf8'
        # for c in buf
            # klog "#{kstr.pad c, 3} 0x#{c.toString(16)} '#{String.fromCharCode(c)}'"
            
        # klog '================' data
            
        @editor.appendOutput data
        # @editor.setInputText @editor.lastLine()+data
        @editor.singleCursorAtEnd()

    onStdErr: (data) =>

        # klog '----------------' data
        
        # buf = Buffer.from data, 'utf8'
        # for c in buf
            # klog "#{kstr.pad c, 3} 0x#{c.toString(16)} '#{String.fromCharCode(c)}'"
        
        if data.startsWith '\x1b]0;'
            klog 'bash prompt'
            data = data[4..]
            i = 0
            c = data[0]
            path = ''
            while c != '\x07'
                path += c
                c = data[i++]
            klog 'path' path
            @editor.appendOutput data[i..]
        else   
            @errorText += data
        
module.exports = Shell
