###
 0000000  000   000  00000000  000      000    
000       000   000  000       000      000    
0000000   000000000  0000000   000      000    
     000  000   000  000       000      000    
0000000   000   000  00000000  0000000  0000000
###

{ post, history, childp, slash, valid, empty, args, os, klog, _ } = require 'kxk'

History = require './history'
Alias   = require './alias'
Chdir   = require './chdir'
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
        @queue = []
        @inputQueue = []
    
        @initPath()
    
    # 00000000    0000000   000000000  000   000  
    # 000   000  000   000     000     000   000  
    # 00000000   000000000     000     000000000  
    # 000        000   000     000     000   000  
    # 000        000   000     000     000   000  
    
    initPath: ->
        
        sep = ';'
        
        # klog 'SHELL' process.env.SHELL
        
        if os.platform() != 'win32' #or process.env.SHELL
            sep = ':'        
            
        pth = process.env.PATH.split(sep).map (s) -> slash.path s

        for a in ['node_modules/.bin' 'bin' '.']
            if a not in pth
                # klog "add to PATH #{a}"
                pth.unshift a
                
        if slash.isDir '~/s'
            for f in slash.list '~/s'
                if f.type == 'dir'
                    exeDir = slash.join f.file, "#{f.name}-#{process.platform}-#{process.arch}"
                    if slash.isDir exeDir
                        # klog "add exe dir" exeDir
                        pth.push exeDir
                        continue
                    binDir = slash.join f.file, "bin"
                    if slash.isDir binDir
                        # klog "add bin dir" binDir
                        pth.push binDir
                
        process.env.PATH = pth.map((s) -> slash.unslash s).join sep
        
        klog 'PATH' process.env.PATH
        
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
    
    shellCmd: (@cmd) =>
            
        process.env.LINES   = @editor.scroll.fullLines
        process.env.COLUMNS = parseInt @editor.layersWidth / @editor.size.charWidth
        
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
        
        return 'unhandled' if not @child
        
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
