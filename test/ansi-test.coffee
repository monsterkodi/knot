
log '\x1b[0m Reset / Normal \x1b[0m'
log '\x1b[1m Bold or increased intensity \x1b[0m'
log '\x1b[2m Faint (decreased intensity) \x1b[0m'
log '\x1b[3m Italic \x1b[0m'
log '\x1b[4m Underline \x1b[0m'
log '\x1b[7m reverse \x1b[27mvideo\x1b[0m'
log '\x1b[9m Crossed-out \x1b[0m'

log ' Basic Foreground Colors:'
log '\t\x1b[30m Black foreground\x1b[0m'
log '\t\x1b[31m Red foreground\x1b[0m'
log '\t\x1b[32m Green foreground\x1b[0m'
log '\t\x1b[33m Yellow foreground\x1b[0m'
log '\t\x1b[34m Blue foreground\x1b[0m'
log '\t\x1b[35m Magenta foreground\x1b[0m'
log '\t\x1b[36m Cyan foreground\x1b[0m'
log '\t\x1b[37m White foreground\x1b[0m'
log '\t\x1b[39m Default foreground color \x1b[0m'

log ' Basic Background Colors:'
log '\t\x1b[40m Black background\x1b[0m'
log '\t\x1b[41m Red background\x1b[0m'
log '\t\x1b[42m Green background\x1b[0m'
log '\t\x1b[43m Yellow background\x1b[0m'
log '\t\x1b[44m Blue background\x1b[0m'
log '\t\x1b[45m Magenta background\x1b[0m'
log '\t\x1b[46m Cyan background\x1b[0m'
log '\t\x1b[47m White background\x1b[0m'
log '\t\x1b[49m Default background color \x1b[0m'

log ' Bright Foreground Colors:'
log '\t\x1b[90m Bright Black foreground\x1b[0m'
log '\t\x1b[91m Bright Red foreground\x1b[0m'
log '\t\x1b[92m Bright Green foreground\x1b[0m'
log '\t\x1b[93m Bright Yellow foreground\x1b[0m'
log '\t\x1b[94m Bright Blue foreground\x1b[0m'
log '\t\x1b[95m Bright Magenta foreground\x1b[0m'
log '\t\x1b[96m Bright Cyan foreground\x1b[0m'
log '\t\x1b[97m Bright White foreground\x1b[0m'

log ' Bright Background Colors:'
log '\t\x1b[100m Bright Black background\x1b[0m'
log '\t\x1b[101m Bright Red background\x1b[0m'
log '\t\x1b[102m Bright Green background\x1b[0m'
log '\t\x1b[103m Bright Yellow background\x1b[0m'
log '\t\x1b[104m Bright Blue background\x1b[0m'
log '\t\x1b[105m Bright Magenta background\x1b[0m'
log '\t\x1b[106m Bright Cyan background\x1b[0m'
log '\t\x1b[107m Bright White background\x1b[0m'

log '\nComplex Colors (8-bit)\n'
log 'Foreground'

fgch = "█"
bgch = " "

out = " " 

logo = -> log out; out = ''

for i in [0...16]
    out += "\x1b[38;5;#{i}m#{fgch}\x1b[0m"
logo()

for i in [16...232]
    out += "\x1b[38;5;#{i}m#{fgch}\x1b[0m"
    if ((i - 15) % 36) == 0
        logo()
logo()

for i in [232...256]
    out += "\x1b[38;5;#{i}m#{fgch}\x1b[0m"
logo()

log 'Background'

for i in [0...16]
    out += "\x1b[48;5;#{i}m#{bgch}\x1b[0m"
logo()

for i in [16...232]
    out += "\x1b[48;5;#{i}m#{bgch}\x1b[0m"
    if ((i - 15) % 36) == 0
        logo()

for i in [232...256]
    out += "\x1b[48;5;#{i}m#{bgch}\x1b[0m"
logo()

log '\n24-bit\n'

for r in [0...128] by 16
    for g in [0...256] by 32
        for b in [0...256] by 16
            out += "\x1b[38;2;#{r};#{g};#{b}m#{fgch}\x1b[0m"
    logo()
for r in [128...256] by 16
    for g in [0...256] by 32
        for b in [0...256] by 16
            out += "\x1b[38;2;#{r};#{g};#{b}m#{fgch}\x1b[0m"
    logo()
logo()

g = 0
for r in [0...256] by 8
    for b in [0...256] by 2
        out += "\x1b[48;2;#{r};#{g};#{b}m#{bgch}\x1b[0m"
    logo()

b = 0
for r in [0...256] by 12
    for g in [0...256] by 2
        out += "\x1b[48;2;#{r};#{g};#{b}m#{bgch}\x1b[0m"
    logo()

r = 0
for g in [0...256] by 12
    for b in [0...256] by 2
        out += "\x1b[48;2;#{r};#{g};#{b}m#{bgch}\x1b[0m"
    logo()
    