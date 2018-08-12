###
000      000  000   000  00000000   0000000
000      000  0000  000  000       000     
000      000  000 0 000  0000000   0000000 
000      000  000  0000  000            000
0000000  000  000   000  00000000  0000000 
###

{ clamp, elem, log, $ } = require 'kxk'

parse  = require './parse'
Buffer = require './buffer'
Render = require './render'

class Lines
    
    constructor: (@term) ->
        
        @reset()

    reset: ->
        
        @top = 0
        @buffer = new Buffer @term
        
    write: (data) =>
        
        start = @buffer.y
        
        parse data, @buffer
        
        if @buffer.title
            window.tabs.activeTab()?.update @buffer.title
            delete @buffer.title
        
        @top = Math.max 0, @buffer.lines.length - @buffer.rows
        @refresh()
       
    scrollTop: (@top) ->
        
        @refresh()
        
    refresh: =>
            
        terminal =$ '#terminal'
        terminal.innerHTML = ''
        
        bot = clamp 0, @buffer.lines.length-1, @top + @buffer.rows
        for index in [@top..bot]
            html = Render.line @buffer.lines[index], @buffer
            terminal.appendChild elem class:'line', html:html
            
        @term.updateCursor()
        
module.exports = Lines
