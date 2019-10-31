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
        if (!meta[2].no_x && meta.fallback) {
            meta[1][1] = meta[1][0] + meta.fallback.length + 1;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMEZBQUE7SUFBQTs7O0FBUUEsTUFBd0UsT0FBQSxDQUFRLEtBQVIsQ0FBeEUsRUFBRSxlQUFGLEVBQVEseUJBQVIsRUFBbUIsbUJBQW5CLEVBQTJCLGlCQUEzQixFQUFrQyxpQkFBbEMsRUFBeUMsZUFBekMsRUFBK0MsZUFBL0MsRUFBcUQsZUFBckQsRUFBMkQsV0FBM0QsRUFBK0QsU0FBL0QsRUFBa0U7O0FBRWxFLE1BQUEsR0FBUyxPQUFBLENBQVEsaUJBQVI7O0FBQ1QsSUFBQSxHQUFTLE9BQUEsQ0FBUSxlQUFSOztBQUVIO0lBRUMsY0FBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7O1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFFYixJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxPQUFGLEVBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFsQjtRQUVQLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGNBQVgsRUFBMEIsSUFBQyxDQUFBLGNBQTNCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUEwQixJQUFDLENBQUEsWUFBM0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQTBCLElBQUMsQ0FBQSxjQUEzQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGFBQVgsRUFBMEIsSUFBQyxDQUFBLGFBQTNCO1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUEwQixJQUFDLENBQUEsWUFBM0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQTBCLElBQUMsQ0FBQSxjQUEzQjtRQUVBLElBQUMsQ0FBQSxJ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LEdBQVUsU0FBQyxJQUFEO0FBRU4sWUFBQTtBQUFBO0FBQUE7YUFBQSxzQ0FBQTs7WUFDSSxLQUFBLDhFQUFzQixDQUFFLEtBQWhCLENBQXNCLEdBQXRCO1lBQ1IsSUFBRyxDQUFJLEtBQUEsQ0FBTSxLQUFOLENBQUosSUFBcUIsYUFBUSxLQUFSLEVBQUEsSUFBQSxNQUF4Qjs2QkFDSSxJQUFDLENBQUEsT0FBRCxDQUFTLElBQVQsR0FESjthQUFBLE1BQUE7cUNBQUE7O0FBRko7O0lBRk07Ozs7OztBQU9kLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDBcbjAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgc3RvcEV2ZW50LCBrZXJyb3IsIHNsYXNoLCBlbXB0eSwgZWxlbSwga3Bvcywga2xvZywgZnMsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxucmFuZ2VzID0gcmVxdWlyZSAnLi4vdG9vbHMvcmFuZ2VzJ1xuRmlsZSAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcblxuY2xhc3MgTWV0YVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgQG1ldGFzICAgICA9IFtdICMgWyBbbGluZUluZGV4LCBbc3RhcnQsIGVuZF0sIHtocmVmOiAuLi59XSwgLi4uIF1cbiAgICAgICAgQGxpbmVNZXRhcyA9IHt9ICMgeyBsaW5lSW5kZXg6IFsgbGluZU1ldGEsIC4uLiBdLCAuLi4gfVxuXG4gICAgICAgIEBlbGVtID0kIFwiLm1ldGFcIiBAZWRpdG9yLnZpZXdcblxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lQXBwZW5kZWQnIEBvbkxpbmVBcHBlbmRlZFxuICAgICAgICBAZWRpdG9yLm9uICdjbGVhckxpbmVzJyAgIEBvbkNsZWFyTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUluc2VydGVkJyBAb25MaW5lSW5zZXJ0ZWRcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZURlbGV0ZWQnICBAb25MaW5lRGVsZXRlZFxuXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2hvd24nICAgQG9uTGluZXNTaG93blxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1NoaWZ0ZWQnIEBvbkxpbmVzU2hpZnRlZFxuXG4gICAgICAgIEBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIEBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnICAgQG9uTW91c2VVcFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIHNldE1ldGFQb3M6IChtZXRhLCB0eCwgdHkpIC0+XG5cbiAgICAgICAgaWYgbWV0YVsyXS5ub194XG4gICAgICAgICAgICBtZXRhWzJdLmRpdj8uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVZKCN7dHl9cHgpXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbWV0YVsyXS5kaXY/LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKCN7dHh9cHgsI3t0eX1weClcIlxuXG4gICAgdXBkYXRlUG9zOiAobWV0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHNpemUgPSBAZWRpdG9yLnNpemVcbiAgICAgICAgdHggPSBzaXplLmNoYXJXaWR0aCAqICBtZXRhWzFdWzBdICsgc2l6ZS5vZmZzZXRYICsgKG1ldGFbMl0ueE9mZnNldCA/IDApXG4gICAgICAgIHR5ID0gc2l6ZS5saW5lSGVpZ2h0ICogKG1ldGFbMF0gLSBAZWRpdG9yLnNjcm9sbC50b3ApICsgKG1ldGFbMl0ueU9mZnNldCA/IDApXG4gICAgICAgIEBzZXRNZXRhUG9zIG1ldGEsIHR4LCB0eVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgICAgMFxuXG4gICAgYWRkRGl2OiAobWV0YSkgLT5cblxuICAgICAgICBzaXplID0gQGVkaXRvci5zaXplXG4gICAgICAgIHN3ID0gc2l6ZS5jaGFyV2lkdGggKiAobWV0YVsxXVsxXS1tZXRhWzFdWzBdKVxuICAgICAgICBsaCA9IHNpemUubGluZUhlaWdodFxuXG4gICAgICAgIGRpdiA9IGVsZW0gY2xhc3M6IFwibWV0YSAje21ldGFbMl0uY2xzcyA/ICcnfVwiXG4gICAgICAgIGRpdi5pbm5lckhUTUwgPSBtZXRhWzJdLmh0bWwgaWYgbWV0YVsyXS5odG1sP1xuXG4gICAgICAgIG1ldGFbMl0uZGl2ID0gZGl2XG4gICAgICAgIGRpdi5tZXRhID0gbWV0YVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IG1ldGFbMl0ubm9faFxuICAgICAgICAgICAgZGl2LnN0eWxlLmhlaWdodCA9IFwiI3tsaH1weFwiXG5cbiAgICAgICAgaWYgbWV0YVsyXS5zdHlsZT9cbiAgICAgICAgICAgIGZvciBrLHYgb2YgbWV0YVsyXS5zdHlsZVxuICAgICAgICAgICAgICAgIGRpdi5zdHlsZVtrXSA9IHZcblxuICAgICAgICBpZiBub3QgbWV0YVsyXS5ub194XG4gICAgICAgICAgICBkaXYuc3R5bGUud2lkdGggPSBcIiN7c3d9cHhcIlxuXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIGRpdlxuXG4gICAgICAgIEB1cGRhdGVQb3MgbWV0YVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAgICAgICAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgICAgIDBcblxuICAgIGRlbERpdjogKG1ldGEpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gbGluZSBtZXRhPycgbWV0YSBpZiBub3QgbWV0YT9bMl0/XG4gICAgICAgIG1ldGFbMl0uZGl2Py5yZW1vdmUoKVxuICAgICAgICBtZXRhWzJdLmRpdiA9IG51bGxcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhZGQ6IChtZXRhKSAtPlxuXG4gICAgICAgIGxpbmVNZXRhID0gQGFkZExpbmVNZXRhIFttZXRhLmxpbmUsIFttZXRhLnN0YXJ0ID8gMCwgbWV0YS5lbmQgPyAwXSwgbWV0YV1cblxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC50b3AgPD0gbWV0YS5saW5lIDw9IEBlZGl0b3Iuc2Nyb2xsLmJvdFxuICAgICAgICAgICAgQGFkZERpdiBsaW5lTWV0YVxuICAgICAgICAgICAgQGVkaXRvci5udW1iZXJzLnVwZGF0ZU1ldGEgbWV0YS5saW5lXG4gICAgICAgICAgICBcbiAgICAgICAgbGluZU1ldGFcblxuICAgIHVwZGF0ZTogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgbWV0YVsyXS5ub194IGFuZCBtZXRhLmZhbGxiYWNrXG4gICAgICAgICAgICBtZXRhWzFdWzFdID0gbWV0YVsxXVswXSArIG1ldGEuZmFsbGJhY2subGVuZ3RoKzFcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IubnVtYmVycy51cGRhdGVDb2xvciBtZXRhLmxpbmVcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMCAgICAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgIFxuICAgIGFkZERpZmZNZXRhOiAobWV0YSkgLT5cblxuICAgICAgICBtZXRhLmRpZmYgPSB0cnVlXG4gICAgICAgIEBhZGROdW1iZXJNZXRhIG1ldGFcbiAgICAgICAgXG4gICAgYWRkTnVtYmVyTWV0YTogKG1ldGEpIC0+XG5cbiAgICAgICAgbWV0YS5ub194ID0gdHJ1ZVxuICAgICAgICBsaW5lTWV0YSA9IEBhZGRMaW5lTWV0YSBbbWV0YS5saW5lLCBbMCwgMF0sIG1ldGFdXG5cbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwudG9wIDw9IG1ldGEubGluZSA8PSBAZWRpdG9yLnNjcm9sbC5ib3RcbiAgICAgICAgICAgIEBhZGREaXYgbGluZU1ldGFcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSAtPiBAZG93blBvcyA9IGtwb3MgZXZlbnRcbiAgICBcbiAgICBvbk1vdXNlVXA6IChldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIDUgPCBAZG93blBvcz8uZGlzdCBrcG9zIGV2ZW50XG4gICAgICAgICAgICBkZWxldGUgQGRvd25Qb3NcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIFxuICAgICAgICBkZWxldGUgQGRvd25Qb3NcbiAgICAgICAgaWYgZXZlbnQudGFyZ2V0Lm1ldGE/WzJdLmNsaWNrP1xuICAgICAgICAgICAgcmVzdWx0ID0gZXZlbnQudGFyZ2V0Lm1ldGE/WzJdLmNsaWNrIGV2ZW50LnRhcmdldC5tZXRhLCBldmVudFxuICAgICAgICAgICAgIyBzdG9wRXZlbnQgZXZlbnQgaWYgcmVzdWx0ICE9ICd1bmhhbmRsZWQnXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGFwcGVuZDogKG1ldGEpIC0+XG4gICAgICAgIFxuICAgICAgICBsaW5lTWV0YSA9IEBhZGRMaW5lTWV0YSBbQGVkaXRvci5udW1MaW5lcygpLCBbMCwgMF0sIG1ldGFdXG4gICAgICAgIGxpbmVNZXRhXG5cbiAgICBhZGRMaW5lTWV0YTogKGxpbmVNZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciAnaW52YWxpZCBsaW5lIG1ldGE/JyBsaW5lTWV0YSBpZiBub3QgbGluZU1ldGE/WzJdP1xuICAgICAgICBcbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0gPz0gW11cbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0ucHVzaCBsaW5lTWV0YVxuICAgICAgICBAbWV0YXMucHVzaCBsaW5lTWV0YVxuICAgICAgICBsaW5lTWV0YVxuXG4gICAgbW92ZUxpbmVNZXRhOiAobGluZU1ldGEsIGQpIC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnaW52YWxpZCBtb3ZlPycgbGluZU1ldGEsIGQgaWYgbm90IGxpbmVNZXRhPyBvciBkID09IDBcbiAgICAgICAgXG4gICAgICAgIF8ucHVsbCBAbGluZU1ldGFzW2xpbmVNZXRhWzBdXSwgbGluZU1ldGFcbiAgICAgICAgZGVsZXRlIEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dIGlmIGVtcHR5IEBsaW5lTWV0YXNbbGluZU1ldGFbMF1dXG4gICAgICAgIGxpbmVNZXRhWzBdICs9IGRcbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0gPz0gW11cbiAgICAgICAgQGxpbmVNZXRhc1tsaW5lTWV0YVswXV0ucHVzaCBsaW5lTWV0YVxuICAgICAgICBAdXBkYXRlUG9zIGxpbmVNZXRhXG4gICAgICAgIFxuICAgIG9uTGluZUFwcGVuZGVkOiAoZSkgPT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBAbWV0YXNBdExpbmVJbmRleCBlLmxpbmVJbmRleFxuICAgICAgICAgICAgbWV0YVsxXVsxXSA9IGUudGV4dC5sZW5ndGggaWYgbWV0YVsxXVsxXSBpcyAwXG5cbiAgICBtZXRhc0F0TGluZUluZGV4OiAobGkpIC0+IEBsaW5lTWV0YXNbbGldID8gW11cbiAgICAgICAgXG4gICAgaHJlZkF0TGluZUluZGV4OiAgKGxpKSAtPlxuXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc0F0TGluZUluZGV4IGxpXG4gICAgICAgICAgICByZXR1cm4gbWV0YVsyXS5ocmVmIGlmIG1ldGFbMl0uaHJlZj9cblxuICAgIG5leHRNZXRhT2ZTYW1lQ2xhc3M6IChtZXRhKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGxpIGluIFttZXRhWzBdKzEuLi5AZWRpdG9yLm51bUxpbmVzKCldXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWV0YXNBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgICAgIGlmIG1bMl0uY2xzcyA9PSBtZXRhWzJdLmNsc3NcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1cbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMCAgIDAwMFxuXG4gICAgb25MaW5lc1Nob3duOiAodG9wLCBib3QsIG51bSkgPT5cbiAgICAgICAgIyBrbG9nICdzaG93bicgdG9wLCBudW0sIEBtZXRhcy5sZW5ndGhcbiAgICAgICAgZm9yIG1ldGEgaW4gQG1ldGFzXG4gICAgICAgICAgICBAZGVsRGl2IG1ldGFcbiAgICAgICAgICAgIGlmIHRvcCA8PSBtZXRhWzBdIDw9IGJvdFxuICAgICAgICAgICAgICAgIEBhZGREaXYgbWV0YVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkxpbmVzU2hpZnRlZDogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgdG9wLW51bSwgdG9wLTEsIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBib3QtbnVtKzEsIGJvdCwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGFkZERpdiBtZXRhXG4gICAgICAgIGVsc2VcblxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgYm90KzEsIGJvdC1udW0sIEBtZXRhc1xuICAgICAgICAgICAgICAgIEBkZWxEaXYgbWV0YVxuXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyB0b3AsIHRvcC1udW0tMSwgQG1ldGFzXG4gICAgICAgICAgICAgICAgQGFkZERpdiBtZXRhXG5cbiAgICAgICAgQHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4IHRvcFxuXG4gICAgdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICBzaXplID0gQGVkaXRvci5zaXplXG4gICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBAZWRpdG9yLnNjcm9sbC5ib3QsIEBtZXRhc1xuICAgICAgICAgICAgQHVwZGF0ZVBvcyBtZXRhXG5cbiAgICBvbkxpbmVJbnNlcnRlZDogKGxpKSA9PlxuXG4gICAgICAgIGZvciBtZXRhIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBAZWRpdG9yLm51bUxpbmVzKCksIEBtZXRhc1xuICAgICAgICAgICAgQG1vdmVMaW5lTWV0YSBtZXRhLCAxXG5cbiAgICAgICAgQHVwZGF0ZVBvc2l0aW9uc0JlbG93TGluZUluZGV4IGxpXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgb25MaW5lRGVsZXRlZDogKGxpKSA9PlxuXG4gICAgICAgIHdoaWxlIG1ldGEgPSBfLmxhc3QgQG1ldGFzQXRMaW5lSW5kZXggbGlcbiAgICAgICAgICAgIEBkZWxNZXRhIG1ldGFcblxuICAgICAgICBmb3IgbWV0YSBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgQGVkaXRvci5udW1MaW5lcygpLCBAbWV0YXNcbiAgICAgICAgICAgIEBtb3ZlTGluZU1ldGEgbWV0YSwgLTFcblxuICAgICAgICBAdXBkYXRlUG9zaXRpb25zQmVsb3dMaW5lSW5kZXggbGlcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25DbGVhckxpbmVzOiA9PlxuXG4gICAgICAgIGZvciBtZXRhIGluIEBtZXRhc1xuICAgICAgICAgICAgQGRlbERpdiBtZXRhXG4gICAgICAgIEBjbGVhcigpXG5cbiAgICBjbGVhcjogPT4gXG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gXCJcIlxuICAgICAgICBAbWV0YXMgPSBbXVxuICAgICAgICBAbGluZU1ldGFzID0ge31cblxuICAgIGRlbE1ldGE6IChtZXRhKSAtPlxuICAgICAgICBpZiBub3QgbWV0YT9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ2RlbCBubyBtZXRhPydcbiAgICAgICAgXy5wdWxsIEBsaW5lTWV0YXNbbWV0YVswXV0sIG1ldGFcbiAgICAgICAgXy5wdWxsIEBtZXRhcywgbWV0YVxuICAgICAgICBAZGVsRGl2IG1ldGFcblxuICAgIGRlbENsYXNzOiAoY2xzcykgLT5cblxuICAgICAgICBmb3IgbWV0YSBpbiBfLmNsb25lIEBtZXRhc1xuICAgICAgICAgICAgY2xzc3MgPSBtZXRhP1syXT8uY2xzcz8uc3BsaXQgJyAnXG4gICAgICAgICAgICBpZiBub3QgZW1wdHkoY2xzc3MpIGFuZCBjbHNzIGluIGNsc3NzXG4gICAgICAgICAgICAgICAgQGRlbE1ldGEgbWV0YVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1ldGFcbiJdfQ==
//# sourceURL=../../coffee/editor/meta.coffee