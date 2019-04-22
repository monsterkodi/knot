###
 0000000   0000000  00000000    0000000   000      000      0000000     0000000   00000000
000       000       000   000  000   000  000      000      000   000  000   000  000   000
0000000   000       0000000    000   000  000      000      0000000    000000000  0000000
     000  000       000   000  000   000  000      000      000   000  000   000  000   000
0000000    0000000  000   000   0000000   0000000  0000000  0000000    000   000  000   000
###

{ post, stopEvent, elem, clamp, drag } = require 'kxk'

log = console.log

class Scrollbar

    constructor: (@scroll) ->

        post.on 'scroll',     @update
        post.on 'clearLines', @clear

        @view = @scroll.view.parentNode
        
        @elem = elem class: 'scrollbar left'
        @view.appendChild @elem

        @handle = elem class: 'scrollhandle left'
        @elem.appendChild @handle

        @scrollX  = 0
        @scrollY  = 0

        @drag = new drag
            target:  @elem
            onStart: @onStart
            onMove:  @onDrag
            cursor:  'ns-resize'

        # @elem.addEventListener 'wheel', @onWheel

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000
    # 0000000      000     000000000  0000000       000
    #      000     000     000   000  000   000     000
    # 0000000      000     000   000  000   000     000

    onStart: (drag, event) =>

        br = @elem.getBoundingClientRect()
        sy = clamp 0, @scroll.viewHeight, event.clientY - br.top
        ln = parseInt @scroll.numLines * sy/@scroll.viewHeight
        ly = (ln - @scroll.viewLines / 2) * @scroll.lineHeight
        @scroll.to ly

    # 0000000    00000000    0000000    0000000
    # 000   000  000   000  000   000  000
    # 000   000  0000000    000000000  000  0000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000   0000000

    onDrag: (drag) =>

        delta = (drag.delta.y / (@scroll.viewLines * @scroll.lineHeight)) * @scroll.fullHeight
        @scroll.by delta

    # 000   000  000   000  00000000  00000000  000
    # 000 0 000  000   000  000       000       000
    # 000000000  000000000  0000000   0000000   000
    # 000   000  000   000  000       000       000
    # 00     00  000   000  00000000  00000000  0000000

    onWheel: (event) =>

        scrollFactor = ->
            f  = 1
            f *= 1 + 1 * event.shiftKey
            f *= 1 + 3 * event.ctrlKey
            f *= 1 + 7 * event.altKey

        if Math.abs(event.deltaX) >= 2*Math.abs(event.deltaY) or Math.abs(event.deltaY) == 0
            @scrollX += event.deltaX
        else
            @scrollY += event.deltaY * scrollFactor()

        if @scrollX or @scrollY
            window.requestAnimationFrame @wheelScroll

        stopEvent event

    wheelScroll: =>

        @scroll.by @scrollY, @scrollX
        @scrollX = @scrollY = 0

    clear: =>
        
        @handle.style.top     = "0"
        @handle.style.height  = "0"
        @handle.style.width   = "0"
        
    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    update: =>

        if @scroll.numLines * @scroll.lineHeight < @scroll.viewHeight
            
            @clear()
            
        else
            
            bh           = @scroll.numLines * @scroll.lineHeight
            vh           = Math.min (@scroll.viewLines * @scroll.lineHeight), @scroll.viewHeight
            scrollTop    = parseInt (@scroll.scroll / bh) * vh
            scrollHeight = parseInt ((@scroll.viewLines * @scroll.lineHeight) / bh) * vh
            scrollHeight = Math.max scrollHeight, parseInt @scroll.lineHeight/4
            scrollTop    = Math.min scrollTop, @scroll.viewHeight-scrollHeight
            scrollTop    = Math.max 0, scrollTop

            @handle.style.top    = "#{scrollTop}px"
            @handle.style.height = "#{scrollHeight}px"
            @handle.style.width  = "2px"

            cf = 1 - clamp 0, 1, (scrollHeight-10)/200
            longColor  = [94,94,94] # "#444"
            shortColor = [128,128,256] # "#88f"
            
            fadeColor = (av, bv, f) ->
                fv = [0,0,0]
                for i in [0...3]
                    fv[i] = Math.round (1-f) * av[i] + f * bv[i]
                "rgb(#{fv[0]}, #{fv[1]}, #{fv[2]})"
            
            cs = fadeColor longColor, shortColor, cf
            @handle.style.backgroundColor = cs

module.exports = Scrollbar
