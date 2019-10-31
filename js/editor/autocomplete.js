// koffee 1.4.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, _, clamp, elem, empty, kerror, klog, kstr, ref, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), stopEvent = ref.stopEvent, kerror = ref.kerror, empty = ref.empty, clamp = ref.clamp, kstr = ref.kstr, elem = ref.elem, klog = ref.klog, $ = ref.$, _ = ref._;

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
            var i, len, ref1, results;
            ref1 = specials.split('');
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                c = ref1[i];
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
        return [];
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
        klog('tab', this.isListItemSelected() && 'item' || this.span && 'span' || 'none', info);
        if (this.span) {
            klog('complete');
            return this.complete();
        } else {
            return this.onInsert(info);
        }
    };

    Autocomplete.prototype.onInsert = function(info) {
        var i, len, matches, ref1, ref2, ref3, w, words;
        this.close();
        this.word = _.last(info.before.split(this.splitRegExp));
        klog("@word " + this.word);
        klog("insert " + this.word + " " + (kstr(info)));
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
            matches = (ref3 = this.dirMatches(this.word)) != null ? ref3 : this.wordMatches(this.word);
        }
        if (empty(matches)) {
            return;
        }
        matches.sort(function(a, b) {
            return (b[1].count + 1 / b[0].length) - (a[1].count + 1 / a[0].length);
        });
        words = matches.map(function(m) {
            return m[0];
        });
        for (i = 0, len = words.length; i < len; i++) {
            w = words[i];
            if (!this.firstMatch) {
                this.firstMatch = w;
            } else {
                this.matchList.push(w);
            }
        }
        if (this.firstMatch == null) {
            return;
        }
        this.completion = this.firstMatch.slice(this.word.length);
        return this.open(info);
    };

    Autocomplete.prototype.open = function(info) {
        var above, c, ci, cr, cursor, fakeSpan, firstSpan, i, index, inner, item, j, k, len, len1, len2, m, p, pos, ref1, ref2, ref3, sibling, sp, spanInfo, wi, ws;
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
        cr = cursor.getBoundingClientRect();
        spanInfo = this.editor.lineSpanAtXY(cr.left, cr.top + 2);
        if (spanInfo == null) {
            klog('no spanInfo');
            p = this.editor.posAtXY(cr.left, cr.top);
            if (firstSpan = this.editor.lineSpanAtXY(2, cr.top + 2)) {
                fakeSpan = elem('span');
                fakeSpan.parentElement = firstSpan.parentElement;
                spanInfo = {
                    offsetChar: 0,
                    pos: p,
                    span: fakeSpan
                };
                klog('fakespan', spanInfo);
            } else {
                ci = p[1] - this.editor.scroll.top;
                return kerror("no span for autocomplete? cursor topleft: " + (parseInt(cr.left)) + " " + (parseInt(cr.top)), info);
            }
        }
        pos = this.editor.clampPos(spanInfo.pos);
        sp = spanInfo.span;
        inner = sp.innerHTML;
        this.clones.push(sp.cloneNode(true));
        this.clones.push(sp.cloneNode(true));
        this.cloned.push(sp);
        ws = this.word.slice(this.word.search(/\w/));
        wi = ws.length;
        this.clones[0].innerHTML = inner.slice(0, spanInfo.offsetChar + 1);
        this.clones[1].innerHTML = inner.slice(spanInfo.offsetChar + 1);
        sibling = sp;
        while (sibling = sibling.nextSibling) {
            this.clones.push(sibling.cloneNode(true));
            this.cloned.push(sibling);
        }
        sp.parentElement.appendChild(this.span);
        ref1 = this.cloned;
        for (i = 0, len = ref1.length; i < len; i++) {
            c = ref1[i];
            c.style.display = 'none';
        }
        ref2 = this.clones;
        for (j = 0, len1 = ref2.length; j < len1; j++) {
            c = ref2[j];
            this.span.insertAdjacentElement('afterend', c);
        }
        this.moveClonesBy(this.completion.length);
        if (this.matchList.length) {
            this.list = elem({
                "class": 'autocomplete-list'
            });
            this.list.addEventListener('wheel', this.onWheel);
            this.list.addEventListener('mousedown', this.onMouseDown);
            index = 0;
            ref3 = this.matchList;
            for (k = 0, len2 = ref3.length; k < len2; k++) {
                m = ref3[k];
                item = elem({
                    "class": 'autocomplete-item',
                    index: index++
                });
                item.textContent = m;
                this.list.appendChild(item);
            }
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
        var c, i, j, len, len1, ref1, ref2, ref3;
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
        this.firstMatch = null;
        ref2 = this.clones;
        for (i = 0, len = ref2.length; i < len; i++) {
            c = ref2[i];
            c.remove();
        }
        ref3 = this.cloned;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
            c = ref3[j];
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
            this.complete();
        }
        return stopEvent(event);
    };

    Autocomplete.prototype.complete = function() {
        this.editor.pasteText(this.selectedCompletion());
        return this.close();
    };

    Autocomplete.prototype.isListItemSelected = function() {
        return this.list && this.selected >= 0;
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
        var ref1, ref2, ref3;
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

    Autocomplete.prototype.moveClonesBy = function(numChars) {
        var beforeLength, c, charOffset, ci, i, offset, ref1, spanOffset;
        if (empty(this.clones)) {
            return;
        }
        beforeLength = this.clones[0].innerHTML.length;
        for (ci = i = 1, ref1 = this.clones.length; 1 <= ref1 ? i < ref1 : i > ref1; ci = 1 <= ref1 ? ++i : --i) {
            c = this.clones[ci];
            offset = parseFloat(this.cloned[ci - 1].style.transform.split('translateX(')[1]);
            charOffset = numChars;
            if (ci === 1) {
                charOffset += beforeLength;
            }
            c.style.transform = "translatex(" + (offset + this.editor.size.charWidth * charOffset) + "px)";
        }
        spanOffset = this.editor.size.charWidth * this.editor.mainCursor()[0];
        return this.span.style.transform = "translatex(" + spanOffset + "px)";
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
            this.complete();
            return;
        }
        if (this.list != null) {
            switch (combo) {
                case 'down':
                    this.next();
                    return;
                case 'up':
                    if (this.selected >= 0) {
                        this.prev();
                        return;
                    } else {
                        this.last();
                        return;
                    }
            }
        }
        this.close();
        return 'unhandled';
    };

    return Autocomplete;

})();

