
# 00000000    0000000    0000000  000000000  00000000
# 000   000  000   000  000          000     000
# 00000000   000000000  0000000      000     0000000
# 000        000   000       000     000     000
# 000        000   000  0000000      000     00000000

{ empty, klog, _ } = require 'kxk'

electron  = require 'electron'
clipboard = electron.clipboard

module.exports =

    actions:

        cutCopyPaste:
            combos: ['command+x' 'ctrl+x' 'command+c' 'ctrl+c' 'command+v' 'ctrl+v']

    cutCopyPaste: (key, info) ->
        switch key
            when 'x' then @cut()
            when 'c' then @copy()
            when 'v' then @paste()

    cut: ->
        @do.start()
        @copy()
        @deleteSelectionOrCursorLines()
        @do.end()

    copy: -> clipboard?.writeText @textOfSelectionForClipboard()

    paste: -> @pasteText clipboard?.readText()

    # 00000000   00000000  00000000   000       0000000    0000000  00000000
    # 000   000  000       000   000  000      000   000  000       000
    # 0000000    0000000   00000000   000      000000000  000       0000000
    # 000   000  000       000        000      000   000  000       000
    # 000   000  00000000  000        0000000  000   000   0000000  00000000

    replaceSelectedText: (lines) ->

        @do.start()
        newSelections = @do.selections()

        for ns in newSelections
            insert = lines.shift()
            oldLength = ns[1][1]-ns[1][0]
            @do.change ns[0], @do.line(ns[0]).splice ns[1][0], oldLength, insert
            ldiff = insert.length - oldLength
            for os in rangesAfterLineColInRanges ns[0], ns[1][1], newSelections
                os[1][0] += ldiff
                os[1][1] += ldiff
            ns[1][1] += ldiff

        @do.select newSelections
        @do.setCursors endPositionsFromRanges newSelections
        @do.end()

    # 00000000    0000000    0000000  000000000  00000000
    # 000   000  000   000  000          000     000
    # 00000000   000000000  0000000      000     0000000
    # 000        000   000       000     000     000
    # 000        000   000  0000000      000     00000000

    pasteText: (text) ->

        lines = text.split '\n'

        isInputCursorAndSelection = @isInputCursor() and @selectedLineIndices().length == 1 and @selectedLineIndices()[0] == @numLines()-1

        if isInputCursorAndSelection and lines.length == @numSelections()
            @replaceSelectedText lines
            @select []
            return

        if (@numLines() == 1 and @text() == '' and lines.length > 1) or areSameRanges @rangesForAllLines(), @selections()
            removeLastLine = true # prevents trailing empty line

        if isInputCursorAndSelection
            @deleteSelection()
        else
            @select []

        @do.start()

        newCursors = @restoreInputCursor()

        if newCursors.length > 1 and lines.length == 1
            # replicate single lines for insertion at multiple cursors
            lines = (lines[0] for c in newCursors)

        if newCursors.length > 1 or (lines.length == 1)
            # insert into multiple cursors
            for ci in [newCursors.length-1..0]
                c = newCursors[ci]
                insert = lines[ci % lines.length]
                @do.change c[1], @do.line(c[1]).splice c[0], 0, insert
                for c in positionsAfterLineColInPositions c[1], c[0]-1, newCursors
                    cursorDelta c, insert.length # move cursors after insertion

        else # insert new line(s) at single cursor
            cp = newCursors[0]
            li = cp[1]
            newCursors = null

            if cp[0] > 0

                [before, after] = @splitStateLineAtPos @do, cp
                after = after.trimLeft()

                indt   = _.padStart '' indentationInLine @do.line cp[1]
                if before.trim().length
                    @do.change li, before
                    li += 1
                    if (indt + after).trim().length
                        lines.push indt + after
                        newCursors = [[0,li+lines.length-1]]
            else
                if @do.line(li).length == 0 and not removeLastLine
                    li += 1 # insert after empty line

            for line in lines
                @do.insert li, line
                li += 1

            newCursors = [[0, li]] if empty newCursors

        if removeLastLine
            @do.delete @do.numLines()-1

        @do.setCursors newCursors
        @do.end()
