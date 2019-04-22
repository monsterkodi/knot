###
 0000000   0000000   000       0000000   00000000    0000000
000       000   000  000      000   000  000   000  000     
000       000   000  000      000   000  0000000    0000000 
000       000   000  000      000   000  000   000       000
 0000000   0000000   0000000   0000000   000   000  0000000 
###

log = console.log

#  0000000   0000000   000       0000000   00000000    0000000  
# 000       000   000  000      000   000  000   000  000       
# 000       000   000  000      000   000  0000000    0000000   
# 000       000   000  000      000   000  000   000       000  
#  0000000   0000000   0000000   0000000   000   000  0000000   

colors = [
    '#222222'
    '#aa0000'
    '#00aa00'
    '#cccc00'
    '#0000ff'
    '#aa00aa'
    '#00aaaa'
    '#aaaaaa'
    # bright
    '#666666'
    '#ff0000'
    '#00ff00'
    '#ffff44'
    '#aaaaff'
    '#ff00ff'
    '#00ffff'
    '#ffffff'
    ]
    
hex = (c) ->
    c = c.toString 16
    if c.length < 2 then '0'+c else c
    
r = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff]

for i in [0...216] # 16-231
    colors[i+16] = '#' + hex(r[(i / 36) % 6 | 0]) + hex(r[(i / 6) % 6 | 0]) + hex(r[i % 6])

for i in [0...24] # 232-255
    r = hex 8 + i * 10
    colors[i+232] = '#' + r + r + r
    
# colors[256] = '#000000' # background
colors[256] = '#ffffff' # background
colors[257] = '#fafafa' # foreground
colors[258] = colors.map (c) ->
    col16 = parseInt c.substring(1), 16
    [(col16 >> 16) & 0xff, (col16 >> 8) & 0xff, col16 & 0xff]

colors = colors.concat [ # dim colors
    '#111111'
    '#660000'
    '#006600'
    '#666600'
    '#000088'
    '#660066'
    '#006666'
    '#666666'
]
    
module.exports = colors
