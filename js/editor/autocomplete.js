// koffee 1.4.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, Syntax, _, clamp, elem, empty, kerror, klog, kstr, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), stopEvent = ref.stopEvent, kerror = ref.kerror, slash = ref.slash, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, klog = ref.klog, kstr = ref.kstr, elem = ref.elem, $ = ref.$, _ = ref._;

Syntax = require('./syntax');

Autocomplete = (function() {
    function Autocomplete(editor) {
        this.editor = editor;
        this.onMouseDown = bind(this.onMouseDown, this);
        this.close = bind(this.close, this);
        this.onInsert = bind(this.onInsert, this);
        this.close();
        this.splitRegExp = /\s+/g;
        this.fileCommands = ['cd', 'ls', 'rm', 'cp', 'mv', 'krep', 'cat'];
        this.dirCommands = ['cd'];
        this.editor.on('insert', this.onInsert);
        this.editor.on('cursor', this.close);
        this.editor.on('blur', this.close);
    }

    Autocomplete.prototype.dirMatches = function(dir, arg) {
        var dirsOnly, items, noDir, noParent, ref1, result;
        dirsOnly = (ref1 = arg.dirsOnly) != null ? ref1 : false;
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
        items = slash.list(dir, {
            ignoreHidden: false
        });
        if (valid(items)) {
            result = items.map(function(i) {
                var count;
                if (dirsOnly && i.type === 'file') {
                    return;
                }
                count = i.type === 'dir' && 666 || 0;
                if (noParent) {
                    if (i.name.startsWith(noParent)) {
                        return [
                            i.name, {
                                count: count,
                                type: i.type
                            }
                        ];
                    }
                } else if (noDir) {
                    if (i.name.startsWith(noDir)) {
                        return [
                            i.name, {
                                count: count,
                                type: i.type
                            }
                        ];
                    }
                } else {
                    if (dir.slice(-1)[0] === '/' || empty(dir)) {
                        return [
                            i.name, {
                                count: count,
                                type: i.type
                            }
                        ];
                    } else {
                        return [
                            '/' + i.name, {
                                count: count,
                                type: i.type
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
                        count: 999,
                        type: 'dir'
                    }
                ]);
            } else if (!noDir && valid(dir)) {
                if (!dir.endsWith('/')) {
                    result.unshift([
                        '/', {
                            count: 999,
                            type: 'dir'
                        }
                    ]);
                } else {
                    result.unshift([
                        '', {
                            count: 999,
                            type: 'dir'
                        }
                    ]);
                }
            }
            return result;
        }
    };

    Autocomplete.prototype.cmdMatches = function(word) {
        var j, len, m, mtchs, pick;
        pick = function(obj, cmd) {
            return cmd.startsWith(word) && cmd.length > word.length;
        };
        mtchs = _.toPairs(_.pickBy(window.brain.cmds, pick));
        for (j = 0, len = mtchs.length; j < len; j++) {
            m = mtchs[j];
            m[1].type = 'cmd';
        }
        return mtchs;
    };

    Autocomplete.prototype.onTab = function() {
        var current, info, line, mc, suffix;
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
            current = this.selectedCompletion();
            if (this.list && empty(current)) {
                this.navigate(1);
            }
            suffix = '';
            if (slash.isDir(this.selectedWord())) {
                if (!current.endsWith('/') && !this.selectedWord().endsWith('/')) {
                    suffix = '/';
                }
            }
            klog("tab " + (this.selectedWord()) + " |" + current + "| suffix " + suffix);
            this.complete({
                suffix: suffix
            });
            return this.onTab();
        } else {
            return this.onInsert(info);
        }
    };

    Autocomplete.prototype.onInsert = function(info1) {
        var dirsOnly, first, firstCmd, includesCmds, j, len, m, mi, ref1, ref2, ref3, s, seen;
        this.info = info1;
        this.close();
        this.word = _.last(this.info.before.split(this.splitRegExp));
        this.info.split = this.info.before.length;
        firstCmd = this.info.before.split(' ')[0];
        dirsOnly = indexOf.call(this.dirCommands, firstCmd) >= 0;
        if (!((ref1 = this.word) != null ? ref1.length : void 0)) {
            if (indexOf.call(this.fileCommands, firstCmd) >= 0) {
                this.matches = this.dirMatches(null, {
                    dirsOnly: dirsOnly
                });
                klog('first dir matches', this.matches);
            }
            if (empty(this.matches)) {
                includesCmds = true;
                this.matches = this.cmdMatches(this.info.before);
            }
        } else {
            this.info.split = this.info.before.length - this.word.length;
            if (0 <= (s = this.word.lastIndexOf('/'))) {
                this.info.split += s + 1;
            }
            includesCmds = true;
            this.matches = this.dirMatches(this.word, {
                dirsOnly: dirsOnly
            }).concat(this.cmdMatches(this.info.before));
        }
        if (empty(this.matches)) {
            return;
        }
        this.matches.sort(function(a, b) {
            return b[1].count - a[1].count;
        });
        first = this.matches.shift();
        if (includesCmds) {
            seen = [first[0]];
            if (first[1].type === 'cmd') {
                seen = [first[0].slice(this.info.split)];
                first[0] = first[0].slice(this.info.before.length);
            }
            ref2 = this.matches;
            for (j = 0, len = ref2.length; j < len; j++) {
                m = ref2[j];
                if (m[1].type === 'cmd') {
                    if (this.info.split) {
                        m[0] = m[0].slice(this.info.split);
                    }
                }
            }
            mi = 0;
            while (mi < this.matches.length) {
                if (ref3 = this.matches[mi][0], indexOf.call(seen, ref3) >= 0) {
                    this.matches.splice(mi, 1);
                } else {
                    seen.push(this.matches[mi][0]);
                    mi++;
                }
            }
        }
        if (first[0].startsWith(this.word)) {
            this.completion = first[0].slice(this.word.length);
        } else if (first[0].startsWith(this.info.before)) {
            this.completion = first[0].slice(this.info.before.length);
        } else {
            if (first[0].startsWith(slash.file(this.word))) {
                this.completion = first[0].slice(slash.file(this.word).length);
            } else {
                this.completion = first[0];
            }
        }
        return this.open();
    };

    Autocomplete.prototype.open = function() {
        var c, j, k, len, len1, ref1, ref2, sibling, spanBefore;
        this.span = elem('span', {
            "class": 'autocomplete-span'
        });
        this.span.textContent = this.completion;
        this.span.style.opacity = 1;
        this.span.style.background = "#44a";
        this.span.style.color = "#fff";
        this.span.style.transform = "translatex(" + (this.editor.size.charWidth * this.editor.mainCursor()[0]) + "px)";
        if (!(spanBefore = this.editor.spanBeforeMain())) {
            return kerror('no spanInfo');
        }
        sibling = spanBefore;
        while (sibling = sibling.nextSibling) {
            this.clones.push(sibling.cloneNode(true));
            this.cloned.push(sibling);
        }
        spanBefore.parentElement.appendChild(this.span);
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
        if (this.matches.length) {
            return this.showList();
        }
    };

    Autocomplete.prototype.showList = function() {
        var above, cursor, index, item, j, len, match, mc, ref1;
        this.list = elem({
            "class": 'autocomplete-list'
        });
        this.list.addEventListener('mousedown', this.onMouseDown);
        this.listOffset = 0;
        if (slash.dir(this.word) && !this.word.endsWith('/')) {
            this.listOffset = slash.file(this.word).length;
            klog('fileOffset', this.listOffset, this.word);
        } else if (this.matches[0][0].startsWith(this.word)) {
            this.listOffset = this.word.length;
            klog('listOffset', this.listOffset);
        } else if (this.matches[0][0].startsWith(this.info.before)) {
            this.listOffset = this.info.before.length;
            klog('beforeOffset', this.listOffset);
        }
        this.list.style.transform = "translatex(" + (-this.editor.size.charWidth * this.listOffset) + "px)";
        index = 0;
        ref1 = this.matches;
        for (j = 0, len = ref1.length; j < len; j++) {
            match = ref1[j];
            item = elem({
                "class": 'autocomplete-item',
                index: index++
            });
            item.innerHTML = Syntax.spanForTextAndSyntax(match[0], 'sh');
            item.classList.add(match[1].type);
            this.list.appendChild(item);
        }
        mc = this.editor.mainCursor();
        above = mc[1] + this.matches.length >= this.editor.scroll.fullLines;
        if (above) {
            this.list.classList.add('above');
        } else {
            this.list.classList.add('below');
        }
        cursor = $('.main', this.editor.view);
        return cursor.appendChild(this.list);
    };

    Autocomplete.prototype.close = function() {
        var c, j, k, len, len1, ref1, ref2, ref3, ref4, ref5;
        if (this.list != null) {
            this.list.removeEventListener('click', this.onClick);
            this.list.remove();
        }
        ref2 = (ref1 = this.clones) != null ? ref1 : [];
        for (j = 0, len = ref2.length; j < len; j++) {
            c = ref2[j];
            c.remove();
        }
        ref4 = (ref3 = this.cloned) != null ? ref3 : [];
        for (k = 0, len1 = ref4.length; k < len1; k++) {
            c = ref4[k];
            c.style.display = 'initial';
        }
        if ((ref5 = this.span) != null) {
            ref5.remove();
        }
        this.selected = -1;
        this.listOffset = 0;
        this.list = null;
        this.span = null;
        this.completion = null;
        this.matches = [];
        this.clones = [];
        this.cloned = [];
        return this;
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
            return this.matches[this.selected][0].slice(this.listOffset);
        } else {
            return this.completion;
        }
    };

    Autocomplete.prototype.navigate = function(delta) {
        if (!this.list) {
            return;
        }
        return this.select(clamp(-1, this.matches.length - 1, this.selected + delta));
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
        return this.navigate(this.matches.length - this.selected);
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
        switch (combo) {
            case 'right':
                return this.complete({});
        }
        if (this.list != null) {
            switch (combo) {
                case 'page down':
                    return this.navigate(+9);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnR0FBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUV0RSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFQyxzQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsSUFBRCxFQUFNLElBQU4sRUFBVyxJQUFYLEVBQWdCLElBQWhCLEVBQXFCLElBQXJCLEVBQTBCLE1BQTFCLEVBQWlDLEtBQWpDO1FBQ2hCLElBQUMsQ0FBQSxXQUFELEdBQWdCLENBQUMsSUFBRDtRQUVoQixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsTUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7SUFYRDs7MkJBbUJILFVBQUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBRVIsWUFBQTtRQUZjLGtEQUFTO1FBRXZCLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixH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Q0FBQSxLQUFELENBQUE7QUFKakMscUJBS1MsTUFMVDtBQUswQiwyQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBTGpDLHFCQU1TLElBTlQ7QUFNMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQU5qQyxhQURKOztRQVFBLElBQUMsQ0FBQSxLQUFELENBQUE7ZUFDQTtJQXRCb0I7Ozs7OztBQXdCNUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuIyMjXG5cbnsgc3RvcEV2ZW50LCBrZXJyb3IsIHNsYXNoLCB2YWxpZCwgZW1wdHksIGNsYW1wLCBrbG9nLCBrc3RyLCBlbGVtLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblN5bnRheCA9IHJlcXVpcmUgJy4vc3ludGF4J1xuXG5jbGFzcyBBdXRvY29tcGxldGVcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEBzcGxpdFJlZ0V4cCA9IC9cXHMrL2dcbiAgICBcbiAgICAgICAgQGZpbGVDb21tYW5kcyA9IFsnY2QnICdscycgJ3JtJyAnY3AnICdtdicgJ2tyZXAnICdjYXQnXVxuICAgICAgICBAZGlyQ29tbWFuZHMgID0gWydjZCddXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdpbnNlcnQnIEBvbkluc2VydFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgIEBjbG9zZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGRpck1hdGNoZXM6IChkaXIsIGRpcnNPbmx5OmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHNsYXNoLmlzRGlyIGRpclxuICAgICAgICAgICAgbm9EaXIgPSBzbGFzaC5maWxlIGRpclxuICAgICAgICAgICAgZGlyID0gc2xhc2guZGlyIGRpclxuICAgICAgICAgICAgaWYgbm90IGRpciBvciBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgPSBkaXIgIFxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9ICcvJyBpZiBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCArPSBub0RpclxuICAgICAgICAgICAgICAgIGRpciA9ICcnXG5cbiAgICAgICAgaXRlbXMgPSBzbGFzaC5saXN0IGRpciwgaWdub3JlSGlkZGVuOmZhbHNlXG5cbiAgICAgICAgaWYgdmFsaWQgaXRlbXNcblxuICAgICAgICAgICAgcmVzdWx0ID0gaXRlbXMubWFwIChpKSAtPlxuICAgICAgICAgICAgICAgIGlmIGRpcnNPbmx5IGFuZCBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIGNvdW50ID0gaS50eXBlPT0nZGlyJyBhbmQgNjY2IG9yIDBcbiAgICAgICAgICAgICAgICBpZiBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aCBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgW2kubmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbm9EaXJcbiAgICAgICAgICAgICAgICAgICAgaWYgaS5uYW1lLnN0YXJ0c1dpdGggbm9EaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtpLm5hbWUsIGNvdW50OmNvdW50LCB0eXBlOmkudHlwZV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy8nIG9yIGVtcHR5IGRpclxuICAgICAgICAgICAgICAgICAgICAgICAgW2kubmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBbJy8nK2kubmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuZmlsdGVyIChmKSAtPiBmXG5cbiAgICAgICAgICAgIGlmIGRpciA9PSAnLidcbiAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy4uJyBjb3VudDo5OTksIHR5cGU6J2RpciddXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBub0RpciBhbmQgdmFsaWQoZGlyKSBcbiAgICAgICAgICAgICAgICBpZiBub3QgZGlyLmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy8nIGNvdW50Ojk5OSwgdHlwZTonZGlyJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnJyBjb3VudDo5OTksIHR5cGU6J2RpciddXG5cbiAgICAgICAgICAgIHJlc3VsdFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjbWRNYXRjaGVzOiAod29yZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHBpY2sgPSAob2JqLGNtZCkgLT4gY21kLnN0YXJ0c1dpdGgod29yZCkgYW5kIGNtZC5sZW5ndGggPiB3b3JkLmxlbmd0aFxuICAgICAgICBtdGNocyA9IF8udG9QYWlycyBfLnBpY2tCeSB3aW5kb3cuYnJhaW4uY21kcywgcGlja1xuICAgICAgICBtWzFdLnR5cGUgPSAnY21kJyBmb3IgbSBpbiBtdGNoc1xuICAgICAgICBtdGNoc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBvblRhYjogLT5cbiAgICAgICAgXG4gICAgICAgIG1jICAgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lIG1jWzFdXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgbGluZS50cmltKClcbiAgICAgICAgXG4gICAgICAgIGluZm8gPVxuICAgICAgICAgICAgbGluZTogICBsaW5lXG4gICAgICAgICAgICBiZWZvcmU6IGxpbmVbMC4uLm1jWzBdXVxuICAgICAgICAgICAgYWZ0ZXI6ICBsaW5lW21jWzBdLi5dXG4gICAgICAgICAgICBjdXJzb3I6IG1jXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHNwYW5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY3VycmVudCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICAgICAgaWYgQGxpc3QgYW5kIGVtcHR5IGN1cnJlbnRcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGUgMVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdWZmaXggPSAnJ1xuICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgQHNlbGVjdGVkV29yZCgpXG4gICAgICAgICAgICAgICAgaWYgbm90IGN1cnJlbnQuZW5kc1dpdGgoJy8nKSBhbmQgbm90IEBzZWxlY3RlZFdvcmQoKS5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gJy8nXG4gICAgICAgICAgICBrbG9nIFwidGFiICN7QHNlbGVjdGVkV29yZCgpfSB8I3tjdXJyZW50fXwgc3VmZml4ICN7c3VmZml4fVwiXG4gICAgICAgICAgICBAY29tcGxldGUgc3VmZml4OnN1ZmZpeFxuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBvbkluc2VydCBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKEBpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEB3b3JkID0gXy5sYXN0IEBpbmZvLmJlZm9yZS5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgXG4gICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBmaXJzdENtZCA9IEBpbmZvLmJlZm9yZS5zcGxpdCgnICcpWzBdXG4gICAgICAgIGRpcnNPbmx5ID0gZmlyc3RDbWQgaW4gQGRpckNvbW1hbmRzXG4gICAgICAgIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICBpZiBmaXJzdENtZCBpbiBAZmlsZUNvbW1hbmRzXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyBudWxsIGRpcnNPbmx5OmRpcnNPbmx5XG4gICAgICAgICAgICAgICAga2xvZyAnZmlyc3QgZGlyIG1hdGNoZXMnIEBtYXRjaGVzXG4gICAgICAgICAgICBpZiBlbXB0eSBAbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBjbWRNYXRjaGVzIEBpbmZvLmJlZm9yZVxuICAgICAgICBlbHNlICBcbiAgICAgICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aCAtIEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgaWYgMCA8PSBzID0gQHdvcmQubGFzdEluZGV4T2YgJy8nXG4gICAgICAgICAgICAgICAgQGluZm8uc3BsaXQgKz0gcyArIDFcbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5jbHVkZXNDbWRzID0gdHJ1ZVxuICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyhAd29yZCwgZGlyc09ubHk6ZGlyc09ubHkpLmNvbmNhdCBAY21kTWF0Y2hlcyBAaW5mby5iZWZvcmVcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgQG1hdGNoZXNcbiAgICAgICAgXG4gICAgICAgIEBtYXRjaGVzLnNvcnQgKGEsYikgLT4gYlsxXS5jb3VudCAtIGFbMV0uY291bnRcbiAgICAgICAgICAgIFxuICAgICAgICBmaXJzdCA9IEBtYXRjaGVzLnNoaWZ0KCkgIyBzZXBlcmF0ZSBmaXJzdCBtYXRjaFxuICAgICAgICBcbiAgICAgICAgaWYgaW5jbHVkZXNDbWRzICMgc2hvcnRlbiBjb21tYW5kIGNvbXBsZXRpb25zXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNlZW4gPSBbZmlyc3RbMF1dXG4gICAgICAgICAgICBpZiBmaXJzdFsxXS50eXBlID09ICdjbWQnXG4gICAgICAgICAgICAgICAgc2VlbiA9IFtmaXJzdFswXVtAaW5mby5zcGxpdC4uXV1cbiAgICAgICAgICAgICAgICBmaXJzdFswXSA9IGZpcnN0WzBdW0BpbmZvLmJlZm9yZS5sZW5ndGguLl1cbiAgICBcbiAgICAgICAgICAgIGZvciBtIGluIEBtYXRjaGVzXG4gICAgICAgICAgICAgICAgaWYgbVsxXS50eXBlID09ICdjbWQnXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpbmZvLnNwbGl0XG4gICAgICAgICAgICAgICAgICAgICAgICBtWzBdID0gbVswXVtAaW5mby5zcGxpdC4uXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG1pID0gMFxuICAgICAgICAgICAgd2hpbGUgbWkgPCBAbWF0Y2hlcy5sZW5ndGggIyBjcmFwcHkgZHVwbGljYXRlIGZpbHRlclxuICAgICAgICAgICAgICAgIGlmIEBtYXRjaGVzW21pXVswXSBpbiBzZWVuXG4gICAgICAgICAgICAgICAgICAgIEBtYXRjaGVzLnNwbGljZSBtaSwgMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgc2Vlbi5wdXNoIEBtYXRjaGVzW21pXVswXVxuICAgICAgICAgICAgICAgICAgICBtaSsrXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBAd29yZFxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBmaXJzdFswXS5zdGFydHNXaXRoIEBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggc2xhc2guZmlsZSBAd29yZFxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2Ugc2xhc2guZmlsZShAd29yZCkubGVuZ3RoXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXVxuICAgICAgICBcbiAgICAgICAgQG9wZW4oKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBvcGVuOiAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIFwiI3tAaW5mby5iZWZvcmV9fCN7QGNvbXBsZXRpb259fCN7QGluZm8uYWZ0ZXJ9ICN7QHdvcmR9XCJcbiAgICAgICAgXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6J2F1dG9jb21wbGV0ZS1zcGFuJ1xuICAgICAgICBAc3Bhbi50ZXh0Q29udGVudCAgICAgID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuICAgICAgICBAc3Bhbi5zdHlsZS50cmFuc2Zvcm0gID0gXCJ0cmFuc2xhdGV4KCN7QGVkaXRvci5zaXplLmNoYXJXaWR0aCpAZWRpdG9yLm1haW5DdXJzb3IoKVswXX1weClcIlxuXG4gICAgICAgIGlmIG5vdCBzcGFuQmVmb3JlID0gQGVkaXRvci5zcGFuQmVmb3JlTWFpbigpXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBzcGFuSW5mbydcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcGFuQmVmb3JlXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcGFuQmVmb3JlLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWQgdGhlbiBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyB0aGVuIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNob3dMaXN0OiAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIEBtYXRjaGVzXG4gICAgICAgIFxuICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtbGlzdCdcbiAgICAgICAgQGxpc3QuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25Nb3VzZURvd25cbiAgICAgICAgQGxpc3RPZmZzZXQgPSAwXG4gICAgICAgIGlmIHNsYXNoLmRpcihAd29yZCkgYW5kIG5vdCBAd29yZC5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgIEBsaXN0T2Zmc2V0ID0gc2xhc2guZmlsZShAd29yZCkubGVuZ3RoXG4gICAgICAgICAgICBrbG9nICdmaWxlT2Zmc2V0JyBAbGlzdE9mZnNldCwgQHdvcmRcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlc1swXVswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAga2xvZyAnbGlzdE9mZnNldCcgQGxpc3RPZmZzZXRcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlc1swXVswXS5zdGFydHNXaXRoIEBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgICAgICBrbG9nICdiZWZvcmVPZmZzZXQnIEBsaXN0T2Zmc2V0XG4gICAgICAgICMgZWxzZVxuICAgICAgICAgICAgIyBrbG9nICdub09mZnNldD8nIFxuICAgICAgICAgICAgXG4gICAgICAgIEBsaXN0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgjey1AZWRpdG9yLnNpemUuY2hhcldpZHRoKkBsaXN0T2Zmc2V0fXB4KVwiXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIG1hdGNoIGluIEBtYXRjaGVzXG4gICAgICAgICAgICBpdGVtID0gZWxlbSBjbGFzczonYXV0b2NvbXBsZXRlLWl0ZW0nIGluZGV4OmluZGV4KytcbiAgICAgICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IG1hdGNoWzBdLCAnc2gnXG4gICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQgbWF0Y2hbMV0udHlwZVxuICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBhYm92ZSA9IG1jWzFdICsgQG1hdGNoZXMubGVuZ3RoID49IEBlZGl0b3Iuc2Nyb2xsLmZ1bGxMaW5lc1xuICAgICAgICBpZiBhYm92ZVxuICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYWJvdmUnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsaXN0LmNsYXNzTGlzdC5hZGQgJ2JlbG93J1xuICAgICAgICAgICAgXG4gICAgICAgIGN1cnNvciA9JCAnLm1haW4nIEBlZGl0b3Iudmlld1xuICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycgQG9uQ2xpY2tcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyA/IFtdXG4gICAgICAgICAgICBjLnJlbW92ZSgpXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZCA/IFtdXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnaW5pdGlhbCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc3Bhbj8ucmVtb3ZlKClcbiAgICAgICAgQHNlbGVjdGVkICAgPSAtMVxuICAgICAgICBAbGlzdE9mZnNldCA9IDBcbiAgICAgICAgQGxpc3QgICAgICAgPSBudWxsXG4gICAgICAgIEBzcGFuICAgICAgID0gbnVsbFxuICAgICAgICBAY29tcGxldGlvbiA9IG51bGxcbiAgICAgICAgQG1hdGNoZXMgICAgPSBbXVxuICAgICAgICBAY2xvbmVzICAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgID0gW11cbiAgICAgICAgQFxuXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gZWxlbS51cEF0dHIgZXZlbnQudGFyZ2V0LCAnaW5kZXgnXG4gICAgICAgIGlmIGluZGV4ICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2VsZWN0IGluZGV4XG4gICAgICAgICAgICBAY29tcGxldGUge31cbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBjb21wbGV0ZTogKHN1ZmZpeDonJykgLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IucGFzdGVUZXh0IEBzZWxlY3RlZENvbXBsZXRpb24oKSArIHN1ZmZpeFxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgaXNMaXN0SXRlbVNlbGVjdGVkOiAtPiBAbGlzdCBhbmQgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgc2VsZWN0ZWRXb3JkOiAtPiBAd29yZCtAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICBcbiAgICBzZWxlY3RlZENvbXBsZXRpb246IC0+XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICAjIGtsb2cgJ2NvbXBsZXRpb24nIEBzZWxlY3RlZCAsIEBtYXRjaGVzW0BzZWxlY3RlZF1bMF0sIEBsaXN0T2Zmc2V0XG4gICAgICAgICAgICBAbWF0Y2hlc1tAc2VsZWN0ZWRdWzBdLnNsaWNlIEBsaXN0T2Zmc2V0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjb21wbGV0aW9uXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGRlbHRhKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdFxuICAgICAgICBAc2VsZWN0IGNsYW1wIC0xLCBAbWF0Y2hlcy5sZW5ndGgtMSwgQHNlbGVjdGVkK2RlbHRhXG4gICAgICAgIFxuICAgIHNlbGVjdDogKGluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbGlzdD8uY2hpbGRyZW5bMF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAgLT4gQG5hdmlnYXRlIC0xICAgIFxuICAgIG5leHQ6ICAtPiBAbmF2aWdhdGUgMVxuICAgIGxhc3Q6ICAtPiBAbmF2aWdhdGUgQG1hdGNoZXMubGVuZ3RoIC0gQHNlbGVjdGVkXG4gICAgZmlyc3Q6IC0+IEBuYXZpZ2F0ZSAtSW5maW5pdHlcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcblxuICAgIG1vdmVDbG9uZXNCeTogKG51bUNoYXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQGNsb25lc1xuICAgICAgICAgICAgYmVmb3JlTGVuZ3RoID0gQGNsb25lc1swXS5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzEuLi5AY2xvbmVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBjID0gQGNsb25lc1tjaV1cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbY2ktMV0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgICAgICAgICAgY2hhck9mZnNldCA9IG51bUNoYXJzXG4gICAgICAgICAgICAgICAgY2hhck9mZnNldCArPSBiZWZvcmVMZW5ndGggaWYgY2kgPT0gMVxuICAgICAgICAgICAgICAgIGMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7b2Zmc2V0K0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqY2hhck9mZnNldH1weClcIlxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29tYm8gPT0gJ3RhYidcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnQgIyBwcmV2ZW50IGZvY3VzIGNoYW5nZVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnIGlmIG5vdCBAc3Bhbj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ibyBcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAgICAgdGhlbiByZXR1cm4gQGNvbXBsZXRlIHt9XG4gICAgICAgICAgICAjIHdoZW4gJ2JhY2tzcGFjZScgdGhlbiBrbG9nICdiYWNrc3BhY2UhJ1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0PyBcbiAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiByZXR1cm4gQG5hdmlnYXRlICs5XG4gICAgICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIHJldHVybiBAbmF2aWdhdGUgLTlcbiAgICAgICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gcmV0dXJuIEBsYXN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gcmV0dXJuIEBmaXJzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIHJldHVybiBAbmV4dCgpXG4gICAgICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIHJldHVybiBAcHJldigpXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee