###
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
###

{ elem, klog, kerror, stopEvent, post, prefs, clamp, empty, $, _ } = require 'kxk'

event = require 'events'

class Autocomplete extends event

    @: (@editor) -> 
        
        super()
        
        @matchList = []
        @clones    = []
        @cloned    = []
        
        @close()
        
        specials = "_-@#"
        @especial = ("\\"+c for c in specials.split '').join ''
        @headerRegExp      = new RegExp "^[0#{@especial}]+$"
        
        @notSpecialRegExp  = new RegExp "[^#{@especial}]"
        @specialWordRegExp = new RegExp "(\\s+|[\\w#{@especial}]+|[^\\s])", 'g'
        @splitRegExp       = new RegExp "[^\\w\\d#{@especial}]+", 'g'        
    
        @editor.on 'edit'   @onEdit
        @editor.on 'cursor' @close
        @editor.on 'blur'   @close
        
    #  0000000   000   000  00000000  0000000    000  000000000
    # 000   000  0000  000  000       000   000  000     000   
    # 000   000  000 0 000  0000000   000   000  000     000   
    # 000   000  000  0000  000       000   000  000     000   
    #  0000000   000   000  00000000  0000000    000     000   

    onEdit: (info) =>
        
        @close()
        
        # klog info.before
        
        @word = _.last info.before.split @splitRegExp
        @word = info.before if @word?.length == 0
        
        if info.action == 'insert'
            
            # klog "@word.length >#{@word}<" @word?.length
            return if not @word?.length
            return if empty window.brain.words
            
            matches = _.pickBy window.brain.words, (c,w) => w.startsWith(@word) and w.length > @word.length            
            matches = _.toPairs matches
            for m in matches
                d = @editor.distanceOfWord m[0]
                m[1].distance = 100 - Math.min d, 100
                
            matches.sort (a,b) ->
                (b[1].distance+b[1].count+1/b[0].length) - (a[1].distance+a[1].count+1/a[0].length)
                
            words = matches.map (m) -> m[0]
            for w in words
                if not @firstMatch
                    @firstMatch = w 
                else
                    @matchList.push w
                        
            return if not @firstMatch?
            @completion = @firstMatch.slice @word.length
            
            @open info
        
    #  0000000   00000000   00000000  000   000
    # 000   000  000   000  000       0000  000
    # 000   000  00000000   0000000   000 0 000
    # 000   000  000        000       000  0000
    #  0000000   000        00000000  000   000
    
    open: (info) ->
        
        cursor = $('.main' @editor.view)
        if not cursor?
            kerror "Autocomplete.open --- no cursor?"
            return

        @span = elem 'span' class:'autocomplete-span'
        @span.textContent      = @completion
        @span.style.opacity    = 1
        @span.style.background = "#44a"
        @span.style.color      = "#fff"

        cr = cursor.getBoundingClientRect()
        spanInfo = @editor.lineSpanAtXY cr.left, cr.top+2
        if not spanInfo?
            klog 'no spanInfo'
            p = @editor.posAtXY cr.left, cr.top
            if firstSpan = @editor.lineSpanAtXY 2, cr.top+2
                fakeSpan = elem 'span'
                fakeSpan.parentElement = firstSpan.parentElement
                spanInfo = offsetChar:0 pos:p, span:fakeSpan
                klog 'fakespan' spanInfo
            else
                ci = p[1]-@editor.scroll.top
                return kerror "no span for autocomplete? cursor topleft: #{parseInt cr.left} #{parseInt cr.top}" info
        
        pos = @editor.clampPos spanInfo.pos
        # klog pos, @editor.numLines(), '\n', @editor.scroll.bot

        sp = spanInfo.span
        inner = sp.innerHTML
        @clones.push sp.cloneNode true
        @clones.push sp.cloneNode true
        @cloned.push sp
        
        ws = @word.slice @word.search /\w/
        wi = ws.length
        
        @clones[0].innerHTML = inner.slice 0 spanInfo.offsetChar + 1 
        @clones[1].innerHTML = inner.slice   spanInfo.offsetChar + 1
                    
        sibling = sp
        while sibling = sibling.nextSibling
            @clones.push sibling.cloneNode true
            @cloned.push sibling
            
        sp.parentElement.appendChild @span
        
        for c in @cloned
            c.style.display = 'none'

        for c in @clones
            @span.insertAdjacentElement 'afterend', c
            
        # klog @completion, @completion.length
            
        @moveClonesBy @completion.length            
        
        if @matchList.length
                            
            @list = elem class: 'autocomplete-list'
            @list.addEventListener 'wheel'     @onWheel
            @list.addEventListener 'mousedown' @onMouseDown
            index = 0
            
            for m in @matchList
                item = elem class:'autocomplete-item' index:index++
                item.textContent = m
                @list.appendChild item
                
            above = pos[1] + @matchList.length - @editor.scroll.top >= @editor.scroll.fullLines
            if above
                @list.classList.add 'above'
            else
                @list.classList.add 'below'
                
            cursor.appendChild @list

    #  0000000  000       0000000    0000000  00000000
    # 000       000      000   000  000       000     
    # 000       000      000   000  0000000   0000000 
    # 000       000      000   000       000  000     
    #  0000000  0000000   0000000   0000000   00000000

    close: =>
        
        if @list?
            @list.removeEventListener 'wheel' @onWheel
            @list.removeEventListener 'click' @onClick
            @list.remove()
            
        @span?.remove()
        @selected   = -1
        @list       = null
        @span       = null
        @completion = null
        @firstMatch = null
        
        for c in @clones
            c.remove()

        for c in @cloned
            c.style.display = 'initial'
        
        @clones = []
        @cloned = []
        @matchList  = []
        @

    onWheel: (event) =>
        
        @list.scrollTop += event.deltaY
        stopEvent event    
    
    onMouseDown: (event) =>
        
        index = elem.upAttr event.target, 'index'
        if index            
            @select index
            @onEnter()
        stopEvent event

    onEnter: ->  
        
        @editor.pasteText @selectedCompletion()
        @close()

    selectedCompletion: ->
        
        if @selected >= 0
            @matchList[@selected].slice @word.length
        else
            @completion

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
    # 0000  000  000   000  000   000  000  000        000   000     000     000     
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
    # 000  0000  000   000     000     000  000   000  000   000     000     000     
    # 000   000  000   000      0      000   0000000   000   000     000     00000000
    
    navigate: (delta) ->
        
        return if not @list
        @select clamp -1, @matchList.length-1, @selected+delta
        
    select: (index) ->
        @list.children[@selected]?.classList.remove 'selected'
        @selected = index
        if @selected >= 0
            @list.children[@selected]?.classList.add 'selected'
            @list.children[@selected]?.scrollIntoViewIfNeeded()
        @span.innerHTML = @selectedCompletion()
        @moveClonesBy @span.innerHTML.length
        @span.classList.remove 'selected' if @selected < 0
        @span.classList.add    'selected' if @selected >= 0
        
    prev: -> @navigate -1    
    next: -> @navigate 1
    last: -> @navigate @matchList.length - @selected

    # 00     00   0000000   000   000  00000000   0000000  000       0000000   000   000  00000000   0000000
    # 000   000  000   000  000   000  000       000       000      000   000  0000  000  000       000     
    # 000000000  000   000   000 000   0000000   000       000      000   000  000 0 000  0000000   0000000 
    # 000 0 000  000   000     000     000       000       000      000   000  000  0000  000            000
    # 000   000   0000000       0      00000000   0000000  0000000   0000000   000   000  00000000  0000000 

    moveClonesBy: (numChars) ->
        
        return if empty @clones
        beforeLength = @clones[0].innerHTML.length
        for ci in [1...@clones.length]
            c = @clones[ci]
            offset = parseFloat @cloned[ci-1].style.transform.split('translateX(')[1]
            charOffset = numChars
            charOffset += beforeLength if ci == 1
            c.style.transform = "translatex(#{offset+@editor.size.charWidth*charOffset}px)"
        spanOffset = parseFloat @cloned[0].style.transform.split('translateX(')[1]
        spanOffset += @editor.size.charWidth*beforeLength
        @span.style.transform = "translatex(#{spanOffset}px)"
        
    #  0000000  000   000  00000000    0000000   0000000   00000000   000   000   0000000   00000000   0000000  
    # 000       000   000  000   000  000       000   000  000   000  000 0 000  000   000  000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000    000000000  000   000  0000000    000   000
    # 000       000   000  000   000       000  000   000  000   000  000   000  000   000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000  00     00   0000000   000   000  0000000  
    
    cursorWords: -> 
        
        cp = @editor.cursorPos()
        words = @editor.wordRangesInLineAtIndex cp[1], regExp: @specialWordRegExp        
        [befor, cursr, after] = rangesSplitAtPosInRanges cp, words
        [@editor.textsInRanges(befor), @editor.textInRange(cursr), @editor.textsInRanges(after)]
        
    cursorWord: -> @cursorWords()[1]
    
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) ->
        
        return 'unhandled' if not @span?
        
        # klog 'combo' combo, @list?, @selected

        switch combo
            when 'right' 'tab'
                @onEnter()
                return
            when 'enter'
                if @list? and @selected >= 0
                    @onEnter()
                    return
                else
                    @close()
                    return 'unhandled'
            
        if @list? 
            switch combo
                when 'down'
                    @next()
                    return
                when 'up'
                    if @selected >= 0
                        @prev()
                        return
                    else 
                        @last()
                        return
        @close()   
        'unhandled'
        
module.exports = Autocomplete
