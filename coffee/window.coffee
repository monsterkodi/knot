###
000   000  000  000   000  0000000     0000000   000   000  
000 0 000  000  0000  000  000   000  000   000  000 0 000  
000000000  000  000 0 000  000   000  000   000  000000000  
000   000  000  000  0000  000   000  000   000  000   000  
00     00  000  000   000  0000000     0000000   00     00  
###

{ post, stopEvent, keyinfo, childp, slash, prefs, clamp, stash, empty, open, udp, win, error, log, $, _ } = require 'kxk'

Term = require './term'
Tabs = require './tabs'
klog = require('kxk').log

electron = require 'electron'
         
w = new win
    dir:    __dirname
    pkg:    require '../package.json'
    menu:   '../coffee/menu.noon'
    icon:   '../img/menu@2x.png'
    onLoad: -> window.term.onResize()
    context: (items) -> onContext items

window.win = electron.remote.getCurrentWindow()
window.winID = window.win.id
    
# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000
# 00000000   0000000    0000000   000000    0000000
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000

log "create stash #{window.winID}"
window.stash = new stash "win/#{window.winID}"

saveStash = ->

    post.emit 'stash'
    window.stash.save()
    post.toMain 'stashSaved'

if bounds = window.stash.get 'bounds'
    window.win.setBounds bounds

if window.stash.get 'devTools'
    window.win.webContents.openDevTools()

window.tabs = new Tabs $ "#titlebar"
window.term = term = new Term

#  0000000   000   000   0000000  000       0000000    0000000  00000000
# 000   000  0000  000  000       000      000   000  000       000
# 000   000  000 0 000  000       000      000   000  0000000   0000000
# 000   000  000  0000  000       000      000   000       000  000
#  0000000   000   000   0000000  0000000   0000000   0000000   00000000

onMove  = -> window.stash.set 'bounds', window.win.getBounds()

clearListeners = ->

    window.win.removeListener 'close', onClose
    window.win.removeListener 'move',  onMove
    window.win.webContents.removeAllListeners 'devtools-opened'
    window.win.webContents.removeAllListeners 'devtools-closed'

onClose = ->
    
    if electron.remote.BrowserWindow.getAllWindows().length > 1
        window.stash.clear()
        
    clearListeners()

#  0000000   000   000  000       0000000    0000000   0000000
# 000   000  0000  000  000      000   000  000   000  000   000
# 000   000  000 0 000  000      000   000  000000000  000   000
# 000   000  000  0000  000      000   000  000   000  000   000
#  0000000   000   000  0000000   0000000   000   000  0000000

window.onload = ->

    window.win.on 'close', onClose
    window.win.on 'move',  onMove
    window.win.webContents.on 'devtools-opened', -> window.stash.set 'devTools', true
    window.win.webContents.on 'devtools-closed', -> window.stash.set 'devTools'

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
    
    switch prefs.get 'editor', 'Visual Studio'
        when 'VS Code'
            open "vscode://file/" + slash.resolve f
        when 'Visual Studio'
            file = slash.unslash slash.resolve file
            bat = slash.unslash slash.resolve slash.join __dirname, '../bin/openFile/openVS.bat'
            childp.exec "\"#{bat}\" \"#{file}\" #{line} 0", { cwd:slash.dir(bat) }, (err) -> 
                error 'vb', err if not empty err
        when 'Atom'
            file = slash.unslash slash.resolve file
            atom = slash.unslash slash.untilde '~/AppData/Local/atom/bin/atom'
            childp.exec "\"#{atom}\" \"#{file}:#{line}\"", { cwd:slash.dir(file) }, (err) -> 
                error 'atom', err if not empty err
        else
            if not koSend then koSend = new udp port:9779
            koSend.send slash.resolve f
    
post.on 'openFile', openFile
post.on 'saveStash', -> saveStash()

# 00000000   0000000   000   000  000000000      0000000  000  0000000  00000000
# 000       000   000  0000  000     000        000       000     000   000
# 000000    000   000  000 0 000     000        0000000   000    000    0000000
# 000       000   000  000  0000     000             000  000   000     000
# 000        0000000   000   000     000        0000000   000  0000000  00000000

defaultFontSize = 19

getFontSize = -> window.stash.get 'fontSize', defaultFontSize

setFontSize = (s) ->
        
    s = getFontSize() if not _.isFinite s
    s = clamp 8, 88, s

    window.stash.set 'fontSize', s
    post.emit 'fontSize', s

window.setFontSize = setFontSize
    
changeFontSize = (d) ->
    
    s = getFontSize()
    if      s >= 30 then f = 4
    else if s >= 50 then f = 10
    else if s >= 20 then f = 2
    else                 f = 1
        
    setFontSize s + f*d

resetFontSize = ->
    
    window.stash.set 'fontSize', defaultFontSize
    setFontSize defaultFontSize
     
# 000   000  000   000  00000000  00000000  000      
# 000 0 000  000   000  000       000       000      
# 000000000  000000000  0000000   0000000   000      
# 000   000  000   000  000       000       000      
# 00     00  000   000  00000000  00000000  0000000  

onWheel = (event) ->
    
    { mod, key, combo } = keyinfo.forEvent event

    if mod == 'ctrl'
        changeFontSize -event.deltaY/100
        stopEvent event
    
window.document.addEventListener 'wheel', onWheel    
    
# 00     00  00000000  000   000  000   000   0000000    0000000  000000000  000   0000000   000   000  
# 000   000  000       0000  000  000   000  000   000  000          000     000  000   000  0000  000  
# 000000000  0000000   000 0 000  000   000  000000000  000          000     000  000   000  000 0 000  
# 000 0 000  000       000  0000  000   000  000   000  000          000     000  000   000  000  0000  
# 000   000  00000000  000   000   0000000   000   000   0000000     000     000   0000000   000   000  

setEditor = (editor) ->
    
    prefs.set 'editor', editor
    klog "editor: #{prefs.get 'editor'}"

post.on 'menuAction', (action) ->
    
    switch action
        when 'Close Tab'        then tabs.closeTab()
        when 'Close Other Tabs' then tabs.closeOtherTabs()
        when 'Previous Tab'     then tabs.navigate 'left'
        when 'Next Tab'         then tabs.navigate 'right'
        when 'New Window'       then post.toMain 'newWindow'
        when 'New Tab'          then term.addTab()
        when 'Increase'         then changeFontSize +1
        when 'Decrease'         then changeFontSize -1
        when 'Reset'            then resetFontSize()
        when 'Clear'            then term.clear()
        when 'Cut'              then term.cut()
        when 'Paste'            then term.paste()
            
        when 'Visual Studio', 'VS Code', 'Atom', 'ko'
            setEditor action

#  0000000   0000000   000   000  000000000  00000000  000   000  000000000  
# 000       000   000  0000  000     000     000        000 000      000     
# 000       000   000  000 0 000     000     0000000     00000       000     
# 000       000   000  000  0000     000     000        000 000      000     
#  0000000   0000000   000   000     000     00000000  000   000     000     
    
onContext = (items) ->
    [    
         text:'Clear', combo:'command+k', accel:'alt+ctrl+k'
    ,
         text: ''
    ].concat items
            
# 000  000   000  000  000000000    
# 000  0000  000  000     000       
# 000  000 0 000  000     000       
# 000  000  0000  000     000       
# 000  000   000  000     000       

post.emit 'restore'
