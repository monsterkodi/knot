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
                @term.pwd()
                @lastDir = cwd if cwd != dir
                return @newLine()
            catch err
                kerror "#{err}"
                
    onFallback: (cmd) ->
        
        dir = slash.join process.cwd(), cmd
        if slash.isDir dir
            @onCommand 'cd ' + cmd
            return true
        
module.exports = Chdir
