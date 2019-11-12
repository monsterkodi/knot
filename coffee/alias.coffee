###
 0000000   000      000   0000000    0000000
000   000  000      000  000   000  000     
000000000  000      000  000000000  0000000 
000   000  000      000  000   000       000
000   000  0000000  000  000   000  0000000 
###

{ slash, empty } = require 'kxk'

Cmmd    = require './cmmd'
History = require './history'

class Alias extends Cmmd
    
    @: ->
        
        @alias = 
            a:      'alias'
            b:      'brain'
            c:      'clear'
            h:      'history'
            k:      '~/s/konrad/bin/konrad'
            cls:    'clear'
            cl:     'c&&l'
            cdl:    'cd $$ && clear && l'
            nl:     'npm ls --depth 0 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon'
            ng:     'npm ls --depth 0 -g 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon'
            ni:     'npm install --loglevel silent 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon && nl'
            na:     'npm install --save $$ 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon'
            nd:     'npm install --save-dev $$ 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon'
            nr:     'npm uninstall --save $$ 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon'
            ks:     'k -s'
            kd:     'k -d'
            kc:     'k -c'
            kb:     'k -b'
            kf:     'k -f'
            kt:     'k -t'
            ku:     'k -u'
            ki:     'k -i'
            kp:     'k -p'
            km:     'k -m'
            kR:     'k -R'
            l:      'color-ls -n'
            ls:     'color-ls -n'
            la:     'l -a'
            ll:     'l -l'
            lla:    'l -la'
            lso:    'c:/msys64/usr/bin/ls.EXE'
            sl:     'ls'
            al:     'la'
            all:    'lla'
            e:      'electron .'
            ed:     'e -D'
            ps:     'wmic PROCESS GET Name,ProcessId,ParentProcessId'
            gimp:   '"C:/Program Files/GIMP 2/bin/gimp-2.10.exe"'
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
                return @shell.enqueue cmd:@alias[a] + cmd[a.length..], front:true, alias:true
        
        if cmd == 'history' or cmd.startsWith 'history ' then return @histCmd  cmd
        if cmd == 'brain'   or cmd.startsWith 'brain '   then return @brainCmd cmd
        if cmd == 'alias'   or cmd.startsWith 'alias '   then return @aliasCmd cmd
        if cmd == 'path'    or cmd.startsWith 'path '    then return @pathsCmd cmd
                
        switch cmd
            when 'clear'   then return @term.clear()
            when 'cwd'     then return @editor.appendOutput slash.path process.cwd()
            when 'blink'   then return @editor.toggleBlink()

    pathsCmd: (cmd) ->
        
        arg = cmd[6..].trim()
        arg = 'list' if empty arg
        @shell.paths.cmd @editor, arg
            
    aliasCmd: (cmd) ->    
        
        if cmd == 'alias'
            for k,v of @alias
                @editor.appendOutput "#{k} #{v}"
        true

    brainCmd: (cmd) ->
        
        arg = cmd[6..].trim()
        arg = 'list' if empty arg
        window.brain.cmd @editor, arg
        
    histCmd: (cmd) ->
        
        arg = cmd[8..].trim()
        arg = 'list' if empty arg
        switch arg
            when 'clear' then History.clear()
            else return @term.history.cmd arg
        true
                    
module.exports = Alias
