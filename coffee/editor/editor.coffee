###
00000000  0000000    000  000000000   0000000   00000000
000       000   000  000     000     000   000  000   000
0000000   000   000  000     000     000   000  0000000
000       000   000  000     000     000   000  000   000
00000000  0000000    000     000      0000000   000   000
###

{ clamp, empty, slash, kerror, filelist, klog, _ } = require 'kxk'

Buffer  = require './buffer'
Syntax  = require './syntax'
Do      = require './do'

class Editor extends Buffer

    @actions = null

    @: (name, config) ->

        super()

        @name   = name
        @config = config ? {}
        @config.syntaxName ?= 'sh'

        Editor.initActions() if not Editor.actions?

        @indentString    = _.padStart '' 4
        @stickySelection = false
        @syntax          = new Syntax @config.syntaxName, @line, @ansiLine
        @do              = new Do @
        
        @setupFileType()

    del: ->

        @do.del()

    #  0000000    0000000  000000000  000   0000000   000   000   0000000
    # 000   000  000          000     000  000   000  0000  000  000
    # 000000000  000          000     000  000   000  000 0 000  0000000
    # 000   000  000          000     000  000   000  000  0000       000
    # 000   000   0000000     000     000   0000000   000   000  0000000

    @initActions: ->

        @actions = []
        for actionFile in filelist(slash.join __dirname, 'actions')
            continue if slash.ext(actionFile) not in ['js' 'coffee']
            actions = require actionFile
            for key,value of actions
                if _.isFunction value
                    # klog "Editor action #{key}"
                    @prototype[key] = value
                else if key == 'actions'
                    for k,v of value
                        if not _.isString v
                            v.key = k if not v.key?
                            @actions.push v

    @actionWithName: (name) ->

        for action in Editor.actions
            if action.name == name
                return action
        null

    # 000000000  000   000  00000000   00000000
    #    000      000 000   000   000  000
    #    000       00000    00000000   0000000
    #    000        000     000        000
    #    000        000     000        00000000

    setupFileType: ->

        oldType = @fileType
        newType = @config?.syntaxName ? 'sh'

        @syntax?.setFileType newType
        @setFileType newType

        if oldType != @fileType
            @emit 'fileTypeChanged' @fileType

    setFileType: (@fileType) ->

        # _______________________________________________________________ strings

        @stringCharacters =
            "'":  'single'
            '"':  'double'

        switch @fileType
            when 'md'   then @stringCharacters['*'] = 'bold'
            when 'noon' then @stringCharacters['|'] = 'pipe'

        # _______________________________________________________________ brackets

        @bracketCharacters =
            open:
                '[': ']'
                '{': '}'
                '(': ')'
            close:   {}
            regexps: []

        switch @fileType
            when 'html' then @bracketCharacters.open['<'] = '>'

        for k,v of @bracketCharacters.open
            @bracketCharacters.close[v] = k

        @bracketCharacters.regexp = []
        for key in ['open' 'close']
            cstr = _.keys(@bracketCharacters[key]).join ''
            reg = new RegExp "[#{_.escapeRegExp cstr}]"
            @bracketCharacters.regexps.push [reg, key]

        # _______________________________________________________________ surround

        @initSurround()

        # _______________________________________________________________ indent

        @indentNewLineMore = null
        @indentNewLineLess = null
        @insertIndentedEmptyLineBetween = '{}'

        # _______________________________________________________________ comment

        @lineComment  = '#'
        @multiComment = '###'

    #  0000000  00000000  000000000         000      000  000   000  00000000   0000000
    # 000       000          000            000      000  0000  000  000       000
    # 0000000   0000000      000            000      000  000 0 000  0000000   0000000
    #      000  000          000            000      000  000  0000  000            000
    # 0000000   00000000     000            0000000  000  000   000  00000000  0000000

    setText: (text="") ->

        lines = text.split /\n/

        @newlineCharacters = '\n'
        if not empty lines
            if lines[0].endsWith '\r'
                lines = text.split /\r?\n/
                @newlineCharacters = '\r\n'

        # klog 'setText' lines
        @setLines lines

    setLines: (lines) ->

        # klog 'setLines' lines.length
        @syntax.clear()
        @syntax.setLines lines
        super lines
        @emit 'linesSet' lines

    textOfSelectionForClipboard: ->

        if @numSelections()
            @textOfSelection()
        else
            @textInRanges @rangesForCursorLines()

    splitStateLineAtPos: (state, pos) ->

        l = state.line pos[1]
        kerror "no line at pos #{pos}?" if not l?
        return ['' ''] if not l?
        [l.slice(0, pos[0]), l.slice(pos[0])]

    # 00000000  00     00  000  000000000       000  000   000   0000000  00000000  00000000   000000000
    # 000       000   000  000     000          000  0000  000  000       000       000   000     000   
    # 0000000   000000000  000     000          000  000 0 000  0000000   0000000   0000000       000   
    # 000       000 0 000  000     000          000  000  0000       000  000       000   000     000   
    # 00000000  000   000  000     000          000  000   000  0000000   00000000  000   000     000   

    emitInsert: ->

        mc = @mainCursor()
        line = @line mc[1]

        @emit 'insert',
            line:   line
            before: line.slice 0, mc[0]
            after:  line.slice mc[0]
            cursor: mc

    # 000  000   000  0000000    00000000  000   000  000000000   0000000  000000000  00000000
    # 000  0000  000  000   000  000       0000  000     000     000          000     000   000
    # 000  000 0 000  000   000  0000000   000 0 000     000     0000000      000     0000000
    # 000  000  0000  000   000  000       000  0000     000          000     000     000   000
    # 000  000   000  0000000    00000000  000   000     000     0000000      000     000   000

    indentStringForLineAtIndex: (li) ->

        while empty(@line(li).trim()) and li > 0
            li--

        if 0 <= li < @numLines()

            il = 0
            line = @line li
            thisIndent   = @indentationAtLineIndex li
            indentLength = @indentString.length

            if @indentNewLineMore?
                if @indentNewLineMore.lineEndsWith?.length
                    for e in @indentNewLineMore.lineEndsWith
                        if line.trim().endsWith e
                            il = thisIndent + indentLength
                            break
                if il == 0
                    if @indentNewLineMore.lineRegExp? and @indentNewLineMore.lineRegExp.test line
                        il = thisIndent + indentLength

            il = thisIndent if il == 0
            il = Math.max il, @indentationAtLineIndex li+1

            _.padStart '' il
        else
            ''

module.exports = Editor
