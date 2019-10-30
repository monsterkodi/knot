###
000   000  00000000  000   000  000      000  000   000  00000000
0000  000  000       000 0 000  000      000  0000  000  000     
000 0 000  0000000   000000000  000      000  000 0 000  0000000 
000  0000  000       000   000  000      000  000  0000  000     
000   000  00000000  00     00  0000000  000  000   000  00000000
###

{ post, klog, _ } = require 'kxk'    

module.exports = 
    
    actions:
        menu: 'Line'
        
        newline:
            name: 'Insert Newline'
            combos: ['enter']
            
        newlineAtEnd:
            separator: true
            name:  'Insert Newline at End'
            combo: 'alt+enter'

    newlineAtEnd: () ->
        
        @moveCursorsToLineBoundary 'right'  
        @newline indent: true

    newline: (key, info) ->
        
        if @isInputCursor()
            @term.shell.execute()
        else
            @do.start()
            @do.setCursors @restoreInputCursor()
            @do.select []
            @do.end()
            
    newlineAtCursors: -> # incactive!
            
        if not info? and _.isObject key
            info = key
        
        doIndent = info?.indent ? not @isCursorInIndent()
        
        @surroundStack = []
        @deleteSelection()
        @do.start()
        
        newCursors = @do.cursors()
        
        for c in @do.cursors().reverse()
        
            [before, after] = @splitStateLineAtPos @do, c
            after = after.trimLeft() if doIndent
        
            if doIndent
                
                indent = @indentStringForLineAtIndex c[1] 
                 
            else
                if c[0] <= indentationInLine @do.line c[1]
                    indent = @do.line(c[1]).slice 0,c[0]
                else
                    indent = ''

            bl = c[0]
            
            if c[0] >= @do.line(c[1]).length # cursor at end of line
                @do.insert c[1]+1, indent
            else
                @do.insert c[1]+1, indent + after
                if @insertIndentedEmptyLineBetween? and
                    before.trimRight().endsWith @insertIndentedEmptyLineBetween[0] and
                        after.trimLeft().startsWith @insertIndentedEmptyLineBetween[1]
                            indent += @indentString
                            @do.insert c[1]+1, indent
                @do.change c[1], before

            # move cursors in and below inserted line down
            for nc in positionsFromPosInPositions c, newCursors
                cursorDelta nc, nc[1] == c[1] and indent.length - bl or 0, 1
        
        @do.setCursors newCursors
        @do.end()
