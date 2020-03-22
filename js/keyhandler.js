// koffee 1.3.0

/*
000   000  00000000  000   000  000   000   0000000   000   000  0000000    000      00000000  00000000 
000  000   000        000 000   000   000  000   000  0000  000  000   000  000      000       000   000
0000000    0000000     00000    000000000  000000000  000 0 000  000   000  000      0000000   0000000  
000  000   000          000     000   000  000   000  000  0000  000   000  000      000       000   000
000   000  00000000     000     000   000  000   000  000   000  0000000    0000000  00000000  000   000
 */
var $, ESC, KeyHandler, electron, empty, klog, post, ref, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, empty = ref.empty, klog = ref.klog, $ = ref.$;

ESC = '\x1b';

electron = require('electron');

KeyHandler = (function() {
    function KeyHandler(term) {
        this.term = term;
        this.onCombo = bind(this.onCombo, this);
        this.write = bind(this.write, this);
        post.on('combo', this.onCombo);
    }

    KeyHandler.prototype.write = function(data) {
        return this.term.shell.write(data);
    };

    KeyHandler.prototype.onCombo = function(combo, info) {
        var event, modifiers, ref1;
        switch (combo) {
            case 'enter':
                return this.write('\x0d');
        }
        event = info.event;
        if (info.char && ((ref1 = event.keyCode) !== 9)) {
            return this.write(info.char);
        } else {
            modifiers = (event.shiftKey && 1 || 0) | (event.altKey && 2 || 0) | (event.ctrlKey && 4 || 0) | (event.metaKey && 8 || 0);
            return this.onKeyCode(event.keyCode, modifiers, info);
        }
    };

    KeyHandler.prototype.onKeyCode = function(keyCode, modifiers, info) {
        var writeMod;
        if (info.mod === 'ctrl') {
            if (keyCode >= 65 && keyCode <= 90) {
                if (keyCode !== 86) {
                    this.write(String.fromCharCode(keyCode - 64));
                }
                switch (keyCode) {
                    case 86:
                    case 67:
                        break;
                    default:
                        stopEvent(info.event);
                }
                return;
            }
        }
        writeMod = (function(_this) {
            return function(mpre, mpost, pure, square) {
                if (square == null) {
                    square = true;
                }
                if (modifiers) {
                    return _this.write(ESC + '[' + mpre + ';' + (modifiers + 1) + mpost);
                } else {
                    if (square) {
                        return _this.write(ESC + '[' + pure);
                    } else {
                        return _this.write(ESC + pure);
                    }
                }
            };
        })(this);
        switch (keyCode) {
            case 27:
                return this.write(ESC);
            case 9:
                if (indexOf.call(info.mod, 'shift') >= 0) {
                    return this.write(ESC + '[Z');
                } else {
                    stopEvent(info.event);
                    return this.write('\t');
                }
                break;
            case 37:
                return stopEvent(event, writeMod('1', 'D', 'D'));
            case 39:
                return stopEvent(event, writeMod('1', 'C', 'C'));
            case 38:
                return stopEvent(event, writeMod('1', 'A', 'A'));
            case 40:
                return stopEvent(event, writeMod('1', 'B', 'B'));
            case 33:
                return stopEvent(event, writeMod('5', '~', '5~'));
            case 34:
                return stopEvent(event, writeMod('6', '~', '6~'));
            case 35:
                return stopEvent(event, writeMod('1', 'F', 'F'));
            case 36:
                return stopEvent(event, writeMod('1', 'H', 'H'));
            default:
                return console.log("keyhandler.keyCode " + keyCode);
        }
    };

    return KeyHandler;

})();

