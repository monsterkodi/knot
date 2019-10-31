###
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
###

{ stopEvent, kerror, empty, clamp, kstr, elem, klog, $, _ } = require 'kxk'

class Autocomplete

    @: (@editor) -> 
        
        @matchList = []
        @clones    = []
        @cloned    = []
        
        @close()
        
        specials = "_-@#"
        @especial = ("\\"+c for c in specials.split '').join ''
        @headerRegExp      = new RegExp "^[0#{@especial}]+$"
        
        @notSpecialRegExp  = new RegExp "[^#{@especial}]"
        @specialWordRegExp = new RegExp "(\\s+|[\\w#{@especial}]+|[^\\s])" 'g'
        # @splitRegExp       = new RegExp "[^\\w\\d#{@especial}]+" 'g'
        @splitRegExp       = new RegExp "\\s+" 'g'
    
        @dirCommands = ['ls' 'cd' 'rm' 'cp' 'mv' 'krep' 'cat']
        
        @editor.on 'insert' @onInsert
        @editor.on 'cursor' @close
        @editor.on 'blur'   @close
        
    # 00     00   0000000   000000000   0000000  000   000  00000000   0000000  
    # 000   000  000   000     000     000       000   000  000       000       
    # 000000000  000000000     000     000       000000000  0000000   0000000   
    # 000 0 000  000   000     000     000       000   000  000            000  
    # 000   000  000   000     000      0000000  000   000  00000000  0000000   
    
    dirMatches: (dir) ->
        
        []
        
    wordMatches: (word) ->
        
        wordMatches = _.pickBy window.brain.words, (c,w) => w.startsWith(word) and w.length > word.length
        wordMatches = _.toPairs wordMatches

        cmdMatches = _.pickBy window.brain.cmds, (c,w) => w.startsWith(word) and w.length > word.length
        cmdMatches = _.toPairs cmdMatches
        
        wordMatches.concat cmdMatches
        
    #  0000000   000   000  000000000   0000000   0000000    
    # 000   000  0000  000     000     000   000  000   000  
    # 000   000  000 0 000     000     000000000  0000000    
    # 000   000  000  0000     000     000   000  000   000  
    #  0000000   000   000     000     000   000  0000000    
    
    onTab: ->
        
        mc   = @editor.mainCursor()
        line = @editor.line mc[1]
        
        return if empty line.trim()
        
        info =
            line:   line
            before: line[0...mc[0]]
            after:  line[mc[0]..]
            cursor: mc
            
        klog 'tab' @isListItemSelected() and 'item' or @span and 'span' or 'none',  info
        
        if @span
            klog 'complete'
            @complete()
        else
            @onInsert info
        
    #  0000000   000   000  000  000   000   0000000  00000000  00000000   000000000  
    # 000   000  0000  000  000  0000  000  000       000       000   000     000     
    # 000   000  000 0 000  000  000 0 000  0000000   0000000   0000000       000     
    # 000   000  000  0000  000  000  0000       000  000       000   000     000     
    #  0000000   000   000  000  000   000  0000000   00000000  000   000     000     

    onInsert: (info) =>
        
        @close()
        
        @word = _.last info.before.split @splitRegExp
        
        klog "@word #{@word}"
        klog "insert #{@word} #{kstr info}"

        # klog "@word.length >#{@word}<" @word?.length
        if not @word?.length
            if info.before.split(' ')[0] in @dirCommands
                klog 'dirCommand' info.before.split(' ')[0]
                matches = @dirMatches()
            if empty matches
                @word = info.before
                matches = @wordMatches(@word)
        else  
            matches = @dirMatches(@word) ? @wordMatches(@word)
        
        return if empty matches # unlikely
        
        matches.sort (a,b) -> (b[1].count+1/b[0].length) - (a[1].count+1/a[0].length)
            
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
            @span.insertAdjacentElement 'afterend' c
            
        # klog "move clones by" @completion.length, @completion
            
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
            @complete()
        stopEvent event

    complete: ->
        
        @editor.pasteText @selectedCompletion()
        @close()

    isListItemSelected: -> @list and @selected >= 0
        
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
        
        # klog 'moveClonesBy' @clones[0].innerHTML, beforeLength, @completion
        
        for ci in [1...@clones.length]
            c = @clones[ci]
            offset = parseFloat @cloned[ci-1].style.transform.split('translateX(')[1]
            charOffset = numChars
            charOffset += beforeLength if ci == 1
            # klog 'moveClonesBy' ci, offset, numChars, beforeLength, charOffset
            c.style.transform = "translatex(#{offset+@editor.size.charWidth*charOffset}px)"
        # spanOffset = parseFloat @cloned[0].style.transform.split('translateX(')[1]
        # spanOffset += @editor.size.charWidth*beforeLength
        
        spanOffset = @editor.size.charWidth*@editor.mainCursor()[0]
        # klog 'moveClonesBy' spanOffset
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
        
        if combo == 'tab'
            @onTab()
            stopEvent event # prevent focus change
            return
            
        return 'unhandled' if not @span?
        
        if combo == 'right'
            @complete()
            return
            
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
