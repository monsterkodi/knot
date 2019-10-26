###
 0000000   000      000   0000000    0000000
000   000  000      000  000   000  000     
000000000  000      000  000000000  0000000 
000   000  000      000  000   000       000
000   000  0000000  000  000   000  0000000 
###

{ slash, post, klog } = require 'kxk'

Cmmd = require './cmmd'

class Alias extends Cmmd

    onCommand: (cmd) ->
        
        switch cmd
            when 'c' 'cls' 'clear' then return post.emit 'menuAction' 'Clear'
            when 'pwd'   then return @newLine @pwd()
            when 'blink' then return @newLine @editor.toggleBlink()
            when 'alias' then return @newLine @alias cmd
            when 'k'  then return @shell.executeCommand 'konrad'
            when 'ks' then return @shell.executeCommand 'konrad -s'
            when 'kd' then return @shell.executeCommand 'konrad -d'
            when 'ki' then return @shell.executeCommand 'konrad -i'
            when 'km' then return @shell.executeCommand 'konrad -m'
            when 'kR' then return @shell.executeCommand 'konrad -R'

        # klog 'cmd' cmd
        
    pwd: ->
            
        # printf " ▶ "
        b = '[48;5;235m'
        '[38;5;238m'
        '[38;5;147m'
        a = '[38;5;235m[49m\ue0b0'
            
        @shell.term.appendAnsi b+slash.tilde(process.cwd())+a
        
    alias: (cmd) ->    
        
        if cmd == 'alias'
            @editor.appendText ['c''cls''clear'].join '\n'
    
module.exports = Alias
