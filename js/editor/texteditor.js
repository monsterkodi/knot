// koffee 1.4.0

/*
000000000  00000000  000   000  000000000        00000000  0000000    000  000000000   0000000   00000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     0000000     00000       000           0000000   000   000  000     000     000   000  0000000
   000     000        000 000      000           000       000   000  000     000     000   000  000   000
   000     00000000  000   000     000           00000000  0000000    000     000      0000000   000   000
 */
var $, Editor, EditorScroll, TextEditor, _, clamp, drag, electron, elem, empty, kerror, keyinfo, klog, kstr, os, post, prefs, ref, render, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, prefs = ref.prefs, clamp = ref.clamp, empty = ref.empty, elem = ref.elem, kstr = ref.kstr, drag = ref.drag, os = ref.os, kerror = ref.kerror, klog = ref.klog, $ = ref.$, _ = ref._;

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

    TextEditor.prototype.setInputText = function(text) {
        var li, stripped;
        text = text.split('\n')[0];
        if (text != null) {
            text;
        } else {
            text = '';
        }
        li = this.numLines() - 1;
        this["do"].start();
        this.deleteCursorLines();
        stripped = kstr.stripAnsi(text);
        if (text !== stripped) {
            this.ansiLines[this["do"].numLines() - 1] = text;
        }
        this["do"].change(li, stripped);
        this["do"].setCursors([[stripped.length, li]]);
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

    TextEditor.prototype.setFontSize = function(fontSize) {
        var ansi, i, len, meta, metas, ref1;
        this.layers.style.fontSize = fontSize + "px";
        this.size.numbersWidth = indexOf.call(this.config.features, 'Numbers') >= 0 && 36 || 0;
        this.size.fontSize = fontSize;
        this.size.lineHeight = fontSize * 1.22;
        this.size.charWidth = fontSize * 0.6;
        klog("fontSize " + fontSize + " " + this.size.charWidth + " " + this.size.lineHeight);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0pBQUE7SUFBQTs7Ozs7QUFRQSxNQUE4RixPQUFBLENBQVEsS0FBUixDQUE5RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixxQkFBbkIsRUFBNEIsaUJBQTVCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsZUFBdkQsRUFBNkQsZUFBN0QsRUFBbUUsV0FBbkUsRUFBdUUsbUJBQXZFLEVBQStFLGVBQS9FLEVBQXFGLFNBQXJGLEVBQXdGOztBQUV4RixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7QUFDZixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUVUOzs7SUFFQyxvQkFBQyxJQUFELEVBQVEsTUFBUjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7Ozs7OztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxRQUFOO1lBQWUsUUFBQSxFQUFTLEdBQXhCO1NBQUw7UUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFWLENBQXNCLElBQUMsQ0FBQSxJQUF2QjtRQUdBLDRDQUFNLFFBQU4sRUFBZSxNQUFmO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxNQUFELEdBQWUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDZixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtZQUFxQixLQUFBLEVBQU0sSUFBQyxDQUFBLE1BQTVCO1NB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NkMsSUFBN0MsRUFBbUQsS0FBbkQ7UUFFVCxJQUFHLFdBQUEsS0FBZSxNQUFsQjttQkFDSSxTQUFBLENBQVUsS0FBVixFQURKOztJQVhPOzs7O0dBaHpCVTs7QUE4ekJ6QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgc3RvcEV2ZW50LCBrZXlpbmZvLCBwcmVmcywgY2xhbXAsIGVtcHR5LCBlbGVtLCBrc3RyLCBkcmFnLCBvcywga2Vycm9yLCBrbG9nLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG4gIFxucmVuZGVyICAgICAgID0gcmVxdWlyZSAnLi9yZW5kZXInXG5FZGl0b3JTY3JvbGwgPSByZXF1aXJlICcuL2VkaXRvcnNjcm9sbCdcbkVkaXRvciAgICAgICA9IHJlcXVpcmUgJy4vZWRpdG9yJ1xuZWxlY3Ryb24gICAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIFRleHRFZGl0b3IgZXh0ZW5kcyBFZGl0b3JcblxuICAgIEA6IChAdGVybSwgY29uZmlnKSAtPlxuXG4gICAgICAgIEB2aWV3ID0gZWxlbSBjbGFzczonZWRpdG9yJyB0YWJpbmRleDonMCdcbiAgICAgICAgQHRlcm0uZGl2LmFwcGVuZENoaWxkIEB2aWV3XG5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3VwZXIgJ2VkaXRvcicgY29uZmlnXG5cbiAgICAgICAgQGNsaWNrQ291bnQgID0gMFxuXG4gICAgICAgIEBsYXllcnMgICAgICA9IGVsZW0gY2xhc3M6ICdsYXllcnMnXG4gICAgICAgIEBsYXllclNjcm9sbCA9IGVsZW0gY2xhc3M6ICdsYXllclNjcm9sbCcgY2hpbGQ6QGxheWVyc1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAbGF5ZXJTY3JvbGxcblxuICAgICAgICBsYXllciA9IFtdXG4gICAgICAgIGxheWVyLnB1c2ggJ3NlbGVjdGlvbnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2hpZ2hsaWdodHMnXG4gICAgICAgIGxheWVyLnB1c2ggJ21ldGEnICAgIGlmICdNZXRhJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIGxheWVyLnB1c2ggJ2xpbmVzJ1xuICAgICAgICBsYXllci5wdXNoICdjdXJzb3JzJ1xuICAgICAgICBsYXllci5wdXNoICdudW1iZXJzJyBpZiAnTnVtYmVycycgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICBAaW5pdExheWVycyBsYXllclxuXG4gICAgICAgIEBzaXplID0ge31cbiAgICAgICAgQGVsZW0gPSBAbGF5ZXJEaWN0LmxpbmVzXG5cbiAgICAgICAgQGFuc2lMaW5lcyA9IFtdICMgb3JpZ2luYWwgYW5zaSBjb2RlIHN0cmluZ3NcbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdICMgY2FjaGUgZm9yIHJlbmRlcmVkIGxpbmUgc3BhbnNcbiAgICAgICAgQGxpbmVEaXZzICA9IHt9ICMgbWFwcyBsaW5lIG51bWJlcnMgdG8gZGlzcGxheWVkIGRpdnNcblxuICAgICAgICBAc2V0Rm9udFNpemUgcHJlZnMuZ2V0IFwiZm9udFNpemVcIiBAY29uZmlnLmZvbnRTaXplID8gMThcbiAgICAgICAgQHNjcm9sbCA9IG5ldyBFZGl0b3JTY3JvbGwgQFxuICAgICAgICBAc2Nyb2xsLm9uICdzaGlmdExpbmVzJyBAc2hpZnRMaW5lc1xuICAgICAgICBAc2Nyb2xsLm9uICdzaG93TGluZXMnICBAc2hvd0xpbmVzXG5cbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgIEBvbkJsdXJcbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgIEBvbkZvY3VzXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nICBAb25LZXlEb3duXG5cbiAgICAgICAgQGluaXREcmFnKClcblxuICAgICAgICBmb3IgZmVhdHVyZSBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgICAgICBpZiBmZWF0dXJlID09ICdDdXJzb3JMaW5lJ1xuICAgICAgICAgICAgICAgIEBjdXJzb3JMaW5lID0gZWxlbSAnZGl2JyBjbGFzczonY3Vyc29yLWxpbmUnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZmVhdHVyZU5hbWUgPSBmZWF0dXJlLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICBmZWF0dXJlQ2xzcyA9IHJlcXVpcmUgXCIuLyN7ZmVhdHVyZU5hbWV9XCJcbiAgICAgICAgICAgICAgICBAW2ZlYXR1cmVOYW1lXSA9IG5ldyBmZWF0dXJlQ2xzcyBAXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgZGVsOiAtPlxuXG4gICAgICAgIEBzY3JvbGxiYXI/LmRlbCgpXG5cbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgQG9uS2V5RG93blxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdibHVyJyAgICBAb25CbHVyXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgIEBvbkZvY3VzXG4gICAgICAgIEB2aWV3LmlubmVySFRNTCA9ICcnXG5cbiAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgaXNJbnB1dEN1cnNvcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBtYWluQ3Vyc29yKClbMV0gPj0gQG51bUxpbmVzKCktMVxuICAgICAgICBcbiAgICByZXN0b3JlSW5wdXRDdXJzb3I6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAaXNJbnB1dEN1cnNvcigpXG4gICAgICAgICAgICBAc3RhdGUuY3Vyc29ycygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbCA9IEBpbnB1dEN1cnNvciA/IEBkby5saW5lKEBudW1MaW5lcygpLTEpLmxlbmd0aFxuICAgICAgICAgICAgW1tjb2wsQG51bUxpbmVzKCktMV1dXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDBcblxuICAgIG9uRm9jdXM6ID0+XG5cbiAgICAgICAgQHN0YXJ0QmxpbmsoKVxuICAgICAgICBAZW1pdCAnZm9jdXMnIEBcbiAgICAgICAgcG9zdC5lbWl0ICdlZGl0b3JGb2N1cycgQFxuXG4gICAgb25CbHVyOiA9PlxuXG4gICAgICAgIEBzdG9wQmxpbmsoKVxuICAgICAgICBAZW1pdCAnYmx1cicgQFxuXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMDAwMDAwMCAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBpbml0TGF5ZXJzOiAobGF5ZXJDbGFzc2VzKSAtPlxuXG4gICAgICAgIEBsYXllckRpY3QgPSB7fVxuICAgICAgICBmb3IgY2xzIGluIGxheWVyQ2xhc3Nlc1xuICAgICAgICAgICAgQGxheWVyRGljdFtjbHNdID0gQGFkZExheWVyIGNsc1xuXG4gICAgYWRkTGF5ZXI6IChjbHMpIC0+XG5cbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogY2xzXG4gICAgICAgIEBsYXllcnMuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgIGRpdlxuXG4gICAgdXBkYXRlTGF5ZXJzOiAoKSAtPlxuXG4gICAgICAgIEByZW5kZXJIaWdobGlnaHRzKClcbiAgICAgICAgQHJlbmRlclNlbGVjdGlvbigpXG4gICAgICAgIEByZW5kZXJDdXJzb3JzKClcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjbGVhcjogPT4gQHNldExpbmVzIFsnJ11cbiAgICBcbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuXG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBlbWl0ICdjbGVhckxpbmVzJ1xuXG4gICAgICAgIGxpbmVzID89IFtdXG5cbiAgICAgICAgQHNwYW5DYWNoZSA9IFtdXG4gICAgICAgIEBsaW5lRGl2cyAgPSB7fVxuICAgICAgICBAYW5zaUxpbmVzID0gW11cbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwucmVzZXQoKVxuXG4gICAgICAgIHN1cGVyIGxpbmVzXG5cbiAgICAgICAgdmlld0hlaWdodCA9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwuc3RhcnQgdmlld0hlaWdodCwgQG51bUxpbmVzKClcblxuICAgICAgICBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdCA9IDBcbiAgICAgICAgQGxheWVyc1dpZHRoICA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICBAbGF5ZXJzSGVpZ2h0ID0gQGxheWVyU2Nyb2xsLm9mZnNldEhlaWdodFxuXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhcHBlbmRUZXh0OiAodGV4dCkgLT5cblxuICAgICAgICBpZiBub3QgdGV4dD9cbiAgICAgICAgICAgIGxvZyBcIiN7QG5hbWV9LmFwcGVuZFRleHQgLSBubyB0ZXh0P1wiXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBhcHBlbmRlZCA9IFtdXG4gICAgICAgIGxzID0gdGV4dD8uc3BsaXQgL1xcbi9cblxuICAgICAgICBmb3IgbCBpbiBsc1xuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLmFwcGVuZExpbmUgbFxuICAgICAgICAgICAgYXBwZW5kZWQucHVzaCBAbnVtTGluZXMoKS0xXG5cbiAgICAgICAgaWYgQHNjcm9sbC52aWV3SGVpZ2h0ICE9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCBAdmlld0hlaWdodCgpXG5cbiAgICAgICAgc2hvd0xpbmVzID0gKEBzY3JvbGwuYm90IDwgQHNjcm9sbC50b3ApIG9yIChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudmlld0xpbmVzKVxuXG4gICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQG51bUxpbmVzKCksIHNob3dMaW5lczpzaG93TGluZXNcblxuICAgICAgICBmb3IgbGkgaW4gYXBwZW5kZWRcbiAgICAgICAgICAgIEBlbWl0ICdsaW5lQXBwZW5kZWQnLCAjIG1ldGFcbiAgICAgICAgICAgICAgICBsaW5lSW5kZXg6IGxpXG4gICAgICAgICAgICAgICAgdGV4dDogQGxpbmUgbGlcblxuICAgICAgICBAZW1pdCAnbGluZXNBcHBlbmRlZCcgbHMgIyBhdXRvY29tcGxldGVcbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJyBAbnVtTGluZXMoKSAjIG1pbmltYXBcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGFwcGVuZE91dHB1dDogKHRleHQpIC0+XG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIGxzID0gdGV4dD8uc3BsaXQgL1xcbi9cblxuICAgICAgICBmb3IgbCBpbiBsc1xuICAgICAgICAgICAgc3RyaXBwZWQgPSBrc3RyLnN0cmlwQW5zaSBsXG4gICAgICAgICAgICBpZiBsICE9IHN0cmlwcGVkIFxuICAgICAgICAgICAgICAgIEBhbnNpTGluZXNbQGRvLm51bUxpbmVzKCktMV0gPSBsXG4gICAgICAgICAgICBAZG8uaW5zZXJ0IEBkby5udW1MaW5lcygpLTEsIHN0cmlwcGVkXG4gICAgICAgICAgICBcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgICAgICBAc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNldElucHV0VGV4dDogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gdGV4dC5zcGxpdCgnXFxuJylbMF1cbiAgICAgICAgdGV4dCA/PSAnJ1xuICAgICAgICBcbiAgICAgICAgbGkgPSBAbnVtTGluZXMoKS0xXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkZWxldGVDdXJzb3JMaW5lcygpXG4gICAgICAgICAgICBcbiAgICAgICAgc3RyaXBwZWQgPSBrc3RyLnN0cmlwQW5zaSB0ZXh0XG4gICAgICAgIGlmIHRleHQgIT0gc3RyaXBwZWQgXG4gICAgICAgICAgICBAYW5zaUxpbmVzW0Bkby5udW1MaW5lcygpLTFdID0gdGV4dFxuICAgICAgICBAZG8uY2hhbmdlIGxpLCBzdHJpcHBlZCAgICAgICAgICAgIFxuICAgICAgICAjIEBkby5pbnNlcnQgQGRvLm51bUxpbmVzKCktMSwgc3RyaXBwZWRcbiAgICAgICAgIyBAZG8uc2V0Q3Vyc29ycyBbW3RleHQubGVuZ3RoLCBsaV1dXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtbc3RyaXBwZWQubGVuZ3RoLCBsaV1dXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICByZXBsYWNlVGV4dEluTGluZTogKGxpLCB0ZXh0PScnKSAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLmNoYW5nZSBsaSwgdGV4dFxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHNldEZvbnRTaXplOiAoZm9udFNpemUpID0+XG4gICAgICAgIFxuICAgICAgICBAbGF5ZXJzLnN0eWxlLmZvbnRTaXplID0gXCIje2ZvbnRTaXplfXB4XCJcbiAgICAgICAgQHNpemUubnVtYmVyc1dpZHRoID0gJ051bWJlcnMnIGluIEBjb25maWcuZmVhdHVyZXMgYW5kIDM2IG9yIDBcbiAgICAgICAgQHNpemUuZm9udFNpemUgICAgID0gZm9udFNpemVcbiAgICAgICAgQHNpemUubGluZUhlaWdodCAgID0gZm9udFNpemUgKiAxLjIyXG4gICAgICAgIEBzaXplLmNoYXJXaWR0aCAgICA9IGZvbnRTaXplICogMC42XG4gICAgICAgIGtsb2cgXCJmb250U2l6ZSAje2ZvbnRTaXplfSAje0BzaXplLmNoYXJXaWR0aH0gI3tAc2l6ZS5saW5lSGVpZ2h0fVwiXG4gICAgICAgIEBzaXplLm9mZnNldFggICAgICA9IE1hdGguZmxvb3IgQHNpemUuY2hhcldpZHRoICsgQHNpemUubnVtYmVyc1dpZHRoXG5cbiAgICAgICAgQHNjcm9sbD8uc2V0TGluZUhlaWdodCBAc2l6ZS5saW5lSGVpZ2h0XG4gICAgICAgIGlmIEB0ZXh0KCkgIyA/Pz9cbiAgICAgICAgICAgIGFuc2kgPSBAYW5zaVRleHQoKVxuICAgICAgICAgICAgbWV0YXMgPSBAbWV0YS5tZXRhc1xuICAgICAgICAgICAgQHRlcm0uY2xlYXIoKVxuICAgICAgICAgICAgQGFwcGVuZE91dHB1dCBhbnNpXG4gICAgICAgICAgICBmb3IgbWV0YSBpbiBtZXRhc1xuICAgICAgICAgICAgICAgIG1ldGFbMl0ubGluZSA9IG1ldGFbMF1cbiAgICAgICAgICAgICAgICBAbWV0YS5hZGQgbWV0YVsyXVxuXG4gICAgICAgIEBlbWl0ICdmb250U2l6ZUNoYW5nZWQnXG5cbiAgICBhbnNpVGV4dDogLT5cbiAgICAgICAgXG4gICAgICAgIHRleHQgPSAnJ1xuICAgICAgICBmb3IgbGkgaW4gWzAuLi5AbnVtTGluZXMoKS0xXVxuICAgICAgICAgICAgdGV4dCArPSBAYW5zaUxpbmVzW2xpXSA/IEBzdGF0ZS5saW5lIGxpXG4gICAgICAgICAgICB0ZXh0ICs9ICdcXG4nXG4gICAgICAgIHRleHRbLi50ZXh0Lmxlbmd0aC0yXVxuICAgICAgICBcbiAgICBhbnNpTGluZTogKGxpKSA9PiBAYW5zaUxpbmVzW2xpXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgQHN5bnRheC5jaGFuZ2VkIGNoYW5nZUluZm9cblxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgW2RpLGxpLGNoXSA9IFtjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLm5ld0luZGV4LCBjaGFuZ2UuY2hhbmdlXVxuICAgICAgICAgICAgc3dpdGNoIGNoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCdcbiAgICAgICAgICAgICAgICAgICAgQGFuc2lMaW5lc1tsaV0gPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpLCBkaVxuICAgICAgICAgICAgICAgICAgICBAZW1pdCAnbGluZUNoYW5nZWQnIGxpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBhbnNpTGluZXMuc3BsaWNlIGRpLCAxXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lRGVsZXRlZCcgZGlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lSW5zZXJ0ZWQnIGxpLCBkaVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uaW5zZXJ0cyBvciBjaGFuZ2VJbmZvLmRlbGV0ZXNcbiAgICAgICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBAbnVtTGluZXMoKVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgIEBjbGVhckhpZ2hsaWdodHMoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY3Vyc29yc1xuICAgICAgICAgICAgQHJlbmRlckN1cnNvcnMoKVxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG4gICAgICAgICAgICBAZW1pdCAnY3Vyc29yJ1xuICAgICAgICAgICAgQHN1c3BlbmRCbGluaygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5zZWxlY3RzXG4gICAgICAgICAgICBAcmVuZGVyU2VsZWN0aW9uKClcbiAgICAgICAgICAgIEBlbWl0ICdzZWxlY3Rpb24nXG5cbiAgICAgICAgQGVtaXQgJ2NoYW5nZWQnIGNoYW5nZUluZm9cblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgdXBkYXRlTGluZTogKGxpLCBvaSkgLT5cblxuICAgICAgICBvaSA9IGxpIGlmIG5vdCBvaT9cblxuICAgICAgICBpZiBsaSA8IEBzY3JvbGwudG9wIG9yIGxpID4gQHNjcm9sbC5ib3RcbiAgICAgICAgICAgIGtlcnJvciBcImRhbmdsaW5nIGxpbmUgZGl2PyAje2xpfVwiIEBsaW5lRGl2c1tsaV0gaWYgQGxpbmVEaXZzW2xpXT9cbiAgICAgICAgICAgIGRlbGV0ZSBAc3BhbkNhY2hlW2xpXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciBcInVwZGF0ZUxpbmUgLSBvdXQgb2YgYm91bmRzPyBsaSAje2xpfSBvaSAje29pfVwiIGlmIG5vdCBAbGluZURpdnNbb2ldXG4gICAgICAgIFxuICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IEByZW5kZXJTcGFuIGxpXG5cbiAgICAgICAgZGl2ID0gQGxpbmVEaXZzW29pXVxuICAgICAgICBkaXYucmVwbGFjZUNoaWxkIEBzcGFuQ2FjaGVbbGldLCBkaXYuZmlyc3RDaGlsZFxuICAgICAgICBcbiAgICByZWZyZXNoTGluZXM6ICh0b3AsIGJvdCkgLT5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIEBzeW50YXguZ2V0RGlzcyBsaSwgdHJ1ZVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hvd0xpbmVzOiAodG9wLCBib3QsIG51bSkgPT5cblxuICAgICAgICBAbGluZURpdnMgPSB7fVxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBAYXBwZW5kTGluZSBsaVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG4gICAgICAgIEBlbWl0ICdsaW5lc0V4cG9zZWQnIHRvcDp0b3AsIGJvdDpib3QsIG51bTpudW1cbiAgICAgICAgQGVtaXQgJ2xpbmVzU2hvd24nIHRvcCwgYm90LCBudW1cblxuICAgIGFwcGVuZExpbmU6IChsaSkgLT5cblxuICAgICAgICBAbGluZURpdnNbbGldID0gZWxlbSBjbGFzczonbGluZSdcbiAgICAgICAgQGxpbmVEaXZzW2xpXS5hcHBlbmRDaGlsZCBAY2FjaGVkU3BhbiBsaVxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAbGluZURpdnNbbGldXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hpZnRMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG4gICAgICAgIFxuICAgICAgICBvbGRUb3AgPSB0b3AgLSBudW1cbiAgICAgICAgb2xkQm90ID0gYm90IC0gbnVtXG5cbiAgICAgICAgZGl2SW50byA9IChsaSxsbykgPT5cblxuICAgICAgICAgICAgaWYgbm90IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgICAgICBrZXJyb3IgXCIje0BuYW1lfS5zaGlmdExpbmVzLmRpdkludG8gLSBubyBkaXY/ICN7dG9wfSAje2JvdH0gI3tudW19IG9sZCAje29sZFRvcH0gI3tvbGRCb3R9IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgQGxpbmVEaXZzW2xpXSA9IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIGRlbGV0ZSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBAbGluZURpdnNbbGldLnJlcGxhY2VDaGlsZCBAY2FjaGVkU3BhbihsaSksIEBsaW5lRGl2c1tsaV0uZmlyc3RDaGlsZFxuXG4gICAgICAgICAgICBpZiBAc2hvd0ludmlzaWJsZXNcbiAgICAgICAgICAgICAgICB0eCA9IEBsaW5lKGxpKS5sZW5ndGggKiBAc2l6ZS5jaGFyV2lkdGggKyAxXG4gICAgICAgICAgICAgICAgc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOlwiaW52aXNpYmxlIG5ld2xpbmVcIiBodG1sOicmIzk2ODcnXG4gICAgICAgICAgICAgICAgc3Bhbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZSgje3R4fXB4LCAtMS41cHgpXCJcbiAgICAgICAgICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIHNwYW5cblxuICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICB3aGlsZSBvbGRCb3QgPCBib3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgKz0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkQm90LCBvbGRUb3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgKz0gMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBvbGRUb3AgPiB0b3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgLT0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkVG9wLCBvbGRCb3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgLT0gMVxuXG4gICAgICAgIEBlbWl0ICdsaW5lc1NoaWZ0ZWQnIHRvcCwgYm90LCBudW1cblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZUxpbmVQb3NpdGlvbnM6IChhbmltYXRlPTApIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbGksIGRpdiBvZiBAbGluZURpdnNcbiAgICAgICAgICAgIGlmIG5vdCBkaXY/IG9yIG5vdCBkaXYuc3R5bGU/XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gZGl2PyBzdHlsZT8nIGRpdj8sIGRpdj8uc3R5bGU/XG4gICAgICAgICAgICB5ID0gQHNpemUubGluZUhlaWdodCAqIChsaSAtIEBzY3JvbGwudG9wKVxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoI3tAc2l6ZS5vZmZzZXRYfXB4LCN7eX1weCwgMClcIlxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zaXRpb24gPSBcImFsbCAje2FuaW1hdGUvMTAwMH1zXCIgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgZGl2LnN0eWxlLnpJbmRleCA9IGxpXG5cbiAgICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQGVsZW0uY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2l0aW9uID0gJ2luaXRpYWwnXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHJlc2V0VHJhbnMsIGFuaW1hdGVcblxuICAgIHVwZGF0ZUxpbmVzOiAoKSAtPlxuXG4gICAgICAgIGZvciBsaSBpbiBbQHNjcm9sbC50b3AuLkBzY3JvbGwuYm90XVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcblxuICAgIGNsZWFySGlnaGxpZ2h0czogKCkgLT5cblxuICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAkKCcuaGlnaGxpZ2h0cycgQGxheWVycykuaW5uZXJIVE1MID0gJydcbiAgICAgICAgICAgIHN1cGVyKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICByZW5kZXJTcGFuOiAobGkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYW5zaUxpbmVzW2xpXT8ubGVuZ3RoXG4gICAgICAgICAgICBhbnNpID0gbmV3IGtzdHIuYW5zaVxuICAgICAgICAgICAgZGlzcyA9IGFuc2kuZGlzc2VjdChAYW5zaUxpbmVzW2xpXSlbMV1cbiAgICAgICAgICAgIHNwYW4gPSByZW5kZXIubGluZVNwYW4gZGlzcywgQHNpemVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3BhbiA9IHJlbmRlci5saW5lU3BhbiBAc3ludGF4LmdldERpc3MobGkpLCBAc2l6ZVxuICAgIFxuICAgIGNhY2hlZFNwYW46IChsaSkgLT5cblxuICAgICAgICBpZiBub3QgQHNwYW5DYWNoZVtsaV1cblxuICAgICAgICAgICAgQHNwYW5DYWNoZVtsaV0gPSBAcmVuZGVyU3BhbiBsaVxuXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldXG5cbiAgICByZW5kZXJDdXJzb3JzOiAtPlxuXG4gICAgICAgIGNzID0gW11cbiAgICAgICAgZm9yIGMgaW4gQGN1cnNvcnMoKVxuICAgICAgICAgICAgaWYgY1sxXSA+PSBAc2Nyb2xsLnRvcCBhbmQgY1sxXSA8PSBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAgICAgIGNzLnB1c2ggW2NbMF0sIGNbMV0gLSBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA9PSAxXG5cbiAgICAgICAgICAgIGlmIGNzLmxlbmd0aCA9PSAxXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbWNbMV0gPCAwXG5cbiAgICAgICAgICAgICAgICBpZiBtY1sxXSA+IEBudW1MaW5lcygpLTFcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIiN7QG5hbWV9LnJlbmRlckN1cnNvcnMgbWFpbkN1cnNvciBEQUZVSz9cIiBAbnVtTGluZXMoKSwga3N0ciBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgICAgICAgICByaSA9IG1jWzFdLUBzY3JvbGwudG9wXG4gICAgICAgICAgICAgICAgY3Vyc29yTGluZSA9IEBzdGF0ZS5saW5lKG1jWzFdKVxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIG1haW4gY3Vyc29yIGxpbmU/JyBpZiBub3QgY3Vyc29yTGluZT9cbiAgICAgICAgICAgICAgICBpZiBtY1swXSA+IGN1cnNvckxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ3ZpcnR1YWwnXG4gICAgICAgICAgICAgICAgICAgIGNzLnB1c2ggW2N1cnNvckxpbmUubGVuZ3RoLCByaSwgJ21haW4gb2ZmJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ21haW4gb2ZmJ1xuXG4gICAgICAgIGVsc2UgaWYgQG51bUN1cnNvcnMoKSA+IDFcblxuICAgICAgICAgICAgdmMgPSBbXSAjIHZpcnR1YWwgY3Vyc29yc1xuICAgICAgICAgICAgZm9yIGMgaW4gY3NcbiAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgQG1haW5DdXJzb3IoKSwgW2NbMF0sIGNbMV0gKyBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICAgICAgY1syXSA9ICdtYWluJ1xuICAgICAgICAgICAgICAgIGxpbmUgPSBAbGluZShAc2Nyb2xsLnRvcCtjWzFdKVxuICAgICAgICAgICAgICAgIGlmIGNbMF0gPiBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB2Yy5wdXNoIFtsaW5lLmxlbmd0aCwgY1sxXSwgJ3ZpcnR1YWwnXVxuICAgICAgICAgICAgY3MgPSBjcy5jb25jYXQgdmNcblxuICAgICAgICBodG1sID0gcmVuZGVyLmN1cnNvcnMgY3MsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3QuY3Vyc29ycy5pbm5lckhUTUwgPSBodG1sXG4gICAgICAgIFxuICAgICAgICB0eSA9IChtY1sxXSAtIEBzY3JvbGwudG9wKSAqIEBzaXplLmxpbmVIZWlnaHRcbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJzb3JMaW5lXG4gICAgICAgICAgICBAY3Vyc29yTGluZS5zdHlsZSA9IFwiei1pbmRleDowO3RyYW5zZm9ybTp0cmFuc2xhdGUzZCgwLCN7dHl9cHgsMCk7IGhlaWdodDoje0BzaXplLmxpbmVIZWlnaHR9cHg7d2lkdGg6MTAwJTtcIlxuICAgICAgICAgICAgQGxheWVycy5pbnNlcnRCZWZvcmUgQGN1cnNvckxpbmUsIEBsYXllcnMuZmlyc3RDaGlsZFxuXG4gICAgcmVuZGVyU2VsZWN0aW9uOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIGlmIHMgPSBAc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICAgICAgaCArPSByZW5kZXIuc2VsZWN0aW9uIHMsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3Quc2VsZWN0aW9ucy5pbm5lckhUTUwgPSBoXG5cbiAgICByZW5kZXJIaWdobGlnaHRzOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIGlmIHMgPSBAaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICAgICAgaCArPSByZW5kZXIuc2VsZWN0aW9uIHMsIEBzaXplLCBcImhpZ2hsaWdodFwiXG4gICAgICAgIEBsYXllckRpY3QuaGlnaGxpZ2h0cy5pbm5lckhUTUwgPSBoXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGN1cnNvckRpdjogLT4gJCAnLmN1cnNvci5tYWluJyBAbGF5ZXJEaWN0WydjdXJzb3JzJ11cblxuICAgIHN1c3BlbmRCbGluazogLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBibGlua1RpbWVyXG4gICAgICAgIEBzdG9wQmxpbmsoKVxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQgQHN1c3BlbmRUaW1lclxuICAgICAgICBibGlua0RlbGF5ID0gcHJlZnMuZ2V0ICdjdXJzb3JCbGlua0RlbGF5JyBbODAwLDIwMF1cbiAgICAgICAgQHN1c3BlbmRUaW1lciA9IHNldFRpbWVvdXQgQHJlbGVhc2VCbGluaywgYmxpbmtEZWxheVswXVxuXG4gICAgcmVsZWFzZUJsaW5rOiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAc3VzcGVuZFRpbWVyXG4gICAgICAgIGRlbGV0ZSBAc3VzcGVuZFRpbWVyXG4gICAgICAgIEBzdGFydEJsaW5rKClcblxuICAgIHRvZ2dsZUJsaW5rOiAtPlxuXG4gICAgICAgIGJsaW5rID0gbm90IHByZWZzLmdldCAnYmxpbmsnIGZhbHNlXG4gICAgICAgIHByZWZzLnNldCAnYmxpbmsnIGJsaW5rXG4gICAgICAgIGlmIGJsaW5rXG4gICAgICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzdG9wQmxpbmsoKVxuXG4gICAgZG9CbGluazogPT5cblxuICAgICAgICBAYmxpbmsgPSBub3QgQGJsaW5rXG4gICAgICAgIFxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBAYmxpbmtcbiAgICAgICAgQG1pbmltYXA/LmRyYXdNYWluQ3Vyc29yIEBibGlua1xuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBibGlua1RpbWVyXG4gICAgICAgIGJsaW5rRGVsYXkgPSBwcmVmcy5nZXQgJ2N1cnNvckJsaW5rRGVsYXknIFs4MDAsMjAwXVxuICAgICAgICBAYmxpbmtUaW1lciA9IHNldFRpbWVvdXQgQGRvQmxpbmssIEBibGluayBhbmQgYmxpbmtEZWxheVsxXSBvciBibGlua0RlbGF5WzBdXG5cbiAgICBzdGFydEJsaW5rOiAtPiBcbiAgICBcbiAgICAgICAgaWYgbm90IEBibGlua1RpbWVyIGFuZCBwcmVmcy5nZXQgJ2JsaW5rJ1xuICAgICAgICAgICAgQGRvQmxpbmsoKSBcblxuICAgIHN0b3BCbGluazogLT5cblxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBibGlua1RpbWVyXG4gICAgICAgIGRlbGV0ZSBAYmxpbmtUaW1lclxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICByZXNpemVkOiAtPlxuXG4gICAgICAgIHZoID0gQHZpZXcucGFyZW50Tm9kZS5jbGllbnRIZWlnaHRcblxuICAgICAgICByZXR1cm4gaWYgdmggYW5kIHZoID09IEBzY3JvbGwudmlld0hlaWdodFxuXG4gICAgICAgIEBudW1iZXJzPy5lbGVtLnN0eWxlLmhlaWdodCA9IFwiI3tAc2Nyb2xsLmV4cG9zZU51bSAqIEBzY3JvbGwubGluZUhlaWdodH1weFwiXG4gICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuXG4gICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCB2aFxuXG4gICAgICAgIEBlbWl0ICd2aWV3SGVpZ2h0JyB2aFxuXG4gICAgc2NyZWVuU2l6ZTogLT4gZWxlY3Ryb24ucmVtb3RlLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpLndvcmtBcmVhU2l6ZVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBwb3NBdFhZOih4LHkpIC0+XG5cbiAgICAgICAgc2wgPSBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdFxuICAgICAgICBzdCA9IEBzY3JvbGwub2Zmc2V0VG9wXG4gICAgICAgIGJyID0gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgbHggPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldFdpZHRoLCAgeCAtIGJyLmxlZnQgLSBAc2l6ZS5vZmZzZXRYICsgQHNpemUuY2hhcldpZHRoLzNcbiAgICAgICAgbHkgPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldEhlaWdodCwgeSAtIGJyLnRvcFxuICAgICAgICBweCA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHNsICsgbHgpKS9Ac2l6ZS5jaGFyV2lkdGgpKVxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHN0ICsgbHkpKS9Ac2l6ZS5saW5lSGVpZ2h0KSkgKyBAc2Nyb2xsLnRvcFxuICAgICAgICBwICA9IFtweCwgTWF0aC5taW4oQG51bUxpbmVzKCktMSwgcHkpXVxuICAgICAgICBwXG5cbiAgICBwb3NGb3JFdmVudDogKGV2ZW50KSAtPiBAcG9zQXRYWSBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZXG5cbiAgICBzcGFuQmVmb3JlTWFpbjogLT5cbiAgICAgICAgXG4gICAgICAgIG1jID0gQG1haW5DdXJzb3IoKVxuICAgICAgICB4ID0gbWNbMF1cbiAgICAgICAgaWYgbGluZUVsZW0gPSBAbGluZURpdnNbbWNbMV1dXG4gICAgICAgICAgICBlID0gbGluZUVsZW0uZmlyc3RDaGlsZC5sYXN0Q2hpbGRcbiAgICAgICAgICAgIHdoaWxlIGVcbiAgICAgICAgICAgICAgICBzdGFydCA9IGUuc3RhcnRcbiAgICAgICAgICAgICAgICByaWdodCA9IGUuc3RhcnQrZS50ZXh0Q29udGVudC5sZW5ndGggXG4gICAgICAgICAgICAgICAgaWYgc3RhcnQgPD0geCA8PSByaWdodFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgeCA+IHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlXG4gICAgICAgICAgICAgICAgZSA9IGUucHJldmlvdXNTaWJsaW5nXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgbnVtRnVsbExpbmVzOiAtPiBAc2Nyb2xsLmZ1bGxMaW5lc1xuICAgIFxuICAgIHZpZXdIZWlnaHQ6IC0+IFxuICAgICAgICBcbiAgICAgICAgaWYgQHNjcm9sbD8udmlld0hlaWdodCA+PSAwIHRoZW4gcmV0dXJuIEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICBAdmlldz8uY2xpZW50SGVpZ2h0XG5cbiAgICBmb2N1czogLT4gQHZpZXcuZm9jdXMoKVxuXG4gICAgIyAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBpbml0RHJhZzogLT5cblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAbGF5ZXJTY3JvbGxcblxuICAgICAgICAgICAgb25TdGFydDogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEB2aWV3LmZvY3VzKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZXZlbnRQb3MgPSBAcG9zRm9yRXZlbnQgZXZlbnRcblxuICAgICAgICAgICAgICAgIGlmIGV2ZW50LmJ1dHRvbiA9PSAyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnc2tpcCdcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGV2ZW50LmJ1dHRvbiA9PSAxXG4gICAgICAgICAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NraXAnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnRcbiAgICAgICAgICAgICAgICAgICAgaWYgaXNTYW1lUG9zIGV2ZW50UG9zLCBAY2xpY2tQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzdGFydENsaWNrVGltZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNsaWNrQ291bnQgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnQgPT0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlID0gQHJhbmdlRm9yV29yZEF0UG9zIGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleSBvciBAc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRSYW5nZVRvU2VsZWN0aW9uIHJhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAaGlnaGxpZ2h0V29yZEFuZEFkZFRvU2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBAc2VsZWN0U2luZ2xlUmFuZ2UgcmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50ID09IDNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gQHJhbmdlRm9yTGluZUF0SW5kZXggQGNsaWNrUG9zWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkUmFuZ2VUb1NlbGVjdGlvbiByXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2VsZWN0U2luZ2xlUmFuZ2UgclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBvbkNsaWNrVGltZW91dCgpXG5cbiAgICAgICAgICAgICAgICBAY2xpY2tDb3VudCA9IDFcbiAgICAgICAgICAgICAgICBAY2xpY2tQb3MgPSBldmVudFBvc1xuICAgICAgICAgICAgICAgIEBzdGFydENsaWNrVGltZXIoKVxuXG4gICAgICAgICAgICAgICAgcCA9IEBwb3NGb3JFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIEBjbGlja0F0UG9zIHAsIGV2ZW50XG5cbiAgICAgICAgICAgIG9uTW92ZTogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHAgPSBAcG9zRm9yRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgICAgIEBhZGRDdXJzb3JBdFBvcyBbQG1haW5DdXJzb3IoKVswXSwgcFsxXV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwLCBleHRlbmQ6dHJ1ZVxuXG4gICAgICAgICAgICBvblN0b3A6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHNlbGVjdE5vbmUoKSBpZiBAbnVtU2VsZWN0aW9ucygpIGFuZCBlbXB0eSBAdGV4dE9mU2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgc3RhcnRDbGlja1RpbWVyOiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAY2xpY2tUaW1lclxuICAgICAgICBAY2xpY2tUaW1lciA9IHNldFRpbWVvdXQgQG9uQ2xpY2tUaW1lb3V0LCBAc3RpY2t5U2VsZWN0aW9uIGFuZCAzMDAgb3IgMTAwMFxuXG4gICAgb25DbGlja1RpbWVvdXQ6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBjbGlja1RpbWVyXG4gICAgICAgIEBjbGlja0NvdW50ICA9IDBcbiAgICAgICAgQGNsaWNrVGltZXIgID0gbnVsbFxuICAgICAgICBAY2xpY2tQb3MgICAgPSBudWxsXG5cbiAgICBmdW5jSW5mb0F0TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJyBAY3VycmVudEZpbGVcbiAgICAgICAgZmlsZUluZm8gPSBmaWxlc1tAY3VycmVudEZpbGVdXG4gICAgICAgIGZvciBmdW5jIGluIGZpbGVJbmZvLmZ1bmNzXG4gICAgICAgICAgICBpZiBmdW5jLmxpbmUgPD0gbGkgPD0gZnVuYy5sYXN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMuY2xhc3MgKyAnLicgKyBmdW5jLm5hbWUgKyAnICdcbiAgICAgICAgJydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGlja0F0UG9zOiAocCwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgZXZlbnQuYWx0S2V5XG4gICAgICAgICAgICBAdG9nZ2xlQ3Vyc29yQXRQb3MgcFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcCwgZXh0ZW5kOmV2ZW50LnNoaWZ0S2V5XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnY3RybCt6JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBkby51bmRvKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrc2hpZnQreicgICAgICAgICB0aGVuIHJldHVybiBAZG8ucmVkbygpXG4gICAgICAgICAgICB3aGVuICdjdHJsK3gnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGN1dCgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK2MnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGNvcHkoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt2JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBwYXN0ZSgpXG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQG51bUhpZ2hsaWdodHMoKSAgICAgdGhlbiByZXR1cm4gQGNsZWFySGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA+IDEgICAgdGhlbiByZXR1cm4gQGNsZWFyQ3Vyc29ycygpXG4gICAgICAgICAgICAgICAgaWYgQHN0aWNreVNlbGVjdGlvbiAgICAgdGhlbiByZXR1cm4gQGVuZFN0aWNreVNlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSAgICAgdGhlbiByZXR1cm4gQHNlbGVjdE5vbmUoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBhY3Rpb24gaW4gRWRpdG9yLmFjdGlvbnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYWN0aW9uLmNvbWJvID09IGNvbWJvIG9yIGFjdGlvbi5hY2NlbCA9PSBjb21ib1xuICAgICAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgICAgICB3aGVuICdjdHJsK2EnICdjb21tYW5kK2EnIHRoZW4gcmV0dXJuIEBzZWxlY3RBbGwoKVxuICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gQFthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIHJldHVybiAndW5oYW5kbGVkJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYWN0aW9uLmFjY2Vscz8gYW5kIG9zLnBsYXRmb3JtKCkgIT0gJ2RhcndpbidcbiAgICAgICAgICAgICAgICBmb3IgYWN0aW9uQ29tYm8gaW4gYWN0aW9uLmFjY2Vsc1xuICAgICAgICAgICAgICAgICAgICBpZiBjb21ibyA9PSBhY3Rpb25Db21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiBAW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQFthY3Rpb24ua2V5XSBrZXksIGNvbWJvOiBjb21ibywgbW9kOiBtb2QsIGV2ZW50OiBldmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY29udGludWUgaWYgbm90IGFjdGlvbi5jb21ib3M/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBhY3Rpb25Db21ibyBpbiBhY3Rpb24uY29tYm9zXG4gICAgICAgICAgICAgICAgaWYgY29tYm8gPT0gYWN0aW9uQ29tYm9cbiAgICAgICAgICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiBAW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBjaGFyIGFuZCBtb2QgaW4gW1wic2hpZnRcIiBcIlwiXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gQGluc2VydENoYXJhY3RlciBjaGFyXG5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIG9uS2V5RG93bjogKGV2ZW50KSA9PlxuXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuICAgICAgICByZXR1cm4gaWYga2V5ID09ICdyaWdodCBjbGljaycgIyB3ZWlyZCByaWdodCBjb21tYW5kIGtleVxuXG4gICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBAdGVybS5oYW5kbGVLZXkgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHJlc3VsdCA9IEBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudCBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG5cbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gcmVzdWx0XG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxubW9kdWxlLmV4cG9ydHMgPSBUZXh0RWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/texteditor.coffee