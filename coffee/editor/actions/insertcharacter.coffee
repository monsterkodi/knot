
# 000  000   000   0000000  00000000  00000000   000000000
# 000  0000  000  000       000       000   000     000   
# 000  000 0 000  0000000   0000000   0000000       000   
# 000  000  0000       000  000       000   000     000   
# 000  000   000  0000000   00000000  000   000     000   

{ empty, clamp, text, reversed, _ } = require 'kxk'

module.exports =
    
    insertCharacter: (ch) ->
        
        return @newline() if ch == '\n'
        
        @do.start()
        
        if ch in @surroundCharacters
            if @insertSurroundCharacter ch
                @do.end()
                return
    
        @deleteSelection()

        newCursors = @restoreInputCursor()
        
        for cc in newCursors
            cline = @do.line(cc[1])
            sline = @twiggleSubstitute line:cline, cursor:cc, char:ch
            if sline
                @do.change cc[1], sline
            else
                @do.change cc[1], cline.splice cc[0], 0, ch
                for nc in positionsAtLineIndexInPositions cc[1], newCursors
                    if nc[0] >= cc[0]
                        nc[0] += 1
        
        @do.setCursors newCursors
        @do.end()
        @emitEdit 'insert'

    insertSingleLine: (text) ->
        
        text = text.split('\n')[0]
        text ?= ''
        
        li = @numLines()-1
        @do.start()
        @deleteCursorLines()
        @do.change li, text
        @do.setCursors [[text.length, li]]
        @do.end()
        
    twiggleSubstitute: (line:,cursor:,char:) ->
        
        if cursor[0] and line[cursor[0]-1] == '~'
            substitute = switch char
                when '>' then '▸'
                when '<' then '◂'
                when '^' then '▴'
                when 'v' then '▾'
                when 'd' then '◆'
                when 'c' then '●'
                when 'o' then '○'
                when 's' then '▪'
                when 'S' then '■'
            if substitute
                return line.splice cursor[0]-1, 1, substitute
        
        