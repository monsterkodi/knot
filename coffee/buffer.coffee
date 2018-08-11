###
0000000    000   000  00000000  00000000  00000000  00000000 
000   000  000   000  000       000       000       000   000
0000000    000   000  000000    000000    0000000   0000000  
000   000  000   000  000       000       000       000   000
0000000     0000000   000       000       00000000  000   000
###

{ log, _ } = require 'kxk'

class Buffer

    constructor: (info) -> 
        
        rows = Math.max 1,   info.rows ? 1
        cols = Math.max 100, info.cols ? 100
        # log "Buffer cols:#{cols} rows:#{rows}"
        @resize rows, cols
        @reset()

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

module.exports = Buffer
