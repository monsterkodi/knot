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
        
        @splitRegExp = /\s+/g
    
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
        
        if not slash.isDir dir
            noDir = slash.file dir
            dir = slash.dir dir
            if not dir or not slash.isDir dir
                noParent = dir  
                noParent += '/' if dir
                noParent += noDir
                dir = ''

        items = slash.list dir

        if valid items

            result = items.map (i) -> 
                if noParent
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
            else if not noDir and valid(dir) 
                if not dir.endsWith '/'
                    result.unshift ['/' count:999]
                else
                    result.unshift ['' count:999]

            result
        
    #  0000000  00     00  0000000    00     00   0000000   000000000   0000000  000   000  00000000   0000000  
    # 000       000   000  000   000  000   000  000   000     000     000       000   000  000       000       
    # 000       000000000  000   000  000000000  000000000     000     000       000000000  0000000   0000000   
    # 000       000 0 000  000   000  000 0 000  000   000     000     000       000   000  000            000  
    #  0000000  000   000  0000000    000   000  000   000     000      0000000  000   000  00000000  0000000   
    
    cmdMatches: (word) ->
        
        pick = (obj,cmd) -> cmd.startsWith(word) and cmd.length > word.length
        m = _.toPairs _.pickBy window.brain.cmds, pick
        klog 'cmdMatches' word, m
        m
        
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
            
        if @span
            
            if @list and empty @completion
                @navigate 1
            
            suffix = ''
            if slash.isDir @selectedWord() 
                if valid(@completion) and not @completion.endsWith '/'
                    suffix = '/'
            # klog "onTab complete span |#{@completion}| suffix #{suffix}"
            @complete suffix:suffix
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
        
        if not @word?.length
            if info.before.split(' ')[0] in @dirCommands
                matches = @dirMatches()
        else  
            matches = @dirMatches(@word).concat @cmdMatches(info.before)

        if empty matches
            matches = @cmdMatches info.before
            
        return if empty matches
        
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
        
        @open info
            
    #  0000000   00000000   00000000  000   000
    # 000   000  000   000  000       0000  000
    # 000   000  00000000   0000000   000 0 000
    # 000   000  000        000       000  0000
    #  0000000   000        00000000  000   000
    
    open: (info) ->
        
        # klog "#{info.before}|#{@completion}|#{info.after} #{@word}"
        
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
            # @list.addEventListener 'wheel'     @onWheel
            @list.addEventListener 'mousedown' @onMouseDown
            @listOffset = 0
            if slash.dir(@word) and not @word.endsWith '/'
                @listOffset = slash.file(@word).length
            else if @matchList[0].startsWith @word
                @listOffset = @word.length
            @list.style.transform = "translatex(#{-@editor.size.charWidth*@listOffset}px)"
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
        @listOffset = 0
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
            @matchList[@selected].slice @listOffset
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
        else
            @list?.children[0]?.scrollIntoViewIfNeeded()
        @span.innerHTML = @selectedCompletion()
        @moveClonesBy @span.innerHTML.length
        @span.classList.remove 'selected' if @selected < 0
        @span.classList.add    'selected' if @selected >= 0
        
    prev:  -> @navigate -1    
    next:  -> @navigate 1
    last:  -> @navigate @matchList.length - @selected
    first: -> @navigate -Infinity

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
                when 'up'        then return @prev()
        @close()   
        'unhandled'
        
module.exports = Autocomplete
