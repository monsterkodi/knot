###
 0000000  000   000  00000000    0000000   0000000   00000000 
000       000   000  000   000  000       000   000  000   000
000       000   000  0000000    0000000   000   000  0000000  
000       000   000  000   000       000  000   000  000   000
 0000000   0000000   000   000  0000000    0000000   000   000
###

{ $ } = require 'kxk'

class Cursor

    constructor: (@term) ->
        
        @div =$ '#cursor'
        
        @div.style.width  = "#{@term.size.charWidth}px"
        @div.style.height = "#{@term.size.lineHeight}px"
        
    setPos: (col, row) ->
        
        x = col * @term.size.charWidth
        y = row * @term.size.lineHeight
        
        @div.style.transform = "translateX(#{x}px) translateY(#{y}px)"

module.exports = Cursor
