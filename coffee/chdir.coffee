###
 0000000  000   000  0000000    000  00000000   
000       000   000  000   000  000  000   000  
000       000000000  000   000  000  0000000    
000       000   000  000   000  000  000   000  
 0000000  000   000  0000000    000  000   000  
###

{ slash, prefs, kstr, kerror } = require 'kxk'

Cmmd = require './cmmd'

class Chdir extends Cmmd
    
    @: -> 
        
        super
        @lastDir = '~'

    onCommand: (cmd) ->
                
        if cmd in ['cd']
            cmd = 'cd ~'
        else if cmd in ['cd..']
            cmd = 'cd ..'
        else if cmd in ['cd.']
            cmd = 'cd .'
        else if cmd in ['cd -' 'cd-' '-']
            cmd = "cd #{@lastDir}"
            
        if not cmd.startsWith 'cd '
            cmd = 'cd ' + cmd

        dir = slash.resolve kstr.strip cmd.slice(3), ' "'
        return false if not slash.isDir dir
        
        try 
            cwd = process.cwd()
            process.chdir dir
            tld = slash.tilde dir
            prefs.set 'cwd' tld
            @term.tab.update tld
            @lastDir = tld if cwd != tld
            @shell.last?.chdir = tld # special brain handling
            return true
        catch err
            kerror "#{err}"
                
    onFallback: (cmd) ->
        
        if slash.isDir slash.join process.cwd(), cmd
            @onCommand 'cd ' + cmd
        
module.exports = Chdir
