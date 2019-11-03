// koffee 1.4.0

/*
000000000  00000000  000   000  000000000        00000000  0000000    000  000000000   0000000   00000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     0000000     00000       000           0000000   000   000  000     000     000   000  0000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     00000000  000   000     000           00000000  0000000    000     000      0000000   000   000
 */
var $, Editor, EditorScroll, TextEditor, _, clamp, drag, electron, elem, empty, kerror, keyinfo, kstr, os, post, prefs, ref, render, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, prefs = ref.prefs, clamp = ref.clamp, empty = ref.empty, elem = ref.elem, kstr = ref.kstr, drag = ref.drag, os = ref.os, kerror = ref.kerror, $ = ref.$, _ = ref._;

render = require('./render');

EditorScroll = require('./editorscroll');

Editor = require('./editor');

electron = require('electron');

TextEditor = (function(superClass) {
    extend(TextEditor, superClass);

    function TextEditor(term, config) {
        var feature, featureClss, featureName, i, layer, len, ref1, ref2;
        this.term = term;
        this.onKeyDown = bind(this.onKeyDown, this);
        this.onClickTimeout = bind(this.onClickTimeout, this);
        this.startClickTimer = bind(this.startClickTimer, this);
        this.doBlink = bind(this.doBlink, this);
        this.releaseBlink = bind(this.releaseBlink, this);
        this.shiftLines = bind(this.shiftLines, this);
        this.showLines = bind(this.showLines, this);
        this.ansiLine = bind(this.ansiLine, this);
        this.setFontSize = bind(this.setFontSize, this);
        this.clear = bind(this.clear, this);
        this.onBlur = bind(this.onBlur, this);
        this.onFocus = bind(this.onFocus, this);
        this.view = elem({
            "class": 'editor',
            tabindex: '0'
        });
        this.term.div.appendChild(this.view);
        TextEditor.__super__.constructor.call(this, 'editor', config);
        this.clickCount = 0;
        this.layers = elem({
            "class": 'layers'
        });
        this.layerScroll = elem({
            "class": 'layerScroll',
            child: this.layers
        });
        this.view.appendChild(this.layerScroll);
        layer = [];
        layer.push('selections');
        layer.push('highlights');
        if (indexOf.call(this.config.features, 'Meta') >= 0) {
            layer.push('meta');
        }
        layer.push('lines');
        layer.push('cursors');
        if (indexOf.call(this.config.features, 'Numbers') >= 0) {
            layer.push('numbers');
        }
        this.initLayers(layer);
        this.size = {};
        this.elem = this.layerDict.lines;
        this.ansiLines = [];
        this.spanCache = [];
        this.lineDivs = {};
        this.setFontSize(prefs.get("fontSize", (ref1 = this.config.fontSize) != null ? ref1 : 18));
        this.scroll = new EditorScroll(this);
        this.scroll.on('shiftLines', this.shiftLines);
        this.scroll.on('showLines', this.showLines);
        this.view.addEventListener('blur', this.onBlur);
        this.view.addEventListener('focus', this.onFocus);
        this.view.addEventListener('keydown', this.onKeyDown);
        this.initDrag();
        ref2 = this.config.features;
        for (i = 0, len = ref2.length; i < len; i++) {
            feature = ref2[i];
            if (feature === 'CursorLine') {
                this.cursorLine = elem('div', {
                    "class": 'cursor-line'
                });
            } else {
                featureName = feature.toLowerCase();
                featureClss = require("./" + featureName);
                this[featureName] = new featureClss(this);
            }
        }
    }

    TextEditor.prototype.del = function() {
        var ref1;
        if ((ref1 = this.scrollbar) != null) {
            ref1.del();
        }
        this.view.removeEventListener('keydown', this.onKeyDown);
        this.view.removeEventListener('blur', this.onBlur);
        this.view.removeEventListener('focus', this.onFocus);
        this.view.innerHTML = '';
        return TextEditor.__super__.del.call(this);
    };

    TextEditor.prototype.isInputCursor = function() {
        return this.mainCursor()[1] >= this.numLines() - 1;
    };

    TextEditor.prototype.restoreInputCursor = function() {
        var col, ref1;
        if (this.isInputCursor()) {
            return this.state.cursors();
        } else {
            col = (ref1 = this.inputCursor) != null ? ref1 : this["do"].line(this.numLines() - 1).length;
            return [[col, this.numLines() - 1]];
        }
    };

    TextEditor.prototype.onFocus = function() {
        this.startBlink();
        this.emit('focus', this);
        return post.emit('editorFocus', this);
    };

    TextEditor.prototype.onBlur = function() {
        this.stopBlink();
        return this.emit('blur', this);
    };

    TextEditor.prototype.initLayers = function(layerClasses) {
        var cls, i, len, results;
        this.layerDict = {};
        results = [];
        for (i = 0, len = layerClasses.length; i < len; i++) {
            cls = layerClasses[i];
            results.push(this.layerDict[cls] = this.addLayer(cls));
        }
        return results;
    };

    TextEditor.prototype.addLayer = function(cls) {
        var div;
        div = elem({
            "class": cls
        });
        this.layers.appendChild(div);
        return div;
    };

    TextEditor.prototype.updateLayers = function() {
        this.renderHighlights();
        this.renderSelection();
        return this.renderCursors();
    };

    TextEditor.prototype.clear = function() {
        return this.setLines(['']);
    };

    TextEditor.prototype.setLines = function(lines) {
        var viewHeight;
        this.elem.innerHTML = '';
        this.emit('clearLines');
        if (lines != null) {
            lines;
        } else {
            lines = [];
        }
        this.spanCache = [];
        this.lineDivs = {};
        this.ansiLines = [];
        this.scroll.reset();
        TextEditor.__super__.setLines.call(this, lines);
        viewHeight = this.viewHeight();
        this.scroll.start(viewHeight, this.numLines());
        this.layerScroll.scrollLeft = 0;
        this.layersWidth = this.layerScroll.offsetWidth;
        this.layersHeight = this.layerScroll.offsetHeight;
        return this.updateLayers();
    };

    TextEditor.prototype.setInputText = function(text) {
        var li;
        text = text.split('\n')[0];
        if (text != null) {
            text;
        } else {
            text = '';
        }
        li = this.numLines() - 1;
        this["do"].start();
        this.deleteCursorLines();
        this["do"].change(li, text);
        this["do"].setCursors([[text.length, li]]);
        return this["do"].end();
    };

    TextEditor.prototype.replaceTextInLine = function(li, text) {
        if (text == null) {
            text = '';
        }
        this["do"].start();
        this["do"].change(li, text);
        return this["do"].end();
    };

    TextEditor.prototype.appendText = function(text) {
        var appended, i, j, l, len, len1, li, ls, showLines;
        if (text == null) {
            console.log(this.name + ".appendText - no text?");
            return;
        }
        appended = [];
        ls = text != null ? text.split(/\n/) : void 0;
        for (i = 0, len = ls.length; i < len; i++) {
            l = ls[i];
            this.state = this.state.appendLine(l);
            appended.push(this.numLines() - 1);
        }
        if (this.scroll.viewHeight !== this.viewHeight()) {
            this.scroll.setViewHeight(this.viewHeight());
        }
        showLines = (this.scroll.bot < this.scroll.top) || (this.scroll.bot < this.scroll.viewLines);
        this.scroll.setNumLines(this.numLines(), {
            showLines: showLines
        });
        for (j = 0, len1 = appended.length; j < len1; j++) {
            li = appended[j];
            this.emit('lineAppended', {
                lineIndex: li,
                text: this.line(li)
            });
        }
        this.emit('linesAppended', ls);
        return this.emit('numLines', this.numLines());
    };

    TextEditor.prototype.appendOutput = function(text) {
        var i, l, len, ls, stripped;
        this["do"].start();
        ls = text != null ? text.split(/\n/) : void 0;
        for (i = 0, len = ls.length; i < len; i++) {
            l = ls[i];
            stripped = kstr.stripAnsi(l);
            if (l !== stripped) {
                this.ansiLines[this["do"].numLines() - 1] = l;
            }
            this["do"].insert(this["do"].numLines() - 1, stripped);
        }
        this["do"].end();
        this.singleCursorAtEnd();
        return this;
    };

    TextEditor.prototype.setFontSize = function(fontSize) {
        var ansi, i, len, meta, metas, ref1;
        this.layers.style.fontSize = fontSize + "px";
        this.size.numbersWidth = indexOf.call(this.config.features, 'Numbers') >= 0 && 36 || 0;
        this.size.fontSize = fontSize;
        this.size.lineHeight = fontSize * 1.25;
        this.size.charWidth = fontSize * 0.6;
        this.size.offsetX = Math.floor(this.size.charWidth + this.size.numbersWidth);
        if ((ref1 = this.scroll) != null) {
            ref1.setLineHeight(this.size.lineHeight);
        }
        if (this.text()) {
            ansi = this.ansiText();
            metas = this.meta.metas;
            this.term.clear();
            this.appendOutput(ansi);
            for (i = 0, len = metas.length; i < len; i++) {
                meta = metas[i];
                meta[2].line = meta[0];
                this.meta.add(meta[2]);
            }
        }
        return this.emit('fontSizeChanged');
    };

    TextEditor.prototype.ansiText = function() {
        var i, li, ref1, ref2, text;
        text = '';
        for (li = i = 0, ref1 = this.numLines() - 1; 0 <= ref1 ? i < ref1 : i > ref1; li = 0 <= ref1 ? ++i : --i) {
            text += (ref2 = this.ansiLines[li]) != null ? ref2 : this.state.line(li);
            text += '\n';
        }
        return text.slice(0, +(text.length - 2) + 1 || 9e9);
    };

    TextEditor.prototype.ansiLine = function(li) {
        return this.ansiLines[li];
    };

    TextEditor.prototype.changed = function(changeInfo) {
        var ch, change, di, i, len, li, ref1, ref2;
        this.syntax.changed(changeInfo);
        ref1 = changeInfo.changes;
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            ref2 = [change.doIndex, change.newIndex, change.change], di = ref2[0], li = ref2[1], ch = ref2[2];
            switch (ch) {
                case 'changed':
                    this.ansiLines[li] = null;
                    this.updateLine(li, di);
                    this.emit('lineChanged', li);
                    break;
                case 'deleted':
                    this.spanCache = this.spanCache.slice(0, di);
                    this.ansiLines.splice(di, 1);
                    this.emit('lineDeleted', di);
                    break;
                case 'inserted':
                    this.spanCache = this.spanCache.slice(0, di);
                    this.emit('lineInserted', li, di);
            }
        }
        if (changeInfo.inserts || changeInfo.deletes) {
            this.layersWidth = this.layerScroll.offsetWidth;
            this.scroll.setNumLines(this.numLines());
            this.updateLinePositions();
        }
        if (changeInfo.changes.length) {
            this.clearHighlights();
        }
        if (changeInfo.cursors) {
            this.renderCursors();
            this.scroll.cursorIntoView();
            this.emit('cursor');
            this.suspendBlink();
        }
        if (changeInfo.selects) {
            this.renderSelection();
            this.emit('selection');
        }
        return this.emit('changed', changeInfo);
    };

    TextEditor.prototype.updateLine = function(li, oi) {
        var div;
        if (oi == null) {
            oi = li;
        }
        if (li < this.scroll.top || li > this.scroll.bot) {
            if (this.lineDivs[li] != null) {
                kerror("dangling line div? " + li, this.lineDivs[li]);
            }
            delete this.spanCache[li];
            return;
        }
        if (!this.lineDivs[oi]) {
            return kerror("updateLine - out of bounds? li " + li + " oi " + oi);
        }
        this.spanCache[li] = this.renderSpan(li);
        div = this.lineDivs[oi];
        return div.replaceChild(this.spanCache[li], div.firstChild);
    };

    TextEditor.prototype.refreshLines = function(top, bot) {
        var i, li, ref1, ref2, results;
        results = [];
        for (li = i = ref1 = top, ref2 = bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            this.syntax.getDiss(li, true);
            results.push(this.updateLine(li));
        }
        return results;
    };

    TextEditor.prototype.showLines = function(top, bot, num) {
        var i, li, ref1, ref2;
        this.lineDivs = {};
        this.elem.innerHTML = '';
        for (li = i = ref1 = top, ref2 = bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            this.appendLine(li);
        }
        this.updateLinePositions();
        this.updateLayers();
        this.emit('linesExposed', {
            top: top,
            bot: bot,
            num: num
        });
        return this.emit('linesShown', top, bot, num);
    };

    TextEditor.prototype.appendLine = function(li) {
        this.lineDivs[li] = elem({
            "class": 'line'
        });
        this.lineDivs[li].appendChild(this.cachedSpan(li));
        return this.elem.appendChild(this.lineDivs[li]);
    };

    TextEditor.prototype.shiftLines = function(top, bot, num) {
        var divInto, oldBot, oldTop;
        oldTop = top - num;
        oldBot = bot - num;
        divInto = (function(_this) {
            return function(li, lo) {
                var span, tx;
                if (!_this.lineDivs[lo]) {
                    kerror(_this.name + ".shiftLines.divInto - no div? " + top + " " + bot + " " + num + " old " + oldTop + " " + oldBot + " lo " + lo + " li " + li);
                    return;
                }
                _this.lineDivs[li] = _this.lineDivs[lo];
                delete _this.lineDivs[lo];
                _this.lineDivs[li].replaceChild(_this.cachedSpan(li), _this.lineDivs[li].firstChild);
                if (_this.showInvisibles) {
                    tx = _this.line(li).length * _this.size.charWidth + 1;
                    span = elem('span', {
                        "class": "invisible newline",
                        html: '&#9687'
                    });
                    span.style.transform = "translate(" + tx + "px, -1.5px)";
                    return _this.lineDivs[li].appendChild(span);
                }
            };
        })(this);
        if (num > 0) {
            while (oldBot < bot) {
                oldBot += 1;
                divInto(oldBot, oldTop);
                oldTop += 1;
            }
        } else {
            while (oldTop > top) {
                oldTop -= 1;
                divInto(oldTop, oldBot);
                oldBot -= 1;
            }
        }
        this.emit('linesShifted', top, bot, num);
        this.updateLinePositions();
        return this.updateLayers();
    };

    TextEditor.prototype.updateLinePositions = function(animate) {
        var div, li, ref1, resetTrans, y;
        if (animate == null) {
            animate = 0;
        }
        ref1 = this.lineDivs;
        for (li in ref1) {
            div = ref1[li];
            if ((div == null) || (div.style == null)) {
                return kerror('no div? style?', div != null, (div != null ? div.style : void 0) != null);
            }
            y = this.size.lineHeight * (li - this.scroll.top);
            div.style.transform = "translate3d(" + this.size.offsetX + "px," + y + "px, 0)";
            if (animate) {
                div.style.transition = "all " + (animate / 1000) + "s";
            }
            div.style.zIndex = li;
        }
        if (animate) {
            resetTrans = (function(_this) {
                return function() {
                    var c, i, len, ref2, results;
                    ref2 = _this.elem.children;
                    results = [];
                    for (i = 0, len = ref2.length; i < len; i++) {
                        c = ref2[i];
                        results.push(c.style.transition = 'initial');
                    }
                    return results;
                };
            })(this);
            return setTimeout(resetTrans, animate);
        }
    };

    TextEditor.prototype.updateLines = function() {
        var i, li, ref1, ref2, results;
        results = [];
        for (li = i = ref1 = this.scroll.top, ref2 = this.scroll.bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            results.push(this.updateLine(li));
        }
        return results;
    };

    TextEditor.prototype.clearHighlights = function() {
        if (this.numHighlights()) {
            $('.highlights', this.layers).innerHTML = '';
            return TextEditor.__super__.clearHighlights.call(this);
        }
    };

    TextEditor.prototype.renderSpan = function(li) {
        var ansi, diss, ref1, span;
        if ((ref1 = this.ansiLines[li]) != null ? ref1.length : void 0) {
            ansi = new kstr.ansi;
            diss = ansi.dissect(this.ansiLines[li])[1];
            return span = render.lineSpan(diss, this.size);
        } else {
            return span = render.lineSpan(this.syntax.getDiss(li), this.size);
        }
    };

    TextEditor.prototype.cachedSpan = function(li) {
        if (!this.spanCache[li]) {
            this.spanCache[li] = this.renderSpan(li);
        }
        return this.spanCache[li];
    };

    TextEditor.prototype.renderCursors = function() {
        var c, cs, cursorLine, html, i, j, len, len1, line, mc, ref1, ri, ty, vc;
        cs = [];
        ref1 = this.cursors();
        for (i = 0, len = ref1.length; i < len; i++) {
            c = ref1[i];
            if (c[1] >= this.scroll.top && c[1] <= this.scroll.bot) {
                cs.push([c[0], c[1] - this.scroll.top]);
            }
        }
        mc = this.mainCursor();
        if (this.numCursors() === 1) {
            if (cs.length === 1) {
                if (mc[1] < 0) {
                    return;
                }
                if (mc[1] > this.numLines() - 1) {
                    return kerror(this.name + ".renderCursors mainCursor DAFUK?", this.numLines(), kstr(this.mainCursor()));
                }
                ri = mc[1] - this.scroll.top;
                cursorLine = this.state.line(mc[1]);
                if (cursorLine == null) {
                    return kerror('no main cursor line?');
                }
                if (mc[0] > cursorLine.length) {
                    cs[0][2] = 'virtual';
                    cs.push([cursorLine.length, ri, 'main off']);
                } else {
                    cs[0][2] = 'main off';
                }
            }
        } else if (this.numCursors() > 1) {
            vc = [];
            for (j = 0, len1 = cs.length; j < len1; j++) {
                c = cs[j];
                if (isSamePos(this.mainCursor(), [c[0], c[1] + this.scroll.top])) {
                    c[2] = 'main';
                }
                line = this.line(this.scroll.top + c[1]);
                if (c[0] > line.length) {
                    vc.push([line.length, c[1], 'virtual']);
                }
            }
            cs = cs.concat(vc);
        }
        html = render.cursors(cs, this.size);
        this.layerDict.cursors.innerHTML = html;
        ty = (mc[1] - this.scroll.top) * this.size.lineHeight;
        if (this.cursorLine) {
            this.cursorLine.style = "z-index:0;transform:translate3d(0," + ty + "px,0); height:" + this.size.lineHeight + "px;width:100%;";
            return this.layers.insertBefore(this.cursorLine, this.layers.firstChild);
        }
    };

    TextEditor.prototype.renderSelection = function() {
        var h, s;
        h = "";
        if (s = this.selectionsInLineIndexRangeRelativeToLineIndex([this.scroll.top, this.scroll.bot], this.scroll.top)) {
            h += render.selection(s, this.size);
        }
        return this.layerDict.selections.innerHTML = h;
    };

    TextEditor.prototype.renderHighlights = function() {
        var h, s;
        h = "";
        if (s = this.highlightsInLineIndexRangeRelativeToLineIndex([this.scroll.top, this.scroll.bot], this.scroll.top)) {
            h += render.selection(s, this.size, "highlight");
        }
        return this.layerDict.highlights.innerHTML = h;
    };

    TextEditor.prototype.cursorDiv = function() {
        return $('.cursor.main', this.layerDict['cursors']);
    };

    TextEditor.prototype.suspendBlink = function() {
        var blinkDelay, ref1;
        if (!this.blinkTimer) {
            return;
        }
        this.stopBlink();
        if ((ref1 = this.cursorDiv()) != null) {
            ref1.classList.toggle('blink', false);
        }
        clearTimeout(this.suspendTimer);
        blinkDelay = prefs.get('cursorBlinkDelay', [800, 200]);
        return this.suspendTimer = setTimeout(this.releaseBlink, blinkDelay[0]);
    };

    TextEditor.prototype.releaseBlink = function() {
        clearTimeout(this.suspendTimer);
        delete this.suspendTimer;
        return this.startBlink();
    };

    TextEditor.prototype.toggleBlink = function() {
        var blink;
        blink = !prefs.get('blink', false);
        prefs.set('blink', blink);
        if (blink) {
            return this.startBlink();
        } else {
            return this.stopBlink();
        }
    };

    TextEditor.prototype.doBlink = function() {
        var blinkDelay, ref1, ref2;
        this.blink = !this.blink;
        if ((ref1 = this.cursorDiv()) != null) {
            ref1.classList.toggle('blink', this.blink);
        }
        if ((ref2 = this.minimap) != null) {
            ref2.drawMainCursor(this.blink);
        }
        clearTimeout(this.blinkTimer);
        blinkDelay = prefs.get('cursorBlinkDelay', [800, 200]);
        return this.blinkTimer = setTimeout(this.doBlink, this.blink && blinkDelay[1] || blinkDelay[0]);
    };

    TextEditor.prototype.startBlink = function() {
        if (!this.blinkTimer && prefs.get('blink')) {
            return this.doBlink();
        }
    };

    TextEditor.prototype.stopBlink = function() {
        var ref1;
        if ((ref1 = this.cursorDiv()) != null) {
            ref1.classList.toggle('blink', false);
        }
        clearTimeout(this.blinkTimer);
        return delete this.blinkTimer;
    };

    TextEditor.prototype.resized = function() {
        var ref1, vh;
        vh = this.view.parentNode.clientHeight;
        if (vh && vh === this.scroll.viewHeight) {
            return;
        }
        if ((ref1 = this.numbers) != null) {
            ref1.elem.style.height = (this.scroll.exposeNum * this.scroll.lineHeight) + "px";
        }
        this.layersWidth = this.layerScroll.offsetWidth;
        this.scroll.setViewHeight(vh);
        return this.emit('viewHeight', vh);
    };

    TextEditor.prototype.screenSize = function() {
        return electron.remote.screen.getPrimaryDisplay().workAreaSize;
    };

    TextEditor.prototype.posAtXY = function(x, y) {
        var br, lx, ly, p, px, py, sl, st;
        sl = this.layerScroll.scrollLeft;
        st = this.scroll.offsetTop;
        br = this.view.getBoundingClientRect();
        lx = clamp(0, this.layers.offsetWidth, x - br.left - this.size.offsetX + this.size.charWidth / 3);
        ly = clamp(0, this.layers.offsetHeight, y - br.top);
        px = parseInt(Math.floor((Math.max(0, sl + lx)) / this.size.charWidth));
        py = parseInt(Math.floor((Math.max(0, st + ly)) / this.size.lineHeight)) + this.scroll.top;
        p = [px, Math.min(this.numLines() - 1, py)];
        return p;
    };

    TextEditor.prototype.posForEvent = function(event) {
        return this.posAtXY(event.clientX, event.clientY);
    };

    TextEditor.prototype.spanBeforeMain = function() {
        var e, lineElem, mc, right, start, x;
        mc = this.mainCursor();
        x = mc[0];
        if (lineElem = this.lineDivs[mc[1]]) {
            e = lineElem.firstChild.lastChild;
            while (e) {
                start = e.start;
                right = e.start + e.textContent.length;
                if ((start <= x && x <= right)) {
                    return e;
                } else if (x > right) {
                    return e;
                }
                e = e.previousSibling;
            }
        }
        return null;
    };

    TextEditor.prototype.numFullLines = function() {
        return this.scroll.fullLines;
    };

    TextEditor.prototype.viewHeight = function() {
        var ref1, ref2;
        if (((ref1 = this.scroll) != null ? ref1.viewHeight : void 0) >= 0) {
            return this.scroll.viewHeight;
        }
        return (ref2 = this.view) != null ? ref2.clientHeight : void 0;
    };

    TextEditor.prototype.focus = function() {
        return this.view.focus();
    };

    TextEditor.prototype.initDrag = function() {
        return this.drag = new drag({
            target: this.layerScroll,
            onStart: (function(_this) {
                return function(drag, event) {
                    var eventPos, p, r, range;
                    _this.view.focus();
                    eventPos = _this.posForEvent(event);
                    if (event.button === 2) {
                        return 'skip';
                    } else if (event.button === 1) {
                        stopEvent(event);
                        return 'skip';
                    }
                    if (_this.clickCount) {
                        if (isSamePos(eventPos, _this.clickPos)) {
                            _this.startClickTimer();
                            _this.clickCount += 1;
                            if (_this.clickCount === 2) {
                                range = _this.rangeForWordAtPos(eventPos);
                                if (event.metaKey || _this.stickySelection) {
                                    _this.addRangeToSelection(range);
                                } else {
                                    _this.highlightWordAndAddToSelection();
                                }
                            }
                            if (_this.clickCount === 3) {
                                r = _this.rangeForLineAtIndex(_this.clickPos[1]);
                                if (event.metaKey) {
                                    _this.addRangeToSelection(r);
                                } else {
                                    _this.selectSingleRange(r);
                                }
                            }
                            return;
                        } else {
                            _this.onClickTimeout();
                        }
                    }
                    _this.clickCount = 1;
                    _this.clickPos = eventPos;
                    _this.startClickTimer();
                    p = _this.posForEvent(event);
                    return _this.clickAtPos(p, event);
                };
            })(this),
            onMove: (function(_this) {
                return function(drag, event) {
                    var p;
                    p = _this.posForEvent(event);
                    if (event.metaKey) {
                        return _this.addCursorAtPos([_this.mainCursor()[0], p[1]]);
                    } else {
                        return _this.singleCursorAtPos(p, {
                            extend: true
                        });
                    }
                };
            })(this),
            onStop: (function(_this) {
                return function() {
                    if (_this.numSelections() && empty(_this.textOfSelection())) {
                        return _this.selectNone();
                    }
                };
            })(this)
        });
    };

    TextEditor.prototype.startClickTimer = function() {
        clearTimeout(this.clickTimer);
        return this.clickTimer = setTimeout(this.onClickTimeout, this.stickySelection && 300 || 1000);
    };

    TextEditor.prototype.onClickTimeout = function() {
        clearTimeout(this.clickTimer);
        this.clickCount = 0;
        this.clickTimer = null;
        return this.clickPos = null;
    };

    TextEditor.prototype.funcInfoAtLineIndex = function(li) {
        var fileInfo, files, func, i, len, ref1;
        files = post.get('indexer', 'files', this.currentFile);
        fileInfo = files[this.currentFile];
        ref1 = fileInfo.funcs;
        for (i = 0, len = ref1.length; i < len; i++) {
            func = ref1[i];
            if ((func.line <= li && li <= func.last)) {
                return func["class"] + '.' + func.name + ' ';
            }
        }
        return '';
    };

    TextEditor.prototype.clickAtPos = function(p, event) {
        if (event.altKey) {
            return this.toggleCursorAtPos(p);
        } else {
            return this.singleCursorAtPos(p, {
                extend: event.shiftKey
            });
        }
    };

    TextEditor.prototype.handleModKeyComboCharEvent = function(mod, key, combo, char, event) {
        var action, actionCombo, i, j, k, len, len1, len2, ref1, ref2, ref3;
        switch (combo) {
            case 'ctrl+z':
                return this["do"].undo();
            case 'ctrl+shift+z':
                return this["do"].redo();
            case 'ctrl+x':
                return this.cut();
            case 'ctrl+c':
                return this.copy();
            case 'ctrl+v':
                return this.paste();
            case 'esc':
                if (this.numHighlights()) {
                    return this.clearHighlights();
                }
                if (this.numCursors() > 1) {
                    return this.clearCursors();
                }
                if (this.stickySelection) {
                    return this.endStickySelection();
                }
                if (this.numSelections()) {
                    return this.selectNone();
                }
                return;
        }
        ref1 = Editor.actions;
        for (i = 0, len = ref1.length; i < len; i++) {
            action = ref1[i];
            if (action.combo === combo || action.accel === combo) {
                switch (combo) {
                    case 'ctrl+a':
                    case 'command+a':
                        return this.selectAll();
                }
                if ((action.key != null) && _.isFunction(this[action.key])) {
                    this[action.key](key, {
                        combo: combo,
                        mod: mod,
                        event: event
                    });
                    return;
                }
                return 'unhandled';
            }
            if ((action.accels != null) && os.platform() !== 'darwin') {
                ref2 = action.accels;
                for (j = 0, len1 = ref2.length; j < len1; j++) {
                    actionCombo = ref2[j];
                    if (combo === actionCombo) {
                        if ((action.key != null) && _.isFunction(this[action.key])) {
                            this[action.key](key, {
                                combo: combo,
                                mod: mod,
                                event: event
                            });
                            return;
                        }
                    }
                }
            }
            if (action.combos == null) {
                continue;
            }
            ref3 = action.combos;
            for (k = 0, len2 = ref3.length; k < len2; k++) {
                actionCombo = ref3[k];
                if (combo === actionCombo) {
                    if ((action.key != null) && _.isFunction(this[action.key])) {
                        this[action.key](key, {
                            combo: combo,
                            mod: mod,
                            event: event
                        });
                        return;
                    }
                }
            }
        }
        if (char && (mod === "shift" || mod === "")) {
            return this.insertCharacter(char);
        }
        return 'unhandled';
    };

    TextEditor.prototype.onKeyDown = function(event) {
        var char, combo, key, mod, ref1, result;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        if (!combo) {
            return;
        }
        if (key === 'right click') {
            return;
        }
        if ('unhandled' !== this.term.handleKey(mod, key, combo, char, event)) {
            return;
        }
        result = this.handleModKeyComboCharEvent(mod, key, combo, char, event);
        if ('unhandled' !== result) {
            return stopEvent(event);
        }
    };

    return TextEditor;

})(Editor);

