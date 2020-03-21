// koffee 1.12.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImJ1ZmZlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsdUZBQUE7SUFBQTs7Ozs7QUFRQSxNQUE0QyxPQUFBLENBQVEsS0FBUixDQUE1QyxFQUFFLG1CQUFGLEVBQVUsaUJBQVYsRUFBaUIsaUJBQWpCLEVBQXdCLGVBQXhCLEVBQThCLG1CQUE5QixFQUFzQzs7QUFFdEMsS0FBQSxHQUFVLE9BQUEsQ0FBUSxTQUFSOztBQUNWLEtBQUEsR0FBVSxPQUFBLENBQVEsT0FBUjs7QUFDVixLQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBRVYsT0FBQSxHQUFVLFNBQUMsQ0FBRDtXQUFPLENBQUUsQ0FBQSxDQUFBO0FBQVQ7O0FBQ1YsS0FBQSxHQUFVLFNBQUMsQ0FBRDtXQUFPLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTyxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBRSxDQUFBLENBQUEsQ0FBbkI7QUFBZDs7QUFFSjs7O0lBRUMsZ0JBQUE7Ozs7OztRQUNDLHNDQUFBO1FBQ0EsSUFBQyxDQUFBLGlCQUFELEdBQXFCO1FBQ3JCLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBSSxNQUFKLENBQVcsb0JBQVgsRUFBZ0MsR0FBaEM7UUFDZCxJQUFDLENBQUEsY0FBRCxHQUFrQixJQUFJLE1BQUosQ0FBVyxRQUFYLEVBQW9CLEdBQXBCO1FBQ2xCLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBSSxLQUFKLENBQUEsQ0FBVjtJQUxEOztxQkFPSCxRQUFBLEdBQVUsU0FBQyxLQUFEO1FBQ04sSUFBQyxDQUFBLElBQUQsQ0FBTSxVQUFOLEVBQWlCLENBQWpCO1FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFJLEtBQUosQ0FBVTtZQUFBLEtBQUEsRUFBTSxLQUFOO1NBQVYs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QSxDQUFBLE1BQWQ7Z0JBQ0ksRUFBQSxHQUFLO2dCQUNMLEVBQUEsR0FBSyxFQUZUO2FBQUEsTUFHSyxJQUFHLENBQUEsS0FBSyxFQUFSO2dCQUNELElBQUcsQ0FBQyxDQUFFLENBQUEsQ0FBQSxHQUFFLENBQUYsQ0FBRixLQUFVLElBQVgsQ0FBQSxJQUFvQixDQUFDLENBQUEsR0FBRSxDQUFGLElBQVEsQ0FBRSxDQUFBLENBQUEsR0FBRSxDQUFGLENBQUYsS0FBVSxJQUFuQixDQUF2QjtvQkFDSSxDQUFDLENBQUMsSUFBRixDQUFPLENBQUMsRUFBRCxFQUFLLENBQUMsRUFBRCxFQUFLLENBQUEsR0FBRSxDQUFQLENBQUwsQ0FBUDtvQkFDQSxFQUFBLEdBQUs7b0JBQ0wsRUFBQSxHQUFLLENBQUMsRUFIVjtpQkFEQzs7QUFMVDtlQVVBO0lBZjBCOzs7O0dBN1diOztBQThYckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IG1hdGNociwgZW1wdHksIGNsYW1wLCBrc3RyLCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3RhdGUgICA9IHJlcXVpcmUgJy4vc3RhdGUnXG5mdXp6eSAgID0gcmVxdWlyZSAnZnV6enknXG5ldmVudCAgID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5zdGFydE9mID0gKHIpIC0+IHJbMF1cbmVuZE9mICAgPSAocikgLT4gclswXSArIE1hdGgubWF4IDEsIHJbMV0tclswXVxuXG5jbGFzcyBCdWZmZXIgZXh0ZW5kcyBldmVudFxuXG4gICAgQDogLT5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAbmV3bGluZUNoYXJhY3RlcnMgPSAnXFxuJ1xuICAgICAgICBAd29yZFJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHMrfFxcXFx3K3xbXlxcXFxzXSlcIiAnZydcbiAgICAgICAgQHJlYWxXb3JkUmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxcdyspXCIgJ2cnXG4gICAgICAgIEBzZXRTdGF0ZSBuZXcgU3RhdGUoKVxuXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJyAwICMgZ2l2ZSBsaXN0ZW5lcnMgYSBjaGFuY2UgdG8gY2xlYXIgdGhlaXIgc3R1ZmZcbiAgICAgICAgQHNldFN0YXRlIG5ldyBTdGF0ZSBsaW5lczpsaW5lc1xuICAgICAgICBAZW1pdCAnbnVtTGluZXMnIEBudW1MaW5lcygpXG5cbiAgICBzZXRTdGF0ZTogKHN0YXRlKSAtPiBAc3RhdGUgPSBuZXcgU3RhdGUgc3RhdGUuc1xuXG4gICAgbWFpbkN1cnNvcjogICAgLT4gQHN0YXRlLm1haW5DdXJzb3IoKVxuICAgIGxpbmU6ICAgICAgKGkpID0+IEBzdGF0ZS5saW5lIGlcbiAgICBsYXN0TGluZTogICAgICAtPiBAbGluZSBAbnVtTGluZXMoKS0xXG4gICAgdGFibGluZTogICAoaSkgLT4gQHN0YXRlLnRhYmxpbmUgaVxuICAgIGN1cnNvcjogICAgKGkpIC0+IEBzdGF0ZS5jdXJzb3IgaVxuICAgIGhpZ2hsaWdodDogKGkpIC0+IEBzdGF0ZS5oaWdobGlnaHQgaVxuICAgIHNlbGVjdGlvbjogKGkpIC0+IEBzdGF0ZS5zZWxlY3Rpb24gaVxuXG4gICAgbGluZXM6ICAgICAgICAgPT4gQHN0YXRlLmxpbmVzKClcbiAgICBjdXJzb3JzOiAgICAgICAtPiBAc3RhdGUuY3Vyc29ycygpXG4gICAgaGlnaGxpZ2h0czogICAgLT4gQHN0YXRlLmhpZ2hsaWdodHMoKVxuICAgIHNlbGVjdGlvbnM6ICAgIC0+IEBzdGF0ZS5zZWxlY3Rpb25zKClcblxuICAgIG51bUxpbmVzOiAgICAgIC0+IEBzdGF0ZS5udW1MaW5lcygpXG4gICAgbnVtQ3Vyc29yczogICAgLT4gQHN0YXRlLm51bUN1cnNvcnMoKVxuICAgIG51bVNlbGVjdGlvbnM6IC0+IEBzdGF0ZS5udW1TZWxlY3Rpb25zKClcbiAgICBudW1IaWdobGlnaHRzOiAtPiBAc3RhdGUubnVtSGlnaGxpZ2h0cygpXG4gICAgXG4gICAgIyB0aGVzZSBhcmUgdXNlZCBmcm9tIHRlc3RzIGFuZCByZXN0b3JlXG4gICAgc2V0Q3Vyc29yczogICAgKGMpIC0+IEBzdGF0ZSA9IEBzdGF0ZS5zZXRDdXJzb3JzICAgIGNcbiAgICBzZXRTZWxlY3Rpb25zOiAocykgLT4gQHN0YXRlID0gQHN0YXRlLnNldFNlbGVjdGlvbnMgc1xuICAgIHNldEhpZ2hsaWdodHM6IChoKSAtPiBAc3RhdGUgPSBAc3RhdGUuc2V0SGlnaGxpZ2h0cyBoXG4gICAgc2V0TWFpbjogICAgICAgKG0pIC0+IEBzdGF0ZSA9IEBzdGF0ZS5zZXRNYWluICAgICAgIG1cbiAgICBhZGRIaWdobGlnaHQ6ICAoaCkgLT4gQHN0YXRlID0gQHN0YXRlLmFkZEhpZ2hsaWdodCAgaFxuXG4gICAgc2VsZWN0OiAocykgLT5cblxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2VsZWN0IHNcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGlzQ3Vyc29yVmlydHVhbDogICAgICAgKGM9QG1haW5DdXJzb3IoKSkgLT4gQG51bUxpbmVzKCkgYW5kIGNbMV0gPCBAbnVtTGluZXMoKSBhbmQgY1swXSA+IEBsaW5lKGNbMV0pLmxlbmd0aFxuICAgIGlzQ3Vyc29yQXRFbmRPZkxpbmU6ICAgKGM9QG1haW5DdXJzb3IoKSkgLT4gQG51bUxpbmVzKCkgYW5kIGNbMV0gPCBAbnVtTGluZXMoKSBhbmQgY1swXSA+PSBAbGluZShjWzFdKS5sZW5ndGhcbiAgICBpc0N1cnNvckF0U3RhcnRPZkxpbmU6IChjPUBtYWluQ3Vyc29yKCkpIC0+IGNbMF0gPT0gMFxuICAgIGlzQ3Vyc29ySW5JbmRlbnQ6ICAgICAgKGM9QG1haW5DdXJzb3IoKSkgLT4gQG51bUxpbmVzKCkgYW5kIEBsaW5lKGNbMV0pLnNsaWNlKDAsIGNbMF0pLnRyaW0oKS5sZW5ndGggPT0gMCBhbmQgQGxpbmUoY1sxXSkuc2xpY2UoY1swXSkudHJpbSgpLmxlbmd0aFxuICAgIGlzQ3Vyc29ySW5MYXN0TGluZTogICAgKGM9QG1haW5DdXJzb3IoKSkgLT4gY1sxXSA9PSBAbnVtTGluZXMoKS0xXG4gICAgaXNDdXJzb3JJbkZpcnN0TGluZTogICAoYz1AbWFpbkN1cnNvcigpKSAtPiBjWzFdID09IDBcbiAgICBpc0N1cnNvckluUmFuZ2U6ICAgICAgIChyLGM9QG1haW5DdXJzb3IoKSkgLT4gaXNQb3NJblJhbmdlIGMsIHJcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgd29yZEF0Q3Vyc29yOiAtPiBAd29yZEF0UG9zIEBtYWluQ3Vyc29yKClcbiAgICB3b3JkQXRQb3M6IChjKSAtPiBAdGV4dEluUmFuZ2UgQHJhbmdlRm9yUmVhbFdvcmRBdFBvcyBjXG4gICAgd29yZHNBdEN1cnNvcnM6IChjcz1AY3Vyc29ycygpLCBvcHQpIC0+IChAdGV4dEluUmFuZ2UgciBmb3IgciBpbiBAcmFuZ2VzRm9yV29yZHNBdEN1cnNvcnMgY3MsIG9wdClcblxuICAgIHJhbmdlc0ZvcldvcmRzQXRDdXJzb3JzOiAoY3M9QGN1cnNvcnMoKSwgb3B0KSAtPlxuICAgICAgICBybmdzID0gKEByYW5nZUZvcldvcmRBdFBvcyhjLCBvcHQpIGZvciBjIGluIGNzKVxuICAgICAgICBybmdzID0gY2xlYW5SYW5nZXMgcm5nc1xuXG4gICAgc2VsZWN0aW9uVGV4dE9yV29yZEF0Q3Vyc29yOiAoKSAtPlxuXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKCkgPT0gMVxuICAgICAgICAgICAgQHRleHRJblJhbmdlIEBzZWxlY3Rpb24gMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAd29yZEF0Q3Vyc29yKClcblxuICAgIHJhbmdlRm9yV29yZEF0UG9zOiAocG9zLCBvcHQpIC0+XG5cbiAgICAgICAgcCA9IEBjbGFtcFBvcyBwb3NcbiAgICAgICAgd3IgPSBAd29yZFJhbmdlc0luTGluZUF0SW5kZXggcFsxXSwgb3B0XG4gICAgICAgIHIgPSByYW5nZUF0UG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgclxuXG4gICAgcmFuZ2VGb3JSZWFsV29yZEF0UG9zOiAocG9zLCBvcHQpIC0+XG5cbiAgICAgICAgcCA9IEBjbGFtcFBvcyBwb3NcbiAgICAgICAgd3IgPSBAcmVhbFdvcmRSYW5nZXNJbkxpbmVBdEluZGV4IHBbMV0sIG9wdFxuXG4gICAgICAgIHIgPSByYW5nZUF0UG9zSW5SYW5nZXMgcCwgd3JcbiAgICAgICAgaWYgbm90IHI/IG9yIGVtcHR5IEB0ZXh0SW5SYW5nZShyKS50cmltKClcbiAgICAgICAgICAgIHIgPSByYW5nZUJlZm9yZVBvc0luUmFuZ2VzIHAsIHdyXG4gICAgICAgIGlmIG5vdCByPyBvciBlbXB0eSBAdGV4dEluUmFuZ2UocikudHJpbSgpXG4gICAgICAgICAgICByID0gcmFuZ2VBZnRlclBvc0luUmFuZ2VzIHAsIHdyXG4gICAgICAgIHIgPz0gcmFuZ2VGb3JQb3MgcFxuICAgICAgICByXG5cbiAgICBlbmRPZldvcmRBdFBvczogKGMpID0+XG5cbiAgICAgICAgciA9IEByYW5nZUZvcldvcmRBdFBvcyBjXG4gICAgICAgIGlmIEBpc0N1cnNvckF0RW5kT2ZMaW5lIGNcbiAgICAgICAgICAgIHJldHVybiBjIGlmIEBpc0N1cnNvckluTGFzdExpbmUgY1xuICAgICAgICAgICAgciA9IEByYW5nZUZvcldvcmRBdFBvcyBbMCwgY1sxXSsxXVxuICAgICAgICBbclsxXVsxXSwgclswXV1cblxuICAgIHN0YXJ0T2ZXb3JkQXRQb3M6IChjKSA9PlxuXG4gICAgICAgIGlmIEBpc0N1cnNvckF0U3RhcnRPZkxpbmUgY1xuICAgICAgICAgICAgcmV0dXJuIGMgaWYgQGlzQ3Vyc29ySW5GaXJzdExpbmUgY1xuICAgICAgICAgICAgciA9IEByYW5nZUZvcldvcmRBdFBvcyBbQGxpbmUoY1sxXS0xKS5sZW5ndGgsIGNbMV0tMV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgciA9IEByYW5nZUZvcldvcmRBdFBvcyBjXG4gICAgICAgICAgICBpZiByWzFdWzBdID09IGNbMF1cbiAgICAgICAgICAgICAgICByID0gQHJhbmdlRm9yV29yZEF0UG9zIFtjWzBdLTEsIGNbMV1dXG4gICAgICAgIFtyWzFdWzBdLCByWzBdXVxuXG4gICAgd29yZFJhbmdlc0luTGluZUF0SW5kZXg6IChsaSwgb3B0PXt9KSAtPlxuXG4gICAgICAgIG9wdC5yZWdFeHAgPz0gQHdvcmRSZWdFeHBcbiAgICAgICAgb3B0LnJlZ0V4cCA9IG5ldyBSZWdFeHAgXCIoXFxcXHMrfFtcXFxcdyN7b3B0LmluY2x1ZGV9XSt8W15cXFxcc10pXCIgJ2cnIGlmIG9wdD8uaW5jbHVkZT8ubGVuZ3RoXG4gICAgICAgIHIgPSBbXVxuICAgICAgICB3aGlsZSAobXRjaCA9IG9wdC5yZWdFeHAuZXhlYyhAbGluZShsaSkpKSAhPSBudWxsXG4gICAgICAgICAgICByLnB1c2ggW2xpLCBbbXRjaC5pbmRleCwgb3B0LnJlZ0V4cC5sYXN0SW5kZXhdXVxuICAgICAgICByLmxlbmd0aCBhbmQgciBvciBbW2xpLCBbMCwwXV1dXG5cbiAgICByZWFsV29yZFJhbmdlc0luTGluZUF0SW5kZXg6IChsaSwgb3B0PXt9KSAtPlxuXG4gICAgICAgIHIgPSBbXVxuICAgICAgICB3aGlsZSAobXRjaCA9IEByZWFsV29yZFJlZ0V4cC5leGVjKEBsaW5lKGxpKSkpICE9IG51bGxcbiAgICAgICAgICAgIHIucHVzaCBbbGksIFttdGNoLmluZGV4LCBAcmVhbFdvcmRSZWdFeHAubGFzdEluZGV4XV1cbiAgICAgICAgci5sZW5ndGggYW5kIHIgb3IgW1tsaSwgWzAsMF1dXVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG5cbiAgICBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXg6IChsaW5lSW5kZXhSYW5nZSwgcmVsSW5kZXgpIC0+XG5cbiAgICAgICAgaGwgPSBAaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2UgbGluZUluZGV4UmFuZ2VcbiAgICAgICAgaWYgaGxcbiAgICAgICAgICAgIChbc1swXS1yZWxJbmRleCwgW3NbMV1bMF0sIHNbMV1bMV1dLCBzWzJdXSBmb3IgcyBpbiBobClcblxuICAgIGhpZ2hsaWdodHNJbkxpbmVJbmRleFJhbmdlOiAobGluZUluZGV4UmFuZ2UpIC0+XG5cbiAgICAgICAgQGhpZ2hsaWdodHMoKS5maWx0ZXIgKHMpIC0+IHNbMF0gPj0gbGluZUluZGV4UmFuZ2VbMF0gYW5kIHNbMF0gPD0gbGluZUluZGV4UmFuZ2VbMV1cblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGlzQW5zaUxpbmU6IChsaSkgPT4gXG4gICAgICAgIGlmIGxpbmUgPSBAbGluZSBsaVxuICAgICAgICAgICAgbGluZSAhPSBrc3RyLnN0cmlwQW5zaSBsaW5lXG4gICAgXG4gICAgc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4OiAobGluZUluZGV4UmFuZ2UsIHJlbEluZGV4KSAtPlxuXG4gICAgICAgIHNsID0gQHNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlIGxpbmVJbmRleFJhbmdlXG4gICAgICAgIGlmIHNsXG4gICAgICAgICAgICAoW3NbMF0tcmVsSW5kZXgsIFtzWzFdWzBdLCBzWzFdWzFdXV0gZm9yIHMgaW4gc2wpXG5cbiAgICBzZWxlY3Rpb25zSW5MaW5lSW5kZXhSYW5nZTogKGxpbmVJbmRleFJhbmdlKSAtPlxuXG4gICAgICAgIEBzZWxlY3Rpb25zKCkuZmlsdGVyIChzKSAtPiBzWzBdID49IGxpbmVJbmRleFJhbmdlWzBdIGFuZCBzWzBdIDw9IGxpbmVJbmRleFJhbmdlWzFdXG5cbiAgICBzZWxlY3RlZExpbmVJbmRpY2VzOiAtPiBfLnVuaXEgKHNbMF0gZm9yIHMgaW4gQHNlbGVjdGlvbnMoKSlcbiAgICBjdXJzb3JMaW5lSW5kaWNlczogICAtPiBfLnVuaXEgKGNbMV0gZm9yIGMgaW4gQGN1cnNvcnMoKSlcblxuICAgIHNlbGVjdGVkQW5kQ3Vyc29yTGluZUluZGljZXM6IC0+XG5cbiAgICAgICAgXy51bmlxIEBzZWxlY3RlZExpbmVJbmRpY2VzKCkuY29uY2F0IEBjdXJzb3JMaW5lSW5kaWNlcygpXG5cbiAgICBjb250aW51b3VzQ3Vyc29yQW5kU2VsZWN0ZWRMaW5lSW5kZXhSYW5nZXM6IC0+XG5cbiAgICAgICAgaWwgPSBAc2VsZWN0ZWRBbmRDdXJzb3JMaW5lSW5kaWNlcygpXG4gICAgICAgIGNzciA9IFtdXG4gICAgICAgIGlmIGlsLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGxpIGluIGlsXG4gICAgICAgICAgICAgICAgaWYgY3NyLmxlbmd0aCBhbmQgXy5sYXN0KGNzcilbMV0gPT0gbGktMVxuICAgICAgICAgICAgICAgICAgICBfLmxhc3QoY3NyKVsxXSA9IGxpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjc3IucHVzaCBbbGksbGldXG4gICAgICAgIGNzclxuXG4gICAgaXNTZWxlY3RlZExpbmVBdEluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgaWwgPSBAc2VsZWN0ZWRMaW5lSW5kaWNlcygpXG4gICAgICAgIGlmIGxpIGluIGlsXG4gICAgICAgICAgICBzID0gQHNlbGVjdGlvbihpbC5pbmRleE9mIGxpKVxuICAgICAgICAgICAgaWYgc1sxXVswXSA9PSAwIGFuZCBzWzFdWzFdID09IEBsaW5lKGxpKS5sZW5ndGhcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBmYWxzZVxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHRleHQ6ICAgICAgICAgICAgICAgIC0+IEBzdGF0ZS50ZXh0IEBuZXdsaW5lQ2hhcmFjdGVyc1xuICAgIHRleHRJblJhbmdlOiAgIChyZykgIC0+IEBsaW5lKHJnWzBdKS5zbGljZT8gcmdbMV1bMF0sIHJnWzFdWzFdXG4gICAgdGV4dHNJblJhbmdlczogKHJncykgLT4gKEB0ZXh0SW5SYW5nZShyKSBmb3IgciBpbiByZ3MpXG4gICAgdGV4dEluUmFuZ2VzOiAgKHJncykgLT4gQHRleHRzSW5SYW5nZXMocmdzKS5qb2luICdcXG4nXG4gICAgdGV4dE9mU2VsZWN0aW9uOiAgICAgLT4gQHRleHRJblJhbmdlcyBAc2VsZWN0aW9ucygpXG4gICAgdGV4dE9mSGlnaGxpZ2h0OiAgICAgLT4gQG51bUhpZ2hsaWdodHMoKSBhbmQgQHRleHRJblJhbmdlKEBoaWdobGlnaHQgMCkgb3IgJydcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIGluZGVudGF0aW9uQXRMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICByZXR1cm4gMCBpZiBsaSA+PSBAbnVtTGluZXMoKVxuICAgICAgICBsaW5lID0gQGxpbmUgbGlcbiAgICAgICAgd2hpbGUgZW1wdHkobGluZS50cmltKCkpIGFuZCBsaSA+IDBcbiAgICAgICAgICAgIGxpLS1cbiAgICAgICAgICAgIGxpbmUgPSBAbGluZSBsaVxuICAgICAgICBpbmRlbnRhdGlvbkluTGluZSBsaW5lXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIGxhc3RQb3M6IC0+XG5cbiAgICAgICAgbGxpID0gQG51bUxpbmVzKCktMVxuICAgICAgICBbQGxpbmUobGxpKS5sZW5ndGgsIGxsaV1cblxuICAgIGN1cnNvclBvczogLT4gQGNsYW1wUG9zIEBtYWluQ3Vyc29yKClcblxuICAgIGNsYW1wUG9zOiAocCkgLT5cblxuICAgICAgICBpZiBub3QgQG51bUxpbmVzKCkgdGhlbiByZXR1cm4gWzAsLTFdXG4gICAgICAgIGwgPSBjbGFtcCAwLCBAbnVtTGluZXMoKS0xLCAgcFsxXVxuICAgICAgICBjID0gY2xhbXAgMCwgQGxpbmUobCkubGVuZ3RoLCBwWzBdXG4gICAgICAgIFsgYywgbCBdXG5cbiAgICB3b3JkU3RhcnRQb3NBZnRlclBvczogKHA9QGN1cnNvclBvcygpKSAtPlxuXG4gICAgICAgIHJldHVybiBwIGlmIHBbMF0gPCBAbGluZShwWzFdKS5sZW5ndGggYW5kIEBsaW5lKHBbMV0pW3BbMF1dICE9ICcgJ1xuXG4gICAgICAgIHdoaWxlIHBbMF0gPCBAbGluZShwWzFdKS5sZW5ndGgtMVxuICAgICAgICAgICAgcmV0dXJuIFtwWzBdKzEsIHBbMV1dIGlmIEBsaW5lKHBbMV0pW3BbMF0rMV0gIT0gJyAnXG4gICAgICAgICAgICBwWzBdICs9IDFcblxuICAgICAgICBpZiBwWzFdIDwgQG51bUxpbmVzKCktMVxuICAgICAgICAgICAgQHdvcmRTdGFydFBvc0FmdGVyUG9zIFswLCBwWzFdKzFdXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG51bGxcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIHJhbmdlRm9yTGluZUF0SW5kZXg6IChpKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJCdWZmZXIucmFuZ2VGb3JMaW5lQXRJbmRleCAtLSBpbmRleCAje2l9ID49ICN7QG51bUxpbmVzKCl9XCIgaWYgaSA+PSBAbnVtTGluZXMoKVxuICAgICAgICBbaSwgWzAsIEBsaW5lKGkpLmxlbmd0aF1dXG5cbiAgICBpc1JhbmdlSW5TdHJpbmc6IChyKSAtPiBAcmFuZ2VPZlN0cmluZ1N1cnJvdW5kaW5nUmFuZ2Uocik/XG5cbiAgICByYW5nZU9mSW5uZXJTdHJpbmdTdXJyb3VuZGluZ1JhbmdlOiAocikgLT5cblxuICAgICAgICByZ3MgPSBAcmFuZ2VzT2ZTdHJpbmdzSW5MaW5lQXRJbmRleCByWzBdXG4gICAgICAgIHJncyA9IHJhbmdlc1NocnVua2VuQnkgcmdzLCAxXG4gICAgICAgIHJhbmdlQ29udGFpbmluZ1JhbmdlSW5SYW5nZXMgciwgcmdzXG5cbiAgICByYW5nZU9mU3RyaW5nU3Vycm91bmRpbmdSYW5nZTogKHIpIC0+XG5cbiAgICAgICAgaWYgaXIgPSBAcmFuZ2VPZklubmVyU3RyaW5nU3Vycm91bmRpbmdSYW5nZSByXG4gICAgICAgICAgICByYW5nZUdyb3duQnkgaXIsIDFcblxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgZGlzdGFuY2VPZldvcmQ6ICh3LCBwb3M9QGN1cnNvclBvcygpKSAtPlxuXG4gICAgICAgIHJldHVybiAwIGlmIEBsaW5lKHBvc1sxXSkuaW5kZXhPZih3KSA+PSAwXG4gICAgICAgIGQgPSAxXG4gICAgICAgIGxiID0gcG9zWzFdLWRcbiAgICAgICAgbGEgPSBwb3NbMV0rZFxuICAgICAgICB3aGlsZSBsYiA+PSAwIG9yIGxhIDwgQG51bUxpbmVzKClcbiAgICAgICAgICAgIGlmIGxiID49IDBcbiAgICAgICAgICAgICAgICBpZiBAbGluZShsYikuaW5kZXhPZih3KSA+PSAwIHRoZW4gcmV0dXJuIGRcbiAgICAgICAgICAgIGlmIGxhIDwgQG51bUxpbmVzKClcbiAgICAgICAgICAgICAgICBpZiBAbGluZShsYSkuaW5kZXhPZih3KSA+PSAwIHRoZW4gcmV0dXJuIGRcbiAgICAgICAgICAgIGQrK1xuICAgICAgICAgICAgbGIgPSBwb3NbMV0tZFxuICAgICAgICAgICAgbGEgPSBwb3NbMV0rZFxuXG4gICAgICAgIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICByYW5nZXNGb3JDdXJzb3JMaW5lczogKGNzPUBjdXJzb3JzKCkpIC0+IChAcmFuZ2VGb3JMaW5lQXRJbmRleCBjWzFdIGZvciBjIGluIGNzKVxuICAgIHJhbmdlc0ZvckFsbExpbmVzOiAtPiBAcmFuZ2VzRm9yTGluZXNGcm9tVG9wVG9Cb3QgMCwgQG51bUxpbmVzKClcblxuICAgIHJhbmdlc0ZvckxpbmVzQmV0d2VlblBvc2l0aW9uczogKGEsIGIsIGV4dGVuZD1mYWxzZSkgLT5cbiAgICAgICAgciA9IFtdXG4gICAgICAgIFthLGJdID0gc29ydFBvc2l0aW9ucyBbYSxiXVxuICAgICAgICBpZiBhWzFdID09IGJbMV1cbiAgICAgICAgICAgIHIucHVzaCBbYVsxXSwgW2FbMF0sIGJbMF1dXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByLnB1c2ggW2FbMV0sIFthWzBdLCBAbGluZShhWzFdKS5sZW5ndGhdXVxuICAgICAgICAgICAgaWYgYlsxXSAtIGFbMV0gPiAxXG4gICAgICAgICAgICAgICAgZm9yIGkgaW4gW2FbMV0rMS4uLmJbMV1dXG4gICAgICAgICAgICAgICAgICAgIHIucHVzaCBbaSwgWzAsQGxpbmUoaSkubGVuZ3RoXV1cbiAgICAgICAgICAgIHIucHVzaCBbYlsxXSwgWzAsIGV4dGVuZCBhbmQgYlswXSA9PSAwIGFuZCBAbGluZShiWzFdKS5sZW5ndGggb3IgYlswXV1dXG4gICAgICAgIHJcblxuICAgIHJhbmdlc0ZvckxpbmVzRnJvbVRvcFRvQm90OiAodG9wLGJvdCkgLT5cbiAgICAgICAgciA9IFtdXG4gICAgICAgIGlyID0gW3RvcCxib3RdXG4gICAgICAgIGZvciBsaSBpbiBbc3RhcnRPZihpcikuLi5lbmRPZihpcildXG4gICAgICAgICAgICByLnB1c2ggQHJhbmdlRm9yTGluZUF0SW5kZXggbGlcbiAgICAgICAgclxuXG4gICAgcmFuZ2VzRm9yVGV4dDogKHQsIG9wdCkgLT5cbiAgICAgICAgdCA9IHQuc3BsaXQoJ1xcbicpWzBdXG4gICAgICAgIHIgPSBbXVxuICAgICAgICBmb3IgbGkgaW4gWzAuLi5AbnVtTGluZXMoKV1cbiAgICAgICAgICAgIHIgPSByLmNvbmNhdCBAcmFuZ2VzRm9yVGV4dEluTGluZUF0SW5kZXggdCwgbGksIG9wdFxuICAgICAgICAgICAgYnJlYWsgaWYgci5sZW5ndGggPj0gKG9wdD8ubWF4ID8gOTk5KVxuICAgICAgICByXG5cbiAgICByYW5nZXNGb3JUZXh0SW5MaW5lQXRJbmRleDogKHQsIGksIG9wdCkgLT5cbiAgICAgICAgciA9IFtdXG4gICAgICAgIHR5cGUgPSBvcHQ/LnR5cGUgPyAnc3RyJ1xuICAgICAgICBzd2l0Y2ggdHlwZVxuICAgICAgICAgICAgd2hlbiAnZnV6enknXG4gICAgICAgICAgICAgICAgcmUgPSBuZXcgUmVnRXhwIFwiXFxcXHcrXCIgJ2cnXG4gICAgICAgICAgICAgICAgd2hpbGUgKG10Y2ggPSByZS5leGVjKEBsaW5lKGkpKSkgIT0gbnVsbFxuICAgICAgICAgICAgICAgICAgICByLnB1c2ggW2ksIFttdGNoLmluZGV4LCByZS5sYXN0SW5kZXhdXSBpZiBmdXp6eS50ZXN0IHQsIEBsaW5lKGkpLnNsaWNlIG10Y2guaW5kZXgsIHJlLmxhc3RJbmRleFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHQgPSBfLmVzY2FwZVJlZ0V4cCB0IGlmIHR5cGUgaW4gWydzdHInICdTdHInICdnbG9iJ11cbiAgICAgICAgICAgICAgICBpZiB0eXBlIGlzICdnbG9iJ1xuICAgICAgICAgICAgICAgICAgICB0ID0gdC5yZXBsYWNlIG5ldyBSZWdFeHAoXCJcXFxcKlwiICdnJyksIFwiXFx3KlwiXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByIGlmIG5vdCB0Lmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgcm5ncyA9IG1hdGNoci5yYW5nZXMgdCwgQGxpbmUoaSksIHR5cGUgaW4gWydzdHInICdyZWcnICdnbG9iJ10gYW5kICdpJyBvciAnJ1xuICAgICAgICAgICAgICAgIGZvciBybmcgaW4gcm5nc1xuICAgICAgICAgICAgICAgICAgICByLnB1c2ggW2ksIFtybmcuc3RhcnQsIHJuZy5zdGFydCArIHJuZy5tYXRjaC5sZW5ndGhdXVxuICAgICAgICByXG5cbiAgICByYW5nZXNPZlN0cmluZ3NJbkxpbmVBdEluZGV4OiAobGkpIC0+ICMgdG9kbzogaGFuZGxlICN7fVxuICAgICAgICB0ID0gQGxpbmUobGkpXG4gICAgICAgIHIgPSBbXVxuICAgICAgICBzcyA9IC0xXG4gICAgICAgIGNjID0gbnVsbFxuICAgICAgICBmb3IgaSBpbiBbMC4uLnQubGVuZ3RoXVxuICAgICAgICAgICAgYyA9IHRbaV1cbiAgICAgICAgICAgIGlmIG5vdCBjYyBhbmQgYyBpbiBcIidcXFwiXCJcbiAgICAgICAgICAgICAgICBjYyA9IGNcbiAgICAgICAgICAgICAgICBzcyA9IGlcbiAgICAgICAgICAgIGVsc2UgaWYgYyA9PSBjY1xuICAgICAgICAgICAgICAgIGlmICh0W2ktMV0gIT0gJ1xcXFwnKSBvciAoaT4yIGFuZCB0W2ktMl0gPT0gJ1xcXFwnKVxuICAgICAgICAgICAgICAgICAgICByLnB1c2ggW2xpLCBbc3MsIGkrMV1dXG4gICAgICAgICAgICAgICAgICAgIGNjID0gbnVsbFxuICAgICAgICAgICAgICAgICAgICBzcyA9IC0xXG4gICAgICAgIHJcblxubW9kdWxlLmV4cG9ydHMgPSBCdWZmZXJcbiJdfQ==
//# sourceURL=../../coffee/editor/buffer.coffee