// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNERBQUE7SUFBQTs7QUFRQSxNQUFrQyxPQUFBLENBQVEsS0FBUixDQUFsQyxFQUFFLHVCQUFGLEVBQVksaUJBQVosRUFBbUIsZUFBbkIsRUFBeUI7O0FBRXpCLFNBQUEsR0FBWSxPQUFBLENBQVEsYUFBUjs7QUFDWixNQUFBLEdBQVksT0FBQSxDQUFRLGlCQUFSOztBQUVOO0lBRUMsaUJBQUMsTUFBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBRUEsWUFBQSxHQUFlLFFBQUEseURBQXdDLEdBQXhDO1FBRWYsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQTFCLEdBQXFDLFlBQUQsR0FBYztRQUVsRCxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUEsR0FBRTtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVU7UUFDVixJQUFDLENBQUEsVUFBRCxHQUFjO1FBRWQsSUFBQyxDQUFBLElBQUQsR0FBVyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFNBQVA7U0FBTDtRQUNYLElBQUMsQ0FBQSxNQUFELEdBQVcsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDWCxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUEsQ0FBSyxRQUFMLEVBQWM7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO1lBQTJCLEtBQUEsRUFBTyxJQUFDLENBQUEsS0FBbkM7WUFBMEMsTUFBQSxFQUFRLElBQUMsQ0FBQSxNQUFuRDtTQUFkO1FBQ1gsSUFBQyxDQUFBLEtBQUQsR0FBVyxJQUFBLENBQUssUUFBTCxFQUFjO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxjQUFQO1lBQTJCLEtBQUEsRUFBTyxJQUFDLENBQUEs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QUFDLEtBQVAsR0FBaUIsSUFBQyxDQUFBLEtBQUssQ0FBQztlQUN4QixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFkLEdBQXVCO0lBUGpCOzs7Ozs7QUFTZCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAwIDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4jIyNcblxueyBnZXRTdHlsZSwgY2xhbXAsIGVsZW0sIGRyYWcgfSA9IHJlcXVpcmUgJ2t4aydcblxuTWFwU2Nyb2xsID0gcmVxdWlyZSAnLi9tYXBzY3JvbGwnXG5jb2xvcnMgICAgPSByZXF1aXJlICcuLi90b29scy9jb2xvcnMnXG5cbmNsYXNzIE1pbmltYXBcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuXG4gICAgICAgIG1pbmltYXBXaWR0aCA9IHBhcnNlSW50IGdldFN0eWxlKCcubWluaW1hcCcgJ3dpZHRoJykgPyAxMzBcblxuICAgICAgICBAZWRpdG9yLmxheWVyU2Nyb2xsLnN0eWxlLnJpZ2h0ID0gXCIje21pbmltYXBXaWR0aH1weFwiXG5cbiAgICAgICAgQHdpZHRoID0gMiptaW5pbWFwV2lkdGhcbiAgICAgICAgQGhlaWdodCA9IDgxOTJcbiAgICAgICAgQG9mZnNldExlZnQgPSA2XG5cbiAgICAgICAgQGVsZW0gICAgPSBlbGVtIGNsYXNzOiAnbWluaW1hcCdcbiAgICAgICAgQHRvcGJvdCAgPSBlbGVtIGNsYXNzOiAndG9wYm90J1xuICAgICAgICBAc2VsZWN0aSA9IGVsZW0gJ2NhbnZhcycgY2xhc3M6ICdtaW5pbWFwU2VsZWN0aW9ucycgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG4gICAgICAgIEBsaW5lcyAgID0gZWxlbSAnY2FudmFzJyBjbGFzczogJ21pbmltYXBMaW5lcycgICAgICB3aWR0aDogQHdpZHRoLCBoZWlnaHQ6IEBoZWlnaHRcbiAgICAgICAgQGhpZ2hsaWcgPSBlbGVtICdjYW52YXMnIGNsYXNzOiAnbWluaW1hcEhpZ2hsaWdodHMnIHdpZHRoOiBAd2lkdGgsIGhlaWdodDogQGhlaWdodFxuICAgICAgICBAY3Vyc29ycyA9IGVsZW0gJ2NhbnZhcycgY2xhc3M6ICdtaW5pbWFwQ3Vyc29ycycgICAgd2lkdGg6IEB3aWR0aCwgaGVpZ2h0OiBAaGVpZ2h0XG5cbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQHRvcGJvdFxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAc2VsZWN0aVxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAbGluZXNcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGhpZ2hsaWdcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGN1cnNvcnNcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcgQGVkaXRvci5zY3JvbGxiYXI/Lm9uV2hlZWxcblxuICAgICAgICBAZWRpdG9yLnZpZXcuYXBwZW5kQ2hpbGQgICAgQGVsZW1cbiAgICAgICAgQGVkaXRvci5vbiAndmlld0hlaWdodCcgICAgIEBvbkVkaXRvclZpZXdIZWlnaHRcbiAgICAgICAgQGVkaXRvci5vbiAnbnVtTGluZXMnICAgICAgIEBvbkVkaXRvck51bUxpbmVzXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnICAgICAgICBAb25DaGFuZ2VkXG4gICAgICAgIEBlZGl0b3Iub24gJ2hpZ2hsaWdodCcgICAgICBAZHJhd0hpZ2hsaWdodHNcbiAgICAgICAgQGVkaXRvci5zY3JvbGwub24gJ3Njcm9sbCcgIEBvbkVkaXRvclNjcm9sbFxuXG4gICAgICAgIEBzY3JvbGwgPSBuZXcgTWFwU2Nyb2xsXG4gICAgICAgICAgICBleHBvc2VNYXg6ICBAaGVpZ2h0LzRcbiAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDRcbiAgICAgICAgICAgIHZpZXdIZWlnaHQ6IDIqQGVkaXRvci52aWV3SGVpZ2h0KClcblxuICAgICAgICBAc2Nyb2xsLm5hbWUgPSBcIiN7QGVkaXRvci5uYW1lfS5taW5pbWFwXCJcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZWxlbVxuICAgICAgICAgICAgb25TdGFydDogQG9uU3RhcnRcbiAgICAgICAgICAgIG9uTW92ZTogIEBvbkRyYWdcbiAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInXG5cbiAgICAgICAgQHNjcm9sbC5vbiAnY2xlYXJMaW5lcycgIEBjbGVhckFsbFxuICAgICAgICBAc2Nyb2xsLm9uICdzY3JvbGwnICAgICAgQG9uU2Nyb2xsXG4gICAgICAgIEBzY3JvbGwub24gJ2V4cG9zZUxpbmVzJyBAb25FeHBvc2VMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICd2YW5pc2hMaW5lcycgQG9uVmFuaXNoTGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAnZXhwb3NlTGluZScgIEBleHBvc2VMaW5lXG5cbiAgICAgICAgQG9uU2Nyb2xsKClcbiAgICAgICAgQGRyYXdMaW5lcygpXG4gICAgICAgIEBkcmF3VG9wQm90KClcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDBcblxuICAgIGRyYXdTZWxlY3Rpb25zOiA9PlxuXG4gICAgICAgIEBzZWxlY3RpLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQHNlbGVjdGkud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAc2VsZWN0aS5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IEBlZGl0b3Iuc3ludGF4LmNvbG9yRm9yQ2xhc3NuYW1lcyAnc2VsZWN0aW9uJ1xuICAgICAgICBmb3IgciBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3QsIEBlZGl0b3Iuc2VsZWN0aW9ucygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gclsxXVswXSBhbmQgQG9mZnNldExlZnQgb3IgMFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBvZmZzZXQrMipyWzFdWzBdLCB5LCAyKihyWzFdWzFdLXJbMV1bMF0pLCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgICAgICBjdHguZmlsbFJlY3QgMjYwLTYsIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgZHJhd0xpbmVzOiAodG9wPUBzY3JvbGwuZXhwb3NlVG9wLCBib3Q9QHNjcm9sbC5leHBvc2VCb3QpID0+XG5cbiAgICAgICAgIyBrbG9nIHRvcCwgYm90XG4gICAgICAgIGN0eCA9IEBsaW5lcy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgeSA9IHBhcnNlSW50KCh0b3AtQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodClcbiAgICAgICAgY3R4LmNsZWFyUmVjdCAwLCB5LCBAd2lkdGgsICgoYm90LUBzY3JvbGwuZXhwb3NlVG9wKS0odG9wLUBzY3JvbGwuZXhwb3NlVG9wKSsxKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBib3QgPSBNYXRoLm1pbiBib3QsIEBlZGl0b3IubnVtTGluZXMoKS0xXG4gICAgICAgIHJldHVybiBpZiBib3QgPCB0b3BcbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIGRpc3MgPSBAZWRpdG9yLnN5bnRheC5nZXREaXNzIGxpXG4gICAgICAgICAgICB5ID0gcGFyc2VJbnQoKGxpLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHQpXG4gICAgICAgICAgICBmb3IgciBpbiBkaXNzID8gW11cbiAgICAgICAgICAgICAgICBicmVhayBpZiAyKnIuc3RhcnQgPj0gQHdpZHRoXG4gICAgICAgICAgICAgICAgaWYgci5jbHNzP1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JDbGFzc25hbWVzIHIuY2xzcyArIFwiIG1pbmltYXBcIlxuICAgICAgICAgICAgICAgIGVsc2UgaWYgci5zdHlsP1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gQGVkaXRvci5zeW50YXguY29sb3JGb3JTdHlsZSByLnN0eWxcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcnNbMTVdXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IEBvZmZzZXRMZWZ0KzIqci5zdGFydCwgeSwgMipyLm1hdGNoLmxlbmd0aCwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBtZXRhID0gQGVkaXRvci5tZXRhLm1ldGFBdExpbmVJbmRleCBsaVxuICAgICAgICAgICAgICAgIGlmIG1ldGFbMl0uY2xzcyA9PSAnc3VjYydcbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGNvbG9yc1syMzRdXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCAwLCB5LCAyNjAsIDFcbiAgICAgICAgICAgICAgICBpZiBtZXRhWzJdLmNsc3MgPT0gJ2ZhaWwnXG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcnNbMV1cbiAgICAgICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDAsIHksIDI2MCwgMVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBkcmF3SGlnaGxpZ2h0czogPT5cblxuICAgICAgICBAaGlnaGxpZy5oZWlnaHQgPSBAaGVpZ2h0XG4gICAgICAgIEBoaWdobGlnLndpZHRoID0gQHdpZHRoXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcbiAgICAgICAgY3R4ID0gQGhpZ2hsaWcuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBAZWRpdG9yLnN5bnRheC5jb2xvckZvckNsYXNzbmFtZXMgJ2hpZ2hsaWdodCdcbiAgICAgICAgZm9yIHIgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90LCBAZWRpdG9yLmhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgeSA9IChyWzBdLUBzY3JvbGwuZXhwb3NlVG9wKSpAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgICAgIGlmIDIqclsxXVswXSA8IEB3aWR0aFxuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnJbMV1bMF0sIHksIDIqKHJbMV1bMV0tclsxXVswXSksIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDI2MC00LCB5LCA0LCBAc2Nyb2xsLmxpbmVIZWlnaHRcblxuICAgIGRyYXdDdXJzb3JzOiA9PlxuXG4gICAgICAgIEBjdXJzb3JzLmhlaWdodCA9IEBoZWlnaHRcbiAgICAgICAgQGN1cnNvcnMud2lkdGggPSBAd2lkdGhcbiAgICAgICAgcmV0dXJuIGlmIEBzY3JvbGwuZXhwb3NlQm90IDwgMFxuICAgICAgICBjdHggPSBAY3Vyc29ycy5nZXRDb250ZXh0ICcyZCdcbiAgICAgICAgZm9yIHIgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90LCByYW5nZXNGcm9tUG9zaXRpb25zIEBlZGl0b3IuY3Vyc29ycygpXG4gICAgICAgICAgICB5ID0gKHJbMF0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgaWYgMipyWzFdWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICcjZjgwJ1xuICAgICAgICAgICAgICAgIGN0eC5maWxsUmVjdCBAb2Zmc2V0TGVmdCsyKnJbMV1bMF0sIHksIDIsIEBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDI1NSwxMjgsMCwwLjUpJ1xuICAgICAgICAgICAgY3R4LmZpbGxSZWN0IDI2MC04LCB5LCA0LCBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgQGRyYXdNYWluQ3Vyc29yKClcblxuICAgIGRyYXdNYWluQ3Vyc29yOiAoYmxpbmspID0+XG5cbiAgICAgICAgY3R4ID0gQGN1cnNvcnMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBibGluayBhbmQgJyMwMDAnIG9yICcjZmYwJ1xuICAgICAgICBtYyA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIHkgPSAobWNbMV0tQHNjcm9sbC5leHBvc2VUb3ApKkBzY3JvbGwubGluZUhlaWdodFxuICAgICAgICBpZiAyKm1jWzBdIDwgQHdpZHRoXG4gICAgICAgICAgICBjdHguZmlsbFJlY3QgQG9mZnNldExlZnQrMiptY1swXSwgeSwgMiwgQHNjcm9sbC5saW5lSGVpZ2h0XG4gICAgICAgIGN0eC5maWxsUmVjdCAyNjAtOCwgeSwgOCwgQHNjcm9sbC5saW5lSGVpZ2h0XG5cbiAgICBkcmF3VG9wQm90OiA9PlxuXG4gICAgICAgIHJldHVybiBpZiBAc2Nyb2xsLmV4cG9zZUJvdCA8IDBcblxuICAgICAgICBsaCA9IEBzY3JvbGwubGluZUhlaWdodC8yXG4gICAgICAgIHRoID0gKEBlZGl0b3Iuc2Nyb2xsLmJvdC1AZWRpdG9yLnNjcm9sbC50b3ArMSkqbGhcbiAgICAgICAgdHkgPSAwXG4gICAgICAgIGlmIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICAgICAgdHkgPSAoTWF0aC5taW4oMC41KkBzY3JvbGwudmlld0hlaWdodCwgQHNjcm9sbC5udW1MaW5lcyoyKS10aCkgKiBAZWRpdG9yLnNjcm9sbC5zY3JvbGwgLyBAZWRpdG9yLnNjcm9sbC5zY3JvbGxNYXhcbiAgICAgICAgQHRvcGJvdC5zdHlsZS5oZWlnaHQgPSBcIiN7dGh9cHhcIlxuICAgICAgICBAdG9wYm90LnN0eWxlLnRvcCAgICA9IFwiI3t0eX1weFwiXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBleHBvc2VMaW5lOiAgIChsaSkgPT4gXG4gICAgICAgICMga2xvZyAnZXhwb3NlJyBsaSwgbGlcbiAgICAgICAgQGRyYXdMaW5lcyBsaSwgbGlcbiAgICBvbkV4cG9zZUxpbmVzOiAoZSkgPT4gXG4gICAgICAgICMga2xvZyAnZXhwb3NlJyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3RcbiAgICAgICAgQGRyYXdMaW5lcyBAc2Nyb2xsLmV4cG9zZVRvcCwgQHNjcm9sbC5leHBvc2VCb3RcblxuICAgIG9uVmFuaXNoTGluZXM6IChlKSA9PlxuICAgICAgICBpZiBlLnRvcD9cbiAgICAgICAgICAgIEBkcmF3TGluZXMgQHNjcm9sbC5leHBvc2VUb3AsIEBzY3JvbGwuZXhwb3NlQm90XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjbGVhclJhbmdlIEBzY3JvbGwuZXhwb3NlQm90LCBAc2Nyb2xsLmV4cG9zZUJvdCtAc2Nyb2xsLm51bUxpbmVzXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIG9uQ2hhbmdlZDogKGNoYW5nZUluZm8pID0+XG5cbiAgICAgICAgQGRyYXdTZWxlY3Rpb25zKCkgaWYgY2hhbmdlSW5mby5zZWxlY3RzXG4gICAgICAgIEBkcmF3Q3Vyc29ycygpICAgIGlmIGNoYW5nZUluZm8uY3Vyc29yc1xuXG4gICAgICAgIHJldHVybiBpZiBub3QgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuXG4gICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQGVkaXRvci5udW1MaW5lcygpXG5cbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIGJyZWFrIGlmIG5vdCBjaGFuZ2UuY2hhbmdlIGluIFsnZGVsZXRlZCcgJ2luc2VydGVkJ11cbiAgICAgICAgICAgIGxpID0gY2hhbmdlLmRvSW5kZXhcbiAgICAgICAgICAgICMga2xvZyAnY2hhbmdlcycgbGksIGxpIywgY2hhbmdlXG4gICAgICAgICAgICBAZHJhd0xpbmVzIGxpLCBsaVxuXG4gICAgICAgIGlmIGxpIDw9IEBzY3JvbGwuZXhwb3NlQm90XG4gICAgICAgICAgICAjIGtsb2cgJ29uQ2hhbmdlZCcgbGksIEBzY3JvbGwuZXhwb3NlQm90XG4gICAgICAgICAgICBAZHJhd0xpbmVzIGxpLCBAc2Nyb2xsLmV4cG9zZUJvdFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIG9uRHJhZzogKGRyYWcsIGV2ZW50KSA9PlxuXG4gICAgICAgIGlmIEBzY3JvbGwuZnVsbEhlaWdodCA+IEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICAgICAgYnIgPSBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgcnkgPSBldmVudC5jbGllbnRZIC0gYnIudG9wXG4gICAgICAgICAgICBwYyA9IDIqcnkgLyBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgICAgIGxpID0gcGFyc2VJbnQgcGMgKiBAZWRpdG9yLnNjcm9sbC5udW1MaW5lc1xuICAgICAgICAgICAgQGp1bXBUb0xpbmUgbGksIGV2ZW50XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBqdW1wVG9MaW5lIEBsaW5lSW5kZXhGb3JFdmVudChldmVudCksIGV2ZW50XG5cbiAgICBvblN0YXJ0OiAoZHJhZyxldmVudCkgPT4gQGp1bXBUb0xpbmUgQGxpbmVJbmRleEZvckV2ZW50KGV2ZW50KSwgZXZlbnRcblxuICAgIGp1bXBUb0xpbmU6IChsaSwgZXZlbnQpIC0+XG5cbiAgICAgICAgQGVkaXRvci5zY3JvbGwudG8gKGxpLTUpICogQGVkaXRvci5zY3JvbGwubGluZUhlaWdodFxuXG4gICAgICAgIGlmIG5vdCBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFswLCBsaSs1XSwgZXh0ZW5kOmV2ZW50LnNoaWZ0S2V5XG5cbiAgICAgICAgQGVkaXRvci5mb2N1cygpXG4gICAgICAgIEBvbkVkaXRvclNjcm9sbCgpXG5cbiAgICBsaW5lSW5kZXhGb3JFdmVudDogKGV2ZW50KSAtPlxuXG4gICAgICAgIHN0ID0gQGVsZW0uc2Nyb2xsVG9wXG4gICAgICAgIGJyID0gQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgbHkgPSBjbGFtcCAwLCBAZWxlbS5vZmZzZXRIZWlnaHQsIGV2ZW50LmNsaWVudFkgLSBici50b3BcbiAgICAgICAgcHkgPSBwYXJzZUludChNYXRoLmZsb29yKDIqbHkvQHNjcm9sbC5saW5lSGVpZ2h0KSkgKyBAc2Nyb2xsLnRvcFxuICAgICAgICBsaSA9IHBhcnNlSW50IE1hdGgubWluKEBzY3JvbGwubnVtTGluZXMtMSwgcHkpXG4gICAgICAgIGxpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcblxuICAgIG9uRWRpdG9yTnVtTGluZXM6IChuKSA9PlxuXG4gICAgICAgIEBvbkVkaXRvclZpZXdIZWlnaHQgQGVkaXRvci52aWV3SGVpZ2h0KCkgaWYgbiBhbmQgQGxpbmVzLmhlaWdodCA8PSBAc2Nyb2xsLmxpbmVIZWlnaHRcbiAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBuXG5cbiAgICBvbkVkaXRvclZpZXdIZWlnaHQ6IChoKSA9PlxuXG4gICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCAyKkBlZGl0b3Iudmlld0hlaWdodCgpXG4gICAgICAgIEBvblNjcm9sbCgpXG4gICAgICAgIEBvbkVkaXRvclNjcm9sbCgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25FZGl0b3JTY3JvbGw6ID0+XG5cbiAgICAgICAgaWYgQHNjcm9sbC5mdWxsSGVpZ2h0ID4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgICAgICBwYyA9IEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbCAvIEBlZGl0b3Iuc2Nyb2xsLnNjcm9sbE1heFxuICAgICAgICAgICAgdHAgPSBwYXJzZUludCBwYyAqIEBzY3JvbGwuc2Nyb2xsTWF4XG4gICAgICAgICAgICBAc2Nyb2xsLnRvIHRwXG4gICAgICAgIEBkcmF3VG9wQm90KClcblxuICAgIG9uU2Nyb2xsOiA9PlxuXG4gICAgICAgIHkgPSBwYXJzZUludCAtQGhlaWdodC80LUBzY3JvbGwub2Zmc2V0VG9wLzJcbiAgICAgICAgeCA9IHBhcnNlSW50IEB3aWR0aC80XG4gICAgICAgIHQgPSBcInRyYW5zbGF0ZTNkKCN7eH1weCwgI3t5fXB4LCAwcHgpIHNjYWxlM2QoMC41LCAwLjUsIDEpXCJcblxuICAgICAgICBAc2VsZWN0aS5zdHlsZS50cmFuc2Zvcm0gPSB0XG4gICAgICAgIEBoaWdobGlnLnN0eWxlLnRyYW5zZm9ybSA9IHRcbiAgICAgICAgQGN1cnNvcnMuc3R5bGUudHJhbnNmb3JtID0gdFxuICAgICAgICBAbGluZXMuc3R5bGUudHJhbnNmb3JtICAgPSB0XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFyUmFuZ2U6ICh0b3AsIGJvdCkgLT5cblxuICAgICAgICBjdHggPSBAbGluZXMuZ2V0Q29udGV4dCAnMmQnXG4gICAgICAgIGN0eC5jbGVhclJlY3QgMCwgKHRvcC1Ac2Nyb2xsLmV4cG9zZVRvcCkqQHNjcm9sbC5saW5lSGVpZ2h0LCAyKkB3aWR0aCwgKGJvdC10b3ApKkBzY3JvbGwubGluZUhlaWdodFxuXG4gICAgY2xlYXJBbGw6ID0+XG5cbiAgICAgICAgQHNlbGVjdGkud2lkdGggPSBAc2VsZWN0aS53aWR0aFxuICAgICAgICBAaGlnaGxpZy53aWR0aCA9IEBoaWdobGlnLndpZHRoXG4gICAgICAgIEBjdXJzb3JzLndpZHRoID0gQGN1cnNvcnMud2lkdGhcbiAgICAgICAgQHRvcGJvdC53aWR0aCAgPSBAdG9wYm90LndpZHRoXG4gICAgICAgIEBsaW5lcy53aWR0aCAgID0gQGxpbmVzLndpZHRoXG4gICAgICAgIEB0b3Bib3Quc3R5bGUuaGVpZ2h0ID0gJzAnXG5cbm1vZHVsZS5leHBvcnRzID0gTWluaW1hcFxuIl19
//# sourceURL=../../coffee/editor/minimap.coffee