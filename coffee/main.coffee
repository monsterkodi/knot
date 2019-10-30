###
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
###

{ post, filelist, prefs, slash, empty, args, app, win, fs } = require 'kxk'

{ BrowserWindow } = require 'electron'

main = undefined

post.on 'newWindow' -> main.createWindow()

# 000   000  000  000   000   0000000
# 000 0 000  000  0000  000  000
# 000000000  000  000 0 000  0000000
# 000   000  000  000  0000       000
# 00     00  000  000   000  0000000

wins        = -> BrowserWindow.getAllWindows().sort (a,b) -> a.id - b.id
activeWin   = -> BrowserWindow.getFocusedWindow()
visibleWins = -> (w for w in wins() when w?.isVisible() and not w?.isMinimized())

winWithID   = (winID) ->

    wid = parseInt winID
    for w in wins()
        return w if w.id == wid

# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

class Main extends app

    constructor: ->
        
        super
            dir:        __dirname
            pkg:        require '../package.json'
            shortcut:   'Alt+F1'
            index:      'index.html'
            icon:       '../img/app.ico'
            tray:       '../img/menu.png'
            about:      '../img/about.png'
            prefsSeperator: '▸'
            aboutDebug: false  
            minWidth:   500 
            onShow:     -> main.onShow()
            
        @opt.onQuit = @quit
        @moveWindowStashes()
    
    #  0000000   000   000   0000000  000   000   0000000   000   000  
    # 000   000  0000  000  000       000   000  000   000  000 0 000  
    # 000   000  000 0 000  0000000   000000000  000   000  000000000  
    # 000   000  000  0000       000  000   000  000   000  000   000  
    #  0000000   000   000  0000000   000   000   0000000   00     00  
    
    onShow: =>
         
        @restoreWindows() if not args.nostate
        
        if not wins().length
            @createWindow()
        
    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000
    # 000   000  000       000          000     000   000  000   000  000
    # 0000000    0000000   0000000      000     000   000  0000000    0000000
    # 000   000  000            000     000     000   000  000   000  000
    # 000   000  00000000  0000000      000      0000000   000   000  00000000
    
    moveWindowStashes: ->
        
        stashDir = slash.join @userData, 'win'
        if slash.dirExists stashDir
            fs.moveSync stashDir, slash.join(@userData, 'old'), overwrite: true
    
    restoreWindows: ->
    
        fs.ensureDirSync @userData
        stashFiles = filelist slash.join(@userData, 'old'), matchExt:'noon'
        if not empty stashFiles
            for file in stashFiles
                win = @createWindow()
                newStash = slash.join @userData, 'win' "#{win.id}.noon"
                fs.copySync file, newStash
    
    #  0000000   000   000  000  000000000  
    # 000   000  000   000  000     000     
    # 000 00 00  000   000  000     000     
    # 000 0000   000   000  000     000     
    #  00000 00   0000000   000     000     
    
    quit: =>

        toSave = wins().length

        if toSave
            post.toWins 'saveStash'
            post.on 'stashSaved' =>
                toSave -= 1
                if toSave == 0
                    @exitApp()
            'delay'
                
main = new Main()
