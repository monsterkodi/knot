###
00000000    0000000   000000000  000   000   0000000  
000   000  000   000     000     000   000  000       
00000000   000000000     000     000000000  0000000   
000        000   000     000     000   000       000  
000        000   000     000     000   000  0000000   
###

{ slash, os, klog } = require 'kxk'

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
        
        # klog 'SHELL' process.env.SHELL
                    
        pth = process.env.PATH.split(@sep).map (s) -> slash.path s

        for a in ['/usr/bin' '/usr/local/bin' 'node_modules/.bin' 'bin' '.']
            if a not in pth
                # klog "add to PATH #{a}"
                pth.unshift a
                
        if slash.isDir '~/s'
            for f in slash.list '~/s'
                if f.type == 'dir'
                    exeDir = slash.join f.file, "#{f.name}-#{process.platform}-#{process.arch}"
                    if slash.isDir exeDir
                        # klog "add exe dir" exeDir
                        pth.push exeDir
                        continue
                    binDir = slash.join f.file, "bin"
                    if slash.isDir binDir
                        # klog "add bin dir" binDir
                        pth.push binDir
                
        process.env.PATH = pth.map((s) -> slash.unslash s).join @sep
        
        for pth in process.env.PATH.split @sep
            klog slash.path pth

    list: (editor) ->
        
        for pth in process.env.PATH.split @sep
            editor.appendOutput slash.path pth
        
    cmd: (editor, cmd) ->
            
        switch cmd
            when 'list' then @list editor
        
module.exports = Paths
