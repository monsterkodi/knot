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

    Meta.prototype.metasOfClass = function(clss) {
        var i, j, len, li, m, metas, ref1, ref2;
        metas = [];
        for (li = i = 0, ref1 = this.editor.numLines(); 0 <= ref1 ? i < ref1 : i > ref1; li = 0 <= ref1 ? ++i : --i) {
            ref2 = this.metasAtLineIndex(li);
            for (j = 0, len = ref2.length; j < len; j++) {
                m = ref2[j];
                if (m[2].clss === clss) {
                    metas.push(m);
                }
            }
        }
        return metas;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNERBQUE7SUFBQTs7O0FBUUEsTUFBMEMsT0FBQSxDQUFRLEtBQVIsQ0FBMUMsRUFBRSxpQkFBRixFQUFTLGVBQVQsRUFBZSxlQUFmLEVBQXFCLFdBQXJCLEVBQXlCLG1CQUF6QixFQUFpQyxTQUFqQyxFQUFvQzs7QUFFcEMsTUFBQSxHQUFTLE9BQUEsQ0FBUSxpQkFBUjs7QUFDVCxJQUFBLEdBQVMsT0FBQSxDQUFRLGVBQVI7O0FBRUg7SUFFQyxjQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7UUFFQSxJQUFDLENBQUEsS0FBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxJQUFELEdBQU8sQ0FBQSxDQUFFLE9BQUYsRUFBVSxJQUFDLENBQUEsTUFBTSxDQUFDLElBQWxCO1FBRVAsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FBWCxFQUEwQixJQUFDLENBQUEsY0FBM0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQTBCLElBQUMsQ0FBQSxZQUEzQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGNBQVgsRUFBMEIsSUFBQyxDQUFBLGNBQTNCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsYUFBWCxFQUEwQixJQUFDLENBQUEsYUFBM0I7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQTBCLElBQUMsQ0FBQSxZQUEzQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGNBQVgsRUFBMEIsSUFBQyxDQUFBLGNBQTNCO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixXQUF2QixFQUFtQyxJQUFDLENBQUEsV0FBcEM7UUFD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LENBQUEsWUFBRCxDQUFjLElBQWQsRUFBb0IsQ0FBQyxDQUFyQjtBQURKO2VBR0EsSUFBQyxDQUFBLDZCQUFELENBQStCLEVBQS9CO0lBUlc7O21CQWdCZixZQUFBLEdBQWMsU0FBQTtBQUVWLFlBQUE7QUFBQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksSUFBQyxDQUFBLE1BQUQsQ0FBUSxJQUFSO0FBREo7ZUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO0lBSlU7O21CQU1kLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCO1FBQ2xCLElBQUMsQ0FBQSxLQUFELEdBQVM7ZUFDVCxJQUFDLENBQUEsU0FBRCxHQUFhO0lBSlY7O21CQU1QLE9BQUEsR0FBUyxTQUFDLElBQUQ7UUFDTCxJQUFPLFlBQVA7QUFDSSxtQkFBTyxNQUFBLENBQU8sY0FBUCxFQURYOztRQUVBLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLFNBQVUsQ0FBQSxJQUFLLENBQUEsQ0FBQSxDQUFMLENBQWxCLEVBQTRCLElBQTVCO1FBQ0EsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsS0FBUixFQUFlLElBQWY7ZUFDQSxJQUFDLENBQUEsTUFBRCxDQUFRLElBQVI7SUFMSzs7bUJBT1QsUUFBQSxHQUFVLFNBQUMsSUFBRDtBQUVOLFlBQUE7QUFBQTtBQUFBO2FBQUEsc0NBQUE7O1lBQ0ksS0FBQSw4RUFBc0IsQ0FBRSxLQUFoQixDQUFzQixHQUF0QjtZQUNSLElBQUcsQ0FBSSxLQUFBLENBQU0sS0FBTixDQUFKLElBQXFCLGFBQVEsS0FBUixFQUFBLElBQUEsTUFBeEI7NkJBQ0ksSUFBQyxDQUFBLE9BQUQsQ0FBUyxJQUFULEdBREo7YUFBQSxNQUFBO3FDQUFBOztBQUZKOztJQUZNOzs7Ozs7QUFPZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwXG4wMDAgMCAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDBcbiMjI1xuXG57IGVtcHR5LCBlbGVtLCBrcG9zLCBzdywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbnJhbmdlcyA9IHJlcXVpcmUgJy4uL3Rvb2xzL3JhbmdlcydcbkZpbGUgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZpbGUnXG5cbmNsYXNzIE1ldGFcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuXG4gICAgICAgIEBtZXRhcyAgICAgPSBbXSAjIFsgW2xpbmVJbmRleCwgW3N0YXJ0LCBlbmRdLCB7aHJlZjogLi4ufV0sIC4uLiBdXG4gICAgICAgIEBsaW5lTWV0YXMgPSB7fSAjIHsgbGluZUluZGV4OiBbIGxpbmVNZXRhLCAuLi4gXSwgLi4uIH1cblxuICAgICAgICBAZWxlbSA9JCBcIi5tZXRhXCIgQGVkaXRvci52aWV3XG5cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUFwcGVuZGVkJyBAb25MaW5lQXBwZW5kZWRcbiAgICAgICAgQGVkaXRvci5vbiAnY2xlYXJMaW5lcycgICBAb25DbGVhckxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVJbnNlcnRlZCcgQG9uTGluZUluc2VydGVkXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVEZWxldGVkJyAgQG9uTGluZURlbGV0ZWRcblxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1Nob3duJyAgIEBvbkxpbmVzU2hvd25cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTaGlmdGVkJyBAb25MaW5lc1NoaWZ0ZWRcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICdtb3VzZXVwJyAgIEBvbk1vdXNlVXBcblxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgICAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBzZXRNZXRhUG9zOiAobWV0YSwgdHgsIHR5KSAtPlxuXG4gICAgICAgIGlmIG1ldGFbMl0ubm9feFxuICAgICAgICAgICAgbWV0YVsyXS5kaXY/LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWSgje3R5fXB4KVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG1ldGFbMl0uZGl2Py5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZSgje3R4fXB4LCN7dHl9cHgpXCJcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgICAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgdXBkYXRlUG9zOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHNpemUgPSBAZWRpdG9yLnNpemVcbiAgICAgICAgdHggPSBzaXplLmNoYXJXaWR0aCAqICBtZXRhWzFdWzBdICsgc2l6ZS5vZmZzZXRYICsgKG1ldGFbMl0ueE9mZnNldCA/IDApXG4gICAgICAgIHR5ID0gc2l6ZS5saW5lSGVpZ2h0ICogKG1ldGFbMF0gLSBAZWRpdG9yLnNjcm9sbC50b3ApICsgKG1ldGFbMl0ueU9mZnNldCA/IDApXG4gICAgICAgIEBzZXRNZXRhUG9zIG1ldGEsIHR4LCB0eVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgICAgMFxuXG4gICAgYWRkRGl2OiAobWV0YSkgLT5cblxuICAgICAgICBzaXplID0gQGVkaXRvci5zaXplXG4gICAgICAgIHN3ID0gc2l6ZS5jaGFyV2lkdGggKiAobWV0YVsxXVsxXS1tZXRhWzFdWzBdKVxuICAgICAgICBsaCA9IHNpemUubGluZUhlaWdodFxuXG4gICAgICAgIGRpdiA9IGVsZW0gY2xhc3M6IFwibWV0YSAje21ldGFbMl0uY2xzcyA/ICcnfVwiXG4gICAgICAgIGRpdi5pbm5lckhUTUwgPSBtZXRhWzJdLmh0bWwgaWYgbWV0YVsyXS5odG1sP1xuXG4gICAgICAgIG1ldGFbMl0uZGl2ID0gZGl2XG4gICAgICAgIGRpdi5tZXRhID0gbWV0YVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IG1ldGFbMl0ubm9faFxuICAgICAgICAgICAgZGl2LnN0eWxlLmhlaWdodCA9IFwiI3tsaH1weFwiXG5cbiAgICAgICAgaWYgbWV0YVsyXS5zdHlsZT9cbiAgICAgICAgICAgIGZvciBrLHYgb2YgbWV0YVsyXS5zdHlsZVxuICAgICAgICAgICAgICAgIGRpdi5zdHlsZVtrXSA9IHZcblxuICAgICAgICBpZiBub3QgbWV0YVsyXS5ub194XG4gICAgICAgICAgICBkaXYuc3R5bGUud2lkdGggPSBcIiN7c3d9cHhcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBkaXYuc3R5bGUud2lkdGggPSBcIiN7QGVkaXRvci5zaXplLm51bWJlcnNXaWR0aH1weFwiXG5cbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgZGl2XG5cbiAgICAgICAgQHVwZGF0ZVBvcyBtZXRhXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgICAgICAgICAgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgICAgMFxuXG4gICAgZGVsRGl2OiAobWV0YSkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yICdubyBsaW5lIG1ldGE/JyBtZXRhIGlmIG5vdCBtZXRhP1syXT9cbiAgICAgICAgbWV0YVsyXS5kaXY/LnJlbW92ZSgpXG4gICAgICAgIG1ldGFbMl0uZGl2ID0gbnVsbFxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGFkZDogKG1ldGEpIC0+XG5cbiAgICAgICAgbGluZU1ldGEgPSBAYWRkTGluZU1ldGEgW21ldGEubGluZSwgW21ldGEuc3RhcnQgPyAwLCBtZXRhLmVuZCA/IDBdLCBtZXRhXVxuXG4gICAgICAgIGlmIEBlZGl0b3Iuc2Nyb2xsLnRvcCA8PSBtZXRhLmxpbmUgPD0gQGVkaXRvci5zY3JvbGwuYm90XG4gICAgICAgICAgICBAYWRkRGl2IGxpbmVNZXRhXG4gICAgICAgICAgICBAZWRpdG9yLm51bWJlcnMudXBkYXRlTWV0YSBtZXRhLmxpbmVcbiAgICAgICAgICAgIFxuICAgICAgICBsaW5lTWV0YVxuXG4gICAgdXBkYXRlOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBtZXRhWzJdLm5vX3hcbiAgICAgICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmUgbWV0YVswXVxuICAgICAgICAgICAgbWV0YVsxXVsxXSA9IG1ldGFbMV1bMF0gKyBsaW5lLmxlbmd0aCsxXG4gICAgICAgICAgICBtZXRhWzJdLmVuZCA9IG1ldGFbMV1bMV1cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IubnVtYmVycy51cGRhdGVDb2xvciBtZXRhWzBdXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSAtPiBAZG93blBvcyA9IGtwb3MgZXZlbnRcbiAgICBcbiAgICBvbk1vdXNlVXA6IChldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIDUgPCBAZG93blBvcz8uZGlzdCBrcG9zIGV2ZW50XG4gICAgICAgICAgICBkZWxldGUgQGRvd25Qb3NcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIFxuICAgICAgICBkZWxldGUgQGRvd25Qb3NcbiAgICAgICAgaWYgZXZlbnQudGFyZ2V0Lm1ldGE/WzJdLmNsaWNrP1xuICAgICAgICAgICAgcmVzdWx0ID0gZXZlbnQudGFyZ2V0Lm1ldGE/WzJdLmNsaWNrIGV2ZW50LnRhcmdldC5tZXRhLCBldmVudFxuICAgICAgICAgICAgIyBzdG9wRXZlbnQgZXZlbnQgaWYgcmVzdWx0ICE9ICd1bmhhbmRsZWQnXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGFwcGVuZDogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBsaW5lTWV0YSA9IEBhZGRMaW5lTWV0YSBbQGVkaXRvci5udW1MaW5lcygpLCBbMCwgMF0sIG1ldGFdXG4gICAgICAgIGxpbmVNZXRhXG5cbiAgICBhZGRMaW5lTWV0YTogKGxpbmVNZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciAnaW52YWxpZCBsaW5lIG1ldGE/JyBsaW5lTWV0YSBpZiBub3QgbGluZU1ldGE/WzJdP1xuICAgICAgICBcbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0gPz0gW11cbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0ucHVzaCBsaW5lTWV0YVxuICAgICAgICBAbWV0YXMucHVzaCBsaW5lTWV0YVxuICAgICAgICBsaW5lTWV0YVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbW92ZUxpbmVNZXRhOiAobGluZU1ldGEsIGQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnaW52YWxpZCBtb3ZlPycgbGluZU1ldGEsIGQgaWYgbm90IGxpbmVNZXRhPyBvciBkID09IDBcbiAgICAgICAgXG4gICAgICAgIF8ucHVsbCBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSwgbGluZU1ldGFcbiAgICAgICAgZGVsZXRlIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dIGlmIGVtcHR5IEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dXG4gICAgICAgIGxpbmVNZXRhWzBdICs9IGRcbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0gPz0gW11cbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0ucHVzaCBsaW5lTWV0YVxuICAgICAgICBAdXBkYXRlUG9zIGxpbmVNZXRhXG4gICAgICAgIEBlZGl0b3IubnVtYmVycy51cGRhdGVDb2xvciBsaW5lTWV0YVswXVxuICAgICAgICBcbiAgICBvbkxpbmVBcHBlbmRlZDogKGUpID0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzQXRMaW5lSW5kZXggZS5saW5lSW5kZXhcbiAgICAgICAgICAgIG1ldGFbMV1bMV0gPSBlLnRleHQubGVuZ3RoIGlmIG1ldGFbMV1bMV0gaXMgMFxuXG4gICAgbWV0YXNBdExpbmVJbmRleDogKGxpKSAtPiBAbGluZU1ldGFzW2xpXSA/IFtdXG4gICAgbWV0YUF0TGluZUluZGV4OiAgKGxpKSAtPiBAbGluZU1ldGFzW2xpXT9bMF1cbiAgICAgICAgXG4gICAgaHJlZkF0TGluZUluZGV4OiAgKGxpKSAtPlxuXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICByZXR1cm4gbWV0YVsyXS5ocmVmIGlmIG1ldGFbMl0uaHJlZj9cblxuICAgIHByZXZNZXRhT2ZDbGFzczogKGNsc3MsIGxpKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFtsaS0xLi4wXVxuICAgICAgICAgICAgZm9yIG0gaW4gQG1ldGFzQXRMaW5lSW5kZXggaW5kZXhcbiAgICAgICAgICAgICAgICBpZiBtWzJdLmNsc3MgPT0gY2xzc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBuZXh0TWV0YU9mQ2xhc3M6IChjbHNzLCBsaSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBpbmRleCBpbiBbbGkrMS4uLkBlZGl0b3IubnVtTGluZXMoKV1cbiAgICAgICAgICAgIGZvciBtIGluIEBtZXRhc0F0TGluZUluZGV4IGluZGV4XG4gICAgICAgICAgICAgICAgaWYgbVsyXS5jbHNzID09IGNsc3NcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1cblxuICAgIG1ldGFPZkNsYXNzQXRMaW5lOiAoY2xzcywgbGkpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbSBpbiBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgaWYgbVsyXS5jbHNzID09IGNsc3NcbiAgICAgICAgICAgICAgICByZXR1cm4gbVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBuZXh0TWV0YU9mU2FtZUNsYXNzOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBsaSBpbiBbbWV0YVswXSsxLi4uQGVkaXRvci5udW1MaW5lcygpXVxuICAgICAgICAgICAgZm9yIG0gaW4gQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgICAgICBpZiBtWzJdLmNsc3MgPT0gbWV0YVsyXS5jbHNzXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIG1ldGFzT2ZDbGFzczogKGNsc3MpIC0+XG4gICAgICAgIFxuICAgICAgICBtZXRhcyA9IFtdXG4gICAgICAgIGZvciBsaSBpbiBbMC4uLkBlZGl0b3IubnVtTGluZXMoKV1cbiAgICAgICAgICAgIGZvciBtIGluIEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICAgICAgaWYgbVsyXS5jbHNzID09IGNsc3NcbiAgICAgICAgICAgICAgICAgICAgbWV0YXMucHVzaCBtXG4gICAgICAgIG1ldGFzXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAgICAwMDBcblxuICAgIG9uTGluZXNTaG93bjogKHRvcCwgYm90LCBudW0pID0+XG4gICAgICAgICMga2xvZyAnc2hvd24nIHRvcCwgbnVtLCBAbWV0YXMubGVuZ3RoXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc1xuICAgICAgICAgICAgQGRlbERpdiBtZXRhXG4gICAgICAgICAgICBpZiB0b3AgPD0gbWV0YVswXSA8PSBib3RcbiAgICAgICAgICAgICAgICBAYWRkRGl2IG1ldGFcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25MaW5lc1NoaWZ0ZWQ6ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIGlmIG51bSA+IDBcbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIHRvcC1udW0sIHRvcC0xLCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAZGVsRGl2IG1ldGFcblxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgYm90LW51bSsxLCBib3QsIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBhZGREaXYgbWV0YVxuICAgICAgICBlbHNlXG5cbiAgICAgICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGJvdCsxLCBib3QtbnVtLCBAbWV0YXNcbiAgICAgICAgICAgICAgICBAZGVsRGl2IG1ldGFcblxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgdG9wLCB0b3AtbnVtLTEsIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBhZGREaXYgbWV0YVxuXG4gICAgICAgIEB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleCB0b3BcblxuICAgIHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgc2l6ZSA9IEBlZGl0b3Iuc2l6ZVxuICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgQGVkaXRvci5zY3JvbGwuYm90LCBAbWV0YXNcbiAgICAgICAgICAgIEB1cGRhdGVQb3MgbWV0YVxuXG4gICAgb25MaW5lSW5zZXJ0ZWQ6IChsaSkgPT5cblxuICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgQGVkaXRvci5udW1MaW5lcygpLCBAbWV0YXNcbiAgICAgICAgICAgIEBtb3ZlTGluZU1ldGEgbWV0YSwgMVxuXG4gICAgICAgIEB1cGRhdGVQb3NpdGlvbnNCZWxvd0xpbmVJbmRleCBsaVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIG9uTGluZURlbGV0ZWQ6IChsaSkgPT5cblxuICAgICAgICB3aGlsZSBtZXRhID0gXy5sYXN0IEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICBAZGVsTWV0YSBtZXRhXG5cbiAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIEBlZGl0b3IubnVtTGluZXMoKSwgQG1ldGFzXG4gICAgICAgICAgICBAbW92ZUxpbmVNZXRhIG1ldGEsIC0xXG5cbiAgICAgICAgQHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4IGxpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIG9uQ2xlYXJMaW5lczogPT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNcbiAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuICAgICAgICBAY2xlYXIoKVxuXG4gICAgY2xlYXI6ID0+IFxuXG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9IFwiXCJcbiAgICAgICAgQG1ldGFzID0gW11cbiAgICAgICAgQGxpbmVNZXRhcyA9IHt9XG5cbiAgICBkZWxNZXRhOiAobWV0YSkgLT5cbiAgICAgICAgaWYgbm90IG1ldGE/XG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdkZWwgbm8gbWV0YT8nXG4gICAgICAgIF8ucHVsbCBAbGluZU1ldGFzW21ldGFbMF1dLCBtZXRhXG4gICAgICAgIF8ucHVsbCBAbWV0YXMsIG1ldGFcbiAgICAgICAgQGRlbERpdiBtZXRhXG5cbiAgICBkZWxDbGFzczogKGNsc3MpIC0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gXy5jbG9uZSBAbWV0YXNcbiAgICAgICAgICAgIGNsc3NzID0gbWV0YT9bMl0/LmNsc3M/LnNwbGl0ICcgJ1xuICAgICAgICAgICAgaWYgbm90IGVtcHR5KGNsc3NzKSBhbmQgY2xzcyBpbiBjbHNzc1xuICAgICAgICAgICAgICAgIEBkZWxNZXRhIG1ldGFcblxubW9kdWxlLmV4cG9ydHMgPSBNZXRhXG4iXX0=
//# sourceURL=../../coffee/editor/meta.coffee