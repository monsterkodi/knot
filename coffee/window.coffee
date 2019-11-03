###
000   000  000  000   000  0000000     0000000   000   000  
000 0 000  000  0000  000  000   000  000   000  000 0 000  
000000000  000  000 0 000  000   000  000   000  000000000  
000   000  000  000  0000  000   000  000   000  000   000  
00     00  000  000   000  0000000     0000000   00     00  
###

{ post, stopEvent, keyinfo, childp, stash, slash, prefs, empty, clamp, open, win, udp, os, kerror, klog, $, _ } = require 'kxk'

Tabs     = require './tabs'
Brain    = require './brain'
Wheel    = require './tools/wheel'
History  = require './history'
electron = require 'electron'
         
w = new win
    dir:    __dirname
    pkg:    require '../package.json'
    menu:   '../coffee/menu.noon'
    icon:   '../img/menu@2x.png'
    prefsSeperator: '▸'
    # onLoad: -> window.term.onResize()
    context: (items) -> onContext items

window.win = electron.remote.getCurrentWindow()
window.winID = window.win.id
    
# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000
# 00000000   0000000    0000000   000000    0000000
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000

# log "create stash #{window.winID}"
window.stash = new stash "win/#{window.winID}"

saveStash = ->

    post.emit 'stash'
    window.stash.save()
    post.toMain 'stashSaved'

if bounds = window.stash.get 'bounds'
    window.win.setBounds bounds

if window.stash.get 'devTools'
    window.win.webContents.openDevTools()

window.tabs = tabs = new Tabs $ "#titlebar"
window.brain = new Brain
window.wheel = new Wheel 

History.init()

term = -> (tabs.activeTab() ? tabs.tabs[0]).term

#  0000000   000   000   0000000  000       0000000    0000000  00000000
# 000   000  0000  000  000       000      000   000  000       000
# 000   000  000 0 000  000       000      000   000  0000000   0000000
# 000   000  000  0000  000       000      000   000       000  000
#  0000000   000   000   0000000  0000000   0000000   0000000   00000000

onMove  = -> window.stash.set 'bounds' window.win.getBounds()

clearListeners = ->

    window.win.removeListener 'close' onClose
    window.win.removeListener 'move'  onMove
    window.win.webContents.removeAllListeners 'devtools-opened'
    window.win.webContents.removeAllListeners 'devtools-closed'

onClose = ->
    
    if electron.remote.BrowserWindow.getAllWindows().length > 1
        window.stash.clear()
        
    clearListeners()

window.win.on 'resize' -> tabs.resized()

#  0000000   000   000  000       0000000    0000000   0000000
# 000   000  0000  000  000      000   000  000   000  000   000
# 000   000  000 0 000  000      000   000  000000000  000   000
# 000   000  000  0000  000      000   000  000   000  000   000
#  0000000   000   000  0000000   0000000   000   000  0000000

window.onload = ->

    window.win.on 'close' onClose
    window.win.on 'move'  onMove
    window.win.webContents.on 'devtools-opened' -> window.stash.set 'devTools' true
    window.win.webContents.on 'devtools-closed' -> window.stash.set 'devTools'

# 00000000   00000000  000       0000000    0000000   0000000
# 000   000  000       000      000   000  000   000  000   000
# 0000000    0000000   000      000   000  000000000  000   000
# 000   000  000       000      000   000  000   000  000   000
# 000   000  00000000  0000000   0000000   000   000  0000000

reloadWin = ->

    saveStash()
    clearListeners()
    window.win.webContents.reloadIgnoringCache()

#  0000000   00000000   00000000  000   000  
# 000   000  000   000  000       0000  000  
# 000   000  00000000   0000000   000 0 000  
# 000   000  000        000       000  0000  
#  0000000   000        00000000  000   000  

koSend = null

openFile = (f) ->
  
    [file, line] = slash.splitFileLine f
    
    switch prefs.get 'editor' 'Visual Studio'
        when 'VS Code'
            open "vscode://file/" + slash.resolve f
        when 'Visual Studio'
            file = slash.unslash slash.resolve file
            bat = slash.unslash slash.resolve slash.join __dirname, '../bin/openFile/openVS.bat'
            childp.exec "\"#{bat}\" \"#{file}\" #{line} 0" { cwd:slash.dir(bat) }, (err) -> 
                kerror 'vb' err if not empty err
        when 'Atom'
            file = slash.unslash slash.resolve file
            atom = slash.unslash slash.untilde '~/AppData/Local/atom/bin/atom'
            childp.exec "\"#{atom}\" \"#{file}:#{line}\"" { cwd:slash.dir(file) }, (err) -> 
                kerror 'atom' err if not empty err
        else
            if not koSend then koSend = new udp port:9779
            koSend.send slash.resolve f
    
