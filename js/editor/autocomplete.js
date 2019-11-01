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
        this.editor = editor;
        this.onMouseDown = bind(this.onMouseDown, this);
        this.onWheel = bind(this.onWheel, this);
        this.close = bind(this.close, this);
        this.onInsert = bind(this.onInsert, this);
        this.matchList = [];
        this.clones = [];
        this.cloned = [];
        this.close();
        this.splitRegExp = /\s+/g;
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
            } else if (!noDir && valid(dir)) {
                if (!dir.endsWith('/')) {
                    result.unshift([
                        '/', {
                            count: 999
                        }
                    ]);
                } else {
                    result.unshift([
                        '', {
                            count: 999
                        }
                    ]);
                }
            }
            return result;
        }
    };

    Autocomplete.prototype.cmdMatches = function(word) {
        var m, pick;
        pick = function(obj, cmd) {
            return cmd.startsWith(word) && cmd.length > word.length;
        };
        m = _.toPairs(_.pickBy(window.brain.cmds, pick));
        klog('cmdMatches', word, m);
        return m;
    };

    Autocomplete.prototype.onTab = function() {
        var info, line, mc, suffix;
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
            if (this.list && empty(this.completion)) {
                this.navigate(1);
            }
            suffix = '';
            if (slash.isDir(this.selectedWord())) {
                if (valid(this.completion) && !this.completion.endsWith('/')) {
                    suffix = '/';
                }
            }
            this.complete({
                suffix: suffix
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
                matches = this.dirMatches();
            }
        } else {
            matches = this.dirMatches(this.word).concat(this.cmdMatches(info.before));
        }
        if (empty(matches)) {
            matches = this.cmdMatches(info.before);
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
        var above, c, cr, cursor, index, item, j, k, l, len, len1, len2, m, pos, ref1, ref2, ref3, sibling, spanInfo;
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
            this.list.addEventListener('mousedown', this.onMouseDown);
            this.listOffset = 0;
            if (slash.dir(this.word) && !this.word.endsWith('/')) {
                this.listOffset = slash.file(this.word).length;
            } else if (this.matchList[0].startsWith(this.word)) {
                this.listOffset = this.word.length;
            }
            this.list.style.transform = "translatex(" + (-this.editor.size.charWidth * this.listOffset) + "px)";
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
        this.listOffset = 0;
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
            return this.matchList[this.selected].slice(this.listOffset);
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
                    return this.prev();
            }
        }
        this.close();
        return 'unhandled';
    };

    return Autocomplete;

})();

