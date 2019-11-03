###
000   000  000   0000000  000000000   0000000   00000000   000   000
000   000  000  000          000     000   000  000   000   000 000 
000000000  000  0000000      000     000   000  0000000      00000  
000   000  000       000     000     000   000  000   000     000   
000   000  000  0000000      000      0000000   000   000     000   
###

{ post, matchr, prefs, empty, kstr } = require 'kxk'

class History

    # 000      000   0000000  000000000  
    # 000      000  000          000     
    # 000      000  0000000      000     
    # 000      000       000     000     
    # 0000000  000  0000000      000     
    
    @list = []
    
    @init: =>
        
        @list = prefs.get 'history' []
        post.on 'cmd' @onCmd
        
    @onCmd: (cmd:) => # cmd did succeed
        
        return if cmd in ['h''history''c''clear']
        return if cmd[0] == '!'
        return if cmd == @list[-1]
        
        if @list.length 
            for i in [@list.length-2..0]
                if @list[i] == cmd
                    @list.splice i, 1
                    post.emit 'history splice' i
                    break
        
        @list.push cmd
        prefs.set 'history' @list
        
    @substitute: (cmd) ->
        if cmd == '!'
            return @list[-1]
        for rng in matchr.ranges(/!-?\d+/, cmd).reverse()
            index = parseInt rng.match[1..]
            index += @list.length if index < 0
            if hst = @list[index]
                cmd = cmd.splice rng.start, rng.match.length, hst
        cmd
        
    @clear: =>
        
        @list = []
        prefs.set 'history' @list
    
    # 000000000  00000000  00000000   00     00  
    #    000     000       000   000  000   000  
    #    000     0000000   0000000    000000000  
    #    000     000       000   000  000 0 000  
    #    000     00000000  000   000  000   000  
    
    @: (@term) ->
        
        post.on 'history splice' @onSplice
        @editor = @term.editor
        @index = -1
       
    shellCmd: (cmd) -> # cmd will execute in shell
        
        @index = -1
        
    cmd: (arg) -> # history command
    
        [arg, rest...] = arg.split ' '
    
        switch arg
            when 'list' then @list()
        true
                
    onSplice: (index) =>
        
        if @index > 0 and @index >= index
            @index--

    list: -> 
        
        @editor.appendOutput ("#{kstr.rpad i, 3} #{History.list[i]}" for i in [0...History.list.length]).join '\n'
            
    prev: ->

        if @index == 0 or empty History.list
            return
        if @index < 0
            @show 0
            return
        @show -1
        
    next: -> 

        if @index < 0 or empty History.list
            return
        if @index+1 >= History.list.length
            @index = -1 
            @editor.setInputText ''
            return
        @show +1
        
    show: (d) ->
        
        ll = History.list.length
        @index = (@index+ll+d) % ll
        @editor.setInputText History.list[@index]
        
module.exports = History
