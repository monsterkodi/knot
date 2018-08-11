###
000      000  000   000  00000000   0000000
000      000  0000  000  000       000     
000      000  000 0 000  0000000   0000000 
000      000  000  0000  000            000
0000000  000  000   000  00000000  0000000 
###

{ log, _ } = require 'kxk'

parse  = require './parse'
Buffer = require './buffer'

class Lines
    
    constructor: (@term) ->
        
        @reset()

    reset: ->
        
        @buffer = new Buffer @term
        
    write: (data) =>
        
        start = @buffer.y
        
        parse data, @buffer
        
        if @buffer.title
            window.tabs.activeTab()?.update @buffer.title
            delete @buffer.title
        
        @term.refresh start:start, end:Math.max @buffer.y, 0
       
module.exports = Lines
