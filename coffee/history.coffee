###
000   000  000   0000000  000000000   0000000   00000000   000   000
000   000  000  000          000     000   000  000   000   000 000 
000000000  000  0000000      000     000   000  0000000      00000  
000   000  000       000     000     000   000  000   000     000   
000   000  000  0000000      000      0000000   000   000     000   
###

{ empty, post, prefs, kstr, klog } = require 'kxk'

class History

    @list = []
    
    @init: =>
        
        @list = prefs.get 'history▸list' []
        post.on 'cmd' @onCmd
        
    @onCmd: (cmd) =>
        
        return if cmd in ['h''history''c''clear']
        return if cmd == @list[-1]
        
        if @list.length 
            for i in [@list.length-2..0]
                if @list[i] == cmd
                    @list.splice i, 1
                    post.emit 'history splice' i
                    break
        
        @list.push cmd
        prefs.set 'history▸list' @list
        
    @clear: =>
        
        @list = []
        prefs.set 'history▸list' @list
    
    @: (@term) ->
        
        post.on 'history splice' @onSplice
        @editor = @term.editor
        @index = -1
       
    onCmd: (cmd) ->
        
        if @index >= 0
            if cmd != History.list[@index]
                @index = -1
        
    onSplice: (index) =>
        
        if @index > 0 and @index >= index
            @index--
        
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
            @editor.insertSingleLine ''
            return
        @show +1
        
    show: (d) ->
        
        ll = History.list.length
        @index = (@index+ll+d) % ll
        @editor.insertSingleLine History.list[@index]

    list: ->
        
        for i in [0...History.list.length]
            @editor.appendOutput "#{kstr.rpad i, 3} #{History.list[i]}"
        
module.exports = History
