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
        this.onHorizontalScroll = bind(this.onHorizontalScroll, this);
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
        this.layerScroll.addEventListener('scroll', this.onHorizontalScroll);
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
        var ref1, ref2;
        if ((ref1 = this.scrollbar) != null) {
            ref1.del();
        }
        if ((ref2 = this.hrzntlbar) != null) {
            ref2.del();
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

    TextEditor.prototype.numColumns = function() {
        var cols, i, li, line, ref1, ref2;
        cols = 0;
        for (li = i = ref1 = this.scroll.top, ref2 = this.scroll.bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            line = this.line(li);
            cols = Math.max(line.length, cols);
        }
        return cols;
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
        var ref1, ref2, vh;
        vh = this.view.parentNode.clientHeight;
        this.layersWidth = this.layerScroll.offsetWidth;
        if ((ref1 = this.hrzntlbar) != null) {
            ref1.update();
        }
        if (vh && vh === this.scroll.viewHeight) {
            return;
        }
        if ((ref2 = this.numbers) != null) {
            ref2.elem.style.height = (this.scroll.exposeNum * this.scroll.lineHeight) + "px";
        }
        this.scroll.setViewHeight(vh);
        return this.emit('viewHeight', vh);
    };

    TextEditor.prototype.screenSize = function() {
        return electron.remote.screen.getPrimaryDisplay().workAreaSize;
    };

    TextEditor.prototype.onHorizontalScroll = function() {
        var ref1;
        return (ref1 = this.hrzntlbar) != null ? ref1.update() : void 0;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMElBQUE7SUFBQTs7Ozs7QUFRQSxNQUF3RixPQUFBLENBQVEsS0FBUixDQUF4RixFQUFFLGVBQUYsRUFBUSx5QkFBUixFQUFtQixxQkFBbkIsRUFBNEIsaUJBQTVCLEVBQW1DLGlCQUFuQyxFQUEwQyxpQkFBMUMsRUFBaUQsZUFBakQsRUFBdUQsZUFBdkQsRUFBNkQsZUFBN0QsRUFBbUUsV0FBbkUsRUFBdUUsbUJBQXZFLEVBQStFLFNBQS9FLEVBQWtGOztBQUVsRixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsWUFBQSxHQUFlLE9BQUEsQ0FBUSxnQkFBUjs7QUFDZixNQUFBLEdBQWUsT0FBQSxDQUFRLFVBQVI7O0FBQ2YsUUFBQSxHQUFlLE9BQUEsQ0FBUSxVQUFSOztBQUVUOzs7SUFFQyxvQkFBQyxJQUFELEVBQVEsTUFBUjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7Ozs7Ozs7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sUUFBTjtZQUFlLFFBQUEsRUFBUyxHQUF4QjtTQUFMO1FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVixDQUFzQixJQUFDLENBQUEsSUFBdkI7UUFFQSw0Q0FBTSxRQUFOLEVBQWUsTUFBZjtRQUVBLElBQUMsQ0FBQSxVQUFELEdBQWU7UUFFZixJQUFDLENBQUEsTUFBRCxHQUFlLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtTQUFMO1FBQ2YsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7WUFBcUIsS0FBQSxFQUFNLElBQUMsQ0FBQSxNQUE1QjtTQUFMO1FBQ2YsSUFB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ICAwMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgICAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgc3RvcEV2ZW50LCBrZXlpbmZvLCBwcmVmcywgY2xhbXAsIGVtcHR5LCBlbGVtLCBrc3RyLCBkcmFnLCBvcywga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG4gIFxucmVuZGVyICAgICAgID0gcmVxdWlyZSAnLi9yZW5kZXInXG5FZGl0b3JTY3JvbGwgPSByZXF1aXJlICcuL2VkaXRvcnNjcm9sbCdcbkVkaXRvciAgICAgICA9IHJlcXVpcmUgJy4vZWRpdG9yJ1xuZWxlY3Ryb24gICAgID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbmNsYXNzIFRleHRFZGl0b3IgZXh0ZW5kcyBFZGl0b3JcblxuICAgIEA6IChAdGVybSwgY29uZmlnKSAtPlxuXG4gICAgICAgIEB2aWV3ID0gZWxlbSBjbGFzczonZWRpdG9yJyB0YWJpbmRleDonMCdcbiAgICAgICAgQHRlcm0uZGl2LmFwcGVuZENoaWxkIEB2aWV3XG5cbiAgICAgICAgc3VwZXIgJ2VkaXRvcicgY29uZmlnXG5cbiAgICAgICAgQGNsaWNrQ291bnQgID0gMFxuXG4gICAgICAgIEBsYXllcnMgICAgICA9IGVsZW0gY2xhc3M6ICdsYXllcnMnXG4gICAgICAgIEBsYXllclNjcm9sbCA9IGVsZW0gY2xhc3M6ICdsYXllclNjcm9sbCcgY2hpbGQ6QGxheWVyc1xuICAgICAgICBAdmlldy5hcHBlbmRDaGlsZCBAbGF5ZXJTY3JvbGxcbiAgICAgICAgQGxheWVyU2Nyb2xsLmFkZEV2ZW50TGlzdGVuZXIgJ3Njcm9sbCcgQG9uSG9yaXpvbnRhbFNjcm9sbFxuXG4gICAgICAgIGxheWVyID0gW11cbiAgICAgICAgbGF5ZXIucHVzaCAnc2VsZWN0aW9ucydcbiAgICAgICAgbGF5ZXIucHVzaCAnaGlnaGxpZ2h0cydcbiAgICAgICAgbGF5ZXIucHVzaCAnbWV0YScgICAgaWYgJ01ldGEnIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgbGF5ZXIucHVzaCAnbGluZXMnXG4gICAgICAgIGxheWVyLnB1c2ggJ2N1cnNvcnMnXG4gICAgICAgIGxheWVyLnB1c2ggJ251bWJlcnMnIGlmICdOdW1iZXJzJyBpbiBAY29uZmlnLmZlYXR1cmVzXG4gICAgICAgIEBpbml0TGF5ZXJzIGxheWVyXG5cbiAgICAgICAgQHNpemUgPSB7fVxuICAgICAgICBAZWxlbSA9IEBsYXllckRpY3QubGluZXNcblxuICAgICAgICBAYW5zaUxpbmVzID0gW10gIyBvcmlnaW5hbCBhbnNpIGNvZGUgc3RyaW5nc1xuICAgICAgICBAc3BhbkNhY2hlID0gW10gIyBjYWNoZSBmb3IgcmVuZGVyZWQgbGluZSBzcGFuc1xuICAgICAgICBAbGluZURpdnMgID0ge30gIyBtYXBzIGxpbmUgbnVtYmVycyB0byBkaXNwbGF5ZWQgZGl2c1xuXG4gICAgICAgIEBzZXRGb250U2l6ZSBwcmVmcy5nZXQgXCJmb250U2l6ZVwiIEBjb25maWcuZm9udFNpemUgPyAxOFxuICAgICAgICBAc2Nyb2xsID0gbmV3IEVkaXRvclNjcm9sbCBAXG4gICAgICAgIEBzY3JvbGwub24gJ3NoaWZ0TGluZXMnIEBzaGlmdExpbmVzXG4gICAgICAgIEBzY3JvbGwub24gJ3Nob3dMaW5lcycgIEBzaG93TGluZXNcblxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdibHVyJyAgICAgQG9uQmx1clxuICAgICAgICBAdmlldy5hZGRFdmVudExpc3RlbmVyICdmb2N1cycgICAgQG9uRm9jdXNcbiAgICAgICAgQHZpZXcuYWRkRXZlbnRMaXN0ZW5lciAna2V5ZG93bicgIEBvbktleURvd25cblxuICAgICAgICBAaW5pdERyYWcoKVxuXG4gICAgICAgIGZvciBmZWF0dXJlIGluIEBjb25maWcuZmVhdHVyZXNcbiAgICAgICAgICAgIGlmIGZlYXR1cmUgPT0gJ0N1cnNvckxpbmUnXG4gICAgICAgICAgICAgICAgQGN1cnNvckxpbmUgPSBlbGVtICdkaXYnIGNsYXNzOidjdXJzb3ItbGluZSdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmZWF0dXJlTmFtZSA9IGZlYXR1cmUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgICAgICAgIGZlYXR1cmVDbHNzID0gcmVxdWlyZSBcIi4vI3tmZWF0dXJlTmFtZX1cIlxuICAgICAgICAgICAgICAgIEBbZmVhdHVyZU5hbWVdID0gbmV3IGZlYXR1cmVDbHNzIEBcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBkZWw6IC0+XG5cbiAgICAgICAgQHNjcm9sbGJhcj8uZGVsKClcbiAgICAgICAgQGhyem50bGJhcj8uZGVsKClcblxuICAgICAgICBAdmlldy5yZW1vdmVFdmVudExpc3RlbmVyICdrZXlkb3duJyBAb25LZXlEb3duXG4gICAgICAgIEB2aWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2JsdXInICAgIEBvbkJsdXJcbiAgICAgICAgQHZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lciAnZm9jdXMnICAgQG9uRm9jdXNcbiAgICAgICAgQHZpZXcuaW5uZXJIVE1MID0gJydcblxuICAgICAgICBzdXBlcigpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBpc0lucHV0Q3Vyc29yOiAtPlxuICAgICAgICBcbiAgICAgICAgQG1haW5DdXJzb3IoKVsxXSA+PSBAbnVtTGluZXMoKS0xXG4gICAgICAgIFxuICAgIHJlc3RvcmVJbnB1dEN1cnNvcjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBpc0lucHV0Q3Vyc29yKClcbiAgICAgICAgICAgIEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29sID0gQGlucHV0Q3Vyc29yID8gQGRvLmxpbmUoQG51bUxpbmVzKCktMSkubGVuZ3RoXG4gICAgICAgICAgICBbW2NvbCxAbnVtTGluZXMoKS0xXV1cbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgb25Gb2N1czogPT5cblxuICAgICAgICBAc3RhcnRCbGluaygpXG4gICAgICAgIEBlbWl0ICdmb2N1cycgQFxuICAgICAgICBwb3N0LmVtaXQgJ2VkaXRvckZvY3VzJyBAXG5cbiAgICBvbkJsdXI6ID0+XG5cbiAgICAgICAgQHN0b3BCbGluaygpXG4gICAgICAgIEBlbWl0ICdibHVyJyBAXG5cbiAgICAjIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIGluaXRMYXllcnM6IChsYXllckNsYXNzZXMpIC0+XG5cbiAgICAgICAgQGxheWVyRGljdCA9IHt9XG4gICAgICAgIGZvciBjbHMgaW4gbGF5ZXJDbGFzc2VzXG4gICAgICAgICAgICBAbGF5ZXJEaWN0W2Nsc10gPSBAYWRkTGF5ZXIgY2xzXG5cbiAgICBhZGRMYXllcjogKGNscykgLT5cblxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBjbHNcbiAgICAgICAgQGxheWVycy5hcHBlbmRDaGlsZCBkaXZcbiAgICAgICAgZGl2XG5cbiAgICB1cGRhdGVMYXllcnM6ICgpIC0+XG5cbiAgICAgICAgQHJlbmRlckhpZ2hsaWdodHMoKVxuICAgICAgICBAcmVuZGVyU2VsZWN0aW9uKClcbiAgICAgICAgQHJlbmRlckN1cnNvcnMoKVxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNsZWFyOiA9PiBAc2V0TGluZXMgWycnXVxuICAgIFxuICAgIHNldExpbmVzOiAobGluZXMpIC0+XG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGVtaXQgJ2NsZWFyTGluZXMnXG5cbiAgICAgICAgbGluZXMgPz0gW11cblxuICAgICAgICBAc3BhbkNhY2hlID0gW11cbiAgICAgICAgQGxpbmVEaXZzICA9IHt9XG4gICAgICAgIEBhbnNpTGluZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC5yZXNldCgpXG5cbiAgICAgICAgc3VwZXIgbGluZXNcblxuICAgICAgICB2aWV3SGVpZ2h0ID0gQHZpZXdIZWlnaHQoKVxuICAgICAgICBcbiAgICAgICAgQHNjcm9sbC5zdGFydCB2aWV3SGVpZ2h0LCBAbnVtTGluZXMoKVxuXG4gICAgICAgIEBsYXllclNjcm9sbC5zY3JvbGxMZWZ0ID0gMFxuICAgICAgICBAbGF5ZXJzV2lkdGggID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG4gICAgICAgIEBsYXllcnNIZWlnaHQgPSBAbGF5ZXJTY3JvbGwub2Zmc2V0SGVpZ2h0XG5cbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG4gICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBudW1Db2x1bW5zOiAtPlxuICAgICAgICBjb2xzID0gMFxuICAgICAgICBmb3IgbGkgaW4gW0BzY3JvbGwudG9wLi5Ac2Nyb2xsLmJvdF1cbiAgICAgICAgICAgIGxpbmUgPSBAbGluZSBsaVxuICAgICAgICAgICAgY29scyA9IE1hdGgubWF4IGxpbmUubGVuZ3RoLCBjb2xzXG4gICAgICAgIGNvbHNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhcHBlbmRUZXh0OiAodGV4dCkgLT5cblxuICAgICAgICBpZiBub3QgdGV4dD9cbiAgICAgICAgICAgIGxvZyBcIiN7QG5hbWV9LmFwcGVuZFRleHQgLSBubyB0ZXh0P1wiXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBhcHBlbmRlZCA9IFtdXG4gICAgICAgIGxzID0gdGV4dD8uc3BsaXQgL1xcbi9cblxuICAgICAgICBmb3IgbCBpbiBsc1xuICAgICAgICAgICAgQHN0YXRlID0gQHN0YXRlLmFwcGVuZExpbmUgbFxuICAgICAgICAgICAgYXBwZW5kZWQucHVzaCBAbnVtTGluZXMoKS0xXG5cbiAgICAgICAgaWYgQHNjcm9sbC52aWV3SGVpZ2h0ICE9IEB2aWV3SGVpZ2h0KClcbiAgICAgICAgICAgIEBzY3JvbGwuc2V0Vmlld0hlaWdodCBAdmlld0hlaWdodCgpXG5cbiAgICAgICAgc2hvd0xpbmVzID0gKEBzY3JvbGwuYm90IDwgQHNjcm9sbC50b3ApIG9yIChAc2Nyb2xsLmJvdCA8IEBzY3JvbGwudmlld0xpbmVzKVxuXG4gICAgICAgIEBzY3JvbGwuc2V0TnVtTGluZXMgQG51bUxpbmVzKCksIHNob3dMaW5lczpzaG93TGluZXNcblxuICAgICAgICBmb3IgbGkgaW4gYXBwZW5kZWRcbiAgICAgICAgICAgIEBlbWl0ICdsaW5lQXBwZW5kZWQnLCAjIG1ldGFcbiAgICAgICAgICAgICAgICBsaW5lSW5kZXg6IGxpXG4gICAgICAgICAgICAgICAgdGV4dDogQGxpbmUgbGlcblxuICAgICAgICBAZW1pdCAnbGluZXNBcHBlbmRlZCcgbHMgIyBhdXRvY29tcGxldGVcbiAgICAgICAgQGVtaXQgJ251bUxpbmVzJyBAbnVtTGluZXMoKSAjIG1pbmltYXBcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIGFwcGVuZE91dHB1dDogKHRleHQpIC0+XG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIGxzID0gdGV4dD8uc3BsaXQgL1xcbi9cblxuICAgICAgICBmb3IgbCBpbiBsc1xuICAgICAgICAgICAgc3RyaXBwZWQgPSBrc3RyLnN0cmlwQW5zaSBsXG4gICAgICAgICAgICBpZiBsICE9IHN0cmlwcGVkIFxuICAgICAgICAgICAgICAgIEBhbnNpTGluZXNbQGRvLm51bUxpbmVzKCktMV0gPSBsXG4gICAgICAgICAgICBAZG8uaW5zZXJ0IEBkby5udW1MaW5lcygpLTEsIHN0cmlwcGVkXG4gICAgICAgICAgICBcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgICAgICBAc2luZ2xlQ3Vyc29yQXRFbmQoKVxuICAgICAgICBAXG4gICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNldElucHV0VGV4dDogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0ID0gdGV4dC5zcGxpdCgnXFxuJylbMF1cbiAgICAgICAgdGV4dCA/PSAnJ1xuICAgICAgICBcbiAgICAgICAgbGkgPSBAbnVtTGluZXMoKS0xXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkZWxldGVDdXJzb3JMaW5lcygpXG4gICAgICAgICAgICBcbiAgICAgICAgc3RyaXBwZWQgPSBrc3RyLnN0cmlwQW5zaSB0ZXh0XG4gICAgICAgIGlmIHRleHQgIT0gc3RyaXBwZWQgXG4gICAgICAgICAgICBAYW5zaUxpbmVzW0Bkby5udW1MaW5lcygpLTFdID0gdGV4dFxuICAgICAgICBAZG8uY2hhbmdlIGxpLCBzdHJpcHBlZCAgICAgICAgICAgIFxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbW3N0cmlwcGVkLmxlbmd0aCwgbGldXVxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgYXBwZW5kSW5wdXRUZXh0OiAodGV4dCkgLT5cbiAgICAgICAgXG4gICAgICAgIGxpID0gQG51bUxpbmVzKCktMVxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBzdHJpcHBlZCA9IGtzdHIuc3RyaXBBbnNpIHRleHRcbiAgICAgICAgaWYgdGV4dCAhPSBzdHJpcHBlZCBcbiAgICAgICAgICAgIEBhbnNpTGluZXNbbGldID0gKEBhbnNpTGluZXNbbGldID8gJycpICsgdGV4dFxuICAgICAgICBuZXd0eHQgPSBAbGluZShsaSkgKyBzdHJpcHBlZFxuICAgICAgICBAZG8uY2hhbmdlIGxpLCBuZXd0eHQgICAgICAgICAgICBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgW1tuZXd0eHQubGVuZ3RoLCBsaV1dXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICByZXBsYWNlVGV4dEluTGluZTogKGxpLCB0ZXh0PScnKSAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLmNoYW5nZSBsaSwgdGV4dFxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHNldEZvbnRTaXplOiAoZm9udFNpemUpID0+XG4gICAgICAgIFxuICAgICAgICBAbGF5ZXJzLnN0eWxlLmZvbnRTaXplID0gXCIje2ZvbnRTaXplfXB4XCJcbiAgICAgICAgQHNpemUubnVtYmVyc1dpZHRoID0gJ051bWJlcnMnIGluIEBjb25maWcuZmVhdHVyZXMgYW5kIDM2IG9yIDBcbiAgICAgICAgQHNpemUuZm9udFNpemUgICAgID0gZm9udFNpemVcbiAgICAgICAgQHNpemUubGluZUhlaWdodCAgID0gZm9udFNpemUgKiAxLjIyXG4gICAgICAgIEBzaXplLmNoYXJXaWR0aCAgICA9IGZvbnRTaXplICogMC42XG4gICAgICAgICMga2xvZyBcImZvbnRTaXplICN7Zm9udFNpemV9ICN7QHNpemUuY2hhcldpZHRofSAje0BzaXplLmxpbmVIZWlnaHR9XCJcbiAgICAgICAgQHNpemUub2Zmc2V0WCAgICAgID0gTWF0aC5mbG9vciBAc2l6ZS5jaGFyV2lkdGggKyBAc2l6ZS5udW1iZXJzV2lkdGhcblxuICAgICAgICBAc2Nyb2xsPy5zZXRMaW5lSGVpZ2h0IEBzaXplLmxpbmVIZWlnaHRcbiAgICAgICAgaWYgQHRleHQoKSAjID8/P1xuICAgICAgICAgICAgYW5zaSA9IEBhbnNpVGV4dCgpXG4gICAgICAgICAgICBtZXRhcyA9IEBtZXRhLm1ldGFzXG4gICAgICAgICAgICBAdGVybS5jbGVhcigpXG4gICAgICAgICAgICBAYXBwZW5kT3V0cHV0IGFuc2lcbiAgICAgICAgICAgIGZvciBtZXRhIGluIG1ldGFzXG4gICAgICAgICAgICAgICAgbWV0YVsyXS5saW5lID0gbWV0YVswXVxuICAgICAgICAgICAgICAgIEBtZXRhLmFkZCBtZXRhWzJdXG5cbiAgICAgICAgQGVtaXQgJ2ZvbnRTaXplQ2hhbmdlZCdcblxuICAgIGFuc2lUZXh0OiAtPlxuICAgICAgICBcbiAgICAgICAgdGV4dCA9ICcnXG4gICAgICAgIGZvciBsaSBpbiBbMC4uLkBudW1MaW5lcygpLTFdXG4gICAgICAgICAgICB0ZXh0ICs9IEBhbnNpTGluZXNbbGldID8gQHN0YXRlLmxpbmUgbGlcbiAgICAgICAgICAgIHRleHQgKz0gJ1xcbidcbiAgICAgICAgdGV4dFsuLnRleHQubGVuZ3RoLTJdXG4gICAgICAgIFxuICAgIGFuc2lMaW5lOiAobGkpID0+IEBhbnNpTGluZXNbbGldXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBjaGFuZ2VkOiAoY2hhbmdlSW5mbykgLT5cblxuICAgICAgICBAc3ludGF4LmNoYW5nZWQgY2hhbmdlSW5mb1xuXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBbZGksbGksY2hdID0gW2NoYW5nZS5kb0luZGV4LCBjaGFuZ2UubmV3SW5kZXgsIGNoYW5nZS5jaGFuZ2VdXG4gICAgICAgICAgICBzd2l0Y2ggY2hcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdjaGFuZ2VkJ1xuICAgICAgICAgICAgICAgICAgICBAYW5zaUxpbmVzW2xpXSA9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgQHVwZGF0ZUxpbmUgbGksIGRpXG4gICAgICAgICAgICAgICAgICAgIEBlbWl0ICdsaW5lQ2hhbmdlZCcgbGlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd2hlbiAnZGVsZXRlZCdcbiAgICAgICAgICAgICAgICAgICAgQHNwYW5DYWNoZSA9IEBzcGFuQ2FjaGUuc2xpY2UgMCwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGFuc2lMaW5lcy5zcGxpY2UgZGksIDFcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVEZWxldGVkJyBkaVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3aGVuICdpbnNlcnRlZCdcbiAgICAgICAgICAgICAgICAgICAgQHNwYW5DYWNoZSA9IEBzcGFuQ2FjaGUuc2xpY2UgMCwgZGlcbiAgICAgICAgICAgICAgICAgICAgQGVtaXQgJ2xpbmVJbnNlcnRlZCcgbGksIGRpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5pbnNlcnRzIG9yIGNoYW5nZUluZm8uZGVsZXRlc1xuICAgICAgICAgICAgQGxheWVyc1dpZHRoID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG4gICAgICAgICAgICBAc2Nyb2xsLnNldE51bUxpbmVzIEBudW1MaW5lcygpXG4gICAgICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jaGFuZ2VzLmxlbmd0aFxuICAgICAgICAgICAgQGNsZWFySGlnaGxpZ2h0cygpXG5cbiAgICAgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzXG4gICAgICAgICAgICBAcmVuZGVyQ3Vyc29ycygpXG4gICAgICAgICAgICBAc2Nyb2xsLmN1cnNvckludG9WaWV3KClcbiAgICAgICAgICAgIEBlbWl0ICdjdXJzb3InXG4gICAgICAgICAgICBAc3VzcGVuZEJsaW5rKClcblxuICAgICAgICBpZiBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgICAgIEByZW5kZXJTZWxlY3Rpb24oKVxuICAgICAgICAgICAgQGVtaXQgJ3NlbGVjdGlvbidcblxuICAgICAgICBAZW1pdCAnY2hhbmdlZCcgY2hhbmdlSW5mb1xuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICBcbiAgICB1cGRhdGVMaW5lOiAobGksIG9pKSAtPlxuXG4gICAgICAgIG9pID0gbGkgaWYgbm90IG9pP1xuXG4gICAgICAgIGlmIGxpIDwgQHNjcm9sbC50b3Agb3IgbGkgPiBAc2Nyb2xsLmJvdFxuICAgICAgICAgICAga2Vycm9yIFwiZGFuZ2xpbmcgbGluZSBkaXY/ICN7bGl9XCIgQGxpbmVEaXZzW2xpXSBpZiBAbGluZURpdnNbbGldP1xuICAgICAgICAgICAgZGVsZXRlIEBzcGFuQ2FjaGVbbGldXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4ga2Vycm9yIFwidXBkYXRlTGluZSAtIG91dCBvZiBib3VuZHM/IGxpICN7bGl9IG9pICN7b2l9XCIgaWYgbm90IEBsaW5lRGl2c1tvaV1cbiAgICAgICAgXG4gICAgICAgIEBzcGFuQ2FjaGVbbGldID0gQHJlbmRlclNwYW4gbGlcblxuICAgICAgICBkaXYgPSBAbGluZURpdnNbb2ldXG4gICAgICAgIGRpdi5yZXBsYWNlQ2hpbGQgQHNwYW5DYWNoZVtsaV0sIGRpdi5maXJzdENoaWxkXG4gICAgICAgIFxuICAgIHJlZnJlc2hMaW5lczogKHRvcCwgYm90KSAtPlxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuICAgICAgICAgICAgQHN5bnRheC5nZXREaXNzIGxpLCB0cnVlXG4gICAgICAgICAgICBAdXBkYXRlTGluZSBsaVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzaG93TGluZXM6ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cbiAgICAgICAgICAgIEBhcHBlbmRMaW5lIGxpXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuICAgICAgICBAdXBkYXRlTGF5ZXJzKClcbiAgICAgICAgQGVtaXQgJ2xpbmVzRXhwb3NlZCcgdG9wOnRvcCwgYm90OmJvdCwgbnVtOm51bVxuICAgICAgICBAZW1pdCAnbGluZXNTaG93bicgdG9wLCBib3QsIG51bVxuXG4gICAgYXBwZW5kTGluZTogKGxpKSAtPlxuXG4gICAgICAgIEBsaW5lRGl2c1tsaV0gPSBlbGVtIGNsYXNzOidsaW5lJ1xuICAgICAgICBAbGluZURpdnNbbGldLmFwcGVuZENoaWxkIEBjYWNoZWRTcGFuIGxpXG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIEBsaW5lRGl2c1tsaV1cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzaGlmdExpbmVzOiAodG9wLCBib3QsIG51bSkgPT5cbiAgICAgICAgXG4gICAgICAgIG9sZFRvcCA9IHRvcCAtIG51bVxuICAgICAgICBvbGRCb3QgPSBib3QgLSBudW1cblxuICAgICAgICBkaXZJbnRvID0gKGxpLGxvKSA9PlxuXG4gICAgICAgICAgICBpZiBub3QgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgICAgIGtlcnJvciBcIiN7QG5hbWV9LnNoaWZ0TGluZXMuZGl2SW50byAtIG5vIGRpdj8gI3t0b3B9ICN7Ym90fSAje251bX0gb2xkICN7b2xkVG9wfSAje29sZEJvdH0gbG8gI3tsb30gbGkgI3tsaX1cIlxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBAbGluZURpdnNbbGldID0gQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgZGVsZXRlIEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0ucmVwbGFjZUNoaWxkIEBjYWNoZWRTcGFuKGxpKSwgQGxpbmVEaXZzW2xpXS5maXJzdENoaWxkXG5cbiAgICAgICAgICAgIGlmIEBzaG93SW52aXNpYmxlc1xuICAgICAgICAgICAgICAgIHR4ID0gQGxpbmUobGkpLmxlbmd0aCAqIEBzaXplLmNoYXJXaWR0aCArIDFcbiAgICAgICAgICAgICAgICBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6XCJpbnZpc2libGUgbmV3bGluZVwiIGh0bWw6JyYjOTY4NydcbiAgICAgICAgICAgICAgICBzcGFuLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKCN7dHh9cHgsIC0xLjVweClcIlxuICAgICAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0uYXBwZW5kQ2hpbGQgc3BhblxuXG4gICAgICAgIGlmIG51bSA+IDBcbiAgICAgICAgICAgIHdoaWxlIG9sZEJvdCA8IGJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCArPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRCb3QsIG9sZFRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCArPSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIG9sZFRvcCA+IHRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCAtPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRUb3AsIG9sZEJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCAtPSAxXG5cbiAgICAgICAgQGVtaXQgJ2xpbmVzU2hpZnRlZCcgdG9wLCBib3QsIG51bVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcbiAgICAgICAgQHVwZGF0ZUxheWVycygpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlTGluZVBvc2l0aW9uczogKGFuaW1hdGU9MCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBsaSwgZGl2IG9mIEBsaW5lRGl2c1xuICAgICAgICAgICAgaWYgbm90IGRpdj8gb3Igbm90IGRpdi5zdHlsZT9cbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBkaXY/IHN0eWxlPycgZGl2PywgZGl2Py5zdHlsZT9cbiAgICAgICAgICAgIHkgPSBAc2l6ZS5saW5lSGVpZ2h0ICogKGxpIC0gQHNjcm9sbC50b3ApXG4gICAgICAgICAgICBkaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUzZCgje0BzaXplLm9mZnNldFh9cHgsI3t5fXB4LCAwKVwiXG4gICAgICAgICAgICBkaXYuc3R5bGUudHJhbnNpdGlvbiA9IFwiYWxsICN7YW5pbWF0ZS8xMDAwfXNcIiBpZiBhbmltYXRlXG4gICAgICAgICAgICBkaXYuc3R5bGUuekluZGV4ID0gbGlcblxuICAgICAgICBpZiBhbmltYXRlXG4gICAgICAgICAgICByZXNldFRyYW5zID0gPT5cbiAgICAgICAgICAgICAgICBmb3IgYyBpbiBAZWxlbS5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBjLnN0eWxlLnRyYW5zaXRpb24gPSAnaW5pdGlhbCdcbiAgICAgICAgICAgIHNldFRpbWVvdXQgcmVzZXRUcmFucywgYW5pbWF0ZVxuXG4gICAgdXBkYXRlTGluZXM6ICgpIC0+XG5cbiAgICAgICAgZm9yIGxpIGluIFtAc2Nyb2xsLnRvcC4uQHNjcm9sbC5ib3RdXG4gICAgICAgICAgICBAdXBkYXRlTGluZSBsaVxuXG4gICAgY2xlYXJIaWdobGlnaHRzOiAoKSAtPlxuXG4gICAgICAgIGlmIEBudW1IaWdobGlnaHRzKClcbiAgICAgICAgICAgICQoJy5oaWdobGlnaHRzJyBAbGF5ZXJzKS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICAgICAgc3VwZXIoKVxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDBcblxuICAgIHJlbmRlclNwYW46IChsaSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBhbnNpTGluZXNbbGldPy5sZW5ndGhcbiAgICAgICAgICAgIGFuc2kgPSBuZXcga3N0ci5hbnNpXG4gICAgICAgICAgICBkaXNzID0gYW5zaS5kaXNzZWN0KEBhbnNpTGluZXNbbGldKVsxXVxuICAgICAgICAgICAgc3BhbiA9IHJlbmRlci5saW5lU3BhbiBkaXNzLCBAc2l6ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzcGFuID0gcmVuZGVyLmxpbmVTcGFuIEBzeW50YXguZ2V0RGlzcyhsaSksIEBzaXplXG4gICAgXG4gICAgY2FjaGVkU3BhbjogKGxpKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAc3BhbkNhY2hlW2xpXVxuXG4gICAgICAgICAgICBAc3BhbkNhY2hlW2xpXSA9IEByZW5kZXJTcGFuIGxpXG5cbiAgICAgICAgQHNwYW5DYWNoZVtsaV1cblxuICAgIHJlbmRlckN1cnNvcnM6IC0+XG5cbiAgICAgICAgY3MgPSBbXVxuICAgICAgICBmb3IgYyBpbiBAY3Vyc29ycygpXG4gICAgICAgICAgICBpZiBjWzFdID49IEBzY3JvbGwudG9wIGFuZCBjWzFdIDw9IEBzY3JvbGwuYm90XG4gICAgICAgICAgICAgICAgY3MucHVzaCBbY1swXSwgY1sxXSAtIEBzY3JvbGwudG9wXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBtYyA9IEBtYWluQ3Vyc29yKClcblxuICAgICAgICBpZiBAbnVtQ3Vyc29ycygpID09IDFcblxuICAgICAgICAgICAgaWYgY3MubGVuZ3RoID09IDFcblxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBtY1sxXSA8IDBcblxuICAgICAgICAgICAgICAgIGlmIG1jWzFdID4gQG51bUxpbmVzKCktMVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiI3tAbmFtZX0ucmVuZGVyQ3Vyc29ycyBtYWluQ3Vyc29yIERBRlVLP1wiIEBudW1MaW5lcygpLCBrc3RyIEBtYWluQ3Vyc29yKClcblxuICAgICAgICAgICAgICAgIHJpID0gbWNbMV0tQHNjcm9sbC50b3BcbiAgICAgICAgICAgICAgICBjdXJzb3JMaW5lID0gQHN0YXRlLmxpbmUobWNbMV0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gbWFpbiBjdXJzb3IgbGluZT8nIGlmIG5vdCBjdXJzb3JMaW5lP1xuICAgICAgICAgICAgICAgIGlmIG1jWzBdID4gY3Vyc29yTGluZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgY3NbMF1bMl0gPSAndmlydHVhbCdcbiAgICAgICAgICAgICAgICAgICAgY3MucHVzaCBbY3Vyc29yTGluZS5sZW5ndGgsIHJpLCAnbWFpbiBvZmYnXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY3NbMF1bMl0gPSAnbWFpbiBvZmYnXG5cbiAgICAgICAgZWxzZSBpZiBAbnVtQ3Vyc29ycygpID4gMVxuXG4gICAgICAgICAgICB2YyA9IFtdICMgdmlydHVhbCBjdXJzb3JzXG4gICAgICAgICAgICBmb3IgYyBpbiBjc1xuICAgICAgICAgICAgICAgIGlmIGlzU2FtZVBvcyBAbWFpbkN1cnNvcigpLCBbY1swXSwgY1sxXSArIEBzY3JvbGwudG9wXVxuICAgICAgICAgICAgICAgICAgICBjWzJdID0gJ21haW4nXG4gICAgICAgICAgICAgICAgbGluZSA9IEBsaW5lKEBzY3JvbGwudG9wK2NbMV0pXG4gICAgICAgICAgICAgICAgaWYgY1swXSA+IGxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHZjLnB1c2ggW2xpbmUubGVuZ3RoLCBjWzFdLCAndmlydHVhbCddXG4gICAgICAgICAgICBjcyA9IGNzLmNvbmNhdCB2Y1xuXG4gICAgICAgIGh0bWwgPSByZW5kZXIuY3Vyc29ycyBjcywgQHNpemVcbiAgICAgICAgQGxheWVyRGljdC5jdXJzb3JzLmlubmVySFRNTCA9IGh0bWxcbiAgICAgICAgXG4gICAgICAgIHR5ID0gKG1jWzFdIC0gQHNjcm9sbC50b3ApICogQHNpemUubGluZUhlaWdodFxuICAgICAgICBcbiAgICAgICAgaWYgQGN1cnNvckxpbmVcbiAgICAgICAgICAgIEBjdXJzb3JMaW5lLnN0eWxlID0gXCJ6LWluZGV4OjA7dHJhbnNmb3JtOnRyYW5zbGF0ZTNkKDAsI3t0eX1weCwwKTsgaGVpZ2h0OiN7QHNpemUubGluZUhlaWdodH1weDt3aWR0aDoxMDAlO1wiXG4gICAgICAgICAgICBAbGF5ZXJzLmluc2VydEJlZm9yZSBAY3Vyc29yTGluZSwgQGxheWVycy5maXJzdENoaWxkXG5cbiAgICByZW5kZXJTZWxlY3Rpb246IC0+XG5cbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgaWYgcyA9IEBzZWxlY3Rpb25zSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXggW0BzY3JvbGwudG9wLCBAc2Nyb2xsLmJvdF0sIEBzY3JvbGwudG9wXG4gICAgICAgICAgICBoICs9IHJlbmRlci5zZWxlY3Rpb24gcywgQHNpemVcbiAgICAgICAgQGxheWVyRGljdC5zZWxlY3Rpb25zLmlubmVySFRNTCA9IGhcblxuICAgIHJlbmRlckhpZ2hsaWdodHM6IC0+XG5cbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgaWYgcyA9IEBoaWdobGlnaHRzSW5MaW5lSW5kZXhSYW5nZVJlbGF0aXZlVG9MaW5lSW5kZXggW0BzY3JvbGwudG9wLCBAc2Nyb2xsLmJvdF0sIEBzY3JvbGwudG9wXG4gICAgICAgICAgICBoICs9IHJlbmRlci5zZWxlY3Rpb24gcywgQHNpemUsIFwiaGlnaGxpZ2h0XCJcbiAgICAgICAgQGxheWVyRGljdC5oaWdobGlnaHRzLmlubmVySFRNTCA9IGhcblxuICAgICMgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgY3Vyc29yRGl2OiAtPiAkICcuY3Vyc29yLm1haW4nIEBsYXllckRpY3RbJ2N1cnNvcnMnXVxuXG4gICAgc3VzcGVuZEJsaW5rOiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGJsaW5rVGltZXJcbiAgICAgICAgQHN0b3BCbGluaygpXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIGZhbHNlXG4gICAgICAgIGNsZWFyVGltZW91dCBAc3VzcGVuZFRpbWVyXG4gICAgICAgIGJsaW5rRGVsYXkgPSBwcmVmcy5nZXQgJ2N1cnNvckJsaW5rRGVsYXknIFs4MDAsMjAwXVxuICAgICAgICBAc3VzcGVuZFRpbWVyID0gc2V0VGltZW91dCBAcmVsZWFzZUJsaW5rLCBibGlua0RlbGF5WzBdXG5cbiAgICByZWxlYXNlQmxpbms6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBzdXNwZW5kVGltZXJcbiAgICAgICAgZGVsZXRlIEBzdXNwZW5kVGltZXJcbiAgICAgICAgQHN0YXJ0QmxpbmsoKVxuXG4gICAgdG9nZ2xlQmxpbms6IC0+XG5cbiAgICAgICAgYmxpbmsgPSBub3QgcHJlZnMuZ2V0ICdibGluaycgZmFsc2VcbiAgICAgICAgcHJlZnMuc2V0ICdibGluaycgYmxpbmtcbiAgICAgICAgaWYgYmxpbmtcbiAgICAgICAgICAgIEBzdGFydEJsaW5rKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHN0b3BCbGluaygpXG5cbiAgICBkb0JsaW5rOiA9PlxuXG4gICAgICAgIEBibGluayA9IG5vdCBAYmxpbmtcbiAgICAgICAgXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIEBibGlua1xuICAgICAgICBAbWluaW1hcD8uZHJhd01haW5DdXJzb3IgQGJsaW5rXG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQGJsaW5rVGltZXJcbiAgICAgICAgYmxpbmtEZWxheSA9IHByZWZzLmdldCAnY3Vyc29yQmxpbmtEZWxheScgWzgwMCwyMDBdXG4gICAgICAgIEBibGlua1RpbWVyID0gc2V0VGltZW91dCBAZG9CbGluaywgQGJsaW5rIGFuZCBibGlua0RlbGF5WzFdIG9yIGJsaW5rRGVsYXlbMF1cblxuICAgIHN0YXJ0Qmxpbms6IC0+IFxuICAgIFxuICAgICAgICBpZiBub3QgQGJsaW5rVGltZXIgYW5kIHByZWZzLmdldCAnYmxpbmsnXG4gICAgICAgICAgICBAZG9CbGluaygpIFxuXG4gICAgc3RvcEJsaW5rOiAtPlxuXG4gICAgICAgIEBjdXJzb3JEaXYoKT8uY2xhc3NMaXN0LnRvZ2dsZSAnYmxpbmsnIGZhbHNlXG4gICAgICAgIFxuICAgICAgICBjbGVhclRpbWVvdXQgQGJsaW5rVGltZXJcbiAgICAgICAgZGVsZXRlIEBibGlua1RpbWVyXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIHJlc2l6ZWQ6IC0+XG5cbiAgICAgICAgdmggPSBAdmlldy5wYXJlbnROb2RlLmNsaWVudEhlaWdodFxuICAgICAgICBcbiAgICAgICAgQGxheWVyc1dpZHRoID0gQGxheWVyU2Nyb2xsLm9mZnNldFdpZHRoXG4gICAgICAgIFxuICAgICAgICBAaHJ6bnRsYmFyPy51cGRhdGUoKVxuXG4gICAgICAgIHJldHVybiBpZiB2aCBhbmQgdmggPT0gQHNjcm9sbC52aWV3SGVpZ2h0XG5cbiAgICAgICAgQG51bWJlcnM/LmVsZW0uc3R5bGUuaGVpZ2h0ID0gXCIje0BzY3JvbGwuZXhwb3NlTnVtICogQHNjcm9sbC5saW5lSGVpZ2h0fXB4XCJcblxuICAgICAgICBAc2Nyb2xsLnNldFZpZXdIZWlnaHQgdmhcblxuICAgICAgICBAZW1pdCAndmlld0hlaWdodCcgdmhcblxuICAgIHNjcmVlblNpemU6IC0+IGVsZWN0cm9uLnJlbW90ZS5zY3JlZW4uZ2V0UHJpbWFyeURpc3BsYXkoKS53b3JrQXJlYVNpemVcblxuICAgIG9uSG9yaXpvbnRhbFNjcm9sbDogPT5cbiAgICAgICAgXG4gICAgICAgIEBocnpudGxiYXI/LnVwZGF0ZSgpXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBwb3NBdFhZOih4LHkpIC0+XG5cbiAgICAgICAgc2wgPSBAbGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdFxuICAgICAgICBzdCA9IEBzY3JvbGwub2Zmc2V0VG9wXG4gICAgICAgIGJyID0gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgbHggPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldFdpZHRoLCAgeCAtIGJyLmxlZnQgLSBAc2l6ZS5vZmZzZXRYICsgQHNpemUuY2hhcldpZHRoLzNcbiAgICAgICAgbHkgPSBjbGFtcCAwLCBAbGF5ZXJzLm9mZnNldEhlaWdodCwgeSAtIGJyLnRvcFxuICAgICAgICBweCA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHNsICsgbHgpKS9Ac2l6ZS5jaGFyV2lkdGgpKVxuICAgICAgICBweSA9IHBhcnNlSW50KE1hdGguZmxvb3IoKE1hdGgubWF4KDAsIHN0ICsgbHkpKS9Ac2l6ZS5saW5lSGVpZ2h0KSkgKyBAc2Nyb2xsLnRvcFxuICAgICAgICBwICA9IFtweCwgTWF0aC5taW4oQG51bUxpbmVzKCktMSwgcHkpXVxuICAgICAgICBwXG5cbiAgICBwb3NGb3JFdmVudDogKGV2ZW50KSAtPiBAcG9zQXRYWSBldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZXG5cbiAgICBzcGFuQmVmb3JlTWFpbjogLT5cbiAgICAgICAgXG4gICAgICAgIG1jID0gQG1haW5DdXJzb3IoKVxuICAgICAgICB4ID0gbWNbMF1cbiAgICAgICAgaWYgbGluZUVsZW0gPSBAbGluZURpdnNbbWNbMV1dXG4gICAgICAgICAgICBlID0gbGluZUVsZW0uZmlyc3RDaGlsZC5sYXN0Q2hpbGRcbiAgICAgICAgICAgIHdoaWxlIGVcbiAgICAgICAgICAgICAgICBzdGFydCA9IGUuc3RhcnRcbiAgICAgICAgICAgICAgICByaWdodCA9IGUuc3RhcnQrZS50ZXh0Q29udGVudC5sZW5ndGggXG4gICAgICAgICAgICAgICAgaWYgc3RhcnQgPD0geCA8PSByaWdodFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgeCA+IHJpZ2h0XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlXG4gICAgICAgICAgICAgICAgZSA9IGUucHJldmlvdXNTaWJsaW5nXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgbnVtRnVsbExpbmVzOiAtPiBAc2Nyb2xsLmZ1bGxMaW5lc1xuICAgIFxuICAgIHZpZXdIZWlnaHQ6IC0+IFxuICAgICAgICBcbiAgICAgICAgaWYgQHNjcm9sbD8udmlld0hlaWdodCA+PSAwIHRoZW4gcmV0dXJuIEBzY3JvbGwudmlld0hlaWdodFxuICAgICAgICBAdmlldz8uY2xpZW50SGVpZ2h0XG5cbiAgICBmb2N1czogLT4gQHZpZXcuZm9jdXMoKVxuXG4gICAgIyAgIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDBcbiAgICAjICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBpbml0RHJhZzogLT5cblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAbGF5ZXJTY3JvbGxcblxuICAgICAgICAgICAgb25TdGFydDogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEB2aWV3LmZvY3VzKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZXZlbnRQb3MgPSBAcG9zRm9yRXZlbnQgZXZlbnRcblxuICAgICAgICAgICAgICAgIGlmIGV2ZW50LmJ1dHRvbiA9PSAyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnc2tpcCdcbiAgICAgICAgICAgICAgICBlbHNlIGlmIGV2ZW50LmJ1dHRvbiA9PSAxXG4gICAgICAgICAgICAgICAgICAgIHN0b3BFdmVudCBldmVudFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ3NraXAnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnRcbiAgICAgICAgICAgICAgICAgICAgaWYgaXNTYW1lUG9zIGV2ZW50UG9zLCBAY2xpY2tQb3NcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzdGFydENsaWNrVGltZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNsaWNrQ291bnQgKz0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGNsaWNrQ291bnQgPT0gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlID0gQHJhbmdlRm9yV29yZEF0UG9zIGV2ZW50UG9zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleSBvciBAc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBhZGRSYW5nZVRvU2VsZWN0aW9uIHJhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAaGlnaGxpZ2h0V29yZEFuZEFkZFRvU2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBAc2VsZWN0U2luZ2xlUmFuZ2UgcmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBjbGlja0NvdW50ID09IDNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByID0gQHJhbmdlRm9yTGluZUF0SW5kZXggQGNsaWNrUG9zWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZXZlbnQubWV0YUtleVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAYWRkUmFuZ2VUb1NlbGVjdGlvbiByXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2VsZWN0U2luZ2xlUmFuZ2UgclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBvbkNsaWNrVGltZW91dCgpXG5cbiAgICAgICAgICAgICAgICBAY2xpY2tDb3VudCA9IDFcbiAgICAgICAgICAgICAgICBAY2xpY2tQb3MgPSBldmVudFBvc1xuICAgICAgICAgICAgICAgIEBzdGFydENsaWNrVGltZXIoKVxuXG4gICAgICAgICAgICAgICAgcCA9IEBwb3NGb3JFdmVudCBldmVudFxuICAgICAgICAgICAgICAgIEBjbGlja0F0UG9zIHAsIGV2ZW50XG5cbiAgICAgICAgICAgIG9uTW92ZTogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHAgPSBAcG9zRm9yRXZlbnQgZXZlbnRcbiAgICAgICAgICAgICAgICBpZiBldmVudC5tZXRhS2V5XG4gICAgICAgICAgICAgICAgICAgIEBhZGRDdXJzb3JBdFBvcyBbQG1haW5DdXJzb3IoKVswXSwgcFsxXV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBzaW5nbGVDdXJzb3JBdFBvcyBwLCBleHRlbmQ6dHJ1ZVxuXG4gICAgICAgICAgICBvblN0b3A6ID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHNlbGVjdE5vbmUoKSBpZiBAbnVtU2VsZWN0aW9ucygpIGFuZCBlbXB0eSBAdGV4dE9mU2VsZWN0aW9uKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgc3RhcnRDbGlja1RpbWVyOiA9PlxuXG4gICAgICAgIGNsZWFyVGltZW91dCBAY2xpY2tUaW1lclxuICAgICAgICBAY2xpY2tUaW1lciA9IHNldFRpbWVvdXQgQG9uQ2xpY2tUaW1lb3V0LCBAc3RpY2t5U2VsZWN0aW9uIGFuZCAzMDAgb3IgMTAwMFxuXG4gICAgb25DbGlja1RpbWVvdXQ6ID0+XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0IEBjbGlja1RpbWVyXG4gICAgICAgIEBjbGlja0NvdW50ICA9IDBcbiAgICAgICAgQGNsaWNrVGltZXIgID0gbnVsbFxuICAgICAgICBAY2xpY2tQb3MgICAgPSBudWxsXG5cbiAgICBmdW5jSW5mb0F0TGluZUluZGV4OiAobGkpIC0+XG5cbiAgICAgICAgZmlsZXMgPSBwb3N0LmdldCAnaW5kZXhlcicgJ2ZpbGVzJyBAY3VycmVudEZpbGVcbiAgICAgICAgZmlsZUluZm8gPSBmaWxlc1tAY3VycmVudEZpbGVdXG4gICAgICAgIGZvciBmdW5jIGluIGZpbGVJbmZvLmZ1bmNzXG4gICAgICAgICAgICBpZiBmdW5jLmxpbmUgPD0gbGkgPD0gZnVuYy5sYXN0XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMuY2xhc3MgKyAnLicgKyBmdW5jLm5hbWUgKyAnICdcbiAgICAgICAgJydcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGlja0F0UG9zOiAocCwgZXZlbnQpIC0+XG5cbiAgICAgICAgaWYgZXZlbnQuYWx0S2V5XG4gICAgICAgICAgICBAdG9nZ2xlQ3Vyc29yQXRQb3MgcFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2luZ2xlQ3Vyc29yQXRQb3MgcCwgZXh0ZW5kOmV2ZW50LnNoaWZ0S2V5XG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudDogKG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnY3RybCt6JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBkby51bmRvKClcbiAgICAgICAgICAgIHdoZW4gJ2N0cmwrc2hpZnQreicgICAgICAgICB0aGVuIHJldHVybiBAZG8ucmVkbygpXG4gICAgICAgICAgICB3aGVuICdjdHJsK3gnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGN1dCgpXG4gICAgICAgICAgICB3aGVuICdjdHJsK2MnICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gQGNvcHkoKVxuICAgICAgICAgICAgd2hlbiAnY3RybCt2JyAgICAgICAgICAgICAgIHRoZW4gcmV0dXJuIEBwYXN0ZSgpXG4gICAgICAgICAgICB3aGVuICdlc2MnXG4gICAgICAgICAgICAgICAgaWYgQG51bUhpZ2hsaWdodHMoKSAgICAgdGhlbiByZXR1cm4gQGNsZWFySGlnaGxpZ2h0cygpXG4gICAgICAgICAgICAgICAgaWYgQG51bUN1cnNvcnMoKSA+IDEgICAgdGhlbiByZXR1cm4gQGNsZWFyQ3Vyc29ycygpXG4gICAgICAgICAgICAgICAgaWYgQHN0aWNreVNlbGVjdGlvbiAgICAgdGhlbiByZXR1cm4gQGVuZFN0aWNreVNlbGVjdGlvbigpXG4gICAgICAgICAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSAgICAgdGhlbiByZXR1cm4gQHNlbGVjdE5vbmUoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBhY3Rpb24gaW4gRWRpdG9yLmFjdGlvbnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYWN0aW9uLmNvbWJvID09IGNvbWJvIG9yIGFjdGlvbi5hY2NlbCA9PSBjb21ib1xuICAgICAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgICAgICB3aGVuICdjdHJsK2EnICdjb21tYW5kK2EnIHRoZW4gcmV0dXJuIEBzZWxlY3RBbGwoKVxuICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5rZXk/IGFuZCBfLmlzRnVuY3Rpb24gQFthY3Rpb24ua2V5XVxuICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIHJldHVybiAndW5oYW5kbGVkJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYWN0aW9uLmFjY2Vscz8gYW5kIG9zLnBsYXRmb3JtKCkgIT0gJ2RhcndpbidcbiAgICAgICAgICAgICAgICBmb3IgYWN0aW9uQ29tYm8gaW4gYWN0aW9uLmFjY2Vsc1xuICAgICAgICAgICAgICAgICAgICBpZiBjb21ibyA9PSBhY3Rpb25Db21ib1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiBAW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQFthY3Rpb24ua2V5XSBrZXksIGNvbWJvOiBjb21ibywgbW9kOiBtb2QsIGV2ZW50OiBldmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY29udGludWUgaWYgbm90IGFjdGlvbi5jb21ib3M/XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBhY3Rpb25Db21ibyBpbiBhY3Rpb24uY29tYm9zXG4gICAgICAgICAgICAgICAgaWYgY29tYm8gPT0gYWN0aW9uQ29tYm9cbiAgICAgICAgICAgICAgICAgICAgaWYgYWN0aW9uLmtleT8gYW5kIF8uaXNGdW5jdGlvbiBAW2FjdGlvbi5rZXldXG4gICAgICAgICAgICAgICAgICAgICAgICBAW2FjdGlvbi5rZXldIGtleSwgY29tYm86IGNvbWJvLCBtb2Q6IG1vZCwgZXZlbnQ6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBjaGFyIGFuZCBtb2QgaW4gW1wic2hpZnRcIiBcIlwiXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gQGluc2VydENoYXJhY3RlciBjaGFyXG5cbiAgICAgICAgJ3VuaGFuZGxlZCdcblxuICAgIG9uS2V5RG93bjogKGV2ZW50KSA9PlxuXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBjb21ib1xuICAgICAgICByZXR1cm4gaWYga2V5ID09ICdyaWdodCBjbGljaycgIyB3ZWlyZCByaWdodCBjb21tYW5kIGtleVxuXG4gICAgICAgIHJldHVybiBpZiAndW5oYW5kbGVkJyAhPSBAdGVybS5oYW5kbGVLZXkgbW9kLCBrZXksIGNvbWJvLCBjaGFyLCBldmVudCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHJlc3VsdCA9IEBoYW5kbGVNb2RLZXlDb21ib0NoYXJFdmVudCBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50XG5cbiAgICAgICAgaWYgJ3VuaGFuZGxlZCcgIT0gcmVzdWx0XG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxubW9kdWxlLmV4cG9ydHMgPSBUZXh0RWRpdG9yXG4iXX0=
//# sourceURL=../../coffee/editor/texteditor.coffee