###
 0000000   000      000   0000000    0000000
000   000  000      000  000   000  000     
000000000  000      000  000000000  0000000 
000   000  000      000  000   000       000
000   000  0000000  000  000   000  0000000 
###

{ post, klog } = require 'kxk'

Cmmd = require './cmmd'

class Alias extends Cmmd

    onCommand: (cmd) ->
        
        switch cmd
            when 'c' 'cls' 'clear' then return post.emit 'menuAction' 'Clear'
            when 'blink' then return @newLine @editor.toggleBlink()
            when 'alias' then return @newLine @alias cmd

        # klog 'cmd' cmd
        
    alias: (cmd) ->    
        
        if cmd == 'alias'
            @editor.appendText ['c''cls''clear'].join '\n'
    
module.exports = Alias
