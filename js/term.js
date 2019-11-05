// koffee 1.4.0

/*
000000000  00000000  00000000   00     00  
   000     000       000   000  000   000  
   000     0000000   0000000    000000000  
   000     000       000   000  000 0 000  
   000     00000000  000   000  000   000
 */
var $, BaseEditor, History, Shell, Term, TextEditor, elem, klog, kpos, post, ref, render, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, slash = ref.slash, elem = ref.elem, kpos = ref.kpos, klog = ref.klog, $ = ref.$;

BaseEditor = require('./editor/editor');

TextEditor = require('./editor/texteditor');

render = require('./editor/render');

History = require('./history');

Shell = require('./shell');

Term = (function() {
    function Term() {
        this.scrollBy = bind(this.scrollBy, this);
        this.resized = bind(this.resized, this);
        this.onFontSize = bind(this.onFontSize, this);
        this.onChanged = bind(this.onChanged, this);
        var main;
        main = $('#main');
        this.div = elem({
            "class": 'term'
        });
        main.appendChild(this.div);
        this.num = 0;
        this.rows = 0;
        this.cols = 0;
        this.size = {
            charWidth: 0,
            lineHeight: 0
        };
        this.editor = new TextEditor(this, {
            features: ['Scrollbar', 'Minimap', 'Meta', 'Numbers', 'Autocomplete', 'Brackets', 'Strings', 'CursorLine']
        });
        this.editor.setText('');
        this.editor.on('changed', this.onChanged);
        this.shell = new Shell(this);
        this.history = new History(this);
        this.autocomplete = this.editor.autocomplete;
        post.on('fontSize', this.onFontSize);
    }

    Term.prototype.addDirMeta = function(dir) {
        return this.editor.meta.add({
            line: Math.max(0, this.editor.numLines() - 2),
            clss: 'pwd',
            number: {
                text: ' ',
                clss: 'pwd'
            },
            end: dir.length + 1,
            click: (function(_this) {
                return function(meta, event) {
                    var i, index, j, next, pos, ref1, ref2;
                    pos = kpos(event);
                    if (pos.x < 40) {
                        index = _this.editor.meta.metas.indexOf(meta);
                        if (index < _this.editor.meta.metas.length - 1) {
                            _this.editor.singleCursorAtPos([0, meta[0]]);
                            if (next = _this.editor.meta.nextMetaOfSameClass(meta)) {
                                for (i = j = ref1 = meta[0], ref2 = next[0]; ref1 <= ref2 ? j < ref2 : j > ref2; i = ref1 <= ref2 ? ++j : --j) {
                                    _this.editor.deleteSelectionOrCursorLines();
                                }
                            }
                            return _this.editor.moveCursorsDown();
                        }
                    } else {
                        _this.editor.singleCursorAtEnd();
                        return _this.shell.cd(_this.editor.line(meta[0]));
                    }
                };
            })(this)
        });
    };

    Term.prototype.addInputMeta = function() {
        this.inputMeta = this.editor.meta.add({
            line: 0,
            clss: 'input',
            number: {
                text: '▶',
                clss: 'input'
            },
            click: (function(_this) {
                return function(meta, event) {
                    var pos;
                    pos = kpos(event);
                    if (pos.x < 40) {
                        return klog('input number');
                    } else {
                        return klog('input text?');
                    }
                };
            })(this)
        });
        if (this.shell.child) {
            return this.busyInput();
        }
    };

    Term.prototype.busyInput = function() {
        var ref1, ref2;
        if ((ref1 = this.inputMeta[2]) != null) {
            ref1.number.text = '\uf013';
        }
        if ((ref2 = this.inputMeta[2]) != null) {
            ref2.number.clss = 'input busy';
        }
        return this.editor.meta.update(this.inputMeta);
    };

    Term.prototype.resetInput = function() {
        var ref1, ref2;
        if ((ref1 = this.inputMeta[2]) != null) {
            ref1.number.text = '▶';
        }
        if ((ref2 = this.inputMeta[2]) != null) {
            ref2.number.clss = 'input';
        }
        return this.editor.meta.update(this.inputMeta);
    };

    Term.prototype.failMeta = function(meta) {
        this.resetInput();
        meta[2].number = {
            text: '✖',
            clss: 'fail'
        };
        meta[2].clss = 'fail';
        this.editor.minimap.drawLines(meta[0], meta[0]);
        return this.editor.meta.update(meta);
    };

    Term.prototype.succMeta = function(meta) {
        this.resetInput();
        meta[2].number = {
            text: '▶',
            clss: 'succ'
        };
        meta[2].clss = 'succ';
        this.editor.minimap.drawLines(meta[0], meta[0]);
        return this.editor.meta.update(meta);
    };

    Term.prototype.insertCmdMeta = function(li, cmd) {
        this.busyInput();
        return this.editor.meta.add({
            line: li,
            clss: 'cmd',
            number: {
                text: '\uf013',
                clss: 'cmd'
            },
            end: cmd.length + 1,
            click: (function(_this) {
                return function(meta, event) {
                    _this.editor.singleCursorAtEnd();
                    _this.editor.setInputText(_this.editor.line(meta[0]));
                    return _this.shell.execute({
                        cmd: _this.editor.line(meta[0])
                    });
                };
            })(this)
        });
    };

    Term.prototype.moveInputMeta = function() {
        var oldLine;
        if (this.editor.numLines() - 1 !== this.inputMeta[0]) {
            oldLine = this.inputMeta[0];
            this.editor.meta.moveLineMeta(this.inputMeta, this.editor.numLines() - 1 - this.inputMeta[0]);
            return this.editor.numbers.updateColor(oldLine);
        }
    };

    Term.prototype.onChanged = function(changeInfo) {
        if (changeInfo.changes.length) {
            return this.moveInputMeta();
        }
    };

    Term.prototype.clear = function() {
        var ref1;
        if ((ref1 = this.shell.last) != null) {
            delete ref1.meta;
        }
        this.editor.clear();
        this.addInputMeta();
        return true;
    };

    Term.prototype.onFontSize = function(size) {
        this.editor.setFontSize(size);
        return this.editor.singleCursorAtEnd();
    };

    Term.prototype.resized = function() {
        return this.editor.resized();
    };

    Term.prototype.scrollBy = function(delta) {
        var ref1;
        if (this.autocomplete.list) {
            this.autocomplete.close();
        }
        this.editor.scroll.by(delta);
        if (!((0 < (ref1 = this.editor.scroll.scroll) && ref1 < this.editor.scroll.scrollMax - 1))) {
            return post.emit('stopWheel');
        }
    };

    Term.prototype.pwd = function() {
        var dir;
        dir = slash.tilde(process.cwd());
        this.editor.appendOutput(dir);
        this.addDirMeta(dir);
        return true;
    };

    Term.prototype.onEnter = function() {
        if (this.editor.isInputCursor()) {
            if (this.shell.child) {
                this.shell.child.stdin.write('\n');
                if (this.shell.last.cmd === 'koffee') {
                    this.editor.setInputText('');
                    return;
                }
            }
            if (this.autocomplete.isListItemSelected()) {
                this.autocomplete.complete({});
            } else if (this.autocomplete.selectedCompletion()) {
                return this.shell.execute({
                    fallback: this.editor.lastLine() + this.autocomplete.selectedCompletion()
                });
            }
            return this.shell.execute({});
        } else {
            return this.editor.singleCursorAtEnd();
        }
    };

    Term.prototype.handleKey = function(mod, key, combo, char, event) {
        switch (combo) {
            case 'enter':
                return this.onEnter();
            case 'alt+up':
                return this.editor.moveCursorsUp();
            case 'alt+down':
                return this.editor.moveCursorsDown();
            case 'ctrl+c':
                return this.shell.handleCancel();
        }
        if (this.shell.child) {
            if (char) {
                switch (key) {
                    case 'backspace':
                        this.shell.child.stdin.write('\x08');
                        break;
                    default:
                        klog('pipe char', char);
                        this.shell.child.stdin.write(char);
                }
            } else {
                klog('pipe key', key, combo);
            }
        } else {
            if ('unhandled' !== this.autocomplete.handleModKeyComboEvent(mod, key, combo, event)) {
                return;
            }
            if (this.editor.isInputCursor()) {
                switch (combo) {
                    case 'up':
                        return this.history.prev();
                    case 'down':
                        return this.history.next();
                }
            }
        }
        return 'unhandled';
    };

    return Term;

})();

