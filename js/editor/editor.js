// koffee 1.12.0

/*
00000000  0000000    000  000000000   0000000   00000000
000       000   000  000     000     000   000  000   000
0000000   000   000  000     000     000   000  0000000
000       000   000  000     000     000   000  000   000
00000000  0000000    000     000      0000000   000   000
 */
var Buffer, Do, Editor, Syntax, _, clamp, empty, filelist, kerror, klog, ref, slash,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), clamp = ref.clamp, empty = ref.empty, slash = ref.slash, kerror = ref.kerror, filelist = ref.filelist, klog = ref.klog, _ = ref._;

Buffer = require('./buffer');

Syntax = require('./syntax');

Do = require('./do');

Editor = (function(superClass) {
    extend(Editor, superClass);

    Editor.actions = null;

    function Editor(name, config) {
        var base;
        Editor.__super__.constructor.call(this);
        this.name = name;
        this.config = config != null ? config : {};
        if ((base = this.config).syntaxName != null) {
            base.syntaxName;
        } else {
            base.syntaxName = 'sh';
        }
        if (Editor.actions == null) {
            Editor.initActions();
        }
        this.indentString = _.padStart('', 4);
        this.stickySelection = false;
        this.syntax = new Syntax(this.config.syntaxName, this.line, this.ansiLine);
        this["do"] = new Do(this);
        this.setupFileType();
    }

    Editor.prototype.del = function() {
        return this["do"].del();
    };

    Editor.initActions = function() {
        var actionFile, actions, i, k, key, len, ref1, ref2, results, v, value;
        this.actions = [];
        ref1 = filelist(slash.join(__dirname, 'actions'));
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            actionFile = ref1[i];
            if ((ref2 = slash.ext(actionFile)) !== 'js' && ref2 !== 'coffee') {
                continue;
            }
            actions = require(actionFile);
            results.push((function() {
                var results1;
                results1 = [];
                for (key in actions) {
                    value = actions[key];
                    if (_.isFunction(value)) {
                        results1.push(this.prototype[key] = value);
                    } else if (key === 'actions') {
                        results1.push((function() {
                            var results2;
                            results2 = [];
                            for (k in value) {
                                v = value[k];
                                if (!_.isString(v)) {
                                    if (v.key == null) {
                                        v.key = k;
                                    }
                                    results2.push(this.actions.push(v));
                                } else {
                                    results2.push(void 0);
                                }
                            }
                            return results2;
                        }).call(this));
                    } else {
                        results1.push(void 0);
                    }
                }
                return results1;
            }).call(this));
        }
        return results;
    };

    Editor.actionWithName = function(name) {
        var action, i, len, ref1;
        ref1 = Editor.actions;
        for (i = 0, len = ref1.length; i < len; i++) {
            action = ref1[i];
            if (action.name === name) {
                return action;
            }
        }
        return null;
    };

    Editor.prototype.setupFileType = function() {
        var newType, oldType, ref1, ref2, ref3;
        oldType = this.fileType;
        newType = (ref1 = (ref2 = this.config) != null ? ref2.syntaxName : void 0) != null ? ref1 : 'sh';
        if ((ref3 = this.syntax) != null) {
            ref3.setFileType(newType);
        }
        this.setFileType(newType);
        if (oldType !== this.fileType) {
            return this.emit('fileTypeChanged', this.fileType);
        }
    };

    Editor.prototype.setFileType = function(fileType) {
        var cstr, i, k, key, len, ref1, ref2, reg, v;
        this.fileType = fileType;
        this.stringCharacters = {
            "'": 'single',
            '"': 'double'
        };
        switch (this.fileType) {
            case 'md':
                this.stringCharacters['*'] = 'bold';
                break;
            case 'noon':
                this.stringCharacters['|'] = 'pipe';
        }
        this.bracketCharacters = {
            open: {
                '[': ']',
                '{': '}',
                '(': ')'
            },
            close: {},
            regexps: []
        };
        switch (this.fileType) {
            case 'html':
                this.bracketCharacters.open['<'] = '>';
        }
        ref1 = this.bracketCharacters.open;
        for (k in ref1) {
            v = ref1[k];
            this.bracketCharacters.close[v] = k;
        }
        this.bracketCharacters.regexp = [];
        ref2 = ['open', 'close'];
        for (i = 0, len = ref2.length; i < len; i++) {
            key = ref2[i];
            cstr = _.keys(this.bracketCharacters[key]).join('');
            reg = new RegExp("[" + (_.escapeRegExp(cstr)) + "]");
            this.bracketCharacters.regexps.push([reg, key]);
        }
        this.initSurround();
        this.indentNewLineMore = null;
        this.indentNewLineLess = null;
        this.insertIndentedEmptyLineBetween = '{}';
        this.lineComment = '#';
        return this.multiComment = '###';
    };

    Editor.prototype.setText = function(text) {
        var lines;
        if (text == null) {
            text = "";
        }
        lines = text.split(/\n/);
        this.newlineCharacters = '\n';
        if (!empty(lines)) {
            if (lines[0].endsWith('\r')) {
                lines = text.split(/\r?\n/);
                this.newlineCharacters = '\r\n';
            }
        }
        return this.setLines(lines);
    };

    Editor.prototype.setLines = function(lines) {
        this.syntax.clear();
        this.syntax.setLines(lines);
        Editor.__super__.setLines.call(this, lines);
        return this.emit('linesSet', lines);
    };

    Editor.prototype.textOfSelectionForClipboard = function() {
        if (this.numSelections()) {
            return this.textOfSelection();
        } else {
            return this.textInRanges(this.rangesForCursorLines());
        }
    };

    Editor.prototype.splitStateLineAtPos = function(state, pos) {
        var l;
        l = state.line(pos[1]);
        if (l == null) {
            kerror("no line at pos " + pos + "?");
        }
        if (l == null) {
            return ['', ''];
        }
        return [l.slice(0, pos[0]), l.slice(pos[0])];
    };

    Editor.prototype.emitInsert = function() {
        var line, mc;
        mc = this.mainCursor();
        line = this.line(mc[1]);
        return this.emit('insert', {
            line: line,
            before: line.slice(0, mc[0]),
            after: line.slice(mc[0]),
            cursor: mc
        });
    };

    Editor.prototype.indentStringForLineAtIndex = function(li) {
        var e, i, il, indentLength, len, line, ref1, ref2, thisIndent;
        while (empty(this.line(li).trim()) && li > 0) {
            li--;
        }
        if ((0 <= li && li < this.numLines())) {
            il = 0;
            line = this.line(li);
            thisIndent = this.indentationAtLineIndex(li);
            indentLength = this.indentString.length;
            if (this.indentNewLineMore != null) {
                if ((ref1 = this.indentNewLineMore.lineEndsWith) != null ? ref1.length : void 0) {
                    ref2 = this.indentNewLineMore.lineEndsWith;
                    for (i = 0, len = ref2.length; i < len; i++) {
                        e = ref2[i];
                        if (line.trim().endsWith(e)) {
                            il = thisIndent + indentLength;
                            break;
                        }
                    }
                }
                if (il === 0) {
                    if ((this.indentNewLineMore.lineRegExp != null) && this.indentNewLineMore.lineRegExp.test(line)) {
                        il = thisIndent + indentLength;
                    }
                }
            }
            if (il === 0) {
                il = thisIndent;
            }
            il = Math.max(il, this.indentationAtLineIndex(li + 1));
            return _.padStart('', il);
        } else {
            return '';
        }
    };

    return Editor;

})(Buffer);

