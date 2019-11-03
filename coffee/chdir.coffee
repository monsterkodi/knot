###
 0000000  000   000  0000000    000  00000000   
000       000   000  000   000  000  000   000  
000       000000000  000   000  000  0000000    
000       000   000  000   000  000  000   000  
 0000000  000   000  0000000    000  000   000  
###

{ slash, post, prefs, kerror, klog } = require 'kxk'

Cmmd = require './cmmd'

strip = (s, cs) ->
    
    s = s[1..] while s[0] in cs
    s = s[0..s.length-2] while s[-1] in cs
    s

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

        cwd = process.cwd()
        dir = slash.join cwd, strip cmd.slice(3), ' "'
        klog "dir |#{dir}|"
        return false if not slash.isDir dir
        
        try 
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
