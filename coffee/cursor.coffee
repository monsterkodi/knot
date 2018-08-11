###
 0000000  000   000  00000000    0000000   0000000   00000000 
000       000   000  000   000  000       000   000  000   000
000       000   000  0000000    0000000   000   000  0000000  
000       000   000  000   000       000  000   000  000   000
 0000000   0000000   000   000  0000000    0000000   000   000
###

{ empty, log, $ } = require 'kxk'

class Cursor

    constructor: (@term) ->
        
        @div =$ '#cursor'
        
    setPos: (col, row) ->
        
        return if empty @term.size.charWidth
        return if empty @term.size.lineHeight
        return if empty @term.size.offsetLeft
        return if empty @term.size.offsetTop
        
        x = @term.size.offsetLeft + col * @term.size.charWidth
        y = @term.size.offsetTop + row * @term.size.lineHeight
        # log "Cursor.setPos #{col} #{row} #{x} #{y}", @term.size
        
        @div.style.transform = "translateX(#{x}px) translateY(#{y}px)"

module.exports = Cursor
