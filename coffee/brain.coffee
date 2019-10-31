###
0000000    00000000    0000000   000  000   000
000   000  000   000  000   000  000  0000  000
0000000    0000000    000000000  000  000 0 000
000   000  000   000  000   000  000  000  0000
0000000    000   000  000   000  000  000   000
###

{ post, kerror, prefs, kstr, klog, $, _ } = require 'kxk'

class Brain

    @: ->
        
        @especial          = ("\\"+c for c in "_-@#").join ''
        @splitRegExp       = new RegExp "[^\\w\\d#{@especial}]+" 'g'   
        @headerRegExp      = new RegExp "^[0#{@especial}]+$"
        @notSpecialRegExp  = new RegExp "[^#{@especial}]"
        
        @defaultWords = 
            history:count:999
            cd:count:999
            alias:count:666
            clear:count:0
            help:count:0
            
        @words = prefs.get 'brain▸words' _.cloneDeep @defaultWords
        @cmds  = prefs.get 'brain▸cmds' {}
        
        post.on 'cmd' @onCmd
    
    clear: => 
        
        @words = _.cloneDeep @defaultWords
        @cmds  = []
        
    onCmd: (cmd, cwd) =>
                
        if not cmd?.split? then return kerror "Brain.onCmd -- no split? #{cmd}"
            
        @addCmd cmd
        
        words = cmd.split @splitRegExp
        
        words = words.filter (w) => 
            return false if @headerRegExp.test w
            true
            
        for w in words # append words without leading special character
            i = w.search @notSpecialRegExp
            if i > 0 and w[0] != "#"
                w = w.slice i
                words.push w if not /^[\-]?[\d]+$/.test w
    
        for w in words
            @addWord w
        
        prefs.set 'brain▸words' @words
        prefs.set 'brain▸cmds'  @cmds
    
    addCmd: (cmd) ->
        
        return if cmd?.length < 2
        info       = @cmds[cmd] ? {}
        info.count = (info.count ? 0) + 1
        @cmds[cmd] = info
            
    addWord: (word) ->
        
        return if word?.length < 2
        info         = @words[word] ? {}
        info.count   = (info.count ? 0) + 1
        @words[word] = info
        
    dump: (editor) ->
        
        s  = '\nwords\n'
        Object.keys(@words).sort().map (w) => s+="     #{kstr.rpad w, 20} #{@words[w].count}\n"
        s += '\ncmds\n'
        Object.keys(@cmds).sort().map (w) => s+="     #{kstr.rpad w, 20} #{@cmds[w].count}\n"

        editor?.appendOutput s

module.exports = Brain