module.exports = KeyHandler;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5aGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK0RBQUE7SUFBQTs7O0FBUUEsTUFBc0MsT0FBQSxDQUFRLEtBQVIsQ0FBdEMsRUFBRSxlQUFGLEVBQVEseUJBQVIsRUFBbUIsaUJBQW5CLEVBQTBCLGVBQTFCLEVBQWdDOztBQUVoQyxHQUFBLEdBQU07O0FBQ04sUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUVMO0lBRVcsb0JBQUMsSUFBRDtRQUFDLElBQUMsQ0FBQSxPQUFEOzs7UUFFVixJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBaUIsSUFBQyxDQUFBLE9BQWxCO0lBRlM7O3lCQUliLEtBQUEsR0FBTyxTQUFDLElBQUQ7ZUFBVSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFaLENBQWtCLElBQWxCO0lBQVY7O3lCQVFQLE9BQUEsR0FBUyxTQUFDLEtBQUQsRUFBUSxJQUFSO0FBSUwsWUFBQTtBQUFBLGdCQUFPLEtBQVA7QUFBQSxpQkFDUyxPQURUO0FBRVEsdUJBQU8sSUFBQyxDQUFBLEtBQUQsQ0FBTyxNQUFQO0FBRmY7UUFJQSxLQUFBLEdBQVEsSUFBSSxDQUFDO1FBQ2IsSUFBRyxJQUFJLENBQUMsSUFBTCxJQUFjLFNBQUEsS0FBSyxDQUFDLFFBQU4sS0FBc0IsQ0FBdEIsQ0FBakI7bUJBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFJLENBQUMsSUFBWixFQURKO1NBQUEsTUFBQTtZQUdJLFNBQUEsR0FBWSxDQUFDLEtBQUssQ0FBQyxRQUFOLElBQW1CLENBQW5CLElBQXdCLENBQXpCLENBQUEsR0FBOEIsQ0FBQyxLQUFLLENBQUMsTUFBTixJQUFpQixDQUFqQixJQUFzQixDQUF2QixDQUE5QixHQUEwRCxDQUFDLEtBQUssQ0FBQyxPQUFOLElBQWtCLENBQWxCLElBQXVCLENBQXhCLENBQTFELEdBQXVGLENBQUMs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R0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBakI7QUFoQmxCO3VCQWtCTyxPQUFBLENBQUMsR0FBRCxDQUFLLHFCQUFBLEdBQXNCLE9BQTNCO0FBbEJQO0lBckJPOzs7Ozs7QUF5Q2YsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgc3RvcEV2ZW50LCBlbXB0eSwga2xvZywgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5FU0MgPSAnXFx4MWInXG5lbGVjdHJvbiA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5jbGFzcyBLZXlIYW5kbGVyXG5cbiAgICBjb25zdHJ1Y3RvcjogKEB0ZXJtKSAtPiBcbiAgICBcbiAgICAgICAgcG9zdC5vbiAnY29tYm8nLCBAb25Db21ib1xuICAgICAgICBcbiAgICB3cml0ZTogKGRhdGEpID0+IEB0ZXJtLnNoZWxsLndyaXRlIGRhdGFcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIFxuXG4gICAgb25Db21ibzogKGNvbWJvLCBpbmZvKSA9PlxuXG4gICAgICAgICMgbG9nICdrZXloYW5kbGVyLm9uQ29tYm8nLCBpbmZvLm1vZCwgaW5mby5rZXksIGluZm8uY29tYm8sIGluZm8uY2hhclxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICB3aGVuICdlbnRlcidcbiAgICAgICAgICAgICAgICByZXR1cm4gQHdyaXRlICdcXHgwZCdcbiAgICAgICAgICAgIFxuICAgICAgICBldmVudCA9IGluZm8uZXZlbnRcbiAgICAgICAgaWYgaW5mby5jaGFyIGFuZCBldmVudC5rZXlDb2RlIG5vdCBpbiBbOV1cbiAgICAgICAgICAgIEB3cml0ZSBpbmZvLmNoYXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbW9kaWZpZXJzID0gKGV2ZW50LnNoaWZ0S2V5IGFuZCAxIG9yIDApIHwgKGV2ZW50LmFsdEtleSBhbmQgMiBvciAwKSB8IChldmVudC5jdHJsS2V5IGFuZCA0IG9yIDApIHwgKGV2ZW50Lm1ldGFLZXkgYW5kIDggb3IgMClcbiAgICAgICAgICAgIEBvbktleUNvZGUgZXZlbnQua2V5Q29kZSwgbW9kaWZpZXJzLCBpbmZvXG4gICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25LZXlDb2RlOiAoa2V5Q29kZSwgbW9kaWZpZXJzLCBpbmZvKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGluZm8ubW9kID09ICdjdHJsJ1xuICAgICAgICAgICAgaWYga2V5Q29kZSA+PSA2NSBhbmQga2V5Q29kZSA8PSA5MFxuICAgICAgICAgICAgICAgIGlmIGtleUNvZGUgIT0gODZcbiAgICAgICAgICAgICAgICAgICAgQHdyaXRlIFN0cmluZy5mcm9tQ2hhckNvZGUga2V5Q29kZSAtIDY0XG4gICAgICAgICAgICAgICAgc3dpdGNoIGtleUNvZGVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiA4NiwgNjcgdGhlbiAjIGN0cmwrdiwgY3RybCtjXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3BFdmVudCBpbmZvLmV2ZW50XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICB3cml0ZU1vZCA9IChtcHJlLCBtcG9zdCwgcHVyZSwgc3F1YXJlPXRydWUpID0+XG4gICAgICAgICAgICBpZiBtb2RpZmllcnNcbiAgICAgICAgICAgICAgICBAd3JpdGUgRVNDICsgJ1snICsgbXByZSArICc7JyArIChtb2RpZmllcnMgKyAxKSArIG1wb3N0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgc3F1YXJlXG4gICAgICAgICAgICAgICAgICAgIEB3cml0ZSBFU0MgKyAnWycgKyBwdXJlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAd3JpdGUgRVNDICsgcHVyZVxuICAgICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBrZXlDb2RlXG4gICAgICAgICAgICB3aGVuIDI3ICB0aGVuIEB3cml0ZSBFU0NcbiAgICAgICAgICAgIHdoZW4gOSAgIyB0YWJcbiAgICAgICAgICAgICAgICBpZiAnc2hpZnQnIGluIGluZm8ubW9kXG4gICAgICAgICAgICAgICAgICAgIEB3cml0ZSBFU0MgKyAnW1onXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBzdG9wRXZlbnQgaW5mby5ldmVudFxuICAgICAgICAgICAgICAgICAgICBAd3JpdGUgJ1xcdCdcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuIDM3ICB0aGVuIHN0b3BFdmVudCBldmVudCwgd3JpdGVNb2QgJzEnLCAnRCcsICdEJyAgIyBsZWZ0LWFycm93IFxuICAgICAgICAgICAgd2hlbiAzOSAgdGhlbiBzdG9wRXZlbnQgZXZlbnQsIHdyaXRlTW9kICcxJywgJ0MnLCAnQycgICMgcmlnaHQtYXJyb3dcbiAgICAgICAgICAgIHdoZW4gMzggIHRoZW4gc3RvcEV2ZW50IGV2ZW50LCB3cml0ZU1vZCAnMScsICdBJywgJ0EnICAjIHVwICAgXltPQSBpZiBAYXBwbGljYXRpb25DdXJzb3I/XG4gICAgICAgICAgICB3aGVuIDQwICB0aGVuIHN0b3BFdmVudCBldmVudCwgd3JpdGVNb2QgJzEnLCAnQicsICdCJyAgIyBkb3duIF5bT0IgaWYgQGFwcGxpY2F0aW9uQ3Vyc29yP1xuICAgICAgICAgICAgd2hlbiAzMyAgdGhlbiBzdG9wRXZlbnQgZXZlbnQsIHdyaXRlTW9kICc1JywgJ34nLCAnNX4nICMgcGFnZSB1cFxuICAgICAgICAgICAgd2hlbiAzNCAgdGhlbiBzdG9wRXZlbnQgZXZlbnQsIHdyaXRlTW9kICc2JywgJ34nLCAnNn4nICMgcGFnZSBkb3duXG4gICAgICAgICAgICB3aGVuIDM1ICB0aGVuIHN0b3BFdmVudCBldmVudCwgd3JpdGVNb2QgJzEnLCAnRicsICdGJyAgIyBlbmRcbiAgICAgICAgICAgIHdoZW4gMzYgIHRoZW4gc3RvcEV2ZW50IGV2ZW50LCB3cml0ZU1vZCAnMScsICdIJywgJ0gnICAjIGhvbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBsb2cgXCJrZXloYW5kbGVyLmtleUNvZGUgI3trZXlDb2RlfVwiXG4gICAgICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEtleUhhbmRsZXJcbiJdfQ==
//# sourceURL=../coffee/keyhandler.coffee