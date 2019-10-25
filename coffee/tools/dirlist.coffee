###
0000000    000  00000000   000      000   0000000  000000000  
000   000  000  000   000  000      000  000          000     
000   000  000  0000000    000      000  0000000      000     
000   000  000  000   000  000      000       000     000     
0000000    000  000   000  0000000  000  0000000      000     
###

{ fs, walkdir, slash, klog, kerror, _ } = require 'kxk'

#   directory list
#
#   calls back with a list of objects for files and directories in dirPath
#       [
#           type: file|dir
#           name: basename
#           file: absolute path
#       ]
#
#   opt:  
#          ignoreHidden: true # skip files that starts with a dot
#          logError:     true # print message to console.log if a path doesn't exits

dirList = (dirPath, opt, cb) ->
    
    cb ?= opt.cb
    if _.isFunction(opt) and not cb? then cb = opt
    opt ?= {}
    
    opt.ignoreHidden ?= true
    opt.logError     ?= true
    dirs    = []
    files   = []
    dirPath = slash.resolve dirPath
    
    filter = (p) ->
        
        base = slash.file p
        if base.startsWith '.'
            
            if opt.ignoreHidden
                return true
                
            if base in ['.DS_Store']
                return true
                
        if base == 'Icon\r'
            return true
            
        if base.toLowerCase().startsWith 'ntuser.'
            return true
            
        if base.toLowerCase().startsWith '$recycle'
            return true
        
        # if /\d\d\d\d\d\d\d\d\d?\d?/.test slash.ext p 
            # return true
            
        false
    
    onDir = (d, stat) -> 
        if not filter(d) 
            dir = 
                type: 'dir'
                file: slash.path d
                name: slash.basename d
                stat: stat
            dirs.push  dir
            
    onFile = (f, stat) -> 
        if not filter(f) 
            file = 
                type: 'file'
                file: slash.path f
                name: slash.basename f
                stat: stat
            files.push file

    try
        fileSort = (a,b) -> a.name.localeCompare b.name
        walker = walkdir.walk dirPath, no_recurse: true
        walker.on 'directory' onDir
        walker.on 'file'      onFile
        walker.on 'end'         -> cb dirs.sort(fileSort).concat files.sort(fileSort)
        walker.on 'error' (err) -> kerror err
        walker
    catch err
        kerror err

module.exports = dirList
