// koffee 1.4.0

/*
00     00  000  000   000  000  00     00   0000000   00000000
000   000  000  0000  000  000  000   000  000   000  000   000
000000000  000  000 0 000  000  000000000  000000000  00000000
000 0 000  000  000  0000  000  000 0 000  000   000  000
000   000  000  000   000  000  000   000  000   000  000
 */
var MapScroll, Minimap, clamp, colors, drag, elem, getStyle, klog, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), getStyle = ref.getStyle, clamp = ref.clamp, elem = ref.elem, drag = ref.drag, klog = ref.klog;

MapScroll = require('./mapscroll');

colors = require('../tools/colors');

Minimap = (function() {
    function Minimap(editor) {
        var minimapWidth, ref1, ref2;
        this.editor = editor;
        this.clearAll = bind(this.clearAll, this);
        this.onScroll = bind(this.onScroll, this);
        this.onEditorScroll = bind(this.onEditorScroll, this);
        this.onEditorViewHeight = bind(this.onEditorViewHeight, this);
        this.onEditorNumLines = bind(this.onEditorNumLines, this);
        this.onStart = bind(this.onStart, this);
        this.onDrag = bind(this.onDrag, this);
        this.onChanged = bind(this.onChanged, this);
        this.onVanishLines = bind(this.onVanishLines, this);
        this.onExposeLines = bind(this.onExposeLines, this);
        this.exposeLine = bind(this.exposeLine, this);
        this.drawTopBot = bind(this.drawTopBot, this);
        this.drawMainCursor = bind(this.drawMainCursor, this);
        this.drawCursors = bind(this.drawCursors, this);
        this.drawHighlights = bind(this.drawHighlights, this);
        this.drawLines = bind(this.drawLines, this);
        this.drawSelections = bind(this.drawSelections, this);
        minimapWidth = parseInt((ref1 = getStyle('.minimap', 'width')) != null ? ref1 : 130);
        this.editor.layerScroll.style.right = minimapWidth + "px";
        this.width = 2 * minimapWidth;
        this.height = 8192;
        this.offsetLeft = 6;
        this.elem = elem({
            "class": 'minimap'
        });
        this.topbot = elem({
            "class": 'topbot'
        });
        this.selecti = elem('canvas', {
            "class": 'minimapSelections',
            width: this.width,
            height: this.height
        });
        this.lines = elem('canvas', {
            "class": 'minimapLines',
            width: this.width,
            height: this.height
        });
        this.highlig = elem('canvas', {
            "class": 'minimapHighlights',
            width: this.width,
            height: this.height
        });
        this.cursors = elem('canvas', {
            "class": 'minimapCursors',
            width: this.width,
            height: this.height
        });
        this.elem.appendChild(this.topbot);
        this.elem.appendChild(this.selecti);
        this.elem.appendChild(this.lines);
        this.elem.appendChild(this.highlig);
        this.elem.appendChild(this.cursors);
        this.elem.addEventListener('wheel', (ref2 = this.editor.scrollbar) != null ? ref2.onWheel : void 0);
        this.editor.view.appendChild(this.elem);
        this.editor.on('viewHeight', this.onEditorViewHeight);
        this.editor.on('numLines', this.onEditorNumLines);
        this.editor.on('changed', this.onChanged);
        this.editor.on('highlight', this.drawHighlights);
        this.editor.scroll.on('scroll', this.onEditorScroll);
        this.scroll = new MapScroll({
            exposeMax: this.height / 4,
            lineHeight: 4,
            viewHeight: 2 * this.editor.viewHeight()
        });
        this.scroll.name = this.editor.name + ".minimap";
        this.drag = new drag({
            target: this.elem,
            onStart: this.onStart,
            onMove: this.onDrag,
            cursor: 'pointer'
        });
        this.scroll.on('clearLines', this.clearAll);
        this.scroll.on('scroll', this.onScroll);
        this.scroll.on('exposeLines', this.onExposeLines);
        this.scroll.on('vanishLines', this.onVanishLines);
        this.scroll.on('exposeLine', this.exposeLine);
        this.onScroll();
        klog('minimap');
        this.drawLines();
        this.drawTopBot();
    }

    Minimap.prototype.drawSelections = function() {
        var ctx, i, len, offset, r, ref1, results, y;
        this.selecti.height = this.height;
        this.selecti.width = this.width;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        ctx = this.selecti.getContext('2d');
        ctx.fillStyle = this.editor.syntax.colorForClassnames('selection');
        ref1 = rangesFromTopToBotInRanges(this.scroll.exposeTop, this.scroll.exposeBot, this.editor.selections());
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            r = ref1[i];
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight;
            if (2 * r[1][0] < this.width) {
                offset = r[1][0] && this.offsetLeft || 0;
                results.push(ctx.fillRect(offset + 2 * r[1][0], y, 2 * (r[1][1] - r[1][0]), this.scroll.lineHeight));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Minimap.prototype.drawLines = function(top, bot) {
        var ctx, diss, i, j, len, li, meta, r, ref1, ref2, ref3, results, y;
        if (top == null) {
            top = this.scroll.exposeTop;
        }
        if (bot == null) {
            bot = this.scroll.exposeBot;
        }
        ctx = this.lines.getContext('2d');
        y = parseInt((top - this.scroll.exposeTop) * this.scroll.lineHeight);
        ctx.clearRect(0, y, this.width, ((bot - this.scroll.exposeTop) - (top - this.scroll.exposeTop) + 1) * this.scroll.lineHeight);
        if (this.scroll.exposeBot < 0) {
            return;
        }
        bot = Math.min(bot, this.editor.numLines() - 1);
        if (bot < top) {
            return;
        }
        results = [];
        for (li = i = ref1 = top, ref2 = bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            diss = this.editor.syntax.getDiss(li);
            y = parseInt((li - this.scroll.exposeTop) * this.scroll.lineHeight);
            ref3 = diss != null ? diss : [];
            for (j = 0, len = ref3.length; j < len; j++) {
                r = ref3[j];
                if (2 * r.start >= this.width) {
                    break;
                }
                if (r.value != null) {
                    ctx.fillStyle = this.editor.syntax.colorForClassnames(r.value + " minimap");
                } else if (r.styl != null) {
                    ctx.fillStyle = this.editor.syntax.colorForStyle(r.styl);
                } else {
                    ctx.fillStyle = colors[15];
                }
                ctx.fillRect(this.offsetLeft + 2 * r.start, y, 2 * r.match.length, this.scroll.lineHeight);
            }
            if (meta = this.editor.meta.metaAtLineIndex(li)) {
                if (meta[2].clss === 'succ') {
                    ctx.fillStyle = colors[233];
                    results.push(ctx.fillRect(this.offsetLeft + 2, y, 260, 1));
                } else {
                    results.push(void 0);
                }
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Minimap.prototype.drawHighlights = function() {
        var ctx, i, len, r, ref1, results, y;
        this.highlig.height = this.height;
        this.highlig.width = this.width;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        ctx = this.highlig.getContext('2d');
        ctx.fillStyle = this.editor.syntax.colorForClassnames('highlight');
        ref1 = rangesFromTopToBotInRanges(this.scroll.exposeTop, this.scroll.exposeBot, this.editor.highlights());
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            r = ref1[i];
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight;
            if (2 * r[1][0] < this.width) {
                ctx.fillRect(this.offsetLeft + 2 * r[1][0], y, 2 * (r[1][1] - r[1][0]), this.scroll.lineHeight);
            }
            results.push(ctx.fillRect(0, y, this.offsetLeft, this.scroll.lineHeight));
        }
        return results;
    };

    Minimap.prototype.drawCursors = function() {
        var ctx, i, len, r, ref1, y;
        this.cursors.height = this.height;
        this.cursors.width = this.width;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        ctx = this.cursors.getContext('2d');
        ref1 = rangesFromTopToBotInRanges(this.scroll.exposeTop, this.scroll.exposeBot, rangesFromPositions(this.editor.cursors()));
        for (i = 0, len = ref1.length; i < len; i++) {
            r = ref1[i];
            y = (r[0] - this.scroll.exposeTop) * this.scroll.lineHeight;
            if (2 * r[1][0] < this.width) {
                ctx.fillStyle = '#f80';
                ctx.fillRect(this.offsetLeft + 2 * r[1][0], y, 2, this.scroll.lineHeight);
            }
            ctx.fillStyle = 'rgba(255,128,0,0.5)';
            ctx.fillRect(this.offsetLeft - 4, y, this.offsetLeft - 2, this.scroll.lineHeight);
        }
        return this.drawMainCursor();
    };

    Minimap.prototype.drawMainCursor = function(blink) {
        var ctx, mc, y;
        ctx = this.cursors.getContext('2d');
        ctx.fillStyle = blink && '#000' || '#ff0';
        mc = this.editor.mainCursor();
        y = (mc[1] - this.scroll.exposeTop) * this.scroll.lineHeight;
        if (2 * mc[0] < this.width) {
            ctx.fillRect(this.offsetLeft + 2 * mc[0], y, 2, this.scroll.lineHeight);
        }
        return ctx.fillRect(this.offsetLeft - 4, y, this.offsetLeft - 2, this.scroll.lineHeight);
    };

    Minimap.prototype.drawTopBot = function() {
        var lh, th, ty;
        if (this.scroll.exposeBot < 0) {
            return;
        }
        lh = this.scroll.lineHeight / 2;
        th = (this.editor.scroll.bot - this.editor.scroll.top + 1) * lh;
        ty = 0;
        if (this.editor.scroll.scrollMax) {
            ty = (Math.min(0.5 * this.scroll.viewHeight, this.scroll.numLines * 2) - th) * this.editor.scroll.scroll / this.editor.scroll.scrollMax;
        }
        this.topbot.style.height = th + "px";
        return this.topbot.style.top = ty + "px";
    };

    Minimap.prototype.exposeLine = function(li) {
        return this.drawLines(li, li);
    };

    Minimap.prototype.onExposeLines = function(e) {
        return this.drawLines(this.scroll.exposeTop, this.scroll.exposeBot);
    };

    Minimap.prototype.onVanishLines = function(e) {
        if (e.top != null) {
            return this.drawLines(this.scroll.exposeTop, this.scroll.exposeBot);
        } else {
            return this.clearRange(this.scroll.exposeBot, this.scroll.exposeBot + this.scroll.numLines);
        }
    };

    Minimap.prototype.onChanged = function(changeInfo) {
        var change, i, len, li, ref1, ref2;
        if (changeInfo.selects) {
            this.drawSelections();
        }
        if (changeInfo.cursors) {
            this.drawCursors();
        }
        if (!changeInfo.changes.length) {
            return;
        }
        this.scroll.setNumLines(this.editor.numLines());
        ref1 = changeInfo.changes;
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            if ((ref2 = !change.change) === 'deleted' || ref2 === 'inserted') {
                break;
            }
            li = change.doIndex;
            this.drawLines(li, li);
        }
        if (li <= this.scroll.exposeBot) {
            return this.drawLines(li, this.scroll.exposeBot);
        }
    };

    Minimap.prototype.onDrag = function(drag, event) {
        var br, li, pc, ry;
        if (this.scroll.fullHeight > this.scroll.viewHeight) {
            br = this.elem.getBoundingClientRect();
            ry = event.clientY - br.top;
            pc = 2 * ry / this.scroll.viewHeight;
            li = parseInt(pc * this.editor.scroll.numLines);
            return this.jumpToLine(li, event);
        } else {
            return this.jumpToLine(this.lineIndexForEvent(event), event);
        }
    };

    Minimap.prototype.onStart = function(drag, event) {
        return this.jumpToLine(this.lineIndexForEvent(event), event);
    };

    Minimap.prototype.jumpToLine = function(li, event) {
        this.editor.scroll.to((li - 5) * this.editor.scroll.lineHeight);
        if (!event.metaKey) {
            this.editor.singleCursorAtPos([0, li + 5], {
                extend: event.shiftKey
            });
        }
        this.editor.focus();
        return this.onEditorScroll();
    };

    Minimap.prototype.lineIndexForEvent = function(event) {
        var br, li, ly, py, st;
        st = this.elem.scrollTop;
        br = this.elem.getBoundingClientRect();
        ly = clamp(0, this.elem.offsetHeight, event.clientY - br.top);
        py = parseInt(Math.floor(2 * ly / this.scroll.lineHeight)) + this.scroll.top;
        li = parseInt(Math.min(this.scroll.numLines - 1, py));
        return li;
    };

    Minimap.prototype.onEditorNumLines = function(n) {
        if (n && this.lines.height <= this.scroll.lineHeight) {
            this.onEditorViewHeight(this.editor.viewHeight());
        }
        return this.scroll.setNumLines(n);
    };

    Minimap.prototype.onEditorViewHeight = function(h) {
        this.scroll.setViewHeight(2 * this.editor.viewHeight());
        this.onScroll();
        return this.onEditorScroll();
    };

    Minimap.prototype.onEditorScroll = function() {
        var pc, tp;
        if (this.scroll.fullHeight > this.scroll.viewHeight) {
            pc = this.editor.scroll.scroll / this.editor.scroll.scrollMax;
            tp = parseInt(pc * this.scroll.scrollMax);
            this.scroll.to(tp);
        }
        return this.drawTopBot();
    };

    Minimap.prototype.onScroll = function() {
        var t, x, y;
        y = parseInt(-this.height / 4 - this.scroll.offsetTop / 2);
        x = parseInt(this.width / 4);
        t = "translate3d(" + x + "px, " + y + "px, 0px) scale3d(0.5, 0.5, 1)";
        this.selecti.style.transform = t;
        this.highlig.style.transform = t;
        this.cursors.style.transform = t;
        return this.lines.style.transform = t;
    };

    Minimap.prototype.clearRange = function(top, bot) {
        var ctx;
        ctx = this.lines.getContext('2d');
        return ctx.clearRect(0, (top - this.scroll.exposeTop) * this.scroll.lineHeight, 2 * this.width, (bot - top) * this.scroll.lineHeight);
    };

    Minimap.prototype.clearAll = function() {
        this.selecti.width = this.selecti.width;
        this.highlig.width = this.highlig.width;
        this.cursors.width = this.cursors.width;
        this.topbot.width = this.topbot.width;
        this.lines.width = this.lines.width;
        return this.topbot.style.height = '0';
    };

    return Minimap;

})();

module.exports = Minimap;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0VBQUE7SUFBQTs7QUFRQSxNQUF3QyxPQUFBLENBQVEsS0FBUixDQUF4QyxFQUFFLHVCQUFGLEVBQVksaUJBQVosRUFBbUIsZUFBbkIsRUFBeUIsZUFBekIsRUFBK0I7O0FBRS9CLFNBQUEsR0FBWSxPQUFBLENBQVEsYUFBUjs7QUFDWixNQUFBLEdBQVksT0FBQSxDQUFRLGlCQUFSOztBQUVOO0lBRUMsaUJBQUMsTUFBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUEsWUFBQSxHQUFlLFFBQUEseURBQXdDLEdBQXhDO1FBRWYsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQTFCLEdBQXFDLFlBQUQsR0FBYztRQUVsRCxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsR0FBRTtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsVUFBRCxHQUFjO1FBRWQsSUFBQyxDQUFBLElBQUQsR0FBVyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQVA7U0FBTDtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDWCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUEsQ0FBSyxRQUFMLEVBQWM7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO1lBQTJCLEtBQUEsRUFBTyxJQUFDLENBQUEsS0FBbkM7WUFBMEMsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFuRDtTQUFkO1FBQ1gsSUFBQyxDQUFBLEtBQUQsR0FBVyxJQUFBLENBQUssUUFBTCxFQUFjO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO1lBQTJCLEtBQUEsRUFB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MDAwICAwMDAgICAwMDAgIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuIyMjXG5cbnsgZ2V0U3R5bGUsIGNsYW1wLCBlbGVtLCBkcmFnLCBrbG9nIH0gPSByZXF1aXJlICdreGsnIFxuXG5NYXBTY3JvbGwgPSByZXF1aXJlICcuL21hcHNjcm9sbCdcbmNvbG9ycyAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2NvbG9ycydcblxuY2xhc3MgTWluaW1hcFxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgbWluaW1hcFdpZHRoID0gcGFyc2VJbnQgZ2V0U3R5bGUoJy5taW5pbWFwJyAnd2lkdGgnKSA/IDEzMFxuXG4gICAgICAgIEBlZGl0b3IubGF5ZXJTY3JvbGwuc3R5bGUucmlnaHQgPSBcIiN7bWluaW1hcFdpZHRofXB4XCJcblxuICAgICAgICBAd2lkdGggPSAyKm1pbmltYXBXaWR0aFxuICAgICAgICBAaGVpZ2h0ID0gODE5MlxuICAgICAgICBAb2Zmc2V0TGVmdCA9IDZcblxuICAgICAgICBAZWxlbSAgICA9IGVsZW0gY2xhc3M6ICdtaW5pbWFwJ1xuICAgICAgICBAdG9wYm90ICA9IGVsZW0gY2xhc3M6ICd0b3Bib3QnXG4gICAgICAgIEBzZWxlY3RpID0gZWxlbSAnY2FudmFzJyBjbGFzczogJ21pbmltYXBTZWxlY3Rpb25zJyB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcbiAgICAgICAgQGxpbmVzICAgPSBlbGVtICdjYW52YXMnIGNsYXNzOiAnbWluaW1hcExpbmVzJyAgICAgIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuICAgICAgICBAaGlnaGxpZyA9IGVsZW0gJ2NhbnZhcycgY2xhc3M6ICdtaW5pbWFwSGlnaGxpZ2h0cycgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG4gICAgICAgIEBjdXJzb3JzID0gZWxlbSAnY2FudmFzJyBjbGFzczogJ21pbmltYXBDdXJzb3JzJyAgICB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcblxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAdG9wYm90XG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBzZWxlY3RpXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBsaW5lc1xuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAaGlnaGxpZ1xuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAY3Vyc29yc1xuXG4gICAgICAgIEBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJyBAZWRpdG9yLnNjcm9sbGJhcj8ub25XaGVlbFxuXG4gICAgICAgIEBlZGl0b3Iudmlldy5hcHBlbmRDaGlsZCAgICBAZWxlbVxuICAgICAgICBAZWRpdG9yLm9uICd2aWV3SGVpZ2h0JyAgICAgQG9uRWRpdG9yVmlld0hlaWdodFxuICAgICAgICBAZWRpdG9yLm9uICdudW1MaW5lcycgICAgICAgQG9uRWRpdG9yTnVtTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnY2hhbmdlZCcgICAgICAgIEBvbkNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnaGlnaGxpZ2h0JyAgICAgIEBkcmF3SGlnaGxpZ2h0c1xuICAgICAgICBAZWRpdG9yLnNjcm9sbC5vbiAnc2Nyb2xsJyAgQG9uRWRpdG9yU2Nyb2xsXG5cbiAgICAgICAgQHNjcm9sbCA9IG5ldyBNYXBTY3JvbGxcbiAgICAgICAgICAgIGV4cG9zZU1heDogIEBoZWlnaHQvNFxuICAgICAgICAgICAgbGluZUhlaWdodDogNFxuICAgICAgICAgICAgdmlld0hlaWdodDogMipAZWRpdG9yLnZpZXdIZWlnaHQoKVxuXG4gICAgICAgIEBzY3JvbGwubmFtZSA9IFwiI3tAZWRpdG9yLm5hbWV9Lm1pbmltYXBcIlxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBlbGVtXG4gICAgICAgICAgICBvblN0YXJ0OiBAb25TdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ1xuICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcidcblxuICAgICAgICBAc2Nyb2xsLm9uICdjbGVhckxpbmVzJyAgQGNsZWFyQWxsXG4gICAgICAgIEBzY3JvbGwub24gJ3Njcm9sbCcgICAgICBAb25TY3JvbGxcbiAgICAgICAgQHNjcm9sbC5vbiAnZXhwb3NlTGluZXMnIEBvbkV4cG9zZUxpbmVzXG4gICAgICAgIEBzY3JvbGwub24gJ3ZhbmlzaExpbmVzJyBAb25WYW5pc2hMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICdleHBvc2VMaW5lJyAgQGV4cG9zZUxpbmVcblxuICAgICAgICBAb25TY3JvbGwoKVxuICAgICAgICBrbG9nICdtaW5pbWFwJ1xuICAgICAgICBAZHJhd0xpbmVzKClcbiAgICAgICAgQGRyYXdUb3BCb3QoKVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMFxuXG4gICAgZHJhd1NlbGVjdGlvbnM6ID0+XG5cbiAgICAgICAgQHNlbGVjdGkuaGVpZ2h0ID0gQGhlaWdodFxuICAgICAgICBAc2VsZWN0aS53aWR0aCA9IEB3aWR0aFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGN0eCA9IEBzZWxlY3RpLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JDbGFzc25hbWVzICdzZWxlY3Rpb24nXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgQGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgIHkgPSAoclswXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiAyKnJbMV1bMF0gPCBAd2lkdGhcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSByWzFdWzBdIGFuZCBAb2Zmc2V0TGVmdCBvciAwXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IG9mZnNldCsyKnJbMV1bMF0sIHksIDIqKHJbMV1bMV0tclsxXVswXSksIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0xpbmVzOiAodG9wPUBzY3JvbGwuZXhwb3NlVG9wLCBib3Q9QHNjcm9sbC5leHBvc2VCb3QpID0+XG5cbiAgICAgICAgIyBrbG9nIHRvcCwgYm90XG4gICAgICAgIGN0eCA9IEBsaW5lcy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgeSA9IHBhcnNlSW50KCh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodClcbiAgICAgICAgY3R4LmNsZWFyUmVjdCAwLCB5LCBAd2lkdGgsICgoYm90LUBzY3JvbGwuZXhwb3NlVG9wKS0odG9wLUBzY3JvbGwuZXhwb3NlVG9wKSsxKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBib3QgPSBNYXRoLm1pbiBib3QsIEBlZGl0b3IubnVtTGluZXMoKS0xXG4gICAgICAgIHJldHVybiBpZiBib3QgPCB0b3BcbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIGRpc3MgPSBAZWRpdG9yLnN5bnRheC5nZXREaXNzIGxpXG4gICAgICAgICAgICB5ID0gcGFyc2VJbnQoKGxpLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHQpXG4gICAgICAgICAgICBmb3IgciBpbiBkaXNzID8gW11cbiAgICAgICAgICAgICAgICBicmVhayBpZiAyKnIuc3RhcnQgPj0gQHdpZHRoXG4gICAgICAgICAgICAgICAgaWYgci52YWx1ZT9cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyByLnZhbHVlICsgXCIgbWluaW1hcFwiXG4gICAgICAgICAgICAgICAgZWxzZSBpZiByLnN0eWw/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvclN0eWxlIHIuc3R5bFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yc1sxNV1cbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMipyLnN0YXJ0LCB5LCAyKnIubWF0Y2gubGVuZ3RoLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG1ldGEgPSBAZWRpdG9yLm1ldGEubWV0YUF0TGluZUluZGV4IGxpXG4gICAgICAgICAgICAgICAgIyBrbG9nIG1ldGFbMl0uY2xzc1xuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY2xzcyA9PSAnc3VjYydcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yc1syMzNdXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyLCB5LCAyNjAsIDFcblxuICAgIGRyYXdIaWdobGlnaHRzOiA9PlxuXG4gICAgICAgIEBoaWdobGlnLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQGhpZ2hsaWcud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAaGlnaGxpZy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyAnaGlnaGxpZ2h0J1xuICAgICAgICBmb3IgciBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3QsIEBlZGl0b3IuaGlnaGxpZ2h0cygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqclsxXVswXSwgeSwgMiooclsxXVsxXS1yWzFdWzBdKSwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBjdHguZmlsbFJlY3QgMCwgeSwgQG9mZnNldExlZnQsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0N1cnNvcnM6ID0+XG5cbiAgICAgICAgQGN1cnNvcnMuaGVpZ2h0ID0gQGhlaWdodFxuICAgICAgICBAY3Vyc29ycy53aWR0aCA9IEB3aWR0aFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGN0eCA9IEBjdXJzb3JzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBmb3IgciBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3QsIHJhbmdlc0Zyb21Qb3NpdGlvbnMgQGVkaXRvci5jdXJzb3JzKClcbiAgICAgICAgICAgIHkgPSAoclswXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiAyKnJbMV1bMF0gPCBAd2lkdGhcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJyNmODAnXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqclsxXVswXSwgeSwgMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMjU1LDEyOCwwLDAuNSknXG4gICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQtNCwgeSwgQG9mZnNldExlZnQtMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIEBkcmF3TWFpbkN1cnNvcigpXG5cbiAgICBkcmF3TWFpbkN1cnNvcjogKGJsaW5rKSA9PlxuXG4gICAgICAgIGN0eCA9IEBjdXJzb3JzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gYmxpbmsgYW5kICcjMDAwJyBvciAnI2ZmMCdcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICB5ID0gKG1jWzFdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgaWYgMiptY1swXSA8IEB3aWR0aFxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqbWNbMF0sIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQtNCwgeSwgQG9mZnNldExlZnQtMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3VG9wQm90OiA9PlxuXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcblxuICAgICAgICBsaCA9IEBzY3JvbGwubGluZUhlaWdodC8yXG4gICAgICAgIHRoID0gKEBlZGl0b3Iuc2Nyb2xsLmJvdC1AZWRpdG9yLnNjcm9sbC50b3ArMSkqbGhcbiAgICAgICAgdHkgPSAwXG4gICAgICAgIGlmIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICAgICAgdHkgPSAoTWF0aC5taW4oMC41KkBzY3JvbGwudmlld0hlaWdodCwgQHNjcm9sbC5udW1MaW5lcyoyKS10aCkgKiBAZWRpdG9yLnNjcm9sbC5zY3JvbGwgLyBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgQHRvcGJvdC5zdHlsZS5oZWlnaHQgPSBcIiN7dGh9cHhcIlxuICAgICAgICBAdG9wYm90LnN0eWxlLnRvcCAgICA9IFwiI3t0eX1weFwiXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBleHBvc2VMaW5lOiAgIChsaSkgPT4gXG4gICAgICAgICMga2xvZyAnZXhwb3NlJyBsaSwgbGlcbiAgICAgICAgQGRyYXdMaW5lcyBsaSwgbGlcbiAgICBvbkV4cG9zZUxpbmVzOiAoZSkgPT4gXG4gICAgICAgICMga2xvZyAnZXhwb3NlJyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgQGRyYXdMaW5lcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3RcblxuICAgIG9uVmFuaXNoTGluZXM6IChlKSA9PlxuICAgICAgICBpZiBlLnRvcD9cbiAgICAgICAgICAgIEBkcmF3TGluZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjbGVhclJhbmdlIEBzY3JvbGwuZXhwb3NlQm90LCBAc2Nyb2xsLmV4cG9zZUJvdCtAc2Nyb2xsLm51bUxpbmVzXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIG9uQ2hhbmdlZDogKGNoYW5nZUluZm8pID0+XG5cbiAgICAgICAgQGRyYXdTZWxlY3Rpb25zKCkgaWYgY2hhbmdlSW5mby5zZWxlY3RzXG4gICAgICAgIEBkcmF3Q3Vyc29ycygpICAgIGlmIGNoYW5nZUluZm8uY3Vyc29yc1xuXG4gICAgICAgIHJldHVybiBpZiBub3QgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuXG4gICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQGVkaXRvci5udW1MaW5lcygpXG5cbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIGJyZWFrIGlmIG5vdCBjaGFuZ2UuY2hhbmdlIGluIFsnZGVsZXRlZCcgJ2luc2VydGVkJ11cbiAgICAgICAgICAgIGxpID0gY2hhbmdlLmRvSW5kZXhcbiAgICAgICAgICAgICMga2xvZyAnY2hhbmdlcycgbGksIGxpIywgY2hhbmdlXG4gICAgICAgICAgICBAZHJhd0xpbmVzIGxpLCBsaVxuXG4gICAgICAgIGlmIGxpIDw9IEBzY3JvbGwuZXhwb3NlQm90XG4gICAgICAgICAgICAjIGtsb2cgJ29uQ2hhbmdlZCcgbGksIEBzY3JvbGwuZXhwb3NlQm90XG4gICAgICAgICAgICBAZHJhd0xpbmVzIGxpLCBAc2Nyb2xsLmV4cG9zZUJvdFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIG9uRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIGlmIEBzY3JvbGwuZnVsbEhlaWdodCA+IEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgYnIgPSBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgcnkgPSBldmVudC5jbGllbnRZIC0gYnIudG9wXG4gICAgICAgICAgICBwYyA9IDIqcnkgLyBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIGxpID0gcGFyc2VJbnQgcGMgKiBAZWRpdG9yLnNjcm9sbC5udW1MaW5lc1xuICAgICAgICAgICAgQGp1bXBUb0xpbmUgbGksIGV2ZW50XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBqdW1wVG9MaW5lIEBsaW5lSW5kZXhGb3JFdmVudChldmVudCksIGV2ZW50XG5cbiAgICBvblN0YXJ0OiAoZHJhZyxldmVudCkgPT4gQGp1bXBUb0xpbmUgQGxpbmVJbmRleEZvckV2ZW50KGV2ZW50KSwgZXZlbnRcblxuICAgIGp1bXBUb0xpbmU6IChsaSwgZXZlbnQpIC0+XG5cbiAgICAgICAgQGVkaXRvci5zY3JvbGwudG8gKGxpLTUpICogQGVkaXRvci5zY3JvbGwubGluZUhlaWdodFxuXG4gICAgICAgIGlmIG5vdCBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFswLCBsaSs1XSwgZXh0ZW5kOmV2ZW50LnNoaWZ0S2V5XG5cbiAgICAgICAgQGVkaXRvci5mb2N1cygpXG4gICAgICAgIEBvbkVkaXRvclNjcm9sbCgpXG5cbiAgICBsaW5lSW5kZXhGb3JFdmVudDogKGV2ZW50KSAtPlxuXG4gICAgICAgIHN0ID0gQGVsZW0uc2Nyb2xsVG9wXG4gICAgICAgIGJyID0gQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgbHkgPSBjbGFtcCAwLCBAZWxlbS5vZmZzZXRIZWlnaHQsIGV2ZW50LmNsaWVudFkgLSBici50b3BcbiAgICAgICAgcHkgPSBwYXJzZUludChNYXRoLmZsb29yKDIqbHkvQHNjcm9sbC5saW5lSGVpZ2h0KSkgKyBAc2Nyb2xsLnRvcFxuICAgICAgICBsaSA9IHBhcnNlSW50IE1hdGgubWluKEBzY3JvbGwubnVtTGluZXMtMSwgcHkpXG4gICAgICAgIGxpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgIG9uRWRpdG9yTnVtTGluZXM6IChuKSA9PlxuXG4gICAgICAgIEBvbkVkaXRvclZpZXdIZWlnaHQgQGVkaXRvci52aWV3SGVpZ2h0KCkgaWYgbiBhbmQgQGxpbmVzLmhlaWdodCA8PSBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBuXG5cbiAgICBvbkVkaXRvclZpZXdIZWlnaHQ6IChoKSA9PlxuXG4gICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCAyKkBlZGl0b3Iudmlld0hlaWdodCgpXG4gICAgICAgIEBvblNjcm9sbCgpXG4gICAgICAgIEBvbkVkaXRvclNjcm9sbCgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25FZGl0b3JTY3JvbGw6ID0+XG5cbiAgICAgICAgaWYgQHNjcm9sbC5mdWxsSGVpZ2h0ID4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBwYyA9IEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbCAvIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICAgICAgdHAgPSBwYXJzZUludCBwYyAqIEBzY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICBAc2Nyb2xsLnRvIHRwXG4gICAgICAgIEBkcmF3VG9wQm90KClcblxuICAgIG9uU2Nyb2xsOiA9PlxuXG4gICAgICAgIHkgPSBwYXJzZUludCAtQGhlaWdodC80LUBzY3JvbGwub2Zmc2V0VG9wLzJcbiAgICAgICAgeCA9IHBhcnNlSW50IEB3aWR0aC80XG4gICAgICAgIHQgPSBcInRyYW5zbGF0ZTNkKCN7eH1weCwgI3t5fXB4LCAwcHgpIHNjYWxlM2QoMC41LCAwLjUsIDEpXCJcblxuICAgICAgICBAc2VsZWN0aS5zdHlsZS50cmFuc2Zvcm0gPSB0XG4gICAgICAgIEBoaWdobGlnLnN0eWxlLnRyYW5zZm9ybSA9IHRcbiAgICAgICAgQGN1cnNvcnMuc3R5bGUudHJhbnNmb3JtID0gdFxuICAgICAgICBAbGluZXMuc3R5bGUudHJhbnNmb3JtICAgPSB0XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFyUmFuZ2U6ICh0b3AsIGJvdCkgLT5cblxuICAgICAgICBjdHggPSBAbGluZXMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5jbGVhclJlY3QgMCwgKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0LCAyKkB3aWR0aCwgKGJvdC10b3ApKkBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgY2xlYXJBbGw6ID0+XG5cbiAgICAgICAgQHNlbGVjdGkud2lkdGggPSBAc2VsZWN0aS53aWR0aFxuICAgICAgICBAaGlnaGxpZy53aWR0aCA9IEBoaWdobGlnLndpZHRoXG4gICAgICAgIEBjdXJzb3JzLndpZHRoID0gQGN1cnNvcnMud2lkdGhcbiAgICAgICAgQHRvcGJvdC53aWR0aCAgPSBAdG9wYm90LndpZHRoXG4gICAgICAgIEBsaW5lcy53aWR0aCAgID0gQGxpbmVzLndpZHRoXG4gICAgICAgIEB0b3Bib3Quc3R5bGUuaGVpZ2h0ID0gJzAnXG5cbm1vZHVsZS5leHBvcnRzID0gTWluaW1hcFxuIl19
//# sourceURL=../../coffee/editor/minimap.coffee