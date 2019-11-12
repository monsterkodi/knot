// koffee 1.4.0

/*
00     00  00000000  000000000   0000000
000   000  000          000     000   000
000000000  0000000      000     000000000
000 0 000  000          000     000   000
000   000  00000000     000     000   000
 */
var $, File, Meta, _, elem, empty, kerror, kpos, ranges, ref, sw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), empty = ref.empty, elem = ref.elem, kpos = ref.kpos, sw = ref.sw, kerror = ref.kerror, $ = ref.$, _ = ref._;

ranges = require('../tools/ranges');

File = require('../tools/file');

Meta = (function() {
    function Meta(editor) {
        this.editor = editor;
        this.clear = bind(this.clear, this);
        this.onClearLines = bind(this.onClearLines, this);
        this.onLineDeleted = bind(this.onLineDeleted, this);
        this.onLineInserted = bind(this.onLineInserted, this);
        this.onLinesShifted = bind(this.onLinesShifted, this);
        this.onLinesShown = bind(this.onLinesShown, this);
        this.onLineAppended = bind(this.onLineAppended, this);
        this.metas = [];
        this.lineMetas = {};
        this.elem = $(".meta", this.editor.view);
        this.editor.on('lineAppended', this.onLineAppended);
        this.editor.on('clearLines', this.onClearLines);
        this.editor.on('lineInserted', this.onLineInserted);
        this.editor.on('lineDeleted', this.onLineDeleted);
        this.editor.on('linesShown', this.onLinesShown);
        this.editor.on('linesShifted', this.onLinesShifted);
        this.elem.addEventListener('mousedown', this.onMouseDown);
        this.elem.addEventListener('mouseup', this.onMouseUp);
    }

    Meta.prototype.setMetaPos = function(meta, tx, ty) {
        var ref1, ref2;
        if (meta[2].no_x) {
            return (ref1 = meta[2].div) != null ? ref1.style.transform = "translateY(" + ty + "px)" : void 0;
        } else {
            return (ref2 = meta[2].div) != null ? ref2.style.transform = "translate(" + tx + "px," + ty + "px)" : void 0;
        }
    };

    Meta.prototype.updatePos = function(meta) {
        var ref1, ref2, size, tx, ty;
        size = this.editor.size;
        tx = size.charWidth * meta[1][0] + size.offsetX + ((ref1 = meta[2].xOffset) != null ? ref1 : 0);
        ty = size.lineHeight * (meta[0] - this.editor.scroll.top) + ((ref2 = meta[2].yOffset) != null ? ref2 : 0);
        return this.setMetaPos(meta, tx, ty);
    };

    Meta.prototype.addDiv = function(meta) {
        var div, k, lh, ref1, ref2, size, v;
        size = this.editor.size;
        sw = size.charWidth * (meta[1][1] - meta[1][0]);
        lh = size.lineHeight;
        div = elem({
            "class": "meta " + ((ref1 = meta[2].clss) != null ? ref1 : '')
        });
        if (meta[2].html != null) {
            div.innerHTML = meta[2].html;
        }
        meta[2].div = div;
        div.meta = meta;
        if (!meta[2].no_h) {
            div.style.height = lh + "px";
        }
        if (meta[2].style != null) {
            ref2 = meta[2].style;
            for (k in ref2) {
                v = ref2[k];
                div.style[k] = v;
            }
        }
        if (!meta[2].no_x) {
            div.style.width = sw + "px";
        } else {
            div.style.width = this.editor.size.numbersWidth + "px";
        }
        this.elem.appendChild(div);
        return this.updatePos(meta);
    };

    Meta.prototype.delDiv = function(meta) {
        var ref1;
        if ((meta != null ? meta[2] : void 0) == null) {
            return kerror('no line meta?', meta);
        }
        if ((ref1 = meta[2].div) != null) {
            ref1.remove();
        }
        return meta[2].div = null;
    };

    Meta.prototype.add = function(meta) {
        var lineMeta, ref1, ref2, ref3;
        lineMeta = this.addLineMeta([meta.line, [(ref1 = meta.start) != null ? ref1 : 0, (ref2 = meta.end) != null ? ref2 : 0], meta]);
        if ((this.editor.scroll.top <= (ref3 = meta.line) && ref3 <= this.editor.scroll.bot)) {
            this.addDiv(lineMeta);
            this.editor.numbers.updateMeta(meta.line);
        }
        return lineMeta;
    };

    Meta.prototype.update = function(meta) {
        var line;
        if (!meta[2].no_x) {
            line = this.editor.line(meta[0]);
            meta[1][1] = meta[1][0] + line.length + 1;
            meta[2].end = meta[1][1];
        }
        return this.editor.numbers.updateColor(meta[0]);
    };

    Meta.prototype.onMouseDown = function(event) {
        return this.downPos = kpos(event);
    };

    Meta.prototype.onMouseUp = function(event) {
        var ref1, ref2, ref3, result;
        if (5 < ((ref1 = this.downPos) != null ? ref1.dist(kpos(event)) : void 0)) {
            delete this.downPos;
            return;
        }
        delete this.downPos;
        if (((ref2 = event.target.meta) != null ? ref2[2].click : void 0) != null) {
            return result = (ref3 = event.target.meta) != null ? ref3[2].click(event.target.meta, event) : void 0;
        }
    };

    Meta.prototype.append = function(meta) {
        var lineMeta;
        lineMeta = this.addLineMeta([this.editor.numLines(), [0, 0], meta]);
        return lineMeta;
    };

    Meta.prototype.addLineMeta = function(lineMeta) {
        var base, name;
        if ((lineMeta != null ? lineMeta[2] : void 0) == null) {
            return kerror('invalid line meta?', lineMeta);
        }
        if ((base = this.lineMetas)[name = lineMeta[0]] != null) {
            base[name];
        } else {
            base[name] = [];
        }
        this.lineMetas[lineMeta[0]].push(lineMeta);
        this.metas.push(lineMeta);
        return lineMeta;
    };

    Meta.prototype.moveLineMeta = function(lineMeta, d) {
        var base, name;
        if ((lineMeta == null) || d === 0) {
            return kerror('invalid move?', lineMeta, d);
        }
        _.pull(this.lineMetas[lineMeta[0]], lineMeta);
        if (empty(this.lineMetas[lineMeta[0]])) {
            delete this.lineMetas[lineMeta[0]];
        }
        lineMeta[0] += d;
        if ((base = this.lineMetas)[name = lineMeta[0]] != null) {
            base[name];
        } else {
            base[name] = [];
        }
        this.lineMetas[lineMeta[0]].push(lineMeta);
        this.updatePos(lineMeta);
        return this.editor.numbers.updateColor(lineMeta[0]);
    };

    Meta.prototype.onLineAppended = function(e) {
        var i, len, meta, ref1, results;
        ref1 = this.metasAtLineIndex(e.lineIndex);
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            if (meta[1][1] === 0) {
                results.push(meta[1][1] = e.text.length);
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Meta.prototype.metasAtLineIndex = function(li) {
        var ref1;
        return (ref1 = this.lineMetas[li]) != null ? ref1 : [];
    };

    Meta.prototype.metaAtLineIndex = function(li) {
        var ref1;
        return (ref1 = this.lineMetas[li]) != null ? ref1[0] : void 0;
    };

    Meta.prototype.hrefAtLineIndex = function(li) {
        var i, len, meta, ref1;
        ref1 = this.metasAtLineIndex(li);
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            if (meta[2].href != null) {
                return meta[2].href;
            }
        }
    };

    Meta.prototype.prevMetaOfClass = function(clss, li) {
        var i, index, j, len, m, ref1, ref2;
        for (index = i = ref1 = li - 1; ref1 <= 0 ? i <= 0 : i >= 0; index = ref1 <= 0 ? ++i : --i) {
            ref2 = this.metasAtLineIndex(index);
            for (j = 0, len = ref2.length; j < len; j++) {
                m = ref2[j];
                if (m[2].clss === clss) {
                    return m;
                }
            }
        }
    };

    Meta.prototype.nextMetaOfClass = function(clss, li) {
        var i, index, j, len, m, ref1, ref2, ref3;
        for (index = i = ref1 = li + 1, ref2 = this.editor.numLines(); ref1 <= ref2 ? i < ref2 : i > ref2; index = ref1 <= ref2 ? ++i : --i) {
            ref3 = this.metasAtLineIndex(index);
            for (j = 0, len = ref3.length; j < len; j++) {
                m = ref3[j];
                if (m[2].clss === clss) {
                    return m;
                }
            }
        }
    };

    Meta.prototype.metaOfClassAtLine = function(clss, li) {
        var i, len, m, ref1;
        ref1 = this.metasAtLineIndex(li);
        for (i = 0, len = ref1.length; i < len; i++) {
            m = ref1[i];
            if (m[2].clss === clss) {
                return m;
            }
        }
    };

    Meta.prototype.nextMetaOfSameClass = function(meta) {
        var i, j, len, li, m, ref1, ref2, ref3;
        for (li = i = ref1 = meta[0] + 1, ref2 = this.editor.numLines(); ref1 <= ref2 ? i < ref2 : i > ref2; li = ref1 <= ref2 ? ++i : --i) {
            ref3 = this.metasAtLineIndex(li);
            for (j = 0, len = ref3.length; j < len; j++) {
                m = ref3[j];
                if (m[2].clss === meta[2].clss) {
                    return m;
                }
            }
        }
    };

    Meta.prototype.onLinesShown = function(top, bot, num) {
        var i, len, meta, ref1, ref2, results;
        ref1 = this.metas;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            this.delDiv(meta);
            if ((top <= (ref2 = meta[0]) && ref2 <= bot)) {
                results.push(this.addDiv(meta));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Meta.prototype.onLinesShifted = function(top, bot, num) {
        var i, j, l, len, len1, len2, len3, meta, n, ref1, ref2, ref3, ref4;
        if (num > 0) {
            ref1 = rangesFromTopToBotInRanges(top - num, top - 1, this.metas);
            for (i = 0, len = ref1.length; i < len; i++) {
                meta = ref1[i];
                this.delDiv(meta);
            }
            ref2 = rangesFromTopToBotInRanges(bot - num + 1, bot, this.metas);
            for (j = 0, len1 = ref2.length; j < len1; j++) {
                meta = ref2[j];
                this.addDiv(meta);
            }
        } else {
            ref3 = rangesFromTopToBotInRanges(bot + 1, bot - num, this.metas);
            for (l = 0, len2 = ref3.length; l < len2; l++) {
                meta = ref3[l];
                this.delDiv(meta);
            }
            ref4 = rangesFromTopToBotInRanges(top, top - num - 1, this.metas);
            for (n = 0, len3 = ref4.length; n < len3; n++) {
                meta = ref4[n];
                this.addDiv(meta);
            }
        }
        return this.updatePositionsBelowLineIndex(top);
    };

    Meta.prototype.updatePositionsBelowLineIndex = function(li) {
        var i, len, meta, ref1, results, size;
        size = this.editor.size;
        ref1 = rangesFromTopToBotInRanges(li, this.editor.scroll.bot, this.metas);
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            results.push(this.updatePos(meta));
        }
        return results;
    };

    Meta.prototype.onLineInserted = function(li) {
        var i, len, meta, ref1;
        ref1 = rangesFromTopToBotInRanges(li, this.editor.numLines(), this.metas);
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            this.moveLineMeta(meta, 1);
        }
        return this.updatePositionsBelowLineIndex(li);
    };

    Meta.prototype.onLineDeleted = function(li) {
        var i, len, meta, ref1;
        while (meta = _.last(this.metasAtLineIndex(li))) {
            this.delMeta(meta);
        }
        ref1 = rangesFromTopToBotInRanges(li, this.editor.numLines(), this.metas);
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            this.moveLineMeta(meta, -1);
        }
        return this.updatePositionsBelowLineIndex(li);
    };

    Meta.prototype.onClearLines = function() {
        var i, len, meta, ref1;
        ref1 = this.metas;
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            this.delDiv(meta);
        }
        return this.clear();
    };

    Meta.prototype.clear = function() {
        this.elem.innerHTML = "";
        this.metas = [];
        return this.lineMetas = {};
    };

    Meta.prototype.delMeta = function(meta) {
        if (meta == null) {
            return kerror('del no meta?');
        }
        _.pull(this.lineMetas[meta[0]], meta);
        _.pull(this.metas, meta);
        return this.delDiv(meta);
    };

    Meta.prototype.delClass = function(clss) {
        var clsss, i, len, meta, ref1, ref2, ref3, results;
        ref1 = _.clone(this.metas);
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            meta = ref1[i];
            clsss = meta != null ? (ref2 = meta[2]) != null ? (ref3 = ref2.clss) != null ? ref3.split(' ') : void 0 : void 0 : void 0;
            if (!empty(clsss) && indexOf.call(clsss, clss) >= 0) {
                results.push(this.delMeta(meta));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    return Meta;

})();

module.exports = Meta;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNERBQUE7SUFBQTs7O0FBUUEsTUFBMEMsT0FBQSxDQUFRLEtBQVIsQ0FBMUMsRUFBRSxpQkFBRixFQUFTLGVBQVQsRUFBZSxlQUFmLEVBQXFCLFdBQXJCLEVBQXlCLG1CQUF6QixFQUFpQyxTQUFqQyxFQUFvQzs7QUFFcEMsTUFBQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLGVBQVI7O0FBRUg7SUFFQyxjQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxJQUFELEdBQU8sQ0FBQSxDQUFFLE9BQUYsRUFBVSxJQUFDLENBQUEsTUFBTSxDQUFDLElBQWxCO1FBRVAsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FBWCxFQUEwQixJQUFDLENBQUEsY0FBM0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQTBCLElBQUMsQ0FBQSxZQUEzQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGNBQVgsRUFBMEIsSUFBQyxDQUFBLGNBQTNCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsYUFBWCxFQUEwQixJQUFDLENBQUEsYUFBM0I7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQTBCLElBQUMsQ0FBQSxZQUEzQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGNBQVgsRUFBMEIsSUFBQyxDQUFBLGNBQTNCO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixXQUF2QixFQUFtQyxJQUFDLENBQUEsV0FBcEM7UUFD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OzttQkFNZCxLQUFBLEdBQU8sU0FBQTtRQUVILElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQjtRQUNsQixJQUFDLENBQUEsS0FBRCxHQUFTO2VBQ1QsSUFBQyxDQUFBLFNBQUQsR0FBYTtJQUpWOzttQkFNUCxPQUFBLEdBQVMsU0FBQyxJQUFEO1FBQ0wsSUFBTyxZQUFQO0FBQ0ksbUJBQU8sTUFBQSxDQUFPLGNBQVAsRUFEWDs7UUFFQSxDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxTQUFVLENBQUEsSUFBSyxDQUFBLENBQUEsQ0FBTCxDQUFsQixFQUE0QixJQUE1QjtRQUNBLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLEtBQVIsRUFBZSxJQUFmO2VBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBUSxJQUFSO0lBTEs7O21CQU9ULFFBQUEsR0FBVSxTQUFDLElBQUQ7QUFFTixZQUFBO0FBQUE7QUFBQTthQUFBLHNDQUFBOztZQUNJLEtBQUEsOEVBQXNCLENBQUUsS0FBaEIsQ0FBc0IsR0FBdEI7WUFDUixJQUFHLENBQUksS0FBQSxDQUFNLEtBQU4sQ0FBSixJQUFxQixhQUFRLEtBQVIsRUFBQSxJQUFBLE1BQXhCOzZCQUNJLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxHQURKO2FBQUEsTUFBQTtxQ0FBQTs7QUFGSjs7SUFGTTs7Ozs7O0FBT2QsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMFxuMDAwIDAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4jIyNcblxueyBlbXB0eSwgZWxlbSwga3Bvcywgc3csIGtlcnJvciwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5yYW5nZXMgPSByZXF1aXJlICcuLi90b29scy9yYW5nZXMnXG5GaWxlICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuXG5jbGFzcyBNZXRhXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBAbWV0YXMgICAgID0gW10gIyBbIFtsaW5lSW5kZXgsIFtzdGFydCwgZW5kXSwge2hyZWY6IC4uLn1dLCAuLi4gXVxuICAgICAgICBAbGluZU1ldGFzID0ge30gIyB7IGxpbmVJbmRleDogWyBsaW5lTWV0YSwgLi4uIF0sIC4uLiB9XG5cbiAgICAgICAgQGVsZW0gPSQgXCIubWV0YVwiIEBlZGl0b3Iudmlld1xuXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVBcHBlbmRlZCcgQG9uTGluZUFwcGVuZGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ2NsZWFyTGluZXMnICAgQG9uQ2xlYXJMaW5lc1xuICAgICAgICBAZWRpdG9yLm9uICdsaW5lSW5zZXJ0ZWQnIEBvbkxpbmVJbnNlcnRlZFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lRGVsZXRlZCcgIEBvbkxpbmVEZWxldGVkXG5cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTaG93bicgICBAb25MaW5lc1Nob3duXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2hpZnRlZCcgQG9uTGluZXNTaGlmdGVkXG5cbiAgICAgICAgQGVsZW0uYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25Nb3VzZURvd25cbiAgICAgICAgQGVsZW0uYWRkRXZlbnRMaXN0ZW5lciAnbW91c2V1cCcgICBAb25Nb3VzZVVwXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgc2V0TWV0YVBvczogKG1ldGEsIHR4LCB0eSkgLT5cblxuICAgICAgICBpZiBtZXRhWzJdLm5vX3hcbiAgICAgICAgICAgIG1ldGFbMl0uZGl2Py5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVkoI3t0eX1weClcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtZXRhWzJdLmRpdj8uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoI3t0eH1weCwje3R5fXB4KVwiXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgICAgICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgICAgICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHVwZGF0ZVBvczogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBzaXplID0gQGVkaXRvci5zaXplXG4gICAgICAgIHR4ID0gc2l6ZS5jaGFyV2lkdGggKiAgbWV0YVsxXVswXSArIHNpemUub2Zmc2V0WCArIChtZXRhWzJdLnhPZmZzZXQgPyAwKVxuICAgICAgICB0eSA9IHNpemUubGluZUhlaWdodCAqIChtZXRhWzBdIC0gQGVkaXRvci5zY3JvbGwudG9wKSArIChtZXRhWzJdLnlPZmZzZXQgPyAwKVxuICAgICAgICBAc2V0TWV0YVBvcyBtZXRhLCB0eCwgdHlcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgIDAwMCAgICAgIDBcblxuICAgIGFkZERpdjogKG1ldGEpIC0+XG5cbiAgICAgICAgc2l6ZSA9IEBlZGl0b3Iuc2l6ZVxuICAgICAgICBzdyA9IHNpemUuY2hhcldpZHRoICogKG1ldGFbMV1bMV0tbWV0YVsxXVswXSlcbiAgICAgICAgbGggPSBzaXplLmxpbmVIZWlnaHRcblxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBcIm1ldGEgI3ttZXRhWzJdLmNsc3MgPyAnJ31cIlxuICAgICAgICBkaXYuaW5uZXJIVE1MID0gbWV0YVsyXS5odG1sIGlmIG1ldGFbMl0uaHRtbD9cblxuICAgICAgICBtZXRhWzJdLmRpdiA9IGRpdlxuICAgICAgICBkaXYubWV0YSA9IG1ldGFcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBtZXRhWzJdLm5vX2hcbiAgICAgICAgICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIiN7bGh9cHhcIlxuXG4gICAgICAgIGlmIG1ldGFbMl0uc3R5bGU/XG4gICAgICAgICAgICBmb3Igayx2IG9mIG1ldGFbMl0uc3R5bGVcbiAgICAgICAgICAgICAgICBkaXYuc3R5bGVba10gPSB2XG5cbiAgICAgICAgaWYgbm90IG1ldGFbMl0ubm9feFxuICAgICAgICAgICAgZGl2LnN0eWxlLndpZHRoID0gXCIje3N3fXB4XCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZGl2LnN0eWxlLndpZHRoID0gXCIje0BlZGl0b3Iuc2l6ZS5udW1iZXJzV2lkdGh9cHhcIlxuXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIGRpdlxuXG4gICAgICAgIEB1cGRhdGVQb3MgbWV0YVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgICAgIDBcblxuICAgIGRlbERpdjogKG1ldGEpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gbGluZSBtZXRhPycgbWV0YSBpZiBub3QgbWV0YT9bMl0/XG4gICAgICAgIG1ldGFbMl0uZGl2Py5yZW1vdmUoKVxuICAgICAgICBtZXRhWzJdLmRpdiA9IG51bGxcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhZGQ6IChtZXRhKSAtPlxuXG4gICAgICAgIGxpbmVNZXRhID0gQGFkZExpbmVNZXRhIFttZXRhLmxpbmUsIFttZXRhLnN0YXJ0ID8gMCwgbWV0YS5lbmQgPyAwXSwgbWV0YV1cblxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC50b3AgPD0gbWV0YS5saW5lIDw9IEBlZGl0b3Iuc2Nyb2xsLmJvdFxuICAgICAgICAgICAgQGFkZERpdiBsaW5lTWV0YVxuICAgICAgICAgICAgQGVkaXRvci5udW1iZXJzLnVwZGF0ZU1ldGEgbWV0YS5saW5lXG4gICAgICAgICAgICBcbiAgICAgICAgbGluZU1ldGFcblxuICAgIHVwZGF0ZTogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgbWV0YVsyXS5ub194XG4gICAgICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lIG1ldGFbMF1cbiAgICAgICAgICAgIG1ldGFbMV1bMV0gPSBtZXRhWzFdWzBdICsgbGluZS5sZW5ndGgrMVxuICAgICAgICAgICAgbWV0YVsyXS5lbmQgPSBtZXRhWzFdWzFdXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm51bWJlcnMudXBkYXRlQ29sb3IgbWV0YVswXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25Nb3VzZURvd246IChldmVudCkgLT4gQGRvd25Qb3MgPSBrcG9zIGV2ZW50XG4gICAgXG4gICAgb25Nb3VzZVVwOiAoZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiA1IDwgQGRvd25Qb3M/LmRpc3Qga3BvcyBldmVudFxuICAgICAgICAgICAgZGVsZXRlIEBkb3duUG9zXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICBcbiAgICAgICAgZGVsZXRlIEBkb3duUG9zXG4gICAgICAgIGlmIGV2ZW50LnRhcmdldC5tZXRhP1syXS5jbGljaz9cbiAgICAgICAgICAgIHJlc3VsdCA9IGV2ZW50LnRhcmdldC5tZXRhP1syXS5jbGljayBldmVudC50YXJnZXQubWV0YSwgZXZlbnRcbiAgICAgICAgICAgICMgc3RvcEV2ZW50IGV2ZW50IGlmIHJlc3VsdCAhPSAndW5oYW5kbGVkJ1xuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBhcHBlbmQ6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgbGluZU1ldGEgPSBAYWRkTGluZU1ldGEgW0BlZGl0b3IubnVtTGluZXMoKSwgWzAsIDBdLCBtZXRhXVxuICAgICAgICBsaW5lTWV0YVxuXG4gICAgYWRkTGluZU1ldGE6IChsaW5lTWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ2ludmFsaWQgbGluZSBtZXRhPycgbGluZU1ldGEgaWYgbm90IGxpbmVNZXRhP1syXT9cbiAgICAgICAgXG4gICAgICAgIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dID89IFtdXG4gICAgICAgIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dLnB1c2ggbGluZU1ldGFcbiAgICAgICAgQG1ldGFzLnB1c2ggbGluZU1ldGFcbiAgICAgICAgbGluZU1ldGFcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG1vdmVMaW5lTWV0YTogKGxpbmVNZXRhLCBkKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ2ludmFsaWQgbW92ZT8nIGxpbmVNZXRhLCBkIGlmIG5vdCBsaW5lTWV0YT8gb3IgZCA9PSAwXG4gICAgICAgIFxuICAgICAgICBfLnB1bGwgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0sIGxpbmVNZXRhXG4gICAgICAgIGRlbGV0ZSBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSBpZiBlbXB0eSBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXVxuICAgICAgICBsaW5lTWV0YVswXSArPSBkXG4gICAgICAgIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dID89IFtdXG4gICAgICAgIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dLnB1c2ggbGluZU1ldGFcbiAgICAgICAgQHVwZGF0ZVBvcyBsaW5lTWV0YVxuICAgICAgICBAZWRpdG9yLm51bWJlcnMudXBkYXRlQ29sb3IgbGluZU1ldGFbMF1cbiAgICAgICAgXG4gICAgb25MaW5lQXBwZW5kZWQ6IChlKSA9PlxuXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc0F0TGluZUluZGV4IGUubGluZUluZGV4XG4gICAgICAgICAgICBtZXRhWzFdWzFdID0gZS50ZXh0Lmxlbmd0aCBpZiBtZXRhWzFdWzFdIGlzIDBcblxuICAgIG1ldGFzQXRMaW5lSW5kZXg6IChsaSkgLT4gQGxpbmVNZXRhc1tsaV0gPyBbXVxuICAgIG1ldGFBdExpbmVJbmRleDogIChsaSkgLT4gQGxpbmVNZXRhc1tsaV0/WzBdXG4gICAgICAgIFxuICAgIGhyZWZBdExpbmVJbmRleDogIChsaSkgLT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgcmV0dXJuIG1ldGFbMl0uaHJlZiBpZiBtZXRhWzJdLmhyZWY/XG5cbiAgICBwcmV2TWV0YU9mQ2xhc3M6IChjbHNzLCBsaSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbbGktMS4uMF1cbiAgICAgICAgICAgIGZvciBtIGluIEBtZXRhc0F0TGluZUluZGV4IGluZGV4XG4gICAgICAgICAgICAgICAgaWYgbVsyXS5jbHNzID09IGNsc3NcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1cblxuICAgIG5leHRNZXRhT2ZDbGFzczogKGNsc3MsIGxpKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFtsaSsxLi4uQGVkaXRvci5udW1MaW5lcygpXVxuICAgICAgICAgICAgZm9yIG0gaW4gQG1ldGFzQXRMaW5lSW5kZXggaW5kZXhcbiAgICAgICAgICAgICAgICBpZiBtWzJdLmNsc3MgPT0gY2xzc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbVxuXG4gICAgbWV0YU9mQ2xhc3NBdExpbmU6IChjbHNzLCBsaSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBtIGluIEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICBpZiBtWzJdLmNsc3MgPT0gY2xzc1xuICAgICAgICAgICAgICAgIHJldHVybiBtXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIG5leHRNZXRhT2ZTYW1lQ2xhc3M6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGxpIGluIFttZXRhWzBdKzEuLi5AZWRpdG9yLm51bUxpbmVzKCldXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgICAgIGlmIG1bMl0uY2xzcyA9PSBtZXRhWzJdLmNsc3NcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1cbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMCAgIDAwMFxuXG4gICAgb25MaW5lc1Nob3duOiAodG9wLCBib3QsIG51bSkgPT5cbiAgICAgICAgIyBrbG9nICdzaG93bicgdG9wLCBudW0sIEBtZXRhcy5sZW5ndGhcbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzXG4gICAgICAgICAgICBAZGVsRGl2IG1ldGFcbiAgICAgICAgICAgIGlmIHRvcCA8PSBtZXRhWzBdIDw9IGJvdFxuICAgICAgICAgICAgICAgIEBhZGREaXYgbWV0YVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkxpbmVzU2hpZnRlZDogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgdG9wLW51bSwgdG9wLTEsIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBib3QtbnVtKzEsIGJvdCwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGFkZERpdiBtZXRhXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgYm90KzEsIGJvdC1udW0sIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyB0b3AsIHRvcC1udW0tMSwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGFkZERpdiBtZXRhXG5cbiAgICAgICAgQHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4IHRvcFxuXG4gICAgdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICBzaXplID0gQGVkaXRvci5zaXplXG4gICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBAZWRpdG9yLnNjcm9sbC5ib3QsIEBtZXRhc1xuICAgICAgICAgICAgQHVwZGF0ZVBvcyBtZXRhXG5cbiAgICBvbkxpbmVJbnNlcnRlZDogKGxpKSA9PlxuXG4gICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBAZWRpdG9yLm51bUxpbmVzKCksIEBtZXRhc1xuICAgICAgICAgICAgQG1vdmVMaW5lTWV0YSBtZXRhLCAxXG5cbiAgICAgICAgQHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4IGxpXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgb25MaW5lRGVsZXRlZDogKGxpKSA9PlxuXG4gICAgICAgIHdoaWxlIG1ldGEgPSBfLmxhc3QgQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgIEBkZWxNZXRhIG1ldGFcblxuICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgQGVkaXRvci5udW1MaW5lcygpLCBAbWV0YXNcbiAgICAgICAgICAgIEBtb3ZlTGluZU1ldGEgbWV0YSwgLTFcblxuICAgICAgICBAdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXggbGlcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25DbGVhckxpbmVzOiA9PlxuXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc1xuICAgICAgICAgICAgQGRlbERpdiBtZXRhXG4gICAgICAgIEBjbGVhcigpXG5cbiAgICBjbGVhcjogPT4gXG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBAbWV0YXMgPSBbXVxuICAgICAgICBAbGluZU1ldGFzID0ge31cblxuICAgIGRlbE1ldGE6IChtZXRhKSAtPlxuICAgICAgICBpZiBub3QgbWV0YT9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ2RlbCBubyBtZXRhPydcbiAgICAgICAgXy5wdWxsIEBsaW5lTWV0YXNbbWV0YVswXV0sIG1ldGFcbiAgICAgICAgXy5wdWxsIEBtZXRhcywgbWV0YVxuICAgICAgICBAZGVsRGl2IG1ldGFcblxuICAgIGRlbENsYXNzOiAoY2xzcykgLT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBfLmNsb25lIEBtZXRhc1xuICAgICAgICAgICAgY2xzc3MgPSBtZXRhP1syXT8uY2xzcz8uc3BsaXQgJyAnXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkoY2xzc3MpIGFuZCBjbHNzIGluIGNsc3NzXG4gICAgICAgICAgICAgICAgQGRlbE1ldGEgbWV0YVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1ldGFcbiJdfQ==
//# sourceURL=../../coffee/editor/meta.coffee