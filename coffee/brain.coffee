###
0000000    00000000    0000000   000  000   000
000   000  000   000  000   000  000  0000  000
0000000    0000000    000000000  000  000 0 000
000   000  000   000  000   000  000  000  0000
0000000    000   000  000   000  000  000   000
###

{ post, prefs, valid, kstr } = require 'kxk'

class Brain

    @: ->
        
        @splitRegExp = /\s+/g
        
        @args = prefs.get 'brain▸args' {}
        @dirs = prefs.get 'brain▸dirs' {}
        @cd   = prefs.get 'brain▸cd' {}
        
        post.on 'cmd' @onCmd
            
    #  0000000   000   000   0000000  00     00  0000000    
    # 000   000  0000  000  000       000   000  000   000  
    # 000   000  000 0 000  000       000000000  000   000  
    # 000   000  000  0000  000       000 0 000  000   000  
    #  0000000   000   000   0000000  000   000  0000000    
    
    onCmd: (info) =>
        
        # klog info
        
        if info.chdir
            @addCd info
            return 
        
        for c in ['ls' 'lso' 'dir' 'pwd' 'cwd']
            return if info.cmd == c
            return if info.cmd.startsWith c+' '
            
        for c in ['color-ls']
            return if info.alias == c
            return if info.alias?.startsWith c+' '
        
        @addCmd info
        @addArg info
            
    #  0000000  0000000    
    # 000       000   000  
    # 000       000   000  
    # 000       000   000  
    #  0000000  0000000    
    
    addCd: (chdir:, cwd:) ->
        
        return if chdir?.length < 2
        return if chdir == cwd
        
        @cd[cwd] ?= {}
        @cd[cwd][chdir] = (@cd[cwd][chdir] ? 0) + 1

        prefs.set 'brain▸cd' @cd
        
    #  0000000  00     00  0000000    
    # 000       000   000  000   000  
    # 000       000000000  000   000  
    # 000       000 0 000  000   000  
    #  0000000  000   000  0000000    
    
    addCmd: (cmd:, cwd:) ->
        
        if cmd[-1] == '/' then cmd = cmd[..cmd.length-2]
        
        return if cmd?.length < 2
        
        @dirs[cwd] ?= {}
        @dirs[cwd][cmd] = (@dirs[cwd][cmd] ? 0) + 1

        prefs.set 'brain▸dirs' @dirs
        
    #  0000000   00000000    0000000   
    # 000   000  000   000  000        
    # 000000000  0000000    000  0000  
    # 000   000  000   000  000   000  
    # 000   000  000   000   0000000   
    
    addArg: (cmd:) ->
        
        argl = cmd.split @splitRegExp
        key = argl[0]
        argl.shift()

        info       = @args[key] ? {}
        info.count = (info.count ? 0) + 1
        info.args ?= {}
        
        for arg in argl
            info.args[arg] = (info.args[arg] ? 0) + 1
            # argi = info.args[arg] ? {}
            # argi.count = (argi.count ? 0) + 1
            # info.args[arg] = argi
            
        @args[key] = info
       
        prefs.set 'brain▸args' @args if valid @args
        
    #  0000000  00     00  0000000    
    # 000       000   000  000   000  
    # 000       000000000  000   000  
    # 000       000 0 000  000   000  
    #  0000000  000   000  0000000    
    
    cmd: (editor, cmd) ->
            
        switch cmd
            when 'list'  then @list editor
            when 'clear' then @clear()
            when 'args' 'dirs' 'cd' then @list editor, cmd
        
    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clear: => 
        
        @args = {}
        @dirs = {}
        @cd   = {}
        true
        
    # 000      000   0000000  000000000  
    # 000      000  000          000     
    # 000      000  0000000      000     
    # 000      000       000     000     
    # 0000000  000  0000000      000     
    
    list: (editor, key) ->
        
        if not key
            @list editor, 'args'
            @list editor, 'dirs'
            @list editor, 'cd'
        else        
            editor?.appendOutput "\n------- #{key}"
            editor?.appendOutput kstr @[key]
        true

module.exports = Brain
