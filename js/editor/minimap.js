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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0VBQUE7SUFBQTs7QUFRQSxNQUF3QyxPQUFBLENBQVEsS0FBUixDQUF4QyxFQUFFLHVCQUFGLEVBQVksaUJBQVosRUFBbUIsZUFBbkIsRUFBeUIsZUFBekIsRUFBK0I7O0FBRS9CLFNBQUEsR0FBWSxPQUFBLENBQVEsYUFBUjs7QUFDWixNQUFBLEdBQVksT0FBQSxDQUFRLGlCQUFSOztBQUVOO0lBRUMsaUJBQUMsTUFBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUEsWUFBQSxHQUFlLFFBQUEseURBQXdDLEdBQXhDO1FBRWYsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQTFCLEdBQXFDLFlBQUQsR0FBYztRQUVsRCxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsR0FBRTtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsVUFBRCxHQUFjO1FBRWQsSUFBQyxDQUFBLElBQUQsR0FBVyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQVA7U0FBTDtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDWCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUEsQ0FBSyxRQUFMLEVBQWM7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO1lBQTJCLEtBQUEsRUFBTyxJQUFDLENBQUEsS0FBbkM7WUFBMEMsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFuRDtTQUFkO1FBQ1gsSUFBQyxDQUFBLEtBQUQsR0FBVyxJQUFBLENBQUssUUFBTCxFQUFjO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO1lBQTJCLEtBQUEsRUFB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UCxHQUFpQixJQUFDLENBQUEsS0FBSyxDQUFDO2VBQ3hCLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQWQsR0FBdUI7SUFQakI7Ozs7OztBQVNkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwIDAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiMjI1xuXG57IGdldFN0eWxlLCBjbGFtcCwgZWxlbSwgZHJhZywga2xvZyB9ID0gcmVxdWlyZSAna3hrJyBcblxuTWFwU2Nyb2xsID0gcmVxdWlyZSAnLi9tYXBzY3JvbGwnXG5jb2xvcnMgICAgPSByZXF1aXJlICcuLi90b29scy9jb2xvcnMnXG5cbmNsYXNzIE1pbmltYXBcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuXG4gICAgICAgIG1pbmltYXBXaWR0aCA9IHBhcnNlSW50IGdldFN0eWxlKCcubWluaW1hcCcgJ3dpZHRoJykgPyAxMzBcblxuICAgICAgICBAZWRpdG9yLmxheWVyU2Nyb2xsLnN0eWxlLnJpZ2h0ID0gXCIje21pbmltYXBXaWR0aH1weFwiXG5cbiAgICAgICAgQHdpZHRoID0gMiptaW5pbWFwV2lkdGhcbiAgICAgICAgQGhlaWdodCA9IDgxOTJcbiAgICAgICAgQG9mZnNldExlZnQgPSA2XG5cbiAgICAgICAgQGVsZW0gICAgPSBlbGVtIGNsYXNzOiAnbWluaW1hcCdcbiAgICAgICAgQHRvcGJvdCAgPSBlbGVtIGNsYXNzOiAndG9wYm90J1xuICAgICAgICBAc2VsZWN0aSA9IGVsZW0gJ2NhbnZhcycgY2xhc3M6ICdtaW5pbWFwU2VsZWN0aW9ucycgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG4gICAgICAgIEBsaW5lcyAgID0gZWxlbSAnY2FudmFzJyBjbGFzczogJ21pbmltYXBMaW5lcycgICAgICB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcbiAgICAgICAgQGhpZ2hsaWcgPSBlbGVtICdjYW52YXMnIGNsYXNzOiAnbWluaW1hcEhpZ2hsaWdodHMnIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuICAgICAgICBAY3Vyc29ycyA9IGVsZW0gJ2NhbnZhcycgY2xhc3M6ICdtaW5pbWFwQ3Vyc29ycycgICAgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG5cbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQHRvcGJvdFxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAc2VsZWN0aVxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAbGluZXNcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGhpZ2hsaWdcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGN1cnNvcnNcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcgQGVkaXRvci5zY3JvbGxiYXI/Lm9uV2hlZWxcblxuICAgICAgICBAZWRpdG9yLnZpZXcuYXBwZW5kQ2hpbGQgICAgQGVsZW1cbiAgICAgICAgQGVkaXRvci5vbiAndmlld0hlaWdodCcgICAgIEBvbkVkaXRvclZpZXdIZWlnaHRcbiAgICAgICAgQGVkaXRvci5vbiAnbnVtTGluZXMnICAgICAgIEBvbkVkaXRvck51bUxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnICAgICAgICBAb25DaGFuZ2VkXG4gICAgICAgIEBlZGl0b3Iub24gJ2hpZ2hsaWdodCcgICAgICBAZHJhd0hpZ2hsaWdodHNcbiAgICAgICAgQGVkaXRvci5zY3JvbGwub24gJ3Njcm9sbCcgIEBvbkVkaXRvclNjcm9sbFxuXG4gICAgICAgIEBzY3JvbGwgPSBuZXcgTWFwU2Nyb2xsXG4gICAgICAgICAgICBleHBvc2VNYXg6ICBAaGVpZ2h0LzRcbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDRcbiAgICAgICAgICAgIHZpZXdIZWlnaHQ6IDIqQGVkaXRvci52aWV3SGVpZ2h0KClcblxuICAgICAgICBAc2Nyb2xsLm5hbWUgPSBcIiN7QGVkaXRvci5uYW1lfS5taW5pbWFwXCJcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZWxlbVxuICAgICAgICAgICAgb25TdGFydDogQG9uU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdcbiAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInXG5cbiAgICAgICAgQHNjcm9sbC5vbiAnY2xlYXJMaW5lcycgIEBjbGVhckFsbFxuICAgICAgICBAc2Nyb2xsLm9uICdzY3JvbGwnICAgICAgQG9uU2Nyb2xsXG4gICAgICAgIEBzY3JvbGwub24gJ2V4cG9zZUxpbmVzJyBAb25FeHBvc2VMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICd2YW5pc2hMaW5lcycgQG9uVmFuaXNoTGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAnZXhwb3NlTGluZScgIEBleHBvc2VMaW5lXG5cbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAga2xvZyAnbWluaW1hcCdcbiAgICAgICAgQGRyYXdMaW5lcygpXG4gICAgICAgIEBkcmF3VG9wQm90KClcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDBcblxuICAgIGRyYXdTZWxlY3Rpb25zOiA9PlxuXG4gICAgICAgIEBzZWxlY3RpLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQHNlbGVjdGkud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAc2VsZWN0aS5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyAnc2VsZWN0aW9uJ1xuICAgICAgICBmb3IgciBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3QsIEBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gclsxXVswXSBhbmQgQG9mZnNldExlZnQgb3IgMFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBvZmZzZXQrMipyWzFdWzBdLCB5LCAyKihyWzFdWzFdLXJbMV1bMF0pLCBAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGRyYXdMaW5lczogKHRvcD1Ac2Nyb2xsLmV4cG9zZVRvcCwgYm90PUBzY3JvbGwuZXhwb3NlQm90KSA9PlxuXG4gICAgICAgICMga2xvZyB0b3AsIGJvdFxuICAgICAgICBjdHggPSBAbGluZXMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIHkgPSBwYXJzZUludCgodG9wLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHQpXG4gICAgICAgIGN0eC5jbGVhclJlY3QgMCwgeSwgQHdpZHRoLCAoKGJvdC1Ac2Nyb2xsLmV4cG9zZVRvcCktKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkrMSkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcbiAgICAgICAgYm90ID0gTWF0aC5taW4gYm90LCBAZWRpdG9yLm51bUxpbmVzKCktMVxuICAgICAgICByZXR1cm4gaWYgYm90IDwgdG9wXG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBkaXNzID0gQGVkaXRvci5zeW50YXguZ2V0RGlzcyBsaVxuICAgICAgICAgICAgeSA9IHBhcnNlSW50KChsaS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0KVxuICAgICAgICAgICAgZm9yIHIgaW4gZGlzcyA/IFtdXG4gICAgICAgICAgICAgICAgYnJlYWsgaWYgMipyLnN0YXJ0ID49IEB3aWR0aFxuICAgICAgICAgICAgICAgIGlmIHIudmFsdWU/XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvckNsYXNzbmFtZXMgci52YWx1ZSArIFwiIG1pbmltYXBcIlxuICAgICAgICAgICAgICAgIGVsc2UgaWYgci5zdHlsP1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JTdHlsZSByLnN0eWxcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcnNbMTVdXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqci5zdGFydCwgeSwgMipyLm1hdGNoLmxlbmd0aCwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBtZXRhID0gQGVkaXRvci5tZXRhLm1ldGFBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY2xzcyA9PSAnc3VjYydcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yc1syMzRdXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCAwLCB5LCAyNjAsIDFcbiAgICAgICAgICAgICAgICBpZiBtZXRhWzJdLmNsc3MgPT0gJ2ZhaWwnXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcnNbMV1cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDAsIHksIDI2MCwgMVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBkcmF3SGlnaGxpZ2h0czogPT5cblxuICAgICAgICBAaGlnaGxpZy5oZWlnaHQgPSBAaGVpZ2h0XG4gICAgICAgIEBoaWdobGlnLndpZHRoID0gQHdpZHRoXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcbiAgICAgICAgY3R4ID0gQGhpZ2hsaWcuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvckNsYXNzbmFtZXMgJ2hpZ2hsaWdodCdcbiAgICAgICAgZm9yIHIgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90LCBAZWRpdG9yLmhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgeSA9IChyWzBdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGlmIDIqclsxXVswXSA8IEB3aWR0aFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnJbMV1bMF0sIHksIDIqKHJbMV1bMV0tclsxXVswXSksIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDAsIHksIEBvZmZzZXRMZWZ0LCBAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGRyYXdDdXJzb3JzOiA9PlxuXG4gICAgICAgIEBjdXJzb3JzLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQGN1cnNvcnMud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAY3Vyc29ycy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgZm9yIHIgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90LCByYW5nZXNGcm9tUG9zaXRpb25zIEBlZGl0b3IuY3Vyc29ycygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICcjZjgwJ1xuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnJbMV1bMF0sIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDI1NSwxMjgsMCwwLjUpJ1xuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0LTQsIHksIEBvZmZzZXRMZWZ0LTIsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBAZHJhd01haW5DdXJzb3IoKVxuXG4gICAgZHJhd01haW5DdXJzb3I6IChibGluaykgPT5cblxuICAgICAgICBjdHggPSBAY3Vyc29ycy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGJsaW5rIGFuZCAnIzAwMCcgb3IgJyNmZjAnXG4gICAgICAgIG1jID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgeSA9IChtY1sxXS1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIGlmIDIqbWNbMF0gPCBAd2lkdGhcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKm1jWzBdLCB5LCAyLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0LTQsIHksIEBvZmZzZXRMZWZ0LTIsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd1RvcEJvdDogPT5cblxuICAgICAgICByZXR1cm4gaWYgQHNjcm9sbC5leHBvc2VCb3QgPCAwXG5cbiAgICAgICAgbGggPSBAc2Nyb2xsLmxpbmVIZWlnaHQvMlxuICAgICAgICB0aCA9IChAZWRpdG9yLnNjcm9sbC5ib3QtQGVkaXRvci5zY3JvbGwudG9wKzEpKmxoXG4gICAgICAgIHR5ID0gMFxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIHR5ID0gKE1hdGgubWluKDAuNSpAc2Nyb2xsLnZpZXdIZWlnaHQsIEBzY3JvbGwubnVtTGluZXMqMiktdGgpICogQGVkaXRvci5zY3JvbGwuc2Nyb2xsIC8gQGVkaXRvci5zY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgIEB0b3Bib3Quc3R5bGUuaGVpZ2h0ID0gXCIje3RofXB4XCJcbiAgICAgICAgQHRvcGJvdC5zdHlsZS50b3AgICAgPSBcIiN7dHl9cHhcIlxuXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgZXhwb3NlTGluZTogICAobGkpID0+IFxuICAgICAgICAjIGtsb2cgJ2V4cG9zZScgbGksIGxpXG4gICAgICAgIEBkcmF3TGluZXMgbGksIGxpXG4gICAgb25FeHBvc2VMaW5lczogKGUpID0+IFxuICAgICAgICAjIGtsb2cgJ2V4cG9zZScgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90XG4gICAgICAgIEBkcmF3TGluZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90XG5cbiAgICBvblZhbmlzaExpbmVzOiAoZSkgPT5cbiAgICAgICAgaWYgZS50b3A/XG4gICAgICAgICAgICBAZHJhd0xpbmVzIEBzY3JvbGwuZXhwb3NlVG9wLCBAc2Nyb2xsLmV4cG9zZUJvdFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY2xlYXJSYW5nZSBAc2Nyb2xsLmV4cG9zZUJvdCwgQHNjcm9sbC5leHBvc2VCb3QrQHNjcm9sbC5udW1MaW5lc1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBvbkNoYW5nZWQ6IChjaGFuZ2VJbmZvKSA9PlxuXG4gICAgICAgIEBkcmF3U2VsZWN0aW9ucygpIGlmIGNoYW5nZUluZm8uc2VsZWN0c1xuICAgICAgICBAZHJhd0N1cnNvcnMoKSAgICBpZiBjaGFuZ2VJbmZvLmN1cnNvcnNcblxuICAgICAgICByZXR1cm4gaWYgbm90IGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcblxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBlZGl0b3IubnVtTGluZXMoKVxuXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBicmVhayBpZiBub3QgY2hhbmdlLmNoYW5nZSBpbiBbJ2RlbGV0ZWQnICdpbnNlcnRlZCddXG4gICAgICAgICAgICBsaSA9IGNoYW5nZS5kb0luZGV4XG4gICAgICAgICAgICAjIGtsb2cgJ2NoYW5nZXMnIGxpLCBsaSMsIGNoYW5nZVxuICAgICAgICAgICAgQGRyYXdMaW5lcyBsaSwgbGlcblxuICAgICAgICBpZiBsaSA8PSBAc2Nyb2xsLmV4cG9zZUJvdFxuICAgICAgICAgICAgIyBrbG9nICdvbkNoYW5nZWQnIGxpLCBAc2Nyb2xsLmV4cG9zZUJvdFxuICAgICAgICAgICAgQGRyYXdMaW5lcyBsaSwgQHNjcm9sbC5leHBvc2VCb3RcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBvbkRyYWc6IChkcmFnLCBldmVudCkgPT5cblxuICAgICAgICBpZiBAc2Nyb2xsLmZ1bGxIZWlnaHQgPiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIGJyID0gQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIHJ5ID0gZXZlbnQuY2xpZW50WSAtIGJyLnRvcFxuICAgICAgICAgICAgcGMgPSAyKnJ5IC8gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBsaSA9IHBhcnNlSW50IHBjICogQGVkaXRvci5zY3JvbGwubnVtTGluZXNcbiAgICAgICAgICAgIEBqdW1wVG9MaW5lIGxpLCBldmVudFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAanVtcFRvTGluZSBAbGluZUluZGV4Rm9yRXZlbnQoZXZlbnQpLCBldmVudFxuXG4gICAgb25TdGFydDogKGRyYWcsZXZlbnQpID0+IEBqdW1wVG9MaW5lIEBsaW5lSW5kZXhGb3JFdmVudChldmVudCksIGV2ZW50XG5cbiAgICBqdW1wVG9MaW5lOiAobGksIGV2ZW50KSAtPlxuXG4gICAgICAgIEBlZGl0b3Iuc2Nyb2xsLnRvIChsaS01KSAqIEBlZGl0b3Iuc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgICAgICBpZiBub3QgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBbMCwgbGkrNV0sIGV4dGVuZDpldmVudC5zaGlmdEtleVxuXG4gICAgICAgIEBlZGl0b3IuZm9jdXMoKVxuICAgICAgICBAb25FZGl0b3JTY3JvbGwoKVxuXG4gICAgbGluZUluZGV4Rm9yRXZlbnQ6IChldmVudCkgLT5cblxuICAgICAgICBzdCA9IEBlbGVtLnNjcm9sbFRvcFxuICAgICAgICBiciA9IEBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIGx5ID0gY2xhbXAgMCwgQGVsZW0ub2Zmc2V0SGVpZ2h0LCBldmVudC5jbGllbnRZIC0gYnIudG9wXG4gICAgICAgIHB5ID0gcGFyc2VJbnQoTWF0aC5mbG9vcigyKmx5L0BzY3JvbGwubGluZUhlaWdodCkpICsgQHNjcm9sbC50b3BcbiAgICAgICAgbGkgPSBwYXJzZUludCBNYXRoLm1pbihAc2Nyb2xsLm51bUxpbmVzLTEsIHB5KVxuICAgICAgICBsaVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBvbkVkaXRvck51bUxpbmVzOiAobikgPT5cblxuICAgICAgICBAb25FZGl0b3JWaWV3SGVpZ2h0IEBlZGl0b3Iudmlld0hlaWdodCgpIGlmIG4gYW5kIEBsaW5lcy5oZWlnaHQgPD0gQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgblxuXG4gICAgb25FZGl0b3JWaWV3SGVpZ2h0OiAoaCkgPT5cblxuICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgMipAZWRpdG9yLnZpZXdIZWlnaHQoKVxuICAgICAgICBAb25TY3JvbGwoKVxuICAgICAgICBAb25FZGl0b3JTY3JvbGwoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIG9uRWRpdG9yU2Nyb2xsOiA9PlxuXG4gICAgICAgIGlmIEBzY3JvbGwuZnVsbEhlaWdodCA+IEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgcGMgPSBAZWRpdG9yLnNjcm9sbC5zY3JvbGwgLyBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgICAgIHRwID0gcGFyc2VJbnQgcGMgKiBAc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICAgICAgQHNjcm9sbC50byB0cFxuICAgICAgICBAZHJhd1RvcEJvdCgpXG5cbiAgICBvblNjcm9sbDogPT5cblxuICAgICAgICB5ID0gcGFyc2VJbnQgLUBoZWlnaHQvNC1Ac2Nyb2xsLm9mZnNldFRvcC8yXG4gICAgICAgIHggPSBwYXJzZUludCBAd2lkdGgvNFxuICAgICAgICB0ID0gXCJ0cmFuc2xhdGUzZCgje3h9cHgsICN7eX1weCwgMHB4KSBzY2FsZTNkKDAuNSwgMC41LCAxKVwiXG5cbiAgICAgICAgQHNlbGVjdGkuc3R5bGUudHJhbnNmb3JtID0gdFxuICAgICAgICBAaGlnaGxpZy5zdHlsZS50cmFuc2Zvcm0gPSB0XG4gICAgICAgIEBjdXJzb3JzLnN0eWxlLnRyYW5zZm9ybSA9IHRcbiAgICAgICAgQGxpbmVzLnN0eWxlLnRyYW5zZm9ybSAgID0gdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGVhclJhbmdlOiAodG9wLCBib3QpIC0+XG5cbiAgICAgICAgY3R4ID0gQGxpbmVzLmdldENvbnRleHQgJzJkJ1xuICAgICAgICBjdHguY2xlYXJSZWN0IDAsICh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodCwgMipAd2lkdGgsIChib3QtdG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGNsZWFyQWxsOiA9PlxuXG4gICAgICAgIEBzZWxlY3RpLndpZHRoID0gQHNlbGVjdGkud2lkdGhcbiAgICAgICAgQGhpZ2hsaWcud2lkdGggPSBAaGlnaGxpZy53aWR0aFxuICAgICAgICBAY3Vyc29ycy53aWR0aCA9IEBjdXJzb3JzLndpZHRoXG4gICAgICAgIEB0b3Bib3Qud2lkdGggID0gQHRvcGJvdC53aWR0aFxuICAgICAgICBAbGluZXMud2lkdGggICA9IEBsaW5lcy53aWR0aFxuICAgICAgICBAdG9wYm90LnN0eWxlLmhlaWdodCA9ICcwJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1pbmltYXBcbiJdfQ==
//# sourceURL=../../coffee/editor/minimap.coffee