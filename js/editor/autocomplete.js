// koffee 1.4.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, _, clamp, elem, empty, kerror, klog, kstr, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), stopEvent = ref.stopEvent, kerror = ref.kerror, slash = ref.slash, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, klog = ref.klog, kstr = ref.kstr, elem = ref.elem, $ = ref.$, _ = ref._;

Autocomplete = (function() {
    function Autocomplete(editor) {
        var c, specials;
        this.editor = editor;
        this.onMouseDown = bind(this.onMouseDown, this);
        this.onWheel = bind(this.onWheel, this);
        this.close = bind(this.close, this);
        this.onInsert = bind(this.onInsert, this);
        this.matchList = [];
        this.clones = [];
        this.cloned = [];
        this.close();
        specials = "_-@#";
        this.especial = ((function() {
            var j, len, ref1, results;
            ref1 = specials.split('');
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                c = ref1[j];
                results.push("\\" + c);
            }
            return results;
        })()).join('');
        this.headerRegExp = new RegExp("^[0" + this.especial + "]+$");
        this.notSpecialRegExp = new RegExp("[^" + this.especial + "]");
        this.specialWordRegExp = new RegExp("(\\s+|[\\w" + this.especial + "]+|[^\\s])", 'g');
        this.splitRegExp = new RegExp("\\s+", 'g');
        this.dirCommands = ['ls', 'cd', 'rm', 'cp', 'mv', 'krep', 'cat'];
        this.editor.on('insert', this.onInsert);
        this.editor.on('cursor', this.close);
        this.editor.on('blur', this.close);
    }

    Autocomplete.prototype.dirMatches = function(dir) {
        var items, noDir, noParent, result;
        if (!slash.isDir(dir)) {
            noDir = slash.file(dir);
            dir = slash.dir(dir);
            if (!dir || !slash.isDir(dir)) {
                noParent = dir;
                if (dir) {
                    noParent += '/';
                }
                noParent += noDir;
                dir = '';
            }
        }
        items = slash.list(dir);
        if (valid(items)) {
            result = items.map(function(i) {
                if (noParent) {
                    if (i.name.startsWith(noParent)) {
                        return [
                            i.name, {
                                count: 0
                            }
                        ];
                    }
                } else if (noDir) {
                    if (i.name.startsWith(noDir)) {
                        return [
                            i.name, {
                                count: 0
                            }
                        ];
                    }
                } else {
                    if (dir.slice(-1)[0] === '/' || empty(dir)) {
                        return [
                            i.name, {
                                count: 0
                            }
                        ];
                    } else {
                        return [
                            '/' + i.name, {
                                count: 0
                            }
                        ];
                    }
                }
            });
            result = result.filter(function(f) {
                return f;
            });
            if (dir === '.') {
                result.unshift([
                    '..', {
                        count: 999
                    }
                ]);
            } else if (!noDir && valid(dir && !dir.endsWith('/'))) {
                result.unshift([
                    '/', {
                        count: 999
                    }
                ]);
            }
            return result;
        }
    };

    Autocomplete.prototype.wordMatches = function(word) {
        var cmdMatches, wordMatches;
        wordMatches = _.pickBy(window.brain.words, (function(_this) {
            return function(c, w) {
                return w.startsWith(word) && w.length > word.length;
            };
        })(this));
        wordMatches = _.toPairs(wordMatches);
        cmdMatches = _.pickBy(window.brain.cmds, (function(_this) {
            return function(c, w) {
                return w.startsWith(word) && w.length > word.length;
            };
        })(this));
        cmdMatches = _.toPairs(cmdMatches);
        return wordMatches.concat(cmdMatches);
    };

    Autocomplete.prototype.onTab = function() {
        var info, line, mc;
        mc = this.editor.mainCursor();
        line = this.editor.line(mc[1]);
        if (empty(line.trim())) {
            return;
        }
        info = {
            line: line,
            before: line.slice(0, mc[0]),
            after: line.slice(mc[0]),
            cursor: mc
        };
        if (this.span) {
            this.complete({
                suffix: (slash.isDir(this.selectedWord()) && !this.completion.endsWith('/')) && '/' || ''
            });
            return this.onTab();
        } else {
            return this.onInsert(info);
        }
    };

    Autocomplete.prototype.onInsert = function(info) {
        var matches, ref1, ref2, words;
        this.close();
        this.word = _.last(info.before.split(this.splitRegExp));
        if (!((ref1 = this.word) != null ? ref1.length : void 0)) {
            if (ref2 = info.before.split(' ')[0], indexOf.call(this.dirCommands, ref2) >= 0) {
                klog('dirCommand', info.before.split(' ')[0]);
                matches = this.dirMatches();
            }
            if (empty(matches)) {
                this.word = info.before;
                matches = this.wordMatches(this.word);
            }
        } else {
            matches = this.dirMatches(this.word);
        }
        if (empty(matches)) {
            return;
        }
        matches.sort(function(a, b) {
            return b[1].count - a[1].count;
        });
        words = matches.map(function(m) {
            return m[0];
        });
        if (empty(words)) {
            return;
        }
        this.matchList = words.slice(1);
        if (words[0].startsWith(this.word)) {
            this.completion = words[0].slice(this.word.length);
        } else {
            if (words[0].startsWith(slash.file(this.word))) {
                this.completion = words[0].slice(slash.file(this.word).length);
            } else {
                this.completion = words[0];
            }
        }
        return this.open(info);
    };

    Autocomplete.prototype.open = function(info) {
        var above, c, cr, cursor, index, item, j, k, l, len, len1, len2, m, offset, pos, ref1, ref2, ref3, sibling, spanInfo;
        klog(info.before + "|" + this.completion + "|" + info.after + " " + this.word);
        cursor = $('.main', this.editor.view);
        if (cursor == null) {
            kerror("Autocomplete.open --- no cursor?");
            return;
        }
        this.span = elem('span', {
            "class": 'autocomplete-span'
        });
        this.span.textContent = this.completion;
        this.span.style.opacity = 1;
        this.span.style.background = "#44a";
        this.span.style.color = "#fff";
        this.span.style.transform = "translatex(" + (this.editor.size.charWidth * this.editor.mainCursor()[0]) + "px)";
        cr = cursor.getBoundingClientRect();
        if (!(spanInfo = this.editor.lineSpanAtXY(cr.left + 2, cr.top + 2))) {
            return kerror('no spanInfo');
        }
        sibling = spanInfo.span;
        while (sibling = sibling.nextSibling) {
            this.clones.push(sibling.cloneNode(true));
            this.cloned.push(sibling);
        }
        spanInfo.span.parentElement.appendChild(this.span);
        ref1 = this.cloned;
        for (j = 0, len = ref1.length; j < len; j++) {
            c = ref1[j];
            c.style.display = 'none';
        }
        ref2 = this.clones;
        for (k = 0, len1 = ref2.length; k < len1; k++) {
            c = ref2[k];
            this.span.insertAdjacentElement('afterend', c);
        }
        this.moveClonesBy(this.completion.length);
        if (this.matchList.length) {
            this.list = elem({
                "class": 'autocomplete-list'
            });
            this.list.addEventListener('wheel', this.onWheel);
            this.list.addEventListener('mousedown', this.onMouseDown);
            offset = 0;
            if (slash.dir(this.word) && !this.word.endsWith('/')) {
                offset = slash.file(this.word).length;
            } else if (this.matchList[0].startsWith(this.word)) {
                offset = this.word.length;
            }
            this.list.style.transform = "translatex(" + (-this.editor.size.charWidth * offset) + "px)";
            index = 0;
            ref3 = this.matchList;
            for (l = 0, len2 = ref3.length; l < len2; l++) {
                m = ref3[l];
                item = elem({
                    "class": 'autocomplete-item',
                    index: index++
                });
                item.textContent = m;
                this.list.appendChild(item);
            }
            pos = this.editor.clampPos(spanInfo.pos);
            above = pos[1] + this.matchList.length - this.editor.scroll.top >= this.editor.scroll.fullLines;
            if (above) {
                this.list.classList.add('above');
            } else {
                this.list.classList.add('below');
            }
            return cursor.appendChild(this.list);
        }
    };

    Autocomplete.prototype.close = function() {
        var c, j, k, len, len1, ref1, ref2, ref3;
        if (this.list != null) {
            this.list.removeEventListener('wheel', this.onWheel);
            this.list.removeEventListener('click', this.onClick);
            this.list.remove();
        }
        if ((ref1 = this.span) != null) {
            ref1.remove();
        }
        this.selected = -1;
        this.list = null;
        this.span = null;
        this.completion = null;
        ref2 = this.clones;
        for (j = 0, len = ref2.length; j < len; j++) {
            c = ref2[j];
            c.remove();
        }
        ref3 = this.cloned;
        for (k = 0, len1 = ref3.length; k < len1; k++) {
            c = ref3[k];
            c.style.display = 'initial';
        }
        this.clones = [];
        this.cloned = [];
        this.matchList = [];
        return this;
    };

    Autocomplete.prototype.onWheel = function(event) {
        this.list.scrollTop += event.deltaY;
        return stopEvent(event);
    };

    Autocomplete.prototype.onMouseDown = function(event) {
        var index;
        index = elem.upAttr(event.target, 'index');
        if (index) {
            this.select(index);
            this.complete({});
        }
        return stopEvent(event);
    };

    Autocomplete.prototype.complete = function(arg) {
        var ref1, suffix;
        suffix = (ref1 = arg.suffix) != null ? ref1 : '';
        this.editor.pasteText(this.selectedCompletion() + suffix);
        return this.close();
    };

    Autocomplete.prototype.isListItemSelected = function() {
        return this.list && this.selected >= 0;
    };

    Autocomplete.prototype.selectedWord = function() {
        return this.word + this.selectedCompletion();
    };

    Autocomplete.prototype.selectedCompletion = function() {
        if (this.selected >= 0) {
            return this.matchList[this.selected].slice(this.word.length);
        } else {
            return this.completion;
        }
    };

    Autocomplete.prototype.navigate = function(delta) {
        if (!this.list) {
            return;
        }
        return this.select(clamp(-1, this.matchList.length - 1, this.selected + delta));
    };

    Autocomplete.prototype.select = function(index) {
        var ref1, ref2, ref3, ref4, ref5;
        if ((ref1 = this.list.children[this.selected]) != null) {
            ref1.classList.remove('selected');
        }
        this.selected = index;
        if (this.selected >= 0) {
            if ((ref2 = this.list.children[this.selected]) != null) {
                ref2.classList.add('selected');
            }
            if ((ref3 = this.list.children[this.selected]) != null) {
                ref3.scrollIntoViewIfNeeded();
            }
        } else {
            if ((ref4 = this.list) != null) {
                if ((ref5 = ref4.children[0]) != null) {
                    ref5.scrollIntoViewIfNeeded();
                }
            }
        }
        this.span.innerHTML = this.selectedCompletion();
        this.moveClonesBy(this.span.innerHTML.length);
        if (this.selected < 0) {
            this.span.classList.remove('selected');
        }
        if (this.selected >= 0) {
            return this.span.classList.add('selected');
        }
    };

    Autocomplete.prototype.prev = function() {
        return this.navigate(-1);
    };

    Autocomplete.prototype.next = function() {
        return this.navigate(1);
    };

    Autocomplete.prototype.last = function() {
        return this.navigate(this.matchList.length - this.selected);
    };

    Autocomplete.prototype.first = function() {
        return this.navigate(-2e308);
    };

    Autocomplete.prototype.moveClonesBy = function(numChars) {
        var beforeLength, c, charOffset, ci, j, offset, ref1, results;
        if (valid(this.clones)) {
            beforeLength = this.clones[0].innerHTML.length;
            results = [];
            for (ci = j = 1, ref1 = this.clones.length; 1 <= ref1 ? j < ref1 : j > ref1; ci = 1 <= ref1 ? ++j : --j) {
                c = this.clones[ci];
                offset = parseFloat(this.cloned[ci - 1].style.transform.split('translateX(')[1]);
                charOffset = numChars;
                if (ci === 1) {
                    charOffset += beforeLength;
                }
                results.push(c.style.transform = "translatex(" + (offset + this.editor.size.charWidth * charOffset) + "px)");
            }
            return results;
        }
    };

    Autocomplete.prototype.cursorWords = function() {
        var after, befor, cp, cursr, ref1, words;
        cp = this.editor.cursorPos();
        words = this.editor.wordRangesInLineAtIndex(cp[1], {
            regExp: this.specialWordRegExp
        });
        ref1 = rangesSplitAtPosInRanges(cp, words), befor = ref1[0], cursr = ref1[1], after = ref1[2];
        return [this.editor.textsInRanges(befor), this.editor.textInRange(cursr), this.editor.textsInRanges(after)];
    };

    Autocomplete.prototype.cursorWord = function() {
        return this.cursorWords()[1];
    };

    Autocomplete.prototype.handleModKeyComboEvent = function(mod, key, combo, event) {
        if (combo === 'tab') {
            this.onTab();
            stopEvent(event);
            return;
        }
        if (this.span == null) {
            return 'unhandled';
        }
        if (combo === 'right') {
            this.complete({});
            return;
        }
        if (this.list != null) {
            switch (combo) {
                case 'page down':
                    return this.navigate(9);
                case 'page up':
                    return this.navigate(-9);
                case 'end':
                    return this.last();
                case 'home':
                    return this.first();
                case 'down':
                    return this.next();
                case 'up':
                    if (this.selected >= 0) {
                        return this.prev();
                    } else {
                        return this.last();
                    }
            }
        }
        this.close();
        return 'unhandled';
    };

    return Autocomplete;

})();

