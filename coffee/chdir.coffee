###
 0000000  000   000  0000000    000  00000000   
000       000   000  000   000  000  000   000  
000       000000000  000   000  000  0000000    
000       000   000  000   000  000  000   000  
 0000000  000   000  0000000    000  000   000  
###

{ slash, post, kerror, klog } = require 'kxk'

Cmmd = require './cmmd'

class Chdir extends Cmmd

    onCommand: (cmd) ->
                
        if cmd == 'cd'
            cmd = 'cd ~'
        else if cmd == 'cd..'
            cmd = 'cd ..'
        else if cmd == 'cd.'
            cmd = 'cd .'
        else if cmd == '..'
            cmd = 'cd ..'
            
        if cmd.startsWith 'cd '
            dir = slash.resolve cmd.slice(3).trim()
            try 
                process.chdir dir
                window.tabs.activeTab().update slash.tilde dir
                klog "chdir #{dir}"
                return @newLine()
            catch err
                kerror err
        
module.exports = Chdir
