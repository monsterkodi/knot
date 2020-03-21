// koffee 1.12.0

/*
00     00  000  000   000  000  00     00   0000000   00000000
000   000  000  0000  000  000  000   000  000   000  000   000
000000000  000  000 0 000  000  000000000  000000000  00000000
000 0 000  000  000  0000  000  000 0 000  000   000  000
000   000  000  000   000  000  000   000  000   000  000
 */
var MapScroll, Minimap, clamp, colors, drag, elem, getStyle, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), getStyle = ref.getStyle, clamp = ref.clamp, elem = ref.elem, drag = ref.drag;

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
                ctx.fillRect(offset + 2 * r[1][0], y, 2 * (r[1][1] - r[1][0]), this.scroll.lineHeight);
                results.push(ctx.fillRect(260 - 6, y, 2, this.scroll.lineHeight));
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
                if (r.clss != null) {
                    ctx.fillStyle = this.editor.syntax.colorForClassnames(r.clss + " minimap");
                } else if (r.styl != null) {
                    ctx.fillStyle = this.editor.syntax.colorForStyle(r.styl);
                } else {
                    ctx.fillStyle = colors[15];
                }
                ctx.fillRect(this.offsetLeft + 2 * r.start, y, 2 * r.match.length, this.scroll.lineHeight);
            }
            if (meta = this.editor.meta.metaAtLineIndex(li)) {
                if (meta[2].clss === 'succ') {
                    ctx.fillStyle = colors[234];
                    ctx.fillRect(0, y, 260, 1);
                }
                if (meta[2].clss === 'fail') {
                    ctx.fillStyle = colors[1];
                    results.push(ctx.fillRect(0, y, 260, 1));
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
            results.push(ctx.fillRect(260 - 4, y, 4, this.scroll.lineHeight));
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
            ctx.fillRect(260 - 8, y, 4, this.scroll.lineHeight);
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
        return ctx.fillRect(260 - 8, y, 8, this.scroll.lineHeight);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJtaW5pbWFwLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw0REFBQTtJQUFBOztBQVFBLE1BQWtDLE9BQUEsQ0FBUSxLQUFSLENBQWxDLEVBQUUsdUJBQUYsRUFBWSxpQkFBWixFQUFtQixlQUFuQixFQUF5Qjs7QUFFekIsU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztBQUNaLE1BQUEsR0FBWSxPQUFBLENBQVEsaUJBQVI7O0FBRU47SUFFQyxpQkFBQyxNQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7UUFFQSxZQUFBLEdBQWUsUUFBQSx5REFBd0MsR0FBeEM7UUFFZixJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBMUIsR0FBcUMsWUFBRCxHQUFjO1FBRWxELElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQSxHQUFFO1FBQ1gsSUFBQyxDQUFBLE1BQUQsR0FBVTtRQUNWLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFFZCxJQUFDLENBQUEsSUFBRCxHQUFXLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtTQUFMO1FBQ1gsSUFBQyxDQUFBLE1BQUQsR0FBVyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFFBQVA7U0FBTDtRQUNYLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQSxDQUFLLFFBQUwsRUFBYztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sbUJBQVA7WUFBMkIsS0FBQSxFQUFPLElBQUMsQ0FBQSxLQUFuQztZQUEwQyxNQUFBLEVBQVEsSUFBQyxDQUFBLE1BQW5EO1NBQWQ7UUFDWCxJQUFDLENBQUEsS0FBRCxHQUFXLElBQUEsQ0FBSyxRQUFMLEVBQWM7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFP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TUFBTSxDQUFDO1FBQ3pCLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FBUCxHQUFpQixJQUFDLENBQUEsS0FBSyxDQUFDO2VBQ3hCLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQWQsR0FBdUI7SUFQakI7Ozs7OztBQVNkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwIDAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiMjI1xuXG57IGdldFN0eWxlLCBjbGFtcCwgZWxlbSwgZHJhZyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5NYXBTY3JvbGwgPSByZXF1aXJlICcuL21hcHNjcm9sbCdcbmNvbG9ycyAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2NvbG9ycydcblxuY2xhc3MgTWluaW1hcFxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgbWluaW1hcFdpZHRoID0gcGFyc2VJbnQgZ2V0U3R5bGUoJy5taW5pbWFwJyAnd2lkdGgnKSA/IDEzMFxuXG4gICAgICAgIEBlZGl0b3IubGF5ZXJTY3JvbGwuc3R5bGUucmlnaHQgPSBcIiN7bWluaW1hcFdpZHRofXB4XCJcblxuICAgICAgICBAd2lkdGggPSAyKm1pbmltYXBXaWR0aFxuICAgICAgICBAaGVpZ2h0ID0gODE5MlxuICAgICAgICBAb2Zmc2V0TGVmdCA9IDZcblxuICAgICAgICBAZWxlbSAgICA9IGVsZW0gY2xhc3M6ICdtaW5pbWFwJ1xuICAgICAgICBAdG9wYm90ICA9IGVsZW0gY2xhc3M6ICd0b3Bib3QnXG4gICAgICAgIEBzZWxlY3RpID0gZWxlbSAnY2FudmFzJyBjbGFzczogJ21pbmltYXBTZWxlY3Rpb25zJyB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcbiAgICAgICAgQGxpbmVzICAgPSBlbGVtICdjYW52YXMnIGNsYXNzOiAnbWluaW1hcExpbmVzJyAgICAgIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuICAgICAgICBAaGlnaGxpZyA9IGVsZW0gJ2NhbnZhcycgY2xhc3M6ICdtaW5pbWFwSGlnaGxpZ2h0cycgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG4gICAgICAgIEBjdXJzb3JzID0gZWxlbSAnY2FudmFzJyBjbGFzczogJ21pbmltYXBDdXJzb3JzJyAgICB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcblxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAdG9wYm90XG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBzZWxlY3RpXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBsaW5lc1xuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAaGlnaGxpZ1xuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAY3Vyc29yc1xuXG4gICAgICAgIEBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJyBAZWRpdG9yLnNjcm9sbGJhcj8ub25XaGVlbFxuXG4gICAgICAgIEBlZGl0b3Iudmlldy5hcHBlbmRDaGlsZCAgICBAZWxlbVxuICAgICAgICBAZWRpdG9yLm9uICd2aWV3SGVpZ2h0JyAgICAgQG9uRWRpdG9yVmlld0hlaWdodFxuICAgICAgICBAZWRpdG9yLm9uICdudW1MaW5lcycgICAgICAgQG9uRWRpdG9yTnVtTGluZXNcbiAgICAgICAgQGVkaXRvci5vbiAnY2hhbmdlZCcgICAgICAgIEBvbkNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnaGlnaGxpZ2h0JyAgICAgIEBkcmF3SGlnaGxpZ2h0c1xuICAgICAgICBAZWRpdG9yLnNjcm9sbC5vbiAnc2Nyb2xsJyAgQG9uRWRpdG9yU2Nyb2xsXG5cbiAgICAgICAgQHNjcm9sbCA9IG5ldyBNYXBTY3JvbGxcbiAgICAgICAgICAgIGV4cG9zZU1heDogIEBoZWlnaHQvNFxuICAgICAgICAgICAgbGluZUhlaWdodDogNFxuICAgICAgICAgICAgdmlld0hlaWdodDogMipAZWRpdG9yLnZpZXdIZWlnaHQoKVxuXG4gICAgICAgIEBzY3JvbGwubmFtZSA9IFwiI3tAZWRpdG9yLm5hbWV9Lm1pbmltYXBcIlxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBlbGVtXG4gICAgICAgICAgICBvblN0YXJ0OiBAb25TdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ1xuICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcidcblxuICAgICAgICBAc2Nyb2xsLm9uICdjbGVhckxpbmVzJyAgQGNsZWFyQWxsXG4gICAgICAgIEBzY3JvbGwub24gJ3Njcm9sbCcgICAgICBAb25TY3JvbGxcbiAgICAgICAgQHNjcm9sbC5vbiAnZXhwb3NlTGluZXMnIEBvbkV4cG9zZUxpbmVzXG4gICAgICAgIEBzY3JvbGwub24gJ3ZhbmlzaExpbmVzJyBAb25WYW5pc2hMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICdleHBvc2VMaW5lJyAgQGV4cG9zZUxpbmVcblxuICAgICAgICBAb25TY3JvbGwoKVxuICAgICAgICBAZHJhd0xpbmVzKClcbiAgICAgICAgQGRyYXdUb3BCb3QoKVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMFxuXG4gICAgZHJhd1NlbGVjdGlvbnM6ID0+XG5cbiAgICAgICAgQHNlbGVjdGkuaGVpZ2h0ID0gQGhlaWdodFxuICAgICAgICBAc2VsZWN0aS53aWR0aCA9IEB3aWR0aFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGN0eCA9IEBzZWxlY3RpLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JDbGFzc25hbWVzICdzZWxlY3Rpb24nXG4gICAgICAgIGZvciByIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdCwgQGVkaXRvci5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgIHkgPSAoclswXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiAyKnJbMV1bMF0gPCBAd2lkdGhcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSByWzFdWzBdIGFuZCBAb2Zmc2V0TGVmdCBvciAwXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IG9mZnNldCsyKnJbMV1bMF0sIHksIDIqKHJbMV1bMV0tclsxXVswXSksIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCAyNjAtNiwgeSwgMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3TGluZXM6ICh0b3A9QHNjcm9sbC5leHBvc2VUb3AsIGJvdD1Ac2Nyb2xsLmV4cG9zZUJvdCkgPT5cblxuICAgICAgICAjIGtsb2cgdG9wLCBib3RcbiAgICAgICAgY3R4ID0gQGxpbmVzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICB5ID0gcGFyc2VJbnQoKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0KVxuICAgICAgICBjdHguY2xlYXJSZWN0IDAsIHksIEB3aWR0aCwgKChib3QtQHNjcm9sbC5leHBvc2VUb3ApLSh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKzEpKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGJvdCA9IE1hdGgubWluIGJvdCwgQGVkaXRvci5udW1MaW5lcygpLTFcbiAgICAgICAgcmV0dXJuIGlmIGJvdCA8IHRvcFxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgZGlzcyA9IEBlZGl0b3Iuc3ludGF4LmdldERpc3MgbGlcbiAgICAgICAgICAgIHkgPSBwYXJzZUludCgobGktQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodClcbiAgICAgICAgICAgIGZvciByIGluIGRpc3MgPyBbXVxuICAgICAgICAgICAgICAgIGJyZWFrIGlmIDIqci5zdGFydCA+PSBAd2lkdGhcbiAgICAgICAgICAgICAgICBpZiByLmNsc3M/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvckNsYXNzbmFtZXMgci5jbHNzICsgXCIgbWluaW1hcFwiXG4gICAgICAgICAgICAgICAgZWxzZSBpZiByLnN0eWw/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvclN0eWxlIHIuc3R5bFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yc1sxNV1cbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMipyLnN0YXJ0LCB5LCAyKnIubWF0Y2gubGVuZ3RoLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG1ldGEgPSBAZWRpdG9yLm1ldGEubWV0YUF0TGluZUluZGV4IGxpXG4gICAgICAgICAgICAgICAgaWYgbWV0YVsyXS5jbHNzID09ICdzdWNjJ1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gY29sb3JzWzIzNF1cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDAsIHksIDI2MCwgMVxuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY2xzcyA9PSAnZmFpbCdcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yc1sxXVxuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgMCwgeSwgMjYwLCAxXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIGRyYXdIaWdobGlnaHRzOiA9PlxuXG4gICAgICAgIEBoaWdobGlnLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQGhpZ2hsaWcud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAaGlnaGxpZy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyAnaGlnaGxpZ2h0J1xuICAgICAgICBmb3IgciBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3QsIEBlZGl0b3IuaGlnaGxpZ2h0cygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqclsxXVswXSwgeSwgMiooclsxXVsxXS1yWzFdWzBdKSwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBjdHguZmlsbFJlY3QgMjYwLTQsIHksIDQsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0N1cnNvcnM6ID0+XG5cbiAgICAgICAgQGN1cnNvcnMuaGVpZ2h0ID0gQGhlaWdodFxuICAgICAgICBAY3Vyc29ycy53aWR0aCA9IEB3aWR0aFxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG4gICAgICAgIGN0eCA9IEBjdXJzb3JzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBmb3IgciBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3QsIHJhbmdlc0Zyb21Qb3NpdGlvbnMgQGVkaXRvci5jdXJzb3JzKClcbiAgICAgICAgICAgIHkgPSAoclswXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBpZiAyKnJbMV1bMF0gPCBAd2lkdGhcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJyNmODAnXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqclsxXVswXSwgeSwgMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMjU1LDEyOCwwLDAuNSknXG4gICAgICAgICAgICBjdHguZmlsbFJlY3QgMjYwLTgsIHksIDQsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBAZHJhd01haW5DdXJzb3IoKVxuXG4gICAgZHJhd01haW5DdXJzb3I6IChibGluaykgPT5cblxuICAgICAgICBjdHggPSBAY3Vyc29ycy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGJsaW5rIGFuZCAnIzAwMCcgb3IgJyNmZjAnXG4gICAgICAgIG1jID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgeSA9IChtY1sxXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIGlmIDIqbWNbMF0gPCBAd2lkdGhcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKm1jWzBdLCB5LCAyLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgY3R4LmZpbGxSZWN0IDI2MC04LCB5LCA4LCBAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGRyYXdUb3BCb3Q6ID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuXG4gICAgICAgIGxoID0gQHNjcm9sbC5saW5lSGVpZ2h0LzJcbiAgICAgICAgdGggPSAoQGVkaXRvci5zY3JvbGwuYm90LUBlZGl0b3Iuc2Nyb2xsLnRvcCsxKSpsaFxuICAgICAgICB0eSA9IDBcbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICB0eSA9IChNYXRoLm1pbigwLjUqQHNjcm9sbC52aWV3SGVpZ2h0LCBAc2Nyb2xsLm51bUxpbmVzKjIpLXRoKSAqIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbCAvIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICBAdG9wYm90LnN0eWxlLmhlaWdodCA9IFwiI3t0aH1weFwiXG4gICAgICAgIEB0b3Bib3Quc3R5bGUudG9wICAgID0gXCIje3R5fXB4XCJcblxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGV4cG9zZUxpbmU6ICAgKGxpKSA9PiBcbiAgICAgICAgIyBrbG9nICdleHBvc2UnIGxpLCBsaVxuICAgICAgICBAZHJhd0xpbmVzIGxpLCBsaVxuICAgIG9uRXhwb3NlTGluZXM6IChlKSA9PiBcbiAgICAgICAgIyBrbG9nICdleHBvc2UnIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdFxuICAgICAgICBAZHJhd0xpbmVzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdFxuXG4gICAgb25WYW5pc2hMaW5lczogKGUpID0+XG4gICAgICAgIGlmIGUudG9wP1xuICAgICAgICAgICAgQGRyYXdMaW5lcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNsZWFyUmFuZ2UgQHNjcm9sbC5leHBvc2VCb3QsIEBzY3JvbGwuZXhwb3NlQm90K0BzY3JvbGwubnVtTGluZXNcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgb25DaGFuZ2VkOiAoY2hhbmdlSW5mbykgPT5cblxuICAgICAgICBAZHJhd1NlbGVjdGlvbnMoKSBpZiBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgQGRyYXdDdXJzb3JzKCkgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzXG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG5cbiAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBAZWRpdG9yLm51bUxpbmVzKClcblxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgYnJlYWsgaWYgbm90IGNoYW5nZS5jaGFuZ2UgaW4gWydkZWxldGVkJyAnaW5zZXJ0ZWQnXVxuICAgICAgICAgICAgbGkgPSBjaGFuZ2UuZG9JbmRleFxuICAgICAgICAgICAgIyBrbG9nICdjaGFuZ2VzJyBsaSwgbGkjLCBjaGFuZ2VcbiAgICAgICAgICAgIEBkcmF3TGluZXMgbGksIGxpXG5cbiAgICAgICAgaWYgbGkgPD0gQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgICAgICMga2xvZyAnb25DaGFuZ2VkJyBsaSwgQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgICAgIEBkcmF3TGluZXMgbGksIEBzY3JvbGwuZXhwb3NlQm90XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgb25EcmFnOiAoZHJhZywgZXZlbnQpID0+XG5cbiAgICAgICAgaWYgQHNjcm9sbC5mdWxsSGVpZ2h0ID4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBiciA9IEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICByeSA9IGV2ZW50LmNsaWVudFkgLSBici50b3BcbiAgICAgICAgICAgIHBjID0gMipyeSAvIEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgbGkgPSBwYXJzZUludCBwYyAqIEBlZGl0b3Iuc2Nyb2xsLm51bUxpbmVzXG4gICAgICAgICAgICBAanVtcFRvTGluZSBsaSwgZXZlbnRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGp1bXBUb0xpbmUgQGxpbmVJbmRleEZvckV2ZW50KGV2ZW50KSwgZXZlbnRcblxuICAgIG9uU3RhcnQ6IChkcmFnLGV2ZW50KSA9PiBAanVtcFRvTGluZSBAbGluZUluZGV4Rm9yRXZlbnQoZXZlbnQpLCBldmVudFxuXG4gICAganVtcFRvTGluZTogKGxpLCBldmVudCkgLT5cblxuICAgICAgICBAZWRpdG9yLnNjcm9sbC50byAobGktNSkgKiBAZWRpdG9yLnNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICAgICAgaWYgbm90IGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgWzAsIGxpKzVdLCBleHRlbmQ6ZXZlbnQuc2hpZnRLZXlcblxuICAgICAgICBAZWRpdG9yLmZvY3VzKClcbiAgICAgICAgQG9uRWRpdG9yU2Nyb2xsKClcblxuICAgIGxpbmVJbmRleEZvckV2ZW50OiAoZXZlbnQpIC0+XG5cbiAgICAgICAgc3QgPSBAZWxlbS5zY3JvbGxUb3BcbiAgICAgICAgYnIgPSBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBseSA9IGNsYW1wIDAsIEBlbGVtLm9mZnNldEhlaWdodCwgZXZlbnQuY2xpZW50WSAtIGJyLnRvcFxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoMipseS9Ac2Nyb2xsLmxpbmVIZWlnaHQpKSArIEBzY3JvbGwudG9wXG4gICAgICAgIGxpID0gcGFyc2VJbnQgTWF0aC5taW4oQHNjcm9sbC5udW1MaW5lcy0xLCBweSlcbiAgICAgICAgbGlcblxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgb25FZGl0b3JOdW1MaW5lczogKG4pID0+XG5cbiAgICAgICAgQG9uRWRpdG9yVmlld0hlaWdodCBAZWRpdG9yLnZpZXdIZWlnaHQoKSBpZiBuIGFuZCBAbGluZXMuaGVpZ2h0IDw9IEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIG5cblxuICAgIG9uRWRpdG9yVmlld0hlaWdodDogKGgpID0+XG5cbiAgICAgICAgQHNjcm9sbC5zZXRWaWV3SGVpZ2h0IDIqQGVkaXRvci52aWV3SGVpZ2h0KClcbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAgQG9uRWRpdG9yU2Nyb2xsKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkVkaXRvclNjcm9sbDogPT5cblxuICAgICAgICBpZiBAc2Nyb2xsLmZ1bGxIZWlnaHQgPiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIHBjID0gQGVkaXRvci5zY3JvbGwuc2Nyb2xsIC8gQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICB0cCA9IHBhcnNlSW50IHBjICogQHNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIEBzY3JvbGwudG8gdHBcbiAgICAgICAgQGRyYXdUb3BCb3QoKVxuXG4gICAgb25TY3JvbGw6ID0+XG5cbiAgICAgICAgeSA9IHBhcnNlSW50IC1AaGVpZ2h0LzQtQHNjcm9sbC5vZmZzZXRUb3AvMlxuICAgICAgICB4ID0gcGFyc2VJbnQgQHdpZHRoLzRcbiAgICAgICAgdCA9IFwidHJhbnNsYXRlM2QoI3t4fXB4LCAje3l9cHgsIDBweCkgc2NhbGUzZCgwLjUsIDAuNSwgMSlcIlxuXG4gICAgICAgIEBzZWxlY3RpLnN0eWxlLnRyYW5zZm9ybSA9IHRcbiAgICAgICAgQGhpZ2hsaWcuc3R5bGUudHJhbnNmb3JtID0gdFxuICAgICAgICBAY3Vyc29ycy5zdHlsZS50cmFuc2Zvcm0gPSB0XG4gICAgICAgIEBsaW5lcy5zdHlsZS50cmFuc2Zvcm0gICA9IHRcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xlYXJSYW5nZTogKHRvcCwgYm90KSAtPlxuXG4gICAgICAgIGN0eCA9IEBsaW5lcy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmNsZWFyUmVjdCAwLCAodG9wLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHQsIDIqQHdpZHRoLCAoYm90LXRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBjbGVhckFsbDogPT5cblxuICAgICAgICBAc2VsZWN0aS53aWR0aCA9IEBzZWxlY3RpLndpZHRoXG4gICAgICAgIEBoaWdobGlnLndpZHRoID0gQGhpZ2hsaWcud2lkdGhcbiAgICAgICAgQGN1cnNvcnMud2lkdGggPSBAY3Vyc29ycy53aWR0aFxuICAgICAgICBAdG9wYm90LndpZHRoICA9IEB0b3Bib3Qud2lkdGhcbiAgICAgICAgQGxpbmVzLndpZHRoICAgPSBAbGluZXMud2lkdGhcbiAgICAgICAgQHRvcGJvdC5zdHlsZS5oZWlnaHQgPSAnMCdcblxubW9kdWxlLmV4cG9ydHMgPSBNaW5pbWFwXG4iXX0=
//# sourceURL=../../coffee/editor/minimap.coffee