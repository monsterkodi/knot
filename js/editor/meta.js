// koffee 1.12.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJtZXRhLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw0REFBQTtJQUFBOzs7QUFRQSxNQUEwQyxPQUFBLENBQVEsS0FBUixDQUExQyxFQUFFLGlCQUFGLEVBQVMsZUFBVCxFQUFlLGVBQWYsRUFBcUIsV0FBckIsRUFBeUIsbUJBQXpCLEVBQWlDLFNBQWpDLEVBQW9DOztBQUVwQyxNQUFBLEdBQVMsT0FBQSxDQUFRLGlCQUFSOztBQUNULElBQUEsR0FBUyxPQUFBLENBQVEsZUFBUjs7QUFFSDtJQUVDLGNBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOzs7Ozs7OztRQUVBLElBQUMsQ0FBQSxLQUFELEdBQWE7UUFDYixJQUFDLENBQUEsU0FBRCxHQUFhO1FBRWIsSUFBQyxDQUFBLElBQUQsR0FBTyxDQUFBLENBQUUsT0FBRixFQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBbEI7UUFFUCxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQTBCLElBQUMsQ0FBQSxjQUEzQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBMEIsSUFBQyxDQUFBLFlBQTNCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FBWCxFQUEwQixJQUFDLENBQUEsY0FBM0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxhQUFYLEVBQTBCLElBQUMsQ0FBQSxhQUEzQjtRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBMEIsSUFBQyxDQUFBLFlBQTNCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FBWCxFQUEwQixJQUFDLENBQUEsY0FBM0I7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLFdB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MDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDBcbjAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgZW1wdHksIGVsZW0sIGtwb3MsIHN3LCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxucmFuZ2VzID0gcmVxdWlyZSAnLi4vdG9vbHMvcmFuZ2VzJ1xuRmlsZSAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcblxuY2xhc3MgTWV0YVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgQG1ldGFzICAgICA9IFtdICMgWyBbbGluZUluZGV4LCBbc3RhcnQsIGVuZF0sIHtocmVmOiAuLi59XSwgLi4uIF1cbiAgICAgICAgQGxpbmVNZXRhcyA9IHt9ICMgeyBsaW5lSW5kZXg6IFsgbGluZU1ldGEsIC4uLiBdLCAuLi4gfVxuXG4gICAgICAgIEBlbGVtID0kIFwiLm1ldGFcIiBAZWRpdG9yLnZpZXdcblxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lQXBwZW5kZWQnIEBvbkxpbmVBcHBlbmRlZFxuICAgICAgICBAZWRpdG9yLm9uICdjbGVhckxpbmVzJyAgIEBvbkNsZWFyTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUluc2VydGVkJyBAb25MaW5lSW5zZXJ0ZWRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZURlbGV0ZWQnICBAb25MaW5lRGVsZXRlZFxuXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2hvd24nICAgQG9uTGluZXNTaG93blxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1NoaWZ0ZWQnIEBvbkxpbmVzU2hpZnRlZFxuXG4gICAgICAgIEBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIEBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnICAgQG9uTW91c2VVcFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIHNldE1ldGFQb3M6IChtZXRhLCB0eCwgdHkpIC0+XG5cbiAgICAgICAgaWYgbWV0YVsyXS5ub194XG4gICAgICAgICAgICBtZXRhWzJdLmRpdj8uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVZKCN7dHl9cHgpXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbWV0YVsyXS5kaXY/LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKCN7dHh9cHgsI3t0eX1weClcIlxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAgICAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgICAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICB1cGRhdGVQb3M6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgc2l6ZSA9IEBlZGl0b3Iuc2l6ZVxuICAgICAgICB0eCA9IHNpemUuY2hhcldpZHRoICogIG1ldGFbMV1bMF0gKyBzaXplLm9mZnNldFggKyAobWV0YVsyXS54T2Zmc2V0ID8gMClcbiAgICAgICAgdHkgPSBzaXplLmxpbmVIZWlnaHQgKiAobWV0YVswXSAtIEBlZGl0b3Iuc2Nyb2xsLnRvcCkgKyAobWV0YVsyXS55T2Zmc2V0ID8gMClcbiAgICAgICAgQHNldE1ldGFQb3MgbWV0YSwgdHgsIHR5XG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMCAgICAwMDAgICAgICAwXG5cbiAgICBhZGREaXY6IChtZXRhKSAtPlxuXG4gICAgICAgIHNpemUgPSBAZWRpdG9yLnNpemVcbiAgICAgICAgc3cgPSBzaXplLmNoYXJXaWR0aCAqIChtZXRhWzFdWzFdLW1ldGFbMV1bMF0pXG4gICAgICAgIGxoID0gc2l6ZS5saW5lSGVpZ2h0XG5cbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogXCJtZXRhICN7bWV0YVsyXS5jbHNzID8gJyd9XCJcbiAgICAgICAgZGl2LmlubmVySFRNTCA9IG1ldGFbMl0uaHRtbCBpZiBtZXRhWzJdLmh0bWw/XG5cbiAgICAgICAgbWV0YVsyXS5kaXYgPSBkaXZcbiAgICAgICAgZGl2Lm1ldGEgPSBtZXRhXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgbWV0YVsyXS5ub19oXG4gICAgICAgICAgICBkaXYuc3R5bGUuaGVpZ2h0ID0gXCIje2xofXB4XCJcblxuICAgICAgICBpZiBtZXRhWzJdLnN0eWxlP1xuICAgICAgICAgICAgZm9yIGssdiBvZiBtZXRhWzJdLnN0eWxlXG4gICAgICAgICAgICAgICAgZGl2LnN0eWxlW2tdID0gdlxuXG4gICAgICAgIGlmIG5vdCBtZXRhWzJdLm5vX3hcbiAgICAgICAgICAgIGRpdi5zdHlsZS53aWR0aCA9IFwiI3tzd31weFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRpdi5zdHlsZS53aWR0aCA9IFwiI3tAZWRpdG9yLnNpemUubnVtYmVyc1dpZHRofXB4XCJcblxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBkaXZcblxuICAgICAgICBAdXBkYXRlUG9zIG1ldGFcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAgICAwXG5cbiAgICBkZWxEaXY6IChtZXRhKSAtPlxuXG4gICAgICAgIHJldHVybiBrZXJyb3IgJ25vIGxpbmUgbWV0YT8nIG1ldGEgaWYgbm90IG1ldGE/WzJdP1xuICAgICAgICBtZXRhWzJdLmRpdj8ucmVtb3ZlKClcbiAgICAgICAgbWV0YVsyXS5kaXYgPSBudWxsXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYWRkOiAobWV0YSkgLT5cblxuICAgICAgICBsaW5lTWV0YSA9IEBhZGRMaW5lTWV0YSBbbWV0YS5saW5lLCBbbWV0YS5zdGFydCA/IDAsIG1ldGEuZW5kID8gMF0sIG1ldGFdXG5cbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwudG9wIDw9IG1ldGEubGluZSA8PSBAZWRpdG9yLnNjcm9sbC5ib3RcbiAgICAgICAgICAgIEBhZGREaXYgbGluZU1ldGFcbiAgICAgICAgICAgIEBlZGl0b3IubnVtYmVycy51cGRhdGVNZXRhIG1ldGEubGluZVxuICAgICAgICAgICAgXG4gICAgICAgIGxpbmVNZXRhXG5cbiAgICB1cGRhdGU6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IG1ldGFbMl0ubm9feFxuICAgICAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZSBtZXRhWzBdXG4gICAgICAgICAgICBtZXRhWzFdWzFdID0gbWV0YVsxXVswXSArIGxpbmUubGVuZ3RoKzFcbiAgICAgICAgICAgIG1ldGFbMl0uZW5kID0gbWV0YVsxXVsxXVxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5udW1iZXJzLnVwZGF0ZUNvbG9yIG1ldGFbMF1cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpIC0+IEBkb3duUG9zID0ga3BvcyBldmVudFxuICAgIFxuICAgIG9uTW91c2VVcDogKGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgNSA8IEBkb3duUG9zPy5kaXN0IGtwb3MgZXZlbnRcbiAgICAgICAgICAgIGRlbGV0ZSBAZG93blBvc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAZG93blBvc1xuICAgICAgICBpZiBldmVudC50YXJnZXQubWV0YT9bMl0uY2xpY2s/XG4gICAgICAgICAgICByZXN1bHQgPSBldmVudC50YXJnZXQubWV0YT9bMl0uY2xpY2sgZXZlbnQudGFyZ2V0Lm1ldGEsIGV2ZW50XG4gICAgICAgICAgICAjIHN0b3BFdmVudCBldmVudCBpZiByZXN1bHQgIT0gJ3VuaGFuZGxlZCdcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgYXBwZW5kOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIGxpbmVNZXRhID0gQGFkZExpbmVNZXRhIFtAZWRpdG9yLm51bUxpbmVzKCksIFswLCAwXSwgbWV0YV1cbiAgICAgICAgbGluZU1ldGFcblxuICAgIGFkZExpbmVNZXRhOiAobGluZU1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yICdpbnZhbGlkIGxpbmUgbWV0YT8nIGxpbmVNZXRhIGlmIG5vdCBsaW5lTWV0YT9bMl0/XG4gICAgICAgIFxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSA/PSBbXVxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXS5wdXNoIGxpbmVNZXRhXG4gICAgICAgIEBtZXRhcy5wdXNoIGxpbmVNZXRhXG4gICAgICAgIGxpbmVNZXRhXG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBtb3ZlTGluZU1ldGE6IChsaW5lTWV0YSwgZCkgLT5cblxuICAgICAgICByZXR1cm4ga2Vycm9yICdpbnZhbGlkIG1vdmU/JyBsaW5lTWV0YSwgZCBpZiBub3QgbGluZU1ldGE/IG9yIGQgPT0gMFxuICAgICAgICBcbiAgICAgICAgXy5wdWxsIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dLCBsaW5lTWV0YVxuICAgICAgICBkZWxldGUgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0gaWYgZW1wdHkgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV1cbiAgICAgICAgbGluZU1ldGFbMF0gKz0gZFxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSA/PSBbXVxuICAgICAgICBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXS5wdXNoIGxpbmVNZXRhXG4gICAgICAgIEB1cGRhdGVQb3MgbGluZU1ldGFcbiAgICAgICAgQGVkaXRvci5udW1iZXJzLnVwZGF0ZUNvbG9yIGxpbmVNZXRhWzBdXG4gICAgICAgIFxuICAgIG9uTGluZUFwcGVuZGVkOiAoZSkgPT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNBdExpbmVJbmRleCBlLmxpbmVJbmRleFxuICAgICAgICAgICAgbWV0YVsxXVsxXSA9IGUudGV4dC5sZW5ndGggaWYgbWV0YVsxXVsxXSBpcyAwXG5cbiAgICBtZXRhc0F0TGluZUluZGV4OiAobGkpIC0+IEBsaW5lTWV0YXNbbGldID8gW11cbiAgICBtZXRhQXRMaW5lSW5kZXg6ICAobGkpIC0+IEBsaW5lTWV0YXNbbGldP1swXVxuICAgICAgICBcbiAgICBocmVmQXRMaW5lSW5kZXg6ICAobGkpIC0+XG5cbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgIHJldHVybiBtZXRhWzJdLmhyZWYgaWYgbWV0YVsyXS5ocmVmP1xuXG4gICAgcHJldk1ldGFPZkNsYXNzOiAoY2xzcywgbGkpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgaW5kZXggaW4gW2xpLTEuLjBdXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWV0YXNBdExpbmVJbmRleCBpbmRleFxuICAgICAgICAgICAgICAgIGlmIG1bMl0uY2xzcyA9PSBjbHNzXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIG5leHRNZXRhT2ZDbGFzczogKGNsc3MsIGxpKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGluZGV4IGluIFtsaSsxLi4uQGVkaXRvci5udW1MaW5lcygpXVxuICAgICAgICAgICAgZm9yIG0gaW4gQG1ldGFzQXRMaW5lSW5kZXggaW5kZXhcbiAgICAgICAgICAgICAgICBpZiBtWzJdLmNsc3MgPT0gY2xzc1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbVxuXG4gICAgbWV0YU9mQ2xhc3NBdExpbmU6IChjbHNzLCBsaSkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBtIGluIEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICBpZiBtWzJdLmNsc3MgPT0gY2xzc1xuICAgICAgICAgICAgICAgIHJldHVybiBtXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIG5leHRNZXRhT2ZTYW1lQ2xhc3M6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGxpIGluIFttZXRhWzBdKzEuLi5AZWRpdG9yLm51bUxpbmVzKCldXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgICAgIGlmIG1bMl0uY2xzcyA9PSBtZXRhWzJdLmNsc3NcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgbWV0YXNPZkNsYXNzOiAoY2xzcykgLT5cbiAgICAgICAgXG4gICAgICAgIG1ldGFzID0gW11cbiAgICAgICAgZm9yIGxpIGluIFswLi4uQGVkaXRvci5udW1MaW5lcygpXVxuICAgICAgICAgICAgZm9yIG0gaW4gQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgICAgICBpZiBtWzJdLmNsc3MgPT0gY2xzc1xuICAgICAgICAgICAgICAgICAgICBtZXRhcy5wdXNoIG1cbiAgICAgICAgbWV0YXNcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMCAgIDAwMFxuXG4gICAgb25MaW5lc1Nob3duOiAodG9wLCBib3QsIG51bSkgPT5cbiAgICAgICAgIyBrbG9nICdzaG93bicgdG9wLCBudW0sIEBtZXRhcy5sZW5ndGhcbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzXG4gICAgICAgICAgICBAZGVsRGl2IG1ldGFcbiAgICAgICAgICAgIGlmIHRvcCA8PSBtZXRhWzBdIDw9IGJvdFxuICAgICAgICAgICAgICAgIEBhZGREaXYgbWV0YVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkxpbmVzU2hpZnRlZDogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgdG9wLW51bSwgdG9wLTEsIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBib3QtbnVtKzEsIGJvdCwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGFkZERpdiBtZXRhXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgYm90KzEsIGJvdC1udW0sIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyB0b3AsIHRvcC1udW0tMSwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGFkZERpdiBtZXRhXG5cbiAgICAgICAgQHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4IHRvcFxuXG4gICAgdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICBzaXplID0gQGVkaXRvci5zaXplXG4gICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBAZWRpdG9yLnNjcm9sbC5ib3QsIEBtZXRhc1xuICAgICAgICAgICAgQHVwZGF0ZVBvcyBtZXRhXG5cbiAgICBvbkxpbmVJbnNlcnRlZDogKGxpKSA9PlxuXG4gICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBAZWRpdG9yLm51bUxpbmVzKCksIEBtZXRhc1xuICAgICAgICAgICAgQG1vdmVMaW5lTWV0YSBtZXRhLCAxXG5cbiAgICAgICAgQHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4IGxpXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgb25MaW5lRGVsZXRlZDogKGxpKSA9PlxuXG4gICAgICAgIHdoaWxlIG1ldGEgPSBfLmxhc3QgQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgIEBkZWxNZXRhIG1ldGFcblxuICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgQGVkaXRvci5udW1MaW5lcygpLCBAbWV0YXNcbiAgICAgICAgICAgIEBtb3ZlTGluZU1ldGEgbWV0YSwgLTFcblxuICAgICAgICBAdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXggbGlcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25DbGVhckxpbmVzOiA9PlxuXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc1xuICAgICAgICAgICAgQGRlbERpdiBtZXRhXG4gICAgICAgIEBjbGVhcigpXG5cbiAgICBjbGVhcjogPT4gXG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBAbWV0YXMgPSBbXVxuICAgICAgICBAbGluZU1ldGFzID0ge31cblxuICAgIGRlbE1ldGE6IChtZXRhKSAtPlxuICAgICAgICBpZiBub3QgbWV0YT9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ2RlbCBubyBtZXRhPydcbiAgICAgICAgXy5wdWxsIEBsaW5lTWV0YXNbbWV0YVswXV0sIG1ldGFcbiAgICAgICAgXy5wdWxsIEBtZXRhcywgbWV0YVxuICAgICAgICBAZGVsRGl2IG1ldGFcblxuICAgIGRlbENsYXNzOiAoY2xzcykgLT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBfLmNsb25lIEBtZXRhc1xuICAgICAgICAgICAgY2xzc3MgPSBtZXRhP1syXT8uY2xzcz8uc3BsaXQgJyAnXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkoY2xzc3MpIGFuZCBjbHNzIGluIGNsc3NzXG4gICAgICAgICAgICAgICAgQGRlbE1ldGEgbWV0YVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1ldGFcbiJdfQ==
//# sourceURL=../../coffee/editor/meta.coffee