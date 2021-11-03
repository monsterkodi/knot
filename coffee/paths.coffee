###
00000000    0000000   000000000  000   000   0000000  
000   000  000   000     000     000   000  000       
00000000   000000000     000     000000000  0000000   
000        000   000     000     000   000       000  
000        000   000     000     000   000  0000000   
###

{ _, os, slash } = require 'kxk'

class Paths

    @: (@shell) ->
        
        @sep = ';'
        
        if os.platform() != 'win32' 
            @sep = ':'        
        
    # 000  000   000  000  000000000  
    # 000  0000  000  000     000     
    # 000  000 0 000  000     000     
    # 000  000  0000  000     000     
    # 000  000   000  000     000     
    
    init: ->
        
        pth = process.env.PATH.split(@sep).map (s) -> slash.path s

        for a in ['/usr/bin' '/opt/homebrew/bin' '/opt/homebrew/sbin' '/usr/local/bin' 'node_modules/.bin' 'bin' '.']
            pth.unshift a
                
        if slash.isDir '~/s'
            for f in slash.list '~/s'
                if f.type == 'dir'
                    exeDir = slash.join f.file, "#{f.name}-#{process.platform}-#{process.arch}"
                    if slash.isDir exeDir
                        pth.push exeDir
                        continue
                    binDir = slash.join f.file, 'bin'
                    if slash.isDir binDir
                        pth.push binDir
                
        pth = pth.map (s) -> slash.untilde s
        pth = _.uniq pth
        process.env.PATH = pth.join @sep
        
    list: (editor) ->
        
        for pth in process.env.PATH.split @sep
            editor.appendOutput pth
        
    cmd: (editor, cmd) ->
            
        switch cmd
            when 'list' then @list editor
        
module.exports = Paths