module.exports = Autocomplete;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx3RkFBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUVoRTtJQUVDLHNCQUFDLE1BQUQ7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLFNBQUQ7Ozs7O1FBRUEsSUFBQyxDQUFBLFNBQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxNQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBRWIsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUVBLFFBQUEsR0FBVztRQUNYLElBQUMsQ0FBQSxRQUFELEdBQVk7O0FBQUM7QUFBQTtpQkFBQSxzQ0FBQTs7NkJBQUEsSUFBQSxHQUFLO0FBQUw7O1lBQUQsQ0FBbUMsQ0FBQyxJQUFwQyxDQUF5QyxFQUF6QztRQUNaLElBQUMsQ0FBQSxZQUFELEdBQXFCLElBQUksTUFBSixDQUFXLEtBQUEsR0FBTSxJQUFDLENBQUEsUUFBUCxHQUFnQixLQUEzQjtRQUVyQixJQUFDLENBQUEsZ0JBQUQsR0FBcUIsSUFBSSxNQUFKLENBQVcsSUFBQSxHQUFLLElBQUMsQ0FBQSxRQUFOLEdBQWUsR0FBMUI7UUFDckIsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLFlBQUEsR0FBYSxJQUFDLENBQUEsUUFBZCxHQUF1QixZQUFsQyxFQUE4QyxHQUE5QztRQUVyQixJQUFDLENBQUEsV0FBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxNQUFYLEVBQWtCLEdBQWxCO1FBRXJCLElBQUMsQ0FBQSxXQUFELEdBQWUs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UyxJQU5UO29CQU9RLElBQUcsSUFBQyxDQUFBLFFBQUQsSUFBYSxDQUFoQjtBQUF1QiwrQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBLEVBQTlCO3FCQUFBLE1BQUE7QUFDSywrQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBLEVBRFo7O0FBUFIsYUFESjs7UUFVQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0E7SUF4Qm9COzs7Ozs7QUEwQjVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHN0b3BFdmVudCwga2Vycm9yLCBzbGFzaCwgdmFsaWQsIGVtcHR5LCBjbGFtcCwga2xvZywga3N0ciwgZWxlbSwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBBdXRvY29tcGxldGVcblxuICAgIEA6IChAZWRpdG9yKSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBtYXRjaExpc3QgPSBbXVxuICAgICAgICBAY2xvbmVzICAgID0gW11cbiAgICAgICAgQGNsb25lZCAgICA9IFtdXG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgc3BlY2lhbHMgPSBcIl8tQCNcIlxuICAgICAgICBAZXNwZWNpYWwgPSAoXCJcXFxcXCIrYyBmb3IgYyBpbiBzcGVjaWFscy5zcGxpdCAnJykuam9pbiAnJ1xuICAgICAgICBAaGVhZGVyUmVnRXhwICAgICAgPSBuZXcgUmVnRXhwIFwiXlswI3tAZXNwZWNpYWx9XSskXCJcbiAgICAgICAgXG4gICAgICAgIEBub3RTcGVjaWFsUmVnRXhwICA9IG5ldyBSZWdFeHAgXCJbXiN7QGVzcGVjaWFsfV1cIlxuICAgICAgICBAc3BlY2lhbFdvcmRSZWdFeHAgPSBuZXcgUmVnRXhwIFwiKFxcXFxzK3xbXFxcXHcje0Blc3BlY2lhbH1dK3xbXlxcXFxzXSlcIiAnZydcbiAgICAgICAgIyBAc3BsaXRSZWdFeHAgICAgICAgPSBuZXcgUmVnRXhwIFwiW15cXFxcd1xcXFxkI3tAZXNwZWNpYWx9XStcIiAnZydcbiAgICAgICAgQHNwbGl0UmVnRXhwICAgICAgID0gbmV3IFJlZ0V4cCBcIlxcXFxzK1wiICdnJ1xuICAgIFxuICAgICAgICBAZGlyQ29tbWFuZHMgPSBbJ2xzJyAnY2QnICdybScgJ2NwJyAnbXYnICdrcmVwJyAnY2F0J11cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2luc2VydCcgQG9uSW5zZXJ0XG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgQGNsb3NlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgZGlyTWF0Y2hlczogKGRpcikgLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnZGlyTWF0Y2hlcycgZGlyXG4gICAgICAgIGlmIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgIG5vRGlyID0gc2xhc2guZmlsZSBkaXJcbiAgICAgICAgICAgIGRpciA9IHNsYXNoLmRpciBkaXJcbiAgICAgICAgICAgICMga2xvZyBcIm5vRGlyIHwje25vRGlyfXxcIlxuICAgICAgICAgICAgaWYgbm90IGRpciBvciBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgPSBkaXIgIFxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9ICcvJyBpZiBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCArPSBub0RpclxuICAgICAgICAgICAgICAgIGRpciA9ICcnXG4gICAgICAgICAgICAgICAgIyBrbG9nIFwibm9QYXJlbnQgfCN7bm9QYXJlbnR9fFwiXG4gICAgICAgIGl0ZW1zID0gc2xhc2gubGlzdCBkaXJcbiAgICAgICAgIyBrbG9nIGl0ZW1zLm1hcCAoaSkgLT4gaS5uYW1lXG4gICAgICAgIGlmIHZhbGlkIGl0ZW1zXG4gICAgICAgICAgICByZXN1bHQgPSBpdGVtcy5tYXAgKGkpIC0+IFxuICAgICAgICAgICAgICAgIGlmIG5vUGFyZW50XG4gICAgICAgICAgICAgICAgICAgICMga2xvZyBub1BhcmVudCwgaS5uYW1lLCBpLm5hbWUuc3RhcnRzV2l0aCBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aCBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgW2kubmFtZSwgY291bnQ6MF1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5vRGlyXG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoIG5vRGlyXG4gICAgICAgICAgICAgICAgICAgICAgICBbaS5uYW1lLCBjb3VudDowXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLycgb3IgZW1wdHkgZGlyXG4gICAgICAgICAgICAgICAgICAgICAgICBbaS5uYW1lLCBjb3VudDowXVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBbJy8nK2kubmFtZSwgY291bnQ6MF1cbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5maWx0ZXIgKGYpIC0+IGZcbiAgICAgICAgICAgIGlmIGRpciA9PSAnLidcbiAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy4uJyBjb3VudDo5OTldXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBub0RpciBhbmQgdmFsaWQgZGlyIGFuZCBub3QgZGlyLmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLycgY291bnQ6OTk5XVxuICAgICAgICAgICAgIyBrbG9nICdyZXN1bHQnIHJlc3VsdC5tYXAgKHIpIC0+IHJbMF1cbiAgICAgICAgICAgIHJlc3VsdFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICB3b3JkTWF0Y2hlczogKHdvcmQpIC0+XG4gICAgICAgIFxuICAgICAgICB3b3JkTWF0Y2hlcyA9IF8ucGlja0J5IHdpbmRvdy5icmFpbi53b3JkcywgKGMsdykgPT4gdy5zdGFydHNXaXRoKHdvcmQpIGFuZCB3Lmxlbmd0aCA+IHdvcmQubGVuZ3RoXG4gICAgICAgIHdvcmRNYXRjaGVzID0gXy50b1BhaXJzIHdvcmRNYXRjaGVzXG5cbiAgICAgICAgIyBrbG9nIHdvcmRNYXRjaGVzXG4gICAgICAgIFxuICAgICAgICBjbWRNYXRjaGVzID0gXy5waWNrQnkgd2luZG93LmJyYWluLmNtZHMsIChjLHcpID0+IHcuc3RhcnRzV2l0aCh3b3JkKSBhbmQgdy5sZW5ndGggPiB3b3JkLmxlbmd0aFxuICAgICAgICBjbWRNYXRjaGVzID0gXy50b1BhaXJzIGNtZE1hdGNoZXNcbiAgICAgICAgXG4gICAgICAgIHdvcmRNYXRjaGVzLmNvbmNhdCBjbWRNYXRjaGVzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIG9uVGFiOiAtPlxuICAgICAgICBcbiAgICAgICAgbWMgICA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmUgbWNbMV1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBsaW5lLnRyaW0oKVxuICAgICAgICBcbiAgICAgICAgaW5mbyA9XG4gICAgICAgICAgICBsaW5lOiAgIGxpbmVcbiAgICAgICAgICAgIGJlZm9yZTogbGluZVswLi4ubWNbMF1dXG4gICAgICAgICAgICBhZnRlcjogIGxpbmVbbWNbMF0uLl1cbiAgICAgICAgICAgIGN1cnNvcjogbWNcbiAgICAgICAgICAgIFxuICAgICAgICAjIGtsb2cgJ3RhYicgQGlzTGlzdEl0ZW1TZWxlY3RlZCgpIGFuZCAnaXRlbScgb3IgQHNwYW4gYW5kICdzcGFuJyBvciAnbm9uZScgaW5mb1xuICAgICAgICBcbiAgICAgICAgaWYgQHNwYW5cbiAgICAgICAgICAgIEBjb21wbGV0ZSBzdWZmaXg6KHNsYXNoLmlzRGlyKEBzZWxlY3RlZFdvcmQoKSkgYW5kIG5vdCBAY29tcGxldGlvbi5lbmRzV2l0aCAnLycpIGFuZCAnLycgb3IgJydcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBvbkluc2VydCBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKGluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHdvcmQgPSBfLmxhc3QgaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgXCJAd29yZCAje0B3b3JkfVwiXG4gICAgICAgICMga2xvZyBcImluc2VydCAje0B3b3JkfSAje2tzdHIgaW5mb31cIlxuXG4gICAgICAgIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICBpZiBpbmZvLmJlZm9yZS5zcGxpdCgnICcpWzBdIGluIEBkaXJDb21tYW5kc1xuICAgICAgICAgICAgICAgIGtsb2cgJ2RpckNvbW1hbmQnIGluZm8uYmVmb3JlLnNwbGl0KCcgJylbMF1cbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gQGRpck1hdGNoZXMoKVxuICAgICAgICAgICAgaWYgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgIEB3b3JkID0gaW5mby5iZWZvcmVcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gQHdvcmRNYXRjaGVzKEB3b3JkKVxuICAgICAgICBlbHNlICBcbiAgICAgICAgICAgIG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyhAd29yZCkgIz8gQHdvcmRNYXRjaGVzKEB3b3JkKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IG1hdGNoZXNcbiAgICAgICAgXG4gICAgICAgICMgbWF0Y2hlcy5zb3J0IChhLGIpIC0+IChiWzFdLmNvdW50KzEvYlswXS5sZW5ndGgpIC0gKGFbMV0uY291bnQrMS9hWzBdLmxlbmd0aClcbiAgICAgICAgbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uY291bnQgLSBhWzFdLmNvdW50XG4gICAgICAgICAgICBcbiAgICAgICAgd29yZHMgPSBtYXRjaGVzLm1hcCAobSkgLT4gbVswXVxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgd29yZHNcbiAgICAgICAgQG1hdGNoTGlzdCA9IHdvcmRzWzEuLl1cbiAgICAgICAgXG4gICAgICAgIGlmIHdvcmRzWzBdLnN0YXJ0c1dpdGggQHdvcmRcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gd29yZHNbMF0uc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHdvcmRzWzBdLnN0YXJ0c1dpdGggc2xhc2guZmlsZSBAd29yZFxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gd29yZHNbMF0uc2xpY2Ugc2xhc2guZmlsZShAd29yZCkubGVuZ3RoXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSB3b3Jkc1swXVxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdvcGVuJyBAd29yZCwgd29yZHNbMF0sIEBjb21wbGV0aW9uLCBpbmZvXG4gICAgICAgIEBvcGVuIGluZm9cbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogKGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBrbG9nIFwiI3tpbmZvLmJlZm9yZX18I3tAY29tcGxldGlvbn18I3tpbmZvLmFmdGVyfSAje0B3b3JkfVwiXG4gICAgICAgIFxuICAgICAgICBjdXJzb3IgPSAkKCcubWFpbicgQGVkaXRvci52aWV3KVxuICAgICAgICBpZiBub3QgY3Vyc29yP1xuICAgICAgICAgICAga2Vycm9yIFwiQXV0b2NvbXBsZXRlLm9wZW4gLS0tIG5vIGN1cnNvcj9cIlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczonYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ICAgICAgPSBAY29tcGxldGlvblxuICAgICAgICBAc3Bhbi5zdHlsZS5vcGFjaXR5ICAgID0gMVxuICAgICAgICBAc3Bhbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNDRhXCJcbiAgICAgICAgQHNwYW4uc3R5bGUuY29sb3IgICAgICA9IFwiI2ZmZlwiXG4gICAgICAgIEBzcGFuLnN0eWxlLnRyYW5zZm9ybSAgPSBcInRyYW5zbGF0ZXgoI3tAZWRpdG9yLnNpemUuY2hhcldpZHRoKkBlZGl0b3IubWFpbkN1cnNvcigpWzBdfXB4KVwiXG5cbiAgICAgICAgY3IgPSBjdXJzb3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuICAgICAgICBpZiBub3Qgc3BhbkluZm8gPSBAZWRpdG9yLmxpbmVTcGFuQXRYWSBjci5sZWZ0KzIsIGNyLnRvcCsyXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBzcGFuSW5mbydcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcGFuSW5mby5zcGFuXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcGFuSW5mby5zcGFuLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWQgdGhlbiBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyB0aGVuIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoTGlzdC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1saXN0J1xuICAgICAgICAgICAgQGxpc3QuYWRkRXZlbnRMaXN0ZW5lciAnd2hlZWwnICAgICBAb25XaGVlbFxuICAgICAgICAgICAgQGxpc3QuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25Nb3VzZURvd25cbiAgICAgICAgICAgIG9mZnNldCA9IDBcbiAgICAgICAgICAgIGlmIHNsYXNoLmRpcihAd29yZCkgYW5kIG5vdCBAd29yZC5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBzbGFzaC5maWxlKEB3b3JkKS5sZW5ndGhcbiAgICAgICAgICAgIGVsc2UgaWYgQG1hdGNoTGlzdFswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICBAbGlzdC5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3stQGVkaXRvci5zaXplLmNoYXJXaWR0aCpvZmZzZXR9cHgpXCJcbiAgICAgICAgICAgIGluZGV4ID0gMFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWF0Y2hMaXN0XG4gICAgICAgICAgICAgICAgaXRlbSA9IGVsZW0gY2xhc3M6J2F1dG9jb21wbGV0ZS1pdGVtJyBpbmRleDppbmRleCsrXG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0Q29udGVudCA9IG1cbiAgICAgICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBpdGVtXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBwb3MgPSBAZWRpdG9yLmNsYW1wUG9zIHNwYW5JbmZvLnBvc1xuICAgICAgICAgICAgYWJvdmUgPSBwb3NbMV0gKyBAbWF0Y2hMaXN0Lmxlbmd0aCAtIEBlZGl0b3Iuc2Nyb2xsLnRvcCA+PSBAZWRpdG9yLnNjcm9sbC5mdWxsTGluZXNcbiAgICAgICAgICAgIGlmIGFib3ZlXG4gICAgICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYWJvdmUnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYmVsb3cnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICd3aGVlbCcgQG9uV2hlZWxcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBAc3Bhbj8ucmVtb3ZlKClcbiAgICAgICAgQHNlbGVjdGVkICAgPSAtMVxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lc1xuICAgICAgICAgICAgYy5yZW1vdmUoKVxuXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWRcbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICBcbiAgICAgICAgQGNsb25lcyA9IFtdXG4gICAgICAgIEBjbG9uZWQgPSBbXVxuICAgICAgICBAbWF0Y2hMaXN0ICA9IFtdXG4gICAgICAgIEBcblxuICAgIG9uV2hlZWw6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LnNjcm9sbFRvcCArPSBldmVudC5kZWx0YVlcbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICAgIFxuICAgIFxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IGVsZW0udXBBdHRyIGV2ZW50LnRhcmdldCwgJ2luZGV4J1xuICAgICAgICBpZiBpbmRleCAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNlbGVjdCBpbmRleFxuICAgICAgICAgICAgQGNvbXBsZXRlIHt9XG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgY29tcGxldGU6IChzdWZmaXg6JycpIC0+XG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnBhc3RlVGV4dCBAc2VsZWN0ZWRDb21wbGV0aW9uKCkgKyBzdWZmaXhcbiAgICAgICAgQGNsb3NlKClcblxuICAgIGlzTGlzdEl0ZW1TZWxlY3RlZDogLT4gQGxpc3QgYW5kIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHNlbGVjdGVkV29yZDogLT4gQHdvcmQrQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgXG4gICAgc2VsZWN0ZWRDb21wbGV0aW9uOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBtYXRjaExpc3RbQHNlbGVjdGVkXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaExpc3QubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbGlzdD8uY2hpbGRyZW5bMF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAgLT4gQG5hdmlnYXRlIC0xICAgIFxuICAgIG5leHQ6ICAtPiBAbmF2aWdhdGUgMVxuICAgIGxhc3Q6ICAtPiBAbmF2aWdhdGUgQG1hdGNoTGlzdC5sZW5ndGggLSBAc2VsZWN0ZWRcbiAgICBmaXJzdDogLT4gQG5hdmlnYXRlIC1JbmZpbml0eVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAY2xvbmVzXG4gICAgICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4gICAgXG4gICAgY3Vyc29yV29yZHM6IC0+IFxuICAgICAgICBcbiAgICAgICAgY3AgPSBAZWRpdG9yLmN1cnNvclBvcygpXG4gICAgICAgIHdvcmRzID0gQGVkaXRvci53b3JkUmFuZ2VzSW5MaW5lQXRJbmRleCBjcFsxXSwgcmVnRXhwOiBAc3BlY2lhbFdvcmRSZWdFeHAgICAgICAgIFxuICAgICAgICBbYmVmb3IsIGN1cnNyLCBhZnRlcl0gPSByYW5nZXNTcGxpdEF0UG9zSW5SYW5nZXMgY3AsIHdvcmRzXG4gICAgICAgIFtAZWRpdG9yLnRleHRzSW5SYW5nZXMoYmVmb3IpLCBAZWRpdG9yLnRleHRJblJhbmdlKGN1cnNyKSwgQGVkaXRvci50ZXh0c0luUmFuZ2VzKGFmdGVyKV1cbiAgICAgICAgXG4gICAgY3Vyc29yV29yZDogLT4gQGN1cnNvcldvcmRzKClbMV1cbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvID09ICd0YWInXG4gICAgICAgICAgICBAb25UYWIoKVxuICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICMgcHJldmVudCBmb2N1cyBjaGFuZ2VcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQHNwYW4/XG4gICAgICAgIFxuICAgICAgICBpZiBjb21ibyA9PSAncmlnaHQnXG4gICAgICAgICAgICBAY29tcGxldGUge31cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0PyBcbiAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiByZXR1cm4gQG5hdmlnYXRlIDlcbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSAtOVxuICAgICAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiByZXR1cm4gQGxhc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiByZXR1cm4gQGZpcnN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gcmV0dXJuIEBuZXh0KClcbiAgICAgICAgICAgICAgICB3aGVuICd1cCdcbiAgICAgICAgICAgICAgICAgICAgaWYgQHNlbGVjdGVkID49IDAgdGhlbiByZXR1cm4gQHByZXYoKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBAbGFzdCgpXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee