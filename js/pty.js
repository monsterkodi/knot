// koffee 1.12.0

/*
00000000   000000000  000   000  
000   000     000      000 000   
00000000      000       00000    
000           000        000     
000           000        000
 */
var PTY, klog, pty, ref, title,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), title = ref.title, klog = ref.klog;

pty = require('node-pty');

PTY = (function() {
    function PTY(term) {
        this.term = term;
        this.onData = bind(this.onData, this);
        this.editor = this.term.editor;
        this.spawn();
    }

    PTY.prototype.spawn = function() {
        var shell;
        shell = 'C:/msys64/usr/bin/bash.exe';
        this.pty = pty.spawn(shell, [], {
            useConpty: true,
            name: 'xterm-256color',
            cols: parseInt((this.editor.layers.offsetWidth - this.editor.size.numbersWidth) / this.editor.size.charWidth),
            rows: this.editor.scroll.fullLines,
            cwd: process.cwd(),
            env: process.env
        });
        klog('@pty rows', this.pty.rows, 'cols', this.pty.cols, this.editor.layers.offsetWidth, this.editor.size.charWidth, this.editor.layers.offsetWidth / this.editor.size.charWidth);
        return this.pty.onData(this.onData);
    };

    PTY.prototype.handleKey = function(mod, key, combo, char, event) {
        switch (key) {
            case 'enter':
                return this.pty.write('\r');
            case 'backspace':
                return this.pty.write('\x08');
            default:
                if (char) {
                    return this.pty.write(char);
                } else {
                    return klog('key', mod, key, combo);
                }
        }
    };

    PTY.prototype.onData = function(data) {
        var ch, ci, code, col, crazyNewlines, imeds, line, next, param, ref1, row;
        line = '';
        code = 0;
        ci = -1;
        ch = null;
        crazyNewlines = 0;
        next = function() {
            ci += 1;
            ch = data[ci];
            return code = ch.charCodeAt(0);
        };
        while (ci < data.length - 1) {
            next();
            switch (code) {
                case 7:
                    klog('🔔');
                    break;
                case 8:
                    this.editor.deleteBackward({
                        singleCharacter: true
                    });
                    if (data[ci + 1] === ' ' && data[ci + 2].charCodeAt(0) === 8) {
                        next();
                        next();
                    }
                    break;
                case 27:
                    next();
                    if ((0x40 <= code && code <= 0x5f)) {
                        switch (ch) {
                            case '[':
                                param = '';
                                imeds = '';
                                next();
                                while ((0x30 <= code && code <= 0x3F)) {
                                    param += ch;
                                    next();
                                }
                                while ((0x20 <= code && code <= 0x2F)) {
                                    imeds += ch;
                                    next();
                                }
                                if ((0x40 <= code && code <= 0x7E)) {
                                    klog("    esc[" + param + imeds + ch);
                                    switch (ch) {
                                        case 'm':
                                            line += "\x1B[" + param + imeds + ch;
                                            break;
                                        case 'X':
                                            if (data.slice(ci + 1) === ("\x1b[" + param + "C\x0d")) {
                                                ci += 3 + param.length;
                                                klog('skipped crazy newline', data[ci + 1]);
                                            }
                                            break;
                                        case 'C':
                                            if (data[ci + 1] === '\r' && data[ci + 2] === '\n') {
                                                if (parseInt(param) === this.pty.cols) {
                                                    ci += 2;
                                                    crazyNewlines += 1;
                                                }
                                            }
                                            break;
                                        case 'J':
                                            switch (param) {
                                                case '0':
                                                case '':
                                                    klog('erase below');
                                                    break;
                                                case '1':
                                                    klog('erase above');
                                                    break;
                                                case '2':
                                                    klog('erase all');
                                                    break;
                                                case '3':
                                                    klog('erase saved');
                                                    break;
                                                default:
                                                    console.log('erase ???');
                                            }
                                            break;
                                        case 'H':
                                            if (param.length) {
                                                ref1 = param.split(';'), row = ref1[0], col = ref1[1];
                                                if (col != null) {
                                                    col;
                                                } else {
                                                    col = 1;
                                                }
                                            } else {
                                                row = col = 1;
                                                crazyNewlines = 0;
                                                while (data[ci + 1] === '\r' && data[ci + 2] === '\n') {
                                                    ci += 2;
                                                }
                                            }
                                            klog("    move cursor row " + row + " col " + col);
                                    }
                                }
                                break;
                            case ']':
                                if (data[ci + 1] === '0' && data[ci + 2] === ';') {
                                    next();
                                    next();
                                    next();
                                    title = '';
                                    while (code !== 7) {
                                        title += ch;
                                        next();
                                    }
                                }
                        }
                    }
                    break;
                case 10:
                    while (crazyNewlines > 0) {
                        this.editor.appendText('');
                        this.editor.singleCursorAtEnd();
                        crazyNewlines -= 1;
                    }
                    klog(">>>|" + line + "|");
                    this.editor.appendInputText(line);
                    this.editor.appendText('');
                    this.editor.singleCursorAtEnd();
                    line = '';
                    break;
                default:
                    line += ch;
            }
        }
        if (line.trim().length) {
            klog("!!!|" + line + "|");
            return this.editor.appendInputText(line);
        } else if (data === ' ') {
            return this.editor.appendInputText(' ');
        }
    };

    return PTY;

})();

module.exports = PTY;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHR5LmpzIiwic291cmNlUm9vdCI6Ii4uL2NvZmZlZSIsInNvdXJjZXMiOlsicHR5LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwwQkFBQTtJQUFBOztBQVFBLE1BQWtCLE9BQUEsQ0FBUSxLQUFSLENBQWxCLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxHQUFBLEdBQU0sT0FBQSxDQUFRLFVBQVI7O0FBRUE7SUFFQyxhQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUMsQ0FBQSxJQUFJLENBQUM7UUFDaEIsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQUhEOztrQkFXSCxLQUFBLEdBQU8sU0FBQTtBQUdILFlBQUE7UUFBQSxLQUFBLEdBQVE7UUFDUixJQUFDLENBQUEsR0FBRCxHQUFPLEdBQUcsQ0FBQyxLQUFKLENBQVUsS0FBVixFQUFpQixFQUFqQixFQUNIO1lBQUEsU0FBQSxFQUFXLElBQVg7WUFDQSxJQUFBLEVBQU0sZ0JBRE47WUFFQSxJQUFBLEVBQU0sUUFBQSxDQUFTLENBQUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBZixHQUE2QixJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUEzQyxDQUFBLEdBQTJELElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQWpGLENBRk47WUFHQSxJQUFBLEVBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FIckI7WUFJQSxHQUFBLEVBQUssT0FBTyxDQUFDLEdBQVIsQ0FBQSxDQUpMO1lBS0EsR0FBQSxFQUFLLE9BQU8sQ0FBQyxHQUxiO1NBREc7UUFRUCxJQUFBLENBQUssV0FBTCxFQUFpQixJQUFDLENBQUEsR0FBRyxDQUFDLElBQXRCLEVBQTRCLE1BQTVCLEVBQW1DLElBQUMsQ0FBQSxHQUFHLENBQUMsSUFBeEMsRUFBOEMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFN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TUFBTSxDQUFDLGVBQVIsQ0FBd0IsR0FBeEIsRUFEQzs7SUFwSUQ7Ozs7OztBQXVJWixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAwMDAgICBcbjAwMDAwMDAwICAgICAgMDAwICAgICAgIDAwMDAwICAgIFxuMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgXG4wMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICBcbiMjI1xuXG57IHRpdGxlLCBrbG9nIH0gPSByZXF1aXJlICdreGsnXG5cbnB0eSA9IHJlcXVpcmUgJ25vZGUtcHR5J1xuXG5jbGFzcyBQVFlcblxuICAgIEA6IChAdGVybSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IgPSBAdGVybS5lZGl0b3JcbiAgICAgICAgQHNwYXduKCkgICAgICAgICAgICAgXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgc3Bhd246IC0+XG4gICAgICAgIFxuICAgICAgICAjIHNoZWxsID0gb3MucGxhdGZvcm0oKSA9PSAnd2luMzInIGFuZCAnY21kJyBvciAnYmFzaCdcbiAgICAgICAgc2hlbGwgPSAnQzovbXN5czY0L3Vzci9iaW4vYmFzaC5leGUnXG4gICAgICAgIEBwdHkgPSBwdHkuc3Bhd24gc2hlbGwsIFtdLFxuICAgICAgICAgICAgdXNlQ29ucHR5OiB0cnVlIFxuICAgICAgICAgICAgbmFtZTogJ3h0ZXJtLTI1NmNvbG9yJ1xuICAgICAgICAgICAgY29sczogcGFyc2VJbnQgKEBlZGl0b3IubGF5ZXJzLm9mZnNldFdpZHRoIC0gQGVkaXRvci5zaXplLm51bWJlcnNXaWR0aCkgLyBAZWRpdG9yLnNpemUuY2hhcldpZHRoXG4gICAgICAgICAgICByb3dzOiBAZWRpdG9yLnNjcm9sbC5mdWxsTGluZXNcbiAgICAgICAgICAgIGN3ZDogcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgZW52OiBwcm9jZXNzLmVudlxuICAgICAgICAgXG4gICAgICAgIGtsb2cgJ0BwdHkgcm93cycgQHB0eS5yb3dzLCAnY29scycgQHB0eS5jb2xzLCBAZWRpdG9yLmxheWVycy5vZmZzZXRXaWR0aCwgQGVkaXRvci5zaXplLmNoYXJXaWR0aCwgQGVkaXRvci5sYXllcnMub2Zmc2V0V2lkdGggLyBAZWRpdG9yLnNpemUuY2hhcldpZHRoXG4gICAgICAgIEBwdHkub25EYXRhIEBvbkRhdGFcbiAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgaGFuZGxlS2V5OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyAgICAgdGhlbiBAcHR5LndyaXRlICdcXHInXG4gICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnIHRoZW4gQHB0eS53cml0ZSAnXFx4MDgnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgY2hhclxuICAgICAgICAgICAgICAgICAgICBAcHR5LndyaXRlIGNoYXJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgJ2tleScgbW9kLCBrZXksIGNvbWJvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvbkRhdGE6IChkYXRhKSA9PlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIFwiLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIlxuICAgICAgICAjIGtsb2cgXCJ8I3tkYXRhfXxcIlxuICAgICAgICBcbiAgICAgICAgbGluZSA9ICcnXG4gICAgICAgIGNvZGUgPSAwXG4gICAgICAgIGNpICAgPSAtMVxuICAgICAgICBjaCAgID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgY3JhenlOZXdsaW5lcyA9IDBcbiAgICAgICAgXG4gICAgICAgIG5leHQgPSAtPiBcbiAgICAgICAgICAgIGNpICs9IDFcbiAgICAgICAgICAgIGNoID0gZGF0YVtjaV1cbiAgICAgICAgICAgIGNvZGUgPSBjaC5jaGFyQ29kZUF0KDApXG4gICAgICAgICAgICAjIGtsb2cgXCIje2tzdHIucGFkIGNvZGUsIDN9IDB4I3tjb2RlLnRvU3RyaW5nKDE2KX0gI3tjaH1cIlxuICAgICAgICBcbiAgICAgICAgd2hpbGUgY2kgPCBkYXRhLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzd2l0Y2ggY29kZVxuICAgICAgICAgICAgICAgIHdoZW4gNyAgdGhlbiBrbG9nICfwn5SUJ1xuICAgICAgICAgICAgICAgIHdoZW4gOCAgXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3IuZGVsZXRlQmFja3dhcmQgc2luZ2xlQ2hhcmFjdGVyOnRydWVcbiAgICAgICAgICAgICAgICAgICAgaWYgZGF0YVtjaSsxXSA9PSAnICcgYW5kIGRhdGFbY2krMl0uY2hhckNvZGVBdCgwKSA9PSA4XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgICAgIHdoZW4gMjcgIyBFU0NcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIDB4NDAgPD0gY29kZSA8PSAweDVmICMgQEHigJNaW1xcXV5fXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggY2ggXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnWycgIyBDU0kgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtID0gJydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1lZHMgPSAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgMHgzMCA8PSBjb2RlIDw9IDB4M0YgIyAw4oCTOTo7PD0+P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW0gKz0gY2hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAweDIwIDw9IGNvZGUgPD0gMHgyRiAjICFcIiMkJSYnKCkqKywtLi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZWRzICs9IGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgMHg0MCA8PSBjb2RlIDw9IDB4N0UgIyBAQeKAk1pbXFxdXl9gYeKAk3p7fH1+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrbG9nIFwiICAgIGVzY1sje3BhcmFtfSN7aW1lZHN9I3tjaH1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnbSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluZSArPSBcIlxceDFCWyN7cGFyYW19I3tpbWVkc30je2NofVwiICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnWCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRhdGFbY2krMS4uXSA9PSBcIlxceDFiWyN7cGFyYW19Q1xceDBkXCIgIyBjcmF6eSBjbWQuZXhlIG5ld2xpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNpICs9IDMrcGFyYW0ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrbG9nICdza2lwcGVkIGNyYXp5IG5ld2xpbmUnIGRhdGFbY2krMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnQydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRhdGFbY2krMV0gPT0gJ1xccicgYW5kIGRhdGFbY2krMl0gPT0gJ1xcbicgIyBtb3JlIGNyYXp5bmVzc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgcGFyc2VJbnQocGFyYW0pID09IEBwdHkuY29sc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNpICs9IDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcmF6eU5ld2xpbmVzICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGtsb2cgXCJjcmF6eSBuZXdsaW5lICN7Y3JhenlOZXdsaW5lc31cIiBkYXRhW2NpKzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ0onXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggcGFyYW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJzAnICcnIHRoZW4ga2xvZyAnZXJhc2UgYmVsb3cnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuICcxJyAgICB0aGVuIGtsb2cgJ2VyYXNlIGFib3ZlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnMicgICAgdGhlbiBrbG9nICdlcmFzZSBhbGwnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuICczJyAgICB0aGVuIGtsb2cgJ2VyYXNlIHNhdmVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZyAnZXJhc2UgPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ0gnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBwYXJhbS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtyb3csY29sXSA9IHBhcmFtLnNwbGl0ICc7J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID89IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm93ID0gY29sID0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JhenlOZXdsaW5lcyA9IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIGRhdGFbY2krMV0gPT0gJ1xccicgYW5kIGRhdGFbY2krMl0gPT0gJ1xcbidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaSArPSAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2xvZyBcIiAgICBtb3ZlIGN1cnNvciByb3cgI3tyb3d9IGNvbCAje2NvbH1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIHdoZW4gJ2gnIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGlmIHBhcmFtID09ICc/MjUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJyAgICBzaG93IGN1cnNvcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIHdoZW4gJ2wnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgaWYgcGFyYW0gPT0gJz8yNSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMga2xvZyAnICAgIGhpZGUgY3Vyc29yJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuICddJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBkYXRhW2NpKzFdID09ICcwJyBhbmQgZGF0YVtjaSsyXSA9PSAnOydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlID0gJydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIGNvZGUgIT0gN1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlICs9IGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIGtsb2cgXCJ0aXRsZTogI3t0aXRsZX1cIlxuICAgICAgICAgICAgICAgICMgd2hlbiAxMyAjIFxcclxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJyAgICBcXHInXG4gICAgICAgICAgICAgICAgd2hlbiAxMCAjIFxcbiBcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIGNyYXp5TmV3bGluZXMgPiAwXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ25vdCBzbyBjcmF6eSdcbiAgICAgICAgICAgICAgICAgICAgICAgIEBlZGl0b3IuYXBwZW5kVGV4dCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdEVuZCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmF6eU5ld2xpbmVzIC09IDFcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGtsb2cgXCI+Pj58I3tsaW5lfXxcIlxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLmFwcGVuZElucHV0VGV4dCBsaW5lXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3IuYXBwZW5kVGV4dCAnJ1xuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9ICcnXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBsaW5lICs9IGNoXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBsaW5lLnRyaW0oKS5sZW5ndGhcbiAgICAgICAgICAgIGtsb2cgXCIhISF8I3tsaW5lfXxcIlxuICAgICAgICAgICAgQGVkaXRvci5hcHBlbmRJbnB1dFRleHQgbGluZVxuICAgICAgICAgICAgIyBAZWRpdG9yLnNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgZWxzZSBpZiBkYXRhID09ICcgJ1xuICAgICAgICAgICAgQGVkaXRvci5hcHBlbmRJbnB1dFRleHQgJyAnXG5cbm1vZHVsZS5leHBvcnRzID0gUFRZXG4iXX0=
//# sourceURL=../coffee/pty.coffee