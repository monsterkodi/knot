###
 0000000   000      000   0000000    0000000
000   000  000      000  000   000  000     
000000000  000      000  000000000  0000000 
000   000  000      000  000   000       000
000   000  0000000  000  000   000  0000000 
###

{ post, klog } = require 'kxk'

class Alias

    @: (@shell) ->
        
    onCommand: (cmd) ->
        
        switch cmd
            when 'c' 'cls' 'clear' then return post.emit 'menuAction' 'Clear'
            when 'alias' then return @alias cmd

        # klog 'cmd' cmd
        
    alias: (cmd) ->    
        
        if cmd == 'alias'
            @shell.term.editor.appendText ['c''cls''clear'''].join '\n'
            return true
    
module.exports = Alias
