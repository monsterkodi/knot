// koffee 1.4.0

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
        this.syntax = new Syntax(this.config.syntaxName, this.line, this.lines);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwrRUFBQTtJQUFBOzs7QUFRQSxNQUFxRCxPQUFBLENBQVEsS0FBUixDQUFyRCxFQUFFLGlCQUFGLEVBQVMsaUJBQVQsRUFBZ0IsaUJBQWhCLEVBQXVCLG1CQUF2QixFQUErQix1QkFBL0IsRUFBeUMsZUFBekMsRUFBK0M7O0FBRS9DLE1BQUEsR0FBVSxPQUFBLENBQVEsVUFBUjs7QUFDVixNQUFBLEdBQVUsT0FBQSxDQUFRLFVBQVI7O0FBQ1YsRUFBQSxHQUFVLE9BQUEsQ0FBUSxNQUFSOztBQUVKOzs7SUFFRixNQUFDLENBQUEsT0FBRCxHQUFXOztJQUVSLGdCQUFDLElBQUQsRUFBTyxNQUFQO0FBRUMsWUFBQTtRQUFBLHNDQUFBO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxNQUFELG9CQUFVLFNBQVM7O2dCQUNaLENBQUM7O2dCQUFELENBQUMsYUFBYzs7UUFFdEIsSUFBNEIsc0JBQTVCO1lBQUEsTUFBTSxDQUFDLFdBQVAsQ0FBQSxFQUFBOztRQUVBLElBQUMsQ0FBQSxZQUFELEdBQW1CLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFjLENBQWQ7UUFDbkIsSUFBQyxDQUFBLGVBQUQsR0FBbUI7UUFDbkIsSUFBQyxDQUFBLE1BQUQsR0FBbUIsSUFBSSxNQUFKLENBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFuQixFQUErQixJQUFDLENBQUEsSUFBaEMsRUFBc0MsSUFBQyxDQUFBLEtBQXZDO1FBQ25CLElBQUMsRUFBQSxFQUFBLEVBQUQsR0FBbUIsSUFBSSxFQUFKLENBQU8sSUFBUDtRQUVuQixJQUFDLENBQUEsYUFBRCxDQUFBO0lBZkQ7O3FCQWlCSCxHQUFBLEdBQUssU0FBQTtlQUVELElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFGQzs7SUFV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LEdBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFWLENBQUg7WUFFSSxFQUFBLEdBQUs7WUFDTCxJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUQsQ0FBTSxFQUFOO1lBQ1AsVUFBQSxHQUFlLElBQUMsQ0FBQSxzQkFBRCxDQUF3QixFQUF4QjtZQUNmLFlBQUEsR0FBZSxJQUFDLENBQUEsWUFBWSxDQUFDO1lBRTdCLElBQUcsOEJBQUg7Z0JBQ0ksK0RBQWtDLENBQUUsZUFBcEM7QUFDSTtBQUFBLHlCQUFBLHNDQUFBOzt3QkFDSSxJQUFHLElBQUksQ0FBQyxJQUFMLENBQUEsQ0FBVyxDQUFDLFFBQVosQ0FBcUIsQ0FBckIsQ0FBSDs0QkFDSSxFQUFBLEdBQUssVUFBQSxHQUFhO0FBQ2xCLGtDQUZKOztBQURKLHFCQURKOztnQkFLQSxJQUFHLEVBQUEsS0FBTSxDQUFUO29CQUNJLElBQUcsMkNBQUEsSUFBbUMsSUFBQyxDQUFBLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxJQUE5QixDQUFtQyxJQUFuQyxDQUF0Qzt3QkFDSSxFQUFBLEdBQUssVUFBQSxHQUFhLGFBRHRCO3FCQURKO2lCQU5KOztZQVVBLElBQW1CLEVBQUEsS0FBTSxDQUF6QjtnQkFBQSxFQUFBLEdBQUssV0FBTDs7WUFDQSxFQUFBLEdBQUssSUFBSSxDQUFDLEdBQUwsQ0FBUyxFQUFULEVBQWEsSUFBQyxDQUFBLHNCQUFELENBQXdCLEVBQUEsR0FBRyxDQUEzQixDQUFiO21CQUVMLENBQUMsQ0FBQyxRQUFGLENBQVcsRUFBWCxFQUFjLEVBQWQsRUFwQko7U0FBQSxNQUFBO21CQXNCSSxHQXRCSjs7SUFMd0I7Ozs7R0F4TFg7O0FBcU5yQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IGNsYW1wLCBlbXB0eSwgc2xhc2gsIGtlcnJvciwgZmlsZWxpc3QsIGtsb2csIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuQnVmZmVyICA9IHJlcXVpcmUgJy4vYnVmZmVyJ1xuU3ludGF4ICA9IHJlcXVpcmUgJy4vc3ludGF4J1xuRG8gICAgICA9IHJlcXVpcmUgJy4vZG8nXG5cbmNsYXNzIEVkaXRvciBleHRlbmRzIEJ1ZmZlclxuXG4gICAgQGFjdGlvbnMgPSBudWxsXG5cbiAgICBAOiAobmFtZSwgY29uZmlnKSAtPlxuXG4gICAgICAgIHN1cGVyKClcblxuICAgICAgICBAbmFtZSAgID0gbmFtZVxuICAgICAgICBAY29uZmlnID0gY29uZmlnID8ge31cbiAgICAgICAgQGNvbmZpZy5zeW50YXhOYW1lID89ICdzaCdcblxuICAgICAgICBFZGl0b3IuaW5pdEFjdGlvbnMoKSBpZiBub3QgRWRpdG9yLmFjdGlvbnM/XG5cbiAgICAgICAgQGluZGVudFN0cmluZyAgICA9IF8ucGFkU3RhcnQgJycgNFxuICAgICAgICBAc3RpY2t5U2VsZWN0aW9uID0gZmFsc2VcbiAgICAgICAgQHN5bnRheCAgICAgICAgICA9IG5ldyBTeW50YXggQGNvbmZpZy5zeW50YXhOYW1lLCBAbGluZSwgQGxpbmVzXG4gICAgICAgIEBkbyAgICAgICAgICAgICAgPSBuZXcgRG8gQFxuICAgICAgICBcbiAgICAgICAgQHNldHVwRmlsZVR5cGUoKVxuXG4gICAgZGVsOiAtPlxuXG4gICAgICAgIEBkby5kZWwoKVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIEBpbml0QWN0aW9uczogLT5cblxuICAgICAgICBAYWN0aW9ucyA9IFtdXG4gICAgICAgIGZvciBhY3Rpb25GaWxlIGluIGZpbGVsaXN0KHNsYXNoLmpvaW4gX19kaXJuYW1lLCAnYWN0aW9ucycpXG4gICAgICAgICAgICBjb250aW51ZSBpZiBzbGFzaC5leHQoYWN0aW9uRmlsZSkgbm90IGluIFsnanMnICdjb2ZmZWUnXVxuICAgICAgICAgICAgYWN0aW9ucyA9IHJlcXVpcmUgYWN0aW9uRmlsZVxuICAgICAgICAgICAgZm9yIGtleSx2YWx1ZSBvZiBhY3Rpb25zXG4gICAgICAgICAgICAgICAgaWYgXy5pc0Z1bmN0aW9uIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICMga2xvZyBcIkVkaXRvciBhY3Rpb24gI3trZXl9XCJcbiAgICAgICAgICAgICAgICAgICAgQHByb3RvdHlwZVtrZXldID0gdmFsdWVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGtleSA9PSAnYWN0aW9ucydcbiAgICAgICAgICAgICAgICAgICAgZm9yIGssdiBvZiB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IF8uaXNTdHJpbmcgdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYua2V5ID0gayBpZiBub3Qgdi5rZXk/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFjdGlvbnMucHVzaCB2XG5cbiAgICBAYWN0aW9uV2l0aE5hbWU6IChuYW1lKSAtPlxuXG4gICAgICAgIGZvciBhY3Rpb24gaW4gRWRpdG9yLmFjdGlvbnNcbiAgICAgICAgICAgIGlmIGFjdGlvbi5uYW1lID09IG5hbWVcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uXG4gICAgICAgIG51bGxcblxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAgMDAwICAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwMFxuXG4gICAgc2V0dXBGaWxlVHlwZTogLT5cblxuICAgICAgICBvbGRUeXBlID0gQGZpbGVUeXBlXG4gICAgICAgIG5ld1R5cGUgPSBAY29uZmlnPy5zeW50YXhOYW1lID8gJ3NoJ1xuXG4gICAgICAgIEBzeW50YXg/LnNldEZpbGVUeXBlIG5ld1R5cGVcbiAgICAgICAgQHNldEZpbGVUeXBlIG5ld1R5cGVcblxuICAgICAgICBpZiBvbGRUeXBlICE9IEBmaWxlVHlwZVxuICAgICAgICAgICAgQGVtaXQgJ2ZpbGVUeXBlQ2hhbmdlZCcgQGZpbGVUeXBlXG5cbiAgICBzZXRGaWxlVHlwZTogKEBmaWxlVHlwZSkgLT5cblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBzdHJpbmdzXG5cbiAgICAgICAgQHN0cmluZ0NoYXJhY3RlcnMgPVxuICAgICAgICAgICAgXCInXCI6ICAnc2luZ2xlJ1xuICAgICAgICAgICAgJ1wiJzogICdkb3VibGUnXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnbWQnICAgdGhlbiBAc3RyaW5nQ2hhcmFjdGVyc1snKiddID0gJ2JvbGQnXG4gICAgICAgICAgICB3aGVuICdub29uJyB0aGVuIEBzdHJpbmdDaGFyYWN0ZXJzWyd8J10gPSAncGlwZSdcblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBicmFja2V0c1xuXG4gICAgICAgIEBicmFja2V0Q2hhcmFjdGVycyA9XG4gICAgICAgICAgICBvcGVuOlxuICAgICAgICAgICAgICAgICdbJzogJ10nXG4gICAgICAgICAgICAgICAgJ3snOiAnfSdcbiAgICAgICAgICAgICAgICAnKCc6ICcpJ1xuICAgICAgICAgICAgY2xvc2U6ICAge31cbiAgICAgICAgICAgIHJlZ2V4cHM6IFtdXG5cbiAgICAgICAgc3dpdGNoIEBmaWxlVHlwZVxuICAgICAgICAgICAgd2hlbiAnaHRtbCcgdGhlbiBAYnJhY2tldENoYXJhY3RlcnMub3BlblsnPCddID0gJz4nXG5cbiAgICAgICAgZm9yIGssdiBvZiBAYnJhY2tldENoYXJhY3RlcnMub3BlblxuICAgICAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLmNsb3NlW3ZdID0ga1xuXG4gICAgICAgIEBicmFja2V0Q2hhcmFjdGVycy5yZWdleHAgPSBbXVxuICAgICAgICBmb3Iga2V5IGluIFsnb3BlbicgJ2Nsb3NlJ11cbiAgICAgICAgICAgIGNzdHIgPSBfLmtleXMoQGJyYWNrZXRDaGFyYWN0ZXJzW2tleV0pLmpvaW4gJydcbiAgICAgICAgICAgIHJlZyA9IG5ldyBSZWdFeHAgXCJbI3tfLmVzY2FwZVJlZ0V4cCBjc3RyfV1cIlxuICAgICAgICAgICAgQGJyYWNrZXRDaGFyYWN0ZXJzLnJlZ2V4cHMucHVzaCBbcmVnLCBrZXldXG5cbiAgICAgICAgIyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX18gc3Vycm91bmRcblxuICAgICAgICBAaW5pdFN1cnJvdW5kKClcblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBpbmRlbnRcblxuICAgICAgICBAaW5kZW50TmV3TGluZU1vcmUgPSBudWxsXG4gICAgICAgIEBpbmRlbnROZXdMaW5lTGVzcyA9IG51bGxcbiAgICAgICAgQGluc2VydEluZGVudGVkRW1wdHlMaW5lQmV0d2VlbiA9ICd7fSdcblxuICAgICAgICAjIF9fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fX19fXyBjb21tZW50XG5cbiAgICAgICAgQGxpbmVDb21tZW50ICA9ICcjJ1xuICAgICAgICBAbXVsdGlDb21tZW50ID0gJyMjIydcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2V0VGV4dDogKHRleHQ9XCJcIikgLT5cblxuICAgICAgICBsaW5lcyA9IHRleHQuc3BsaXQgL1xcbi9cblxuICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxuJ1xuICAgICAgICBpZiBub3QgZW1wdHkgbGluZXNcbiAgICAgICAgICAgIGlmIGxpbmVzWzBdLmVuZHNXaXRoICdcXHInXG4gICAgICAgICAgICAgICAgbGluZXMgPSB0ZXh0LnNwbGl0IC9cXHI/XFxuL1xuICAgICAgICAgICAgICAgIEBuZXdsaW5lQ2hhcmFjdGVycyA9ICdcXHJcXG4nXG5cbiAgICAgICAgIyBrbG9nICdzZXRUZXh0JyBsaW5lc1xuICAgICAgICBAc2V0TGluZXMgbGluZXNcblxuICAgIHNldExpbmVzOiAobGluZXMpIC0+XG5cbiAgICAgICAgIyBrbG9nICdzZXRMaW5lcycgbGluZXMubGVuZ3RoXG4gICAgICAgIEBzeW50YXguY2xlYXIoKVxuICAgICAgICBAc3ludGF4LnNldExpbmVzIGxpbmVzXG4gICAgICAgIHN1cGVyIGxpbmVzXG4gICAgICAgIEBlbWl0ICdsaW5lc1NldCcgbGluZXNcblxuICAgIHRleHRPZlNlbGVjdGlvbkZvckNsaXBib2FyZDogLT5cblxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAdGV4dE9mU2VsZWN0aW9uKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRleHRJblJhbmdlcyBAcmFuZ2VzRm9yQ3Vyc29yTGluZXMoKVxuXG4gICAgc3BsaXRTdGF0ZUxpbmVBdFBvczogKHN0YXRlLCBwb3MpIC0+XG5cbiAgICAgICAgbCA9IHN0YXRlLmxpbmUgcG9zWzFdXG4gICAgICAgIGtlcnJvciBcIm5vIGxpbmUgYXQgcG9zICN7cG9zfT9cIiBpZiBub3QgbD9cbiAgICAgICAgcmV0dXJuIFsnJyAnJ10gaWYgbm90IGw/XG4gICAgICAgIFtsLnNsaWNlKDAsIHBvc1swXSksIGwuc2xpY2UocG9zWzBdKV1cblxuICAgICMgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBlbWl0SW5zZXJ0OiAtPlxuXG4gICAgICAgIG1jID0gQG1haW5DdXJzb3IoKVxuICAgICAgICBsaW5lID0gQGxpbmUgbWNbMV1cblxuICAgICAgICBAZW1pdCAnaW5zZXJ0JyxcbiAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgYmVmb3JlOiBsaW5lLnNsaWNlIDAsIG1jWzBdXG4gICAgICAgICAgICBhZnRlcjogIGxpbmUuc2xpY2UgbWNbMF1cbiAgICAgICAgICAgIGN1cnNvcjogbWNcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwXG5cbiAgICBpbmRlbnRTdHJpbmdGb3JMaW5lQXRJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIHdoaWxlIGVtcHR5KEBsaW5lKGxpKS50cmltKCkpIGFuZCBsaSA+IDBcbiAgICAgICAgICAgIGxpLS1cblxuICAgICAgICBpZiAwIDw9IGxpIDwgQG51bUxpbmVzKClcblxuICAgICAgICAgICAgaWwgPSAwXG4gICAgICAgICAgICBsaW5lID0gQGxpbmUgbGlcbiAgICAgICAgICAgIHRoaXNJbmRlbnQgICA9IEBpbmRlbnRhdGlvbkF0TGluZUluZGV4IGxpXG4gICAgICAgICAgICBpbmRlbnRMZW5ndGggPSBAaW5kZW50U3RyaW5nLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiBAaW5kZW50TmV3TGluZU1vcmU/XG4gICAgICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVFbmRzV2l0aD8ubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGZvciBlIGluIEBpbmRlbnROZXdMaW5lTW9yZS5saW5lRW5kc1dpdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGxpbmUudHJpbSgpLmVuZHNXaXRoIGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgKyBpbmRlbnRMZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGlmIGlsID09IDBcbiAgICAgICAgICAgICAgICAgICAgaWYgQGluZGVudE5ld0xpbmVNb3JlLmxpbmVSZWdFeHA/IGFuZCBAaW5kZW50TmV3TGluZU1vcmUubGluZVJlZ0V4cC50ZXN0IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlsID0gdGhpc0luZGVudCArIGluZGVudExlbmd0aFxuXG4gICAgICAgICAgICBpbCA9IHRoaXNJbmRlbnQgaWYgaWwgPT0gMFxuICAgICAgICAgICAgaWwgPSBNYXRoLm1heCBpbCwgQGluZGVudGF0aW9uQXRMaW5lSW5kZXggbGkrMVxuXG4gICAgICAgICAgICBfLnBhZFN0YXJ0ICcnIGlsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICcnXG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/editor.coffee