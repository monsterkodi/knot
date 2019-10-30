###
00     00  00000000  000000000   0000000
000   000  000          000     000   000
000000000  0000000      000     000000000
000 0 000  000          000     000   000
000   000  00000000     000     000   000
###

{ post, stopEvent, kerror, slash, empty, elem, kpos, klog, fs, $, _ } = require 'kxk'

ranges = require '../tools/ranges'
File   = require '../tools/file'

class Meta

    @: (@editor) ->

        @metas     = [] # [ [lineIndex, [start, end], {href: ...}], ... ]
        @lineMetas = {} # { lineIndex: [ lineMeta, ... ], ... }

        @elem =$ ".meta" @editor.view

        @editor.on 'lineAppended' @onLineAppended
        @editor.on 'clearLines'   @onClearLines
        @editor.on 'lineInserted' @onLineInserted
        @editor.on 'lineDeleted'  @onLineDeleted

        @editor.on 'linesShown'   @onLinesShown
        @editor.on 'linesShifted' @onLinesShifted

        @elem.addEventListener 'mousedown' @onMouseDown
        @elem.addEventListener 'mouseup'   @onMouseUp

    #  0000000  00000000  000000000        00000000    0000000    0000000
    # 000       000          000           000   000  000   000  000
    # 0000000   0000000      000           00000000   000   000  0000000
    #      000  000          000           000        000   000       000
    # 0000000   00000000     000           000         0000000   0000000

    setMetaPos: (meta, tx, ty) ->

        if meta[2].no_x
            meta[2].div?.style.transform = "translateY(#{ty}px)"
        else
            meta[2].div?.style.transform = "translate(#{tx}px,#{ty}px)"

    updatePos: (meta) ->
        
        size = @editor.size
        tx = size.charWidth *  meta[1][0] + size.offsetX + (meta[2].xOffset ? 0)
        ty = size.lineHeight * (meta[0] - @editor.scroll.top) + (meta[2].yOffset ? 0)
        @setMetaPos meta, tx, ty
            
    #  0000000   0000000    0000000          0000000    000  000   000
    # 000   000  000   000  000   000        000   000  000  000   000
    # 000000000  000   000  000   000        000   000  000   000 000
    # 000   000  000   000  000   000        000   000  000     000
    # 000   000  0000000    0000000          0000000    000      0

    addDiv: (meta) ->

        size = @editor.size
        sw = size.charWidth * (meta[1][1]-meta[1][0])
        lh = size.lineHeight

        div = elem class: "meta #{meta[2].clss ? ''}"
        div.innerHTML = meta[2].html if meta[2].html?

        meta[2].div = div
        div.meta = meta
        
        if not meta[2].no_h
            div.style.height = "#{lh}px"

        if meta[2].style?
            for k,v of meta[2].style
                div.style[k] = v

        if not meta[2].no_x
            div.style.width = "#{sw}px"

        @elem.appendChild div

        @updatePos meta

    # 0000000    00000000  000           0000000    000  000   000
    # 000   000  000       000           000   000  000  000   000
    # 000   000  0000000   000           000   000  000   000 000
    # 000   000  000       000           000   000  000     000
    # 0000000    00000000  0000000       0000000    000      0

    delDiv: (meta) ->

        return kerror 'no line meta?', meta if not meta?[2]?
        meta[2].div?.remove()
        meta[2].div = null

    #  0000000   0000000    0000000    
    # 000   000  000   000  000   000  
    # 000000000  000   000  000   000  
    # 000   000  000   000  000   000  
    # 000   000  0000000    0000000    
    
    add: (meta) ->

        lineMeta = @addLineMeta [meta.line, [meta.start ? 0, meta.end ? 0], meta]

        if @editor.scroll.top <= meta.line <= @editor.scroll.bot
            @addDiv lineMeta
            @editor.numbers.updateMeta meta.line
            
        lineMeta

    update: (meta) ->
        
        @editor.numbers.updateColor meta.line
        
    # 0000000    000  00000000  00000000
    # 000   000  000  000       000
    # 000   000  000  000000    000000
    # 000   000  000  000       000
    # 0000000    000  000       000
    
    addDiffMeta: (meta) ->

        meta.diff = true
        @addNumberMeta meta
        
    addNumberMeta: (meta) ->

        meta.no_x = true
        lineMeta = @addLineMeta [meta.line, [0, 0], meta]

        if @editor.scroll.top <= meta.line <= @editor.scroll.bot
            @addDiv lineMeta

    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000
    # 000       000      000  000       0000000
    # 000       000      000  000       000  000
    #  0000000  0000000  000   0000000  000   000

    onMouseDown: (event) -> @downPos = kpos event
    
    onMouseUp: (event) ->
        
        if 5 < @downPos?.dist kpos event
            delete @downPos
            return
          
        delete @downPos
        if event.target.meta?[2].click?
            result = event.target.meta?[2].click event.target.meta, event
            # stopEvent event if result != 'unhandled'

    #  0000000   00000000   00000000   00000000  000   000  0000000
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000

    append: (meta) ->
        
        lineMeta = @addLineMeta [@editor.numLines(), [0, 0], meta]
        lineMeta

    addLineMeta: (lineMeta) ->
        
        return kerror 'invalid line meta?' lineMeta if not lineMeta?[2]?
        
        @lineMetas[lineMeta[0]] ?= []
        @lineMetas[lineMeta[0]].push lineMeta
        @metas.push lineMeta
        lineMeta

    moveLineMeta: (lineMeta, d) ->

        return kerror 'invalid move?' lineMeta, d if not lineMeta? or d == 0
        
        _.pull @lineMetas[lineMeta[0]], lineMeta
        delete @lineMetas[lineMeta[0]] if empty @lineMetas[lineMeta[0]]
        lineMeta[0] += d
        @lineMetas[lineMeta[0]] ?= []
        @lineMetas[lineMeta[0]].push lineMeta
        @updatePos lineMeta
        
    onLineAppended: (e) =>

        for meta in @metasAtLineIndex e.lineIndex
            meta[1][1] = e.text.length if meta[1][1] is 0

    metasAtLineIndex: (li) -> @lineMetas[li] ? []
        
    hrefAtLineIndex:  (li) ->

        for meta in @metasAtLineIndex li
            return meta[2].href if meta[2].href?

    nextMetaOfSameClass: (meta) ->
        
        for li in [meta[0]+1...@editor.numLines()]
            for m in @metasAtLineIndex li
                if m[2].clss == meta[2].clss
                    return m
            
    #  0000000  000   000   0000000   000   000  000   000
    # 000       000   000  000   000  000 0 000  0000  000
    # 0000000   000000000  000   000  000000000  000 0 000
    #      000  000   000  000   000  000   000  000  0000
    # 0000000   000   000   0000000   00     00  000   000

    onLinesShown: (top, bot, num) =>
        # klog 'shown' top, num, @metas.length
        for meta in @metas
            @delDiv meta
            if top <= meta[0] <= bot
                @addDiv meta

    #  0000000  000   000  000  00000000  000000000  00000000  0000000
    # 000       000   000  000  000          000     000       000   000
    # 0000000   000000000  000  000000       000     0000000   000   000
    #      000  000   000  000  000          000     000       000   000
    # 0000000   000   000  000  000          000     00000000  0000000

    onLinesShifted: (top, bot, num) =>

        if num > 0
            for meta in rangesFromTopToBotInRanges top-num, top-1, @metas
                @delDiv meta

            for meta in rangesFromTopToBotInRanges bot-num+1, bot, @metas
                @addDiv meta
        else

            for meta in rangesFromTopToBotInRanges bot+1, bot-num, @metas
                @delDiv meta

            for meta in rangesFromTopToBotInRanges top, top-num-1, @metas
                @addDiv meta

        @updatePositionsBelowLineIndex top

    updatePositionsBelowLineIndex: (li) ->

        size = @editor.size
        for meta in rangesFromTopToBotInRanges li, @editor.scroll.bot, @metas
            @updatePos meta

    onLineInserted: (li) =>

        for meta in rangesFromTopToBotInRanges li, @editor.numLines(), @metas
            @moveLineMeta meta, 1

        @updatePositionsBelowLineIndex li

    # 0000000    00000000  000      00000000  000000000  00000000  0000000    
    # 000   000  000       000      000          000     000       000   000  
    # 000   000  0000000   000      0000000      000     0000000   000   000  
    # 000   000  000       000      000          000     000       000   000  
    # 0000000    00000000  0000000  00000000     000     00000000  0000000    
    
    onLineDeleted: (li) =>

        while meta = _.last @metasAtLineIndex li
            @delMeta meta

        for meta in rangesFromTopToBotInRanges li, @editor.numLines(), @metas
            @moveLineMeta meta, -1

        @updatePositionsBelowLineIndex li

    #  0000000  000      00000000   0000000   00000000
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    onClearLines: =>

        for meta in @metas
            @delDiv meta
        @clear()

    clear: => 

        @elem.innerHTML = ""
        @metas = []
        @lineMetas = {}

    delMeta: (meta) ->
        if not meta?
            return kerror 'del no meta?'
        _.pull @lineMetas[meta[0]], meta
        _.pull @metas, meta
        @delDiv meta

    delClass: (clss) ->

        for meta in _.clone @metas
            clsss = meta?[2]?.clss?.split ' '
            if not empty(clsss) and clss in clsss
                @delMeta meta

module.exports = Meta