post.on 'openFile' openFile
post.on 'saveStash' -> saveStash()

# 00000000   0000000   000   000  000000000      0000000  000  0000000  00000000
# 000       000   000  0000  000     000        000       000     000   000
# 000000    000   000  000 0 000     000        0000000   000    000    0000000
# 000       000   000  000  0000     000             000  000   000     000
# 000        0000000   000   000     000        0000000   000  0000000  00000000

defaultFontSize = 18

getFontSize = -> prefs.get 'fontSize' defaultFontSize

setFontSize = (s) ->
                
    s = getFontSize() if not _.isFinite s
    s = parseInt clamp 8, 88, s

    prefs.set 'fontSize' s
    post.emit 'fontSize' s

window.setFontSize = setFontSize
    
resetFontSize = -> setFontSize defaultFontSize
     
# 000   000  000   000  00000000  00000000  000      
# 000 0 000  000   000  000       000       000      
# 000000000  000000000  0000000   0000000   000      
# 000   000  000   000  000       000       000      
# 00     00  000   000  00000000  00000000  0000000  

onWheel = (event) ->
    
    { mod, key, combo } = keyinfo.forEvent event

    if mod == (os.platform() == 'darwin' and 'command' or 'ctrl')
        
        post.emit 'stopWheel'
        
        s = getFontSize()
                
        if event.deltaY < 0
            setFontSize s+1
        else
            setFontSize s-1
        
    else
        window.wheel.onWheel event
        
    stopEvent event
    
post.on 'scrollBy' (delta) -> term().scrollBy delta

window.document.addEventListener 'wheel' onWheel, true 
    
# 00     00  00000000  000   000  000   000   0000000    0000000  000000000  000   0000000   000   000  
# 000   000  000       0000  000  000   000  000   000  000          000     000  000   000  0000  000  
# 000000000  0000000   000 0 000  000   000  000000000  000          000     000  000   000  000 0 000  
# 000 0 000  000       000  0000  000   000  000   000  000          000     000  000   000  000  0000  
# 000   000  00000000  000   000   0000000   000   000   0000000     000     000   0000000   000   000  

setEditor = (editor) ->
    
    prefs.set 'editor' editor
    klog "editor: #{prefs.get 'editor'}"

post.on 'menuAction' (action) ->
    
    switch action
        when 'Close Tab'        then tabs.closeTab()
        when 'Close Other Tabs' then tabs.closeOtherTabs()
        when 'Previous Tab'     then tabs.navigate 'left'
        when 'Next Tab'         then tabs.navigate 'right'
        when 'New Window'       then post.toMain 'newWindow'
        when 'New Tab'          then tabs.addTab()
        when 'Increase'         then setFontSize getFontSize()+1
        when 'Decrease'         then setFontSize getFontSize()-1
        when 'Reset'            then resetFontSize()
        when 'Clear'            then term().clear(); term().pwd()
        when 'Copy'             then term().editor.copy()
        when 'Paste'            then term().editor.paste()
        when 'Visual Studio' 'VS Code' 'Atom' 'ko'
            setEditor action

#  0000000   0000000   000   000  000000000  00000000  000   000  000000000  
# 000       000   000  0000  000     000     000        000 000      000     
# 000       000   000  000 0 000     000     0000000     00000       000     
# 000       000   000  000  0000     000     000        000 000      000     
#  0000000   0000000   000   000     000     00000000  000   000     000     
    
onContext = (items) ->
    [    
         text:'Clear' combo:'command+k' accel:'alt+ctrl+k'
    ,
         text: ''
    ].concat items
            
# 000  000   000  000  000000000    
# 000  0000  000  000     000       
# 000  000 0 000  000     000       
# 000  000  0000  000     000       
# 000  000   000  000     000       

process.chdir slash.untilde prefs.get 'cwd' '~'
post.emit 'restore'
