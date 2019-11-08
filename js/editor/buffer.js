// koffee 1.4.0

/*
0000000    000   000  00000000  00000000  00000000  00000000
000   000  000   000  000       000       000       000   000
0000000    000   000  000000    000000    0000000   0000000
000   000  000   000  000       000       000       000   000
0000000     0000000   000       000       00000000  000   000
 */
var Buffer, State, _, clamp, empty, endOf, event, fuzzy, kerror, kstr, matchr, ref, startOf,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), matchr = ref.matchr, empty = ref.empty, clamp = ref.clamp, kstr = ref.kstr, kerror = ref.kerror, _ = ref._;

State = require('./state');

fuzzy = require('fuzzy');

event = require('events');

startOf = function(r) {
    return r[0];
};

endOf = function(r) {
    return r[0] + Math.max(1, r[1] - r[0]);
};

Buffer = (function(superClass) {
    extend1(Buffer, superClass);

    function Buffer() {
        this.isAnsiLine = bind(this.isAnsiLine, this);
        this.startOfWordAtPos = bind(this.startOfWordAtPos, this);
        this.endOfWordAtPos = bind(this.endOfWordAtPos, this);
        this.lines = bind(this.lines, this);
        this.line = bind(this.line, this);
        Buffer.__super__.constructor.call(this);
        this.newlineCharacters = '\n';
        this.wordRegExp = new RegExp("(\\s+|\\w+|[^\\s])", 'g');
        this.realWordRegExp = new RegExp("(\\w+)", 'g');
        this.setState(new State());
    }

    Buffer.prototype.setLines = function(lines) {
        this.emit('numLines', 0);
        this.setState(new State({
            lines: lines
        }));
        return this.emit('numLines', this.numLines());
    };

    Buffer.prototype.setState = function(state) {
        return this.state = new State(state.s);
    };

    Buffer.prototype.mainCursor = function() {
        return this.state.mainCursor();
    };

    Buffer.prototype.line = function(i) {
        return this.state.line(i);
    };

    Buffer.prototype.lastLine = function() {
        return this.line(this.numLines() - 1);
    };

    Buffer.prototype.tabline = function(i) {
        return this.state.tabline(i);
    };

    Buffer.prototype.cursor = function(i) {
        return this.state.cursor(i);
    };

    Buffer.prototype.highlight = function(i) {
        return this.state.highlight(i);
    };

    Buffer.prototype.selection = function(i) {
        return this.state.selection(i);
    };

    Buffer.prototype.lines = function() {
        return this.state.lines();
    };

    Buffer.prototype.cursors = function() {
        return this.state.cursors();
    };

    Buffer.prototype.highlights = function() {
        return this.state.highlights();
    };

    Buffer.prototype.selections = function() {
        return this.state.selections();
    };

    Buffer.prototype.numLines = function() {
        return this.state.numLines();
    };

    Buffer.prototype.numCursors = function() {
        return this.state.numCursors();
    };

    Buffer.prototype.numSelections = function() {
        return this.state.numSelections();
    };

    Buffer.prototype.numHighlights = function() {
        return this.state.numHighlights();
    };

    Buffer.prototype.setCursors = function(c) {
        return this.state = this.state.setCursors(c);
    };

    Buffer.prototype.setSelections = function(s) {
        return this.state = this.state.setSelections(s);
    };

    Buffer.prototype.setHighlights = function(h) {
        return this.state = this.state.setHighlights(h);
    };

    Buffer.prototype.setMain = function(m) {
        return this.state = this.state.setMain(m);
    };

    Buffer.prototype.addHighlight = function(h) {
        return this.state = this.state.addHighlight(h);
    };

    Buffer.prototype.select = function(s) {
        this["do"].start();
        this["do"].select(s);
        return this["do"].end();
    };

    Buffer.prototype.isCursorVirtual = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return this.numLines() && c[1] < this.numLines() && c[0] > this.line(c[1]).length;
    };

    Buffer.prototype.isCursorAtEndOfLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return this.numLines() && c[1] < this.numLines() && c[0] >= this.line(c[1]).length;
    };

    Buffer.prototype.isCursorAtStartOfLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return c[0] === 0;
    };

    Buffer.prototype.isCursorInIndent = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return this.numLines() && this.line(c[1]).slice(0, c[0]).trim().length === 0 && this.line(c[1]).slice(c[0]).trim().length;
    };

    Buffer.prototype.isCursorInLastLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return c[1] === this.numLines() - 1;
    };

    Buffer.prototype.isCursorInFirstLine = function(c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return c[1] === 0;
    };

    Buffer.prototype.isCursorInRange = function(r, c) {
        if (c == null) {
            c = this.mainCursor();
        }
        return isPosInRange(c, r);
    };

    Buffer.prototype.wordAtCursor = function() {
        return this.wordAtPos(this.mainCursor());
    };

    Buffer.prototype.wordAtPos = function(c) {
        return this.textInRange(this.rangeForRealWordAtPos(c));
    };

    Buffer.prototype.wordsAtCursors = function(cs, opt) {
        var j, len, r, ref1, results;
        if (cs == null) {
            cs = this.cursors();
        }
        ref1 = this.rangesForWordsAtCursors(cs, opt);
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            r = ref1[j];
            results.push(this.textInRange(r));
        }
        return results;
    };

    Buffer.prototype.rangesForWordsAtCursors = function(cs, opt) {
        var c, rngs;
        if (cs == null) {
            cs = this.cursors();
        }
        rngs = (function() {
            var j, len, results;
            results = [];
            for (j = 0, len = cs.length; j < len; j++) {
                c = cs[j];
                results.push(this.rangeForWordAtPos(c, opt));
            }
            return results;
        }).call(this);
        return rngs = cleanRanges(rngs);
    };

    Buffer.prototype.selectionTextOrWordAtCursor = function() {
        if (this.numSelections() === 1) {
            return this.textInRange(this.selection(0));
        } else {
            return this.wordAtCursor();
        }
    };

    Buffer.prototype.rangeForWordAtPos = function(pos, opt) {
        var p, r, wr;
        p = this.clampPos(pos);
        wr = this.wordRangesInLineAtIndex(p[1], opt);
        r = rangeAtPosInRanges(p, wr);
        return r;
    };

    Buffer.prototype.rangeForRealWordAtPos = function(pos, opt) {
        var p, r, wr;
        p = this.clampPos(pos);
        wr = this.realWordRangesInLineAtIndex(p[1], opt);
        r = rangeAtPosInRanges(p, wr);
        if ((r == null) || empty(this.textInRange(r).trim())) {
            r = rangeBeforePosInRanges(p, wr);
        }
        if ((r == null) || empty(this.textInRange(r).trim())) {
            r = rangeAfterPosInRanges(p, wr);
        }
        if (r != null) {
            r;
        } else {
            r = rangeForPos(p);
        }
        return r;
    };

    Buffer.prototype.endOfWordAtPos = function(c) {
        var r;
        r = this.rangeForWordAtPos(c);
        if (this.isCursorAtEndOfLine(c)) {
            if (this.isCursorInLastLine(c)) {
                return c;
            }
            r = this.rangeForWordAtPos([0, c[1] + 1]);
        }
        return [r[1][1], r[0]];
    };

    Buffer.prototype.startOfWordAtPos = function(c) {
        var r;
        if (this.isCursorAtStartOfLine(c)) {
            if (this.isCursorInFirstLine(c)) {
                return c;
            }
            r = this.rangeForWordAtPos([this.line(c[1] - 1).length, c[1] - 1]);
        } else {
            r = this.rangeForWordAtPos(c);
            if (r[1][0] === c[0]) {
                r = this.rangeForWordAtPos([c[0] - 1, c[1]]);
            }
        }
        return [r[1][0], r[0]];
    };

    Buffer.prototype.wordRangesInLineAtIndex = function(li, opt) {
        var mtch, r, ref1;
        if (opt == null) {
            opt = {};
        }
        if (opt.regExp != null) {
            opt.regExp;
        } else {
            opt.regExp = this.wordRegExp;
        }
        if (opt != null ? (ref1 = opt.include) != null ? ref1.length : void 0 : void 0) {
            opt.regExp = new RegExp("(\\s+|[\\w" + opt.include + "]+|[^\\s])", 'g');
        }
        r = [];
        while ((mtch = opt.regExp.exec(this.line(li))) !== null) {
            r.push([li, [mtch.index, opt.regExp.lastIndex]]);
        }
        return r.length && r || [[li, [0, 0]]];
    };

    Buffer.prototype.realWordRangesInLineAtIndex = function(li, opt) {
        var mtch, r;
        if (opt == null) {
            opt = {};
        }
        r = [];
        while ((mtch = this.realWordRegExp.exec(this.line(li))) !== null) {
            r.push([li, [mtch.index, this.realWordRegExp.lastIndex]]);
        }
        return r.length && r || [[li, [0, 0]]];
    };

    Buffer.prototype.highlightsInLineIndexRangeRelativeToLineIndex = function(lineIndexRange, relIndex) {
        var hl, j, len, results, s;
        hl = this.highlightsInLineIndexRange(lineIndexRange);
        if (hl) {
            results = [];
            for (j = 0, len = hl.length; j < len; j++) {
                s = hl[j];
                results.push([s[0] - relIndex, [s[1][0], s[1][1]], s[2]]);
            }
            return results;
        }
    };

    Buffer.prototype.highlightsInLineIndexRange = function(lineIndexRange) {
        return this.highlights().filter(function(s) {
            return s[0] >= lineIndexRange[0] && s[0] <= lineIndexRange[1];
        });
    };

    Buffer.prototype.isAnsiLine = function(li) {
        var line;
        if (line = this.line(li)) {
            return line !== kstr.stripAnsi(line);
        }
    };

    Buffer.prototype.selectionsInLineIndexRangeRelativeToLineIndex = function(lineIndexRange, relIndex) {
        var j, len, results, s, sl;
        sl = this.selectionsInLineIndexRange(lineIndexRange);
        if (sl) {
            results = [];
            for (j = 0, len = sl.length; j < len; j++) {
                s = sl[j];
                results.push([s[0] - relIndex, [s[1][0], s[1][1]]]);
            }
            return results;
        }
    };

    Buffer.prototype.selectionsInLineIndexRange = function(lineIndexRange) {
        return this.selections().filter(function(s) {
            return s[0] >= lineIndexRange[0] && s[0] <= lineIndexRange[1];
        });
    };

    Buffer.prototype.selectedLineIndices = function() {
        var s;
        return _.uniq((function() {
            var j, len, ref1, results;
            ref1 = this.selections();
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                s = ref1[j];
                results.push(s[0]);
            }
            return results;
        }).call(this));
    };

    Buffer.prototype.cursorLineIndices = function() {
        var c;
        return _.uniq((function() {
            var j, len, ref1, results;
            ref1 = this.cursors();
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                c = ref1[j];
                results.push(c[1]);
            }
            return results;
        }).call(this));
    };

    Buffer.prototype.selectedAndCursorLineIndices = function() {
        return _.uniq(this.selectedLineIndices().concat(this.cursorLineIndices()));
    };

    Buffer.prototype.continuousCursorAndSelectedLineIndexRanges = function() {
        var csr, il, j, len, li;
        il = this.selectedAndCursorLineIndices();
        csr = [];
        if (il.length) {
            for (j = 0, len = il.length; j < len; j++) {
                li = il[j];
                if (csr.length && _.last(csr)[1] === li - 1) {
                    _.last(csr)[1] = li;
                } else {
                    csr.push([li, li]);
                }
            }
        }
        return csr;
    };

    Buffer.prototype.isSelectedLineAtIndex = function(li) {
        var il, s;
        il = this.selectedLineIndices();
        if (indexOf.call(il, li) >= 0) {
            s = this.selection(il.indexOf(li));
            if (s[1][0] === 0 && s[1][1] === this.line(li).length) {
                return true;
            }
        }
        return false;
    };

    Buffer.prototype.text = function() {
        return this.state.text(this.newlineCharacters);
    };

    Buffer.prototype.textInRange = function(rg) {
        var base;
        return typeof (base = this.line(rg[0])).slice === "function" ? base.slice(rg[1][0], rg[1][1]) : void 0;
    };

    Buffer.prototype.textsInRanges = function(rgs) {
        var j, len, r, results;
        results = [];
        for (j = 0, len = rgs.length; j < len; j++) {
            r = rgs[j];
            results.push(this.textInRange(r));
        }
        return results;
    };

    Buffer.prototype.textInRanges = function(rgs) {
        return this.textsInRanges(rgs).join('\n');
    };

    Buffer.prototype.textOfSelection = function() {
        return this.textInRanges(this.selections());
    };

    Buffer.prototype.textOfHighlight = function() {
        return this.numHighlights() && this.textInRange(this.highlight(0)) || '';
    };

    Buffer.prototype.indentationAtLineIndex = function(li) {
        var line;
        if (li >= this.numLines()) {
            return 0;
        }
        line = this.line(li);
        while (empty(line.trim()) && li > 0) {
            li--;
            line = this.line(li);
        }
        return indentationInLine(line);
    };

    Buffer.prototype.lastPos = function() {
        var lli;
        lli = this.numLines() - 1;
        return [this.line(lli).length, lli];
    };

    Buffer.prototype.cursorPos = function() {
        return this.clampPos(this.mainCursor());
    };

    Buffer.prototype.clampPos = function(p) {
        var c, l;
        if (!this.numLines()) {
            return [0, -1];
        }
        l = clamp(0, this.numLines() - 1, p[1]);
        c = clamp(0, this.line(l).length, p[0]);
        return [c, l];
    };

    Buffer.prototype.wordStartPosAfterPos = function(p) {
        if (p == null) {
            p = this.cursorPos();
        }
        if (p[0] < this.line(p[1]).length && this.line(p[1])[p[0]] !== ' ') {
            return p;
        }
        while (p[0] < this.line(p[1]).length - 1) {
            if (this.line(p[1])[p[0] + 1] !== ' ') {
                return [p[0] + 1, p[1]];
            }
            p[0] += 1;
        }
        if (p[1] < this.numLines() - 1) {
            return this.wordStartPosAfterPos([0, p[1] + 1]);
        } else {
            return null;
        }
    };

    Buffer.prototype.rangeForLineAtIndex = function(i) {
        if (i >= this.numLines()) {
            return kerror("Buffer.rangeForLineAtIndex -- index " + i + " >= " + (this.numLines()));
        }
        return [i, [0, this.line(i).length]];
    };

    Buffer.prototype.isRangeInString = function(r) {
        return this.rangeOfStringSurroundingRange(r) != null;
    };

    Buffer.prototype.rangeOfInnerStringSurroundingRange = function(r) {
        var rgs;
        rgs = this.rangesOfStringsInLineAtIndex(r[0]);
        rgs = rangesShrunkenBy(rgs, 1);
        return rangeContainingRangeInRanges(r, rgs);
    };

    Buffer.prototype.rangeOfStringSurroundingRange = function(r) {
        var ir;
        if (ir = this.rangeOfInnerStringSurroundingRange(r)) {
            return rangeGrownBy(ir, 1);
        }
    };

    Buffer.prototype.distanceOfWord = function(w, pos) {
        var d, la, lb;
        if (pos == null) {
            pos = this.cursorPos();
        }
        if (this.line(pos[1]).indexOf(w) >= 0) {
            return 0;
        }
        d = 1;
        lb = pos[1] - d;
        la = pos[1] + d;
        while (lb >= 0 || la < this.numLines()) {
            if (lb >= 0) {
                if (this.line(lb).indexOf(w) >= 0) {
                    return d;
                }
            }
            if (la < this.numLines()) {
                if (this.line(la).indexOf(w) >= 0) {
                    return d;
                }
            }
            d++;
            lb = pos[1] - d;
            la = pos[1] + d;
        }
        return Number.MAX_SAFE_INTEGER;
    };

    Buffer.prototype.rangesForCursorLines = function(cs) {
        var c, j, len, results;
        if (cs == null) {
            cs = this.cursors();
        }
        results = [];
        for (j = 0, len = cs.length; j < len; j++) {
            c = cs[j];
            results.push(this.rangeForLineAtIndex(c[1]));
        }
        return results;
    };

    Buffer.prototype.rangesForAllLines = function() {
        return this.rangesForLinesFromTopToBot(0, this.numLines());
    };

    Buffer.prototype.rangesForLinesBetweenPositions = function(a, b, extend) {
        var i, j, r, ref1, ref2, ref3;
        if (extend == null) {
            extend = false;
        }
        r = [];
        ref1 = sortPositions([a, b]), a = ref1[0], b = ref1[1];
        if (a[1] === b[1]) {
            r.push([a[1], [a[0], b[0]]]);
        } else {
            r.push([a[1], [a[0], this.line(a[1]).length]]);
            if (b[1] - a[1] > 1) {
                for (i = j = ref2 = a[1] + 1, ref3 = b[1]; ref2 <= ref3 ? j < ref3 : j > ref3; i = ref2 <= ref3 ? ++j : --j) {
                    r.push([i, [0, this.line(i).length]]);
                }
            }
            r.push([b[1], [0, extend && b[0] === 0 && this.line(b[1]).length || b[0]]]);
        }
        return r;
    };

    Buffer.prototype.rangesForLinesFromTopToBot = function(top, bot) {
        var ir, j, li, r, ref1, ref2;
        r = [];
        ir = [top, bot];
        for (li = j = ref1 = startOf(ir), ref2 = endOf(ir); ref1 <= ref2 ? j < ref2 : j > ref2; li = ref1 <= ref2 ? ++j : --j) {
            r.push(this.rangeForLineAtIndex(li));
        }
        return r;
    };

    Buffer.prototype.rangesForText = function(t, opt) {
        var j, li, r, ref1, ref2;
        t = t.split('\n')[0];
        r = [];
        for (li = j = 0, ref1 = this.numLines(); 0 <= ref1 ? j < ref1 : j > ref1; li = 0 <= ref1 ? ++j : --j) {
            r = r.concat(this.rangesForTextInLineAtIndex(t, li, opt));
            if (r.length >= ((ref2 = opt != null ? opt.max : void 0) != null ? ref2 : 999)) {
                break;
            }
        }
        return r;
    };

    Buffer.prototype.rangesForTextInLineAtIndex = function(t, i, opt) {
        var j, len, mtch, r, re, ref1, rng, rngs, type;
        r = [];
        type = (ref1 = opt != null ? opt.type : void 0) != null ? ref1 : 'str';
        switch (type) {
            case 'fuzzy':
                re = new RegExp("\\w+", 'g');
                while ((mtch = re.exec(this.line(i))) !== null) {
                    if (fuzzy.test(t, this.line(i).slice(mtch.index, re.lastIndex))) {
                        r.push([i, [mtch.index, re.lastIndex]]);
                    }
                }
                break;
            default:
                if (type === 'str' || type === 'Str' || type === 'glob') {
                    t = _.escapeRegExp(t);
                }
                if (type === 'glob') {
                    t = t.replace(new RegExp("\\*", 'g'), "\w*");
                    if (!t.length) {
                        return r;
                    }
                }
                rngs = matchr.ranges(t, this.line(i), (type === 'str' || type === 'reg' || type === 'glob') && 'i' || '');
                for (j = 0, len = rngs.length; j < len; j++) {
                    rng = rngs[j];
                    r.push([i, [rng.start, rng.start + rng.match.length]]);
                }
        }
        return r;
    };

    Buffer.prototype.rangesOfStringsInLineAtIndex = function(li) {
        var c, cc, i, j, r, ref1, ss, t;
        t = this.line(li);
        r = [];
        ss = -1;
        cc = null;
        for (i = j = 0, ref1 = t.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            c = t[i];
            if (!cc && indexOf.call("'\"", c) >= 0) {
                cc = c;
                ss = i;
            } else if (c === cc) {
                if ((t[i - 1] !== '\\') || (i > 2 && t[i - 2] === '\\')) {
                    r.push([li, [ss, i + 1]]);
                    cc = null;
                    ss = -1;
                }
            }
        }
        return r;
    };

    return Buffer;

})(event);