module.exports = TextEditor;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMElBQUE7SUFBQTs7Ozs7QUFRQSxNQUF3RixPQUFBLENBQVEsS0FBUixDQUF4RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixxQkFBbkIsRUFBNEIsaUJBQTVCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsZUFBdkQsRUFBNkQsZUFBN0QsRUFBbUUsV0FBbkUsRUFBdUUsbUJBQXZFLEVBQStFLFNBQS9FLEVBQWtGOztBQUVsRixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7QUFDZixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUVUOzs7SUFFQyxvQkFBQyxJQUFELEVBQVEsTUFBUjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7Ozs7OztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxRQUFOO1lBQWUsUUFBQSxFQUFTLEdBQXhCO1NBQUw7UUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFWLENBQXNCLElBQUMsQ0FBQSxJQUF2QjtRQUdBLDRDQUFNLFFBQU4sRUFBZSxNQUFmO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxNQUFELEdBQWUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDZixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtZQUFxQixLQUFBLEVBQU0sSUFBQyxDQUFBLE1BQTVCO1NBQUw7UUFDZixJQUFD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QkFBQSxLQUFBLEVBQU8sS0FBUDs0QkFBYyxHQUFBLEVBQUssR0FBbkI7NEJBQXdCLEtBQUEsRUFBTyxLQUEvQjt5QkFBbkI7QUFDQSwrQkFGSjtxQkFESjs7QUFESjtBQW5CSjtRQXlCQSxJQUFHLElBQUEsSUFBUyxDQUFBLEdBQUEsS0FBUSxPQUFSLElBQUEsR0FBQSxLQUFnQixFQUFoQixDQUFaO0FBRUksbUJBQU8sSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBakIsRUFGWDs7ZUFJQTtJQTdDd0I7O3lCQStDNUIsU0FBQSxHQUFXLFNBQUMsS0FBRDtBQUVQLFlBQUE7UUFBQSxPQUE0QixPQUFPLENBQUMsUUFBUixDQUFpQixLQUFqQixDQUE1QixFQUFFLGNBQUYsRUFBTyxjQUFQLEVBQVksa0JBQVosRUFBbUI7UUFFbkIsSUFBVSxDQUFJLEtBQWQ7QUFBQSxtQkFBQTs7UUFDQSxJQUFVLEdBQUEsS0FBTyxhQUFqQjtBQUFBLG1CQUFBOztRQUVBLElBQVUsV0FBQSxLQUFlLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixDQUFnQixHQUFoQixFQUFxQixHQUFyQixFQUEwQixLQUExQixFQUFpQyxJQUFqQyxFQUF1QyxLQUF2QyxDQUF6QjtBQUFBLG1CQUFBOztRQUVBLE1BQUEsR0FBUyxJQUFDLENBQUEsMEJBQUQsQ0FBNEIsR0FBNUIsRUFBaUMsR0FBakMsRUFBc0MsS0FBdEMsRUFBNkMsSUFBN0MsRUFBbUQsS0FBbkQ7UUFFVCxJQUFHLFdBQUEsS0FBZSxNQUFsQjttQkFDSSxTQUFBLENBQVUsS0FBVixFQURKOztJQVhPOzs7O0dBcnpCVTs7QUFtMEJ6QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgc3RvcEV2ZW50LCBrZXlpbmZvLCBwcmVmcywgY2xhbXAsIGVtcHR5LCBlbGVtLCBrc3RyLCBkcmFnLCBvcywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG4gIFxucmVuZGVyICAgICAgID0gcmVxdWlyZSAnLi9yZW5kZXInXG5FZGl0b3JTY3JvbGwgPSByZXF1aXJlICcuL2VkaXRvcnNjcm9sbCdcbkVkaXRvciAgICAgICA9IHJlcXVpcmUgJy4vZWRpdG9yJ1xuZWxlY3Ryb24gICAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIFRleHRFZGl0b3IgZXh0ZW5kcyBFZGl0b3JcblxuICAgIEA6IChAdGVybSwgY29uZmlnKSAtPlxuXG4gICAgICAgIEB2aWV3ID0gZWxlbSBjbGFzczonZWRpdG9yJyB0YWJpbmRleDonMCdcbiAgICAgICAgQHRlcm0uZGl2LmFwcGVuZENoaWxkIEB2aWV3XG5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3VwZXIgJ2VkaXRvcicgY29uZmlnXG5cbiAgICAgICAgQGNsaWNrQ291bnQgID0gMFxuXG4gICAgICAgIEBsYXllcnMgICAgICA9IGVsZW0gY2xhc3M6ICdsYXllcnMnXG4gICAgICAgIEBsYXllclNjcm9sbCA9IGVsZW0gY2xhc3M6ICdsYXllclNjcm9sbCcgY2hpbGQ6QGxheWVyc1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAbGF5ZXJTY3JvbGxcblxuICAgICAgICBsYXllciA9IFtdXG4gICAgICAgIGxheWVyLnB1c2ggJ3NlbGVjdGlvbnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2hpZ2hsaWdodHMnXG4gICAgICAgIGxheWVyLnB1c2ggJ21ldGEnICAgIGlmICdNZXRhJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIGxheWVyLnB1c2ggJ2xpbmVzJ1xuICAgICAgICBsYXllci5wdXNoICdjdXJzb3JzJ1xuICAgICAgICBsYXllci5wdXNoICdudW1iZXJzJyBpZiAnTnVtYmVycycgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICBAaW5pdExheWVycyBsYXllclxuXG4gICAgICAgIEBzaXplID0ge31cbiAgICAgICAgQGVsZW0gPSBAbGF5ZXJEaWN0LmxpbmVzXG5cbiAgICAgICAgQGFuc2lMaW5lcyA9IFtdICMgb3JpZ2luYWwgYW5zaSBjb2RlIHN0cmluZ3NcbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdICMgY2FjaGUgZm9yIHJlbmRlcmVkIGxpbmUgc3BhbnNcbiAgICAgICAgQGxpbmVEaXZzICA9IHt9ICMgbWFwcyBsaW5lIG51bWJlcnMgdG8gZGlzcGxheWVkIGRpdnNcblxuICAgICAgICBAc2V0Rm9udFNpemUgcHJlZnMuZ2V0IFwiZm9udFNpemVcIiBAY29uZmlnLmZvbnRTaXplID8gMThcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBFZGl0b3JTY3JvbGwgQFxuICAgICAgICBAc2Nyb2xsLm9uICdzaGlmdExpbmVzJyBAc2hpZnRMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICdzaG93TGluZXMnICBAc2hvd0xpbmVzXG5cbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgIEBvbkJsdXJcbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgIEBvbkZvY3VzXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nICBAb25LZXlEb3duXG5cbiAgICAgICAgQGluaXREcmFnKClcblxuICAgICAgICBmb3IgZmVhdHVyZSBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgICAgICBpZiBmZWF0dXJlID09ICdDdXJzb3JMaW5lJ1xuICAgICAgICAgICAgICAgIEBjdXJzb3JMaW5lID0gZWxlbSAnZGl2JyBjbGFzczonY3Vyc29yLWxpbmUnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmVhdHVyZU5hbWUgPSBmZWF0dXJlLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICBmZWF0dXJlQ2xzcyA9IHJlcXVpcmUgXCIuLyN7ZmVhdHVyZU5hbWV9XCJcbiAgICAgICAgICAgICAgICBAW2ZlYXR1cmVOYW1lXSA9IG5ldyBmZWF0dXJlQ2xzcyBAXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgZGVsOiAtPlxuXG4gICAgICAgIEBzY3JvbGxiYXI/LmRlbCgpXG5cbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgQG9uS2V5RG93blxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdibHVyJyAgICBAb25CbHVyXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgIEBvbkZvY3VzXG4gICAgICAgIEB2aWV3LmlubmVySFRNTCA9ICcnXG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgaXNJbnB1dEN1cnNvcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBtYWluQ3Vyc29yKClbMV0gPj0gQG51bUxpbmVzKCktMVxuICAgICAgICBcbiAgICByZXN0b3JlSW5wdXRDdXJzb3I6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAaXNJbnB1dEN1cnNvcigpXG4gICAgICAgICAgICBAc3RhdGUuY3Vyc29ycygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbCA9IEBpbnB1dEN1cnNvciA/IEBkby5saW5lKEBudW1MaW5lcygpLTEpLmxlbmd0aFxuICAgICAgICAgICAgW1tjb2wsQG51bUxpbmVzKCktMV1dXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIG9uRm9jdXM6ID0+XG5cbiAgICAgICAgQHN0YXJ0QmxpbmsoKVxuICAgICAgICBAZW1pdCAnZm9jdXMnIEBcbiAgICAgICAgcG9zdC5lbWl0ICdlZGl0b3JGb2N1cycgQFxuXG4gICAgb25CbHVyOiA9PlxuXG4gICAgICAgIEBzdG9wQmxpbmsoKVxuICAgICAgICBAZW1pdCAnYmx1cicgQFxuXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMDAwMDAwMCAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0TGF5ZXJzOiAobGF5ZXJDbGFzc2VzKSAtPlxuXG4gICAgICAgIEBsYXllckRpY3QgPSB7fVxuICAgICAgICBmb3IgY2xzIGluIGxheWVyQ2xhc3Nlc1xuICAgICAgICAgICAgQGxheWVyRGljdFtjbHNdID0gQGFkZExheWVyIGNsc1xuXG4gICAgYWRkTGF5ZXI6IChjbHMpIC0+XG5cbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogY2xzXG4gICAgICAgIEBsYXllcnMuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgIGRpdlxuXG4gICAgdXBkYXRlTGF5ZXJzOiAoKSAtPlxuXG4gICAgICAgIEByZW5kZXJIaWdobGlnaHRzKClcbiAgICAgICAgQHJlbmRlclNlbGVjdGlvbigpXG4gICAgICAgIEByZW5kZXJDdXJzb3JzKClcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjbGVhcjogPT4gQHNldExpbmVzIFsnJ11cbiAgICBcbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBlbWl0ICdjbGVhckxpbmVzJ1xuXG4gICAgICAgIGxpbmVzID89IFtdXG5cbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdXG4gICAgICAgIEBsaW5lRGl2cyAgPSB7fVxuICAgICAgICBAYW5zaUxpbmVzID0gW11cbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwucmVzZXQoKVxuXG4gICAgICAgIHN1cGVyIGxpbmVzXG5cbiAgICAgICAgdmlld0hlaWdodCA9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwuc3RhcnQgdmlld0hlaWdodCwgQG51bUxpbmVzKClcblxuICAgICAgICBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdCA9IDBcbiAgICAgICAgQGxheWVyc1dpZHRoICA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICBAbGF5ZXJzSGVpZ2h0ID0gQGxheWVyU2Nyb2xsLm9mZnNldEhlaWdodFxuXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuICAgICAgIFxuICAgIHNldElucHV0VGV4dDogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gdGV4dC5zcGxpdCgnXFxuJylbMF1cbiAgICAgICAgdGV4dCA/PSAnJ1xuICAgICAgICBcbiAgICAgICAgbGkgPSBAbnVtTGluZXMoKS0xXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkZWxldGVDdXJzb3JMaW5lcygpXG4gICAgICAgIEBkby5jaGFuZ2UgbGksIHRleHRcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgW1t0ZXh0Lmxlbmd0aCwgbGldXVxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgcmVwbGFjZVRleHRJbkxpbmU6IChsaSwgdGV4dD0nJykgLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5jaGFuZ2UgbGksIHRleHRcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYXBwZW5kVGV4dDogKHRleHQpIC0+XG5cbiAgICAgICAgaWYgbm90IHRleHQ/XG4gICAgICAgICAgICBsb2cgXCIje0BuYW1lfS5hcHBlbmRUZXh0IC0gbm8gdGV4dD9cIlxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgYXBwZW5kZWQgPSBbXVxuICAgICAgICBscyA9IHRleHQ/LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgZm9yIGwgaW4gbHNcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5hcHBlbmRMaW5lIGxcbiAgICAgICAgICAgIGFwcGVuZGVkLnB1c2ggQG51bUxpbmVzKCktMVxuXG4gICAgICAgIGlmIEBzY3JvbGwudmlld0hlaWdodCAhPSBAdmlld0hlaWdodCgpXG4gICAgICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgQHZpZXdIZWlnaHQoKVxuXG4gICAgICAgIHNob3dMaW5lcyA9IChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudG9wKSBvciAoQHNjcm9sbC5ib3QgPCBAc2Nyb2xsLnZpZXdMaW5lcylcblxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpLCBzaG93TGluZXM6c2hvd0xpbmVzXG5cbiAgICAgICAgZm9yIGxpIGluIGFwcGVuZGVkXG4gICAgICAgICAgICBAZW1pdCAnbGluZUFwcGVuZGVkJywgIyBtZXRhXG4gICAgICAgICAgICAgICAgbGluZUluZGV4OiBsaVxuICAgICAgICAgICAgICAgIHRleHQ6IEBsaW5lIGxpXG5cbiAgICAgICAgQGVtaXQgJ2xpbmVzQXBwZW5kZWQnIGxzICMgYXV0b2NvbXBsZXRlXG4gICAgICAgIEBlbWl0ICdudW1MaW5lcycgQG51bUxpbmVzKCkgIyBtaW5pbWFwXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBhcHBlbmRPdXRwdXQ6ICh0ZXh0KSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICBscyA9IHRleHQ/LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgZm9yIGwgaW4gbHNcbiAgICAgICAgICAgIHN0cmlwcGVkID0ga3N0ci5zdHJpcEFuc2kgbFxuICAgICAgICAgICAgaWYgbCAhPSBzdHJpcHBlZCBcbiAgICAgICAgICAgICAgICBAYW5zaUxpbmVzW0Bkby5udW1MaW5lcygpLTFdID0gbFxuICAgICAgICAgICAgQGRvLmluc2VydCBAZG8ubnVtTGluZXMoKS0xLCBzdHJpcHBlZFxuICAgICAgICAgICAgXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICAgICAgQHNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc2V0Rm9udFNpemU6IChmb250U2l6ZSkgPT5cbiAgICAgICAgXG4gICAgICAgIEBsYXllcnMuc3R5bGUuZm9udFNpemUgPSBcIiN7Zm9udFNpemV9cHhcIlxuICAgICAgICBAc2l6ZS5udW1iZXJzV2lkdGggPSAnTnVtYmVycycgaW4gQGNvbmZpZy5mZWF0dXJlcyBhbmQgMzYgb3IgMFxuICAgICAgICBAc2l6ZS5mb250U2l6ZSAgICAgPSBmb250U2l6ZVxuICAgICAgICBAc2l6ZS5saW5lSGVpZ2h0ICAgPSBmb250U2l6ZSAqIDEuMjUgIyBrZWVwIGluIHN5bmMgd2l0aCBzdHlsZSBsaW5lLWhlaWdodHNcbiAgICAgICAgQHNpemUuY2hhcldpZHRoICAgID0gZm9udFNpemUgKiAwLjZcbiAgICAgICAgQHNpemUub2Zmc2V0WCAgICAgID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGggKyBAc2l6ZS5udW1iZXJzV2lkdGhcblxuICAgICAgICBAc2Nyb2xsPy5zZXRMaW5lSGVpZ2h0IEBzaXplLmxpbmVIZWlnaHRcbiAgICAgICAgaWYgQHRleHQoKVxuICAgICAgICAgICAgYW5zaSA9IEBhbnNpVGV4dCgpXG4gICAgICAgICAgICBtZXRhcyA9IEBtZXRhLm1ldGFzXG4gICAgICAgICAgICBAdGVybS5jbGVhcigpXG4gICAgICAgICAgICBAYXBwZW5kT3V0cHV0IGFuc2lcbiAgICAgICAgICAgIGZvciBtZXRhIGluIG1ldGFzXG4gICAgICAgICAgICAgICAgbWV0YVsyXS5saW5lID0gbWV0YVswXVxuICAgICAgICAgICAgICAgIEBtZXRhLmFkZCBtZXRhWzJdXG5cbiAgICAgICAgQGVtaXQgJ2ZvbnRTaXplQ2hhbmdlZCdcblxuICAgIGFuc2lUZXh0OiAtPlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9ICcnXG4gICAgICAgIGZvciBsaSBpbiBbMC4uLkBudW1MaW5lcygpLTFdXG4gICAgICAgICAgICB0ZXh0ICs9IEBhbnNpTGluZXNbbGldID8gQHN0YXRlLmxpbmUgbGlcbiAgICAgICAgICAgIHRleHQgKz0gJ1xcbidcbiAgICAgICAgdGV4dFsuLnRleHQubGVuZ3RoLTJdXG4gICAgICAgIFxuICAgIGFuc2lMaW5lOiAobGkpID0+IEBhbnNpTGluZXNbbGldXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjaGFuZ2VkOiAoY2hhbmdlSW5mbykgLT5cblxuICAgICAgICBAc3ludGF4LmNoYW5nZWQgY2hhbmdlSW5mb1xuXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBbZGksbGksY2hdID0gW2NoYW5nZS5kb0luZGV4LCBjaGFuZ2UubmV3SW5kZXgsIGNoYW5nZS5jaGFuZ2VdXG4gICAgICAgICAgICBzd2l0Y2ggY2hcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJ1xuICAgICAgICAgICAgICAgICAgICBAYW5zaUxpbmVzW2xpXSA9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGksIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lQ2hhbmdlZCcgbGlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnZGVsZXRlZCdcbiAgICAgICAgICAgICAgICAgICAgQHNwYW5DYWNoZSA9IEBzcGFuQ2FjaGUuc2xpY2UgMCwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGFuc2lMaW5lcy5zcGxpY2UgZGksIDFcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVEZWxldGVkJyBkaVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdpbnNlcnRlZCdcbiAgICAgICAgICAgICAgICAgICAgQHNwYW5DYWNoZSA9IEBzcGFuQ2FjaGUuc2xpY2UgMCwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVJbnNlcnRlZCcgbGksIGRpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5pbnNlcnRzIG9yIGNoYW5nZUluZm8uZGVsZXRlc1xuICAgICAgICAgICAgQGxheWVyc1dpZHRoID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG4gICAgICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpXG4gICAgICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgQGNsZWFySGlnaGxpZ2h0cygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzXG4gICAgICAgICAgICBAcmVuZGVyQ3Vyc29ycygpXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcbiAgICAgICAgICAgIEBlbWl0ICdjdXJzb3InXG4gICAgICAgICAgICBAc3VzcGVuZEJsaW5rKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgICAgIEByZW5kZXJTZWxlY3Rpb24oKVxuICAgICAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICAgICBAZW1pdCAnY2hhbmdlZCcgY2hhbmdlSW5mb1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICBcbiAgICB1cGRhdGVMaW5lOiAobGksIG9pKSAtPlxuXG4gICAgICAgIG9pID0gbGkgaWYgbm90IG9pP1xuXG4gICAgICAgIGlmIGxpIDwgQHNjcm9sbC50b3Agb3IgbGkgPiBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAga2Vycm9yIFwiZGFuZ2xpbmcgbGluZSBkaXY/ICN7bGl9XCIgQGxpbmVEaXZzW2xpXSBpZiBAbGluZURpdnNbbGldP1xuICAgICAgICAgICAgZGVsZXRlIEBzcGFuQ2FjaGVbbGldXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwidXBkYXRlTGluZSAtIG91dCBvZiBib3VuZHM/IGxpICN7bGl9IG9pICN7b2l9XCIgaWYgbm90IEBsaW5lRGl2c1tvaV1cbiAgICAgICAgXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldID0gQHJlbmRlclNwYW4gbGlcblxuICAgICAgICBkaXYgPSBAbGluZURpdnNbb2ldXG4gICAgICAgIGRpdi5yZXBsYWNlQ2hpbGQgQHNwYW5DYWNoZVtsaV0sIGRpdi5maXJzdENoaWxkXG4gICAgICAgIFxuICAgIHJlZnJlc2hMaW5lczogKHRvcCwgYm90KSAtPlxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgQHN5bnRheC5nZXREaXNzIGxpLCB0cnVlXG4gICAgICAgICAgICBAdXBkYXRlTGluZSBsaVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzaG93TGluZXM6ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIEBhcHBlbmRMaW5lIGxpXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgQGVtaXQgJ2xpbmVzRXhwb3NlZCcgdG9wOnRvcCwgYm90OmJvdCwgbnVtOm51bVxuICAgICAgICBAZW1pdCAnbGluZXNTaG93bicgdG9wLCBib3QsIG51bVxuXG4gICAgYXBwZW5kTGluZTogKGxpKSAtPlxuXG4gICAgICAgIEBsaW5lRGl2c1tsaV0gPSBlbGVtIGNsYXNzOidsaW5lJ1xuICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIEBjYWNoZWRTcGFuIGxpXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBsaW5lRGl2c1tsaV1cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzaGlmdExpbmVzOiAodG9wLCBib3QsIG51bSkgPT5cbiAgICAgICAgXG4gICAgICAgIG9sZFRvcCA9IHRvcCAtIG51bVxuICAgICAgICBvbGRCb3QgPSBib3QgLSBudW1cblxuICAgICAgICBkaXZJbnRvID0gKGxpLGxvKSA9PlxuXG4gICAgICAgICAgICBpZiBub3QgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgICAgIGtlcnJvciBcIiN7QG5hbWV9LnNoaWZ0TGluZXMuZGl2SW50byAtIG5vIGRpdj8gI3t0b3B9ICN7Ym90fSAje251bX0gb2xkICN7b2xkVG9wfSAje29sZEJvdH0gbG8gI3tsb30gbGkgI3tsaX1cIlxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBAbGluZURpdnNbbGldID0gQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgZGVsZXRlIEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0ucmVwbGFjZUNoaWxkIEBjYWNoZWRTcGFuKGxpKSwgQGxpbmVEaXZzW2xpXS5maXJzdENoaWxkXG5cbiAgICAgICAgICAgIGlmIEBzaG93SW52aXNpYmxlc1xuICAgICAgICAgICAgICAgIHR4ID0gQGxpbmUobGkpLmxlbmd0aCAqIEBzaXplLmNoYXJXaWR0aCArIDFcbiAgICAgICAgICAgICAgICBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6XCJpbnZpc2libGUgbmV3bGluZVwiIGh0bWw6JyYjOTY4NydcbiAgICAgICAgICAgICAgICBzcGFuLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKCN7dHh9cHgsIC0xLjVweClcIlxuICAgICAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0uYXBwZW5kQ2hpbGQgc3BhblxuXG4gICAgICAgIGlmIG51bSA+IDBcbiAgICAgICAgICAgIHdoaWxlIG9sZEJvdCA8IGJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCArPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRCb3QsIG9sZFRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCArPSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIG9sZFRvcCA+IHRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCAtPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRUb3AsIG9sZEJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCAtPSAxXG5cbiAgICAgICAgQGVtaXQgJ2xpbmVzU2hpZnRlZCcgdG9wLCBib3QsIG51bVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlTGluZVBvc2l0aW9uczogKGFuaW1hdGU9MCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBsaSwgZGl2IG9mIEBsaW5lRGl2c1xuICAgICAgICAgICAgaWYgbm90IGRpdj8gb3Igbm90IGRpdi5zdHlsZT9cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBkaXY/IHN0eWxlPycgZGl2PywgZGl2Py5zdHlsZT9cbiAgICAgICAgICAgIHkgPSBAc2l6ZS5saW5lSGVpZ2h0ICogKGxpIC0gQHNjcm9sbC50b3ApXG4gICAgICAgICAgICBkaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUzZCgje0BzaXplLm9mZnNldFh9cHgsI3t5fXB4LCAwKVwiXG4gICAgICAgICAgICBkaXYuc3R5bGUudHJhbnNpdGlvbiA9IFwiYWxsICN7YW5pbWF0ZS8xMDAwfXNcIiBpZiBhbmltYXRlXG4gICAgICAgICAgICBkaXYuc3R5bGUuekluZGV4ID0gbGlcblxuICAgICAgICBpZiBhbmltYXRlXG4gICAgICAgICAgICByZXNldFRyYW5zID0gPT5cbiAgICAgICAgICAgICAgICBmb3IgYyBpbiBAZWxlbS5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBjLnN0eWxlLnRyYW5zaXRpb24gPSAnaW5pdGlhbCdcbiAgICAgICAgICAgIHNldFRpbWVvdXQgcmVzZXRUcmFucywgYW5pbWF0ZVxuXG4gICAgdXBkYXRlTGluZXM6ICgpIC0+XG5cbiAgICAgICAgZm9yIGxpIGluIFtAc2Nyb2xsLnRvcC4uQHNjcm9sbC5ib3RdXG4gICAgICAgICAgICBAdXBkYXRlTGluZSBsaVxuXG4gICAgY2xlYXJIaWdobGlnaHRzOiAoKSAtPlxuXG4gICAgICAgIGlmIEBudW1IaWdobGlnaHRzKClcbiAgICAgICAgICAgICQoJy5oaWdobGlnaHRzJyBAbGF5ZXJzKS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIHJlbmRlclNwYW46IChsaSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBhbnNpTGluZXNbbGldPy5sZW5ndGhcbiAgICAgICAgICAgIGFuc2kgPSBuZXcga3N0ci5hbnNpXG4gICAgICAgICAgICBkaXNzID0gYW5zaS5kaXNzZWN0KEBhbnNpTGluZXNbbGldKVsxXVxuICAgICAgICAgICAgc3BhbiA9IHJlbmRlci5saW5lU3BhbiBkaXNzLCBAc2l6ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzcGFuID0gcmVuZGVyLmxpbmVTcGFuIEBzeW50YXguZ2V0RGlzcyhsaSksIEBzaXplXG4gICAgXG4gICAgY2FjaGVkU3BhbjogKGxpKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAc3BhbkNhY2hlW2xpXVxuXG4gICAgICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IEByZW5kZXJTcGFuIGxpXG5cbiAgICAgICAgQHNwYW5DYWNoZVtsaV1cblxuICAgIHJlbmRlckN1cnNvcnM6IC0+XG5cbiAgICAgICAgY3MgPSBbXVxuICAgICAgICBmb3IgYyBpbiBAY3Vyc29ycygpXG4gICAgICAgICAgICBpZiBjWzFdID49IEBzY3JvbGwudG9wIGFuZCBjWzFdIDw9IEBzY3JvbGwuYm90XG4gICAgICAgICAgICAgICAgY3MucHVzaCBbY1swXSwgY1sxXSAtIEBzY3JvbGwudG9wXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcblxuICAgICAgICBpZiBAbnVtQ3Vyc29ycygpID09IDFcblxuICAgICAgICAgICAgaWYgY3MubGVuZ3RoID09IDFcblxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBtY1sxXSA8IDBcblxuICAgICAgICAgICAgICAgIGlmIG1jWzFdID4gQG51bUxpbmVzKCktMVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiI3tAbmFtZX0ucmVuZGVyQ3Vyc29ycyBtYWluQ3Vyc29yIERBRlVLP1wiIEBudW1MaW5lcygpLCBrc3RyIEBtYWluQ3Vyc29yKClcblxuICAgICAgICAgICAgICAgIHJpID0gbWNbMV0tQHNjcm9sbC50b3BcbiAgICAgICAgICAgICAgICBjdXJzb3JMaW5lID0gQHN0YXRlLmxpbmUobWNbMV0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gbWFpbiBjdXJzb3IgbGluZT8nIGlmIG5vdCBjdXJzb3JMaW5lP1xuICAgICAgICAgICAgICAgIGlmIG1jWzBdID4gY3Vyc29yTGluZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgY3NbMF1bMl0gPSAndmlydHVhbCdcbiAgICAgICAgICAgICAgICAgICAgY3MucHVzaCBbY3Vyc29yTGluZS5sZW5ndGgsIHJpLCAnbWFpbiBvZmYnXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY3NbMF1bMl0gPSAnbWFpbiBvZmYnXG5cbiAgICAgICAgZWxzZSBpZiBAbnVtQ3Vyc29ycygpID4gMVxuXG4gICAgICAgICAgICB2YyA9IFtdICMgdmlydHVhbCBjdXJzb3JzXG4gICAgICAgICAgICBmb3IgYyBpbiBjc1xuICAgICAgICAgICAgICAgIGlmIGlzU2FtZVBvcyBAbWFpbkN1cnNvcigpLCBbY1swXSwgY1sxXSArIEBzY3JvbGwudG9wXVxuICAgICAgICAgICAgICAgICAgICBjWzJdID0gJ21haW4nXG4gICAgICAgICAgICAgICAgbGluZSA9IEBsaW5lKEBzY3JvbGwudG9wK2NbMV0pXG4gICAgICAgICAgICAgICAgaWYgY1swXSA+IGxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHZjLnB1c2ggW2xpbmUubGVuZ3RoLCBjWzFdLCAndmlydHVhbCddXG4gICAgICAgICAgICBjcyA9IGNzLmNvbmNhdCB2Y1xuXG4gICAgICAgIGh0bWwgPSByZW5kZXIuY3Vyc29ycyBjcywgQHNpemVcbiAgICAgICAgQGxheWVyRGljdC5jdXJzb3JzLmlubmVySFRNTCA9IGh0bWxcbiAgICAgICAgXG4gICAgICAgIHR5ID0gKG1jWzFdIC0gQHNjcm9sbC50b3ApICogQHNpemUubGluZUhlaWdodFxuICAgICAgICBcbiAgICAgICAgaWYgQGN1cnNvckxpbmVcbiAgICAgICAgICAgIEBjdXJzb3JMaW5lLnN0eWxlID0gXCJ6LWluZGV4OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZTNkKDAsI3t0eX1weCwwKTsgaGVpZ2h0OiN7QHNpemUubGluZUhlaWdodH1weDt3aWR0aDoxMDAlO1wiXG4gICAgICAgICAgICBAbGF5ZXJzLmluc2VydEJlZm9yZSBAY3Vyc29yTGluZSwgQGxheWVycy5maXJzdENoaWxkXG5cbiAgICByZW5kZXJTZWxlY3Rpb246IC0+XG5cbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgaWYgcyA9IEBzZWxlY3Rpb25zSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXggW0BzY3JvbGwudG9wLCBAc2Nyb2xsLmJvdF0sIEBzY3JvbGwudG9wXG4gICAgICAgICAgICBoICs9IHJlbmRlci5zZWxlY3Rpb24gcywgQHNpemVcbiAgICAgICAgQGxheWVyRGljdC5zZWxlY3Rpb25zLmlubmVySFRNTCA9IGhcblxuICAgIHJlbmRlckhpZ2hsaWdodHM6IC0+XG5cbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgaWYgcyA9IEBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXggW0BzY3JvbGwudG9wLCBAc2Nyb2xsLmJvdF0sIEBzY3JvbGwudG9wXG4gICAgICAgICAgICBoICs9IHJlbmRlci5zZWxlY3Rpb24gcywgQHNpemUsIFwiaGlnaGxpZ2h0XCJcbiAgICAgICAgQGxheWVyRGljdC5oaWdobGlnaHRzLmlubmVySFRNTCA9IGhcblxuICAgICMgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY3Vyc29yRGl2OiAtPiAkICcuY3Vyc29yLm1haW4nIEBsYXllckRpY3RbJ2N1cnNvcnMnXVxuXG4gICAgc3VzcGVuZEJsaW5rOiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGJsaW5rVGltZXJcbiAgICAgICAgQHN0b3BCbGluaygpXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIGZhbHNlXG4gICAgICAgIGNsZWFyVGltZW91dCBAc3VzcGVuZFRpbWVyXG4gICAgICAgIGJsaW5rRGVsYXkgPSBwcmVmcy5nZXQgJ2N1cnNvckJsaW5rRGVsYXknIFs4MDAsMjAwXVxuICAgICAgICBAc3VzcGVuZFRpbWVyID0gc2V0VGltZW91dCBAcmVsZWFzZUJsaW5rLCBibGlua0RlbGF5WzBdXG5cbiAgICByZWxlYXNlQmxpbms6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzdXNwZW5kVGltZXJcbiAgICAgICAgZGVsZXRlIEBzdXNwZW5kVGltZXJcbiAgICAgICAgQHN0YXJ0QmxpbmsoKVxuXG4gICAgdG9nZ2xlQmxpbms6IC0+XG5cbiAgICAgICAgYmxpbmsgPSBub3QgcHJlZnMuZ2V0ICdibGluaycgZmFsc2VcbiAgICAgICAgcHJlZnMuc2V0ICdibGluaycgYmxpbmtcbiAgICAgICAgaWYgYmxpbmtcbiAgICAgICAgICAgIEBzdGFydEJsaW5rKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHN0b3BCbGluaygpXG5cbiAgICBkb0JsaW5rOiA9PlxuXG4gICAgICAgIEBibGluayA9IG5vdCBAYmxpbmtcbiAgICAgICAgXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIEBibGlua1xuICAgICAgICBAbWluaW1hcD8uZHJhd01haW5DdXJzb3IgQGJsaW5rXG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQGJsaW5rVGltZXJcbiAgICAgICAgYmxpbmtEZWxheSA9IHByZWZzLmdldCAnY3Vyc29yQmxpbmtEZWxheScgWzgwMCwyMDBdXG4gICAgICAgIEBibGlua1RpbWVyID0gc2V0VGltZW91dCBAZG9CbGluaywgQGJsaW5rIGFuZCBibGlua0RlbGF5WzFdIG9yIGJsaW5rRGVsYXlbMF1cblxuICAgIHN0YXJ0Qmxpbms6IC0+IFxuICAgIFxuICAgICAgICBpZiBub3QgQGJsaW5rVGltZXIgYW5kIHByZWZzLmdldCAnYmxpbmsnXG4gICAgICAgICAgICBAZG9CbGluaygpIFxuXG4gICAgc3RvcEJsaW5rOiAtPlxuXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIGZhbHNlXG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQGJsaW5rVGltZXJcbiAgICAgICAgZGVsZXRlIEBibGlua1RpbWVyXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIHJlc2l6ZWQ6IC0+XG5cbiAgICAgICAgdmggPSBAdmlldy5wYXJlbnROb2RlLmNsaWVudEhlaWdodFxuXG4gICAgICAgIHJldHVybiBpZiB2aCBhbmQgdmggPT0gQHNjcm9sbC52aWV3SGVpZ2h0XG5cbiAgICAgICAgQG51bWJlcnM/LmVsZW0uc3R5bGUuaGVpZ2h0ID0gXCIje0BzY3JvbGwuZXhwb3NlTnVtICogQHNjcm9sbC5saW5lSGVpZ2h0fXB4XCJcbiAgICAgICAgQGxheWVyc1dpZHRoID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG5cbiAgICAgICAgQHNjcm9sbC5zZXRWaWV3SGVpZ2h0IHZoXG5cbiAgICAgICAgQGVtaXQgJ3ZpZXdIZWlnaHQnIHZoXG5cbiAgICBzY3JlZW5TaXplOiAtPiBlbGVjdHJvbi5yZW1vdGUuc2NyZWVuLmdldFByaW1hcnlEaXNwbGF5KCkud29ya0FyZWFTaXplXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIHBvc0F0WFk6KHgseSkgLT5cblxuICAgICAgICBzbCA9IEBsYXllclNjcm9sbC5zY3JvbGxMZWZ0XG4gICAgICAgIHN0ID0gQHNjcm9sbC5vZmZzZXRUb3BcbiAgICAgICAgYnIgPSBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBseCA9IGNsYW1wIDAsIEBsYXllcnMub2Zmc2V0V2lkdGgsICB4IC0gYnIubGVmdCAtIEBzaXplLm9mZnNldFggKyBAc2l6ZS5jaGFyV2lkdGgvM1xuICAgICAgICBseSA9IGNsYW1wIDAsIEBsYXllcnMub2Zmc2V0SGVpZ2h0LCB5IC0gYnIudG9wXG4gICAgICAgIHB4ID0gcGFyc2VJbnQoTWF0aC5mbG9vcigoTWF0aC5tYXgoMCwgc2wgKyBseCkpL0BzaXplLmNoYXJXaWR0aCkpXG4gICAgICAgIHB5ID0gcGFyc2VJbnQoTWF0aC5mbG9vcigoTWF0aC5tYXgoMCwgc3QgKyBseSkpL0BzaXplLmxpbmVIZWlnaHQpKSArIEBzY3JvbGwudG9wXG4gICAgICAgIHAgID0gW3B4LCBNYXRoLm1pbihAbnVtTGluZXMoKS0xLCBweSldXG4gICAgICAgIHBcblxuICAgIHBvc0ZvckV2ZW50OiAoZXZlbnQpIC0+IEBwb3NBdFhZIGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFlcblxuICAgICMgbGluZUVsZW1BdFhZOih4LHkpIC0+XG5cbiAgICAgICAgIyBwID0gQHBvc0F0WFkgeCx5XG4gICAgICAgICMgQGxpbmVEaXZzW3BbMV1dXG5cbiAgICAjIGxpbmVTcGFuQXRYWTooeCx5KSAtPlxuIyAgICAgICAgIFxuICAgICAgICAjIGlmIGxpbmVFbGVtID0gQGxpbmVFbGVtQXRYWSB4LHlcbiAgICAgICAgICAgICMgZSA9IGxpbmVFbGVtLmZpcnN0Q2hpbGQubGFzdENoaWxkXG4gICAgICAgICAgICAjIHdoaWxlIGVcbiAgICAgICAgICAgICAgICAjIGJyID0gZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgICAgICMgaWYgYnIubGVmdCA8PSB4IDw9IGJyLmxlZnQrYnIud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgIyBvZmZzZXQgPSB4LWJyLmxlZnRcbiAgICAgICAgICAgICAgICAgICAgIyByZXR1cm4gc3BhbjplLCBvZmZzZXRMZWZ0Om9mZnNldCwgb2Zmc2V0Q2hhcjpwYXJzZUludChvZmZzZXQvQHNpemUuY2hhcldpZHRoKSwgcG9zOkBwb3NBdFhZIHgseSBcbiAgICAgICAgICAgICAgICAjIGVsc2UgaWYgeCA+IGJyLmxlZnQrYnIud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgIyBvZmZzZXQgPSBici53aWR0aFxuICAgICAgICAgICAgICAgICAgICAjIHJldHVybiBzcGFuOmUsIG9mZnNldExlZnQ6b2Zmc2V0LCBvZmZzZXRDaGFyOnBhcnNlSW50KG9mZnNldC9Ac2l6ZS5jaGFyV2lkdGgpLCBwb3M6QHBvc0F0WFkgeCx5IFxuICAgICAgICAgICAgICAgICMgZSA9IGUucHJldmlvdXNTaWJsaW5nXG4gICAgICAgICMgbnVsbFxuXG4gICAgc3BhbkJlZm9yZU1haW46IC0+XG4gICAgICAgIFxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcbiAgICAgICAgeCA9IG1jWzBdXG4gICAgICAgIGlmIGxpbmVFbGVtID0gQGxpbmVEaXZzW21jWzFdXVxuICAgICAgICAgICAgZSA9IGxpbmVFbGVtLmZpcnN0Q2hpbGQubGFzdENoaWxkXG4gICAgICAgICAgICB3aGlsZSBlXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBlLnN0YXJ0XG4gICAgICAgICAgICAgICAgcmlnaHQgPSBlLnN0YXJ0K2UudGV4dENvbnRlbnQubGVuZ3RoIFxuICAgICAgICAgICAgICAgIGlmIHN0YXJ0IDw9IHggPD0gcmlnaHRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHggPiByaWdodFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZVxuICAgICAgICAgICAgICAgIGUgPSBlLnByZXZpb3VzU2libGluZ1xuICAgICAgICBudWxsXG4gICAgICAgIFxuICAgIG51bUZ1bGxMaW5lczogLT4gQHNjcm9sbC5mdWxsTGluZXNcbiAgICBcbiAgICB2aWV3SGVpZ2h0OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGlmIEBzY3JvbGw/LnZpZXdIZWlnaHQgPj0gMCB0aGVuIHJldHVybiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgQHZpZXc/LmNsaWVudEhlaWdodFxuXG4gICAgZm9jdXM6IC0+IEB2aWV3LmZvY3VzKClcblxuICAgICMgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuXG4gICAgaW5pdERyYWc6IC0+XG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGxheWVyU2Nyb2xsXG5cbiAgICAgICAgICAgIG9uU3RhcnQ6IChkcmFnLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAdmlldy5mb2N1cygpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGV2ZW50UG9zID0gQHBvc0ZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgICAgICAgICBpZiBldmVudC5idXR0b24gPT0gMlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NraXAnXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBldmVudC5idXR0b24gPT0gMVxuICAgICAgICAgICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdza2lwJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50XG4gICAgICAgICAgICAgICAgICAgIGlmIGlzU2FtZVBvcyBldmVudFBvcywgQGNsaWNrUG9zXG4gICAgICAgICAgICAgICAgICAgICAgICBAc3RhcnRDbGlja1RpbWVyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGlja0NvdW50ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50ID09IDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZSA9IEByYW5nZUZvcldvcmRBdFBvcyBldmVudFBvc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXkgb3IgQHN0aWNreVNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkUmFuZ2VUb1NlbGVjdGlvbiByYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGhpZ2hsaWdodFdvcmRBbmRBZGRUb1NlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgQHNlbGVjdFNpbmdsZVJhbmdlIHJhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudCA9PSAzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IEByYW5nZUZvckxpbmVBdEluZGV4IEBjbGlja1Bvc1sxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZFJhbmdlVG9TZWxlY3Rpb24gclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNlbGVjdFNpbmdsZVJhbmdlIHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAb25DbGlja1RpbWVvdXQoKVxuXG4gICAgICAgICAgICAgICAgQGNsaWNrQ291bnQgPSAxXG4gICAgICAgICAgICAgICAgQGNsaWNrUG9zID0gZXZlbnRQb3NcbiAgICAgICAgICAgICAgICBAc3RhcnRDbGlja1RpbWVyKClcblxuICAgICAgICAgICAgICAgIHAgPSBAcG9zRm9yRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBAY2xpY2tBdFBvcyBwLCBldmVudFxuXG4gICAgICAgICAgICBvbk1vdmU6IChkcmFnLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBwID0gQHBvc0ZvckV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgICAgICAgICBAYWRkQ3Vyc29yQXRQb3MgW0BtYWluQ3Vyc29yKClbMF0sIHBbMV1dXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcCwgZXh0ZW5kOnRydWVcblxuICAgICAgICAgICAgb25TdG9wOiA9PlxuICAgICAgICAgICAgICAgIEBzZWxlY3ROb25lKCkgaWYgQG51bVNlbGVjdGlvbnMoKSBhbmQgZW1wdHkgQHRleHRPZlNlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIHN0YXJ0Q2xpY2tUaW1lcjogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQGNsaWNrVGltZXJcbiAgICAgICAgQGNsaWNrVGltZXIgPSBzZXRUaW1lb3V0IEBvbkNsaWNrVGltZW91dCwgQHN0aWNreVNlbGVjdGlvbiBhbmQgMzAwIG9yIDEwMDBcblxuICAgIG9uQ2xpY2tUaW1lb3V0OiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAY2xpY2tUaW1lclxuICAgICAgICBAY2xpY2tDb3VudCAgPSAwXG4gICAgICAgIEBjbGlja1RpbWVyICA9IG51bGxcbiAgICAgICAgQGNsaWNrUG9zICAgID0gbnVsbFxuXG4gICAgZnVuY0luZm9BdExpbmVJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIGZpbGVzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmaWxlcycgQGN1cnJlbnRGaWxlXG4gICAgICAgIGZpbGVJbmZvID0gZmlsZXNbQGN1cnJlbnRGaWxlXVxuICAgICAgICBmb3IgZnVuYyBpbiBmaWxlSW5mby5mdW5jc1xuICAgICAgICAgICAgaWYgZnVuYy5saW5lIDw9IGxpIDw9IGZ1bmMubGFzdFxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jLmNsYXNzICsgJy4nICsgZnVuYy5uYW1lICsgJyAnXG4gICAgICAgICcnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xpY2tBdFBvczogKHAsIGV2ZW50KSAtPlxuXG4gICAgICAgIGlmIGV2ZW50LmFsdEtleVxuICAgICAgICAgICAgQHRvZ2dsZUN1cnNvckF0UG9zIHBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHAsIGV4dGVuZDpldmVudC5zaGlmdEtleVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwreicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAZG8udW5kbygpXG4gICAgICAgICAgICB3aGVuICdjdHJsK3NoaWZ0K3onICAgICAgICAgdGhlbiByZXR1cm4gQGRvLnJlZG8oKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt4JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjdXQoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtjJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjb3B5KClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAcGFzdGUoKVxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBudW1IaWdobGlnaHRzKCkgICAgIHRoZW4gcmV0dXJuIEBjbGVhckhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgICAgIGlmIEBudW1DdXJzb3JzKCkgPiAxICAgIHRoZW4gcmV0dXJuIEBjbGVhckN1cnNvcnMoKVxuICAgICAgICAgICAgICAgIGlmIEBzdGlja3lTZWxlY3Rpb24gICAgIHRoZW4gcmV0dXJuIEBlbmRTdGlja3lTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKCkgICAgIHRoZW4gcmV0dXJuIEBzZWxlY3ROb25lKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYWN0aW9uIGluIEVkaXRvci5hY3Rpb25zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbi5jb21ibyA9PSBjb21ibyBvciBhY3Rpb24uYWNjZWwgPT0gY29tYm9cbiAgICAgICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnY3RybCthJyAnY29tbWFuZCthJyB0aGVuIHJldHVybiBAc2VsZWN0QWxsKClcbiAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgQFthY3Rpb24ua2V5XSBrZXksIGNvbWJvOiBjb21ibywgbW9kOiBtb2QsIGV2ZW50OiBldmVudFxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbi5hY2NlbHM/IGFuZCBvcy5wbGF0Zm9ybSgpICE9ICdkYXJ3aW4nXG4gICAgICAgICAgICAgICAgZm9yIGFjdGlvbkNvbWJvIGluIGFjdGlvbi5hY2NlbHNcbiAgICAgICAgICAgICAgICAgICAgaWYgY29tYm8gPT0gYWN0aW9uQ29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gQFthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBhY3Rpb24uY29tYm9zP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgYWN0aW9uQ29tYm8gaW4gYWN0aW9uLmNvbWJvc1xuICAgICAgICAgICAgICAgIGlmIGNvbWJvID09IGFjdGlvbkNvbWJvXG4gICAgICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gQFthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgICAgICAgICAgQFthY3Rpb24ua2V5XSBrZXksIGNvbWJvOiBjb21ibywgbW9kOiBtb2QsIGV2ZW50OiBldmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgY2hhciBhbmQgbW9kIGluIFtcInNoaWZ0XCIgXCJcIl1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEBpbnNlcnRDaGFyYWN0ZXIgY2hhclxuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICBvbktleURvd246IChldmVudCkgPT5cblxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHJldHVybiBpZiBub3QgY29tYm9cbiAgICAgICAgcmV0dXJuIGlmIGtleSA9PSAncmlnaHQgY2xpY2snICMgd2VpcmQgcmlnaHQgY29tbWFuZCBrZXlcblxuICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gQHRlcm0uaGFuZGxlS2V5IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICByZXN1bHQgPSBAaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudFxuXG4gICAgICAgIGlmICd1bmhhbmRsZWQnICE9IHJlc3VsdFxuICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dEVkaXRvclxuIl19
//# sourceURL=../../coffee/editor/texteditor.coffee