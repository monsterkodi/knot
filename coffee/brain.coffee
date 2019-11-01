###
0000000    00000000    0000000   000  000   000
000   000  000   000  000   000  000  0000  000
0000000    0000000    000000000  000  000 0 000
000   000  000   000  000   000  000  000  0000
0000000    000   000  000   000  000  000   000
###

{ post, kerror, prefs, valid, klog, kstr } = require 'kxk'

class Brain

    @: ->
        
        @splitRegExp = /\s+/g
        
        @args = prefs.get 'brain▸args' {}
        @cmds = prefs.get 'brain▸cmds' {}
        @dirs = prefs.get 'brain▸dirs' {}
        
        post.on 'cmd' @onCmd
            
    onCmd: (info) =>
        
        return if info.chdir
        
        @addCmd info
        @addArg info
            
    addCmd: (cmd:, cwd:) ->
        
        if cmd[-1] == '/' then cmd = cmd[..cmd.length-2]
        
        return if cmd?.length < 2
        
        info       = @cmds[cmd] ? {}
        info.count = (info.count ? 0) + 1
        info.dirs ?= {}
        info.dirs[cwd] = (info.dirs[cwd] ? 0) + 1
        @cmds[cmd] = info
        
        @dirs[cwd] ?= {}
        @dirs[cwd][cmd] = (@dirs[cwd][cmd] ? 0) + 1

        prefs.set 'brain▸cmds' @cmds
        prefs.set 'brain▸dirs' @dirs
        
    addArg: (cmd:) ->
        
        argl = cmd.split @splitRegExp
        key = argl[0]
        argl.shift()

        info       = @args[key] ? {}
        info.count = (info.count ? 0) + 1
        info.args ?= {}
        
        for arg in argl
            argi = info.args[arg] ? {}
            argi.count = (argi.count ? 0) + 1
            info.args[arg] = argi
            
        @args[key] = info
       
        prefs.set 'brain▸args' @args if valid @args
        
    cmd: (editor, cmd) ->
            
        switch cmd
            when 'list'  then @list editor
            when 'clear' then @clear()
            when 'cmds' 'args' 'dirs' then @list editor, cmd
        
    clear: => 
        
        @args = {}
        @cmds = {}
        @dirs = {}
        true
        
    list: (editor, key) ->
        
        if not key
            @list editor, 'args'
            @list editor, 'cmds'
            @list editor, 'dirs'
        else        
            editor?.appendOutput "\n------- #{key}"
            editor?.appendOutput kstr @[key]
        true

module.exports = Brain
