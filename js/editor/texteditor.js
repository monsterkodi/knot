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

    TextEditor.prototype.changed = function(changeInfo) {
        var ch, change, di, i, len, li, ref1, ref2;
        this.syntax.changed(changeInfo);
        ref1 = changeInfo.changes;
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            ref2 = [change.doIndex, change.newIndex, change.change], di = ref2[0], li = ref2[1], ch = ref2[2];
            switch (ch) {
                case 'changed':
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

    TextEditor.prototype.lineElemAtXY = function(x, y) {
        var p;
        p = this.posAtXY(x, y);
        return this.lineDivs[p[1]];
    };

    TextEditor.prototype.lineSpanAtXY = function(x, y) {
        var br, e, lineElem, offset;
        if (lineElem = this.lineElemAtXY(x, y)) {
            e = lineElem.firstChild.lastChild;
            while (e) {
                br = e.getBoundingClientRect();
                if ((br.left <= x && x <= br.left + br.width)) {
                    offset = x - br.left;
                    return {
                        span: e,
                        offsetLeft: offset,
                        offsetChar: parseInt(offset / this.size.charWidth),
                        pos: this.posAtXY(x, y)
                    };
                } else if (x > br.left + br.width) {
                    offset = br.width;
                    return {
                        span: e,
                        offsetLeft: offset,
                        offsetChar: parseInt(offset / this.size.charWidth),
                        pos: this.posAtXY(x, y)
                    };
                }
                e = e.previousSibling;
            }
        }
        return null;
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
                klog('start', start, right);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0pBQUE7SUFBQTs7Ozs7QUFRQSxNQUE4RixPQUFBLENBQVEsS0FBUixDQUE5RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixxQkFBbkIsRUFBNEIsbUJBQTVCLEVBQW9DLGlCQUFwQyxFQUEyQyxpQkFBM0MsRUFBa0QsaUJBQWxELEVBQXlELGVBQXpELEVBQStELGVBQS9ELEVBQXFFLGVBQXJFLEVBQTJFLGVBQTNFLEVBQWlGLFdBQWpGLEVBQXFGLFNBQXJGLEVBQXdGOztBQUV4RixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7QUFDZixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUVUOzs7SUFFQyxvQkFBQyxJQUFELEVBQVEsTUFBUjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7Ozs7OztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxRQUFOO1lBQWUsUUFBQSxFQUFTLEdBQXhCO1NBQUw7UUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFWLENBQXNCLElBQUMsQ0FBQSxJQUF2QjtRQUVBLDRDQUFNLFFBQU4sRUFBZSxNQUFmO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxNQUFELEdBQWUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDZixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtZQUFxQixLQUFBLEVBQU0sSUFBQyxDQUFBLE1BQTVCO1NB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QUE1QixFQUFpQyxHQUFqQyxFQUFzQyxLQUF0QyxFQUE2QyxJQUE3QyxFQUFtRCxLQUFuRDtRQUVULElBQUcsV0FBQSxLQUFlLE1BQWxCO21CQUNJLFNBQUEsQ0FBVSxLQUFWLEVBREo7O0lBWE87Ozs7R0EzekJVOztBQXkwQnpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBzdG9wRXZlbnQsIGtleWluZm8sIGtlcnJvciwgcHJlZnMsIGNsYW1wLCBlbXB0eSwgZWxlbSwga3N0ciwga2xvZywgZHJhZywgb3MsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcbiAgXG5yZW5kZXIgICAgICAgPSByZXF1aXJlICcuL3JlbmRlcidcbkVkaXRvclNjcm9sbCA9IHJlcXVpcmUgJy4vZWRpdG9yc2Nyb2xsJ1xuRWRpdG9yICAgICAgID0gcmVxdWlyZSAnLi9lZGl0b3InXG5lbGVjdHJvbiAgICAgPSByZXF1aXJlICdlbGVjdHJvbidcblxuY2xhc3MgVGV4dEVkaXRvciBleHRlbmRzIEVkaXRvclxuXG4gICAgQDogKEB0ZXJtLCBjb25maWcpIC0+XG5cbiAgICAgICAgQHZpZXcgPSBlbGVtIGNsYXNzOidlZGl0b3InIHRhYmluZGV4OicwJ1xuICAgICAgICBAdGVybS5kaXYuYXBwZW5kQ2hpbGQgQHZpZXdcblxuICAgICAgICBzdXBlciAnZWRpdG9yJyBjb25maWdcblxuICAgICAgICBAY2xpY2tDb3VudCAgPSAwXG5cbiAgICAgICAgQGxheWVycyAgICAgID0gZWxlbSBjbGFzczogJ2xheWVycydcbiAgICAgICAgQGxheWVyU2Nyb2xsID0gZWxlbSBjbGFzczogJ2xheWVyU2Nyb2xsJyBjaGlsZDpAbGF5ZXJzXG4gICAgICAgIEB2aWV3LmFwcGVuZENoaWxkIEBsYXllclNjcm9sbFxuXG4gICAgICAgIGxheWVyID0gW11cbiAgICAgICAgbGF5ZXIucHVzaCAnc2VsZWN0aW9ucydcbiAgICAgICAgbGF5ZXIucHVzaCAnaGlnaGxpZ2h0cydcbiAgICAgICAgbGF5ZXIucHVzaCAnbWV0YScgICAgaWYgJ01ldGEnIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgbGF5ZXIucHVzaCAnbGluZXMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2N1cnNvcnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ251bWJlcnMnIGlmICdOdW1iZXJzJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIEBpbml0TGF5ZXJzIGxheWVyXG5cbiAgICAgICAgQHNpemUgPSB7fVxuICAgICAgICBAZWxlbSA9IEBsYXllckRpY3QubGluZXNcblxuICAgICAgICBAYW5zaUxpbmVzID0gW10gIyBvcmlnaW5hbCBhbnNpIGNvZGUgc3RyaW5nc1xuICAgICAgICBAc3BhbkNhY2hlID0gW10gIyBjYWNoZSBmb3IgcmVuZGVyZWQgbGluZSBzcGFuc1xuICAgICAgICBAbGluZURpdnMgID0ge30gIyBtYXBzIGxpbmUgbnVtYmVycyB0byBkaXNwbGF5ZWQgZGl2c1xuXG4gICAgICAgIEBzZXRGb250U2l6ZSBwcmVmcy5nZXQgXCJmb250U2l6ZVwiIEBjb25maWcuZm9udFNpemUgPyAxOFxuICAgICAgICBAc2Nyb2xsID0gbmV3IEVkaXRvclNjcm9sbCBAXG4gICAgICAgIEBzY3JvbGwub24gJ3NoaWZ0TGluZXMnIEBzaGlmdExpbmVzXG4gICAgICAgIEBzY3JvbGwub24gJ3Nob3dMaW5lcycgIEBzaG93TGluZXNcblxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdibHVyJyAgICAgQG9uQmx1clxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgQG9uRm9jdXNcbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgIEBvbktleURvd25cblxuICAgICAgICBAaW5pdERyYWcoKVxuXG4gICAgICAgIGZvciBmZWF0dXJlIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgICAgIGlmIGZlYXR1cmUgPT0gJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICAgICAgQGN1cnNvckxpbmUgPSBlbGVtICdkaXYnIGNsYXNzOidjdXJzb3ItbGluZSdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmZWF0dXJlTmFtZSA9IGZlYXR1cmUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIGZlYXR1cmVDbHNzID0gcmVxdWlyZSBcIi4vI3tmZWF0dXJlTmFtZX1cIlxuICAgICAgICAgICAgICAgIEBbZmVhdHVyZU5hbWVdID0gbmV3IGZlYXR1cmVDbHNzIEBcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBkZWw6IC0+XG5cbiAgICAgICAgcG9zdC5yZW1vdmVMaXN0ZW5lciAnc2NoZW1lQ2hhbmdlZCcgQG9uU2NoZW1lQ2hhbmdlZFxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbGJhcj8uZGVsKClcblxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdrZXlkb3duJyBAb25LZXlEb3duXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2JsdXInICAgIEBvbkJsdXJcbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgQG9uRm9jdXNcbiAgICAgICAgQHZpZXcuaW5uZXJIVE1MID0gJydcblxuICAgICAgICBzdXBlcigpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBpc0lucHV0Q3Vyc29yOiAtPlxuICAgICAgICBcbiAgICAgICAgQG1haW5DdXJzb3IoKVsxXSA+PSBAbnVtTGluZXMoKS0xXG4gICAgICAgIFxuICAgIHJlc3RvcmVJbnB1dEN1cnNvcjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBpc0lucHV0Q3Vyc29yKClcbiAgICAgICAgICAgIEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sID0gQGlucHV0Q3Vyc29yID8gQGRvLmxpbmUoQG51bUxpbmVzKCktMSkubGVuZ3RoXG4gICAgICAgICAgICBbW2NvbCxAbnVtTGluZXMoKS0xXV1cbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgb25Gb2N1czogPT5cblxuICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIEBlbWl0ICdmb2N1cycgQFxuICAgICAgICBwb3N0LmVtaXQgJ2VkaXRvckZvY3VzJyBAXG5cbiAgICBvbkJsdXI6ID0+XG5cbiAgICAgICAgQHN0b3BCbGluaygpXG4gICAgICAgIEBlbWl0ICdibHVyJyBAXG5cbiAgICBvblNjaGVtZUNoYW5nZWQ6ID0+XG5cbiAgICAgICAgQHN5bnRheD8uc2NoZW1lQ2hhbmdlZCgpXG4gICAgICAgIGlmIEBtaW5pbWFwXG4gICAgICAgICAgICB1cGRhdGVNaW5pbWFwID0gPT4gQG1pbmltYXA/LmRyYXdMaW5lcygpXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHVwZGF0ZU1pbmltYXAsIDEwXG5cbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRMYXllcnM6IChsYXllckNsYXNzZXMpIC0+XG5cbiAgICAgICAgQGxheWVyRGljdCA9IHt9XG4gICAgICAgIGZvciBjbHMgaW4gbGF5ZXJDbGFzc2VzXG4gICAgICAgICAgICBAbGF5ZXJEaWN0W2Nsc10gPSBAYWRkTGF5ZXIgY2xzXG5cbiAgICBhZGRMYXllcjogKGNscykgLT5cblxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBjbHNcbiAgICAgICAgQGxheWVycy5hcHBlbmRDaGlsZCBkaXZcbiAgICAgICAgZGl2XG5cbiAgICB1cGRhdGVMYXllcnM6ICgpIC0+XG5cbiAgICAgICAgQHJlbmRlckhpZ2hsaWdodHMoKVxuICAgICAgICBAcmVuZGVyU2VsZWN0aW9uKClcbiAgICAgICAgQHJlbmRlckN1cnNvcnMoKVxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNsZWFyOiA9PiBAc2V0TGluZXMgWycnXVxuICAgIFxuICAgIHNldExpbmVzOiAobGluZXMpIC0+XG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGVtaXQgJ2NsZWFyTGluZXMnXG5cbiAgICAgICAgbGluZXMgPz0gW11cblxuICAgICAgICBAc3BhbkNhY2hlID0gW11cbiAgICAgICAgQGxpbmVEaXZzICA9IHt9XG4gICAgICAgIEBhbnNpTGluZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC5yZXNldCgpXG5cbiAgICAgICAgc3VwZXIgbGluZXNcblxuICAgICAgICB2aWV3SGVpZ2h0ID0gQHZpZXdIZWlnaHQoKVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC5zdGFydCB2aWV3SGVpZ2h0LCBAbnVtTGluZXMoKVxuXG4gICAgICAgIEBsYXllclNjcm9sbC5zY3JvbGxMZWZ0ID0gMFxuICAgICAgICBAbGF5ZXJzV2lkdGggID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG4gICAgICAgIEBsYXllcnNIZWlnaHQgPSBAbGF5ZXJTY3JvbGwub2Zmc2V0SGVpZ2h0XG5cbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG4gICAgICAgXG4gICAgc2V0SW5wdXRUZXh0OiAodGV4dCkgLT5cbiAgICAgICAgXG4gICAgICAgIHRleHQgPSB0ZXh0LnNwbGl0KCdcXG4nKVswXVxuICAgICAgICB0ZXh0ID89ICcnXG4gICAgICAgIFxuICAgICAgICBsaSA9IEBudW1MaW5lcygpLTFcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRlbGV0ZUN1cnNvckxpbmVzKClcbiAgICAgICAgQGRvLmNoYW5nZSBsaSwgdGV4dFxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbW3RleHQubGVuZ3RoLCBsaV1dXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICByZXBsYWNlVGV4dEluTGluZTogKGxpLCB0ZXh0PScnKSAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLmNoYW5nZSBsaSwgdGV4dFxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhcHBlbmRUZXh0OiAodGV4dCkgLT5cblxuICAgICAgICBpZiBub3QgdGV4dD9cbiAgICAgICAgICAgIGxvZyBcIiN7QG5hbWV9LmFwcGVuZFRleHQgLSBubyB0ZXh0P1wiXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBhcHBlbmRlZCA9IFtdXG4gICAgICAgIGxzID0gdGV4dD8uc3BsaXQgL1xcbi9cblxuICAgICAgICBmb3IgbCBpbiBsc1xuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLmFwcGVuZExpbmUgbFxuICAgICAgICAgICAgYXBwZW5kZWQucHVzaCBAbnVtTGluZXMoKS0xXG5cbiAgICAgICAgaWYgQHNjcm9sbC52aWV3SGVpZ2h0ICE9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCBAdmlld0hlaWdodCgpXG5cbiAgICAgICAgc2hvd0xpbmVzID0gKEBzY3JvbGwuYm90IDwgQHNjcm9sbC50b3ApIG9yIChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudmlld0xpbmVzKVxuXG4gICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQG51bUxpbmVzKCksIHNob3dMaW5lczpzaG93TGluZXNcblxuICAgICAgICBmb3IgbGkgaW4gYXBwZW5kZWRcbiAgICAgICAgICAgIEBlbWl0ICdsaW5lQXBwZW5kZWQnLCAjIG1ldGFcbiAgICAgICAgICAgICAgICBsaW5lSW5kZXg6IGxpXG4gICAgICAgICAgICAgICAgdGV4dDogQGxpbmUgbGlcblxuICAgICAgICBAZW1pdCAnbGluZXNBcHBlbmRlZCcgbHMgIyBhdXRvY29tcGxldGVcbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJyBAbnVtTGluZXMoKSAjIG1pbmltYXBcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGFwcGVuZE91dHB1dDogKHRleHQpIC0+XG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIGxzID0gdGV4dD8uc3BsaXQgL1xcbi9cblxuICAgICAgICBmb3IgbCBpbiBsc1xuICAgICAgICAgICAgc3RyaXBwZWQgPSBrc3RyLnN0cmlwQW5zaSBsXG4gICAgICAgICAgICBpZiBsICE9IHN0cmlwcGVkIFxuICAgICAgICAgICAgICAgIEBhbnNpTGluZXNbQGRvLm51bUxpbmVzKCktMV0gPSBsXG4gICAgICAgICAgICBAZG8uaW5zZXJ0IEBkby5udW1MaW5lcygpLTEsIHN0cmlwcGVkXG4gICAgICAgICAgICBcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgICAgICBAc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzZXRGb250U2l6ZTogKGZvbnRTaXplKSA9PlxuICAgICAgICBcbiAgICAgICAgQGxheWVycy5zdHlsZS5mb250U2l6ZSA9IFwiI3tmb250U2l6ZX1weFwiXG4gICAgICAgIEBzaXplLm51bWJlcnNXaWR0aCA9ICdOdW1iZXJzJyBpbiBAY29uZmlnLmZlYXR1cmVzIGFuZCAzNiBvciAwXG4gICAgICAgIEBzaXplLmZvbnRTaXplICAgICA9IGZvbnRTaXplXG4gICAgICAgIEBzaXplLmxpbmVIZWlnaHQgICA9IGZvbnRTaXplICogMS4yNSAjIGtlZXAgaW4gc3luYyB3aXRoIHN0eWxlIGxpbmUtaGVpZ2h0c1xuICAgICAgICBAc2l6ZS5jaGFyV2lkdGggICAgPSBmb250U2l6ZSAqIDAuNlxuICAgICAgICBAc2l6ZS5vZmZzZXRYICAgICAgPSBNYXRoLmZsb29yIEBzaXplLmNoYXJXaWR0aCArIEBzaXplLm51bWJlcnNXaWR0aFxuXG4gICAgICAgIEBzY3JvbGw/LnNldExpbmVIZWlnaHQgQHNpemUubGluZUhlaWdodFxuICAgICAgICBpZiBAdGV4dCgpXG4gICAgICAgICAgICBhbnNpID0gQGFuc2lUZXh0KClcbiAgICAgICAgICAgIG1ldGFzID0gQG1ldGEubWV0YXNcbiAgICAgICAgICAgIEB0ZXJtLmNsZWFyKClcbiAgICAgICAgICAgIEBhcHBlbmRPdXRwdXQgYW5zaVxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gbWV0YXNcbiAgICAgICAgICAgICAgICBtZXRhWzJdLmxpbmUgPSBtZXRhWzBdXG4gICAgICAgICAgICAgICAgQG1ldGEuYWRkIG1ldGFbMl1cblxuICAgICAgICBAZW1pdCAnZm9udFNpemVDaGFuZ2VkJ1xuXG4gICAgYW5zaVRleHQ6IC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gJydcbiAgICAgICAgZm9yIGxpIGluIFswLi4uQG51bUxpbmVzKCktMV1cbiAgICAgICAgICAgIHRleHQgKz0gQGFuc2lMaW5lc1tsaV0gPyBAc3RhdGUubGluZSBsaVxuICAgICAgICAgICAgdGV4dCArPSAnXFxuJ1xuICAgICAgICB0ZXh0Wy4udGV4dC5sZW5ndGgtMl1cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIEBzeW50YXguY2hhbmdlZCBjaGFuZ2VJbmZvXG5cbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIFtkaSxsaSxjaF0gPSBbY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5uZXdJbmRleCwgY2hhbmdlLmNoYW5nZV1cbiAgICAgICAgICAgIHN3aXRjaCBjaFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2NoYW5nZWQnXG4gICAgICAgICAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpLCBkaVxuICAgICAgICAgICAgICAgICAgICBAZW1pdCAnbGluZUNoYW5nZWQnIGxpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBhbnNpTGluZXMuc3BsaWNlIGRpLCAxXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lRGVsZXRlZCcgZGlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnaW5zZXJ0ZWQnXG4gICAgICAgICAgICAgICAgICAgIEBzcGFuQ2FjaGUgPSBAc3BhbkNhY2hlLnNsaWNlIDAsIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lSW5zZXJ0ZWQnIGxpLCBkaVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uaW5zZXJ0cyBvciBjaGFuZ2VJbmZvLmRlbGV0ZXNcbiAgICAgICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuICAgICAgICAgICAgQHNjcm9sbC5zZXROdW1MaW5lcyBAbnVtTGluZXMoKVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY2hhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgIEBjbGVhckhpZ2hsaWdodHMoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY3Vyc29yc1xuICAgICAgICAgICAgQHJlbmRlckN1cnNvcnMoKVxuICAgICAgICAgICAgQHNjcm9sbC5jdXJzb3JJbnRvVmlldygpXG4gICAgICAgICAgICBAZW1pdCAnY3Vyc29yJ1xuICAgICAgICAgICAgQHN1c3BlbmRCbGluaygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5zZWxlY3RzXG4gICAgICAgICAgICBAcmVuZGVyU2VsZWN0aW9uKClcbiAgICAgICAgICAgIEBlbWl0ICdzZWxlY3Rpb24nXG5cbiAgICAgICAgQGVtaXQgJ2NoYW5nZWQnIGNoYW5nZUluZm9cblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgdXBkYXRlTGluZTogKGxpLCBvaSkgLT5cblxuICAgICAgICBvaSA9IGxpIGlmIG5vdCBvaT9cblxuICAgICAgICBpZiBsaSA8IEBzY3JvbGwudG9wIG9yIGxpID4gQHNjcm9sbC5ib3RcbiAgICAgICAgICAgIGtlcnJvciBcImRhbmdsaW5nIGxpbmUgZGl2PyAje2xpfVwiIEBsaW5lRGl2c1tsaV0gaWYgQGxpbmVEaXZzW2xpXT9cbiAgICAgICAgICAgIGRlbGV0ZSBAc3BhbkNhY2hlW2xpXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtlcnJvciBcInVwZGF0ZUxpbmUgLSBvdXQgb2YgYm91bmRzPyBsaSAje2xpfSBvaSAje29pfVwiIGlmIG5vdCBAbGluZURpdnNbb2ldXG4gICAgICAgIFxuICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IEByZW5kZXJTcGFuIGxpXG5cbiAgICAgICAgZGl2ID0gQGxpbmVEaXZzW29pXVxuICAgICAgICBkaXYucmVwbGFjZUNoaWxkIEBzcGFuQ2FjaGVbbGldLCBkaXYuZmlyc3RDaGlsZFxuICAgICAgICBcbiAgICByZWZyZXNoTGluZXM6ICh0b3AsIGJvdCkgLT5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIEBzeW50YXguZ2V0RGlzcyBsaSwgdHJ1ZVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hvd0xpbmVzOiAodG9wLCBib3QsIG51bSkgPT5cblxuICAgICAgICBAbGluZURpdnMgPSB7fVxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSAnJ1xuXG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBAYXBwZW5kTGluZSBsaVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG4gICAgICAgIEBlbWl0ICdsaW5lc0V4cG9zZWQnIHRvcDp0b3AsIGJvdDpib3QsIG51bTpudW1cbiAgICAgICAgQGVtaXQgJ2xpbmVzU2hvd24nIHRvcCwgYm90LCBudW1cblxuICAgIGFwcGVuZExpbmU6IChsaSkgLT5cblxuICAgICAgICBAbGluZURpdnNbbGldID0gZWxlbSBjbGFzczonbGluZSdcbiAgICAgICAgQGxpbmVEaXZzW2xpXS5hcHBlbmRDaGlsZCBAY2FjaGVkU3BhbiBsaVxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAbGluZURpdnNbbGldXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgc2hpZnRMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG4gICAgICAgIFxuICAgICAgICBvbGRUb3AgPSB0b3AgLSBudW1cbiAgICAgICAgb2xkQm90ID0gYm90IC0gbnVtXG5cbiAgICAgICAgZGl2SW50byA9IChsaSxsbykgPT5cblxuICAgICAgICAgICAgaWYgbm90IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgICAgICBrZXJyb3IgXCIje0BuYW1lfS5zaGlmdExpbmVzLmRpdkludG8gLSBubyBkaXY/ICN7dG9wfSAje2JvdH0gI3tudW19IG9sZCAje29sZFRvcH0gI3tvbGRCb3R9IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgQGxpbmVEaXZzW2xpXSA9IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIGRlbGV0ZSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBAbGluZURpdnNbbGldLnJlcGxhY2VDaGlsZCBAY2FjaGVkU3BhbihsaSksIEBsaW5lRGl2c1tsaV0uZmlyc3RDaGlsZFxuXG4gICAgICAgICAgICBpZiBAc2hvd0ludmlzaWJsZXNcbiAgICAgICAgICAgICAgICB0eCA9IEBsaW5lKGxpKS5sZW5ndGggKiBAc2l6ZS5jaGFyV2lkdGggKyAxXG4gICAgICAgICAgICAgICAgc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOlwiaW52aXNpYmxlIG5ld2xpbmVcIiBodG1sOicmIzk2ODcnXG4gICAgICAgICAgICAgICAgc3Bhbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZSgje3R4fXB4LCAtMS41cHgpXCJcbiAgICAgICAgICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIHNwYW5cblxuICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICB3aGlsZSBvbGRCb3QgPCBib3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgKz0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkQm90LCBvbGRUb3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgKz0gMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aGlsZSBvbGRUb3AgPiB0b3BcbiAgICAgICAgICAgICAgICBvbGRUb3AgLT0gMVxuICAgICAgICAgICAgICAgIGRpdkludG8gb2xkVG9wLCBvbGRCb3RcbiAgICAgICAgICAgICAgICBvbGRCb3QgLT0gMVxuXG4gICAgICAgIEBlbWl0ICdsaW5lc1NoaWZ0ZWQnIHRvcCwgYm90LCBudW1cblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZUxpbmVQb3NpdGlvbnM6IChhbmltYXRlPTApIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgbGksIGRpdiBvZiBAbGluZURpdnNcbiAgICAgICAgICAgIGlmIG5vdCBkaXY/IG9yIG5vdCBkaXYuc3R5bGU/XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gZGl2PyBzdHlsZT8nIGRpdj8sIGRpdj8uc3R5bGU/XG4gICAgICAgICAgICB5ID0gQHNpemUubGluZUhlaWdodCAqIChsaSAtIEBzY3JvbGwudG9wKVxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlM2QoI3tAc2l6ZS5vZmZzZXRYfXB4LCN7eX1weCwgMClcIlxuICAgICAgICAgICAgZGl2LnN0eWxlLnRyYW5zaXRpb24gPSBcImFsbCAje2FuaW1hdGUvMTAwMH1zXCIgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgZGl2LnN0eWxlLnpJbmRleCA9IGxpXG5cbiAgICAgICAgaWYgYW5pbWF0ZVxuICAgICAgICAgICAgcmVzZXRUcmFucyA9ID0+XG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQGVsZW0uY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2l0aW9uID0gJ2luaXRpYWwnXG4gICAgICAgICAgICBzZXRUaW1lb3V0IHJlc2V0VHJhbnMsIGFuaW1hdGVcblxuICAgIHVwZGF0ZUxpbmVzOiAoKSAtPlxuXG4gICAgICAgIGZvciBsaSBpbiBbQHNjcm9sbC50b3AuLkBzY3JvbGwuYm90XVxuICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGlcblxuICAgIGNsZWFySGlnaGxpZ2h0czogKCkgLT5cblxuICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAkKCcuaGlnaGxpZ2h0cycgQGxheWVycykuaW5uZXJIVE1MID0gJydcbiAgICAgICAgICAgIHN1cGVyKClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICByZW5kZXJTcGFuOiAobGkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAYW5zaUxpbmVzW2xpXT8ubGVuZ3RoXG4gICAgICAgICAgICBhbnNpID0gbmV3IGtzdHIuYW5zaVxuICAgICAgICAgICAgZGlzcyA9IGFuc2kuZGlzc2VjdChAYW5zaUxpbmVzW2xpXSlbMV1cbiAgICAgICAgICAgIHNwYW4gPSByZW5kZXIubGluZVNwYW4gZGlzcywgQHNpemVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3BhbiA9IHJlbmRlci5saW5lU3BhbiBAc3ludGF4LmdldERpc3MobGkpLCBAc2l6ZVxuICAgIFxuICAgIGNhY2hlZFNwYW46IChsaSkgLT5cblxuICAgICAgICBpZiBub3QgQHNwYW5DYWNoZVtsaV1cblxuICAgICAgICAgICAgQHNwYW5DYWNoZVtsaV0gPSBAcmVuZGVyU3BhbiBsaVxuXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldXG5cbiAgICByZW5kZXJDdXJzb3JzOiAtPlxuXG4gICAgICAgIGNzID0gW11cbiAgICAgICAgZm9yIGMgaW4gQGN1cnNvcnMoKVxuICAgICAgICAgICAgaWYgY1sxXSA+PSBAc2Nyb2xsLnRvcCBhbmQgY1sxXSA8PSBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAgICAgIGNzLnB1c2ggW2NbMF0sIGNbMV0gLSBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA9PSAxXG5cbiAgICAgICAgICAgIGlmIGNzLmxlbmd0aCA9PSAxXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgbWNbMV0gPCAwXG5cbiAgICAgICAgICAgICAgICBpZiBtY1sxXSA+IEBudW1MaW5lcygpLTFcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIiN7QG5hbWV9LnJlbmRlckN1cnNvcnMgbWFpbkN1cnNvciBEQUZVSz9cIiBAbnVtTGluZXMoKSwga3N0ciBAbWFpbkN1cnNvcigpXG5cbiAgICAgICAgICAgICAgICByaSA9IG1jWzFdLUBzY3JvbGwudG9wXG4gICAgICAgICAgICAgICAgY3Vyc29yTGluZSA9IEBzdGF0ZS5saW5lKG1jWzFdKVxuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIG1haW4gY3Vyc29yIGxpbmU/JyBpZiBub3QgY3Vyc29yTGluZT9cbiAgICAgICAgICAgICAgICBpZiBtY1swXSA+IGN1cnNvckxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ3ZpcnR1YWwnXG4gICAgICAgICAgICAgICAgICAgIGNzLnB1c2ggW2N1cnNvckxpbmUubGVuZ3RoLCByaSwgJ21haW4gb2ZmJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNzWzBdWzJdID0gJ21haW4gb2ZmJ1xuXG4gICAgICAgIGVsc2UgaWYgQG51bUN1cnNvcnMoKSA+IDFcblxuICAgICAgICAgICAgdmMgPSBbXSAjIHZpcnR1YWwgY3Vyc29yc1xuICAgICAgICAgICAgZm9yIGMgaW4gY3NcbiAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgQG1haW5DdXJzb3IoKSwgW2NbMF0sIGNbMV0gKyBAc2Nyb2xsLnRvcF1cbiAgICAgICAgICAgICAgICAgICAgY1syXSA9ICdtYWluJ1xuICAgICAgICAgICAgICAgIGxpbmUgPSBAbGluZShAc2Nyb2xsLnRvcCtjWzFdKVxuICAgICAgICAgICAgICAgIGlmIGNbMF0gPiBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB2Yy5wdXNoIFtsaW5lLmxlbmd0aCwgY1sxXSwgJ3ZpcnR1YWwnXVxuICAgICAgICAgICAgY3MgPSBjcy5jb25jYXQgdmNcblxuICAgICAgICBodG1sID0gcmVuZGVyLmN1cnNvcnMgY3MsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3QuY3Vyc29ycy5pbm5lckhUTUwgPSBodG1sXG4gICAgICAgIFxuICAgICAgICB0eSA9IChtY1sxXSAtIEBzY3JvbGwudG9wKSAqIEBzaXplLmxpbmVIZWlnaHRcbiAgICAgICAgXG4gICAgICAgIGlmIEBjdXJzb3JMaW5lXG4gICAgICAgICAgICBAY3Vyc29yTGluZS5zdHlsZSA9IFwiei1pbmRleDowO3RyYW5zZm9ybTp0cmFuc2xhdGUzZCgwLCN7dHl9cHgsMCk7IGhlaWdodDoje0BzaXplLmxpbmVIZWlnaHR9cHg7d2lkdGg6MTAwJTtcIlxuICAgICAgICAgICAgQGxheWVycy5pbnNlcnRCZWZvcmUgQGN1cnNvckxpbmUsIEBsYXllcnMuZmlyc3RDaGlsZFxuXG4gICAgcmVuZGVyU2VsZWN0aW9uOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIGlmIHMgPSBAc2VsZWN0aW9uc0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICAgICAgaCArPSByZW5kZXIuc2VsZWN0aW9uIHMsIEBzaXplXG4gICAgICAgIEBsYXllckRpY3Quc2VsZWN0aW9ucy5pbm5lckhUTUwgPSBoXG5cbiAgICByZW5kZXJIaWdobGlnaHRzOiAtPlxuXG4gICAgICAgIGggPSBcIlwiXG4gICAgICAgIGlmIHMgPSBAaGlnaGxpZ2h0c0luTGluZUluZGV4UmFuZ2VSZWxhdGl2ZVRvTGluZUluZGV4IFtAc2Nyb2xsLnRvcCwgQHNjcm9sbC5ib3RdLCBAc2Nyb2xsLnRvcFxuICAgICAgICAgICAgaCArPSByZW5kZXIuc2VsZWN0aW9uIHMsIEBzaXplLCBcImhpZ2hsaWdodFwiXG4gICAgICAgIEBsYXllckRpY3QuaGlnaGxpZ2h0cy5pbm5lckhUTUwgPSBoXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGN1cnNvckRpdjogLT4gJCAnLmN1cnNvci5tYWluJyBAbGF5ZXJEaWN0WydjdXJzb3JzJ11cblxuICAgIHN1c3BlbmRCbGluazogLT5cblxuICAgICAgICByZXR1cm4gaWYgbm90IEBibGlua1RpbWVyXG4gICAgICAgIEBzdG9wQmxpbmsoKVxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBjbGVhclRpbWVvdXQgQHN1c3BlbmRUaW1lclxuICAgICAgICBibGlua0RlbGF5ID0gcHJlZnMuZ2V0ICdjdXJzb3JCbGlua0RlbGF5JyBbODAwLDIwMF1cbiAgICAgICAgQHN1c3BlbmRUaW1lciA9IHNldFRpbWVvdXQgQHJlbGVhc2VCbGluaywgYmxpbmtEZWxheVswXVxuXG4gICAgcmVsZWFzZUJsaW5rOiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAc3VzcGVuZFRpbWVyXG4gICAgICAgIGRlbGV0ZSBAc3VzcGVuZFRpbWVyXG4gICAgICAgIEBzdGFydEJsaW5rKClcblxuICAgIHRvZ2dsZUJsaW5rOiAtPlxuXG4gICAgICAgIGJsaW5rID0gbm90IHByZWZzLmdldCAnYmxpbmsnIGZhbHNlXG4gICAgICAgIHByZWZzLnNldCAnYmxpbmsnIGJsaW5rXG4gICAgICAgIGlmIGJsaW5rXG4gICAgICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzdG9wQmxpbmsoKVxuXG4gICAgZG9CbGluazogPT5cblxuICAgICAgICBAYmxpbmsgPSBub3QgQGJsaW5rXG4gICAgICAgIFxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBAYmxpbmtcbiAgICAgICAgQG1pbmltYXA/LmRyYXdNYWluQ3Vyc29yIEBibGlua1xuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBibGlua1RpbWVyXG4gICAgICAgIGJsaW5rRGVsYXkgPSBwcmVmcy5nZXQgJ2N1cnNvckJsaW5rRGVsYXknIFs4MDAsMjAwXVxuICAgICAgICBAYmxpbmtUaW1lciA9IHNldFRpbWVvdXQgQGRvQmxpbmssIEBibGluayBhbmQgYmxpbmtEZWxheVsxXSBvciBibGlua0RlbGF5WzBdXG5cbiAgICBzdGFydEJsaW5rOiAtPiBcbiAgICBcbiAgICAgICAgaWYgbm90IEBibGlua1RpbWVyIGFuZCBwcmVmcy5nZXQgJ2JsaW5rJ1xuICAgICAgICAgICAgQGRvQmxpbmsoKSBcblxuICAgIHN0b3BCbGluazogLT5cblxuICAgICAgICBAY3Vyc29yRGl2KCk/LmNsYXNzTGlzdC50b2dnbGUgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBibGlua1RpbWVyXG4gICAgICAgIGRlbGV0ZSBAYmxpbmtUaW1lclxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICByZXNpemVkOiAtPlxuXG4gICAgICAgIHZoID0gQHZpZXcucGFyZW50Tm9kZS5jbGllbnRIZWlnaHRcblxuICAgICAgICByZXR1cm4gaWYgdmggYW5kIHZoID09IEBzY3JvbGwudmlld0hlaWdodFxuXG4gICAgICAgIEBudW1iZXJzPy5lbGVtLnN0eWxlLmhlaWdodCA9IFwiI3tAc2Nyb2xsLmV4cG9zZU51bSAqIEBzY3JvbGwubGluZUhlaWdodH1weFwiXG4gICAgICAgIEBsYXllcnNXaWR0aCA9IEBsYXllclNjcm9sbC5vZmZzZXRXaWR0aFxuXG4gICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCB2aFxuXG4gICAgICAgIEBlbWl0ICd2aWV3SGVpZ2h0JyB2aFxuXG4gICAgc2NyZWVuU2l6ZTogLT4gZWxlY3Ryb24ucmVtb3RlLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpLndvcmtBcmVhU2l6ZVxuXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBwb3NBdFhZOih4LHkpIC0+XG5cbiAgICAgICAgc2wgPSBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdFxuICAgICAgICBzdCA9IEBzY3JvbGwub2Zmc2V0VG9wXG4gICAgICAgIGJyID0gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgbHggPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldFdpZHRoLCAgeCAtIGJyLmxlZnQgLSBAc2l6ZS5vZmZzZXRYICsgQHNpemUuY2hhcldpZHRoLzNcbiAgICAgICAgbHkgPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldEhlaWdodCwgeSAtIGJyLnRvcFxuICAgICAgICBweCA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHNsICsgbHgpKS9Ac2l6ZS5jaGFyV2lkdGgpKVxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHN0ICsgbHkpKS9Ac2l6ZS5saW5lSGVpZ2h0KSkgKyBAc2Nyb2xsLnRvcFxuICAgICAgICBwICA9IFtweCwgTWF0aC5taW4oQG51bUxpbmVzKCktMSwgcHkpXVxuICAgICAgICBwXG5cbiAgICBwb3NGb3JFdmVudDogKGV2ZW50KSAtPiBAcG9zQXRYWSBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZXG5cbiAgICBsaW5lRWxlbUF0WFk6KHgseSkgLT5cblxuICAgICAgICBwID0gQHBvc0F0WFkgeCx5XG4gICAgICAgIEBsaW5lRGl2c1twWzFdXVxuXG4gICAgbGluZVNwYW5BdFhZOih4LHkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBsaW5lRWxlbSA9IEBsaW5lRWxlbUF0WFkgeCx5XG4gICAgICAgICAgICBlID0gbGluZUVsZW0uZmlyc3RDaGlsZC5sYXN0Q2hpbGRcbiAgICAgICAgICAgIHdoaWxlIGVcbiAgICAgICAgICAgICAgICBiciA9IGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgICAgICBpZiBici5sZWZ0IDw9IHggPD0gYnIubGVmdCtici53aWR0aFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSB4LWJyLmxlZnRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNwYW46ZSwgb2Zmc2V0TGVmdDpvZmZzZXQsIG9mZnNldENoYXI6cGFyc2VJbnQob2Zmc2V0L0BzaXplLmNoYXJXaWR0aCksIHBvczpAcG9zQXRYWSB4LHkgXG4gICAgICAgICAgICAgICAgZWxzZSBpZiB4ID4gYnIubGVmdCtici53aWR0aFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSBici53aWR0aFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3BhbjplLCBvZmZzZXRMZWZ0Om9mZnNldCwgb2Zmc2V0Q2hhcjpwYXJzZUludChvZmZzZXQvQHNpemUuY2hhcldpZHRoKSwgcG9zOkBwb3NBdFhZIHgseSBcbiAgICAgICAgICAgICAgICBlID0gZS5wcmV2aW91c1NpYmxpbmdcbiAgICAgICAgbnVsbFxuXG4gICAgc3BhbkJlZm9yZU1haW46IC0+XG4gICAgICAgIFxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcbiAgICAgICAgeCA9IG1jWzBdXG4gICAgICAgIGlmIGxpbmVFbGVtID0gQGxpbmVEaXZzW21jWzFdXVxuICAgICAgICAgICAgZSA9IGxpbmVFbGVtLmZpcnN0Q2hpbGQubGFzdENoaWxkXG4gICAgICAgICAgICB3aGlsZSBlXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBlLnN0YXJ0XG4gICAgICAgICAgICAgICAgcmlnaHQgPSBlLnN0YXJ0K2UudGV4dENvbnRlbnQubGVuZ3RoIFxuICAgICAgICAgICAgICAgIGtsb2cgJ3N0YXJ0JyBzdGFydCwgcmlnaHRcbiAgICAgICAgICAgICAgICBpZiBzdGFydCA8PSB4IDw9IHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlXG4gICAgICAgICAgICAgICAgZWxzZSBpZiB4ID4gcmlnaHRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVcbiAgICAgICAgICAgICAgICBlID0gZS5wcmV2aW91c1NpYmxpbmdcbiAgICAgICAgbnVsbFxuICAgICAgICBcbiAgICBudW1GdWxsTGluZXM6IC0+IEBzY3JvbGwuZnVsbExpbmVzXG4gICAgXG4gICAgdmlld0hlaWdodDogLT4gXG4gICAgICAgIFxuICAgICAgICBpZiBAc2Nyb2xsPy52aWV3SGVpZ2h0ID49IDAgdGhlbiByZXR1cm4gQHNjcm9sbC52aWV3SGVpZ2h0XG4gICAgICAgIEB2aWV3Py5jbGllbnRIZWlnaHRcblxuICAgIGZvY3VzOiAtPiBAdmlldy5mb2N1cygpXG5cbiAgICAjICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcblxuICAgIGluaXREcmFnOiAtPlxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBsYXllclNjcm9sbFxuXG4gICAgICAgICAgICBvblN0YXJ0OiAoZHJhZywgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHZpZXcuZm9jdXMoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBldmVudFBvcyA9IEBwb3NGb3JFdmVudCBldmVudFxuXG4gICAgICAgICAgICAgICAgaWYgZXZlbnQuYnV0dG9uID09IDJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdza2lwJ1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgZXZlbnQuYnV0dG9uID09IDFcbiAgICAgICAgICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnc2tpcCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudFxuICAgICAgICAgICAgICAgICAgICBpZiBpc1NhbWVQb3MgZXZlbnRQb3MsIEBjbGlja1Bvc1xuICAgICAgICAgICAgICAgICAgICAgICAgQHN0YXJ0Q2xpY2tUaW1lcigpXG4gICAgICAgICAgICAgICAgICAgICAgICBAY2xpY2tDb3VudCArPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudCA9PSAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UgPSBAcmFuZ2VGb3JXb3JkQXRQb3MgZXZlbnRQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5IG9yIEBzdGlja3lTZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZFJhbmdlVG9TZWxlY3Rpb24gcmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBoaWdobGlnaHRXb3JkQW5kQWRkVG9TZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIEBzZWxlY3RTaW5nbGVSYW5nZSByYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnQgPT0gM1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBAcmFuZ2VGb3JMaW5lQXRJbmRleCBAY2xpY2tQb3NbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRSYW5nZVRvU2VsZWN0aW9uIHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzZWxlY3RTaW5nbGVSYW5nZSByXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQG9uQ2xpY2tUaW1lb3V0KClcblxuICAgICAgICAgICAgICAgIEBjbGlja0NvdW50ID0gMVxuICAgICAgICAgICAgICAgIEBjbGlja1BvcyA9IGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgQHN0YXJ0Q2xpY2tUaW1lcigpXG5cbiAgICAgICAgICAgICAgICBwID0gQHBvc0ZvckV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgQGNsaWNrQXRQb3MgcCwgZXZlbnRcblxuICAgICAgICAgICAgb25Nb3ZlOiAoZHJhZywgZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgcCA9IEBwb3NGb3JFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgICAgICAgICAgQGFkZEN1cnNvckF0UG9zIFtAbWFpbkN1cnNvcigpWzBdLCBwWzFdXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHAsIGV4dGVuZDp0cnVlXG5cbiAgICAgICAgICAgIG9uU3RvcDogPT5cbiAgICAgICAgICAgICAgICBAc2VsZWN0Tm9uZSgpIGlmIEBudW1TZWxlY3Rpb25zKCkgYW5kIGVtcHR5IEB0ZXh0T2ZTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICBzdGFydENsaWNrVGltZXI6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBjbGlja1RpbWVyXG4gICAgICAgIEBjbGlja1RpbWVyID0gc2V0VGltZW91dCBAb25DbGlja1RpbWVvdXQsIEBzdGlja3lTZWxlY3Rpb24gYW5kIDMwMCBvciAxMDAwXG5cbiAgICBvbkNsaWNrVGltZW91dDogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQGNsaWNrVGltZXJcbiAgICAgICAgQGNsaWNrQ291bnQgID0gMFxuICAgICAgICBAY2xpY2tUaW1lciAgPSBudWxsXG4gICAgICAgIEBjbGlja1BvcyAgICA9IG51bGxcblxuICAgIGZ1bmNJbmZvQXRMaW5lSW5kZXg6IChsaSkgLT5cblxuICAgICAgICBmaWxlcyA9IHBvc3QuZ2V0ICdpbmRleGVyJyAnZmlsZXMnIEBjdXJyZW50RmlsZVxuICAgICAgICBmaWxlSW5mbyA9IGZpbGVzW0BjdXJyZW50RmlsZV1cbiAgICAgICAgZm9yIGZ1bmMgaW4gZmlsZUluZm8uZnVuY3NcbiAgICAgICAgICAgIGlmIGZ1bmMubGluZSA8PSBsaSA8PSBmdW5jLmxhc3RcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5jbGFzcyArICcuJyArIGZ1bmMubmFtZSArICcgJ1xuICAgICAgICAnJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIGNsaWNrQXRQb3M6IChwLCBldmVudCkgLT5cblxuICAgICAgICBpZiBldmVudC5hbHRLZXlcbiAgICAgICAgICAgIEB0b2dnbGVDdXJzb3JBdFBvcyBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwLCBleHRlbmQ6ZXZlbnQuc2hpZnRLZXlcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuICdjdHJsK3onICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGRvLnVuZG8oKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtzaGlmdCt6JyAgICAgICAgIHRoZW4gcmV0dXJuIEBkby5yZWRvKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwreCcgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY3V0KClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrYycgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAY29weSgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK3YnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQHBhc3RlKClcbiAgICAgICAgICAgIHdoZW4gJ2VzYydcbiAgICAgICAgICAgICAgICBpZiBAbnVtSGlnaGxpZ2h0cygpICAgICB0aGVuIHJldHVybiBAY2xlYXJIaWdobGlnaHRzKClcbiAgICAgICAgICAgICAgICBpZiBAbnVtQ3Vyc29ycygpID4gMSAgICB0aGVuIHJldHVybiBAY2xlYXJDdXJzb3JzKClcbiAgICAgICAgICAgICAgICBpZiBAc3RpY2t5U2VsZWN0aW9uICAgICB0aGVuIHJldHVybiBAZW5kU3RpY2t5U2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpICAgICB0aGVuIHJldHVybiBAc2VsZWN0Tm9uZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGFjdGlvbiBpbiBFZGl0b3IuYWN0aW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uY29tYm8gPT0gY29tYm8gb3IgYWN0aW9uLmFjY2VsID09IGNvbWJvXG4gICAgICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gJ2N0cmwrYScgJ2NvbW1hbmQrYScgdGhlbiByZXR1cm4gQHNlbGVjdEFsbCgpXG4gICAgICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiBAW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBhY3Rpb24uYWNjZWxzPyBhbmQgb3MucGxhdGZvcm0oKSAhPSAnZGFyd2luJ1xuICAgICAgICAgICAgICAgIGZvciBhY3Rpb25Db21ibyBpbiBhY3Rpb24uYWNjZWxzXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbWJvID09IGFjdGlvbkNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250aW51ZSBpZiBub3QgYWN0aW9uLmNvbWJvcz9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGFjdGlvbkNvbWJvIGluIGFjdGlvbi5jb21ib3NcbiAgICAgICAgICAgICAgICBpZiBjb21ibyA9PSBhY3Rpb25Db21ib1xuICAgICAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIGNoYXIgYW5kIG1vZCBpbiBbXCJzaGlmdFwiIFwiXCJdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBAaW5zZXJ0Q2hhcmFjdGVyIGNoYXJcblxuICAgICAgICAndW5oYW5kbGVkJ1xuXG4gICAgb25LZXlEb3duOiAoZXZlbnQpID0+XG5cbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICByZXR1cm4gaWYgbm90IGNvbWJvXG4gICAgICAgIHJldHVybiBpZiBrZXkgPT0gJ3JpZ2h0IGNsaWNrJyAjIHdlaXJkIHJpZ2h0IGNvbW1hbmQga2V5XG5cbiAgICAgICAgcmV0dXJuIGlmICd1bmhhbmRsZWQnICE9IEB0ZXJtLmhhbmRsZUtleSBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcmVzdWx0ID0gQGhhbmRsZU1vZEtleUNvbWJvQ2hhckV2ZW50IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnRcblxuICAgICAgICBpZiAndW5oYW5kbGVkJyAhPSByZXN1bHRcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHRFZGl0b3JcbiJdfQ==
//# sourceURL=../../coffee/editor/texteditor.coffee