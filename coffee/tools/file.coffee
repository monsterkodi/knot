###
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
###

{ slash, valid } = require 'kxk'

class File
    
    @isImage: (file) -> slash.ext(file) in ['gif' 'png' 'jpg' 'jpeg' 'svg' 'bmp' 'ico']
    @isText:  (file) -> slash.isText file
                                
    #  0000000  00000000    0000000   000   000  
    # 000       000   000  000   000  0000  000  
    # 0000000   00000000   000000000  000 0 000  
    #      000  000        000   000  000  0000  
    # 0000000   000        000   000  000   000  
    
    @span: (text) ->
        
        base = slash.base text
        ext  = slash.ext(text).toLowerCase()
        clss = valid(ext) and ' '+ext or ''
        
        if base.startsWith '.' then clss += ' dotfile'
        
        span = "<span class='text#{clss}'>"+base+"</span>"
        
        if valid ext
            span += "<span class='ext punct#{clss}'>.</span>" + "<span class='ext text#{clss}'>"+ext+"</span>"
        span
        
    @crumbSpan: (file) ->
        
        return "<span>/</span>" if file in ['/' '']
        
        spans = []
        split = slash.split file
        
        for i in [0...split.length-1]
            s = split[i]
            spans.push "<div class='inline path' id='#{split[0..i].join '/'}'>#{s}</div>"
        spans.push "<div class='inline' id='#{file}'>#{split[-1]}</div>"
        spans.join "<span class='punct'>/</span>"
        
module.exports = File
