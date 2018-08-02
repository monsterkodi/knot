###
000   000  000  000   000  0000000     0000000   000   000  
000 0 000  000  0000  000  000   000  000   000  000 0 000  
000000000  000  000 0 000  000   000  000   000  000000000  
000   000  000  000  0000  000   000  000   000  000   000  
00     00  000  000   000  0000000     0000000   00     00  
###

{ post, stopEvent, keyinfo, childp, prefs, clamp, empty, slash, open, udp, win, error, log, $, _ } = require 'kxk'

Term = require './term'
Tabs = require './tabs'
log  = console.log
klog = require('kxk').log

w = new win
    dir:    __dirname
    pkg:    require '../package.json'
    menu:   '../coffee/menu.noon'
    icon:   '../img/menu@2x.png'
    onLoad: -> term.onResize()
    context: (items) -> onContext items
    
window.tabs = new Tabs $ "#titlebar"
window.term = term = new Term

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

# 00000000   0000000   000   000  000000000      0000000  000  0000000  00000000
# 000       000   000  0000  000     000        000       000     000   000
# 000000    000   000  000 0 000     000        0000000   000    000    0000000
# 000       000   000  000  0000     000             000  000   000     000
# 000        0000000   000   000     000        0000000   000  0000000  00000000

defaultFontSize = 18

getFontSize = -> prefs.get 'fontSize', defaultFontSize

setFontSize = (s) ->
        
    s = getFontSize() if not _.isFinite s
    s = clamp 8, 88, s

    prefs.set 'fontSize', s
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
    
    prefs.set 'fontSize', defaultFontSize
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
        when 'New Tab'  then window.tabs.addTab '~'
        when 'Increase' then changeFontSize +1
        when 'Decrease' then changeFontSize -1
        when 'Reset'    then resetFontSize()
        when 'Clear'    then term.clear()
            
        when 'Visual Studio', 'VS Code', 'Atom', 'ko'
            setEditor action

#  0000000   0000000   000   000  000000000  00000000  000   000  000000000  
# 000       000   000  0000  000     000     000        000 000      000     
# 000       000   000  000 0 000     000     0000000     00000       000     
# 000       000   000  000  0000     000     000        000 000      000     
#  0000000   0000000   000   000     000     00000000  000   000     000     
    
onContext = (items) ->
    [    
         text:'Clear', accel:'alt+ctrl+k'
    ,
         text: ''
    ].concat items
            
# 000  000   000  000  000000000    
# 000  0000  000  000     000       
# 000  000 0 000  000     000       
# 000  000  0000  000     000       
# 000  000   000  000     000       

prefs.set 'editor',  prefs.get 'editor', 'ko'
