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

ref = require('kxk'), post = ref.post, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, kerror = ref.kerror, prefs = ref.prefs, clamp = ref.clamp, empty = ref.empty, elem = ref.elem, kstr = ref.kstr, klog = ref.klog, drag = ref.drag, os = ref.os, $ = ref.$, _ = ref._;

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
        this.onSchemeChanged = bind(this.onSchemeChanged, this);
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
        post.removeListener('schemeChanged', this.onSchemeChanged);
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

    TextEditor.prototype.onSchemeChanged = function() {
        var ref1, updateMinimap;
        if ((ref1 = this.syntax) != null) {
            ref1.schemeChanged();
        }
        if (this.minimap) {
            updateMinimap = (function(_this) {
                return function() {
                    var ref2;
                    return (ref2 = _this.minimap) != null ? ref2.drawLines() : void 0;
                };
            })(this);
            return setTimeout(updateMinimap, 10);
        }
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
        klog('setLines');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0pBQUE7SUFBQTs7Ozs7QUFRQSxNQUE4RixPQUFBLENBQVEsS0FBUixDQUE5RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixxQkFBbkIsRUFBNEIsbUJBQTVCLEVBQW9DLGlCQUFwQyxFQUEyQyxpQkFBM0MsRUFBa0QsaUJBQWxELEVBQXlELGVBQXpELEVBQStELGVBQS9ELEVBQXFFLGVBQXJFLEVBQTJFLGVBQTNFLEVBQWlGLFdBQWpGLEVBQXFGLFNBQXJGLEVBQXdGOztBQUV4RixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7QUFDZixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUVUOzs7SUFFQyxvQkFBQyxJQUFELEVBQVEsTUFBUjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7Ozs7Ozs7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sUUFBTjtZQUFlLFFBQUEsRUFBUyxHQUF4QjtTQUFMO1FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVixDQUFzQixJQUFDLENBQUEsSUFBdkI7UUFHQSw0Q0FBTSxRQUFOLEVBQWUsTUFBZjtRQUVBLElBQUMsQ0FBQSxVQUFELEdBQWU7UUFFZixJQUFDLENBQUEsTUFBRCxHQUFlLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtTQUFMO1FBQ2YsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7WUFBcUIsS0FBQSxFQUFNLElBQUMsQ0FBQSxNQUE1QjtT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QixFQUFpQyxHQUFqQyxFQUFzQyxLQUF0QyxFQUE2QyxJQUE3QyxFQUFtRCxLQUFuRDtRQUVULElBQUcsV0FBQSxLQUFlLE1BQWxCO21CQUNJLFNBQUEsQ0FBVSxLQUFWLEVBREo7O0lBWE87Ozs7R0FqMEJVOztBQSswQnpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBzdG9wRXZlbnQsIGtleWluZm8sIGtlcnJvciwgcHJlZnMsIGNsYW1wLCBlbXB0eSwgZWxlbSwga3N0ciwga2xvZywgZHJhZywgb3MsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcbiAgXG5yZW5kZXIgICAgICAgPSByZXF1aXJlICcuL3JlbmRlcidcbkVkaXRvclNjcm9sbCA9IHJlcXVpcmUgJy4vZWRpdG9yc2Nyb2xsJ1xuRWRpdG9yICAgICAgID0gcmVxdWlyZSAnLi9lZGl0b3InXG5lbGVjdHJvbiAgICAgPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgVGV4dEVkaXRvciBleHRlbmRzIEVkaXRvclxuXG4gICAgQDogKEB0ZXJtLCBjb25maWcpIC0+XG5cbiAgICAgICAgQHZpZXcgPSBlbGVtIGNsYXNzOidlZGl0b3InIHRhYmluZGV4OicwJ1xuICAgICAgICBAdGVybS5kaXYuYXBwZW5kQ2hpbGQgQHZpZXdcblxuICAgICAgICAgICAgICAgIFxuICAgICAgICBzdXBlciAnZWRpdG9yJyBjb25maWdcblxuICAgICAgICBAY2xpY2tDb3VudCAgPSAwXG5cbiAgICAgICAgQGxheWVycyAgICAgID0gZWxlbSBjbGFzczogJ2xheWVycydcbiAgICAgICAgQGxheWVyU2Nyb2xsID0gZWxlbSBjbGFzczogJ2xheWVyU2Nyb2xsJyBjaGlsZDpAbGF5ZXJzXG4gICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBsYXllclNjcm9sbFxuXG4gICAgICAgIGxheWVyID0gW11cbiAgICAgICAgbGF5ZXIucHVzaCAnc2VsZWN0aW9ucydcbiAgICAgICAgbGF5ZXIucHVzaCAnaGlnaGxpZ2h0cydcbiAgICAgICAgbGF5ZXIucHVzaCAnbWV0YScgICAgaWYgJ01ldGEnIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgbGF5ZXIucHVzaCAnbGluZXMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2N1cnNvcnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ251bWJlcnMnIGlmICdOdW1iZXJzJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIEBpbml0TGF5ZXJzIGxheWVyXG5cbiAgICAgICAgQHNpemUgPSB7fVxuICAgICAgICBAZWxlbSA9IEBsYXllckRpY3QubGluZXNcblxuICAgICAgICBAYW5zaUxpbmVzID0gW10gIyBvcmlnaW5hbCBhbnNpIGNvZGUgc3RyaW5nc1xuICAgICAgICBAc3BhbkNhY2hlID0gW10gIyBjYWNoZSBmb3IgcmVuZGVyZWQgbGluZSBzcGFuc1xuICAgICAgICBAbGluZURpdnMgID0ge30gIyBtYXBzIGxpbmUgbnVtYmVycyB0byBkaXNwbGF5ZWQgZGl2c1xuXG4gICAgICAgIEBzZXRGb250U2l6ZSBwcmVmcy5nZXQgXCJmb250U2l6ZVwiIEBjb25maWcuZm9udFNpemUgPyAxOFxuICAgICAgICBAc2Nyb2xsID0gbmV3IEVkaXRvclNjcm9sbCBAXG4gICAgICAgIEBzY3JvbGwub24gJ3NoaWZ0TGluZXMnIEBzaGlmdExpbmVzXG4gICAgICAgIEBzY3JvbGwub24gJ3Nob3dMaW5lcycgIEBzaG93TGluZXNcblxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdibHVyJyAgICAgQG9uQmx1clxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgQG9uRm9jdXNcbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgIEBvbktleURvd25cblxuICAgICAgICBAaW5pdERyYWcoKVxuXG4gICAgICAgIGZvciBmZWF0dXJlIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgICAgIGlmIGZlYXR1cmUgPT0gJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICAgICAgQGN1cnNvckxpbmUgPSBlbGVtICdkaXYnIGNsYXNzOidjdXJzb3ItbGluZSdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmZWF0dXJlTmFtZSA9IGZlYXR1cmUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIGZlYXR1cmVDbHNzID0gcmVxdWlyZSBcIi4vI3tmZWF0dXJlTmFtZX1cIlxuICAgICAgICAgICAgICAgIEBbZmVhdHVyZU5hbWVdID0gbmV3IGZlYXR1cmVDbHNzIEBcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBkZWw6IC0+XG5cbiAgICAgICAgcG9zdC5yZW1vdmVMaXN0ZW5lciAnc2NoZW1lQ2hhbmdlZCcgQG9uU2NoZW1lQ2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbGJhcj8uZGVsKClcblxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdrZXlkb3duJyBAb25LZXlEb3duXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2JsdXInICAgIEBvbkJsdXJcbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgQG9uRm9jdXNcbiAgICAgICAgQHZpZXcuaW5uZXJIVE1MID0gJydcblxuICAgICAgICBzdXBlcigpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBpc0lucHV0Q3Vyc29yOiAtPlxuICAgICAgICBcbiAgICAgICAgQG1haW5DdXJzb3IoKVsxXSA+PSBAbnVtTGluZXMoKS0xXG4gICAgICAgIFxuICAgIHJlc3RvcmVJbnB1dEN1cnNvcjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBpc0lucHV0Q3Vyc29yKClcbiAgICAgICAgICAgIEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sID0gQGlucHV0Q3Vyc29yID8gQGRvLmxpbmUoQG51bUxpbmVzKCktMSkubGVuZ3RoXG4gICAgICAgICAgICBbW2NvbCxAbnVtTGluZXMoKS0xXV1cbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgb25Gb2N1czogPT5cblxuICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIEBlbWl0ICdmb2N1cycgQFxuICAgICAgICBwb3N0LmVtaXQgJ2VkaXRvckZvY3VzJyBAXG5cbiAgICBvbkJsdXI6ID0+XG5cbiAgICAgICAgQHN0b3BCbGluaygpXG4gICAgICAgIEBlbWl0ICdibHVyJyBAXG5cbiAgICBvblNjaGVtZUNoYW5nZWQ6ID0+XG5cbiAgICAgICAgQHN5bnRheD8uc2NoZW1lQ2hhbmdlZCgpXG4gICAgICAgIGlmIEBtaW5pbWFwXG4gICAgICAgICAgICB1cGRhdGVNaW5pbWFwID0gPT4gQG1pbmltYXA/LmRyYXdMaW5lcygpXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHVwZGF0ZU1pbmltYXAsIDEwXG5cbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRMYXllcnM6IChsYXllckNsYXNzZXMpIC0+XG5cbiAgICAgICAgQGxheWVyRGljdCA9IHt9XG4gICAgICAgIGZvciBjbHMgaW4gbGF5ZXJDbGFzc2VzXG4gICAgICAgICAgICBAbGF5ZXJEaWN0W2Nsc10gPSBAYWRkTGF5ZXIgY2xzXG5cbiAgICBhZGRMYXllcjogKGNscykgLT5cblxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBjbHNcbiAgICAgICAgQGxheWVycy5hcHBlbmRDaGlsZCBkaXZcbiAgICAgICAgZGl2XG5cbiAgICB1cGRhdGVMYXllcnM6ICgpIC0+XG5cbiAgICAgICAgQHJlbmRlckhpZ2hsaWdodHMoKVxuICAgICAgICBAcmVuZGVyU2VsZWN0aW9uKClcbiAgICAgICAgQHJlbmRlckN1cnNvcnMoKVxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNsZWFyOiA9PiBAc2V0TGluZXMgWycnXVxuICAgIFxuICAgIHNldExpbmVzOiAobGluZXMpIC0+XG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGVtaXQgJ2NsZWFyTGluZXMnXG5cbiAgICAgICAgbGluZXMgPz0gW11cblxuICAgICAgICBAc3BhbkNhY2hlID0gW11cbiAgICAgICAgQGxpbmVEaXZzICA9IHt9XG4gICAgICAgIGtsb2cgJ3NldExpbmVzJ1xuICAgICAgICBAYW5zaUxpbmVzID0gW11cbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwucmVzZXQoKVxuXG4gICAgICAgIHN1cGVyIGxpbmVzXG5cbiAgICAgICAgdmlld0hlaWdodCA9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgXG4gICAgICAgIEBzY3JvbGwuc3RhcnQgdmlld0hlaWdodCwgQG51bUxpbmVzKClcblxuICAgICAgICBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdCA9IDBcbiAgICAgICAgQGxheWVyc1dpZHRoICA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICBAbGF5ZXJzSGVpZ2h0ID0gQGxheWVyU2Nyb2xsLm9mZnNldEhlaWdodFxuXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuICAgICAgIFxuICAgIHNldElucHV0VGV4dDogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gdGV4dC5zcGxpdCgnXFxuJylbMF1cbiAgICAgICAgdGV4dCA/PSAnJ1xuICAgICAgICBcbiAgICAgICAgbGkgPSBAbnVtTGluZXMoKS0xXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkZWxldGVDdXJzb3JMaW5lcygpXG4gICAgICAgIEBkby5jaGFuZ2UgbGksIHRleHRcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgW1t0ZXh0Lmxlbmd0aCwgbGldXVxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgcmVwbGFjZVRleHRJbkxpbmU6IChsaSwgdGV4dD0nJykgLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5jaGFuZ2UgbGksIHRleHRcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYXBwZW5kVGV4dDogKHRleHQpIC0+XG5cbiAgICAgICAgaWYgbm90IHRleHQ/XG4gICAgICAgICAgICBsb2cgXCIje0BuYW1lfS5hcHBlbmRUZXh0IC0gbm8gdGV4dD9cIlxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgYXBwZW5kZWQgPSBbXVxuICAgICAgICBscyA9IHRleHQ/LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgZm9yIGwgaW4gbHNcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5hcHBlbmRMaW5lIGxcbiAgICAgICAgICAgIGFwcGVuZGVkLnB1c2ggQG51bUxpbmVzKCktMVxuXG4gICAgICAgIGlmIEBzY3JvbGwudmlld0hlaWdodCAhPSBAdmlld0hlaWdodCgpXG4gICAgICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgQHZpZXdIZWlnaHQoKVxuXG4gICAgICAgIHNob3dMaW5lcyA9IChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudG9wKSBvciAoQHNjcm9sbC5ib3QgPCBAc2Nyb2xsLnZpZXdMaW5lcylcblxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpLCBzaG93TGluZXM6c2hvd0xpbmVzXG5cbiAgICAgICAgZm9yIGxpIGluIGFwcGVuZGVkXG4gICAgICAgICAgICBAZW1pdCAnbGluZUFwcGVuZGVkJywgIyBtZXRhXG4gICAgICAgICAgICAgICAgbGluZUluZGV4OiBsaVxuICAgICAgICAgICAgICAgIHRleHQ6IEBsaW5lIGxpXG5cbiAgICAgICAgQGVtaXQgJ2xpbmVzQXBwZW5kZWQnIGxzICMgYXV0b2NvbXBsZXRlXG4gICAgICAgIEBlbWl0ICdudW1MaW5lcycgQG51bUxpbmVzKCkgIyBtaW5pbWFwXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBhcHBlbmRPdXRwdXQ6ICh0ZXh0KSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICBscyA9IHRleHQ/LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgZm9yIGwgaW4gbHNcbiAgICAgICAgICAgIHN0cmlwcGVkID0ga3N0ci5zdHJpcEFuc2kgbFxuICAgICAgICAgICAgaWYgbCAhPSBzdHJpcHBlZCBcbiAgICAgICAgICAgICAgICBAYW5zaUxpbmVzW0Bkby5udW1MaW5lcygpLTFdID0gbFxuICAgICAgICAgICAgQGRvLmluc2VydCBAZG8ubnVtTGluZXMoKS0xLCBzdHJpcHBlZFxuICAgICAgICAgICAgXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICAgICAgQHNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgc2V0Rm9udFNpemU6IChmb250U2l6ZSkgPT5cbiAgICAgICAgXG4gICAgICAgIEBsYXllcnMuc3R5bGUuZm9udFNpemUgPSBcIiN7Zm9udFNpemV9cHhcIlxuICAgICAgICBAc2l6ZS5udW1iZXJzV2lkdGggPSAnTnVtYmVycycgaW4gQGNvbmZpZy5mZWF0dXJlcyBhbmQgMzYgb3IgMFxuICAgICAgICBAc2l6ZS5mb250U2l6ZSAgICAgPSBmb250U2l6ZVxuICAgICAgICBAc2l6ZS5saW5lSGVpZ2h0ICAgPSBmb250U2l6ZSAqIDEuMjUgIyBrZWVwIGluIHN5bmMgd2l0aCBzdHlsZSBsaW5lLWhlaWdodHNcbiAgICAgICAgQHNpemUuY2hhcldpZHRoICAgID0gZm9udFNpemUgKiAwLjZcbiAgICAgICAgQHNpemUub2Zmc2V0WCAgICAgID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGggKyBAc2l6ZS5udW1iZXJzV2lkdGhcblxuICAgICAgICBAc2Nyb2xsPy5zZXRMaW5lSGVpZ2h0IEBzaXplLmxpbmVIZWlnaHRcbiAgICAgICAgaWYgQHRleHQoKVxuICAgICAgICAgICAgYW5zaSA9IEBhbnNpVGV4dCgpXG4gICAgICAgICAgICBtZXRhcyA9IEBtZXRhLm1ldGFzXG4gICAgICAgICAgICBAdGVybS5jbGVhcigpXG4gICAgICAgICAgICBAYXBwZW5kT3V0cHV0IGFuc2lcbiAgICAgICAgICAgIGZvciBtZXRhIGluIG1ldGFzXG4gICAgICAgICAgICAgICAgbWV0YVsyXS5saW5lID0gbWV0YVswXVxuICAgICAgICAgICAgICAgIEBtZXRhLmFkZCBtZXRhWzJdXG5cbiAgICAgICAgQGVtaXQgJ2ZvbnRTaXplQ2hhbmdlZCdcblxuICAgIGFuc2lUZXh0OiAtPlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9ICcnXG4gICAgICAgIGZvciBsaSBpbiBbMC4uLkBudW1MaW5lcygpLTFdXG4gICAgICAgICAgICB0ZXh0ICs9IEBhbnNpTGluZXNbbGldID8gQHN0YXRlLmxpbmUgbGlcbiAgICAgICAgICAgIHRleHQgKz0gJ1xcbidcbiAgICAgICAgdGV4dFsuLnRleHQubGVuZ3RoLTJdXG4gICAgICAgIFxuICAgIGFuc2lMaW5lOiAobGkpID0+IEBhbnNpTGluZXNbbGldXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjaGFuZ2VkOiAoY2hhbmdlSW5mbykgLT5cblxuICAgICAgICBAc3ludGF4LmNoYW5nZWQgY2hhbmdlSW5mb1xuXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBbZGksbGksY2hdID0gW2NoYW5nZS5kb0luZGV4LCBjaGFuZ2UubmV3SW5kZXgsIGNoYW5nZS5jaGFuZ2VdXG4gICAgICAgICAgICBzd2l0Y2ggY2hcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJ1xuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ2NoYW5nZWQnIGxpXG4gICAgICAgICAgICAgICAgICAgIEBhbnNpTGluZXNbbGldID0gbnVsbFxuICAgICAgICAgICAgICAgICAgICBAdXBkYXRlTGluZSBsaSwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVDaGFuZ2VkJyBsaVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdkZWxldGVkJ1xuICAgICAgICAgICAgICAgICAgICBAc3BhbkNhY2hlID0gQHNwYW5DYWNoZS5zbGljZSAwLCBkaVxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgJ2RlbGV0ZWQnIGRpXG4gICAgICAgICAgICAgICAgICAgIEBhbnNpTGluZXMuc3BsaWNlIGRpLCAxXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lRGVsZXRlZCcgZGlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lSW5zZXJ0ZWQnIGxpLCBkaVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uaW5zZXJ0cyBvciBjaGFuZ2VJbmZvLmRlbGV0ZXNcbiAgICAgICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBAbnVtTGluZXMoKVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgIEBjbGVhckhpZ2hsaWdodHMoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY3Vyc29yc1xuICAgICAgICAgICAgQHJlbmRlckN1cnNvcnMoKVxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG4gICAgICAgICAgICBAZW1pdCAnY3Vyc29yJ1xuICAgICAgICAgICAgQHN1c3BlbmRCbGluaygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5zZWxlY3RzXG4gICAgICAgICAgICBAcmVuZGVyU2VsZWN0aW9uKClcbiAgICAgICAgICAgIEBlbWl0ICdzZWxlY3Rpb24nXG5cbiAgICAgICAgQGVtaXQgJ2NoYW5nZWQnIGNoYW5nZUluZm9cblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgdXBkYXRlTGluZTogKGxpLCBvaSkgLT5cblxuICAgICAgICBvaSA9IGxpIGlmIG5vdCBvaT9cblxuICAgICAgICBpZiBsaSA8IEBzY3JvbGwudG9wIG9yIGxpID4gQHNjcm9sbC5ib3RcbiAgICAgICAgICAgIGtlcnJvciBcImRhbmdsaW5nIGxpbmUgZGl2PyAje2xpfVwiIEBsaW5lRGl2c1tsaV0gaWYgQGxpbmVEaXZzW2xpXT9cbiAgICAgICAgICAgIGRlbGV0ZSBAc3BhbkNhY2hlW2xpXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciBcInVwZGF0ZUxpbmUgLSBvdXQgb2YgYm91bmRzPyBsaSAje2xpfSBvaSAje29pfVwiIGlmIG5vdCBAbGluZURpdnNbb2ldXG4gICAgICAgIFxuICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IEByZW5kZXJTcGFuIGxpXG5cbiAgICAgICAgZGl2ID0gQGxpbmVEaXZzW29pXVxuICAgICAgICBkaXYucmVwbGFjZUNoaWxkIEBzcGFuQ2FjaGVbbGldLCBkaXYuZmlyc3RDaGlsZFxuICAgICAgICBcbiAgICByZWZyZXNoTGluZXM6ICh0b3AsIGJvdCkgLT5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIEBzeW50YXguZ2V0RGlzcyBsaSwgdHJ1ZVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hvd0xpbmVzOiAodG9wLCBib3QsIG51bSkgPT5cblxuICAgICAgICBAbGluZURpdnMgPSB7fVxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBAYXBwZW5kTGluZSBsaVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG4gICAgICAgIEBlbWl0ICdsaW5lc0V4cG9zZWQnIHRvcDp0b3AsIGJvdDpib3QsIG51bTpudW1cbiAgICAgICAgQGVtaXQgJ2xpbmVzU2hvd24nIHRvcCwgYm90LCBudW1cblxuICAgIGFwcGVuZExpbmU6IChsaSkgLT5cblxuICAgICAgICBAbGluZURpdnNbbGldID0gZWxlbSBjbGFzczonbGluZSdcbiAgICAgICAgQGxpbmVEaXZzW2xpXS5hcHBlbmRDaGlsZCBAY2FjaGVkU3BhbiBsaVxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAbGluZURpdnNbbGldXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hpZnRMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG4gICAgICAgIFxuICAgICAgICBvbGRUb3AgPSB0b3AgLSBudW1cbiAgICAgICAgb2xkQm90ID0gYm90IC0gbnVtXG5cbiAgICAgICAgZGl2SW50byA9IChsaSxsbykgPT5cblxuICAgICAgICAgICAgaWYgbm90IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgICAgICBrZXJyb3IgXCIje0BuYW1lfS5zaGlmdExpbmVzLmRpdkludG8gLSBubyBkaXY/ICN7dG9wfSAje2JvdH0gI3tudW19IG9sZCAje29sZFRvcH0gI3tvbGRCb3R9IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgQGxpbmVEaXZzW2xpXSA9IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIGRlbGV0ZSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBAbGluZURpdnNbbGldLnJlcGxhY2VDaGlsZCBAY2FjaGVkU3BhbihsaSksIEBsaW5lRGl2c1tsaV0uZmlyc3RDaGlsZFxuXG4gICAgICAgICAgICBpZiBAc2hvd0ludmlzaWJsZXNcbiAgICAgICAgICAgICAgICB0eCA9IEBsaW5lKGxpKS5sZW5ndGggKiBAc2l6ZS5jaGFyV2lkdGggKyAxXG4gICAgICAgICAgICAgICAgc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOlwiaW52aXNpYmxlIG5ld2xpbmVcIiBodG1sOicmIzk2ODcnXG4gICAgICAgICAgICAgICAgc3Bhbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZSgje3R4fXB4LCAtMS41cHgpXCJcbiAgICAgICAgICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIHNwYW5cblxuICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICB3aGlsZSBvbGRCb3QgPCBib3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgKz0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkQm90LCBvbGRUb3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgKz0gMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBvbGRUb3AgPiB0b3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgLT0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkVG9wLCBvbGRCb3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgLT0gMVxuXG4gICAgICAgIEBlbWl0ICdsaW5lc1NoaWZ0ZWQnIHRvcCwgYm90LCBudW1cblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZUxpbmVQb3NpdGlvbnM6IChhbmltYXRlPTApIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbGksIGRpdiBvZiBAbGluZURpdnNcbiAgICAgICAgICAgIGlmIG5vdCBkaXY/IG9yIG5vdCBkaXYuc3R5bGU/XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gZGl2PyBzdHlsZT8nIGRpdj8sIGRpdj8uc3R5bGU/XG4gICAgICAgICAgICB5ID0gQHNpemUubGluZUhlaWdodCAqIChsaSAtIEBzY3JvbGwudG9wKVxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoI3tAc2l6ZS5vZmZzZXRYfXB4LCN7eX1weCwgMClcIlxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zaXRpb24gPSBcImFsbCAje2FuaW1hdGUvMTAwMH1zXCIgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgZGl2LnN0eWxlLnpJbmRleCA9IGxpXG5cbiAgICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQGVsZW0uY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2l0aW9uID0gJ2luaXRpYWwnXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHJlc2V0VHJhbnMsIGFuaW1hdGVcblxuICAgIHVwZGF0ZUxpbmVzOiAoKSAtPlxuXG4gICAgICAgIGZvciBsaSBpbiBbQHNjcm9sbC50b3AuLkBzY3JvbGwuYm90XVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcblxuICAgIGNsZWFySGlnaGxpZ2h0czogKCkgLT5cblxuICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAkKCcuaGlnaGxpZ2h0cycgQGxheWVycykuaW5uZXJIVE1MID0gJydcbiAgICAgICAgICAgIHN1cGVyKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICByZW5kZXJTcGFuOiAobGkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYW5zaUxpbmVzW2xpXT8ubGVuZ3RoXG4gICAgICAgICAgICBhbnNpID0gbmV3IGtzdHIuYW5zaVxuICAgICAgICAgICAgZGlzcyA9IGFuc2kuZGlzc2VjdChAYW5zaUxpbmVzW2xpXSlbMV1cbiAgICAgICAgICAgIHNwYW4gPSByZW5kZXIubGluZVNwYW4gZGlzcywgQHNpemVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3BhbiA9IHJlbmRlci5saW5lU3BhbiBAc3ludGF4LmdldERpc3MobGkpLCBAc2l6ZVxuICAgIFxuICAgIGNhY2hlZFNwYW46IChsaSkgLT5cblxuICAgICAgICBpZiBub3QgQHNwYW5DYWNoZVtsaV1cblxuICAgICAgICAgICAgQHNwYW5DYWNoZVtsaV0gPSBAcmVuZGVyU3BhbiBsaVxuXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldXG5cbiAgICByZW5kZXJDdXJzb3JzOiAtPlxuXG4gICAgICAgIGNzID0gW11cbiAgICAgICAgZm9yIGMgaW4gQGN1cnNvcnMoKVxuICAgICAgICAgICAgaWYgY1sxXSA+PSBAc2Nyb2xsLnRvcCBhbmQgY1sxXSA8PSBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAgICAgIGNzLnB1c2ggW2NbMF0sIGNbMV0gLSBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA9PSAxXG5cbiAgICAgICAgICAgIGlmIGNzLmxlbmd0aCA9PSAxXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbWNbMV0gPCAwXG5cbiAgICAgICAgICAgICAgICBpZiBtY1sxXSA+IEBudW1MaW5lcygpLTFcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIiN7QG5hbWV9LnJlbmRlckN1cnNvcnMgbWFpbkN1cnNvciBEQUZVSz9cIiBAbnVtTGluZXMoKSwga3N0ciBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgICAgICAgICByaSA9IG1jWzFdLUBzY3JvbGwudG9wXG4gICAgICAgICAgICAgICAgY3Vyc29yTGluZSA9IEBzdGF0ZS5saW5lKG1jWzFdKVxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIG1haW4gY3Vyc29yIGxpbmU/JyBpZiBub3QgY3Vyc29yTGluZT9cbiAgICAgICAgICAgICAgICBpZiBtY1swXSA+IGN1cnNvckxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ3ZpcnR1YWwnXG4gICAgICAgICAgICAgICAgICAgIGNzLnB1c2ggW2N1cnNvckxpbmUubGVuZ3RoLCByaSwgJ21haW4gb2ZmJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ21haW4gb2ZmJ1xuXG4gICAgICAgIGVsc2UgaWYgQG51bUN1cnNvcnMoKSA+IDFcblxuICAgICAgICAgICAgdmMgPSBbXSAjIHZpcnR1YWwgY3Vyc29yc1xuICAgICAgICAgICAgZm9yIGMgaW4gY3NcbiAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgQG1haW5DdXJzb3IoKSwgW2NbMF0sIGNbMV0gKyBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICAgICAgY1syXSA9ICdtYWluJ1xuICAgICAgICAgICAgICAgIGxpbmUgPSBAbGluZShAc2Nyb2xsLnRvcCtjWzFdKVxuICAgICAgICAgICAgICAgIGlmIGNbMF0gPiBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB2Yy5wdXNoIFtsaW5lLmxlbmd0aCwgY1sxXSwgJ3ZpcnR1YWwnXVxuICAgICAgICAgICAgY3MgPSBjcy5jb25jYXQgdmNcblxuICAgICAgICBodG1sID0gcmVuZGVyLmN1cnNvcnMgY3MsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3QuY3Vyc29ycy5pbm5lckhUTUwgPSBodG1sXG4gICAgICAgIFxuICAgICAgICB0eSA9IChtY1sxXSAtIEBzY3JvbGwudG9wKSAqIEBzaXplLmxpbmVIZWlnaHRcbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJzb3JMaW5lXG4gICAgICAgICAgICBAY3Vyc29yTGluZS5zdHlsZSA9IFwiei1pbmRleDowO3RyYW5zZm9ybTp0cmFuc2xhdGUzZCgwLCN7dHl9cHgsMCk7IGhlaWdodDoje0BzaXplLmxpbmVIZWlnaHR9cHg7d2lkdGg6MTAwJTtcIlxuICAgICAgICAgICAgQGxheWVycy5pbnNlcnRCZWZvcmUgQGN1cnNvckxpbmUsIEBsYXllcnMuZmlyc3RDaGlsZFxuXG4gICAgcmVuZGVyU2VsZWN0aW9uOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIGlmIHMgPSBAc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICAgICAgaCArPSByZW5kZXIuc2VsZWN0aW9uIHMsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3Quc2VsZWN0aW9ucy5pbm5lckhUTUwgPSBoXG5cbiAgICByZW5kZXJIaWdobGlnaHRzOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIGlmIHMgPSBAaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICAgICAgaCArPSByZW5kZXIuc2VsZWN0aW9uIHMsIEBzaXplLCBcImhpZ2hsaWdodFwiXG4gICAgICAgIEBsYXllckRpY3QuaGlnaGxpZ2h0cy5pbm5lckhUTUwgPSBoXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGN1cnNvckRpdjogLT4gJCAnLmN1cnNvci5tYWluJyBAbGF5ZXJEaWN0WydjdXJzb3JzJ11cblxuICAgIHN1c3BlbmRCbGluazogLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBibGlua1RpbWVyXG4gICAgICAgIEBzdG9wQmxpbmsoKVxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQgQHN1c3BlbmRUaW1lclxuICAgICAgICBibGlua0RlbGF5ID0gcHJlZnMuZ2V0ICdjdXJzb3JCbGlua0RlbGF5JyBbODAwLDIwMF1cbiAgICAgICAgQHN1c3BlbmRUaW1lciA9IHNldFRpbWVvdXQgQHJlbGVhc2VCbGluaywgYmxpbmtEZWxheVswXVxuXG4gICAgcmVsZWFzZUJsaW5rOiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAc3VzcGVuZFRpbWVyXG4gICAgICAgIGRlbGV0ZSBAc3VzcGVuZFRpbWVyXG4gICAgICAgIEBzdGFydEJsaW5rKClcblxuICAgIHRvZ2dsZUJsaW5rOiAtPlxuXG4gICAgICAgIGJsaW5rID0gbm90IHByZWZzLmdldCAnYmxpbmsnIGZhbHNlXG4gICAgICAgIHByZWZzLnNldCAnYmxpbmsnIGJsaW5rXG4gICAgICAgIGlmIGJsaW5rXG4gICAgICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzdG9wQmxpbmsoKVxuXG4gICAgZG9CbGluazogPT5cblxuICAgICAgICBAYmxpbmsgPSBub3QgQGJsaW5rXG4gICAgICAgIFxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBAYmxpbmtcbiAgICAgICAgQG1pbmltYXA/LmRyYXdNYWluQ3Vyc29yIEBibGlua1xuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBibGlua1RpbWVyXG4gICAgICAgIGJsaW5rRGVsYXkgPSBwcmVmcy5nZXQgJ2N1cnNvckJsaW5rRGVsYXknIFs4MDAsMjAwXVxuICAgICAgICBAYmxpbmtUaW1lciA9IHNldFRpbWVvdXQgQGRvQmxpbmssIEBibGluayBhbmQgYmxpbmtEZWxheVsxXSBvciBibGlua0RlbGF5WzBdXG5cbiAgICBzdGFydEJsaW5rOiAtPiBcbiAgICBcbiAgICAgICAgaWYgbm90IEBibGlua1RpbWVyIGFuZCBwcmVmcy5nZXQgJ2JsaW5rJ1xuICAgICAgICAgICAgQGRvQmxpbmsoKSBcblxuICAgIHN0b3BCbGluazogLT5cblxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBibGlua1RpbWVyXG4gICAgICAgIGRlbGV0ZSBAYmxpbmtUaW1lclxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICByZXNpemVkOiAtPlxuXG4gICAgICAgIHZoID0gQHZpZXcucGFyZW50Tm9kZS5jbGllbnRIZWlnaHRcblxuICAgICAgICByZXR1cm4gaWYgdmggYW5kIHZoID09IEBzY3JvbGwudmlld0hlaWdodFxuXG4gICAgICAgIEBudW1iZXJzPy5lbGVtLnN0eWxlLmhlaWdodCA9IFwiI3tAc2Nyb2xsLmV4cG9zZU51bSAqIEBzY3JvbGwubGluZUhlaWdodH1weFwiXG4gICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuXG4gICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCB2aFxuXG4gICAgICAgIEBlbWl0ICd2aWV3SGVpZ2h0JyB2aFxuXG4gICAgc2NyZWVuU2l6ZTogLT4gZWxlY3Ryb24ucmVtb3RlLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpLndvcmtBcmVhU2l6ZVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBwb3NBdFhZOih4LHkpIC0+XG5cbiAgICAgICAgc2wgPSBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdFxuICAgICAgICBzdCA9IEBzY3JvbGwub2Zmc2V0VG9wXG4gICAgICAgIGJyID0gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgbHggPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldFdpZHRoLCAgeCAtIGJyLmxlZnQgLSBAc2l6ZS5vZmZzZXRYICsgQHNpemUuY2hhcldpZHRoLzNcbiAgICAgICAgbHkgPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldEhlaWdodCwgeSAtIGJyLnRvcFxuICAgICAgICBweCA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHNsICsgbHgpKS9Ac2l6ZS5jaGFyV2lkdGgpKVxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHN0ICsgbHkpKS9Ac2l6ZS5saW5lSGVpZ2h0KSkgKyBAc2Nyb2xsLnRvcFxuICAgICAgICBwICA9IFtweCwgTWF0aC5taW4oQG51bUxpbmVzKCktMSwgcHkpXVxuICAgICAgICBwXG5cbiAgICBwb3NGb3JFdmVudDogKGV2ZW50KSAtPiBAcG9zQXRYWSBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZXG5cbiAgICAjIGxpbmVFbGVtQXRYWTooeCx5KSAtPlxuXG4gICAgICAgICMgcCA9IEBwb3NBdFhZIHgseVxuICAgICAgICAjIEBsaW5lRGl2c1twWzFdXVxuXG4gICAgIyBsaW5lU3BhbkF0WFk6KHgseSkgLT5cbiMgICAgICAgICBcbiAgICAgICAgIyBpZiBsaW5lRWxlbSA9IEBsaW5lRWxlbUF0WFkgeCx5XG4gICAgICAgICAgICAjIGUgPSBsaW5lRWxlbS5maXJzdENoaWxkLmxhc3RDaGlsZFxuICAgICAgICAgICAgIyB3aGlsZSBlXG4gICAgICAgICAgICAgICAgIyBiciA9IGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgICAgICAjIGlmIGJyLmxlZnQgPD0geCA8PSBici5sZWZ0K2JyLndpZHRoXG4gICAgICAgICAgICAgICAgICAgICMgb2Zmc2V0ID0geC1ici5sZWZ0XG4gICAgICAgICAgICAgICAgICAgICMgcmV0dXJuIHNwYW46ZSwgb2Zmc2V0TGVmdDpvZmZzZXQsIG9mZnNldENoYXI6cGFyc2VJbnQob2Zmc2V0L0BzaXplLmNoYXJXaWR0aCksIHBvczpAcG9zQXRYWSB4LHkgXG4gICAgICAgICAgICAgICAgIyBlbHNlIGlmIHggPiBici5sZWZ0K2JyLndpZHRoXG4gICAgICAgICAgICAgICAgICAgICMgb2Zmc2V0ID0gYnIud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgIyByZXR1cm4gc3BhbjplLCBvZmZzZXRMZWZ0Om9mZnNldCwgb2Zmc2V0Q2hhcjpwYXJzZUludChvZmZzZXQvQHNpemUuY2hhcldpZHRoKSwgcG9zOkBwb3NBdFhZIHgseSBcbiAgICAgICAgICAgICAgICAjIGUgPSBlLnByZXZpb3VzU2libGluZ1xuICAgICAgICAjIG51bGxcblxuICAgIHNwYW5CZWZvcmVNYWluOiAtPlxuICAgICAgICBcbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG4gICAgICAgIHggPSBtY1swXVxuICAgICAgICBpZiBsaW5lRWxlbSA9IEBsaW5lRGl2c1ttY1sxXV1cbiAgICAgICAgICAgIGUgPSBsaW5lRWxlbS5maXJzdENoaWxkLmxhc3RDaGlsZFxuICAgICAgICAgICAgd2hpbGUgZVxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gZS5zdGFydFxuICAgICAgICAgICAgICAgIHJpZ2h0ID0gZS5zdGFydCtlLnRleHRDb250ZW50Lmxlbmd0aCBcbiAgICAgICAgICAgICAgICBpZiBzdGFydCA8PSB4IDw9IHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlXG4gICAgICAgICAgICAgICAgZWxzZSBpZiB4ID4gcmlnaHRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVcbiAgICAgICAgICAgICAgICBlID0gZS5wcmV2aW91c1NpYmxpbmdcbiAgICAgICAgbnVsbFxuICAgICAgICBcbiAgICBudW1GdWxsTGluZXM6IC0+IEBzY3JvbGwuZnVsbExpbmVzXG4gICAgXG4gICAgdmlld0hlaWdodDogLT4gXG4gICAgICAgIFxuICAgICAgICBpZiBAc2Nyb2xsPy52aWV3SGVpZ2h0ID49IDAgdGhlbiByZXR1cm4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgIEB2aWV3Py5jbGllbnRIZWlnaHRcblxuICAgIGZvY3VzOiAtPiBAdmlldy5mb2N1cygpXG5cbiAgICAjICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcblxuICAgIGluaXREcmFnOiAtPlxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBsYXllclNjcm9sbFxuXG4gICAgICAgICAgICBvblN0YXJ0OiAoZHJhZywgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHZpZXcuZm9jdXMoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBldmVudFBvcyA9IEBwb3NGb3JFdmVudCBldmVudFxuXG4gICAgICAgICAgICAgICAgaWYgZXZlbnQuYnV0dG9uID09IDJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdza2lwJ1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgZXZlbnQuYnV0dG9uID09IDFcbiAgICAgICAgICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnc2tpcCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudFxuICAgICAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgZXZlbnRQb3MsIEBjbGlja1Bvc1xuICAgICAgICAgICAgICAgICAgICAgICAgQHN0YXJ0Q2xpY2tUaW1lcigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2tDb3VudCArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudCA9PSAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgZXZlbnRQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5IG9yIEBzdGlja3lTZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZFJhbmdlVG9TZWxlY3Rpb24gcmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBoaWdobGlnaHRXb3JkQW5kQWRkVG9TZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIEBzZWxlY3RTaW5nbGVSYW5nZSByYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnQgPT0gM1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JMaW5lQXRJbmRleCBAY2xpY2tQb3NbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRSYW5nZVRvU2VsZWN0aW9uIHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzZWxlY3RTaW5nbGVSYW5nZSByXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQG9uQ2xpY2tUaW1lb3V0KClcblxuICAgICAgICAgICAgICAgIEBjbGlja0NvdW50ID0gMVxuICAgICAgICAgICAgICAgIEBjbGlja1BvcyA9IGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgQHN0YXJ0Q2xpY2tUaW1lcigpXG5cbiAgICAgICAgICAgICAgICBwID0gQHBvc0ZvckV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgQGNsaWNrQXRQb3MgcCwgZXZlbnRcblxuICAgICAgICAgICAgb25Nb3ZlOiAoZHJhZywgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgcCA9IEBwb3NGb3JFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgICAgICAgICAgQGFkZEN1cnNvckF0UG9zIFtAbWFpbkN1cnNvcigpWzBdLCBwWzFdXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHAsIGV4dGVuZDp0cnVlXG5cbiAgICAgICAgICAgIG9uU3RvcDogPT5cbiAgICAgICAgICAgICAgICBAc2VsZWN0Tm9uZSgpIGlmIEBudW1TZWxlY3Rpb25zKCkgYW5kIGVtcHR5IEB0ZXh0T2ZTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBzdGFydENsaWNrVGltZXI6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBjbGlja1RpbWVyXG4gICAgICAgIEBjbGlja1RpbWVyID0gc2V0VGltZW91dCBAb25DbGlja1RpbWVvdXQsIEBzdGlja3lTZWxlY3Rpb24gYW5kIDMwMCBvciAxMDAwXG5cbiAgICBvbkNsaWNrVGltZW91dDogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQGNsaWNrVGltZXJcbiAgICAgICAgQGNsaWNrQ291bnQgID0gMFxuICAgICAgICBAY2xpY2tUaW1lciAgPSBudWxsXG4gICAgICAgIEBjbGlja1BvcyAgICA9IG51bGxcblxuICAgIGZ1bmNJbmZvQXRMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZXMnIEBjdXJyZW50RmlsZVxuICAgICAgICBmaWxlSW5mbyA9IGZpbGVzW0BjdXJyZW50RmlsZV1cbiAgICAgICAgZm9yIGZ1bmMgaW4gZmlsZUluZm8uZnVuY3NcbiAgICAgICAgICAgIGlmIGZ1bmMubGluZSA8PSBsaSA8PSBmdW5jLmxhc3RcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5jbGFzcyArICcuJyArIGZ1bmMubmFtZSArICcgJ1xuICAgICAgICAnJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNsaWNrQXRQb3M6IChwLCBldmVudCkgLT5cblxuICAgICAgICBpZiBldmVudC5hbHRLZXlcbiAgICAgICAgICAgIEB0b2dnbGVDdXJzb3JBdFBvcyBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwLCBleHRlbmQ6ZXZlbnQuc2hpZnRLZXlcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdjdHJsK3onICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGRvLnVuZG8oKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtzaGlmdCt6JyAgICAgICAgIHRoZW4gcmV0dXJuIEBkby5yZWRvKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwreCcgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY3V0KClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrYycgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY29weSgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK3YnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQHBhc3RlKClcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpICAgICB0aGVuIHJldHVybiBAY2xlYXJIaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICBpZiBAbnVtQ3Vyc29ycygpID4gMSAgICB0aGVuIHJldHVybiBAY2xlYXJDdXJzb3JzKClcbiAgICAgICAgICAgICAgICBpZiBAc3RpY2t5U2VsZWN0aW9uICAgICB0aGVuIHJldHVybiBAZW5kU3RpY2t5U2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpICAgICB0aGVuIHJldHVybiBAc2VsZWN0Tm9uZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGFjdGlvbiBpbiBFZGl0b3IuYWN0aW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uY29tYm8gPT0gY29tYm8gb3IgYWN0aW9uLmFjY2VsID09IGNvbWJvXG4gICAgICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2N0cmwrYScgJ2NvbW1hbmQrYScgdGhlbiByZXR1cm4gQHNlbGVjdEFsbCgpXG4gICAgICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiBAW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uYWNjZWxzPyBhbmQgb3MucGxhdGZvcm0oKSAhPSAnZGFyd2luJ1xuICAgICAgICAgICAgICAgIGZvciBhY3Rpb25Db21ibyBpbiBhY3Rpb24uYWNjZWxzXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbWJvID09IGFjdGlvbkNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgYWN0aW9uLmNvbWJvcz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGFjdGlvbkNvbWJvIGluIGFjdGlvbi5jb21ib3NcbiAgICAgICAgICAgICAgICBpZiBjb21ibyA9PSBhY3Rpb25Db21ib1xuICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGNoYXIgYW5kIG1vZCBpbiBbXCJzaGlmdFwiIFwiXCJdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBAaW5zZXJ0Q2hhcmFjdGVyIGNoYXJcblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgb25LZXlEb3duOiAoZXZlbnQpID0+XG5cbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICByZXR1cm4gaWYgbm90IGNvbWJvXG4gICAgICAgIHJldHVybiBpZiBrZXkgPT0gJ3JpZ2h0IGNsaWNrJyAjIHdlaXJkIHJpZ2h0IGNvbW1hbmQga2V5XG5cbiAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IEB0ZXJtLmhhbmRsZUtleSBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcmVzdWx0ID0gQGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcblxuICAgICAgICBpZiAndW5oYW5kbGVkJyAhPSByZXN1bHRcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHRFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/texteditor.coffee