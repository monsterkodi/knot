// koffee 1.4.0

/*
00     00  00000000  000000000   0000000
000   000  000          000     000   000
000000000  0000000      000     000000000
000 0 000  000          000     000   000
000   000  00000000     000     000   000
 */
var $, File, Meta, _, elem, empty, fs, kerror, klog, kpos, post, ranges, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, kerror = ref.kerror, slash = ref.slash, empty = ref.empty, elem = ref.elem, kpos = ref.kpos, klog = ref.klog, fs = ref.fs, $ = ref.$, _ = ref._;

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
        var div, k, lh, ref1, ref2, size, sw, v;
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
        return this.editor.numbers.updateColor(meta.line);
    };

    Meta.prototype.addDiffMeta = function(meta) {
        meta.diff = true;
        return this.addNumberMeta(meta);
    };

    Meta.prototype.addNumberMeta = function(meta) {
        var lineMeta, ref1;
        meta.no_x = true;
        lineMeta = this.addLineMeta([meta.line, [0, 0], meta]);
        if ((this.editor.scroll.top <= (ref1 = meta.line) && ref1 <= this.editor.scroll.bot)) {
            return this.addDiv(lineMeta);
        }
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
        return this.updatePos(lineMeta);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMEZBQUE7SUFBQTs7O0FBUUEsTUFBd0UsT0FBQSxDQUFRLEtBQVIsQ0FBeEUsRUFBRSxlQUFGLEVBQVEseUJBQVIsRUFBbUIsbUJBQW5CLEVBQTJCLGlCQUEzQixFQUFrQyxpQkFBbEMsRUFBeUMsZUFBekMsRUFBK0MsZUFBL0MsRUFBcUQsZUFBckQsRUFBMkQsV0FBM0QsRUFBK0QsU0FBL0QsRUFBa0U7O0FBRWxFLE1BQUEsR0FBUyxPQUFBLENBQVEsaUJBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxlQUFSOztBQUVIO0lBRUMsY0FBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7O1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFFYixJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxPQUFGLEVBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFsQjtRQUVQLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGNBQVgsRUFBMEIsSUFBQyxDQUFBLGNBQTNCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUEwQixJQUFDLENBQUEsWUFBM0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQTBCLElBQUMsQ0FBQSxjQUEzQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGFBQVgsRUFBMEIsSUFBQyxDQUFBLGFBQTNCO1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUEwQixJQUFDLENBQUEsWUFBM0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQTBCLElBQUMsQ0FBQSxjQUEzQjtRQUVBLElBQUMsQ0FBQSxJ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LENBQWxCLEVBQTRCLElBQTVCO1FBQ0EsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsS0FBUixFQUFlLElBQWY7ZUFDQSxJQUFDLENBQUEsTUFBRCxDQUFRLElBQVI7SUFMSzs7bUJBT1QsUUFBQSxHQUFVLFNBQUMsSUFBRDtBQUVOLFlBQUE7QUFBQTtBQUFBO2FBQUEsc0NBQUE7O1lBQ0ksS0FBQSw4RUFBc0IsQ0FBRSxLQUFoQixDQUFzQixHQUF0QjtZQUNSLElBQUcsQ0FBSSxLQUFBLENBQU0sS0FBTixDQUFKLElBQXFCLGFBQVEsS0FBUixFQUFBLElBQUEsTUFBeEI7NkJBQ0ksSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFULEdBREo7YUFBQSxNQUFBO3FDQUFBOztBQUZKOztJQUZNOzs7Ozs7QUFPZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwXG4wMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHN0b3BFdmVudCwga2Vycm9yLCBzbGFzaCwgZW1wdHksIGVsZW0sIGtwb3MsIGtsb2csIGZzLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbnJhbmdlcyA9IHJlcXVpcmUgJy4uL3Rvb2xzL3JhbmdlcydcbkZpbGUgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZpbGUnXG5cbmNsYXNzIE1ldGFcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuXG4gICAgICAgIEBtZXRhcyAgICAgPSBbXSAjIFsgW2xpbmVJbmRleCwgW3N0YXJ0LCBlbmRdLCB7aHJlZjogLi4ufV0sIC4uLiBdXG4gICAgICAgIEBsaW5lTWV0YXMgPSB7fSAjIHsgbGluZUluZGV4OiBbIGxpbmVNZXRhLCAuLi4gXSwgLi4uIH1cblxuICAgICAgICBAZWxlbSA9JCBcIi5tZXRhXCIgQGVkaXRvci52aWV3XG5cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUFwcGVuZGVkJyBAb25MaW5lQXBwZW5kZWRcbiAgICAgICAgQGVkaXRvci5vbiAnY2xlYXJMaW5lcycgICBAb25DbGVhckxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVJbnNlcnRlZCcgQG9uTGluZUluc2VydGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVEZWxldGVkJyAgQG9uTGluZURlbGV0ZWRcblxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1Nob3duJyAgIEBvbkxpbmVzU2hvd25cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTaGlmdGVkJyBAb25MaW5lc1NoaWZ0ZWRcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICdtb3VzZXVwJyAgIEBvbk1vdXNlVXBcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgICAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBzZXRNZXRhUG9zOiAobWV0YSwgdHgsIHR5KSAtPlxuXG4gICAgICAgIGlmIG1ldGFbMl0ubm9feFxuICAgICAgICAgICAgbWV0YVsyXS5kaXY/LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWSgje3R5fXB4KVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1ldGFbMl0uZGl2Py5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZSgje3R4fXB4LCN7dHl9cHgpXCJcblxuICAgIHVwZGF0ZVBvczogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBzaXplID0gQGVkaXRvci5zaXplXG4gICAgICAgIHR4ID0gc2l6ZS5jaGFyV2lkdGggKiAgbWV0YVsxXVswXSArIHNpemUub2Zmc2V0WCArIChtZXRhWzJdLnhPZmZzZXQgPyAwKVxuICAgICAgICB0eSA9IHNpemUubGluZUhlaWdodCAqIChtZXRhWzBdIC0gQGVkaXRvci5zY3JvbGwudG9wKSArIChtZXRhWzJdLnlPZmZzZXQgPyAwKVxuICAgICAgICBAc2V0TWV0YVBvcyBtZXRhLCB0eCwgdHlcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgIDAwMCAgICAgIDBcblxuICAgIGFkZERpdjogKG1ldGEpIC0+XG5cbiAgICAgICAgc2l6ZSA9IEBlZGl0b3Iuc2l6ZVxuICAgICAgICBzdyA9IHNpemUuY2hhcldpZHRoICogKG1ldGFbMV1bMV0tbWV0YVsxXVswXSlcbiAgICAgICAgbGggPSBzaXplLmxpbmVIZWlnaHRcblxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBcIm1ldGEgI3ttZXRhWzJdLmNsc3MgPyAnJ31cIlxuICAgICAgICBkaXYuaW5uZXJIVE1MID0gbWV0YVsyXS5odG1sIGlmIG1ldGFbMl0uaHRtbD9cblxuICAgICAgICBtZXRhWzJdLmRpdiA9IGRpdlxuICAgICAgICBkaXYubWV0YSA9IG1ldGFcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBtZXRhWzJdLm5vX2hcbiAgICAgICAgICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIiN7bGh9cHhcIlxuXG4gICAgICAgIGlmIG1ldGFbMl0uc3R5bGU/XG4gICAgICAgICAgICBmb3Igayx2IG9mIG1ldGFbMl0uc3R5bGVcbiAgICAgICAgICAgICAgICBkaXYuc3R5bGVba10gPSB2XG5cbiAgICAgICAgaWYgbm90IG1ldGFbMl0ubm9feFxuICAgICAgICAgICAgZGl2LnN0eWxlLndpZHRoID0gXCIje3N3fXB4XCJcblxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBkaXZcblxuICAgICAgICBAdXBkYXRlUG9zIG1ldGFcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAgICAwXG5cbiAgICBkZWxEaXY6IChtZXRhKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ25vIGxpbmUgbWV0YT8nIG1ldGEgaWYgbm90IG1ldGE/WzJdP1xuICAgICAgICBtZXRhWzJdLmRpdj8ucmVtb3ZlKClcbiAgICAgICAgbWV0YVsyXS5kaXYgPSBudWxsXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYWRkOiAobWV0YSkgLT5cblxuICAgICAgICBsaW5lTWV0YSA9IEBhZGRMaW5lTWV0YSBbbWV0YS5saW5lLCBbbWV0YS5zdGFydCA/IDAsIG1ldGEuZW5kID8gMF0sIG1ldGFdXG5cbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwudG9wIDw9IG1ldGEubGluZSA8PSBAZWRpdG9yLnNjcm9sbC5ib3RcbiAgICAgICAgICAgIEBhZGREaXYgbGluZU1ldGFcbiAgICAgICAgICAgIEBlZGl0b3IubnVtYmVycy51cGRhdGVNZXRhIG1ldGEubGluZVxuICAgICAgICAgICAgXG4gICAgICAgIGxpbmVNZXRhXG5cbiAgICB1cGRhdGU6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IG1ldGFbMl0ubm9feFxuICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZSBtZXRhWzBdXG4gICAgICAgICAgICBtZXRhWzFdWzFdID0gbWV0YVsxXVswXSArIGxpbmUubGVuZ3RoKzFcbiAgICAgICAgICAgIG1ldGFbMl0uZW5kID0gbWV0YVsxXVsxXVxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5udW1iZXJzLnVwZGF0ZUNvbG9yIG1ldGEubGluZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgXG4gICAgYWRkRGlmZk1ldGE6IChtZXRhKSAtPlxuXG4gICAgICAgIG1ldGEuZGlmZiA9IHRydWVcbiAgICAgICAgQGFkZE51bWJlck1ldGEgbWV0YVxuICAgICAgICBcbiAgICBhZGROdW1iZXJNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBtZXRhLm5vX3ggPSB0cnVlXG4gICAgICAgIGxpbmVNZXRhID0gQGFkZExpbmVNZXRhIFttZXRhLmxpbmUsIFswLCAwXSwgbWV0YV1cblxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC50b3AgPD0gbWV0YS5saW5lIDw9IEBlZGl0b3Iuc2Nyb2xsLmJvdFxuICAgICAgICAgICAgQGFkZERpdiBsaW5lTWV0YVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpIC0+IEBkb3duUG9zID0ga3BvcyBldmVudFxuICAgIFxuICAgIG9uTW91c2VVcDogKGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgNSA8IEBkb3duUG9zPy5kaXN0IGtwb3MgZXZlbnRcbiAgICAgICAgICAgIGRlbGV0ZSBAZG93blBvc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAZG93blBvc1xuICAgICAgICBpZiBldmVudC50YXJnZXQubWV0YT9bMl0uY2xpY2s/XG4gICAgICAgICAgICByZXN1bHQgPSBldmVudC50YXJnZXQubWV0YT9bMl0uY2xpY2sgZXZlbnQudGFyZ2V0Lm1ldGEsIGV2ZW50XG4gICAgICAgICAgICAjIHN0b3BFdmVudCBldmVudCBpZiByZXN1bHQgIT0gJ3VuaGFuZGxlZCdcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgYXBwZW5kOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGxpbmVNZXRhID0gQGFkZExpbmVNZXRhIFtAZWRpdG9yLm51bUxpbmVzKCksIFswLCAwXSwgbWV0YV1cbiAgICAgICAgbGluZU1ldGFcblxuICAgIGFkZExpbmVNZXRhOiAobGluZU1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yICdpbnZhbGlkIGxpbmUgbWV0YT8nIGxpbmVNZXRhIGlmIG5vdCBsaW5lTWV0YT9bMl0/XG4gICAgICAgIFxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSA/PSBbXVxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXS5wdXNoIGxpbmVNZXRhXG4gICAgICAgIEBtZXRhcy5wdXNoIGxpbmVNZXRhXG4gICAgICAgIGxpbmVNZXRhXG5cbiAgICBtb3ZlTGluZU1ldGE6IChsaW5lTWV0YSwgZCkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yICdpbnZhbGlkIG1vdmU/JyBsaW5lTWV0YSwgZCBpZiBub3QgbGluZU1ldGE/IG9yIGQgPT0gMFxuICAgICAgICBcbiAgICAgICAgXy5wdWxsIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dLCBsaW5lTWV0YVxuICAgICAgICBkZWxldGUgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0gaWYgZW1wdHkgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV1cbiAgICAgICAgbGluZU1ldGFbMF0gKz0gZFxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSA/PSBbXVxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXS5wdXNoIGxpbmVNZXRhXG4gICAgICAgIEB1cGRhdGVQb3MgbGluZU1ldGFcbiAgICAgICAgXG4gICAgb25MaW5lQXBwZW5kZWQ6IChlKSA9PlxuXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc0F0TGluZUluZGV4IGUubGluZUluZGV4XG4gICAgICAgICAgICBtZXRhWzFdWzFdID0gZS50ZXh0Lmxlbmd0aCBpZiBtZXRhWzFdWzFdIGlzIDBcblxuICAgIG1ldGFzQXRMaW5lSW5kZXg6IChsaSkgLT4gQGxpbmVNZXRhc1tsaV0gPyBbXVxuICAgICAgICBcbiAgICBocmVmQXRMaW5lSW5kZXg6ICAobGkpIC0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgIHJldHVybiBtZXRhWzJdLmhyZWYgaWYgbWV0YVsyXS5ocmVmP1xuXG4gICAgbmV4dE1ldGFPZlNhbWVDbGFzczogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbGkgaW4gW21ldGFbMF0rMS4uLkBlZGl0b3IubnVtTGluZXMoKV1cbiAgICAgICAgICAgIGZvciBtIGluIEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICAgICAgaWYgbVsyXS5jbHNzID09IG1ldGFbMl0uY2xzc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkxpbmVzU2hvd246ICh0b3AsIGJvdCwgbnVtKSA9PlxuICAgICAgICAjIGtsb2cgJ3Nob3duJyB0b3AsIG51bSwgQG1ldGFzLmxlbmd0aFxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNcbiAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuICAgICAgICAgICAgaWYgdG9wIDw9IG1ldGFbMF0gPD0gYm90XG4gICAgICAgICAgICAgICAgQGFkZERpdiBtZXRhXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uTGluZXNTaGlmdGVkOiAodG9wLCBib3QsIG51bSkgPT5cblxuICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyB0b3AtbnVtLCB0b3AtMSwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGRlbERpdiBtZXRhXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGJvdC1udW0rMSwgYm90LCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAYWRkRGl2IG1ldGFcbiAgICAgICAgZWxzZVxuXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBib3QrMSwgYm90LW51bSwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGRlbERpdiBtZXRhXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIHRvcCwgdG9wLW51bS0xLCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAYWRkRGl2IG1ldGFcblxuICAgICAgICBAdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXggdG9wXG5cbiAgICB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIHNpemUgPSBAZWRpdG9yLnNpemVcbiAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIEBlZGl0b3Iuc2Nyb2xsLmJvdCwgQG1ldGFzXG4gICAgICAgICAgICBAdXBkYXRlUG9zIG1ldGFcblxuICAgIG9uTGluZUluc2VydGVkOiAobGkpID0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIEBlZGl0b3IubnVtTGluZXMoKSwgQG1ldGFzXG4gICAgICAgICAgICBAbW92ZUxpbmVNZXRhIG1ldGEsIDFcblxuICAgICAgICBAdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXggbGlcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBvbkxpbmVEZWxldGVkOiAobGkpID0+XG5cbiAgICAgICAgd2hpbGUgbWV0YSA9IF8ubGFzdCBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgQGRlbE1ldGEgbWV0YVxuXG4gICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBAZWRpdG9yLm51bUxpbmVzKCksIEBtZXRhc1xuICAgICAgICAgICAgQG1vdmVMaW5lTWV0YSBtZXRhLCAtMVxuXG4gICAgICAgIEB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleCBsaVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkNsZWFyTGluZXM6ID0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzXG4gICAgICAgICAgICBAZGVsRGl2IG1ldGFcbiAgICAgICAgQGNsZWFyKClcblxuICAgIGNsZWFyOiA9PiBcblxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBcIlwiXG4gICAgICAgIEBtZXRhcyA9IFtdXG4gICAgICAgIEBsaW5lTWV0YXMgPSB7fVxuXG4gICAgZGVsTWV0YTogKG1ldGEpIC0+XG4gICAgICAgIGlmIG5vdCBtZXRhP1xuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnZGVsIG5vIG1ldGE/J1xuICAgICAgICBfLnB1bGwgQGxpbmVNZXRhc1ttZXRhWzBdXSwgbWV0YVxuICAgICAgICBfLnB1bGwgQG1ldGFzLCBtZXRhXG4gICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgZGVsQ2xhc3M6IChjbHNzKSAtPlxuXG4gICAgICAgIGZvciBtZXRhIGluIF8uY2xvbmUgQG1ldGFzXG4gICAgICAgICAgICBjbHNzcyA9IG1ldGE/WzJdPy5jbHNzPy5zcGxpdCAnICdcbiAgICAgICAgICAgIGlmIG5vdCBlbXB0eShjbHNzcykgYW5kIGNsc3MgaW4gY2xzc3NcbiAgICAgICAgICAgICAgICBAZGVsTWV0YSBtZXRhXG5cbm1vZHVsZS5leHBvcnRzID0gTWV0YVxuIl19
//# sourceURL=../../coffee/editor/meta.coffee