module.exports = Term;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMkZBQUE7SUFBQTs7QUFRQSxNQUF1QyxPQUFBLENBQVEsS0FBUixDQUF2QyxFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGVBQWYsRUFBcUIsZUFBckIsRUFBMkIsZUFBM0IsRUFBaUM7O0FBRWpDLFVBQUEsR0FBYSxPQUFBLENBQVEsaUJBQVI7O0FBQ2IsVUFBQSxHQUFhLE9BQUEsQ0FBUSxxQkFBUjs7QUFDYixNQUFBLEdBQWEsT0FBQSxDQUFRLGlCQUFSOztBQUNiLE9BQUEsR0FBYSxPQUFBLENBQVEsV0FBUjs7QUFDYixLQUFBLEdBQWEsT0FBQSxDQUFRLFNBQVI7O0FBRVA7SUFFQyxjQUFBOzs7OztBQUVDLFlBQUE7UUFBQSxJQUFBLEdBQU0sQ0FBQSxDQUFFLE9BQUY7UUFDTixJQUFDLENBQUEsR0FBRCxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sTUFBTjtTQUFMO1FBQ1AsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsSUFBQyxDQUFBLEdBQWxCO1FBRUEsSUFBQyxDQUFBLEdBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLElBQUQsR0FDSTtZQUFBLFNBQUEsRUFBWSxDQUFaO1lBQ0EsVUFBQSxFQUFZLENBRFo7O1FBR0osSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLFVBQUosQ0FBZSxJQUFmLEVBQWtCO1lBQUEsUUFBQSxFQUFTLENBQ2pDLFdBRGlDLEVBRWpDLFNBRmlDLEVBR2pDLE1BSGlDLEVBSWpDLFNBSmlDLEVBS2pDLGNBTGlDLEVBTWpDLFVBTmlDLEVBT2pDLFNBUGlDLEVBUWpDLFlBUmlDLENBQVQ7U0FBbEI7UUFXVixJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsRUFBaEI7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QU8sQ0FBQyxJQUFULENBQUE7QUFGOUIsaUJBREo7YUFiSjs7ZUFrQkE7SUE1Qk87Ozs7OztBQThCZixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIFxuICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgcG9zdCwgc2xhc2gsIGVsZW0sIGtwb3MsIGtsb2csICQgfSA9IHJlcXVpcmUgJ2t4aydcblxuQmFzZUVkaXRvciA9IHJlcXVpcmUgJy4vZWRpdG9yL2VkaXRvcidcblRleHRFZGl0b3IgPSByZXF1aXJlICcuL2VkaXRvci90ZXh0ZWRpdG9yJ1xucmVuZGVyICAgICA9IHJlcXVpcmUgJy4vZWRpdG9yL3JlbmRlcidcbkhpc3RvcnkgICAgPSByZXF1aXJlICcuL2hpc3RvcnknXG5TaGVsbCAgICAgID0gcmVxdWlyZSAnLi9zaGVsbCdcblxuY2xhc3MgVGVybVxuXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgICAgIG1haW4gPSQgJyNtYWluJ1xuICAgICAgICBAZGl2ID0gZWxlbSBjbGFzczondGVybScgXG4gICAgICAgIG1haW4uYXBwZW5kQ2hpbGQgQGRpdlxuXG4gICAgICAgIEBudW0gID0gMCAgIFxuICAgICAgICBAcm93cyA9IDBcbiAgICAgICAgQGNvbHMgPSAwXG4gICAgICAgIEBzaXplID1cbiAgICAgICAgICAgIGNoYXJXaWR0aDogIDBcbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGVkaXRvciA9IG5ldyBUZXh0RWRpdG9yIEAsIGZlYXR1cmVzOltcbiAgICAgICAgICAgICdTY3JvbGxiYXInXG4gICAgICAgICAgICAnTWluaW1hcCdcbiAgICAgICAgICAgICdNZXRhJ1xuICAgICAgICAgICAgJ051bWJlcnMnXG4gICAgICAgICAgICAnQXV0b2NvbXBsZXRlJ1xuICAgICAgICAgICAgJ0JyYWNrZXRzJ1xuICAgICAgICAgICAgJ1N0cmluZ3MnXG4gICAgICAgICAgICAnQ3Vyc29yTGluZSdcbiAgICAgICAgXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAZWRpdG9yLnNldFRleHQgJydcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnIEBvbkNoYW5nZWRcbiAgICAgICAgXG4gICAgICAgIEBzaGVsbCAgID0gbmV3IFNoZWxsIEBcbiAgICAgICAgQGhpc3RvcnkgPSBuZXcgSGlzdG9yeSBAXG4gICAgICAgIEBhdXRvY29tcGxldGUgPSBAZWRpdG9yLmF1dG9jb21wbGV0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHBvc3Qub24gJ2ZvbnRTaXplJyBAb25Gb250U2l6ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcblxuICAgIGFkZERpck1ldGE6IChkaXIpIC0+XG4gICAgICAgIEBlZGl0b3IubWV0YS5hZGRcbiAgICAgICAgICAgIGxpbmU6IE1hdGgubWF4IDAsIEBlZGl0b3IubnVtTGluZXMoKS0yXG4gICAgICAgICAgICBjbHNzOiAncHdkJ1xuICAgICAgICAgICAgbnVtYmVyOiBcbiAgICAgICAgICAgICAgICB0ZXh0OiAnICdcbiAgICAgICAgICAgICAgICBjbHNzOiAncHdkJ1xuICAgICAgICAgICAgZW5kOiBkaXIubGVuZ3RoKzFcbiAgICAgICAgICAgIGNsaWNrOiAobWV0YSwgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgcG9zID0ga3BvcyBldmVudFxuICAgICAgICAgICAgICAgIGlmIHBvcy54IDwgNDBcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBAZWRpdG9yLm1ldGEubWV0YXMuaW5kZXhPZiBtZXRhXG4gICAgICAgICAgICAgICAgICAgIGlmIGluZGV4IDwgQGVkaXRvci5tZXRhLm1ldGFzLmxlbmd0aC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFswLG1ldGFbMF1dXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBuZXh0ID0gQGVkaXRvci5tZXRhLm5leHRNZXRhT2ZTYW1lQ2xhc3MgbWV0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBpIGluIFttZXRhWzBdLi4ubmV4dFswXV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5kZWxldGVTZWxlY3Rpb25PckN1cnNvckxpbmVzKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBlZGl0b3IubW92ZUN1cnNvcnNEb3duKClcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICAgICAgICAgICAgICBAc2hlbGwuY2QgQGVkaXRvci5saW5lIG1ldGFbMF1cblxuICAgIGFkZElucHV0TWV0YTogLT5cbiAgICAgICAgXG4gICAgICAgIEBpbnB1dE1ldGEgPSBAZWRpdG9yLm1ldGEuYWRkXG4gICAgICAgICAgICBsaW5lOiAwXG4gICAgICAgICAgICBjbHNzOiAnaW5wdXQnXG4gICAgICAgICAgICBudW1iZXI6IFxuICAgICAgICAgICAgICAgIHRleHQ6ICfilrYnXG4gICAgICAgICAgICAgICAgY2xzczogJ2lucHV0J1xuICAgICAgICAgICAgY2xpY2s6IChtZXRhLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBwb3MgPSBrcG9zIGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgcG9zLnggPCA0MFxuICAgICAgICAgICAgICAgICAgICBrbG9nICdpbnB1dCBudW1iZXInXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBrbG9nICdpbnB1dCB0ZXh0PydcbiAgXG4gICAgICAgIGlmIEBzaGVsbC5jaGlsZFxuICAgICAgICAgICAgQGJ1c3lJbnB1dCgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIGJ1c3lJbnB1dDogLT5cblxuICAgICAgICBAaW5wdXRNZXRhWzJdPy5udW1iZXIudGV4dCA9ICdcXHVmMDEzJ1xuICAgICAgICBAaW5wdXRNZXRhWzJdPy5udW1iZXIuY2xzcyA9ICdpbnB1dCBidXN5J1xuICAgICAgICBAZWRpdG9yLm1ldGEudXBkYXRlIEBpbnB1dE1ldGFcbiAgICAgICAgXG4gICAgcmVzZXRJbnB1dDogLT5cbiAgICAgICAgXG4gICAgICAgIEBpbnB1dE1ldGFbMl0/Lm51bWJlci50ZXh0ID0gJ+KWtidcbiAgICAgICAgQGlucHV0TWV0YVsyXT8ubnVtYmVyLmNsc3MgPSAnaW5wdXQnXG4gICAgICAgIEBlZGl0b3IubWV0YS51cGRhdGUgQGlucHV0TWV0YVxuICAgIFxuICAgIGZhaWxNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBAcmVzZXRJbnB1dCgpXG4gICAgICAgIFxuICAgICAgICBtZXRhWzJdLm51bWJlciA9IHRleHQ6J+KclicgY2xzczonZmFpbCdcbiAgICAgICAgbWV0YVsyXS5jbHNzID0gJ2ZhaWwnXG4gICAgICAgIEBlZGl0b3IubWluaW1hcC5kcmF3TGluZXMgbWV0YVswXSwgbWV0YVswXVxuICAgICAgICBAZWRpdG9yLm1ldGEudXBkYXRlIG1ldGFcbiAgICAgICAgXG4gICAgc3VjY01ldGE6IChtZXRhKSAtPlxuXG4gICAgICAgIEByZXNldElucHV0KClcbiAgICAgICAgXG4gICAgICAgIG1ldGFbMl0ubnVtYmVyID0gdGV4dDon4pa2JyBjbHNzOidzdWNjJ1xuICAgICAgICBtZXRhWzJdLmNsc3MgPSAnc3VjYydcbiAgICAgICAgQGVkaXRvci5taW5pbWFwLmRyYXdMaW5lcyBtZXRhWzBdLCBtZXRhWzBdXG4gICAgICAgIEBlZGl0b3IubWV0YS51cGRhdGUgbWV0YVxuICAgICAgICBcbiAgICBpbnNlcnRDbWRNZXRhOiAobGksIGNtZCkgLT5cblxuICAgICAgICBAYnVzeUlucHV0KClcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IubWV0YS5hZGQgXG4gICAgICAgICAgICBsaW5lOiBsaVxuICAgICAgICAgICAgY2xzczogJ2NtZCdcbiAgICAgICAgICAgIG51bWJlcjogXG4gICAgICAgICAgICAgICAgdGV4dDogJ1xcdWYwMTMnXG4gICAgICAgICAgICAgICAgY2xzczogJ2NtZCdcbiAgICAgICAgICAgIGVuZDogY21kLmxlbmd0aCsxXG4gICAgICAgICAgICBjbGljazogKG1ldGEsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2V0SW5wdXRUZXh0IEBlZGl0b3IubGluZSBtZXRhWzBdXG4gICAgICAgICAgICAgICAgQHNoZWxsLmV4ZWN1dGUgY21kOkBlZGl0b3IubGluZSBtZXRhWzBdXG4gICAgXG4gICAgbW92ZUlucHV0TWV0YTogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBlZGl0b3IubnVtTGluZXMoKS0xICE9IEBpbnB1dE1ldGFbMF1cbiAgICAgICAgICAgIG9sZExpbmUgPSBAaW5wdXRNZXRhWzBdXG4gICAgICAgICAgICBAZWRpdG9yLm1ldGEubW92ZUxpbmVNZXRhIEBpbnB1dE1ldGEsIEBlZGl0b3IubnVtTGluZXMoKS0xLUBpbnB1dE1ldGFbMF0gICAgICAgICAgICBcbiAgICAgICAgICAgIEBlZGl0b3IubnVtYmVycy51cGRhdGVDb2xvciBvbGRMaW5lXG4gICAgICAgICAgICBcbiAgICBvbkNoYW5nZWQ6IChjaGFuZ2VJbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgQG1vdmVJbnB1dE1ldGEoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2xlYXI6IC0+IFxuICAgIFxuICAgICAgICBkZWxldGUgQHNoZWxsLmxhc3Q/Lm1ldGFcbiAgICAgICAgQGVkaXRvci5jbGVhcigpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBAYWRkSW5wdXRNZXRhKClcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuICAgIG9uRm9udFNpemU6IChzaXplKSA9PlxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5zZXRGb250U2l6ZSBzaXplXG4gICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICBcbiAgICByZXNpemVkOiA9PiBAZWRpdG9yLnJlc2l6ZWQoKVxuICAgIFxuICAgIHNjcm9sbEJ5OiAoZGVsdGEpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYXV0b2NvbXBsZXRlLmxpc3RcbiAgICAgICAgICAgIEBhdXRvY29tcGxldGUuY2xvc2UoKVxuICAgICAgICBAZWRpdG9yLnNjcm9sbC5ieSBkZWx0YVxuICAgICAgICBpZiBub3QgKDAgPCBAZWRpdG9yLnNjcm9sbC5zY3JvbGwgPCBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXgtMSlcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnc3RvcFdoZWVsJ1xuICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwICAgICAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBwd2Q6IC0+XG4gICAgICAgIFxuICAgICAgICBkaXIgPSBzbGFzaC50aWxkZSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBlZGl0b3IuYXBwZW5kT3V0cHV0IGRpclxuICAgICAgICBAYWRkRGlyTWV0YSBkaXJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHRydWVcbiAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgb25FbnRlcjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBlZGl0b3IuaXNJbnB1dEN1cnNvcigpXG4gICAgICAgICAgICBpZiBAc2hlbGwuY2hpbGQgI2FuZCBAc2hlbGwubGFzdC5jbWQgPT0gJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICBAc2hlbGwuY2hpbGQuc3RkaW4ud3JpdGUgJ1xcbidcbiAgICAgICAgICAgICAgICBpZiBAc2hlbGwubGFzdC5jbWQgPT0gJ2tvZmZlZSdcbiAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgJydcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBpZiBAYXV0b2NvbXBsZXRlLmlzTGlzdEl0ZW1TZWxlY3RlZCgpXG4gICAgICAgICAgICAgICAgQGF1dG9jb21wbGV0ZS5jb21wbGV0ZSB7fVxuICAgICAgICAgICAgZWxzZSBpZiBAYXV0b2NvbXBsZXRlLnNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBzaGVsbC5leGVjdXRlIGZhbGxiYWNrOkBlZGl0b3IubGFzdExpbmUoKSArIEBhdXRvY29tcGxldGUuc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgICAgIEBzaGVsbC5leGVjdXRlIHt9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGhhbmRsZUtleTogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+ICAgICAgICBcbiAgICAgICAgXG4gICAgICAgICMga2xvZyAndGVybS5oYW5kbGVLZXknIG1vZCwga2V5LCBjb21ib1xuICAgICAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VudGVyJyAgICB0aGVuIHJldHVybiBAb25FbnRlcigpXG4gICAgICAgICAgICB3aGVuICdhbHQrdXAnICAgdGhlbiByZXR1cm4gQGVkaXRvci5tb3ZlQ3Vyc29yc1VwKClcbiAgICAgICAgICAgIHdoZW4gJ2FsdCtkb3duJyB0aGVuIHJldHVybiBAZWRpdG9yLm1vdmVDdXJzb3JzRG93bigpXG4gICAgICAgICAgICB3aGVuICdjdHJsK2MnICAgdGhlbiByZXR1cm4gQHNoZWxsLmhhbmRsZUNhbmNlbCgpXG4gICAgICAgIFxuICAgICAgICBpZiBAc2hlbGwuY2hpbGQgIyBhbmQgQHNoZWxsLmxhc3QuY21kID09ICdrb2ZmZWUnXG4gICAgICAgICAgICBpZiBjaGFyXG4gICAgICAgICAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgICAgICAgICB3aGVuICdiYWNrc3BhY2UnXG4gICAgICAgICAgICAgICAgICAgICAgICBAc2hlbGwuY2hpbGQuc3RkaW4ud3JpdGUgJ1xceDA4J1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBrbG9nICdwaXBlIGNoYXInIGNoYXJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzaGVsbC5jaGlsZC5zdGRpbi53cml0ZSBjaGFyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAga2xvZyAncGlwZSBrZXknIGtleSwgY29tYm9cbiAgICAgICAgZWxzZSAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IEBhdXRvY29tcGxldGUuaGFuZGxlTW9kS2V5Q29tYm9FdmVudCBtb2QsIGtleSwgY29tYm8sIGV2ZW50XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBlZGl0b3IuaXNJbnB1dEN1cnNvcigpXG4gICAgICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgdGhlbiByZXR1cm4gQGhpc3RvcnkucHJldigpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgdGhlbiByZXR1cm4gQGhpc3RvcnkubmV4dCgpXG4gICAgICAgIFxuICAgICAgICAndW5oYW5kbGVkJ1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gVGVybVxuIl19
//# sourceURL=../coffee/term.coffee