module.exports = Autocomplete;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwwRUFBQTtJQUFBOzs7QUFRQSxNQUE4RCxPQUFBLENBQVEsS0FBUixDQUE5RCxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxlQUFuQyxFQUF5QyxlQUF6QyxFQUErQyxlQUEvQyxFQUFxRCxTQUFyRCxFQUF3RDs7QUFFbEQ7SUFFQyxzQkFBQyxNQUFEO0FBRUMsWUFBQTtRQUZBLElBQUMsQ0FBQSxTQUFEOzs7OztRQUVBLElBQUMsQ0FBQSxTQUFELEdBQWE7UUFDYixJQUFDLENBQUEsTUFBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLE1BQUQsR0FBYTtRQUViLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxRQUFBLEdBQVc7UUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZOztBQUFDO0FBQUE7aUJBQUEsc0NBQUE7OzZCQUFBLElBQUEsR0FBSztBQUFMOztZQUFELENBQW1DLENBQUMsSUFBcEMsQ0FBeUMsRUFBekM7UUFDWixJQUFDLENBQUEsWUFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVAsR0FBZ0IsS0FBM0I7UUFFckIsSUFBQyxDQUFBLGdCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLElBQUEsR0FBSyxJQUFDLENBQUEsUUFBTixHQUFlLEdBQTFCO1FBQ3JCLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxZQUFBLEdBQWEsSUFBQyxDQUFBLFFBQWQsR0FBdUIsWUFBbEMsRUFBOEMsR0FBOUM7UUFFckIsSUFBQyxDQUFBLFdBQUQsR0FBcUIsSUFBSSxNQUFKLENBQVcsTUFBWCxFQUFrQixHQUFsQjtRQUVyQixJQUFDLENBQUEsV0FBRCxHQUFlLENBQUMsSUFBRCxFQUFNLElBQU4sRUFBVyxJ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QSxNQUFNLENBQUMsYUFBUixDQUFzQixLQUF0QixDQUFELEVBQStCLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixDQUFvQixLQUFwQixDQUEvQixFQUEyRCxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBc0IsS0FBdEIsQ0FBM0Q7SUFMUzs7MkJBT2IsVUFBQSxHQUFZLFNBQUE7ZUFBRyxJQUFDLENBQUEsV0FBRCxDQUFBLENBQWUsQ0FBQSxDQUFBO0lBQWxCOzsyQkFRWixzQkFBQSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtRQUVwQixJQUFHLEtBQUEsS0FBUyxLQUFaO1lBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBQTtZQUNBLFNBQUEsQ0FBVSxLQUFWO0FBQ0EsbUJBSEo7O1FBS0EsSUFBMEIsaUJBQTFCO0FBQUEsbUJBQU8sWUFBUDs7UUFFQSxJQUFHLEtBQUEsS0FBUyxPQUFaO1lBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBQTtBQUNBLG1CQUZKOztRQUlBLElBQUcsaUJBQUg7QUFDSSxvQkFBTyxLQUFQO0FBQUEscUJBQ1MsTUFEVDtvQkFFUSxJQUFDLENBQUEsSUFBRCxDQUFBO0FBQ0E7QUFIUixxQkFJUyxJQUpUO29CQUtRLElBQUcsSUFBQyxDQUFBLFFBQUQsSUFBYSxDQUFoQjt3QkFDSSxJQUFDLENBQUEsSUFBRCxDQUFBO0FBQ0EsK0JBRko7cUJBQUEsTUFBQTt3QkFJSSxJQUFDLENBQUEsSUFBRCxDQUFBO0FBQ0EsK0JBTEo7O0FBTFIsYUFESjs7UUFZQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0E7SUExQm9COzs7Ozs7QUE0QjVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHN0b3BFdmVudCwga2Vycm9yLCBlbXB0eSwgY2xhbXAsIGtzdHIsIGVsZW0sIGtsb2csICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgQXV0b2NvbXBsZXRlXG5cbiAgICBAOiAoQGVkaXRvcikgLT4gXG4gICAgICAgIFxuICAgICAgICBAbWF0Y2hMaXN0ID0gW11cbiAgICAgICAgQGNsb25lcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIHNwZWNpYWxzID0gXCJfLUAjXCJcbiAgICAgICAgQGVzcGVjaWFsID0gKFwiXFxcXFwiK2MgZm9yIGMgaW4gc3BlY2lhbHMuc3BsaXQgJycpLmpvaW4gJydcbiAgICAgICAgQGhlYWRlclJlZ0V4cCAgICAgID0gbmV3IFJlZ0V4cCBcIl5bMCN7QGVzcGVjaWFsfV0rJFwiXG4gICAgICAgIFxuICAgICAgICBAbm90U3BlY2lhbFJlZ0V4cCAgPSBuZXcgUmVnRXhwIFwiW14je0Blc3BlY2lhbH1dXCJcbiAgICAgICAgQHNwZWNpYWxXb3JkUmVnRXhwID0gbmV3IFJlZ0V4cCBcIihcXFxccyt8W1xcXFx3I3tAZXNwZWNpYWx9XSt8W15cXFxcc10pXCIgJ2cnXG4gICAgICAgICMgQHNwbGl0UmVnRXhwICAgICAgID0gbmV3IFJlZ0V4cCBcIlteXFxcXHdcXFxcZCN7QGVzcGVjaWFsfV0rXCIgJ2cnXG4gICAgICAgIEBzcGxpdFJlZ0V4cCAgICAgICA9IG5ldyBSZWdFeHAgXCJcXFxccytcIiAnZydcbiAgICBcbiAgICAgICAgQGRpckNvbW1hbmRzID0gWydscycgJ2NkJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdpbnNlcnQnIEBvbkluc2VydFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgIEBjbG9zZVxuICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGRpck1hdGNoZXM6IChkaXIpIC0+XG4gICAgICAgIFxuICAgICAgICBbXVxuICAgICAgICBcbiAgICB3b3JkTWF0Y2hlczogKHdvcmQpIC0+XG4gICAgICAgIFxuICAgICAgICB3b3JkTWF0Y2hlcyA9IF8ucGlja0J5IHdpbmRvdy5icmFpbi53b3JkcywgKGMsdykgPT4gdy5zdGFydHNXaXRoKHdvcmQpIGFuZCB3Lmxlbmd0aCA+IHdvcmQubGVuZ3RoXG4gICAgICAgIHdvcmRNYXRjaGVzID0gXy50b1BhaXJzIHdvcmRNYXRjaGVzXG5cbiAgICAgICAgY21kTWF0Y2hlcyA9IF8ucGlja0J5IHdpbmRvdy5icmFpbi5jbWRzLCAoYyx3KSA9PiB3LnN0YXJ0c1dpdGgod29yZCkgYW5kIHcubGVuZ3RoID4gd29yZC5sZW5ndGhcbiAgICAgICAgY21kTWF0Y2hlcyA9IF8udG9QYWlycyBjbWRNYXRjaGVzXG4gICAgICAgIFxuICAgICAgICB3b3JkTWF0Y2hlcy5jb25jYXQgY21kTWF0Y2hlc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBvblRhYjogLT5cbiAgICAgICAgXG4gICAgICAgIG1jICAgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lIG1jWzFdXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgbGluZS50cmltKClcbiAgICAgICAgXG4gICAgICAgIGluZm8gPVxuICAgICAgICAgICAgbGluZTogICBsaW5lXG4gICAgICAgICAgICBiZWZvcmU6IGxpbmVbMC4uLm1jWzBdXVxuICAgICAgICAgICAgYWZ0ZXI6ICBsaW5lW21jWzBdLi5dXG4gICAgICAgICAgICBjdXJzb3I6IG1jXG4gICAgICAgICAgICBcbiAgICAgICAga2xvZyAndGFiJyBAaXNMaXN0SXRlbVNlbGVjdGVkKCkgYW5kICdpdGVtJyBvciBAc3BhbiBhbmQgJ3NwYW4nIG9yICdub25lJywgIGluZm9cbiAgICAgICAgXG4gICAgICAgIGlmIEBzcGFuXG4gICAgICAgICAgICBrbG9nICdjb21wbGV0ZSdcbiAgICAgICAgICAgIEBjb21wbGV0ZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBvbkluc2VydCBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKGluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHdvcmQgPSBfLmxhc3QgaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIFxuICAgICAgICBrbG9nIFwiQHdvcmQgI3tAd29yZH1cIlxuICAgICAgICBrbG9nIFwiaW5zZXJ0ICN7QHdvcmR9ICN7a3N0ciBpbmZvfVwiXG5cbiAgICAgICAgIyBrbG9nIFwiQHdvcmQubGVuZ3RoID4je0B3b3JkfTxcIiBAd29yZD8ubGVuZ3RoXG4gICAgICAgIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICBpZiBpbmZvLmJlZm9yZS5zcGxpdCgnICcpWzBdIGluIEBkaXJDb21tYW5kc1xuICAgICAgICAgICAgICAgIGtsb2cgJ2RpckNvbW1hbmQnIGluZm8uYmVmb3JlLnNwbGl0KCcgJylbMF1cbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gQGRpck1hdGNoZXMoKVxuICAgICAgICAgICAgaWYgZW1wdHkgbWF0Y2hlc1xuICAgICAgICAgICAgICAgIEB3b3JkID0gaW5mby5iZWZvcmVcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gQHdvcmRNYXRjaGVzKEB3b3JkKVxuICAgICAgICBlbHNlICBcbiAgICAgICAgICAgIG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyhAd29yZCkgPyBAd29yZE1hdGNoZXMoQHdvcmQpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgbWF0Y2hlcyAjIHVubGlrZWx5XG4gICAgICAgIFxuICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT4gKGJbMV0uY291bnQrMS9iWzBdLmxlbmd0aCkgLSAoYVsxXS5jb3VudCsxL2FbMF0ubGVuZ3RoKVxuICAgICAgICAgICAgXG4gICAgICAgIHdvcmRzID0gbWF0Y2hlcy5tYXAgKG0pIC0+IG1bMF1cbiAgICAgICAgZm9yIHcgaW4gd29yZHNcbiAgICAgICAgICAgIGlmIG5vdCBAZmlyc3RNYXRjaFxuICAgICAgICAgICAgICAgIEBmaXJzdE1hdGNoID0gdyBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbWF0Y2hMaXN0LnB1c2ggd1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZmlyc3RNYXRjaD9cbiAgICAgICAgQGNvbXBsZXRpb24gPSBAZmlyc3RNYXRjaC5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIEBvcGVuIGluZm9cbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogKGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBjdXJzb3IgPSAkKCcubWFpbicgQGVkaXRvci52aWV3KVxuICAgICAgICBpZiBub3QgY3Vyc29yP1xuICAgICAgICAgICAga2Vycm9yIFwiQXV0b2NvbXBsZXRlLm9wZW4gLS0tIG5vIGN1cnNvcj9cIlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczonYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ICAgICAgPSBAY29tcGxldGlvblxuICAgICAgICBAc3Bhbi5zdHlsZS5vcGFjaXR5ICAgID0gMVxuICAgICAgICBAc3Bhbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNDRhXCJcbiAgICAgICAgQHNwYW4uc3R5bGUuY29sb3IgICAgICA9IFwiI2ZmZlwiXG5cbiAgICAgICAgY3IgPSBjdXJzb3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgc3BhbkluZm8gPSBAZWRpdG9yLmxpbmVTcGFuQXRYWSBjci5sZWZ0LCBjci50b3ArMlxuICAgICAgICBpZiBub3Qgc3BhbkluZm8/XG4gICAgICAgICAgICBrbG9nICdubyBzcGFuSW5mbydcbiAgICAgICAgICAgIHAgPSBAZWRpdG9yLnBvc0F0WFkgY3IubGVmdCwgY3IudG9wXG4gICAgICAgICAgICBpZiBmaXJzdFNwYW4gPSBAZWRpdG9yLmxpbmVTcGFuQXRYWSAyLCBjci50b3ArMlxuICAgICAgICAgICAgICAgIGZha2VTcGFuID0gZWxlbSAnc3BhbidcbiAgICAgICAgICAgICAgICBmYWtlU3Bhbi5wYXJlbnRFbGVtZW50ID0gZmlyc3RTcGFuLnBhcmVudEVsZW1lbnRcbiAgICAgICAgICAgICAgICBzcGFuSW5mbyA9IG9mZnNldENoYXI6MCBwb3M6cCwgc3BhbjpmYWtlU3BhblxuICAgICAgICAgICAgICAgIGtsb2cgJ2Zha2VzcGFuJyBzcGFuSW5mb1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNpID0gcFsxXS1AZWRpdG9yLnNjcm9sbC50b3BcbiAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwibm8gc3BhbiBmb3IgYXV0b2NvbXBsZXRlPyBjdXJzb3IgdG9wbGVmdDogI3twYXJzZUludCBjci5sZWZ0fSAje3BhcnNlSW50IGNyLnRvcH1cIiBpbmZvXG4gICAgICAgIFxuICAgICAgICBwb3MgPSBAZWRpdG9yLmNsYW1wUG9zIHNwYW5JbmZvLnBvc1xuICAgICAgICAjIGtsb2cgcG9zLCBAZWRpdG9yLm51bUxpbmVzKCksICdcXG4nLCBAZWRpdG9yLnNjcm9sbC5ib3RcblxuICAgICAgICBzcCA9IHNwYW5JbmZvLnNwYW5cbiAgICAgICAgaW5uZXIgPSBzcC5pbm5lckhUTUxcbiAgICAgICAgQGNsb25lcy5wdXNoIHNwLmNsb25lTm9kZSB0cnVlXG4gICAgICAgIEBjbG9uZXMucHVzaCBzcC5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICBAY2xvbmVkLnB1c2ggc3BcbiAgICAgICAgXG4gICAgICAgIHdzID0gQHdvcmQuc2xpY2UgQHdvcmQuc2VhcmNoIC9cXHcvXG4gICAgICAgIHdpID0gd3MubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBAY2xvbmVzWzBdLmlubmVySFRNTCA9IGlubmVyLnNsaWNlIDAgc3BhbkluZm8ub2Zmc2V0Q2hhciArIDEgXG4gICAgICAgIEBjbG9uZXNbMV0uaW5uZXJIVE1MID0gaW5uZXIuc2xpY2UgICBzcGFuSW5mby5vZmZzZXRDaGFyICsgMVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgc2libGluZyA9IHNwXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcC5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkIEBzcGFuXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzXG4gICAgICAgICAgICBAc3Bhbi5pbnNlcnRBZGphY2VudEVsZW1lbnQgJ2FmdGVyZW5kJyBjXG4gICAgICAgICAgICBcbiAgICAgICAgIyBrbG9nIFwibW92ZSBjbG9uZXMgYnlcIiBAY29tcGxldGlvbi5sZW5ndGgsIEBjb21wbGV0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAY29tcGxldGlvbi5sZW5ndGggICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBtYXRjaExpc3QubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtbGlzdCdcbiAgICAgICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJyAgICAgQG9uV2hlZWxcbiAgICAgICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoTGlzdFxuICAgICAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOidhdXRvY29tcGxldGUtaXRlbScgaW5kZXg6aW5kZXgrK1xuICAgICAgICAgICAgICAgIGl0ZW0udGV4dENvbnRlbnQgPSBtXG4gICAgICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgYWJvdmUgPSBwb3NbMV0gKyBAbWF0Y2hMaXN0Lmxlbmd0aCAtIEBlZGl0b3Iuc2Nyb2xsLnRvcCA+PSBAZWRpdG9yLnNjcm9sbC5mdWxsTGluZXNcbiAgICAgICAgICAgIGlmIGFib3ZlXG4gICAgICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYWJvdmUnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYmVsb3cnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICd3aGVlbCcgQG9uV2hlZWxcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBAc3Bhbj8ucmVtb3ZlKClcbiAgICAgICAgQHNlbGVjdGVkICAgPSAtMVxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBAZmlyc3RNYXRjaCA9IG51bGxcbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXNcbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnaW5pdGlhbCdcbiAgICAgICAgXG4gICAgICAgIEBjbG9uZXMgPSBbXVxuICAgICAgICBAY2xvbmVkID0gW11cbiAgICAgICAgQG1hdGNoTGlzdCAgPSBbXVxuICAgICAgICBAXG5cbiAgICBvbldoZWVsOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdC5zY3JvbGxUb3AgKz0gZXZlbnQuZGVsdGFZXG4gICAgICAgIHN0b3BFdmVudCBldmVudCAgICBcbiAgICBcbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBjb21wbGV0ZSgpXG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgY29tcGxldGU6IC0+XG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnBhc3RlVGV4dCBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQGNsb3NlKClcblxuICAgIGlzTGlzdEl0ZW1TZWxlY3RlZDogLT4gQGxpc3QgYW5kIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHNlbGVjdGVkQ29tcGxldGlvbjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbWF0Y2hMaXN0W0BzZWxlY3RlZF0uc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjb21wbGV0aW9uXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGRlbHRhKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdFxuICAgICAgICBAc2VsZWN0IGNsYW1wIC0xLCBAbWF0Y2hMaXN0Lmxlbmd0aC0xLCBAc2VsZWN0ZWQrZGVsdGFcbiAgICAgICAgXG4gICAgc2VsZWN0OiAoaW5kZXgpIC0+XG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgQHNwYW4uaW5uZXJIVE1MID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQHNwYW4uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QuYWRkICAgICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgcHJldjogLT4gQG5hdmlnYXRlIC0xICAgIFxuICAgIG5leHQ6IC0+IEBuYXZpZ2F0ZSAxXG4gICAgbGFzdDogLT4gQG5hdmlnYXRlIEBtYXRjaExpc3QubGVuZ3RoIC0gQHNlbGVjdGVkXG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgXG5cbiAgICBtb3ZlQ2xvbmVzQnk6IChudW1DaGFycykgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBAY2xvbmVzXG4gICAgICAgIGJlZm9yZUxlbmd0aCA9IEBjbG9uZXNbMF0uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdtb3ZlQ2xvbmVzQnknIEBjbG9uZXNbMF0uaW5uZXJIVE1MLCBiZWZvcmVMZW5ndGgsIEBjb21wbGV0aW9uXG4gICAgICAgIFxuICAgICAgICBmb3IgY2kgaW4gWzEuLi5AY2xvbmVzLmxlbmd0aF1cbiAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkW2NpLTFdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICAgICAgY2hhck9mZnNldCA9IG51bUNoYXJzXG4gICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICAjIGtsb2cgJ21vdmVDbG9uZXNCeScgY2ksIG9mZnNldCwgbnVtQ2hhcnMsIGJlZm9yZUxlbmd0aCwgY2hhck9mZnNldFxuICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgICMgc3Bhbk9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFswXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgIyBzcGFuT2Zmc2V0ICs9IEBlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqYmVmb3JlTGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBzcGFuT2Zmc2V0ID0gQGVkaXRvci5zaXplLmNoYXJXaWR0aCpAZWRpdG9yLm1haW5DdXJzb3IoKVswXVxuICAgICAgICAjIGtsb2cgJ21vdmVDbG9uZXNCeScgc3Bhbk9mZnNldFxuICAgICAgICBAc3Bhbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tzcGFuT2Zmc2V0fXB4KVwiXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGN1cnNvcldvcmRzOiAtPiBcbiAgICAgICAgXG4gICAgICAgIGNwID0gQGVkaXRvci5jdXJzb3JQb3MoKVxuICAgICAgICB3b3JkcyA9IEBlZGl0b3Iud29yZFJhbmdlc0luTGluZUF0SW5kZXggY3BbMV0sIHJlZ0V4cDogQHNwZWNpYWxXb3JkUmVnRXhwICAgICAgICBcbiAgICAgICAgW2JlZm9yLCBjdXJzciwgYWZ0ZXJdID0gcmFuZ2VzU3BsaXRBdFBvc0luUmFuZ2VzIGNwLCB3b3Jkc1xuICAgICAgICBbQGVkaXRvci50ZXh0c0luUmFuZ2VzKGJlZm9yKSwgQGVkaXRvci50ZXh0SW5SYW5nZShjdXJzciksIEBlZGl0b3IudGV4dHNJblJhbmdlcyhhZnRlcildXG4gICAgICAgIFxuICAgIGN1cnNvcldvcmQ6IC0+IEBjdXJzb3JXb3JkcygpWzFdXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb21ibyA9PSAndGFiJ1xuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudCAjIHByZXZlbnQgZm9jdXMgY2hhbmdlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCcgaWYgbm90IEBzcGFuP1xuICAgICAgICBcbiAgICAgICAgaWYgY29tYm8gPT0gJ3JpZ2h0J1xuICAgICAgICAgICAgQGNvbXBsZXRlKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0PyBcbiAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgIHdoZW4gJ2Rvd24nXG4gICAgICAgICAgICAgICAgICAgIEBuZXh0KClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgd2hlbiAndXAnXG4gICAgICAgICAgICAgICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICBAcHJldigpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgIEBsYXN0KClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAY2xvc2UoKSAgIFxuICAgICAgICAndW5oYW5kbGVkJ1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQXV0b2NvbXBsZXRlXG4iXX0=
//# sourceURL=../../coffee/editor/autocomplete.coffee