module.exports = Buffer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1RkFBQTtJQUFBOzs7OztBQVFBLE1BQTRDLE9BQUEsQ0FBUSxLQUFSLENBQTVDLEVBQUUsbUJBQUYsRUFBVSxpQkFBVixFQUFpQixpQkFBakIsRUFBd0IsZUFBeEIsRUFBOEIsbUJBQTlCLEVBQXNDOztBQUV0QyxLQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxPQUFSOztBQUNWLEtBQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7QUFFVixPQUFBLEdBQVUsU0FBQyxDQUFEO1dBQU8sQ0FBRSxDQUFBLENBQUE7QUFBVDs7QUFDVixLQUFBLEdBQVUsU0FBQyxDQUFEO1dBQU8sQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLElBQUksQ0FBQyxHQUFMLENBQVMsQ0FBVCxFQUFZLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFFLENBQUEsQ0FBQSxDQUFuQjtBQUFkOztBQUVKOzs7SUFFQyxnQkFBQTs7Ozs7O1FBQ0Msc0NBQUE7UUFDQSxJQUFDLENBQUEsaUJBQUQsR0FBcUI7UUFDckIsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJLE1BQUosQ0FBVyxvQkFBWCxFQUFnQyxHQUFoQztRQUNkLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUksTUFBSixDQUFXLFFBQVgsRUFBb0IsR0FBcEI7UUFDbEIsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFJLEtBQUosQ0FBQSxDQUFWO0lBTEQ7O3FCQU9ILFFBQUEsR0FBVSxTQUFDLEtBQUQ7UUFDTixJQUFDLENBQUEsSUFBRCxDQUFNLFVBQU4sRUFBaUIsQ0FBakI7UUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLElBQUksS0FBSixDQUFVO1lBQUEsS0FBQSxFQUFNLEtBQU47U0FBVixDQUFWO2VBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxV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Q0wsRUFBQSxHQUFLLEVBRlQ7YUFBQSxNQUdLLElBQUcsQ0FBQSxLQUFLLEVBQVI7Z0JBQ0QsSUFBRyxDQUFDLENBQUUsQ0FBQSxDQUFBLEdBQUUsQ0FBRixDQUFGLEtBQVUsSUFBWCxDQUFBLElBQW9CLENBQUMsQ0FBQSxHQUFFLENBQUYsSUFBUSxDQUFFLENBQUEsQ0FBQSxHQUFFLENBQUYsQ0FBRixLQUFVLElBQW5CLENBQXZCO29CQUNJLENBQUMsQ0FBQyxJQUFGLENBQU8sQ0FBQyxFQUFELEVBQUssQ0FBQyxFQUFELEVBQUssQ0FBQSxHQUFFLENBQVAsQ0FBTCxDQUFQO29CQUNBLEVBQUEsR0FBSztvQkFDTCxFQUFBLEdBQUssQ0FBQyxFQUhWO2lCQURDOztBQUxUO2VBVUE7SUFmMEI7Ozs7R0E3V2I7O0FBOFhyQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgbWF0Y2hyLCBlbXB0eSwgY2xhbXAsIGtzdHIsIGtlcnJvciwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TdGF0ZSAgID0gcmVxdWlyZSAnLi9zdGF0ZSdcbmZ1enp5ICAgPSByZXF1aXJlICdmdXp6eSdcbmV2ZW50ICAgPSByZXF1aXJlICdldmVudHMnXG5cbnN0YXJ0T2YgPSAocikgLT4gclswXVxuZW5kT2YgICA9IChyKSAtPiByWzBdICsgTWF0aC5tYXggMSwgclsxXS1yWzBdXG5cbmNsYXNzIEJ1ZmZlciBleHRlbmRzIGV2ZW50XG5cbiAgICBAOiAtPlxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBuZXdsaW5lQ2hhcmFjdGVycyA9ICdcXG4nXG4gICAgICAgIEB3b3JkUmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxccyt8XFxcXHcrfFteXFxcXHNdKVwiICdnJ1xuICAgICAgICBAcmVhbFdvcmRSZWdFeHAgPSBuZXcgUmVnRXhwIFwiKFxcXFx3KylcIiAnZydcbiAgICAgICAgQHNldFN0YXRlIG5ldyBTdGF0ZSgpXG5cbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuICAgICAgICBAZW1pdCAnbnVtTGluZXMnIDAgIyBnaXZlIGxpc3RlbmVycyBhIGNoYW5jZSB0byBjbGVhciB0aGVpciBzdHVmZlxuICAgICAgICBAc2V0U3RhdGUgbmV3IFN0YXRlIGxpbmVzOmxpbmVzXG4gICAgICAgIEBlbWl0ICdudW1MaW5lcycgQG51bUxpbmVzKClcblxuICAgIHNldFN0YXRlOiAoc3RhdGUpIC0+IEBzdGF0ZSA9IG5ldyBTdGF0ZSBzdGF0ZS5zXG5cbiAgICBtYWluQ3Vyc29yOiAgICAtPiBAc3RhdGUubWFpbkN1cnNvcigpXG4gICAgbGluZTogICAgICAoaSkgPT4gQHN0YXRlLmxpbmUgaVxuICAgIGxhc3RMaW5lOiAgICAgIC0+IEBsaW5lIEBudW1MaW5lcygpLTFcbiAgICB0YWJsaW5lOiAgIChpKSAtPiBAc3RhdGUudGFibGluZSBpXG4gICAgY3Vyc29yOiAgICAoaSkgLT4gQHN0YXRlLmN1cnNvciBpXG4gICAgaGlnaGxpZ2h0OiAoaSkgLT4gQHN0YXRlLmhpZ2hsaWdodCBpXG4gICAgc2VsZWN0aW9uOiAoaSkgLT4gQHN0YXRlLnNlbGVjdGlvbiBpXG5cbiAgICBsaW5lczogICAgICAgICA9PiBAc3RhdGUubGluZXMoKVxuICAgIGN1cnNvcnM6ICAgICAgIC0+IEBzdGF0ZS5jdXJzb3JzKClcbiAgICBoaWdobGlnaHRzOiAgICAtPiBAc3RhdGUuaGlnaGxpZ2h0cygpXG4gICAgc2VsZWN0aW9uczogICAgLT4gQHN0YXRlLnNlbGVjdGlvbnMoKVxuXG4gICAgbnVtTGluZXM6ICAgICAgLT4gQHN0YXRlLm51bUxpbmVzKClcbiAgICBudW1DdXJzb3JzOiAgICAtPiBAc3RhdGUubnVtQ3Vyc29ycygpXG4gICAgbnVtU2VsZWN0aW9uczogLT4gQHN0YXRlLm51bVNlbGVjdGlvbnMoKVxuICAgIG51bUhpZ2hsaWdodHM6IC0+IEBzdGF0ZS5udW1IaWdobGlnaHRzKClcbiAgICBcbiAgICAjIHRoZXNlIGFyZSB1c2VkIGZyb20gdGVzdHMgYW5kIHJlc3RvcmVcbiAgICBzZXRDdXJzb3JzOiAgICAoYykgLT4gQHN0YXRlID0gQHN0YXRlLnNldEN1cnNvcnMgICAgY1xuICAgIHNldFNlbGVjdGlvbnM6IChzKSAtPiBAc3RhdGUgPSBAc3RhdGUuc2V0U2VsZWN0aW9ucyBzXG4gICAgc2V0SGlnaGxpZ2h0czogKGgpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5zZXRIaWdobGlnaHRzIGhcbiAgICBzZXRNYWluOiAgICAgICAobSkgLT4gQHN0YXRlID0gQHN0YXRlLnNldE1haW4gICAgICAgbVxuICAgIGFkZEhpZ2hsaWdodDogIChoKSAtPiBAc3RhdGUgPSBAc3RhdGUuYWRkSGlnaGxpZ2h0ICBoXG5cbiAgICBzZWxlY3Q6IChzKSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZWxlY3Qgc1xuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaXNDdXJzb3JWaXJ0dWFsOiAgICAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgY1sxXSA8IEBudW1MaW5lcygpIGFuZCBjWzBdID4gQGxpbmUoY1sxXSkubGVuZ3RoXG4gICAgaXNDdXJzb3JBdEVuZE9mTGluZTogICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgY1sxXSA8IEBudW1MaW5lcygpIGFuZCBjWzBdID49IEBsaW5lKGNbMV0pLmxlbmd0aFxuICAgIGlzQ3Vyc29yQXRTdGFydE9mTGluZTogKGM9QG1haW5DdXJzb3IoKSkgLT4gY1swXSA9PSAwXG4gICAgaXNDdXJzb3JJbkluZGVudDogICAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBAbnVtTGluZXMoKSBhbmQgQGxpbmUoY1sxXSkuc2xpY2UoMCwgY1swXSkudHJpbSgpLmxlbmd0aCA9PSAwIGFuZCBAbGluZShjWzFdKS5zbGljZShjWzBdKS50cmltKCkubGVuZ3RoXG4gICAgaXNDdXJzb3JJbkxhc3RMaW5lOiAgICAoYz1AbWFpbkN1cnNvcigpKSAtPiBjWzFdID09IEBudW1MaW5lcygpLTFcbiAgICBpc0N1cnNvckluRmlyc3RMaW5lOiAgIChjPUBtYWluQ3Vyc29yKCkpIC0+IGNbMV0gPT0gMFxuICAgIGlzQ3Vyc29ySW5SYW5nZTogICAgICAgKHIsYz1AbWFpbkN1cnNvcigpKSAtPiBpc1Bvc0luUmFuZ2UgYywgclxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICB3b3JkQXRDdXJzb3I6IC0+IEB3b3JkQXRQb3MgQG1haW5DdXJzb3IoKVxuICAgIHdvcmRBdFBvczogKGMpIC0+IEB0ZXh0SW5SYW5nZSBAcmFuZ2VGb3JSZWFsV29yZEF0UG9zIGNcbiAgICB3b3Jkc0F0Q3Vyc29yczogKGNzPUBjdXJzb3JzKCksIG9wdCkgLT4gKEB0ZXh0SW5SYW5nZSByIGZvciByIGluIEByYW5nZXNGb3JXb3Jkc0F0Q3Vyc29ycyBjcywgb3B0KVxuXG4gICAgcmFuZ2VzRm9yV29yZHNBdEN1cnNvcnM6IChjcz1AY3Vyc29ycygpLCBvcHQpIC0+XG4gICAgICAgIHJuZ3MgPSAoQHJhbmdlRm9yV29yZEF0UG9zKGMsIG9wdCkgZm9yIGMgaW4gY3MpXG4gICAgICAgIHJuZ3MgPSBjbGVhblJhbmdlcyBybmdzXG5cbiAgICBzZWxlY3Rpb25UZXh0T3JXb3JkQXRDdXJzb3I6ICgpIC0+XG5cbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSA9PSAxXG4gICAgICAgICAgICBAdGV4dEluUmFuZ2UgQHNlbGVjdGlvbiAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3b3JkQXRDdXJzb3IoKVxuXG4gICAgcmFuZ2VGb3JXb3JkQXRQb3M6IChwb3MsIG9wdCkgLT5cblxuICAgICAgICBwID0gQGNsYW1wUG9zIHBvc1xuICAgICAgICB3ciA9IEB3b3JkUmFuZ2VzSW5MaW5lQXRJbmRleCBwWzFdLCBvcHRcbiAgICAgICAgciA9IHJhbmdlQXRQb3NJblJhbmdlcyBwLCB3clxuICAgICAgICByXG5cbiAgICByYW5nZUZvclJlYWxXb3JkQXRQb3M6IChwb3MsIG9wdCkgLT5cblxuICAgICAgICBwID0gQGNsYW1wUG9zIHBvc1xuICAgICAgICB3ciA9IEByZWFsV29yZFJhbmdlc0luTGluZUF0SW5kZXggcFsxXSwgb3B0XG5cbiAgICAgICAgciA9IHJhbmdlQXRQb3NJblJhbmdlcyBwLCB3clxuICAgICAgICBpZiBub3Qgcj8gb3IgZW1wdHkgQHRleHRJblJhbmdlKHIpLnRyaW0oKVxuICAgICAgICAgICAgciA9IHJhbmdlQmVmb3JlUG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgaWYgbm90IHI/IG9yIGVtcHR5IEB0ZXh0SW5SYW5nZShyKS50cmltKClcbiAgICAgICAgICAgIHIgPSByYW5nZUFmdGVyUG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgciA/PSByYW5nZUZvclBvcyBwXG4gICAgICAgIHJcblxuICAgIGVuZE9mV29yZEF0UG9zOiAoYykgPT5cblxuICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIGNcbiAgICAgICAgaWYgQGlzQ3Vyc29yQXRFbmRPZkxpbmUgY1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgQGlzQ3Vyc29ySW5MYXN0TGluZSBjXG4gICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIFswLCBjWzFdKzFdXG4gICAgICAgIFtyWzFdWzFdLCByWzBdXVxuXG4gICAgc3RhcnRPZldvcmRBdFBvczogKGMpID0+XG5cbiAgICAgICAgaWYgQGlzQ3Vyc29yQXRTdGFydE9mTGluZSBjXG4gICAgICAgICAgICByZXR1cm4gYyBpZiBAaXNDdXJzb3JJbkZpcnN0TGluZSBjXG4gICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIFtAbGluZShjWzFdLTEpLmxlbmd0aCwgY1sxXS0xXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIGNcbiAgICAgICAgICAgIGlmIHJbMV1bMF0gPT0gY1swXVxuICAgICAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgW2NbMF0tMSwgY1sxXV1cbiAgICAgICAgW3JbMV1bMF0sIHJbMF1dXG5cbiAgICB3b3JkUmFuZ2VzSW5MaW5lQXRJbmRleDogKGxpLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgb3B0LnJlZ0V4cCA/PSBAd29yZFJlZ0V4cFxuICAgICAgICBvcHQucmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxccyt8W1xcXFx3I3tvcHQuaW5jbHVkZX1dK3xbXlxcXFxzXSlcIiAnZycgaWYgb3B0Py5pbmNsdWRlPy5sZW5ndGhcbiAgICAgICAgciA9IFtdXG4gICAgICAgIHdoaWxlIChtdGNoID0gb3B0LnJlZ0V4cC5leGVjKEBsaW5lKGxpKSkpICE9IG51bGxcbiAgICAgICAgICAgIHIucHVzaCBbbGksIFttdGNoLmluZGV4LCBvcHQucmVnRXhwLmxhc3RJbmRleF1dXG4gICAgICAgIHIubGVuZ3RoIGFuZCByIG9yIFtbbGksIFswLDBdXV1cblxuICAgIHJlYWxXb3JkUmFuZ2VzSW5MaW5lQXRJbmRleDogKGxpLCBvcHQ9e30pIC0+XG5cbiAgICAgICAgciA9IFtdXG4gICAgICAgIHdoaWxlIChtdGNoID0gQHJlYWxXb3JkUmVnRXhwLmV4ZWMoQGxpbmUobGkpKSkgIT0gbnVsbFxuICAgICAgICAgICAgci5wdXNoIFtsaSwgW210Y2guaW5kZXgsIEByZWFsV29yZFJlZ0V4cC5sYXN0SW5kZXhdXVxuICAgICAgICByLmxlbmd0aCBhbmQgciBvciBbW2xpLCBbMCwwXV1dXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDBcblxuICAgIGhpZ2hsaWdodHNJbkxpbmVJbmRleFJhbmdlUmVsYXRpdmVUb0xpbmVJbmRleDogKGxpbmVJbmRleFJhbmdlLCByZWxJbmRleCkgLT5cblxuICAgICAgICBobCA9IEBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZSBsaW5lSW5kZXhSYW5nZVxuICAgICAgICBpZiBobFxuICAgICAgICAgICAgKFtzWzBdLXJlbEluZGV4LCBbc1sxXVswXSwgc1sxXVsxXV0sIHNbMl1dIGZvciBzIGluIGhsKVxuXG4gICAgaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2U6IChsaW5lSW5kZXhSYW5nZSkgLT5cblxuICAgICAgICBAaGlnaGxpZ2h0cygpLmZpbHRlciAocykgLT4gc1swXSA+PSBsaW5lSW5kZXhSYW5nZVswXSBhbmQgc1swXSA8PSBsaW5lSW5kZXhSYW5nZVsxXVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaXNBbnNpTGluZTogKGxpKSA9PiBcbiAgICAgICAgaWYgbGluZSA9IEBsaW5lIGxpXG4gICAgICAgICAgICBsaW5lICE9IGtzdHIuc3RyaXBBbnNpIGxpbmVcbiAgICBcbiAgICBzZWxlY3Rpb25zSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXg6IChsaW5lSW5kZXhSYW5nZSwgcmVsSW5kZXgpIC0+XG5cbiAgICAgICAgc2wgPSBAc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2UgbGluZUluZGV4UmFuZ2VcbiAgICAgICAgaWYgc2xcbiAgICAgICAgICAgIChbc1swXS1yZWxJbmRleCwgW3NbMV1bMF0sIHNbMV1bMV1dXSBmb3IgcyBpbiBzbClcblxuICAgIHNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlOiAobGluZUluZGV4UmFuZ2UpIC0+XG5cbiAgICAgICAgQHNlbGVjdGlvbnMoKS5maWx0ZXIgKHMpIC0+IHNbMF0gPj0gbGluZUluZGV4UmFuZ2VbMF0gYW5kIHNbMF0gPD0gbGluZUluZGV4UmFuZ2VbMV1cblxuICAgIHNlbGVjdGVkTGluZUluZGljZXM6IC0+IF8udW5pcSAoc1swXSBmb3IgcyBpbiBAc2VsZWN0aW9ucygpKVxuICAgIGN1cnNvckxpbmVJbmRpY2VzOiAgIC0+IF8udW5pcSAoY1sxXSBmb3IgYyBpbiBAY3Vyc29ycygpKVxuXG4gICAgc2VsZWN0ZWRBbmRDdXJzb3JMaW5lSW5kaWNlczogLT5cblxuICAgICAgICBfLnVuaXEgQHNlbGVjdGVkTGluZUluZGljZXMoKS5jb25jYXQgQGN1cnNvckxpbmVJbmRpY2VzKClcblxuICAgIGNvbnRpbnVvdXNDdXJzb3JBbmRTZWxlY3RlZExpbmVJbmRleFJhbmdlczogLT5cblxuICAgICAgICBpbCA9IEBzZWxlY3RlZEFuZEN1cnNvckxpbmVJbmRpY2VzKClcbiAgICAgICAgY3NyID0gW11cbiAgICAgICAgaWYgaWwubGVuZ3RoXG4gICAgICAgICAgICBmb3IgbGkgaW4gaWxcbiAgICAgICAgICAgICAgICBpZiBjc3IubGVuZ3RoIGFuZCBfLmxhc3QoY3NyKVsxXSA9PSBsaS0xXG4gICAgICAgICAgICAgICAgICAgIF8ubGFzdChjc3IpWzFdID0gbGlcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNzci5wdXNoIFtsaSxsaV1cbiAgICAgICAgY3NyXG5cbiAgICBpc1NlbGVjdGVkTGluZUF0SW5kZXg6IChsaSkgLT5cblxuICAgICAgICBpbCA9IEBzZWxlY3RlZExpbmVJbmRpY2VzKClcbiAgICAgICAgaWYgbGkgaW4gaWxcbiAgICAgICAgICAgIHMgPSBAc2VsZWN0aW9uKGlsLmluZGV4T2YgbGkpXG4gICAgICAgICAgICBpZiBzWzFdWzBdID09IDAgYW5kIHNbMV1bMV0gPT0gQGxpbmUobGkpLmxlbmd0aFxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGZhbHNlXG5cbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgdGV4dDogICAgICAgICAgICAgICAgLT4gQHN0YXRlLnRleHQgQG5ld2xpbmVDaGFyYWN0ZXJzXG4gICAgdGV4dEluUmFuZ2U6ICAgKHJnKSAgLT4gQGxpbmUocmdbMF0pLnNsaWNlPyByZ1sxXVswXSwgcmdbMV1bMV1cbiAgICB0ZXh0c0luUmFuZ2VzOiAocmdzKSAtPiAoQHRleHRJblJhbmdlKHIpIGZvciByIGluIHJncylcbiAgICB0ZXh0SW5SYW5nZXM6ICAocmdzKSAtPiBAdGV4dHNJblJhbmdlcyhyZ3MpLmpvaW4gJ1xcbidcbiAgICB0ZXh0T2ZTZWxlY3Rpb246ICAgICAtPiBAdGV4dEluUmFuZ2VzIEBzZWxlY3Rpb25zKClcbiAgICB0ZXh0T2ZIaWdobGlnaHQ6ICAgICAtPiBAbnVtSGlnaGxpZ2h0cygpIGFuZCBAdGV4dEluUmFuZ2UoQGhpZ2hsaWdodCAwKSBvciAnJ1xuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgaW5kZW50YXRpb25BdExpbmVJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIHJldHVybiAwIGlmIGxpID49IEBudW1MaW5lcygpXG4gICAgICAgIGxpbmUgPSBAbGluZSBsaVxuICAgICAgICB3aGlsZSBlbXB0eShsaW5lLnRyaW0oKSkgYW5kIGxpID4gMFxuICAgICAgICAgICAgbGktLVxuICAgICAgICAgICAgbGluZSA9IEBsaW5lIGxpXG4gICAgICAgIGluZGVudGF0aW9uSW5MaW5lIGxpbmVcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgbGFzdFBvczogLT5cblxuICAgICAgICBsbGkgPSBAbnVtTGluZXMoKS0xXG4gICAgICAgIFtAbGluZShsbGkpLmxlbmd0aCwgbGxpXVxuXG4gICAgY3Vyc29yUG9zOiAtPiBAY2xhbXBQb3MgQG1haW5DdXJzb3IoKVxuXG4gICAgY2xhbXBQb3M6IChwKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAbnVtTGluZXMoKSB0aGVuIHJldHVybiBbMCwtMV1cbiAgICAgICAgbCA9IGNsYW1wIDAsIEBudW1MaW5lcygpLTEsICBwWzFdXG4gICAgICAgIGMgPSBjbGFtcCAwLCBAbGluZShsKS5sZW5ndGgsIHBbMF1cbiAgICAgICAgWyBjLCBsIF1cblxuICAgIHdvcmRTdGFydFBvc0FmdGVyUG9zOiAocD1AY3Vyc29yUG9zKCkpIC0+XG5cbiAgICAgICAgcmV0dXJuIHAgaWYgcFswXSA8IEBsaW5lKHBbMV0pLmxlbmd0aCBhbmQgQGxpbmUocFsxXSlbcFswXV0gIT0gJyAnXG5cbiAgICAgICAgd2hpbGUgcFswXSA8IEBsaW5lKHBbMV0pLmxlbmd0aC0xXG4gICAgICAgICAgICByZXR1cm4gW3BbMF0rMSwgcFsxXV0gaWYgQGxpbmUocFsxXSlbcFswXSsxXSAhPSAnICdcbiAgICAgICAgICAgIHBbMF0gKz0gMVxuXG4gICAgICAgIGlmIHBbMV0gPCBAbnVtTGluZXMoKS0xXG4gICAgICAgICAgICBAd29yZFN0YXJ0UG9zQWZ0ZXJQb3MgWzAsIHBbMV0rMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbnVsbFxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgcmFuZ2VGb3JMaW5lQXRJbmRleDogKGkpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIkJ1ZmZlci5yYW5nZUZvckxpbmVBdEluZGV4IC0tIGluZGV4ICN7aX0gPj0gI3tAbnVtTGluZXMoKX1cIiBpZiBpID49IEBudW1MaW5lcygpXG4gICAgICAgIFtpLCBbMCwgQGxpbmUoaSkubGVuZ3RoXV1cblxuICAgIGlzUmFuZ2VJblN0cmluZzogKHIpIC0+IEByYW5nZU9mU3RyaW5nU3Vycm91bmRpbmdSYW5nZShyKT9cblxuICAgIHJhbmdlT2ZJbm5lclN0cmluZ1N1cnJvdW5kaW5nUmFuZ2U6IChyKSAtPlxuXG4gICAgICAgIHJncyA9IEByYW5nZXNPZlN0cmluZ3NJbkxpbmVBdEluZGV4IHJbMF1cbiAgICAgICAgcmdzID0gcmFuZ2VzU2hydW5rZW5CeSByZ3MsIDFcbiAgICAgICAgcmFuZ2VDb250YWluaW5nUmFuZ2VJblJhbmdlcyByLCByZ3NcblxuICAgIHJhbmdlT2ZTdHJpbmdTdXJyb3VuZGluZ1JhbmdlOiAocikgLT5cblxuICAgICAgICBpZiBpciA9IEByYW5nZU9mSW5uZXJTdHJpbmdTdXJyb3VuZGluZ1JhbmdlIHJcbiAgICAgICAgICAgIHJhbmdlR3Jvd25CeSBpciwgMVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBkaXN0YW5jZU9mV29yZDogKHcsIHBvcz1AY3Vyc29yUG9zKCkpIC0+XG5cbiAgICAgICAgcmV0dXJuIDAgaWYgQGxpbmUocG9zWzFdKS5pbmRleE9mKHcpID49IDBcbiAgICAgICAgZCA9IDFcbiAgICAgICAgbGIgPSBwb3NbMV0tZFxuICAgICAgICBsYSA9IHBvc1sxXStkXG4gICAgICAgIHdoaWxlIGxiID49IDAgb3IgbGEgPCBAbnVtTGluZXMoKVxuICAgICAgICAgICAgaWYgbGIgPj0gMFxuICAgICAgICAgICAgICAgIGlmIEBsaW5lKGxiKS5pbmRleE9mKHcpID49IDAgdGhlbiByZXR1cm4gZFxuICAgICAgICAgICAgaWYgbGEgPCBAbnVtTGluZXMoKVxuICAgICAgICAgICAgICAgIGlmIEBsaW5lKGxhKS5pbmRleE9mKHcpID49IDAgdGhlbiByZXR1cm4gZFxuICAgICAgICAgICAgZCsrXG4gICAgICAgICAgICBsYiA9IHBvc1sxXS1kXG4gICAgICAgICAgICBsYSA9IHBvc1sxXStkXG5cbiAgICAgICAgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHJhbmdlc0ZvckN1cnNvckxpbmVzOiAoY3M9QGN1cnNvcnMoKSkgLT4gKEByYW5nZUZvckxpbmVBdEluZGV4IGNbMV0gZm9yIGMgaW4gY3MpXG4gICAgcmFuZ2VzRm9yQWxsTGluZXM6IC0+IEByYW5nZXNGb3JMaW5lc0Zyb21Ub3BUb0JvdCAwLCBAbnVtTGluZXMoKVxuXG4gICAgcmFuZ2VzRm9yTGluZXNCZXR3ZWVuUG9zaXRpb25zOiAoYSwgYiwgZXh0ZW5kPWZhbHNlKSAtPlxuICAgICAgICByID0gW11cbiAgICAgICAgW2EsYl0gPSBzb3J0UG9zaXRpb25zIFthLGJdXG4gICAgICAgIGlmIGFbMV0gPT0gYlsxXVxuICAgICAgICAgICAgci5wdXNoIFthWzFdLCBbYVswXSwgYlswXV1dXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHIucHVzaCBbYVsxXSwgW2FbMF0sIEBsaW5lKGFbMV0pLmxlbmd0aF1dXG4gICAgICAgICAgICBpZiBiWzFdIC0gYVsxXSA+IDFcbiAgICAgICAgICAgICAgICBmb3IgaSBpbiBbYVsxXSsxLi4uYlsxXV1cbiAgICAgICAgICAgICAgICAgICAgci5wdXNoIFtpLCBbMCxAbGluZShpKS5sZW5ndGhdXVxuICAgICAgICAgICAgci5wdXNoIFtiWzFdLCBbMCwgZXh0ZW5kIGFuZCBiWzBdID09IDAgYW5kIEBsaW5lKGJbMV0pLmxlbmd0aCBvciBiWzBdXV1cbiAgICAgICAgclxuXG4gICAgcmFuZ2VzRm9yTGluZXNGcm9tVG9wVG9Cb3Q6ICh0b3AsYm90KSAtPlxuICAgICAgICByID0gW11cbiAgICAgICAgaXIgPSBbdG9wLGJvdF1cbiAgICAgICAgZm9yIGxpIGluIFtzdGFydE9mKGlyKS4uLmVuZE9mKGlyKV1cbiAgICAgICAgICAgIHIucHVzaCBAcmFuZ2VGb3JMaW5lQXRJbmRleCBsaVxuICAgICAgICByXG5cbiAgICByYW5nZXNGb3JUZXh0OiAodCwgb3B0KSAtPlxuICAgICAgICB0ID0gdC5zcGxpdCgnXFxuJylbMF1cbiAgICAgICAgciA9IFtdXG4gICAgICAgIGZvciBsaSBpbiBbMC4uLkBudW1MaW5lcygpXVxuICAgICAgICAgICAgciA9IHIuY29uY2F0IEByYW5nZXNGb3JUZXh0SW5MaW5lQXRJbmRleCB0LCBsaSwgb3B0XG4gICAgICAgICAgICBicmVhayBpZiByLmxlbmd0aCA+PSAob3B0Py5tYXggPyA5OTkpXG4gICAgICAgIHJcblxuICAgIHJhbmdlc0ZvclRleHRJbkxpbmVBdEluZGV4OiAodCwgaSwgb3B0KSAtPlxuICAgICAgICByID0gW11cbiAgICAgICAgdHlwZSA9IG9wdD8udHlwZSA/ICdzdHInXG4gICAgICAgIHN3aXRjaCB0eXBlXG4gICAgICAgICAgICB3aGVuICdmdXp6eSdcbiAgICAgICAgICAgICAgICByZSA9IG5ldyBSZWdFeHAgXCJcXFxcdytcIiAnZydcbiAgICAgICAgICAgICAgICB3aGlsZSAobXRjaCA9IHJlLmV4ZWMoQGxpbmUoaSkpKSAhPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIHIucHVzaCBbaSwgW210Y2guaW5kZXgsIHJlLmxhc3RJbmRleF1dIGlmIGZ1enp5LnRlc3QgdCwgQGxpbmUoaSkuc2xpY2UgbXRjaC5pbmRleCwgcmUubGFzdEluZGV4XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdCA9IF8uZXNjYXBlUmVnRXhwIHQgaWYgdHlwZSBpbiBbJ3N0cicgJ1N0cicgJ2dsb2InXVxuICAgICAgICAgICAgICAgIGlmIHR5cGUgaXMgJ2dsb2InXG4gICAgICAgICAgICAgICAgICAgIHQgPSB0LnJlcGxhY2UgbmV3IFJlZ0V4cChcIlxcXFwqXCIgJ2cnKSwgXCJcXHcqXCJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIgaWYgbm90IHQubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICBybmdzID0gbWF0Y2hyLnJhbmdlcyB0LCBAbGluZShpKSwgdHlwZSBpbiBbJ3N0cicgJ3JlZycgJ2dsb2InXSBhbmQgJ2knIG9yICcnXG4gICAgICAgICAgICAgICAgZm9yIHJuZyBpbiBybmdzXG4gICAgICAgICAgICAgICAgICAgIHIucHVzaCBbaSwgW3JuZy5zdGFydCwgcm5nLnN0YXJ0ICsgcm5nLm1hdGNoLmxlbmd0aF1dXG4gICAgICAgIHJcblxuICAgIHJhbmdlc09mU3RyaW5nc0luTGluZUF0SW5kZXg6IChsaSkgLT4gIyB0b2RvOiBoYW5kbGUgI3t9XG4gICAgICAgIHQgPSBAbGluZShsaSlcbiAgICAgICAgciA9IFtdXG4gICAgICAgIHNzID0gLTFcbiAgICAgICAgY2MgPSBudWxsXG4gICAgICAgIGZvciBpIGluIFswLi4udC5sZW5ndGhdXG4gICAgICAgICAgICBjID0gdFtpXVxuICAgICAgICAgICAgaWYgbm90IGNjIGFuZCBjIGluIFwiJ1xcXCJcIlxuICAgICAgICAgICAgICAgIGNjID0gY1xuICAgICAgICAgICAgICAgIHNzID0gaVxuICAgICAgICAgICAgZWxzZSBpZiBjID09IGNjXG4gICAgICAgICAgICAgICAgaWYgKHRbaS0xXSAhPSAnXFxcXCcpIG9yIChpPjIgYW5kIHRbaS0yXSA9PSAnXFxcXCcpXG4gICAgICAgICAgICAgICAgICAgIHIucHVzaCBbbGksIFtzcywgaSsxXV1cbiAgICAgICAgICAgICAgICAgICAgY2MgPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIHNzID0gLTFcbiAgICAgICAgclxuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1ZmZlclxuIl19
//# sourceURL=../../coffee/editor/buffer.coffee