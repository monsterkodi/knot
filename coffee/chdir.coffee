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
        
        dir = slash.resolve cmd.slice(3).trim()
        
        return false if not slash.isDir dir
        
        try 
            cwd = process.cwd()
            # klog 'chdir' dir
            process.chdir dir
            prefs.set 'cwd' dir
            @term.tab.update slash.tilde dir
            @lastDir = cwd if cwd != dir
            @shell.last.chdir = true # prevents brain handling
            return true
        catch err
            kerror "#{err}"
                
    onFallback: (cmd) ->
        
        if slash.isDir slash.join process.cwd(), cmd
            @onCommand 'cd ' + cmd
        
module.exports = Chdir
