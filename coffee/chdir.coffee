###
 0000000  000   000  0000000    000  00000000   
000       000   000  000   000  000  000   000  
000       000000000  000   000  000  0000000    
000       000   000  000   000  000  000   000  
 0000000  000   000  0000000    000  000   000  
###

{ slash, post, prefs, kerror, klog } = require 'kxk'

Cmmd = require './cmmd'

class Chdir extends Cmmd
    
    @: -> 
        
        super
        @lastDir = '~'

    onCommand: (cmd) ->
                
        if cmd in ['cd' '~']
            cmd = 'cd ~'
        else if cmd in ['cd..' '..']
            cmd = 'cd ..'
        else if cmd in ['cd.' '.']
            cmd = 'cd .'
        else if cmd in ['cd -' 'cd-' '-']
            cmd = "cd #{@lastDir}"
            
        if cmd.startsWith 'cd '
            dir = slash.resolve cmd.slice(3).trim()
            try 
                cwd = process.cwd()
                process.chdir dir
                prefs.set 'cwd' dir
                @term.tab.update slash.tilde dir
                @lastDir = cwd if cwd != dir
                return true
            catch err
                kerror "#{err}"
                
    onFallback: (cmd) ->
        
        if slash.isDir slash.join process.cwd(), cmd
            @onCommand 'cd ' + cmd
        
module.exports = Chdir
