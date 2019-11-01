###
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
###

{ stopEvent, kerror, slash, valid, empty, clamp, klog, kstr, elem, $, _ } = require 'kxk'

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
        
    # 0000000    000  00000000   00     00   0000000   000000000   0000000  000   000  00000000   0000000  
    # 000   000  000  000   000  000   000  000   000     000     000       000   000  000       000       
    # 000   000  000  0000000    000000000  000000000     000     000       000000000  0000000   0000000   
    # 000   000  000  000   000  000 0 000  000   000     000     000       000   000  000            000  
    # 0000000    000  000   000  000   000  000   000     000      0000000  000   000  00000000  0000000   
    
    dirMatches: (dir) ->
        
        # klog 'dirMatches' dir
        if not slash.isDir dir
            noDir = slash.file dir
            dir = slash.dir dir
            # klog "noDir |#{noDir}|"
            if not dir or not slash.isDir dir
                noParent = dir  
                noParent += '/' if dir
                noParent += noDir
                dir = ''
                # klog "noParent |#{noParent}|"
        items = slash.list dir
        # klog items.map (i) -> i.name
        if valid items
            result = items.map (i) -> 
                if noParent
                    # klog noParent, i.name, i.name.startsWith noParent
                    if i.name.startsWith noParent
                        [i.name, count:0]
                else if noDir
                    if i.name.startsWith noDir
                        [i.name, count:0]
                else
                    if dir[-1] == '/' or empty dir
                        [i.name, count:0]
                    else
                        ['/'+i.name, count:0]
            result = result.filter (f) -> f
            if dir == '.'
                result.unshift ['..' count:999]
            else if not noDir and valid dir and not dir.endsWith '/'
                result.unshift ['/' count:999]
            # klog 'result' result.map (r) -> r[0]
            result
        
    # 000   000   0000000   00000000   0000000    00     00   0000000   000000000   0000000  000   000  00000000   0000000  
    # 000 0 000  000   000  000   000  000   000  000   000  000   000     000     000       000   000  000       000       
    # 000000000  000   000  0000000    000   000  000000000  000000000     000     000       000000000  0000000   0000000   
    # 000   000  000   000  000   000  000   000  000 0 000  000   000     000     000       000   000  000            000  
    # 00     00   0000000   000   000  0000000    000   000  000   000     000      0000000  000   000  00000000  0000000   
    
    wordMatches: (word) ->
        
        wordMatches = _.pickBy window.brain.words, (c,w) => w.startsWith(word) and w.length > word.length
        wordMatches = _.toPairs wordMatches

        # klog wordMatches
        
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
            
        # klog 'tab' @isListItemSelected() and 'item' or @span and 'span' or 'none' info
        
        if @span
            @complete suffix:(slash.isDir(@selectedWord()) and not @completion.endsWith '/') and '/' or ''
            @onTab()
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
        
        # klog "@word #{@word}"
        # klog "insert #{@word} #{kstr info}"

        if not @word?.length
            if info.before.split(' ')[0] in @dirCommands
                klog 'dirCommand' info.before.split(' ')[0]
                matches = @dirMatches()
            if empty matches
                @word = info.before
                matches = @wordMatches(@word)
        else  
            matches = @dirMatches(@word) #? @wordMatches(@word)
        
        return if empty matches
        
        # matches.sort (a,b) -> (b[1].count+1/b[0].length) - (a[1].count+1/a[0].length)
        matches.sort (a,b) -> b[1].count - a[1].count
            
        words = matches.map (m) -> m[0]
        return if empty words
        @matchList = words[1..]
        
        if words[0].startsWith @word
            @completion = words[0].slice @word.length
        else
            if words[0].startsWith slash.file @word
                @completion = words[0].slice slash.file(@word).length
            else
                @completion = words[0]
        
        # klog 'open' @word, words[0], @completion, info
        @open info
            
    #  0000000   00000000   00000000  000   000
    # 000   000  000   000  000       0000  000
    # 000   000  00000000   0000000   000 0 000
    # 000   000  000        000       000  0000
    #  0000000   000        00000000  000   000
    
    open: (info) ->
        
        # klog "#{info.before}|#{@completion}|#{info.after}"
        
        cursor = $('.main' @editor.view)
        if not cursor?
            kerror "Autocomplete.open --- no cursor?"
            return

        @span = elem 'span' class:'autocomplete-span'
        @span.textContent      = @completion
        @span.style.opacity    = 1
        @span.style.background = "#44a"
        @span.style.color      = "#fff"
        @span.style.transform  = "translatex(#{@editor.size.charWidth*@editor.mainCursor()[0]}px)"

        cr = cursor.getBoundingClientRect()

        if not spanInfo = @editor.lineSpanAtXY cr.left+2, cr.top+2
            return kerror 'no spanInfo'
        
        sibling = spanInfo.span
        while sibling = sibling.nextSibling
            @clones.push sibling.cloneNode true
            @cloned.push sibling
            
        spanInfo.span.parentElement.appendChild @span
        
        for c in @cloned then c.style.display = 'none'
        for c in @clones then @span.insertAdjacentElement 'afterend' c
            
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
                
            pos = @editor.clampPos spanInfo.pos
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
            @complete {}
        stopEvent event

    complete: (suffix:'') ->
        
        @editor.pasteText @selectedCompletion() + suffix
        @close()

    isListItemSelected: -> @list and @selected >= 0
        
    selectedWord: -> @word+@selectedCompletion()
    
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
    first: -> 
        @select -1
        @list?.children[0]?.scrollIntoViewIfNeeded()

    # 00     00   0000000   000   000  00000000   0000000  000       0000000   000   000  00000000   0000000
    # 000   000  000   000  000   000  000       000       000      000   000  0000  000  000       000     
    # 000000000  000   000   000 000   0000000   000       000      000   000  000 0 000  0000000   0000000 
    # 000 0 000  000   000     000     000       000       000      000   000  000  0000  000            000
    # 000   000   0000000       0      00000000   0000000  0000000   0000000   000   000  00000000  0000000 

    moveClonesBy: (numChars) ->
        
        if valid @clones
            beforeLength = @clones[0].innerHTML.length
            for ci in [1...@clones.length]
                c = @clones[ci]
                offset = parseFloat @cloned[ci-1].style.transform.split('translateX(')[1]
                charOffset = numChars
                charOffset += beforeLength if ci == 1
                c.style.transform = "translatex(#{offset+@editor.size.charWidth*charOffset}px)"
                
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
            @complete {}
            return
            
        if @list? 
            switch combo
                when 'page down' then return @navigate 9
                when 'page up'   then return @navigate -9
                when 'end'       then return @last()
                when 'home'      then return @first()
                when 'down'      then return @next()
                when 'up'
                    if @selected >= 0 then return @prev()
                    else return @last()
        @close()   
        'unhandled'
        
module.exports = Autocomplete
