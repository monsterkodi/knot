###
000   000  00000000   0000000  000   000  000000000  000      0000000     0000000   00000000   
000   000  000   000     000   0000  000     000     000      000   000  000   000  000   000  
000000000  0000000      000    000 0 000     000     000      0000000    000000000  0000000    
000   000  000   000   000     000  0000     000     000      000   000  000   000  000   000  
000   000  000   000  0000000  000   000     000     0000000  0000000    000   000  000   000  
###

{ clamp, elem, drag, klog } = require 'kxk'

Scroller = require '../tools/scroller'

class Hrzntlbar

    @: (@editor) ->
        
        klog 'hrzntlbar'

        @editor.on 'linesShown'    @update
        @editor.on 'linesAppended' @update

        @elem = elem class: 'scrollbar bottom'
        @editor.view.appendChild @elem

        @handle = elem class: 'scrollhandle bottom'
        @elem.appendChild @handle

        @scrollX  = 0

        @drag = new drag
            target:  @elem
            onMove:  @onDrag
            cursor:  'ew-resize'

    del: ->

    # 0000000    00000000    0000000    0000000
    # 000   000  000   000  000   000  000
    # 000   000  0000000    000000000  000  0000
    # 000   000  000   000  000   000  000   000
    # 0000000    000   000  000   000   0000000

    onDrag: (drag) =>

        delta = (drag.delta.x / @editor.layersWidth) * @editor.numColumns() * @editor.size.charWidth
        @editor.scroll.horizontal delta
        @update()

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    update: =>

        bw = @editor.numColumns() * @editor.size.charWidth
        
        if bw <= @editor.layersWidth
            
            @elem.style.display   = 'none'
            @handle.style.left    = "0"
            @handle.style.height  = "0"
            @handle.style.width   = "0"
            
        else
            @elem.style.display   = 'initial'
            scrollLeft   = @editor.layersWidth * @editor.layerScroll.scrollLeft / bw
            scrollWidth  = @editor.layersWidth * @editor.layersWidth / bw
            
            @handle.style.left   = "#{scrollLeft}px"
            @handle.style.width  = "#{scrollWidth}px"
            @handle.style.height = "2px"

            cf = 1 - clamp 0, 1, (scrollWidth-10)/200
            
            longColor  = Scroller.colorForClass 'scroller long'
            shortColor = Scroller.colorForClass 'scroller short'
            
            cs = Scroller.fadeColor longColor, shortColor, cf
            @handle.style.backgroundColor = cs

module.exports = Hrzntlbar