module.exports = Editor;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImVkaXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK0VBQUE7SUFBQTs7O0FBUUEsTUFBcUQsT0FBQSxDQUFRLEtBQVIsQ0FBckQsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGlCQUFoQixFQUF1QixtQkFBdkIsRUFBK0IsdUJBQS9CLEVBQXlDLGVBQXpDLEVBQStDOztBQUUvQyxNQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0FBQ1YsTUFBQSxHQUFVLE9BQUEsQ0FBUSxVQUFSOztBQUNWLEVBQUEsR0FBVSxPQUFBLENBQVEsTUFBUjs7QUFFSjs7O0lBRUYsTUFBQyxDQUFBLE9BQUQsR0FBVzs7SUFFUixnQkFBQyxJQUFELEVBQU8sTUFBUDtBQUVDLFlBQUE7UUFBQSxzQ0FBQTtRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVU7UUFDVixJQUFDLENBQUEsTUFBRCxvQkFBVSxTQUFTOztnQkFDWixDQUFDOztnQkFBRCxDQUFDLGFBQWM7O1FBRXRCLElBQTRCLHNCQUE1QjtZQUFBLE1BQU0sQ0FBQyxXQUFQLENBQUEsRUFBQTs7UUFFQSxJQUFDLENBQUEsWUFBRCxHQUFtQixDQUFDLENBQUMsUUFBRixDQUFXLEVBQVgsRUFBYyxDQUFkO1FBQ25CLElBQUMsQ0FBQSxlQUFELEdBQW1CO1FBQ25CLElBQUMsQ0FBQSxNQUFELEdBQW1CLElBQUksTUFBSixDQUFXLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBbkIsRUFBK0IsSUFBQyxDQUFBLElBQWhDLEVBQXNDLElBQUMsQ0FBQSxRQUF2QztRQUNuQixJQUFDLEVBQUEsRUFBQSxFQUFELEdBQW1CLElBQUksRUFBSixDQUFPLElBQVA7UUFFbkIsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQWZEOztxQkFpQkgsR0FBQSxHQUFLLFNBQUE7ZUFFRCxJQUFDLEVBQUEsRUFB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RyxDQUFBLENBQUEsSUFBSyxFQUFMLElBQUssRUFBTCxHQUFVLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBVixDQUFIO1lBRUksRUFBQSxHQUFLO1lBQ0wsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFELENBQU0sRUFBTjtZQUNQLFVBQUEsR0FBZSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsRUFBeEI7WUFDZixZQUFBLEdBQWUsSUFBQyxDQUFBLFlBQVksQ0FBQztZQUU3QixJQUFHLDhCQUFIO2dCQUNJLCtEQUFrQyxDQUFFLGVBQXBDO0FBQ0k7QUFBQSx5QkFBQSxzQ0FBQTs7d0JBQ0ksSUFBRyxJQUFJLENBQUMsSUFBTCxDQUFBLENBQVcsQ0FBQyxRQUFaLENBQXFCLENBQXJCLENBQUg7NEJBQ0ksRUFBQSxHQUFLLFVBQUEsR0FBYTtBQUNsQixrQ0FGSjs7QUFESixxQkFESjs7Z0JBS0EsSUFBRyxFQUFBLEtBQU0sQ0FBVDtvQkFDSSxJQUFHLDJDQUFBLElBQW1DLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsSUFBOUIsQ0FBbUMsSUFBbkMsQ0FBdEM7d0JBQ0ksRUFBQSxHQUFLLFVBQUEsR0FBYSxhQUR0QjtxQkFESjtpQkFOSjs7WUFVQSxJQUFtQixFQUFBLEtBQU0sQ0FBekI7Z0JBQUEsRUFBQSxHQUFLLFdBQUw7O1lBQ0EsRUFBQSxHQUFLLElBQUksQ0FBQyxHQUFMLENBQVMsRUFBVCxFQUFhLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixFQUFBLEdBQUcsQ0FBM0IsQ0FBYjttQkFFTCxDQUFDLENBQUMsUUFBRixDQUFXLEVBQVgsRUFBYyxFQUFkLEVBcEJKO1NBQUEsTUFBQTttQkFzQkksR0F0Qko7O0lBTHdCOzs7O0dBeExYOztBQXFOckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBjbGFtcCwgZW1wdHksIHNsYXNoLCBrZXJyb3IsIGZpbGVsaXN0LCBrbG9nLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkJ1ZmZlciAgPSByZXF1aXJlICcuL2J1ZmZlcidcblN5bnRheCAgPSByZXF1aXJlICcuL3N5bnRheCdcbkRvICAgICAgPSByZXF1aXJlICcuL2RvJ1xuXG5jbGFzcyBFZGl0b3IgZXh0ZW5kcyBCdWZmZXJcblxuICAgIEBhY3Rpb25zID0gbnVsbFxuXG4gICAgQDogKG5hbWUsIGNvbmZpZykgLT5cblxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgQG5hbWUgICA9IG5hbWVcbiAgICAgICAgQGNvbmZpZyA9IGNvbmZpZyA/IHt9XG4gICAgICAgIEBjb25maWcuc3ludGF4TmFtZSA/PSAnc2gnXG5cbiAgICAgICAgRWRpdG9yLmluaXRBY3Rpb25zKCkgaWYgbm90IEVkaXRvci5hY3Rpb25zP1xuXG4gICAgICAgIEBpbmRlbnRTdHJpbmcgICAgPSBfLnBhZFN0YXJ0ICcnIDRcbiAgICAgICAgQHN0aWNreVNlbGVjdGlvbiA9IGZhbHNlXG4gICAgICAgIEBzeW50YXggICAgICAgICAgPSBuZXcgU3ludGF4IEBjb25maWcuc3ludGF4TmFtZSwgQGxpbmUsIEBhbnNpTGluZVxuICAgICAgICBAZG8gICAgICAgICAgICAgID0gbmV3IERvIEBcbiAgICAgICAgXG4gICAgICAgIEBzZXR1cEZpbGVUeXBlKClcblxuICAgIGRlbDogLT5cblxuICAgICAgICBAZG8uZGVsKClcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBAaW5pdEFjdGlvbnM6IC0+XG5cbiAgICAgICAgQGFjdGlvbnMgPSBbXVxuICAgICAgICBmb3IgYWN0aW9uRmlsZSBpbiBmaWxlbGlzdChzbGFzaC5qb2luIF9fZGlybmFtZSwgJ2FjdGlvbnMnKVxuICAgICAgICAgICAgY29udGludWUgaWYgc2xhc2guZXh0KGFjdGlvbkZpbGUpIG5vdCBpbiBbJ2pzJyAnY29mZmVlJ11cbiAgICAgICAgICAgIGFjdGlvbnMgPSByZXF1aXJlIGFjdGlvbkZpbGVcbiAgICAgICAgICAgIGZvciBrZXksdmFsdWUgb2YgYWN0aW9uc1xuICAgICAgICAgICAgICAgIGlmIF8uaXNGdW5jdGlvbiB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgXCJFZGl0b3IgYWN0aW9uICN7a2V5fVwiXG4gICAgICAgICAgICAgICAgICAgIEBwcm90b3R5cGVba2V5XSA9IHZhbHVlXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBrZXkgPT0gJ2FjdGlvbnMnXG4gICAgICAgICAgICAgICAgICAgIGZvciBrLHYgb2YgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBfLmlzU3RyaW5nIHZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2LmtleSA9IGsgaWYgbm90IHYua2V5P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhY3Rpb25zLnB1c2ggdlxuXG4gICAgQGFjdGlvbldpdGhOYW1lOiAobmFtZSkgLT5cblxuICAgICAgICBmb3IgYWN0aW9uIGluIEVkaXRvci5hY3Rpb25zXG4gICAgICAgICAgICBpZiBhY3Rpb24ubmFtZSA9PSBuYW1lXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdGlvblxuICAgICAgICBudWxsXG5cbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDBcbiAgICAjICAgIDAwMCAgICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMDBcblxuICAgIHNldHVwRmlsZVR5cGU6IC0+XG5cbiAgICAgICAgb2xkVHlwZSA9IEBmaWxlVHlwZVxuICAgICAgICBuZXdUeXBlID0gQGNvbmZpZz8uc3ludGF4TmFtZSA/ICdzaCdcblxuICAgICAgICBAc3ludGF4Py5zZXRGaWxlVHlwZSBuZXdUeXBlXG4gICAgICAgIEBzZXRGaWxlVHlwZSBuZXdUeXBlXG5cbiAgICAgICAgaWYgb2xkVHlwZSAhPSBAZmlsZVR5cGVcbiAgICAgICAgICAgIEBlbWl0ICdmaWxlVHlwZUNoYW5nZWQnIEBmaWxlVHlwZVxuXG4gICAgc2V0RmlsZVR5cGU6IChAZmlsZVR5cGUpIC0+XG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gc3RyaW5nc1xuXG4gICAgICAgIEBzdHJpbmdDaGFyYWN0ZXJzID1cbiAgICAgICAgICAgIFwiJ1wiOiAgJ3NpbmdsZSdcbiAgICAgICAgICAgICdcIic6ICAnZG91YmxlJ1xuXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ21kJyAgIHRoZW4gQHN0cmluZ0NoYXJhY3RlcnNbJyonXSA9ICdib2xkJ1xuICAgICAgICAgICAgd2hlbiAnbm9vbicgdGhlbiBAc3RyaW5nQ2hhcmFjdGVyc1snfCddID0gJ3BpcGUnXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gYnJhY2tldHNcblxuICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMgPVxuICAgICAgICAgICAgb3BlbjpcbiAgICAgICAgICAgICAgICAnWyc6ICddJ1xuICAgICAgICAgICAgICAgICd7JzogJ30nXG4gICAgICAgICAgICAgICAgJygnOiAnKSdcbiAgICAgICAgICAgIGNsb3NlOiAgIHt9XG4gICAgICAgICAgICByZWdleHBzOiBbXVxuXG4gICAgICAgIHN3aXRjaCBAZmlsZVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2h0bWwnIHRoZW4gQGJyYWNrZXRDaGFyYWN0ZXJzLm9wZW5bJzwnXSA9ICc+J1xuXG4gICAgICAgIGZvciBrLHYgb2YgQGJyYWNrZXRDaGFyYWN0ZXJzLm9wZW5cbiAgICAgICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5jbG9zZVt2XSA9IGtcblxuICAgICAgICBAYnJhY2tldENoYXJhY3RlcnMucmVnZXhwID0gW11cbiAgICAgICAgZm9yIGtleSBpbiBbJ29wZW4nICdjbG9zZSddXG4gICAgICAgICAgICBjc3RyID0gXy5rZXlzKEBicmFja2V0Q2hhcmFjdGVyc1trZXldKS5qb2luICcnXG4gICAgICAgICAgICByZWcgPSBuZXcgUmVnRXhwIFwiWyN7Xy5lc2NhcGVSZWdFeHAgY3N0cn1dXCJcbiAgICAgICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5yZWdleHBzLnB1c2ggW3JlZywga2V5XVxuXG4gICAgICAgICMgX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fIHN1cnJvdW5kXG5cbiAgICAgICAgQGluaXRTdXJyb3VuZCgpXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gaW5kZW50XG5cbiAgICAgICAgQGluZGVudE5ld0xpbmVNb3JlID0gbnVsbFxuICAgICAgICBAaW5kZW50TmV3TGluZUxlc3MgPSBudWxsXG4gICAgICAgIEBpbnNlcnRJbmRlbnRlZEVtcHR5TGluZUJldHdlZW4gPSAne30nXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gY29tbWVudFxuXG4gICAgICAgIEBsaW5lQ29tbWVudCAgPSAnIydcbiAgICAgICAgQG11bHRpQ29tbWVudCA9ICcjIyMnXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNldFRleHQ6ICh0ZXh0PVwiXCIpIC0+XG5cbiAgICAgICAgbGluZXMgPSB0ZXh0LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgQG5ld2xpbmVDaGFyYWN0ZXJzID0gJ1xcbidcbiAgICAgICAgaWYgbm90IGVtcHR5IGxpbmVzXG4gICAgICAgICAgICBpZiBsaW5lc1swXS5lbmRzV2l0aCAnXFxyJ1xuICAgICAgICAgICAgICAgIGxpbmVzID0gdGV4dC5zcGxpdCAvXFxyP1xcbi9cbiAgICAgICAgICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxyXFxuJ1xuXG4gICAgICAgICMga2xvZyAnc2V0VGV4dCcgbGluZXNcbiAgICAgICAgQHNldExpbmVzIGxpbmVzXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgICMga2xvZyAnc2V0TGluZXMnIGxpbmVzLmxlbmd0aFxuICAgICAgICBAc3ludGF4LmNsZWFyKClcbiAgICAgICAgQHN5bnRheC5zZXRMaW5lcyBsaW5lc1xuICAgICAgICBzdXBlciBsaW5lc1xuICAgICAgICBAZW1pdCAnbGluZXNTZXQnIGxpbmVzXG5cbiAgICB0ZXh0T2ZTZWxlY3Rpb25Gb3JDbGlwYm9hcmQ6IC0+XG5cbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgQHRleHRPZlNlbGVjdGlvbigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0ZXh0SW5SYW5nZXMgQHJhbmdlc0ZvckN1cnNvckxpbmVzKClcblxuICAgIHNwbGl0U3RhdGVMaW5lQXRQb3M6IChzdGF0ZSwgcG9zKSAtPlxuXG4gICAgICAgIGwgPSBzdGF0ZS5saW5lIHBvc1sxXVxuICAgICAgICBrZXJyb3IgXCJubyBsaW5lIGF0IHBvcyAje3Bvc30/XCIgaWYgbm90IGw/XG4gICAgICAgIHJldHVybiBbJycgJyddIGlmIG5vdCBsP1xuICAgICAgICBbbC5zbGljZSgwLCBwb3NbMF0pLCBsLnNsaWNlKHBvc1swXSldXG5cbiAgICAjIDAwMDAwMDAwICAwMCAgICAgMDAgIDAwMCAgMDAwMDAwMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuXG4gICAgZW1pdEluc2VydDogLT5cblxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBsaW5lIG1jWzFdXG5cbiAgICAgICAgQGVtaXQgJ2luc2VydCcsXG4gICAgICAgICAgICBsaW5lOiAgIGxpbmVcbiAgICAgICAgICAgIGJlZm9yZTogbGluZS5zbGljZSAwLCBtY1swXVxuICAgICAgICAgICAgYWZ0ZXI6ICBsaW5lLnNsaWNlIG1jWzBdXG4gICAgICAgICAgICBjdXJzb3I6IG1jXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuXG4gICAgaW5kZW50U3RyaW5nRm9yTGluZUF0SW5kZXg6IChsaSkgLT5cblxuICAgICAgICB3aGlsZSBlbXB0eShAbGluZShsaSkudHJpbSgpKSBhbmQgbGkgPiAwXG4gICAgICAgICAgICBsaS0tXG5cbiAgICAgICAgaWYgMCA8PSBsaSA8IEBudW1MaW5lcygpXG5cbiAgICAgICAgICAgIGlsID0gMFxuICAgICAgICAgICAgbGluZSA9IEBsaW5lIGxpXG4gICAgICAgICAgICB0aGlzSW5kZW50ICAgPSBAaW5kZW50YXRpb25BdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgaW5kZW50TGVuZ3RoID0gQGluZGVudFN0cmluZy5sZW5ndGhcblxuICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlP1xuICAgICAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lRW5kc1dpdGg/Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBmb3IgZSBpbiBAaW5kZW50TmV3TGluZU1vcmUubGluZUVuZHNXaXRoXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBsaW5lLnRyaW0oKS5lbmRzV2l0aCBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50ICsgaW5kZW50TGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBpZiBpbCA9PSAwXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lUmVnRXhwPyBhbmQgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVSZWdFeHAudGVzdCBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgKyBpbmRlbnRMZW5ndGhcblxuICAgICAgICAgICAgaWwgPSB0aGlzSW5kZW50IGlmIGlsID09IDBcbiAgICAgICAgICAgIGlsID0gTWF0aC5tYXggaWwsIEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGxpKzFcblxuICAgICAgICAgICAgXy5wYWRTdGFydCAnJyBpbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAnJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvclxuIl19
//# sourceURL=../../coffee/editor/editor.coffee