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
    
    @: ->
        
        @alias = 
            a:      'alias'
            c:      'clear'
            cls:    'clear'
            k:      'konrad'
            ks:     'k -s'
            kd:     'k -d'
            kc:     'k -c'
            kb:     'k -b'
            kf:     'k -f'
            ki:     'k -i'
            kp:     'k -p'
            km:     'k -m'
            kR:     'k -R'
            l:      'color-ls'
            ls:     'color-ls'
            la:     'l -a'
            ll:     'l -l'
            p:      'pwd'
            e:      'electron .'
        super

    onCommand: (cmd) ->
        
        for a in Object.keys @alias
            if cmd == a or cmd.startsWith a + ' '
                return @shell.executeAlias @alias[a] + cmd[a.length..]
        
        switch cmd
            when 'clear' then return post.emit 'menuAction' 'Clear'
            when 'pwd'   then return @newLine @shell.term.pwd()
            when 'blink' then return @newLine @editor.toggleBlink()
            when 'alias' then return @newLine @aliasCmd cmd
                                
    aliasCmd: (cmd) ->    
        
        if cmd == 'alias'
            for k,v of @alias
                @editor.appendText "#{k} #{v}"
    
module.exports = Alias
