###
0000000    000   000  00000000  00000000  00000000  00000000 
000   000  000   000  000       000       000       000   000
0000000    000   000  000000    000000    0000000   0000000  
000   000  000   000  000       000       000       000   000
0000000     0000000   000       000       00000000  000   000
###

{ log, _ } = require 'kxk'

class Buffer

    constructor: (size) -> 
        
        rows = Math.max 1,   size?.rows ? 1
        cols = Math.max 100, size?.cols ? 100
        # log "Buffer cols:#{cols} rows:#{rows}"
        @reset()
        @resize cols, rows

    reset: ->
        
        @lines = [[]]
        @attr  = 0
        @state = 0
        @x     = 0
        @y     = 0
        @lch   = null
        
    resize: (cols, rows) ->
        
        @cols = cols
        @rows = rows
        
        @lines = @lines.slice 0, rows
        log rows, 'lines', @lines.length

module.exports = Buffer
