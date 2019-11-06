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

    TextEditor.prototype.appendInputText = function(text) {
        var li, newtxt, ref1, stripped;
        li = this.numLines() - 1;
        this["do"].start();
        stripped = kstr.stripAnsi(text);
        if (text !== stripped) {
            this.ansiLines[li] = ((ref1 = this.ansiLines[li]) != null ? ref1 : '') + text;
        }
        newtxt = this.line(li) + stripped;
        this["do"].change(li, newtxt);
        this["do"].setCursors([[newtxt.length, li]]);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0pBQUE7SUFBQTs7Ozs7QUFRQSxNQUE4RixPQUFBLENBQVEsS0FBUixDQUE5RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixxQkFBbkIsRUFBNEIsaUJBQTVCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsZUFBdkQsRUFBNkQsZUFBN0QsRUFBbUUsV0FBbkUsRUFBdUUsbUJBQXZFLEVBQStFLGVBQS9FLEVBQXFGLFNBQXJGLEVBQXdGOztBQUV4RixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7QUFDZixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUVUOzs7SUFFQyxvQkFBQyxJQUFELEVBQVEsTUFBUjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7Ozs7OztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxRQUFOO1lBQWUsUUFBQSxFQUFTLEdBQXhCO1NBQUw7UUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFWLENBQXNCLElBQUMsQ0FBQSxJQUF2QjtRQUVBLDRDQUFNLFFBQU4sRUFBZSxNQUFmO1FBRUEsSUFBQyxDQUFBLFVBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxNQUFELEdBQWUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO1NBQUw7UUFDZixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sYUFBUDtZQUFxQixLQUFBLEVBQU0sSUFBQyxDQUFBLE1BQTVCO1NBQUw7UUFDZixJQUFDLENBQUEsSUFBSSxDQUFDLFdBQU4sQ0FBa0IsSUFBQyxDQUFBLFdBQW5CO1FBRUEsS0FBQSxHQUFRO1FBQ1IsS0FBSyxDQUFDLElBQU4sQ0FBVyxZQUFYO1FBQ0EsS0FBSyxDQUFDLElBQU4sQ0FBVyxZQUFYO1FBQ0EsSUFBd0IsYUFBVSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQWxCLEVBQUEsTUFBQSxNQUF4QjtZQUFBLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBWCxFQUFBOztRQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsT0FBWDtRQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsU0FBWDtRQUNBLElBQXdCLGFBQWEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFyQixFQUFBLFNBQUEsTUFBeEI7WUFBQSxLQUFLLENBQUMsSUFBTixDQUFXLFNBQVgsRUFBQTs7UUFDQSxJQUFDLENBQUEsVUFBRCxDQUFZLEtBQVo7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsU0FBUyxDQUFDO1FBRW5CLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsU0FBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxXQUFELENBQWEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxVQUFWLGlEQUF3QyxFQUF4QyxDQUFiO1FBQ0EsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFJLFlBQUosQ0FBaUIsSUFBakI7UUFDVixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQXdCLElBQUMsQ0FBQSxVQUF6QjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFdBQVgsRUFBd0IsSUFBQyxDQUFBLFNBQXpCO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixNQUF2QixFQUFrQyxJQUFDLENBQUEsTUFBbkM7UUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLE9BQXZCLEVBQWtDLElBQUMsQ0FBQSxPQUFuQztRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsZ0JBQU4sQ0FBdUIsU0FBdkIsRUFBa0MsSUFBQyxDQUFBLFNBQW5DO1FBRUEsSUFBQyxDQUFBLFFBQUQsQ0FBQTtBQUVBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFHLE9BQUEsS0FBVyxZQUFkO2dCQUNJLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQSxDQUFLLEtBQUwsRUFBVztvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGFBQU47aUJBQVgsRUFEbEI7YUFBQSxNQUFBO2dCQUdJLFdBQUEsR0FBYyxPQUFPLENBQUMsV0FBUixDQUFBO2dCQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsSUFBQSxHQUFLLFdBQWI7Z0JBQ2QsSUFBRSxDQUFBLFdBQUEsQ0FBRixHQUFpQixJQUFJLFdBQUosQ0FBZ0IsSUFBaEIsRUFMckI7O0FBREo7SUF4Q0Q7O3lCQXNESCxHQUFBLEdBQUssU0FBQTtBQUVELFlBQUE7O2dCQUFVLENBQUUsR0FBWixDQUFBOztRQUVBLElBQUMsQ0FBQSxJQUFJLENBQUMsbUJBQU4sQ0FBMEIsU0FBMUIsRUFBb0MsSUFBQyxDQUFBLFNBQXJDO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxtQkFBTixDQUEwQixNQUExQixFQUFvQyxJQUFDLENBQUEsTUFBckM7UUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLG1CQUFOLENBQTBCLE9BQTFCLEVBQW9DLElBQUMsQ0FBQSxPQUFyQztRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQjtlQUVsQixrQ0FBQTtJQVRDOzt5QkFpQkwsYUFBQSxHQUFlLFNBQUE7ZUFFWCxJQUFDLENBQUEsVUFBRCxDQUFBLENBQWMsQ0FBQSxDQUFBLENBQWQsSUFBb0IsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFBLEdBQVk7SUFGckI7O3lCQUlmLGtCQUFBLEdBQW9CLFNBQUE7QUFFaEIsWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFIO21CQUNJLElBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFBLEVBREo7U0FBQSxNQUFBO1lBR0ksR0FBQSw4Q0FBcUIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsR0FBWSxDQUFyQixDQUF1QixDQUFDO21CQUM3QyxDQUFDLENBQUMsR0FBRCxFQUFLLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBQSxHQUFZLENBQWpCLENBQUQsRUFKSjs7SUFGZ0I7O3lCQWNwQixPQUFBLEdBQVMsU0FBQTtRQUVMLElBQUMsQ0FBQSxVQUFELENBQUE7UUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLE9BQU4sRUFBYyxJQUFkO2VBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxhQUFWLEVBQXdCLElBQXhCO0lBSks7O3lCQU1ULE1BQUEsR0FBUSxTQUFBO1FBRUosSUFBQyxDQUFBLFNBQUQsQ0FBQTtlQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTixFQUFhLElBQWI7SUFISTs7eUJBV1IsVUFBQSxHQUFZLFNBQUMsWUFBRDtBQUVSLFlBQUE7UUFBQSxJQUFDLENBQUEsU0FBRCxHQUFhO0FBQ2I7YUFBQSw4Q0FBQTs7eUJBQ0ksSUFBQyxDQUFBLFNBQVUsQ0FBQSxHQUFBLENBQVgsR0FBa0IsSUFBQyxDQUFBLFFBQUQsQ0FBVSxHQUFWO0FBRHRCOztJQUhROzt5QkFNWixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtRQUFBLEdBQUEsR0FBTSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLEdBQVA7U0FBTDtRQUNOLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFvQixHQUFwQjtlQUNBO0lBSk07O3lCQU1WLFlBQUEsR0FBYyxTQUFBO1FBRVYsSUFBQyxDQUFBLGdCQUFELENBQUE7UUFDQSxJQUFDLENBQUEsZUFBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQUpVOzt5QkFZZCxLQUFBLEdBQU8sU0FBQTtlQUFHLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxFQUFELENBQVY7SUFBSDs7eUJBRVAsUUFBQSxHQUFVLFNBQUMsS0FBRDtBQUVOLFlBQUE7UUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7UUFDbEIsSUFBQyxDQUFBLElBQUQsQ0FBTSxZQUFOOztZQUVBOztZQUFBLFFBQVM7O1FBRVQsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxRQUFELEdBQWE7UUFDYixJQUFDLENBQUEsU0FBRCxHQUFhO1FBRWIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUE7UUFFQSx5Q0FBTSxLQUFOO1FBRUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxVQUFELENBQUE7UUFFYixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBYyxVQUFkLEVBQTBCLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBMUI7UUFFQSxJQUFDLENBQUEsV0FBVyxDQUFDLFVBQWIsR0FBMEI7UUFDMUIsSUFBQyxDQUFBLFdBQUQsR0FBZ0IsSUFBQyxDQUFBLFdBQVcsQ0FBQztRQUM3QixJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsV0FBVyxDQUFDO2VBRTdCLElBQUMsQ0FBQSxZQUFELENBQUE7SUF2Qk07O3lCQStCVixVQUFBLEdBQVksU0FBQyxJQUFEO0FBRVIsWUFBQTtRQUFBLElBQU8sWUFBUDtZQUNHLE9BQUEsQ0FBQyxHQUFELENBQVEsSUFBQyxDQUFBLElBQUYsR0FBTyx3QkFBZDtBQUNDLG1CQUZKOztRQUlBLFFBQUEsR0FBVztRQUNYLEVBQUEsa0JBQUssSUFBSSxDQUFFLEtBQU4sQ0FBWSxJQUFaO0FBRUwsYUFBQSxvQ0FBQTs7WUFDSSxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBUCxDQUFrQixDQUFsQjtZQUNULFFBQVEsQ0FBQyxJQUFULENBQWMsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFBLEdBQVksQ0FBMUI7QUFGSjtRQUlBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLEtBQXNCLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBekI7WUFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBc0IsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUF0QixFQURKOztRQUdBLFNBQUEsR0FBWSxDQUFDLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixHQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBdkIsQ0FBQSxJQUErQixDQUFDLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixHQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBdkI7UUFFM0MsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFSLENBQW9CLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBcEIsRUFBaUM7WUFBQSxTQUFBLEVBQVUsU0FBVjtTQUFqQztBQUVBLGFBQUEsNENBQUE7O1lBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBTSxjQUFOLEVBQ0k7Z0JBQUEsU0FBQSxFQUFXLEVBQVg7Z0JBQ0EsSUFBQSxFQUFNLElBQUMsQ0FBQSxJQUFELENBQU0sRUFBTixDQUROO2FBREo7QUFESjtRQUtBLElBQUMsQ0FBQSxJQUFELENBQU0sZUFBTixFQUFzQixFQUF0QjtlQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sVUFBTixFQUFpQixJQUFDLENBQUEsUUFBRCxDQUFBLENBQWpCO0lBMUJROzt5QkFrQ1osWUFBQSxHQUFjLFNBQUMsSUFBRDtBQUVWLFlBQUE7UUFBQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBRUEsRUFBQSxrQkFBSyxJQUFJLENBQUUsS0FBTixDQUFZLElBQVo7QUFFTCxhQUFBLG9DQUFBOztZQUNJLFFBQUEsR0FBVyxJQUFJLENBQUMsU0FBTCxDQUFlLENBQWY7WUFDWCxJQUFHLENBQUEsS0FBSyxRQUFSO2dCQUNJLElBQUMsQ0FBQSxTQUFVLENBQUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFFBQUosQ0FBQSxDQUFBLEdBQWUsQ0FBZixDQUFYLEdBQStCLEVBRG5DOztZQUVBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFFBQUosQ0FBQSxDQUFBLEdBQWUsQ0FBMUIsRUFBNkIsUUFBN0I7QUFKSjtRQU1BLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7UUFFQSxJQUFDLENBQUEsaUJBQUQsQ0FBQTtlQUNBO0lBZlU7O3lCQXVCZCxZQUFBLEdBQWMsU0FBQyxJQUFEO0FBRVYsWUFBQTtRQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsQ0FBaUIsQ0FBQSxDQUFBOztZQUN4Qjs7WUFBQSxPQUFROztRQUVSLEVBQUEsR0FBSyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUEsR0FBWTtRQUNqQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBQ0EsSUFBQyxDQUFBLGlCQUFELENBQUE7UUFFQSxRQUFBLEdBQVcsSUFBSSxDQUFDLFNBQUwsQ0FBZSxJQUFmO1FBQ1gsSUFBRyxJQUFBLEtBQVEsUUFBWDtZQUNJLElBQUMsQ0FBQSxTQUFVLENBQUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFFBQUosQ0FBQSxDQUFBLEdBQWUsQ0FBZixDQUFYLEdBQStCLEtBRG5DOztRQUVBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsRUFBWCxFQUFlLFFBQWY7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBVixFQUFrQixFQUFsQixDQUFELENBQWY7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBZFU7O3lCQWdCZCxlQUFBLEdBQWlCLFNBQUMsSUFBRDtBQUViLFlBQUE7UUFBQSxFQUFBLEdBQUssSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFBLEdBQVk7UUFDakIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLFFBQUEsR0FBVyxJQUFJLENBQUMsU0FBTCxDQUFlLElBQWY7UUFDWCxJQUFHLElBQUEsS0FBUSxRQUFYO1lBQ0ksSUFBQyxDQUFBLFNBQVUsQ0FBQSxFQUFBLENBQVgsR0FBaUIsOENBQWtCLEVBQWxCLENBQUEsR0FBd0IsS0FEN0M7O1FBRUEsTUFBQSxHQUFTLElBQUMsQ0FBQSxJQUFELENBQU0sRUFBTixDQUFBLEdBQVk7UUFDckIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxFQUFYLEVBQWUsTUFBZjtRQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQWUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFSLEVBQWdCLEVBQWhCLENBQUQsQ0FBZjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFWYTs7eUJBWWpCLGlCQUFBLEdBQW1CLFNBQUMsRUFBRCxFQUFLLElBQUw7O1lBQUssT0FBSzs7UUFFekIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsRUFBWCxFQUFlLElBQWY7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBSmU7O3lCQVluQixXQUFBLEdBQWEsU0FBQyxRQUFEO0FBRVQsWUFBQTtRQUFBLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQWQsR0FBNEIsUUFBRCxHQUFVO1FBQ3JDLElBQUMsQ0FBQSxJQUFJLENBQUMsWUFBTixHQUFxQixhQUFhLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFBckIsRUFBQSxTQUFBLE1BQUEsSUFBa0MsRUFBbEMsSUFBd0M7UUFDN0QsSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFOLEdBQXFCO1FBQ3JCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBTixHQUFxQixRQUFBLEdBQVc7UUFDaEMsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQXFCLFFBQUEsR0FBVztRQUNoQyxJQUFBLENBQUssV0FBQSxHQUFZLFFBQVosR0FBcUIsR0FBckIsR0FBd0IsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUE5QixHQUF3QyxHQUF4QyxHQUEyQyxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQXREO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLEdBQXFCLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCLElBQUMsQ0FBQSxJQUFJLENBQUMsWUFBbkM7O2dCQUVkLENBQUUsYUFBVCxDQUF1QixJQUFDLENBQUEsSUFBSSxDQUFDLFVBQTdCOztRQUNBLElBQUcsSUFBQyxDQUFBLElBQUQsQ0FBQSxDQUFIO1lBQ0ksSUFBQSxHQUFPLElBQUMsQ0FBQSxRQUFELENBQUE7WUFDUCxLQUFBLEdBQVEsSUFBQyxDQUFBLElBQUksQ0FBQztZQUNkLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBTixDQUFBO1lBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFkO0FBQ0EsaUJBQUEsdUNBQUE7O2dCQUNJLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUFSLEdBQWUsSUFBSyxDQUFBLENBQUE7Z0JBQ3BCLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFVLElBQUssQ0FBQSxDQUFBLENBQWY7QUFGSixhQUxKOztlQVNBLElBQUMsQ0FBQSxJQUFELENBQU0saUJBQU47SUFwQlM7O3lCQXNCYixRQUFBLEdBQVUsU0FBQTtBQUVOLFlBQUE7UUFBQSxJQUFBLEdBQU87QUFDUCxhQUFVLG1HQUFWO1lBQ0ksSUFBQSxpREFBeUIsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksRUFBWjtZQUN6QixJQUFBLElBQVE7QUFGWjtlQUdBLElBQUs7SUFOQzs7eUJBUVYsUUFBQSxHQUFVLFNBQUMsRUFBRDtlQUFRLElBQUMsQ0FBQSxTQUFVLENBQUEsRUFBQTtJQUFuQjs7eUJBUVYsT0FBQSxHQUFTLFNBQUMsVUFBRDtBQUVMLFlBQUE7UUFBQSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsVUFBaEI7QUFFQTtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksT0FBYSxDQUFDLE1BQU0sQ0FBQyxPQUFSLEVBQWlCLE1BQU0sQ0FBQyxRQUF4QixFQUFrQyxNQUFNLENBQUMsTUFBekMsQ0FBYixFQUFDLFlBQUQsRUFBSSxZQUFKLEVBQU87QUFDUCxvQkFBTyxFQUFQO0FBQUEscUJBRVMsU0FGVDtvQkFHUSxJQUFDLENBQUEsU0FBVSxDQUFBLEVBQUEsQ0FBWCxHQUFpQjtvQkFDakIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxFQUFaLEVBQWdCLEVBQWhCO29CQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sYUFBTixFQUFvQixFQUFwQjtBQUhDO0FBRlQscUJBT1MsU0FQVDtvQkFRUSxJQUFDLENBQUEsU0FBRCxHQUFhLElBQUMsQ0FBQSxTQUFTLENBQUMsS0FBWCxDQUFpQixDQUFqQixFQUFvQixFQUFwQjtvQkFDYixJQUFDLENBQUEsU0FBUyxDQUFDLE1BQVgsQ0FBa0IsRUFBbEIsRUFBc0IsQ0FBdEI7b0JBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxhQUFOLEVBQW9CLEVBQXBCO0FBSEM7QUFQVCxxQkFZUyxVQVpUO29CQWFRLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxLQUFYLENBQWlCLENBQWpCLEVBQW9CLEVBQXBCO29CQUNiLElBQUMsQ0FBQSxJQUFELENBQU0sY0FBTixFQUFxQixFQUFyQixFQUF5QixFQUF6QjtBQWRSO0FBRko7UUFrQkEsSUFBRyxVQUFVLENBQUMsT0FBWCxJQUFzQixVQUFVLENBQUMsT0FBcEM7WUFDSSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxXQUFXLENBQUM7WUFDNUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFSLENBQW9CLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBcEI7WUFDQSxJQUFDLENBQUEsbUJBQUQsQ0FBQSxFQUhKOztRQUtBLElBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUF0QjtZQUNJLElBQUMsQ0FBQSxlQUFELENBQUEsRUFESjs7UUFHQSxJQUFHLFVBQVUsQ0FBQyxPQUFkO1lBQ0ksSUFBQyxDQUFBLGFBQUQsQ0FBQTtZQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBO1lBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxRQUFOO1lBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQSxFQUpKOztRQU1BLElBQUcsVUFBVSxDQUFDLE9BQWQ7WUFDSSxJQUFDLENBQUEsZUFBRCxDQUFBO1lBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxXQUFOLEVBRko7O2VBSUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxTQUFOLEVBQWdCLFVBQWhCO0lBeENLOzt5QkFnRFQsVUFBQSxHQUFZLFNBQUMsRUFBRCxFQUFLLEVBQUw7QUFFUixZQUFBO1FBQUEsSUFBZSxVQUFmO1lBQUEsRUFBQSxHQUFLLEdBQUw7O1FBRUEsSUFBRyxFQUFBLEdBQUssSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFiLElBQW9CLEVBQUEsR0FBSyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQXBDO1lBQ0ksSUFBbUQseUJBQW5EO2dCQUFBLE1BQUEsQ0FBTyxxQkFBQSxHQUFzQixFQUE3QixFQUFrQyxJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBNUMsRUFBQTs7WUFDQSxPQUFPLElBQUMsQ0FBQSxTQUFVLENBQUEsRUFBQTtBQUNsQixtQkFISjs7UUFLQSxJQUFpRSxDQUFJLElBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQSxDQUEvRTtBQUFBLG1CQUFPLE1BQUEsQ0FBTyxpQ0FBQSxHQUFrQyxFQUFsQyxHQUFxQyxNQUFyQyxHQUEyQyxFQUFsRCxFQUFQOztRQUVBLElBQUMsQ0FBQSxTQUFVLENBQUEsRUFBQSxDQUFYLEdBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksRUFBWjtRQUVqQixHQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBO2VBQ2hCLEdBQUcsQ0FBQyxZQUFKLENBQWlCLElBQUMsQ0FBQSxTQUFVLENBQUEsRUFBQSxDQUE1QixFQUFpQyxHQUFHLENBQUMsVUFBckM7SUFkUTs7eUJBZ0JaLFlBQUEsR0FBYyxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBQ1YsWUFBQTtBQUFBO2FBQVUsb0dBQVY7WUFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBZ0IsRUFBaEIsRUFBb0IsSUFBcEI7eUJBQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxFQUFaO0FBRko7O0lBRFU7O3lCQVdkLFNBQUEsR0FBVyxTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWDtBQUVQLFlBQUE7UUFBQSxJQUFDLENBQUEsUUFBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCO0FBRWxCLGFBQVUsb0dBQVY7WUFDSSxJQUFDLENBQUEsVUFBRCxDQUFZLEVBQVo7QUFESjtRQUdBLElBQUMsQ0FBQSxtQkFBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sY0FBTixFQUFxQjtZQUFBLEdBQUEsRUFBSSxHQUFKO1lBQVMsR0FBQSxFQUFJLEdBQWI7WUFBa0IsR0FBQSxFQUFJLEdBQXRCO1NBQXJCO2VBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxZQUFOLEVBQW1CLEdBQW5CLEVBQXdCLEdBQXhCLEVBQTZCLEdBQTdCO0lBWE87O3lCQWFYLFVBQUEsR0FBWSxTQUFDLEVBQUQ7UUFFUixJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBVixHQUFnQixJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLE1BQU47U0FBTDtRQUNoQixJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFdBQWQsQ0FBMEIsSUFBQyxDQUFBLFVBQUQsQ0FBWSxFQUFaLENBQTFCO2VBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQSxDQUE1QjtJQUpROzt5QkFZWixVQUFBLEdBQVksU0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVg7QUFFUixZQUFBO1FBQUEsTUFBQSxHQUFTLEdBQUEsR0FBTTtRQUNmLE1BQUEsR0FBUyxHQUFBLEdBQU07UUFFZixPQUFBLEdBQVUsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxFQUFELEVBQUksRUFBSjtBQUVOLG9CQUFBO2dCQUFBLElBQUcsQ0FBSSxLQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBakI7b0JBQ0ksTUFBQSxDQUFVLEtBQUMsQ0FBQSxJQUFGLEdBQU8sZ0NBQVAsR0FBdUMsR0FBdkMsR0FBMkMsR0FBM0MsR0FBOEMsR0FBOUMsR0FBa0QsR0FBbEQsR0FBcUQsR0FBckQsR0FBeUQsT0FBekQsR0FBZ0UsTUFBaEUsR0FBdUUsR0FBdkUsR0FBMEUsTUFBMUUsR0FBaUYsTUFBakYsR0FBdUYsRUFBdkYsR0FBMEYsTUFBMUYsR0FBZ0csRUFBekc7QUFDQSwyQkFGSjs7Z0JBSUEsS0FBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBLENBQVYsR0FBZ0IsS0FBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBO2dCQUMxQixPQUFPLEtBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQTtnQkFDakIsS0FBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBLENBQUcsQ0FBQyxZQUFkLENBQTJCLEtBQUMsQ0FBQSxVQUFELENBQVksRUFBWixDQUEzQixFQUE0QyxLQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFVBQTFEO2dCQUVBLElBQUcsS0FBQyxDQUFBLGNBQUo7b0JBQ0ksRUFBQSxHQUFLLEtBQUMsQ0FBQSxJQUFELENBQU0sRUFBTixDQUFTLENBQUMsTUFBVixHQUFtQixLQUFDLENBQUEsSUFBSSxDQUFDLFNBQXpCLEdBQXFDO29CQUMxQyxJQUFBLEdBQU8sSUFBQSxDQUFLLE1BQUwsRUFBWTt3QkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLG1CQUFOO3dCQUEwQixJQUFBLEVBQUssUUFBL0I7cUJBQVo7b0JBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFYLEdBQXVCLFlBQUEsR0FBYSxFQUFiLEdBQWdCOzJCQUN2QyxLQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFdBQWQsQ0FBMEIsSUFBMUIsRUFKSjs7WUFWTTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7UUFnQlYsSUFBRyxHQUFBLEdBQU0sQ0FBVDtBQUNJLG1CQUFNLE1BQUEsR0FBUyxHQUFmO2dCQUNJLE1BQUEsSUFBVTtnQkFDVixPQUFBLENBQVEsTUFBUixFQUFnQixNQUFoQjtnQkFDQSxNQUFBLElBQVU7WUFIZCxDQURKO1NBQUEsTUFBQTtBQU1JLG1CQUFNLE1BQUEsR0FBUyxHQUFmO2dCQUNJLE1BQUEsSUFBVTtnQkFDVixPQUFBLENBQVEsTUFBUixFQUFnQixNQUFoQjtnQkFDQSxNQUFBLElBQVU7WUFIZCxDQU5KOztRQVdBLElBQUMsQ0FBQSxJQUFELENBQU0sY0FBTixFQUFxQixHQUFyQixFQUEwQixHQUExQixFQUErQixHQUEvQjtRQUVBLElBQUMsQ0FBQSxtQkFBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTtJQW5DUTs7eUJBMkNaLG1CQUFBLEdBQXFCLFNBQUMsT0FBRDtBQUVqQixZQUFBOztZQUZrQixVQUFROztBQUUxQjtBQUFBLGFBQUEsVUFBQTs7WUFDSSxJQUFPLGFBQUosSUFBZ0IsbUJBQW5CO0FBQ0ksdUJBQU8sTUFBQSxDQUFPLGdCQUFQLEVBQXdCLFdBQXhCLEVBQThCLDBDQUE5QixFQURYOztZQUVBLENBQUEsR0FBSSxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQU4sR0FBbUIsQ0FBQyxFQUFBLEdBQUssSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFkO1lBQ3ZCLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBVixHQUFzQixjQUFBLEdBQWUsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFyQixHQUE2QixLQUE3QixHQUFrQyxDQUFsQyxHQUFvQztZQUMxRCxJQUFpRCxPQUFqRDtnQkFBQSxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVYsR0FBdUIsTUFBQSxHQUFNLENBQUMsT0FBQSxHQUFRLElBQVQsQ0FBTixHQUFvQixJQUEzQzs7WUFDQSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQVYsR0FBbUI7QUFOdkI7UUFRQSxJQUFHLE9BQUg7WUFDSSxVQUFBLEdBQWEsQ0FBQSxTQUFBLEtBQUE7dUJBQUEsU0FBQTtBQUNULHdCQUFBO0FBQUE7QUFBQTt5QkFBQSxzQ0FBQTs7cUNBQ0ksQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFSLEdBQXFCO0FBRHpCOztnQkFEUztZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7bUJBR2IsVUFBQSxDQUFXLFVBQVgsRUFBdUIsT0FBdkIsRUFKSjs7SUFWaUI7O3lCQWdCckIsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO0FBQUE7YUFBVSw0SEFBVjt5QkFDSSxJQUFDLENBQUEsVUFBRCxDQUFZLEVBQVo7QUFESjs7SUFGUzs7eUJBS2IsZUFBQSxHQUFpQixTQUFBO1FBRWIsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUg7WUFDSSxDQUFBLENBQUUsYUFBRixFQUFnQixJQUFDLENBQUEsTUFBakIsQ0FBd0IsQ0FBQyxTQUF6QixHQUFxQzttQkFDckMsOENBQUEsRUFGSjs7SUFGYTs7eUJBWWpCLFVBQUEsR0FBWSxTQUFDLEVBQUQ7QUFFUixZQUFBO1FBQUEsOENBQWlCLENBQUUsZUFBbkI7WUFDSSxJQUFBLEdBQU8sSUFBSSxJQUFJLENBQUM7WUFDaEIsSUFBQSxHQUFPLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBQyxDQUFBLFNBQVUsQ0FBQSxFQUFBLENBQXhCLENBQTZCLENBQUEsQ0FBQTttQkFDcEMsSUFBQSxHQUFPLE1BQU0sQ0FBQyxRQUFQLENBQWdCLElBQWhCLEVBQXNCLElBQUMsQ0FBQSxJQUF2QixFQUhYO1NBQUEsTUFBQTttQkFLSSxJQUFBLEdBQU8sTUFBTSxDQUFDLFFBQVAsQ0FBZ0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQWdCLEVBQWhCLENBQWhCLEVBQXFDLElBQUMsQ0FBQSxJQUF0QyxFQUxYOztJQUZROzt5QkFTWixVQUFBLEdBQVksU0FBQyxFQUFEO1FBRVIsSUFBRyxDQUFJLElBQUMsQ0FBQSxTQUFVLENBQUEsRUFBQSxDQUFsQjtZQUVJLElBQUMsQ0FBQSxTQUFVLENBQUEsRUFBQSxDQUFYLEdBQWlCLElBQUMsQ0FBQSxVQUFELENBQVksRUFBWixFQUZyQjs7ZUFJQSxJQUFDLENBQUEsU0FBVSxDQUFBLEVBQUE7SUFOSDs7eUJBUVosYUFBQSxHQUFlLFNBQUE7QUFFWCxZQUFBO1FBQUEsRUFBQSxHQUFLO0FBQ0w7QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQUcsQ0FBRSxDQUFBLENBQUEsQ0FBRixJQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBaEIsSUFBd0IsQ0FBRSxDQUFBLENBQUEsQ0FBRixJQUFRLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBM0M7Z0JBQ0ksRUFBRSxDQUFDLElBQUgsQ0FBUSxDQUFDLENBQUUsQ0FBQSxDQUFBLENBQUgsRUFBTyxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUF0QixDQUFSLEVBREo7O0FBREo7UUFJQSxFQUFBLEdBQUssSUFBQyxDQUFBLFVBQUQsQ0FBQTtRQUVMLElBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFBLEtBQWlCLENBQXBCO1lBRUksSUFBRyxFQUFFLENBQUMsTUFBSCxLQUFhLENBQWhCO2dCQUVJLElBQVUsRUFBRyxDQUFBLENBQUEsQ0FBSCxHQUFRLENBQWxCO0FBQUEsMkJBQUE7O2dCQUVBLElBQUcsRUFBRyxDQUFBLENBQUEsQ0FBSCxHQUFRLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBQSxHQUFZLENBQXZCO0FBQ0ksMkJBQU8sTUFBQSxDQUFVLElBQUMsQ0FBQSxJQUFGLEdBQU8sa0NBQWhCLEVBQWtELElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBbEQsRUFBK0QsSUFBQSxDQUFLLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBTCxDQUEvRCxFQURYOztnQkFHQSxFQUFBLEdBQUssRUFBRyxDQUFBLENBQUEsQ0FBSCxHQUFNLElBQUMsQ0FBQSxNQUFNLENBQUM7Z0JBQ25CLFVBQUEsR0FBYSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBWSxFQUFHLENBQUEsQ0FBQSxDQUFmO2dCQUNiLElBQTRDLGtCQUE1QztBQUFBLDJCQUFPLE1BQUEsQ0FBTyxzQkFBUCxFQUFQOztnQkFDQSxJQUFHLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBUSxVQUFVLENBQUMsTUFBdEI7b0JBQ0ksRUFBRyxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBTixHQUFXO29CQUNYLEVBQUUsQ0FBQyxJQUFILENBQVEsQ0FBQyxVQUFVLENBQUMsTUFBWixFQUFvQixFQUFwQixFQUF3QixVQUF4QixDQUFSLEVBRko7aUJBQUEsTUFBQTtvQkFJSSxFQUFHLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFOLEdBQVcsV0FKZjtpQkFWSjthQUZKO1NBQUEsTUFrQkssSUFBRyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQUEsR0FBZ0IsQ0FBbkI7WUFFRCxFQUFBLEdBQUs7QUFDTCxpQkFBQSxzQ0FBQTs7Z0JBQ0ksSUFBRyxTQUFBLENBQVUsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFWLEVBQXlCLENBQUMsQ0FBRSxDQUFBLENBQUEsQ0FBSCxFQUFPLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQXRCLENBQXpCLENBQUg7b0JBQ0ksQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLE9BRFg7O2dCQUVBLElBQUEsR0FBTyxJQUFDLENBQUEsSUFBRCxDQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBUixHQUFZLENBQUUsQ0FBQSxDQUFBLENBQXBCO2dCQUNQLElBQUcsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPLElBQUksQ0FBQyxNQUFmO29CQUNJLEVBQUUsQ0FBQyxJQUFILENBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTixFQUFjLENBQUUsQ0FBQSxDQUFBLENBQWhCLEVBQW9CLFNBQXBCLENBQVIsRUFESjs7QUFKSjtZQU1BLEVBQUEsR0FBSyxFQUFFLENBQUMsTUFBSCxDQUFVLEVBQVYsRUFUSjs7UUFXTCxJQUFBLEdBQU8sTUFBTSxDQUFDLE9BQVAsQ0FBZSxFQUFmLEVBQW1CLElBQUMsQ0FBQSxJQUFwQjtRQUNQLElBQUMsQ0FBQSxTQUFTLENBQUMsT0FBTyxDQUFDLFNBQW5CLEdBQStCO1FBRS9CLEVBQUEsR0FBSyxDQUFDLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQWpCLENBQUEsR0FBd0IsSUFBQyxDQUFBLElBQUksQ0FBQztRQUVuQyxJQUFHLElBQUMsQ0FBQSxVQUFKO1lBQ0ksSUFBQyxDQUFBLFVBQVUsQ0FBQyxLQUFaLEdBQW9CLG9DQUFBLEdBQXFDLEVBQXJDLEdBQXdDLGdCQUF4QyxHQUF3RCxJQUFDLENBQUEsSUFBSSxDQUFDLFVBQTlELEdBQXlFO21CQUM3RixJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsSUFBQyxDQUFBLFVBQXRCLEVBQWtDLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBMUMsRUFGSjs7SUEzQ1c7O3lCQStDZixlQUFBLEdBQWlCLFNBQUE7QUFFYixZQUFBO1FBQUEsQ0FBQSxHQUFJO1FBQ0osSUFBRyxDQUFBLEdBQUksSUFBQyxDQUFBLDZDQUFELENBQStDLENBQUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFULEVBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUF0QixDQUEvQyxFQUEyRSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQW5GLENBQVA7WUFDSSxDQUFBLElBQUssTUFBTSxDQUFDLFNBQVAsQ0FBaUIsQ0FBakIsRUFBb0IsSUFBQyxDQUFBLElBQXJCLEVBRFQ7O2VBRUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxVQUFVLENBQUMsU0FBdEIsR0FBa0M7SUFMckI7O3lCQU9qQixnQkFBQSxHQUFrQixTQUFBO0FBRWQsWUFBQTtRQUFBLENBQUEsR0FBSTtRQUNKLElBQUcsQ0FBQSxHQUFJLElBQUMsQ0FBQSw2Q0FBRCxDQUErQyxDQUFDLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBVCxFQUFjLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBdEIsQ0FBL0MsRUFBMkUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFuRixDQUFQO1lBQ0ksQ0FBQSxJQUFLLE1BQU0sQ0FBQyxTQUFQLENBQWlCLENBQWpCLEVBQW9CLElBQUMsQ0FBQSxJQUFyQixFQUEyQixXQUEzQixFQURUOztlQUVBLElBQUMsQ0FBQSxTQUFTLENBQUMsVUFBVSxDQUFDLFNBQXRCLEdBQWtDO0lBTHBCOzt5QkFhbEIsU0FBQSxHQUFXLFNBQUE7ZUFBRyxDQUFBLENBQUUsY0FBRixFQUFpQixJQUFDLENBQUEsU0FBVSxDQUFBLFNBQUEsQ0FBNUI7SUFBSDs7eUJBRVgsWUFBQSxHQUFjLFNBQUE7QUFFVixZQUFBO1FBQUEsSUFBVSxDQUFJLElBQUMsQ0FBQSxVQUFmO0FBQUEsbUJBQUE7O1FBQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBQTs7Z0JBQ1ksQ0FBRSxTQUFTLENBQUMsTUFBeEIsQ0FBK0IsT0FBL0IsRUFBdUMsS0FBdkM7O1FBQ0EsWUFBQSxDQUFhLElBQUMsQ0FBQSxZQUFkO1FBQ0EsVUFBQSxHQUFhLEtBQUssQ0FBQyxHQUFOLENBQVUsa0JBQVYsRUFBNkIsQ0FBQyxHQUFELEVBQUssR0FBTCxDQUE3QjtlQUNiLElBQUMsQ0FBQSxZQUFELEdBQWdCLFVBQUEsQ0FBVyxJQUFDLENBQUEsWUFBWixFQUEwQixVQUFXLENBQUEsQ0FBQSxDQUFyQztJQVBOOzt5QkFTZCxZQUFBLEdBQWMsU0FBQTtRQUVWLFlBQUEsQ0FBYSxJQUFDLENBQUEsWUFBZDtRQUNBLE9BQU8sSUFBQyxDQUFBO2VBQ1IsSUFBQyxDQUFBLFVBQUQsQ0FBQTtJQUpVOzt5QkFNZCxXQUFBLEdBQWEsU0FBQTtBQUVULFlBQUE7UUFBQSxLQUFBLEdBQVEsQ0FBSSxLQUFLLENBQUMsR0FBTixDQUFVLE9BQVYsRUFBa0IsS0FBbEI7UUFDWixLQUFLLENBQUMsR0FBTixDQUFVLE9BQVYsRUFBa0IsS0FBbEI7UUFDQSxJQUFHLEtBQUg7bUJBQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBQSxFQURKO1NBQUEsTUFBQTttQkFHSSxJQUFDLENBQUEsU0FBRCxDQUFBLEVBSEo7O0lBSlM7O3lCQVNiLE9BQUEsR0FBUyxTQUFBO0FBRUwsWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBSSxJQUFDLENBQUE7O2dCQUVGLENBQUUsU0FBUyxDQUFDLE1BQXhCLENBQStCLE9BQS9CLEVBQXVDLElBQUMsQ0FBQSxLQUF4Qzs7O2dCQUNRLENBQUUsY0FBVixDQUF5QixJQUFDLENBQUEsS0FBMUI7O1FBRUEsWUFBQSxDQUFhLElBQUMsQ0FBQSxVQUFkO1FBQ0EsVUFBQSxHQUFhLEtBQUssQ0FBQyxHQUFOLENBQVUsa0JBQVYsRUFBNkIsQ0FBQyxHQUFELEVBQUssR0FBTCxDQUE3QjtlQUNiLElBQUMsQ0FBQSxVQUFELEdBQWMsVUFBQSxDQUFXLElBQUMsQ0FBQSxPQUFaLEVBQXFCLElBQUMsQ0FBQSxLQUFELElBQVcsVUFBVyxDQUFBLENBQUEsQ0FBdEIsSUFBNEIsVUFBVyxDQUFBLENBQUEsQ0FBNUQ7SUFUVDs7eUJBV1QsVUFBQSxHQUFZLFNBQUE7UUFFUixJQUFHLENBQUksSUFBQyxDQUFBLFVBQUwsSUFBb0IsS0FBSyxDQUFDLEdBQU4sQ0FBVSxPQUFWLENBQXZCO21CQUNJLElBQUMsQ0FBQSxPQUFELENBQUEsRUFESjs7SUFGUTs7eUJBS1osU0FBQSxHQUFXLFNBQUE7QUFFUCxZQUFBOztnQkFBWSxDQUFFLFNBQVMsQ0FBQyxNQUF4QixDQUErQixPQUEvQixFQUF1QyxLQUF2Qzs7UUFFQSxZQUFBLENBQWEsSUFBQyxDQUFBLFVBQWQ7ZUFDQSxPQUFPLElBQUMsQ0FBQTtJQUxEOzt5QkFhWCxPQUFBLEdBQVMsU0FBQTtBQUVMLFlBQUE7UUFBQSxFQUFBLEdBQUssSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFVLENBQUM7UUFFdEIsSUFBVSxFQUFBLElBQU8sRUFBQSxLQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBL0I7QUFBQSxtQkFBQTs7O2dCQUVRLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFyQixHQUFnQyxDQUFDLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixHQUFvQixJQUFDLENBQUEsTUFBTSxDQUFDLFVBQTdCLENBQUEsR0FBd0M7O1FBQ3hFLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQyxDQUFBLFdBQVcsQ0FBQztRQUU1QixJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBc0IsRUFBdEI7ZUFFQSxJQUFDLENBQUEsSUFBRCxDQUFNLFlBQU4sRUFBbUIsRUFBbkI7SUFYSzs7eUJBYVQsVUFBQSxHQUFZLFNBQUE7ZUFBRyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBdkIsQ0FBQSxDQUEwQyxDQUFDO0lBQTlDOzt5QkFRWixPQUFBLEdBQVEsU0FBQyxDQUFELEVBQUcsQ0FBSDtBQUVKLFlBQUE7UUFBQSxFQUFBLEdBQUssSUFBQyxDQUFBLFdBQVcsQ0FBQztRQUNsQixFQUFBLEdBQUssSUFBQyxDQUFBLE1BQU0sQ0FBQztRQUNiLEVBQUEsR0FBSyxJQUFDLENBQUEsSUFBSSxDQUFDLHFCQUFOLENBQUE7UUFDTCxFQUFBLEdBQUssS0FBQSxDQUFNLENBQU4sRUFBUyxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQWpCLEVBQStCLENBQUEsR0FBSSxFQUFFLENBQUMsSUFBUCxHQUFjLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBcEIsR0FBOEIsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWdCLENBQTdFO1FBQ0wsRUFBQSxHQUFLLEtBQUEsQ0FBTSxDQUFOLEVBQVMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFqQixFQUErQixDQUFBLEdBQUksRUFBRSxDQUFDLEdBQXRDO1FBQ0wsRUFBQSxHQUFLLFFBQUEsQ0FBUyxJQUFJLENBQUMsS0FBTCxDQUFXLENBQUMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVksRUFBQSxHQUFLLEVBQWpCLENBQUQsQ0FBQSxHQUF1QixJQUFDLENBQUEsSUFBSSxDQUFDLFNBQXhDLENBQVQ7UUFDTCxFQUFBLEdBQUssUUFBQSxDQUFTLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBQyxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxFQUFBLEdBQUssRUFBakIsQ0FBRCxDQUFBLEdBQXVCLElBQUMsQ0FBQSxJQUFJLENBQUMsVUFBeEMsQ0FBVCxDQUFBLEdBQWdFLElBQUMsQ0FBQSxNQUFNLENBQUM7UUFDN0UsQ0FBQSxHQUFLLENBQUMsRUFBRCxFQUFLLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFBLEdBQVksQ0FBckIsRUFBd0IsRUFBeEIsQ0FBTDtlQUNMO0lBVkk7O3lCQVlSLFdBQUEsR0FBYSxTQUFDLEtBQUQ7ZUFBVyxJQUFDLENBQUEsT0FBRCxDQUFTLEtBQUssQ0FBQyxPQUFmLEVBQXdCLEtBQUssQ0FBQyxPQUE5QjtJQUFYOzt5QkFFYixjQUFBLEdBQWdCLFNBQUE7QUFFWixZQUFBO1FBQUEsRUFBQSxHQUFLLElBQUMsQ0FBQSxVQUFELENBQUE7UUFDTCxDQUFBLEdBQUksRUFBRyxDQUFBLENBQUE7UUFDUCxJQUFHLFFBQUEsR0FBVyxJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUcsQ0FBQSxDQUFBLENBQUgsQ0FBeEI7WUFDSSxDQUFBLEdBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQztBQUN4QixtQkFBTSxDQUFOO2dCQUNJLEtBQUEsR0FBUSxDQUFDLENBQUM7Z0JBQ1YsS0FBQSxHQUFRLENBQUMsQ0FBQyxLQUFGLEdBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQztnQkFDOUIsSUFBRyxDQUFBLEtBQUEsSUFBUyxDQUFULElBQVMsQ0FBVCxJQUFjLEtBQWQsQ0FBSDtBQUNJLDJCQUFPLEVBRFg7aUJBQUEsTUFFSyxJQUFHLENBQUEsR0FBSSxLQUFQO0FBQ0QsMkJBQU8sRUFETjs7Z0JBRUwsQ0FBQSxHQUFJLENBQUMsQ0FBQztZQVBWLENBRko7O2VBVUE7SUFkWTs7eUJBZ0JoQixZQUFBLEdBQWMsU0FBQTtlQUFHLElBQUMsQ0FBQSxNQUFNLENBQUM7SUFBWDs7eUJBRWQsVUFBQSxHQUFZLFNBQUE7QUFFUixZQUFBO1FBQUEsd0NBQVUsQ0FBRSxvQkFBVCxJQUF1QixDQUExQjtBQUFpQyxtQkFBTyxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQWhEOztnREFDSyxDQUFFO0lBSEM7O3lCQUtaLEtBQUEsR0FBTyxTQUFBO2VBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLENBQUE7SUFBSDs7eUJBUVAsUUFBQSxHQUFVLFNBQUE7ZUFFTixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksSUFBSixDQUNKO1lBQUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxXQUFWO1lBRUEsT0FBQSxFQUFTLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUMsSUFBRCxFQUFPLEtBQVA7QUFFTCx3QkFBQTtvQkFBQSxLQUFDLENBQUEsSUFBSSxDQUFDLEtBQU4sQ0FBQTtvQkFFQSxRQUFBLEdBQVcsS0FBQyxDQUFBLFdBQUQsQ0FBYSxLQUFiO29CQUVYLElBQUcsS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBbkI7QUFDSSwrQkFBTyxPQURYO3FCQUFBLE1BRUssSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjt3QkFDRCxTQUFBLENBQVUsS0FBVjtBQUNBLCtCQUFPLE9BRk47O29CQUlMLElBQUcsS0FBQyxDQUFBLFVBQUo7d0JBQ0ksSUFBRyxTQUFBLENBQVUsUUFBVixFQUFvQixLQUFDLENBQUEsUUFBckIsQ0FBSDs0QkFDSSxLQUFDLENBQUEsZUFBRCxDQUFBOzRCQUNBLEtBQUMsQ0FBQSxVQUFELElBQWU7NEJBQ2YsSUFBRyxLQUFDLENBQUEsVUFBRCxLQUFlLENBQWxCO2dDQUNJLEtBQUEsR0FBUSxLQUFDLENBQUEsaUJBQUQsQ0FBbUIsUUFBbkI7Z0NBQ1IsSUFBRyxLQUFLLENBQUMsT0FBTixJQUFpQixLQUFDLENBQUEsZUFBckI7b0NBQ0ksS0FBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBREo7aUNBQUEsTUFBQTtvQ0FHSSxLQUFDLENBQUEsOEJBQUQsQ0FBQSxFQUhKO2lDQUZKOzs0QkFPQSxJQUFHLEtBQUMsQ0FBQSxVQUFELEtBQWUsQ0FBbEI7Z0NBQ0ksQ0FBQSxHQUFJLEtBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFDLENBQUEsUUFBUyxDQUFBLENBQUEsQ0FBL0I7Z0NBQ0osSUFBRyxLQUFLLENBQUMsT0FBVDtvQ0FDSSxLQUFDLENBQUEsbUJBQUQsQ0FBcUIsQ0FBckIsRUFESjtpQ0FBQSxNQUFBO29DQUdJLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQixFQUhKO2lDQUZKOztBQU1BLG1DQWhCSjt5QkFBQSxNQUFBOzRCQWtCSSxLQUFDLENBQUEsY0FBRCxDQUFBLEVBbEJKO3lCQURKOztvQkFxQkEsS0FBQyxDQUFBLFVBQUQsR0FBYztvQkFDZCxLQUFDLENBQUEsUUFBRCxHQUFZO29CQUNaLEtBQUMsQ0FBQSxlQUFELENBQUE7b0JBRUEsQ0FBQSxHQUFJLEtBQUMsQ0FBQSxXQUFELENBQWEsS0FBYjsyQkFDSixLQUFDLENBQUEsVUFBRCxDQUFZLENBQVosRUFBZSxLQUFmO2dCQXRDSztZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FGVDtZQTBDQSxNQUFBLEVBQVEsQ0FBQSxTQUFBLEtBQUE7dUJBQUEsU0FBQyxJQUFELEVBQU8sS0FBUDtBQUVKLHdCQUFBO29CQUFBLENBQUEsR0FBSSxLQUFDLENBQUEsV0FBRCxDQUFhLEtBQWI7b0JBQ0osSUFBRyxLQUFLLENBQUMsT0FBVDsrQkFDSSxLQUFDLENBQUEsY0FBRCxDQUFnQixDQUFDLEtBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYyxDQUFBLENBQUEsQ0FBZixFQUFtQixDQUFFLENBQUEsQ0FBQSxDQUFyQixDQUFoQixFQURKO3FCQUFBLE1BQUE7K0JBR0ksS0FBQyxDQUFBLGlCQUFELENBQW1CLENBQW5CLEVBQXNCOzRCQUFBLE1BQUEsRUFBTyxJQUFQO3lCQUF0QixFQUhKOztnQkFISTtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0ExQ1I7WUFrREEsTUFBQSxFQUFRLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUE7b0JBRUosSUFBaUIsS0FBQyxDQUFBLGFBQUQsQ0FBQSxDQUFBLElBQXFCLEtBQUEsQ0FBTSxLQUFDLENBQUEsZUFBRCxDQUFBLENBQU4sQ0FBdEM7K0JBQUEsS0FBQyxDQUFBLFVBQUQsQ0FBQSxFQUFBOztnQkFGSTtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FsRFI7U0FESTtJQUZGOzt5QkF5RFYsZUFBQSxHQUFpQixTQUFBO1FBRWIsWUFBQSxDQUFhLElBQUMsQ0FBQSxVQUFkO2VBQ0EsSUFBQyxDQUFBLFVBQUQsR0FBYyxVQUFBLENBQVcsSUFBQyxDQUFBLGNBQVosRUFBNEIsSUFBQyxDQUFBLGVBQUQsSUFBcUIsR0FBckIsSUFBNEIsSUFBeEQ7SUFIRDs7eUJBS2pCLGNBQUEsR0FBZ0IsU0FBQTtRQUVaLFlBQUEsQ0FBYSxJQUFDLENBQUEsVUFBZDtRQUNBLElBQUMsQ0FBQSxVQUFELEdBQWU7UUFDZixJQUFDLENBQUEsVUFBRCxHQUFlO2VBQ2YsSUFBQyxDQUFBLFFBQUQsR0FBZTtJQUxIOzt5QkFPaEIsbUJBQUEsR0FBcUIsU0FBQyxFQUFEO0FBRWpCLFlBQUE7UUFBQSxLQUFBLEdBQVEsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULEVBQW1CLE9BQW5CLEVBQTJCLElBQUMsQ0FBQSxXQUE1QjtRQUNSLFFBQUEsR0FBVyxLQUFNLENBQUEsSUFBQyxDQUFBLFdBQUQ7QUFDakI7QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQUcsQ0FBQSxJQUFJLENBQUMsSUFBTCxJQUFhLEVBQWIsSUFBYSxFQUFiLElBQW1CLElBQUksQ0FBQyxJQUF4QixDQUFIO0FBQ0ksdUJBQU8sSUFBSSxFQUFDLEtBQUQsRUFBSixHQUFhLEdBQWIsR0FBbUIsSUFBSSxDQUFDLElBQXhCLEdBQStCLElBRDFDOztBQURKO2VBR0E7SUFQaUI7O3lCQWVyQixVQUFBLEdBQVksU0FBQyxDQUFELEVBQUksS0FBSjtRQUVSLElBQUcsS0FBSyxDQUFDLE1BQVQ7bUJBQ0ksSUFBQyxDQUFBLGlCQUFELENBQW1CLENBQW5CLEVBREo7U0FBQSxNQUFBO21CQUdJLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixDQUFuQixFQUFzQjtnQkFBQSxNQUFBLEVBQU8sS0FBSyxDQUFDLFFBQWI7YUFBdEIsRUFISjs7SUFGUTs7eUJBYVosMEJBQUEsR0FBNEIsU0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEtBQVgsRUFBa0IsSUFBbEIsRUFBd0IsS0FBeEI7QUFFeEIsWUFBQTtBQUFBLGdCQUFPLEtBQVA7QUFBQSxpQkFFUyxRQUZUO0FBRXFDLHVCQUFPLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQUE7QUFGNUMsaUJBR1MsY0FIVDtBQUdxQyx1QkFBTyxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFBO0FBSDVDLGlCQUlTLFFBSlQ7QUFJcUMsdUJBQU8sSUFBQyxDQUFBLEdBQUQsQ0FBQTtBQUo1QyxpQkFLUyxRQUxUO0FBS3FDLHVCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFMNUMsaUJBTVMsUUFOVDtBQU1xQyx1QkFBTyxJQUFDLENBQUEsS0FBRCxDQUFBO0FBTjVDLGlCQU9TLEtBUFQ7Z0JBUVEsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUg7QUFBNkIsMkJBQU8sSUFBQyxDQUFBLGVBQUQsQ0FBQSxFQUFwQzs7Z0JBQ0EsSUFBRyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQUEsR0FBZ0IsQ0FBbkI7QUFBNkIsMkJBQU8sSUFBQyxDQUFBLFlBQUQsQ0FBQSxFQUFwQzs7Z0JBQ0EsSUFBRyxJQUFDLENBQUEsZUFBSjtBQUE2QiwyQkFBTyxJQUFDLENBQUEsa0JBQUQsQ0FBQSxFQUFwQzs7Z0JBQ0EsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUg7QUFBNkIsMkJBQU8sSUFBQyxDQUFBLFVBQUQsQ0FBQSxFQUFwQzs7QUFDQTtBQVpSO0FBY0E7QUFBQSxhQUFBLHNDQUFBOztZQUVJLElBQUcsTUFBTSxDQUFDLEtBQVAsS0FBZ0IsS0FBaEIsSUFBeUIsTUFBTSxDQUFDLEtBQVAsS0FBZ0IsS0FBNUM7QUFDSSx3QkFBTyxLQUFQO0FBQUEseUJBQ1MsUUFEVDtBQUFBLHlCQUNrQixXQURsQjtBQUNtQywrQkFBTyxJQUFDLENBQUEsU0FBRCxDQUFBO0FBRDFDO2dCQUVBLElBQUcsb0JBQUEsSUFBZ0IsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxJQUFFLENBQUEsTUFBTSxDQUFDLEdBQVAsQ0FBZixDQUFuQjtvQkFDSSxJQUFFLENBQUEsTUFBTSxDQUFDLEdBQVAsQ0FBRixDQUFjLEdBQWQsRUFBbUI7d0JBQUEsS0FBQSxFQUFPLEtBQVA7d0JBQWMsR0FBQSxFQUFLLEdBQW5CO3dCQUF3QixLQUFBLEVBQU8sS0FBL0I7cUJBQW5CO0FBQ0EsMkJBRko7O0FBR0EsdUJBQU8sWUFOWDs7WUFRQSxJQUFHLHVCQUFBLElBQW1CLEVBQUUsQ0FBQyxRQUFILENBQUEsQ0FBQSxLQUFpQixRQUF2QztBQUNJO0FBQUEscUJBQUEsd0NBQUE7O29CQUNJLElBQUcsS0FBQSxLQUFTLFdBQVo7d0JBQ0ksSUFBRyxvQkFBQSxJQUFnQixDQUFDLENBQUMsVUFBRixDQUFhLElBQUUsQ0FBQSxNQUFNLENBQUMsR0FBUCxDQUFmLENBQW5COzRCQUNJLElBQUUsQ0FBQSxNQUFNLENBQUMsR0FBUCxDQUFGLENBQWMsR0FBZCxFQUFtQjtnQ0FBQSxLQUFBLEVBQU8sS0FBUDtnQ0FBYyxHQUFBLEVBQUssR0FBbkI7Z0NBQXdCLEtBQUEsRUFBTyxLQUEvQjs2QkFBbkI7QUFDQSxtQ0FGSjt5QkFESjs7QUFESixpQkFESjs7WUFPQSxJQUFnQixxQkFBaEI7QUFBQSx5QkFBQTs7QUFFQTtBQUFBLGlCQUFBLHdDQUFBOztnQkFDSSxJQUFHLEtBQUEsS0FBUyxXQUFaO29CQUNJLElBQUcsb0JBQUEsSUFBZ0IsQ0FBQyxDQUFDLFVBQUYsQ0FBYSxJQUFFLENBQUEsTUFBTSxDQUFDLEdBQVAsQ0FBZixDQUFuQjt3QkFDSSxJQUFFLENBQUEsTUFBTSxDQUFDLEdBQVAsQ0FBRixDQUFjLEdBQWQsRUFBbUI7NEJBQUEsS0FBQSxFQUFPLEtBQVA7NEJBQWMsR0FBQSxFQUFLLEdBQW5COzRCQUF3QixLQUFBLEVBQU8sS0FBL0I7eUJBQW5CO0FBQ0EsK0JBRko7cUJBREo7O0FBREo7QUFuQko7UUF5QkEsSUFBRyxJQUFBLElBQVMsQ0FBQSxHQUFBLEtBQVEsT0FBUixJQUFBLEdBQUEsS0FBZ0IsRUFBaEIsQ0FBWjtBQUVJLG1CQUFPLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQWpCLEVBRlg7O2VBSUE7SUE3Q3dCOzt5QkErQzVCLFNBQUEsR0FBVyxTQUFDLEtBQUQ7QUFFUCxZQUFBO1FBQUEsT0FBNEIsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsS0FBakIsQ0FBNUIsRUFBRSxjQUFGLEVBQU8sY0FBUCxFQUFZLGtCQUFaLEVBQW1CO1FBRW5CLElBQVUsQ0FBSSxLQUFkO0FBQUEsbUJBQUE7O1FBQ0EsSUFBVSxHQUFBLEtBQU8sYUFBakI7QUFBQSxtQkFBQTs7UUFFQSxJQUFVLFdBQUEsS0FBZSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBZ0IsR0FBaEIsRUFBcUIsR0FBckIsRUFBMEIsS0FBMUIsRUFBaUMsSUFBakMsRUFBdUMsS0FBdkMsQ0FBekI7QUFBQSxtQkFBQTs7UUFFQSxNQUFBLEdBQVMsSUFBQyxDQUFBLDBCQUFELENBQTRCLEdBQTVCLEVBQWlDLEdBQWpDLEVBQXNDLEtBQXRDLEVBQTZDLElBQTdDLEVBQW1ELEtBQW5EO1FBRVQsSUFBRyxXQUFBLEtBQWUsTUFBbEI7bUJBQ0ksU0FBQSxDQUFVLEtBQVYsRUFESjs7SUFYTzs7OztHQXp6QlU7O0FBdTBCekIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHN0b3BFdmVudCwga2V5aW5mbywgcHJlZnMsIGNsYW1wLCBlbXB0eSwgZWxlbSwga3N0ciwgZHJhZywgb3MsIGtlcnJvciwga2xvZywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuICBcbnJlbmRlciAgICAgICA9IHJlcXVpcmUgJy4vcmVuZGVyJ1xuRWRpdG9yU2Nyb2xsID0gcmVxdWlyZSAnLi9lZGl0b3JzY3JvbGwnXG5FZGl0b3IgICAgICAgPSByZXF1aXJlICcuL2VkaXRvcidcbmVsZWN0cm9uICAgICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5jbGFzcyBUZXh0RWRpdG9yIGV4dGVuZHMgRWRpdG9yXG5cbiAgICBAOiAoQHRlcm0sIGNvbmZpZykgLT5cblxuICAgICAgICBAdmlldyA9IGVsZW0gY2xhc3M6J2VkaXRvcicgdGFiaW5kZXg6JzAnXG4gICAgICAgIEB0ZXJtLmRpdi5hcHBlbmRDaGlsZCBAdmlld1xuXG4gICAgICAgIHN1cGVyICdlZGl0b3InIGNvbmZpZ1xuXG4gICAgICAgIEBjbGlja0NvdW50ICA9IDBcblxuICAgICAgICBAbGF5ZXJzICAgICAgPSBlbGVtIGNsYXNzOiAnbGF5ZXJzJ1xuICAgICAgICBAbGF5ZXJTY3JvbGwgPSBlbGVtIGNsYXNzOiAnbGF5ZXJTY3JvbGwnIGNoaWxkOkBsYXllcnNcbiAgICAgICAgQHZpZXcuYXBwZW5kQ2hpbGQgQGxheWVyU2Nyb2xsXG5cbiAgICAgICAgbGF5ZXIgPSBbXVxuICAgICAgICBsYXllci5wdXNoICdzZWxlY3Rpb25zJ1xuICAgICAgICBsYXllci5wdXNoICdoaWdobGlnaHRzJ1xuICAgICAgICBsYXllci5wdXNoICdtZXRhJyAgICBpZiAnTWV0YScgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICBsYXllci5wdXNoICdsaW5lcydcbiAgICAgICAgbGF5ZXIucHVzaCAnY3Vyc29ycydcbiAgICAgICAgbGF5ZXIucHVzaCAnbnVtYmVycycgaWYgJ051bWJlcnMnIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgQGluaXRMYXllcnMgbGF5ZXJcblxuICAgICAgICBAc2l6ZSA9IHt9XG4gICAgICAgIEBlbGVtID0gQGxheWVyRGljdC5saW5lc1xuXG4gICAgICAgIEBhbnNpTGluZXMgPSBbXSAjIG9yaWdpbmFsIGFuc2kgY29kZSBzdHJpbmdzXG4gICAgICAgIEBzcGFuQ2FjaGUgPSBbXSAjIGNhY2hlIGZvciByZW5kZXJlZCBsaW5lIHNwYW5zXG4gICAgICAgIEBsaW5lRGl2cyAgPSB7fSAjIG1hcHMgbGluZSBudW1iZXJzIHRvIGRpc3BsYXllZCBkaXZzXG5cbiAgICAgICAgQHNldEZvbnRTaXplIHByZWZzLmdldCBcImZvbnRTaXplXCIgQGNvbmZpZy5mb250U2l6ZSA/IDE4XG4gICAgICAgIEBzY3JvbGwgPSBuZXcgRWRpdG9yU2Nyb2xsIEBcbiAgICAgICAgQHNjcm9sbC5vbiAnc2hpZnRMaW5lcycgQHNoaWZ0TGluZXNcbiAgICAgICAgQHNjcm9sbC5vbiAnc2hvd0xpbmVzJyAgQHNob3dMaW5lc1xuXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2JsdXInICAgICBAb25CbHVyXG4gICAgICAgIEB2aWV3LmFkZEV2ZW50TGlzdGVuZXIgJ2ZvY3VzJyAgICBAb25Gb2N1c1xuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyAgQG9uS2V5RG93blxuXG4gICAgICAgIEBpbml0RHJhZygpXG5cbiAgICAgICAgZm9yIGZlYXR1cmUgaW4gQGNvbmZpZy5mZWF0dXJlc1xuICAgICAgICAgICAgaWYgZmVhdHVyZSA9PSAnQ3Vyc29yTGluZSdcbiAgICAgICAgICAgICAgICBAY3Vyc29yTGluZSA9IGVsZW0gJ2RpdicgY2xhc3M6J2N1cnNvci1saW5lJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZlYXR1cmVOYW1lID0gZmVhdHVyZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAgICAgZmVhdHVyZUNsc3MgPSByZXF1aXJlIFwiLi8je2ZlYXR1cmVOYW1lfVwiXG4gICAgICAgICAgICAgICAgQFtmZWF0dXJlTmFtZV0gPSBuZXcgZmVhdHVyZUNsc3MgQFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGRlbDogLT5cblxuICAgICAgICBAc2Nyb2xsYmFyPy5kZWwoKVxuXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2tleWRvd24nIEBvbktleURvd25cbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnYmx1cicgICAgQG9uQmx1clxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdmb2N1cycgICBAb25Gb2N1c1xuICAgICAgICBAdmlldy5pbm5lckhUTUwgPSAnJ1xuXG4gICAgICAgIHN1cGVyKClcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGlzSW5wdXRDdXJzb3I6IC0+XG4gICAgICAgIFxuICAgICAgICBAbWFpbkN1cnNvcigpWzFdID49IEBudW1MaW5lcygpLTFcbiAgICAgICAgXG4gICAgcmVzdG9yZUlucHV0Q3Vyc29yOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGlzSW5wdXRDdXJzb3IoKVxuICAgICAgICAgICAgQHN0YXRlLmN1cnNvcnMoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb2wgPSBAaW5wdXRDdXJzb3IgPyBAZG8ubGluZShAbnVtTGluZXMoKS0xKS5sZW5ndGhcbiAgICAgICAgICAgIFtbY29sLEBudW1MaW5lcygpLTFdXVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBvbkZvY3VzOiA9PlxuXG4gICAgICAgIEBzdGFydEJsaW5rKClcbiAgICAgICAgQGVtaXQgJ2ZvY3VzJyBAXG4gICAgICAgIHBvc3QuZW1pdCAnZWRpdG9yRm9jdXMnIEBcblxuICAgIG9uQmx1cjogPT5cblxuICAgICAgICBAc3RvcEJsaW5rKClcbiAgICAgICAgQGVtaXQgJ2JsdXInIEBcblxuICAgICMgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAwMDAwMDAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgaW5pdExheWVyczogKGxheWVyQ2xhc3NlcykgLT5cblxuICAgICAgICBAbGF5ZXJEaWN0ID0ge31cbiAgICAgICAgZm9yIGNscyBpbiBsYXllckNsYXNzZXNcbiAgICAgICAgICAgIEBsYXllckRpY3RbY2xzXSA9IEBhZGRMYXllciBjbHNcblxuICAgIGFkZExheWVyOiAoY2xzKSAtPlxuXG4gICAgICAgIGRpdiA9IGVsZW0gY2xhc3M6IGNsc1xuICAgICAgICBAbGF5ZXJzLmFwcGVuZENoaWxkIGRpdlxuICAgICAgICBkaXZcblxuICAgIHVwZGF0ZUxheWVyczogKCkgLT5cblxuICAgICAgICBAcmVuZGVySGlnaGxpZ2h0cygpXG4gICAgICAgIEByZW5kZXJTZWxlY3Rpb24oKVxuICAgICAgICBAcmVuZGVyQ3Vyc29ycygpXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY2xlYXI6ID0+IEBzZXRMaW5lcyBbJyddXG4gICAgXG4gICAgc2V0TGluZXM6IChsaW5lcykgLT5cblxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBAZW1pdCAnY2xlYXJMaW5lcydcblxuICAgICAgICBsaW5lcyA/PSBbXVxuXG4gICAgICAgIEBzcGFuQ2FjaGUgPSBbXVxuICAgICAgICBAbGluZURpdnMgID0ge31cbiAgICAgICAgQGFuc2lMaW5lcyA9IFtdXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnJlc2V0KClcblxuICAgICAgICBzdXBlciBsaW5lc1xuXG4gICAgICAgIHZpZXdIZWlnaHQgPSBAdmlld0hlaWdodCgpXG4gICAgICAgIFxuICAgICAgICBAc2Nyb2xsLnN0YXJ0IHZpZXdIZWlnaHQsIEBudW1MaW5lcygpXG5cbiAgICAgICAgQGxheWVyU2Nyb2xsLnNjcm9sbExlZnQgPSAwXG4gICAgICAgIEBsYXllcnNXaWR0aCAgPSBAbGF5ZXJTY3JvbGwub2Zmc2V0V2lkdGhcbiAgICAgICAgQGxheWVyc0hlaWdodCA9IEBsYXllclNjcm9sbC5vZmZzZXRIZWlnaHRcblxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYXBwZW5kVGV4dDogKHRleHQpIC0+XG5cbiAgICAgICAgaWYgbm90IHRleHQ/XG4gICAgICAgICAgICBsb2cgXCIje0BuYW1lfS5hcHBlbmRUZXh0IC0gbm8gdGV4dD9cIlxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgYXBwZW5kZWQgPSBbXVxuICAgICAgICBscyA9IHRleHQ/LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgZm9yIGwgaW4gbHNcbiAgICAgICAgICAgIEBzdGF0ZSA9IEBzdGF0ZS5hcHBlbmRMaW5lIGxcbiAgICAgICAgICAgIGFwcGVuZGVkLnB1c2ggQG51bUxpbmVzKCktMVxuXG4gICAgICAgIGlmIEBzY3JvbGwudmlld0hlaWdodCAhPSBAdmlld0hlaWdodCgpXG4gICAgICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgQHZpZXdIZWlnaHQoKVxuXG4gICAgICAgIHNob3dMaW5lcyA9IChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudG9wKSBvciAoQHNjcm9sbC5ib3QgPCBAc2Nyb2xsLnZpZXdMaW5lcylcblxuICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpLCBzaG93TGluZXM6c2hvd0xpbmVzXG5cbiAgICAgICAgZm9yIGxpIGluIGFwcGVuZGVkXG4gICAgICAgICAgICBAZW1pdCAnbGluZUFwcGVuZGVkJywgIyBtZXRhXG4gICAgICAgICAgICAgICAgbGluZUluZGV4OiBsaVxuICAgICAgICAgICAgICAgIHRleHQ6IEBsaW5lIGxpXG5cbiAgICAgICAgQGVtaXQgJ2xpbmVzQXBwZW5kZWQnIGxzICMgYXV0b2NvbXBsZXRlXG4gICAgICAgIEBlbWl0ICdudW1MaW5lcycgQG51bUxpbmVzKCkgIyBtaW5pbWFwXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBhcHBlbmRPdXRwdXQ6ICh0ZXh0KSAtPlxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICBscyA9IHRleHQ/LnNwbGl0IC9cXG4vXG5cbiAgICAgICAgZm9yIGwgaW4gbHNcbiAgICAgICAgICAgIHN0cmlwcGVkID0ga3N0ci5zdHJpcEFuc2kgbFxuICAgICAgICAgICAgaWYgbCAhPSBzdHJpcHBlZCBcbiAgICAgICAgICAgICAgICBAYW5zaUxpbmVzW0Bkby5udW1MaW5lcygpLTFdID0gbFxuICAgICAgICAgICAgQGRvLmluc2VydCBAZG8ubnVtTGluZXMoKS0xLCBzdHJpcHBlZFxuICAgICAgICAgICAgXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICAgICAgQHNpbmdsZUN1cnNvckF0RW5kKClcbiAgICAgICAgQFxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBzZXRJbnB1dFRleHQ6ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9IHRleHQuc3BsaXQoJ1xcbicpWzBdXG4gICAgICAgIHRleHQgPz0gJydcbiAgICAgICAgXG4gICAgICAgIGxpID0gQG51bUxpbmVzKCktMVxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZGVsZXRlQ3Vyc29yTGluZXMoKVxuICAgICAgICAgICAgXG4gICAgICAgIHN0cmlwcGVkID0ga3N0ci5zdHJpcEFuc2kgdGV4dFxuICAgICAgICBpZiB0ZXh0ICE9IHN0cmlwcGVkIFxuICAgICAgICAgICAgQGFuc2lMaW5lc1tAZG8ubnVtTGluZXMoKS0xXSA9IHRleHRcbiAgICAgICAgQGRvLmNoYW5nZSBsaSwgc3RyaXBwZWQgICAgICAgICAgICBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgW1tzdHJpcHBlZC5sZW5ndGgsIGxpXV1cbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgIGFwcGVuZElucHV0VGV4dDogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICBsaSA9IEBudW1MaW5lcygpLTFcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgc3RyaXBwZWQgPSBrc3RyLnN0cmlwQW5zaSB0ZXh0XG4gICAgICAgIGlmIHRleHQgIT0gc3RyaXBwZWQgXG4gICAgICAgICAgICBAYW5zaUxpbmVzW2xpXSA9IChAYW5zaUxpbmVzW2xpXSA/ICcnKSArIHRleHRcbiAgICAgICAgbmV3dHh0ID0gQGxpbmUobGkpICsgc3RyaXBwZWRcbiAgICAgICAgQGRvLmNoYW5nZSBsaSwgbmV3dHh0ICAgICAgICAgICAgXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtbbmV3dHh0Lmxlbmd0aCwgbGldXVxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgcmVwbGFjZVRleHRJbkxpbmU6IChsaSwgdGV4dD0nJykgLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5jaGFuZ2UgbGksIHRleHRcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBzZXRGb250U2l6ZTogKGZvbnRTaXplKSA9PlxuICAgICAgICBcbiAgICAgICAgQGxheWVycy5zdHlsZS5mb250U2l6ZSA9IFwiI3tmb250U2l6ZX1weFwiXG4gICAgICAgIEBzaXplLm51bWJlcnNXaWR0aCA9ICdOdW1iZXJzJyBpbiBAY29uZmlnLmZlYXR1cmVzIGFuZCAzNiBvciAwXG4gICAgICAgIEBzaXplLmZvbnRTaXplICAgICA9IGZvbnRTaXplXG4gICAgICAgIEBzaXplLmxpbmVIZWlnaHQgICA9IGZvbnRTaXplICogMS4yMlxuICAgICAgICBAc2l6ZS5jaGFyV2lkdGggICAgPSBmb250U2l6ZSAqIDAuNlxuICAgICAgICBrbG9nIFwiZm9udFNpemUgI3tmb250U2l6ZX0gI3tAc2l6ZS5jaGFyV2lkdGh9ICN7QHNpemUubGluZUhlaWdodH1cIlxuICAgICAgICBAc2l6ZS5vZmZzZXRYICAgICAgPSBNYXRoLmZsb29yIEBzaXplLmNoYXJXaWR0aCArIEBzaXplLm51bWJlcnNXaWR0aFxuXG4gICAgICAgIEBzY3JvbGw/LnNldExpbmVIZWlnaHQgQHNpemUubGluZUhlaWdodFxuICAgICAgICBpZiBAdGV4dCgpICMgPz8/XG4gICAgICAgICAgICBhbnNpID0gQGFuc2lUZXh0KClcbiAgICAgICAgICAgIG1ldGFzID0gQG1ldGEubWV0YXNcbiAgICAgICAgICAgIEB0ZXJtLmNsZWFyKClcbiAgICAgICAgICAgIEBhcHBlbmRPdXRwdXQgYW5zaVxuICAgICAgICAgICAgZm9yIG1ldGEgaW4gbWV0YXNcbiAgICAgICAgICAgICAgICBtZXRhWzJdLmxpbmUgPSBtZXRhWzBdXG4gICAgICAgICAgICAgICAgQG1ldGEuYWRkIG1ldGFbMl1cblxuICAgICAgICBAZW1pdCAnZm9udFNpemVDaGFuZ2VkJ1xuXG4gICAgYW5zaVRleHQ6IC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gJydcbiAgICAgICAgZm9yIGxpIGluIFswLi4uQG51bUxpbmVzKCktMV1cbiAgICAgICAgICAgIHRleHQgKz0gQGFuc2lMaW5lc1tsaV0gPyBAc3RhdGUubGluZSBsaVxuICAgICAgICAgICAgdGV4dCArPSAnXFxuJ1xuICAgICAgICB0ZXh0Wy4udGV4dC5sZW5ndGgtMl1cbiAgICAgICAgXG4gICAgYW5zaUxpbmU6IChsaSkgPT4gQGFuc2lMaW5lc1tsaV1cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIGNoYW5nZWQ6IChjaGFuZ2VJbmZvKSAtPlxuXG4gICAgICAgIEBzeW50YXguY2hhbmdlZCBjaGFuZ2VJbmZvXG5cbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcbiAgICAgICAgICAgIFtkaSxsaSxjaF0gPSBbY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5uZXdJbmRleCwgY2hhbmdlLmNoYW5nZV1cbiAgICAgICAgICAgIHN3aXRjaCBjaFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2NoYW5nZWQnXG4gICAgICAgICAgICAgICAgICAgIEBhbnNpTGluZXNbbGldID0gbnVsbFxuICAgICAgICAgICAgICAgICAgICBAdXBkYXRlTGluZSBsaSwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVDaGFuZ2VkJyBsaVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdkZWxldGVkJ1xuICAgICAgICAgICAgICAgICAgICBAc3BhbkNhY2hlID0gQHNwYW5DYWNoZS5zbGljZSAwLCBkaVxuICAgICAgICAgICAgICAgICAgICBAYW5zaUxpbmVzLnNwbGljZSBkaSwgMVxuICAgICAgICAgICAgICAgICAgICBAZW1pdCAnbGluZURlbGV0ZWQnIGRpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHdoZW4gJ2luc2VydGVkJ1xuICAgICAgICAgICAgICAgICAgICBAc3BhbkNhY2hlID0gQHNwYW5DYWNoZS5zbGljZSAwLCBkaVxuICAgICAgICAgICAgICAgICAgICBAZW1pdCAnbGluZUluc2VydGVkJyBsaSwgZGlcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmluc2VydHMgb3IgY2hhbmdlSW5mby5kZWxldGVzXG4gICAgICAgICAgICBAbGF5ZXJzV2lkdGggPSBAbGF5ZXJTY3JvbGwub2Zmc2V0V2lkdGhcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQG51bUxpbmVzKClcbiAgICAgICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmNoYW5nZXMubGVuZ3RoXG4gICAgICAgICAgICBAY2xlYXJIaWdobGlnaHRzKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLmN1cnNvcnNcbiAgICAgICAgICAgIEByZW5kZXJDdXJzb3JzKClcbiAgICAgICAgICAgIEBzY3JvbGwuY3Vyc29ySW50b1ZpZXcoKVxuICAgICAgICAgICAgQGVtaXQgJ2N1cnNvcidcbiAgICAgICAgICAgIEBzdXNwZW5kQmxpbmsoKVxuXG4gICAgICAgIGlmIGNoYW5nZUluZm8uc2VsZWN0c1xuICAgICAgICAgICAgQHJlbmRlclNlbGVjdGlvbigpXG4gICAgICAgICAgICBAZW1pdCAnc2VsZWN0aW9uJ1xuXG4gICAgICAgIEBlbWl0ICdjaGFuZ2VkJyBjaGFuZ2VJbmZvXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIHVwZGF0ZUxpbmU6IChsaSwgb2kpIC0+XG5cbiAgICAgICAgb2kgPSBsaSBpZiBub3Qgb2k/XG5cbiAgICAgICAgaWYgbGkgPCBAc2Nyb2xsLnRvcCBvciBsaSA+IEBzY3JvbGwuYm90XG4gICAgICAgICAgICBrZXJyb3IgXCJkYW5nbGluZyBsaW5lIGRpdj8gI3tsaX1cIiBAbGluZURpdnNbbGldIGlmIEBsaW5lRGl2c1tsaV0/XG4gICAgICAgICAgICBkZWxldGUgQHNwYW5DYWNoZVtsaV1cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJ1cGRhdGVMaW5lIC0gb3V0IG9mIGJvdW5kcz8gbGkgI3tsaX0gb2kgI3tvaX1cIiBpZiBub3QgQGxpbmVEaXZzW29pXVxuICAgICAgICBcbiAgICAgICAgQHNwYW5DYWNoZVtsaV0gPSBAcmVuZGVyU3BhbiBsaVxuXG4gICAgICAgIGRpdiA9IEBsaW5lRGl2c1tvaV1cbiAgICAgICAgZGl2LnJlcGxhY2VDaGlsZCBAc3BhbkNhY2hlW2xpXSwgZGl2LmZpcnN0Q2hpbGRcbiAgICAgICAgXG4gICAgcmVmcmVzaExpbmVzOiAodG9wLCBib3QpIC0+XG4gICAgICAgIGZvciBsaSBpbiBbdG9wLi5ib3RdXG4gICAgICAgICAgICBAc3ludGF4LmdldERpc3MgbGksIHRydWVcbiAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNob3dMaW5lczogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgQGxpbmVEaXZzID0ge31cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcblxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgQGFwcGVuZExpbmUgbGlcblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG4gICAgICAgIEB1cGRhdGVMYXllcnMoKVxuICAgICAgICBAZW1pdCAnbGluZXNFeHBvc2VkJyB0b3A6dG9wLCBib3Q6Ym90LCBudW06bnVtXG4gICAgICAgIEBlbWl0ICdsaW5lc1Nob3duJyB0b3AsIGJvdCwgbnVtXG5cbiAgICBhcHBlbmRMaW5lOiAobGkpIC0+XG5cbiAgICAgICAgQGxpbmVEaXZzW2xpXSA9IGVsZW0gY2xhc3M6J2xpbmUnXG4gICAgICAgIEBsaW5lRGl2c1tsaV0uYXBwZW5kQ2hpbGQgQGNhY2hlZFNwYW4gbGlcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGxpbmVEaXZzW2xpXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxuICAgIHNoaWZ0TGluZXM6ICh0b3AsIGJvdCwgbnVtKSA9PlxuICAgICAgICBcbiAgICAgICAgb2xkVG9wID0gdG9wIC0gbnVtXG4gICAgICAgIG9sZEJvdCA9IGJvdCAtIG51bVxuXG4gICAgICAgIGRpdkludG8gPSAobGksbG8pID0+XG5cbiAgICAgICAgICAgIGlmIG5vdCBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICAgICAga2Vycm9yIFwiI3tAbmFtZX0uc2hpZnRMaW5lcy5kaXZJbnRvIC0gbm8gZGl2PyAje3RvcH0gI3tib3R9ICN7bnVtfSBvbGQgI3tvbGRUb3B9ICN7b2xkQm90fSBsbyAje2xvfSBsaSAje2xpfVwiXG4gICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0gPSBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICBkZWxldGUgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgQGxpbmVEaXZzW2xpXS5yZXBsYWNlQ2hpbGQgQGNhY2hlZFNwYW4obGkpLCBAbGluZURpdnNbbGldLmZpcnN0Q2hpbGRcblxuICAgICAgICAgICAgaWYgQHNob3dJbnZpc2libGVzXG4gICAgICAgICAgICAgICAgdHggPSBAbGluZShsaSkubGVuZ3RoICogQHNpemUuY2hhcldpZHRoICsgMVxuICAgICAgICAgICAgICAgIHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczpcImludmlzaWJsZSBuZXdsaW5lXCIgaHRtbDonJiM5Njg3J1xuICAgICAgICAgICAgICAgIHNwYW4uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoI3t0eH1weCwgLTEuNXB4KVwiXG4gICAgICAgICAgICAgICAgQGxpbmVEaXZzW2xpXS5hcHBlbmRDaGlsZCBzcGFuXG5cbiAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgd2hpbGUgb2xkQm90IDwgYm90XG4gICAgICAgICAgICAgICAgb2xkQm90ICs9IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZEJvdCwgb2xkVG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wICs9IDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgb2xkVG9wID4gdG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wIC09IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZFRvcCwgb2xkQm90XG4gICAgICAgICAgICAgICAgb2xkQm90IC09IDFcblxuICAgICAgICBAZW1pdCAnbGluZXNTaGlmdGVkJyB0b3AsIGJvdCwgbnVtXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcblxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICB1cGRhdGVMaW5lUG9zaXRpb25zOiAoYW5pbWF0ZT0wKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGxpLCBkaXYgb2YgQGxpbmVEaXZzXG4gICAgICAgICAgICBpZiBub3QgZGl2PyBvciBub3QgZGl2LnN0eWxlP1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIGRpdj8gc3R5bGU/JyBkaXY/LCBkaXY/LnN0eWxlP1xuICAgICAgICAgICAgeSA9IEBzaXplLmxpbmVIZWlnaHQgKiAobGkgLSBAc2Nyb2xsLnRvcClcbiAgICAgICAgICAgIGRpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZTNkKCN7QHNpemUub2Zmc2V0WH1weCwje3l9cHgsIDApXCJcbiAgICAgICAgICAgIGRpdi5zdHlsZS50cmFuc2l0aW9uID0gXCJhbGwgI3thbmltYXRlLzEwMDB9c1wiIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIGRpdi5zdHlsZS56SW5kZXggPSBsaVxuXG4gICAgICAgIGlmIGFuaW1hdGVcbiAgICAgICAgICAgIHJlc2V0VHJhbnMgPSA9PlxuICAgICAgICAgICAgICAgIGZvciBjIGluIEBlbGVtLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgIGMuc3R5bGUudHJhbnNpdGlvbiA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgc2V0VGltZW91dCByZXNldFRyYW5zLCBhbmltYXRlXG5cbiAgICB1cGRhdGVMaW5lczogKCkgLT5cblxuICAgICAgICBmb3IgbGkgaW4gW0BzY3JvbGwudG9wLi5Ac2Nyb2xsLmJvdF1cbiAgICAgICAgICAgIEB1cGRhdGVMaW5lIGxpXG5cbiAgICBjbGVhckhpZ2hsaWdodHM6ICgpIC0+XG5cbiAgICAgICAgaWYgQG51bUhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgJCgnLmhpZ2hsaWdodHMnIEBsYXllcnMpLmlubmVySFRNTCA9ICcnXG4gICAgICAgICAgICBzdXBlcigpXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgcmVuZGVyU3BhbjogKGxpKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGFuc2lMaW5lc1tsaV0/Lmxlbmd0aFxuICAgICAgICAgICAgYW5zaSA9IG5ldyBrc3RyLmFuc2lcbiAgICAgICAgICAgIGRpc3MgPSBhbnNpLmRpc3NlY3QoQGFuc2lMaW5lc1tsaV0pWzFdXG4gICAgICAgICAgICBzcGFuID0gcmVuZGVyLmxpbmVTcGFuIGRpc3MsIEBzaXplXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNwYW4gPSByZW5kZXIubGluZVNwYW4gQHN5bnRheC5nZXREaXNzKGxpKSwgQHNpemVcbiAgICBcbiAgICBjYWNoZWRTcGFuOiAobGkpIC0+XG5cbiAgICAgICAgaWYgbm90IEBzcGFuQ2FjaGVbbGldXG5cbiAgICAgICAgICAgIEBzcGFuQ2FjaGVbbGldID0gQHJlbmRlclNwYW4gbGlcblxuICAgICAgICBAc3BhbkNhY2hlW2xpXVxuXG4gICAgcmVuZGVyQ3Vyc29yczogLT5cblxuICAgICAgICBjcyA9IFtdXG4gICAgICAgIGZvciBjIGluIEBjdXJzb3JzKClcbiAgICAgICAgICAgIGlmIGNbMV0gPj0gQHNjcm9sbC50b3AgYW5kIGNbMV0gPD0gQHNjcm9sbC5ib3RcbiAgICAgICAgICAgICAgICBjcy5wdXNoIFtjWzBdLCBjWzFdIC0gQHNjcm9sbC50b3BdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIG1jID0gQG1haW5DdXJzb3IoKVxuXG4gICAgICAgIGlmIEBudW1DdXJzb3JzKCkgPT0gMVxuXG4gICAgICAgICAgICBpZiBjcy5sZW5ndGggPT0gMVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIG1jWzFdIDwgMFxuXG4gICAgICAgICAgICAgICAgaWYgbWNbMV0gPiBAbnVtTGluZXMoKS0xXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCIje0BuYW1lfS5yZW5kZXJDdXJzb3JzIG1haW5DdXJzb3IgREFGVUs/XCIgQG51bUxpbmVzKCksIGtzdHIgQG1haW5DdXJzb3IoKVxuXG4gICAgICAgICAgICAgICAgcmkgPSBtY1sxXS1Ac2Nyb2xsLnRvcFxuICAgICAgICAgICAgICAgIGN1cnNvckxpbmUgPSBAc3RhdGUubGluZShtY1sxXSlcbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBtYWluIGN1cnNvciBsaW5lPycgaWYgbm90IGN1cnNvckxpbmU/XG4gICAgICAgICAgICAgICAgaWYgbWNbMF0gPiBjdXJzb3JMaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBjc1swXVsyXSA9ICd2aXJ0dWFsJ1xuICAgICAgICAgICAgICAgICAgICBjcy5wdXNoIFtjdXJzb3JMaW5lLmxlbmd0aCwgcmksICdtYWluIG9mZiddXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjc1swXVsyXSA9ICdtYWluIG9mZidcblxuICAgICAgICBlbHNlIGlmIEBudW1DdXJzb3JzKCkgPiAxXG5cbiAgICAgICAgICAgIHZjID0gW10gIyB2aXJ0dWFsIGN1cnNvcnNcbiAgICAgICAgICAgIGZvciBjIGluIGNzXG4gICAgICAgICAgICAgICAgaWYgaXNTYW1lUG9zIEBtYWluQ3Vyc29yKCksIFtjWzBdLCBjWzFdICsgQHNjcm9sbC50b3BdXG4gICAgICAgICAgICAgICAgICAgIGNbMl0gPSAnbWFpbidcbiAgICAgICAgICAgICAgICBsaW5lID0gQGxpbmUoQHNjcm9sbC50b3ArY1sxXSlcbiAgICAgICAgICAgICAgICBpZiBjWzBdID4gbGluZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgdmMucHVzaCBbbGluZS5sZW5ndGgsIGNbMV0sICd2aXJ0dWFsJ11cbiAgICAgICAgICAgIGNzID0gY3MuY29uY2F0IHZjXG5cbiAgICAgICAgaHRtbCA9IHJlbmRlci5jdXJzb3JzIGNzLCBAc2l6ZVxuICAgICAgICBAbGF5ZXJEaWN0LmN1cnNvcnMuaW5uZXJIVE1MID0gaHRtbFxuICAgICAgICBcbiAgICAgICAgdHkgPSAobWNbMV0gLSBAc2Nyb2xsLnRvcCkgKiBAc2l6ZS5saW5lSGVpZ2h0XG4gICAgICAgIFxuICAgICAgICBpZiBAY3Vyc29yTGluZVxuICAgICAgICAgICAgQGN1cnNvckxpbmUuc3R5bGUgPSBcInotaW5kZXg6MDt0cmFuc2Zvcm06dHJhbnNsYXRlM2QoMCwje3R5fXB4LDApOyBoZWlnaHQ6I3tAc2l6ZS5saW5lSGVpZ2h0fXB4O3dpZHRoOjEwMCU7XCJcbiAgICAgICAgICAgIEBsYXllcnMuaW5zZXJ0QmVmb3JlIEBjdXJzb3JMaW5lLCBAbGF5ZXJzLmZpcnN0Q2hpbGRcblxuICAgIHJlbmRlclNlbGVjdGlvbjogLT5cblxuICAgICAgICBoID0gXCJcIlxuICAgICAgICBpZiBzID0gQHNlbGVjdGlvbnNJbkxpbmVJbmRleFJhbmdlUmVsYXRpdmVUb0xpbmVJbmRleCBbQHNjcm9sbC50b3AsIEBzY3JvbGwuYm90XSwgQHNjcm9sbC50b3BcbiAgICAgICAgICAgIGggKz0gcmVuZGVyLnNlbGVjdGlvbiBzLCBAc2l6ZVxuICAgICAgICBAbGF5ZXJEaWN0LnNlbGVjdGlvbnMuaW5uZXJIVE1MID0gaFxuXG4gICAgcmVuZGVySGlnaGxpZ2h0czogLT5cblxuICAgICAgICBoID0gXCJcIlxuICAgICAgICBpZiBzID0gQGhpZ2hsaWdodHNJbkxpbmVJbmRleFJhbmdlUmVsYXRpdmVUb0xpbmVJbmRleCBbQHNjcm9sbC50b3AsIEBzY3JvbGwuYm90XSwgQHNjcm9sbC50b3BcbiAgICAgICAgICAgIGggKz0gcmVuZGVyLnNlbGVjdGlvbiBzLCBAc2l6ZSwgXCJoaWdobGlnaHRcIlxuICAgICAgICBAbGF5ZXJEaWN0LmhpZ2hsaWdodHMuaW5uZXJIVE1MID0gaFxuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjdXJzb3JEaXY6IC0+ICQgJy5jdXJzb3IubWFpbicgQGxheWVyRGljdFsnY3Vyc29ycyddXG5cbiAgICBzdXNwZW5kQmxpbms6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAYmxpbmtUaW1lclxuICAgICAgICBAc3RvcEJsaW5rKClcbiAgICAgICAgQGN1cnNvckRpdigpPy5jbGFzc0xpc3QudG9nZ2xlICdibGluaycgZmFsc2VcbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzdXNwZW5kVGltZXJcbiAgICAgICAgYmxpbmtEZWxheSA9IHByZWZzLmdldCAnY3Vyc29yQmxpbmtEZWxheScgWzgwMCwyMDBdXG4gICAgICAgIEBzdXNwZW5kVGltZXIgPSBzZXRUaW1lb3V0IEByZWxlYXNlQmxpbmssIGJsaW5rRGVsYXlbMF1cblxuICAgIHJlbGVhc2VCbGluazogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQHN1c3BlbmRUaW1lclxuICAgICAgICBkZWxldGUgQHN1c3BlbmRUaW1lclxuICAgICAgICBAc3RhcnRCbGluaygpXG5cbiAgICB0b2dnbGVCbGluazogLT5cblxuICAgICAgICBibGluayA9IG5vdCBwcmVmcy5nZXQgJ2JsaW5rJyBmYWxzZVxuICAgICAgICBwcmVmcy5zZXQgJ2JsaW5rJyBibGlua1xuICAgICAgICBpZiBibGlua1xuICAgICAgICAgICAgQHN0YXJ0QmxpbmsoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc3RvcEJsaW5rKClcblxuICAgIGRvQmxpbms6ID0+XG5cbiAgICAgICAgQGJsaW5rID0gbm90IEBibGlua1xuICAgICAgICBcbiAgICAgICAgQGN1cnNvckRpdigpPy5jbGFzc0xpc3QudG9nZ2xlICdibGluaycgQGJsaW5rXG4gICAgICAgIEBtaW5pbWFwPy5kcmF3TWFpbkN1cnNvciBAYmxpbmtcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAYmxpbmtUaW1lclxuICAgICAgICBibGlua0RlbGF5ID0gcHJlZnMuZ2V0ICdjdXJzb3JCbGlua0RlbGF5JyBbODAwLDIwMF1cbiAgICAgICAgQGJsaW5rVGltZXIgPSBzZXRUaW1lb3V0IEBkb0JsaW5rLCBAYmxpbmsgYW5kIGJsaW5rRGVsYXlbMV0gb3IgYmxpbmtEZWxheVswXVxuXG4gICAgc3RhcnRCbGluazogLT4gXG4gICAgXG4gICAgICAgIGlmIG5vdCBAYmxpbmtUaW1lciBhbmQgcHJlZnMuZ2V0ICdibGluaydcbiAgICAgICAgICAgIEBkb0JsaW5rKCkgXG5cbiAgICBzdG9wQmxpbms6IC0+XG5cbiAgICAgICAgQGN1cnNvckRpdigpPy5jbGFzc0xpc3QudG9nZ2xlICdibGluaycgZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGNsZWFyVGltZW91dCBAYmxpbmtUaW1lclxuICAgICAgICBkZWxldGUgQGJsaW5rVGltZXJcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG4gICAgcmVzaXplZDogLT5cblxuICAgICAgICB2aCA9IEB2aWV3LnBhcmVudE5vZGUuY2xpZW50SGVpZ2h0XG5cbiAgICAgICAgcmV0dXJuIGlmIHZoIGFuZCB2aCA9PSBAc2Nyb2xsLnZpZXdIZWlnaHRcblxuICAgICAgICBAbnVtYmVycz8uZWxlbS5zdHlsZS5oZWlnaHQgPSBcIiN7QHNjcm9sbC5leHBvc2VOdW0gKiBAc2Nyb2xsLmxpbmVIZWlnaHR9cHhcIlxuICAgICAgICBAbGF5ZXJzV2lkdGggPSBAbGF5ZXJTY3JvbGwub2Zmc2V0V2lkdGhcblxuICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgdmhcblxuICAgICAgICBAZW1pdCAndmlld0hlaWdodCcgdmhcblxuICAgIHNjcmVlblNpemU6IC0+IGVsZWN0cm9uLnJlbW90ZS5zY3JlZW4uZ2V0UHJpbWFyeURpc3BsYXkoKS53b3JrQXJlYVNpemVcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgcG9zQXRYWTooeCx5KSAtPlxuXG4gICAgICAgIHNsID0gQGxheWVyU2Nyb2xsLnNjcm9sbExlZnRcbiAgICAgICAgc3QgPSBAc2Nyb2xsLm9mZnNldFRvcFxuICAgICAgICBiciA9IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIGx4ID0gY2xhbXAgMCwgQGxheWVycy5vZmZzZXRXaWR0aCwgIHggLSBici5sZWZ0IC0gQHNpemUub2Zmc2V0WCArIEBzaXplLmNoYXJXaWR0aC8zXG4gICAgICAgIGx5ID0gY2xhbXAgMCwgQGxheWVycy5vZmZzZXRIZWlnaHQsIHkgLSBici50b3BcbiAgICAgICAgcHggPSBwYXJzZUludChNYXRoLmZsb29yKChNYXRoLm1heCgwLCBzbCArIGx4KSkvQHNpemUuY2hhcldpZHRoKSlcbiAgICAgICAgcHkgPSBwYXJzZUludChNYXRoLmZsb29yKChNYXRoLm1heCgwLCBzdCArIGx5KSkvQHNpemUubGluZUhlaWdodCkpICsgQHNjcm9sbC50b3BcbiAgICAgICAgcCAgPSBbcHgsIE1hdGgubWluKEBudW1MaW5lcygpLTEsIHB5KV1cbiAgICAgICAgcFxuXG4gICAgcG9zRm9yRXZlbnQ6IChldmVudCkgLT4gQHBvc0F0WFkgZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WVxuXG4gICAgc3BhbkJlZm9yZU1haW46IC0+XG4gICAgICAgIFxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcbiAgICAgICAgeCA9IG1jWzBdXG4gICAgICAgIGlmIGxpbmVFbGVtID0gQGxpbmVEaXZzW21jWzFdXVxuICAgICAgICAgICAgZSA9IGxpbmVFbGVtLmZpcnN0Q2hpbGQubGFzdENoaWxkXG4gICAgICAgICAgICB3aGlsZSBlXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBlLnN0YXJ0XG4gICAgICAgICAgICAgICAgcmlnaHQgPSBlLnN0YXJ0K2UudGV4dENvbnRlbnQubGVuZ3RoIFxuICAgICAgICAgICAgICAgIGlmIHN0YXJ0IDw9IHggPD0gcmlnaHRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHggPiByaWdodFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZVxuICAgICAgICAgICAgICAgIGUgPSBlLnByZXZpb3VzU2libGluZ1xuICAgICAgICBudWxsXG4gICAgICAgIFxuICAgIG51bUZ1bGxMaW5lczogLT4gQHNjcm9sbC5mdWxsTGluZXNcbiAgICBcbiAgICB2aWV3SGVpZ2h0OiAtPiBcbiAgICAgICAgXG4gICAgICAgIGlmIEBzY3JvbGw/LnZpZXdIZWlnaHQgPj0gMCB0aGVuIHJldHVybiBAc2Nyb2xsLnZpZXdIZWlnaHRcbiAgICAgICAgQHZpZXc/LmNsaWVudEhlaWdodFxuXG4gICAgZm9jdXM6IC0+IEB2aWV3LmZvY3VzKClcblxuICAgICMgICAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuXG4gICAgaW5pdERyYWc6IC0+XG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGxheWVyU2Nyb2xsXG5cbiAgICAgICAgICAgIG9uU3RhcnQ6IChkcmFnLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAdmlldy5mb2N1cygpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGV2ZW50UG9zID0gQHBvc0ZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgICAgICAgICBpZiBldmVudC5idXR0b24gPT0gMlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NraXAnXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBldmVudC5idXR0b24gPT0gMVxuICAgICAgICAgICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdza2lwJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50XG4gICAgICAgICAgICAgICAgICAgIGlmIGlzU2FtZVBvcyBldmVudFBvcywgQGNsaWNrUG9zXG4gICAgICAgICAgICAgICAgICAgICAgICBAc3RhcnRDbGlja1RpbWVyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjbGlja0NvdW50ICs9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50ID09IDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZSA9IEByYW5nZUZvcldvcmRBdFBvcyBldmVudFBvc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXkgb3IgQHN0aWNreVNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkUmFuZ2VUb1NlbGVjdGlvbiByYW5nZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGhpZ2hsaWdodFdvcmRBbmRBZGRUb1NlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgQHNlbGVjdFNpbmdsZVJhbmdlIHJhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAY2xpY2tDb3VudCA9PSAzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IEByYW5nZUZvckxpbmVBdEluZGV4IEBjbGlja1Bvc1sxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGFkZFJhbmdlVG9TZWxlY3Rpb24gclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNlbGVjdFNpbmdsZVJhbmdlIHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAb25DbGlja1RpbWVvdXQoKVxuXG4gICAgICAgICAgICAgICAgQGNsaWNrQ291bnQgPSAxXG4gICAgICAgICAgICAgICAgQGNsaWNrUG9zID0gZXZlbnRQb3NcbiAgICAgICAgICAgICAgICBAc3RhcnRDbGlja1RpbWVyKClcblxuICAgICAgICAgICAgICAgIHAgPSBAcG9zRm9yRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBAY2xpY2tBdFBvcyBwLCBldmVudFxuXG4gICAgICAgICAgICBvbk1vdmU6IChkcmFnLCBldmVudCkgPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBwID0gQHBvc0ZvckV2ZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgICAgICAgICBAYWRkQ3Vyc29yQXRQb3MgW0BtYWluQ3Vyc29yKClbMF0sIHBbMV1dXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcCwgZXh0ZW5kOnRydWVcblxuICAgICAgICAgICAgb25TdG9wOiA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBzZWxlY3ROb25lKCkgaWYgQG51bVNlbGVjdGlvbnMoKSBhbmQgZW1wdHkgQHRleHRPZlNlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgIHN0YXJ0Q2xpY2tUaW1lcjogPT5cblxuICAgICAgICBjbGVhclRpbWVvdXQgQGNsaWNrVGltZXJcbiAgICAgICAgQGNsaWNrVGltZXIgPSBzZXRUaW1lb3V0IEBvbkNsaWNrVGltZW91dCwgQHN0aWNreVNlbGVjdGlvbiBhbmQgMzAwIG9yIDEwMDBcblxuICAgIG9uQ2xpY2tUaW1lb3V0OiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAY2xpY2tUaW1lclxuICAgICAgICBAY2xpY2tDb3VudCAgPSAwXG4gICAgICAgIEBjbGlja1RpbWVyICA9IG51bGxcbiAgICAgICAgQGNsaWNrUG9zICAgID0gbnVsbFxuXG4gICAgZnVuY0luZm9BdExpbmVJbmRleDogKGxpKSAtPlxuXG4gICAgICAgIGZpbGVzID0gcG9zdC5nZXQgJ2luZGV4ZXInICdmaWxlcycgQGN1cnJlbnRGaWxlXG4gICAgICAgIGZpbGVJbmZvID0gZmlsZXNbQGN1cnJlbnRGaWxlXVxuICAgICAgICBmb3IgZnVuYyBpbiBmaWxlSW5mby5mdW5jc1xuICAgICAgICAgICAgaWYgZnVuYy5saW5lIDw9IGxpIDw9IGZ1bmMubGFzdFxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jLmNsYXNzICsgJy4nICsgZnVuYy5uYW1lICsgJyAnXG4gICAgICAgICcnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY2xpY2tBdFBvczogKHAsIGV2ZW50KSAtPlxuXG4gICAgICAgIGlmIGV2ZW50LmFsdEtleVxuICAgICAgICAgICAgQHRvZ2dsZUN1cnNvckF0UG9zIHBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIHAsIGV4dGVuZDpldmVudC5zaGlmdEtleVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwreicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAZG8udW5kbygpXG4gICAgICAgICAgICB3aGVuICdjdHJsK3NoaWZ0K3onICAgICAgICAgdGhlbiByZXR1cm4gQGRvLnJlZG8oKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt4JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjdXQoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCtjJyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBjb3B5KClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrdicgICAgICAgICAgICAgICB0aGVuIHJldHVybiBAcGFzdGUoKVxuICAgICAgICAgICAgd2hlbiAnZXNjJ1xuICAgICAgICAgICAgICAgIGlmIEBudW1IaWdobGlnaHRzKCkgICAgIHRoZW4gcmV0dXJuIEBjbGVhckhpZ2hsaWdodHMoKVxuICAgICAgICAgICAgICAgIGlmIEBudW1DdXJzb3JzKCkgPiAxICAgIHRoZW4gcmV0dXJuIEBjbGVhckN1cnNvcnMoKVxuICAgICAgICAgICAgICAgIGlmIEBzdGlja3lTZWxlY3Rpb24gICAgIHRoZW4gcmV0dXJuIEBlbmRTdGlja3lTZWxlY3Rpb24oKVxuICAgICAgICAgICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKCkgICAgIHRoZW4gcmV0dXJuIEBzZWxlY3ROb25lKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYWN0aW9uIGluIEVkaXRvci5hY3Rpb25zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbi5jb21ibyA9PSBjb21ibyBvciBhY3Rpb24uYWNjZWwgPT0gY29tYm9cbiAgICAgICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAnY3RybCthJyAnY29tbWFuZCthJyB0aGVuIHJldHVybiBAc2VsZWN0QWxsKClcbiAgICAgICAgICAgICAgICBpZiBhY3Rpb24ua2V5PyBhbmQgXy5pc0Z1bmN0aW9uIEBbYWN0aW9uLmtleV1cbiAgICAgICAgICAgICAgICAgICAgQFthY3Rpb24ua2V5XSBrZXksIGNvbWJvOiBjb21ibywgbW9kOiBtb2QsIGV2ZW50OiBldmVudFxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGFjdGlvbi5hY2NlbHM/IGFuZCBvcy5wbGF0Zm9ybSgpICE9ICdkYXJ3aW4nXG4gICAgICAgICAgICAgICAgZm9yIGFjdGlvbkNvbWJvIGluIGFjdGlvbi5hY2NlbHNcbiAgICAgICAgICAgICAgICAgICAgaWYgY29tYm8gPT0gYWN0aW9uQ29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gQFthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBbYWN0aW9uLmtleV0ga2V5LCBjb21ibzogY29tYm8sIG1vZDogbW9kLCBldmVudDogZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBhY3Rpb24uY29tYm9zP1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgYWN0aW9uQ29tYm8gaW4gYWN0aW9uLmNvbWJvc1xuICAgICAgICAgICAgICAgIGlmIGNvbWJvID09IGFjdGlvbkNvbWJvXG4gICAgICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gQFthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgICAgICAgICAgQFthY3Rpb24ua2V5XSBrZXksIGNvbWJvOiBjb21ibywgbW9kOiBtb2QsIGV2ZW50OiBldmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgY2hhciBhbmQgbW9kIGluIFtcInNoaWZ0XCIgXCJcIl1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEBpbnNlcnRDaGFyYWN0ZXIgY2hhclxuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiAgICBvbktleURvd246IChldmVudCkgPT5cblxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHJldHVybiBpZiBub3QgY29tYm9cbiAgICAgICAgcmV0dXJuIGlmIGtleSA9PSAncmlnaHQgY2xpY2snICMgd2VpcmQgcmlnaHQgY29tbWFuZCBrZXlcblxuICAgICAgICByZXR1cm4gaWYgJ3VuaGFuZGxlZCcgIT0gQHRlcm0uaGFuZGxlS2V5IG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICByZXN1bHQgPSBAaGFuZGxlTW9kS2V5Q29tYm9DaGFyRXZlbnQgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudFxuXG4gICAgICAgIGlmICd1bmhhbmRsZWQnICE9IHJlc3VsdFxuICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dEVkaXRvclxuIl19
//# sourceURL=../../coffee/editor/texteditor.coffee