module.exports = Autocomplete;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx3RkFBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUVoRTtJQUVDLHNCQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7Ozs7UUFFQSxJQUFDLENBQUEsU0FBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLE1BQUQsR0FBYTtRQUNiLElBQUMsQ0FBQSxNQUFELEdBQWE7UUFFYixJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxXQUFELEdBQWUsQ0FBQyxJQUFELEVBQU0sSUFBTixFQUFXLElBQVgsRUFBZ0IsSUFBaEIsRUFBcUIsSUFBckIsRUFBMEIsTUFBMUIsRUFBaUMsS0FBakM7UUFFZixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsTUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7SUFkRDs7MkJBc0JILFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFFUixZQUFBO1FBQUEsSUFBRyxDQUFJLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWixDQUFQO1lBQ0ksS0FBQSxHQUFRLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWDtZQUNSLEdBQUEsR0FBTSxLQUFLLENB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Q0EsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFSLEdBQW9CLGFBQUEsR0FBYSxDQUFDLE1BQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFiLEdBQXVCLFVBQS9CLENBQWIsR0FBdUQ7QUFML0U7MkJBRko7O0lBRlU7OzJCQWlCZCxzQkFBQSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtRQUVwQixJQUFHLEtBQUEsS0FBUyxLQUFaO1lBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBQTtZQUNBLFNBQUEsQ0FBVSxLQUFWO0FBQ0EsbUJBSEo7O1FBS0EsSUFBMEIsaUJBQTFCO0FBQUEsbUJBQU8sWUFBUDs7UUFFQSxJQUFHLEtBQUEsS0FBUyxPQUFaO1lBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBVSxFQUFWO0FBQ0EsbUJBRko7O1FBSUEsSUFBRyxpQkFBSDtBQUNJLG9CQUFPLEtBQVA7QUFBQSxxQkFDUyxXQURUO0FBQzBCLDJCQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBVjtBQURqQyxxQkFFUyxTQUZUO0FBRTBCLDJCQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYO0FBRmpDLHFCQUdTLEtBSFQ7QUFHMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUhqQyxxQkFJUyxNQUpUO0FBSTBCLDJCQUFPLElBQUMsQ0FBQSxLQUFELENBQUE7QUFKakMscUJBS1MsTUFMVDtBQUswQiwyQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBTGpDLHFCQU1TLElBTlQ7QUFNMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQU5qQyxhQURKOztRQVFBLElBQUMsQ0FBQSxLQUFELENBQUE7ZUFDQTtJQXRCb0I7Ozs7OztBQXdCNUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuIyMjXG5cbnsgc3RvcEV2ZW50LCBrZXJyb3IsIHNsYXNoLCB2YWxpZCwgZW1wdHksIGNsYW1wLCBrbG9nLCBrc3RyLCBlbGVtLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAbWF0Y2hMaXN0ID0gW11cbiAgICAgICAgQGNsb25lcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgPSBbXVxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEBzcGxpdFJlZ0V4cCA9IC9cXHMrL2dcbiAgICBcbiAgICAgICAgQGRpckNvbW1hbmRzID0gWydscycgJ2NkJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdpbnNlcnQnIEBvbkluc2VydFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgIEBjbG9zZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGRpck1hdGNoZXM6IChkaXIpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICBub0RpciA9IHNsYXNoLmZpbGUgZGlyXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZGlyXG4gICAgICAgICAgICBpZiBub3QgZGlyIG9yIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCA9IGRpciAgXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gJy8nIGlmIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9IG5vRGlyXG4gICAgICAgICAgICAgICAgZGlyID0gJydcblxuICAgICAgICBpdGVtcyA9IHNsYXNoLmxpc3QgZGlyXG5cbiAgICAgICAgaWYgdmFsaWQgaXRlbXNcblxuICAgICAgICAgICAgcmVzdWx0ID0gaXRlbXMubWFwIChpKSAtPiBcbiAgICAgICAgICAgICAgICBpZiBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aCBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgW2kubmFtZSwgY291bnQ6MF1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5vRGlyXG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoIG5vRGlyXG4gICAgICAgICAgICAgICAgICAgICAgICBbaS5uYW1lLCBjb3VudDowXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLycgb3IgZW1wdHkgZGlyXG4gICAgICAgICAgICAgICAgICAgICAgICBbaS5uYW1lLCBjb3VudDowXVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBbJy8nK2kubmFtZSwgY291bnQ6MF1cblxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmZpbHRlciAoZikgLT4gZlxuXG4gICAgICAgICAgICBpZiBkaXIgPT0gJy4nXG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycuLicgY291bnQ6OTk5XVxuICAgICAgICAgICAgZWxzZSBpZiBub3Qgbm9EaXIgYW5kIHZhbGlkKGRpcikgXG4gICAgICAgICAgICAgICAgaWYgbm90IGRpci5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycvJyBjb3VudDo5OTldXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJycgY291bnQ6OTk5XVxuXG4gICAgICAgICAgICByZXN1bHRcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY21kTWF0Y2hlczogKHdvcmQpIC0+XG4gICAgICAgIFxuICAgICAgICBwaWNrID0gKG9iaixjbWQpIC0+IGNtZC5zdGFydHNXaXRoKHdvcmQpIGFuZCBjbWQubGVuZ3RoID4gd29yZC5sZW5ndGhcbiAgICAgICAgbSA9IF8udG9QYWlycyBfLnBpY2tCeSB3aW5kb3cuYnJhaW4uY21kcywgcGlja1xuICAgICAgICBrbG9nICdjbWRNYXRjaGVzJyB3b3JkLCBtXG4gICAgICAgIG1cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgb25UYWI6IC0+XG4gICAgICAgIFxuICAgICAgICBtYyAgID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZSBtY1sxXVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGxpbmUudHJpbSgpXG4gICAgICAgIFxuICAgICAgICBpbmZvID1cbiAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgYmVmb3JlOiBsaW5lWzAuLi5tY1swXV1cbiAgICAgICAgICAgIGFmdGVyOiAgbGluZVttY1swXS4uXVxuICAgICAgICAgICAgY3Vyc29yOiBtY1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBzcGFuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBsaXN0IGFuZCBlbXB0eSBAY29tcGxldGlvblxuICAgICAgICAgICAgICAgIEBuYXZpZ2F0ZSAxXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN1ZmZpeCA9ICcnXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBAc2VsZWN0ZWRXb3JkKCkgXG4gICAgICAgICAgICAgICAgaWYgdmFsaWQoQGNvbXBsZXRpb24pIGFuZCBub3QgQGNvbXBsZXRpb24uZW5kc1dpdGggJy8nXG4gICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9ICcvJ1xuICAgICAgICAgICAgIyBrbG9nIFwib25UYWIgY29tcGxldGUgc3BhbiB8I3tAY29tcGxldGlvbn18IHN1ZmZpeCAje3N1ZmZpeH1cIlxuICAgICAgICAgICAgQGNvbXBsZXRlIHN1ZmZpeDpzdWZmaXhcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBvbkluc2VydCBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKGluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHdvcmQgPSBfLmxhc3QgaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHdvcmQ/Lmxlbmd0aFxuICAgICAgICAgICAgaWYgaW5mby5iZWZvcmUuc3BsaXQoJyAnKVswXSBpbiBAZGlyQ29tbWFuZHNcbiAgICAgICAgICAgICAgICBtYXRjaGVzID0gQGRpck1hdGNoZXMoKVxuICAgICAgICBlbHNlICBcbiAgICAgICAgICAgIG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyhAd29yZCkuY29uY2F0IEBjbWRNYXRjaGVzKGluZm8uYmVmb3JlKVxuXG4gICAgICAgIGlmIGVtcHR5IG1hdGNoZXNcbiAgICAgICAgICAgIG1hdGNoZXMgPSBAY21kTWF0Y2hlcyBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBtYXRjaGVzXG4gICAgICAgIFxuICAgICAgICBtYXRjaGVzLnNvcnQgKGEsYikgLT4gYlsxXS5jb3VudCAtIGFbMV0uY291bnRcbiAgICAgICAgICAgIFxuICAgICAgICB3b3JkcyA9IG1hdGNoZXMubWFwIChtKSAtPiBtWzBdXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSB3b3Jkc1xuICAgICAgICBAbWF0Y2hMaXN0ID0gd29yZHNbMS4uXVxuICAgICAgICBcbiAgICAgICAgaWYgd29yZHNbMF0uc3RhcnRzV2l0aCBAd29yZFxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSB3b3Jkc1swXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgd29yZHNbMF0uc3RhcnRzV2l0aCBzbGFzaC5maWxlIEB3b3JkXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSB3b3Jkc1swXS5zbGljZSBzbGFzaC5maWxlKEB3b3JkKS5sZW5ndGhcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IHdvcmRzWzBdXG4gICAgICAgIFxuICAgICAgICBAb3BlbiBpbmZvXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9wZW46IChpbmZvKSAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIFwiI3tpbmZvLmJlZm9yZX18I3tAY29tcGxldGlvbn18I3tpbmZvLmFmdGVyfSAje0B3b3JkfVwiXG4gICAgICAgIFxuICAgICAgICBjdXJzb3IgPSAkKCcubWFpbicgQGVkaXRvci52aWV3KVxuICAgICAgICBpZiBub3QgY3Vyc29yP1xuICAgICAgICAgICAga2Vycm9yIFwiQXV0b2NvbXBsZXRlLm9wZW4gLS0tIG5vIGN1cnNvcj9cIlxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczonYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ICAgICAgPSBAY29tcGxldGlvblxuICAgICAgICBAc3Bhbi5zdHlsZS5vcGFjaXR5ICAgID0gMVxuICAgICAgICBAc3Bhbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNDRhXCJcbiAgICAgICAgQHNwYW4uc3R5bGUuY29sb3IgICAgICA9IFwiI2ZmZlwiXG4gICAgICAgIEBzcGFuLnN0eWxlLnRyYW5zZm9ybSAgPSBcInRyYW5zbGF0ZXgoI3tAZWRpdG9yLnNpemUuY2hhcldpZHRoKkBlZGl0b3IubWFpbkN1cnNvcigpWzBdfXB4KVwiXG5cbiAgICAgICAgY3IgPSBjdXJzb3IuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcblxuICAgICAgICBpZiBub3Qgc3BhbkluZm8gPSBAZWRpdG9yLmxpbmVTcGFuQXRYWSBjci5sZWZ0KzIsIGNyLnRvcCsyXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBzcGFuSW5mbydcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcGFuSW5mby5zcGFuXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcGFuSW5mby5zcGFuLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWQgdGhlbiBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyB0aGVuIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoTGlzdC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1saXN0J1xuICAgICAgICAgICAgIyBAbGlzdC5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcgICAgIEBvbldoZWVsXG4gICAgICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSAwXG4gICAgICAgICAgICBpZiBzbGFzaC5kaXIoQHdvcmQpIGFuZCBub3QgQHdvcmQuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBzbGFzaC5maWxlKEB3b3JkKS5sZW5ndGhcbiAgICAgICAgICAgIGVsc2UgaWYgQG1hdGNoTGlzdFswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgIEBsaXN0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgjey1AZWRpdG9yLnNpemUuY2hhcldpZHRoKkBsaXN0T2Zmc2V0fXB4KVwiXG4gICAgICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoTGlzdFxuICAgICAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOidhdXRvY29tcGxldGUtaXRlbScgaW5kZXg6aW5kZXgrK1xuICAgICAgICAgICAgICAgIGl0ZW0udGV4dENvbnRlbnQgPSBtXG4gICAgICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgcG9zID0gQGVkaXRvci5jbGFtcFBvcyBzcGFuSW5mby5wb3NcbiAgICAgICAgICAgIGFib3ZlID0gcG9zWzFdICsgQG1hdGNoTGlzdC5sZW5ndGggLSBAZWRpdG9yLnNjcm9sbC50b3AgPj0gQGVkaXRvci5zY3JvbGwuZnVsbExpbmVzXG4gICAgICAgICAgICBpZiBhYm92ZVxuICAgICAgICAgICAgICAgIEBsaXN0LmNsYXNzTGlzdC5hZGQgJ2Fib3ZlJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBsaXN0LmNsYXNzTGlzdC5hZGQgJ2JlbG93J1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgY3Vyc29yLmFwcGVuZENoaWxkIEBsaXN0XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBjbG9zZTogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0P1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlRXZlbnRMaXN0ZW5lciAnd2hlZWwnIEBvbldoZWVsXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycgQG9uQ2xpY2tcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgQHNwYW4/LnJlbW92ZSgpXG4gICAgICAgIEBzZWxlY3RlZCAgID0gLTFcbiAgICAgICAgQGxpc3RPZmZzZXQgPSAwXG4gICAgICAgIEBsaXN0ICAgICAgID0gbnVsbFxuICAgICAgICBAc3BhbiAgICAgICA9IG51bGxcbiAgICAgICAgQGNvbXBsZXRpb24gPSBudWxsXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzXG4gICAgICAgICAgICBjLnJlbW92ZSgpXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZFxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ2luaXRpYWwnXG4gICAgICAgIFxuICAgICAgICBAY2xvbmVzID0gW11cbiAgICAgICAgQGNsb25lZCA9IFtdXG4gICAgICAgIEBtYXRjaExpc3QgID0gW11cbiAgICAgICAgQFxuXG4gICAgb25XaGVlbDogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgQGxpc3Quc2Nyb2xsVG9wICs9IGV2ZW50LmRlbHRhWVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcbiAgICBcbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBjb21wbGV0ZSB7fVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGNvbXBsZXRlOiAoc3VmZml4OicnKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5wYXN0ZVRleHQgQHNlbGVjdGVkQ29tcGxldGlvbigpICsgc3VmZml4XG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICBpc0xpc3RJdGVtU2VsZWN0ZWQ6IC0+IEBsaXN0IGFuZCBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBzZWxlY3RlZFdvcmQ6IC0+IEB3b3JkK0BzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgIFxuICAgIHNlbGVjdGVkQ29tcGxldGlvbjogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbWF0Y2hMaXN0W0BzZWxlY3RlZF0uc2xpY2UgQGxpc3RPZmZzZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaExpc3QubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbGlzdD8uY2hpbGRyZW5bMF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAgLT4gQG5hdmlnYXRlIC0xICAgIFxuICAgIG5leHQ6ICAtPiBAbmF2aWdhdGUgMVxuICAgIGxhc3Q6ICAtPiBAbmF2aWdhdGUgQG1hdGNoTGlzdC5sZW5ndGggLSBAc2VsZWN0ZWRcbiAgICBmaXJzdDogLT4gQG5hdmlnYXRlIC1JbmZpbml0eVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAY2xvbmVzXG4gICAgICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb21ibyA9PSAndGFiJ1xuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudCAjIHByZXZlbnQgZm9jdXMgY2hhbmdlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCcgaWYgbm90IEBzcGFuP1xuICAgICAgICBcbiAgICAgICAgaWYgY29tYm8gPT0gJ3JpZ2h0J1xuICAgICAgICAgICAgQGNvbXBsZXRlIHt9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSA5XG4gICAgICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIHJldHVybiBAbmF2aWdhdGUgLTlcbiAgICAgICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gcmV0dXJuIEBsYXN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gcmV0dXJuIEBmaXJzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIHJldHVybiBAbmV4dCgpXG4gICAgICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIHJldHVybiBAcHJldigpXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee