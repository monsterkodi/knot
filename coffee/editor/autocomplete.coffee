###
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
###

{ stopEvent, slash, valid, empty, first, clamp, elem, last, kerror, klog, $, _ } = require 'kxk'

Syntax = require './syntax'

class Autocomplete

    @: (@editor) ->
        
        @close()
        
        @splitRegExp = /[\s\"]+/g
    
        @fileCommands = ['cd' 'ls' 'rm' 'cp' 'mv' 'krep' 'cat']
        @dirCommands  = ['cd']
        
        @editor.on 'insert' @onInsert
        @editor.on 'cursor' @close
        @editor.on 'blur'   @close
        
    # 0000000    000  00000000   00     00   0000000   000000000   0000000  000   000  00000000   0000000  
    # 000   000  000  000   000  000   000  000   000     000     000       000   000  000       000       
    # 000   000  000  0000000    000000000  000000000     000     000       000000000  0000000   0000000   
    # 000   000  000  000   000  000 0 000  000   000     000     000       000   000  000            000  
    # 0000000    000  000   000  000   000  000   000     000      0000000  000   000  00000000  0000000   
    
    itemsForDir: (dir) ->
    
        if not slash.isDir dir
            noDir = slash.file dir
            dir = slash.dir dir
            if not dir or not slash.isDir dir
                noParent = dir  
                noParent += '/' if dir
                noParent += noDir
                dir = ''

        items: slash.list dir, ignoreHidden:false
        dir:dir 
        noDir:noDir 
        noParent:noParent
    
    dirMatches: (dir, dirsOnly:false) ->
        
        {items, dir, noDir, noParent} = @itemsForDir dir
        
        if valid items

            result = items.map (i) ->
                
                return if dirsOnly and i.type == 'file'
                                    
                name = null
                if noParent
                    if i.name.startsWith(noParent) then name = i.name
                else if noDir
                    if i.name.startsWith(noDir) then name = i.name
                else
                    if dir[-1] == '/' or empty(dir) then name = i.name
                    else if i.name[0] == '.'
                        if dir[-1] == '.' then name = i.name
                        else                   name = '/'+i.name
                    else
                        if dir[-1] == '.' then name = './'+i.name
                        else                   name = '/'+i.name
                            
                if name
                    if i.type == 'file'
                        count = 0
                    else
                        if dir[-1] == '.'
                            count = (i.name[0] == '.' and 666 or 333)
                        else
                            count = (i.name[0] == '.' and 333 or 666)
                    return [name, count:count, type:i.type]

            result = result.filter (f) -> f

            if dir.endsWith '../'
                if not slash.isRoot slash.join process.cwd(), dir
                    result.unshift ['..' count:999 type:'dir']
                result.unshift ['' count:999 type:'dir']
            else if dir == '.' or dir.endsWith('/.')
                result.unshift ['..' count:999 type:'dir']
            else if not noDir and valid(dir) 
                if not dir.endsWith '/'
                    result.unshift ['/' count:999 type:'dir']
                else
                    result.unshift ['' count:999 type:'dir']
        else
            if (not noDir) and dir[-1] != '/'
                result = [['/' count:999 type:'dir']]
        result ? []
        
    #  0000000  00     00  0000000    00     00   0000000   000000000   0000000  000   000  00000000   0000000  
    # 000       000   000  000   000  000   000  000   000     000     000       000   000  000       000       
    # 000       000000000  000   000  000000000  000000000     000     000       000000000  0000000   0000000   
    # 000       000 0 000  000   000  000 0 000  000   000     000     000       000   000  000            000  
    #  0000000  000   000  0000000    000   000  000   000     000      0000000  000   000  00000000  0000000   
    
    cmdMatches: (word) ->
        
        pick = (obj,cmd) -> cmd.startsWith(word) and cmd.length > word.length
        mtchs = _.toPairs _.pickBy window.brain.cmds, pick
        m[1].type = 'cmd' for m in mtchs
        mtchs
        
    #  0000000   000   000  000000000   0000000   0000000    
    # 000   000  0000  000     000     000   000  000   000  
    # 000   000  000 0 000     000     000000000  0000000    
    # 000   000  000  0000     000     000   000  000   000  
    #  0000000   000   000     000     000   000  0000000    
        
    onTab: ->
        
        [line, before, after] = @lineBeforeAfter()
        
        return if empty line.trim()
                    
        if @span
            
            current = @selectedCompletion()
            if @list and empty current
                @navigate 1
            
            suffix = ''
            if slash.isDir @selectedWord()
                if not current.endsWith('/') and not @selectedWord().endsWith('/')
                    suffix = '/'
            # klog "tab #{@selectedWord()} |#{current}| suffix #{suffix}"
            @complete suffix:suffix
            @onTab()
            
        else
            @onInsert
                tab:    true
                line:   line
                before: before
                after:  after
                cursor: @editor.mainCursor()
        
    #  0000000   000   000  000  000   000   0000000  00000000  00000000   000000000  
    # 000   000  0000  000  000  0000  000  000       000       000   000     000     
    # 000   000  000 0 000  000  000 0 000  0000000   0000000   0000000       000     
    # 000   000  000  0000  000  000  0000       000  000       000   000     000     
    #  0000000   000   000  000  000   000  0000000   00000000  000   000     000     

    onInsert: (info) =>
                
        @close()
        
        return if info.before[-1] in '"\''
        return if info.after[0] and info.after[0] not in '"'
        
        if info.before[-1] == ' ' and info.before[-2] not in ['"\' ']
            @handleSpace()
        
        @info = info
        
        stringOpen = @stringOpenCol @info.before
        if stringOpen >= 0
            @word = @info.before.slice stringOpen+1
        else
            @word = _.last @info.before.split @splitRegExp
        
        @info.split = @info.before.length
        firstCmd = @info.before.split(' ')[0]
        dirsOnly = firstCmd in @dirCommands
        if not @word?.length
            if firstCmd in @fileCommands
                @matches = @dirMatches null dirsOnly:dirsOnly
            if empty @matches
                includesCmds = true
                @matches = @cmdMatches @info.before
        else                    
            includesCmds = true
            @matches = @dirMatches(@word, dirsOnly:dirsOnly).concat @cmdMatches @info.before
            
        if empty @matches 
            if @info.tab then @closeString stringOpen
            return
        
        @matches.sort (a,b) -> b[1].count - a[1].count
            
        first = @matches.shift() # seperate first match
        
        if first[0] == '/'
            @info.split = @info.before.length
        else
            @info.split = @info.before.length - @word.length
            if 0 <= s = @word.lastIndexOf '/'
                @info.split += s + 1
                
        if includesCmds
            
            seen = [first[0]] 
            if first[1].type == 'cmd' # shorten command completions
                seen = [first[0][@info.split..]]
                first[0] = first[0][@info.before.length..]
    
            for m in @matches
                if m[1].type == 'cmd' # shorten command list items
                    if @info.split
                        m[0] = m[0][@info.split..]
            mi = 0
            while mi < @matches.length # crappy duplicate filter
                if @matches[mi][0] in seen
                    @matches.splice mi, 1
                else
                    seen.push @matches[mi][0]
                    mi++
                        
        if first[0].startsWith @word
            @completion = first[0].slice @word.length
        else if first[0].startsWith @info.before
            @completion = first[0].slice @info.before.length
        else
            if first[0].startsWith slash.file @word
                @completion = first[0].slice slash.file(@word).length
            else
                @completion = first[0]
        
        if @matches.length == 0 and empty @completion
            if info.tab then @closeString stringOpen
            return
                
        @open()
            
    #  0000000   00000000   00000000  000   000
    # 000   000  000   000  000       0000  000
    # 000   000  00000000   0000000   000 0 000
    # 000   000  000        000       000  0000
    #  0000000   000        00000000  000   000
    
    open: ->
        
        # klog "#{@info.before}|#{@completion}|#{@info.after} #{@word}"
        
        @span = elem 'span' class:'autocomplete-span'
        @span.textContent      = @completion
        @span.style.opacity    = 1
        @span.style.background = "#44a"
        @span.style.color      = "#fff"
        @span.style.transform  = "translatex(#{@editor.size.charWidth*@editor.mainCursor()[0]}px)"

        if not spanBefore = @editor.spanBeforeMain()
            return kerror 'no spanInfo'
        
        sibling = spanBefore
        while sibling = sibling.nextSibling
            @clones.push sibling.cloneNode true
            @cloned.push sibling
            
        spanBefore.parentElement.appendChild @span
        
        for c in @cloned then c.style.display = 'none'
        for c in @clones then @span.insertAdjacentElement 'afterend' c
            
        @moveClonesBy @completion.length         
        
        if @matches.length
                            
            @showList()
            
    #  0000000  000   000   0000000   000   000  000      000   0000000  000000000  
    # 000       000   000  000   000  000 0 000  000      000  000          000     
    # 0000000   000000000  000   000  000000000  000      000  0000000      000     
    #      000  000   000  000   000  000   000  000      000       000     000     
    # 0000000   000   000   0000000   00     00  0000000  000  0000000      000     
    
    showList: ->
        
        @list = elem class: 'autocomplete-list'
        @list.addEventListener 'mousedown' @onMouseDown
        @listOffset = 0
        
        splt = @word.split '/'
        
        if splt.length>1 and not @word.endsWith('/') and @completion != '/'
            @listOffset = splt[-1].length
        else if @matches[0][0].startsWith @word
            @listOffset = @word.length
            
        @list.style.transform = "translatex(#{-@editor.size.charWidth*@listOffset-10}px)"
        index = 0
        
        for match in @matches
            item = elem class:'autocomplete-item' index:index++
            item.innerHTML = Syntax.spanForTextAndSyntax match[0], 'sh'
            item.classList.add match[1].type
            @list.appendChild item
                    
        mc = @editor.mainCursor()
        
        linesBelow = Math.max(@editor.scroll.bot, @editor.scroll.viewLines) - mc[1] - 3
        linesAbove = mc[1] - @editor.scroll.top  - 3
        
        above = linesAbove > linesBelow and linesBelow < Math.min 7, @matches.length
        @list.classList.add above and 'above' or 'below'

        @list.style.maxHeight = "#{@editor.scroll.lineHeight*(above and linesAbove or linesBelow)}px"
        
        cursor =$ '.main' @editor.view
        cursor.appendChild @list

    #  0000000  000       0000000    0000000  00000000
    # 000       000      000   000  000       000     
    # 000       000      000   000  0000000   0000000 
    # 000       000      000   000       000  000     
    #  0000000  0000000   0000000   0000000   00000000

    close: =>
        
        if @list?
            @list.removeEventListener 'click' @onClick
            @list.remove()
            
        for c in @clones ? []
            c.remove()

        for c in @cloned ? []
            c.style.display = 'initial'
            
        @span?.remove()
        @selected   = -1
        @listOffset = 0
        @info       = null
        @list       = null
        @span       = null
        @completion = null
        @matches    = []
        @clones     = []
        @cloned     = []
        @

    onMouseDown: (event) =>
        
        index = elem.upAttr event.target, 'index'
        if index            
            @select index
            @complete {}
        stopEvent event

    # 000   000   0000000   000   000  0000000    000      00000000   0000000  00000000    0000000    0000000  00000000  
    # 000   000  000   000  0000  000  000   000  000      000       000       000   000  000   000  000       000       
    # 000000000  000000000  000 0 000  000   000  000      0000000   0000000   00000000   000000000  000       0000000   
    # 000   000  000   000  000  0000  000   000  000      000            000  000        000   000  000       000       
    # 000   000  000   000  000   000  0000000    0000000  00000000  0000000   000        000   000   0000000  00000000  

    closeString: (stringOpen) ->
        
        if stringOpen >= 0
            if empty @info.after
                @editor.setInputText @info.line + '"'
            else if @info.after[0] == '"'
                @editor.moveCursorsRight()  
    
    handleSpace: ->
        
        [line, before, after] = @lineBeforeAfter()
        
        mcCol = before.length
        
        while before[-1] != ' '
            after  = before[-1] + after
            before = before[0..before.length-2]
        
        index = @stringOpenCol before
        if index < 0

            wrd = last before[..before.length-2].split /[\s\"]/
            prt = slash.dir wrd
            {items, dir, noDir, noParent} = @itemsForDir prt

            pth = slash.resolve wrd+' '
            for item in items ? []
                if item.file.startsWith pth
                    # klog "INSERT string delimiters around |#{wrd+' '}| matching" item.file
                    newLine = "#{before.slice(0,before.length-wrd.length-1)}\"#{wrd} #{after}"
                    newLine += '"' if mcCol == line.length
                    @editor.setInputText newLine
                    mc = @editor.mainCursor()
                    @editor.singleCursorAtPos [mcCol+1,mc[1]]
                    return
                # else
                    # klog item.file

            klog "no items match in dir |#{dir}|"

    stringOpenCol: (text) ->

        lastCol = text.lastIndexOf '"'
        if lastCol > 0
            before = text[...lastCol]
            count = before.split('"').length - 1
            if count % 2 != 0
                return -1
        lastCol
        
    lineBeforeAfter: -> 

        mc   = @editor.mainCursor()
        line = @editor.line mc[1]
        
        [line, line[0...mc[0]], line[mc[0]..]]
        
    #  0000000   0000000   00     00  00000000   000      00000000  000000000  00000000  
    # 000       000   000  000   000  000   000  000      000          000     000       
    # 000       000   000  000000000  00000000   000      0000000      000     0000000   
    # 000       000   000  000 0 000  000        000      000          000     000       
    #  0000000   0000000   000   000  000        0000000  00000000     000     00000000  
    
    complete: (suffix:'') ->
        
        compl = @selectedCompletion()
        
        @editor.pasteText compl + suffix
        @close()
        
        if compl.indexOf(' ') >= 0
            @handleSpace()

    isListItemSelected: -> @list and @selected >= 0
        
    selectedWord: -> @word+@selectedCompletion()
    
    selectedCompletion: ->
        if @selected >= 0
            # klog 'completion' @selected , @matches[@selected][0], @listOffset
            @matches[@selected][0].slice @listOffset
        else
            @completion

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
    # 0000  000  000   000  000   000  000  000        000   000     000     000     
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
    # 000  0000  000   000     000     000  000   000  000   000     000     000     
    # 000   000  000   000      0      000   0000000   000   000     000     00000000
    
    navigate: (delta) ->
        
        return if not @list
        @select clamp -1, @matches.length-1, @selected+delta
        
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
    last:  -> @navigate @matches.length - @selected
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
        
        switch combo 
            when 'right'     then return @complete {}
            
        if @list? 
            switch combo
                when 'page down' then return @navigate +9
                when 'page up'   then return @navigate -9
                when 'end'       then return @last()
                when 'home'      then return @first()
                when 'down'      then return @next()
                when 'up'        then return @prev()
        @close()   
        'unhandled'
        
module.exports = Autocomplete
