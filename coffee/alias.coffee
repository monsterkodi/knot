###
 0000000   000      000   0000000    0000000
000   000  000      000  000   000  000     
000000000  000      000  000000000  0000000 
000   000  000      000  000   000       000
000   000  0000000  000  000   000  0000000 
###

{ slash, post, klog } = require 'kxk'

Cmmd    = require './cmmd'
History = require './history'

class Alias extends Cmmd
    
    @: ->
        
        @alias = 
            a:      'alias'
            c:      'clear'
            cls:    'clear'
            cl:     'c&&l'
            cdl:    'cd $$ && clear && l'
            h:      'history'
            k:      'konrad'
            nl:     'npm ls --depth 0 | node c:/Users/kodi/s/colorcat/bin/colorcat -sP c:/Users/kodi/s/konrad/cc/npm.noon'
            ng:     'npm ls --depth 0 -g | node c:/Users/kodi/s/colorcat/bin/colorcat -sP c:/Users/kodi/s/konrad/cc/npm.noon'
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
            lla:    'l -la'
            p:      'pwd'
            e:      'electron .'
        super

    substitute: (cmd) ->
        
        for a in Object.keys @alias
            if cmd.startsWith a + ' '
                alias = @alias[a]
                if alias.indexOf('$$') >= 0
                    return alias.replace '$$' cmd[a.length+1..].trim()
        cmd
        
    onCommand: (cmd) ->
        
        for a in Object.keys @alias
            if cmd == a or cmd.startsWith a + ' '
                return @shell.executeCmd @alias[a] + cmd[a.length..]
        
        if cmd == 'history' or cmd.startsWith 'history '
            return @newLine @histCmd cmd
                
        switch cmd
            when 'clear'   then return post.emit 'menuAction' 'Clear'
            when 'pwd'     then return @newLine @shell.term.pwd()
            when 'blink'   then return @newLine @editor.toggleBlink()
            when 'alias'   then return @newLine @aliasCmd cmd
                                
    aliasCmd: (cmd) ->    
        
        if cmd == 'alias'
            for k,v of @alias
                @editor.appendText "#{k} #{v}"
                
    histCmd: (cmd) ->
        
        if cmd == 'history'
            @term.history.list()
        else
            arg = cmd[8..].trim()
            switch cmd
                when 'clear' then History.clear()
                else @term.history.cmd arg
                    
module.exports = Alias
