
# 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000  
# 000   000  000  000        000   000  000      000  000        000   000     000     
# 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000     
# 000   000  000  000   000  000   000  000      000  000   000  000   000     000     
# 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000     

{ empty, kerror, _ } = require 'kxk'

module.exports = 

    actions:
        menu: 'Select'
        
        highlightWordAndAddToSelection:
            name:  'Highlight and Select Word'
            text:  'highlights all occurrences of text in selection or word at cursor and selects the first|next highlight.'
            combo: 'command+d'
            accel: 'ctrl+d'
            
        selectAllWords:
            name:  'Select All Words'
            combo: 'command+alt+d'
            accel: 'alt+ctrl+d'
            
        removeSelectedHighlight:
            name: 'Remove Highlighted Word from Selection'
            text:  "does the inverse of 'highlight and select' word"
            combo: 'command+shift+d'
            accel: 'ctrl+shift+d'
            
        highlightTextOfSelectionOrWordAtCursor:
            name:  'Highlight and Select Word'
            text:  'highlights all occurrences of text in selection or word at cursor and selects it. expands to the left if already selected.'
            combo: 'command+e'
            accel: 'alt+e'

    # 000000000  00000000  000   000  000000000  
    #    000     000        000 000      000     
    #    000     0000000     00000       000     
    #    000     000        000 000      000     
    #    000     00000000  000   000     000     
    
    highlightText: (text, opt) -> # called from find command
        
        hls = @rangesForText text, opt
        if hls.length
            switch opt?.select
                when 'after'  then @selectSingleRange rangeAfterPosInRanges(@cursorPos(), hls) ? _.first hls
                when 'before' then @selectSingleRange rangeBeforePosInRanges(@cursorPos(), hls) ? _.first hls
                when 'first'  then @selectSingleRange _.first hls
            @scroll?.cursorToTop() if not opt?.noScroll # < sucks!
        @setHighlights hls
        @renderHighlights()
        @emit 'highlight'
    
    # 000   000   0000000   00000000   0000000     0000000  
    # 000 0 000  000   000  000   000  000   000  000       
    # 000000000  000   000  0000000    000   000  0000000   
    # 000   000  000   000  000   000  000   000       000  
    # 00     00   0000000   000   000  0000000    0000000   
        
    wordHighlights: -> @highlights().filter (h) -> not h[2]?.clss?.startsWith('stringmatch') and not h[2]?.clss?.startsWith('bracketmatch')

    highlightForFind: ->
        
        if @numSelections() == 1 and not empty @textInRange(@selection 0).trim()
            @highlightText @textInRange(@selection 0)
        else
            cp = @cursorPos()
            wordHighlights = @wordHighlights()
            cursorInWordHighlight = wordHighlights.length #and rangeAtPosInRanges cp, wordHighlights
            if not cursorInWordHighlight
                @highlightTextOfSelectionOrWordAtCursor() # this also selects
        @selectNextHighlight()
    
    highlightWordAndAddToSelection: -> # command+d
        
        cp = @cursorPos()
        wordHighlights = @wordHighlights()
        cursorInWordHighlight = wordHighlights.length and rangeAtPosInRanges cp, wordHighlights
        if not cursorInWordHighlight
            @highlightTextOfSelectionOrWordAtCursor() # this also selects
        else
            @do.start()
            sr = rangeAtPosInRanges cp, @do.selections()
            if sr # cursor in selection -> select next highlight
                r = rangeAfterPosInRanges cp, wordHighlights
            else # select current highlight first
                r = rangeAtPosInRanges cp, wordHighlights
            r ?= wordHighlights[0]
            @addRangeToSelection r
            @scroll?.cursorToTop() # < sucks!
            @do.end()

    selectAllWords: -> # command+alt+d
        
        @highlightWordAndAddToSelection()
        @do.start()
        @do.select @do.highlights()
        if @do.numSelections()
            @do.setCursors endPositionsFromRanges(@do.selections()), main: 'closest'
        @do.end()

    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000  
    # 000       000       000      000       000          000     000  000   000  0000  000  
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000  
    #      000  000       000      000       000          000     000  000   000  000  0000  
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000  
    
    highlightTextOfSelectionOrWordAtCursor: -> # command+e       
            
        if @numSelections() == 0
            srange = @rangeForRealWordAtPos @cursorPos()
            if empty @textInRange(srange).trim()
                @clearHighlights()
                return
            @selectSingleRange srange
        
        sel = @selection 0     
        text = @textInRange sel
        if text.length
            
            if @numHighlights()
                if text == @textInRange @highlight 0 # see if we can grow the current selection
                    largerRange = [sel[0], [sel[1][0]-1, sel[1][1]]]
                    largerText = @textInRange largerRange
                    if largerText[0] in "@#$%&*+-!?:.'\"/" or /[A-Za-z]/.test largerText[0]
                        if largerText[0] in "'\"" # grow strings in both directions
                            nr = [sel[0], [sel[1][0]-1, sel[1][1]+1]] 
                            nt = @textInRange nr
                            if nt[nt.length-1] == largerText[0]
                                largerText = nt
                                largerRange = nr
                        else if /[A-Za-z]/.test largerText[0] # grow whole words
                            while largerRange[1][0] > 0 and /[A-Za-z]/.test @line(largerRange[0])[largerRange[1][0]-1]
                                largerRange[1][0] -= 1
                                largerText = @textInRange largerRange
                        text = largerText                        
                        @selectSingleRange largerRange if @numSelections() == 1
            
            @setHighlights @rangesForText text, max:9999
            
            # this should be done somewhere else (commandline or find/search commands)
            if @renderHighlights?
                @renderHighlights()
                @emit 'highlight'
                                
                @focus()

    #  0000000  000      00000000   0000000   00000000   
    # 000       000      000       000   000  000   000  
    # 000       000      0000000   000000000  0000000    
    # 000       000      000       000   000  000   000  
    #  0000000  0000000  00000000  000   000  000   000  
    
    clearHighlights: ->
        
        if @numHighlights()
            @setHighlights []
            @emit 'highlight'
            
    # 00000000   00000000  00     00   0000000   000   000  00000000  
    # 000   000  000       000   000  000   000  000   000  000       
    # 0000000    0000000   000000000  000   000   000 000   0000000   
    # 000   000  000       000 0 000  000   000     000     000       
    # 000   000  00000000  000   000   0000000       0      00000000  
    
    removeSelectedHighlight: -> # command+shift+d
        
        cp = @cursorPos()
        sel = @selections()
        sr = rangeAtPosInRanges cp, sel
        hr = rangeAtPosInRanges cp, @highlights()
        if sr and hr
            @removeSelectionAtIndex sel.indexOf sr 
