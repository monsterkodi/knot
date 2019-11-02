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
                    } else if (i.name[0] === '.') {
                        if (dir.slice(-1)[0] === '.') {
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
                    } else {
                        if (dir.slice(-1)[0] === '.') {
                            return [
                                './' + i.name, {
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
                }
            });
            result = result.filter(function(f) {
                return f;
            });
            if (dir.endsWith('../')) {
                if (!slash.isRoot(slash.join(process.cwd(), dir))) {
                    result.unshift([
                        '..', {
                            count: 999,
                            type: 'dir'
                        }
                    ]);
                }
                result.unshift([
                    '', {
                        count: 999,
                        type: 'dir'
                    }
                ]);
            } else if (dir === '.' || dir.endsWith('/.')) {
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
        }
        return result != null ? result : [];
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
            }
            if (empty(this.matches)) {
                includesCmds = true;
                this.matches = this.cmdMatches(this.info.before);
            }
        } else {
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
        if (first[0] === '/') {
            this.info.split = this.info.before.length;
        } else {
            this.info.split = this.info.before.length - this.word.length;
            if (0 <= (s = this.word.lastIndexOf('/'))) {
                this.info.split += s + 1;
            }
        }
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
        var above, cursor, index, item, j, len, match, mc, ref1, splt;
        this.list = elem({
            "class": 'autocomplete-list'
        });
        this.list.addEventListener('mousedown', this.onMouseDown);
        this.listOffset = 0;
        splt = this.word.split('/');
        if (splt.length > 1 && !this.word.endsWith('/') && this.completion !== '/') {
            this.listOffset = splt.slice(-1)[0].length;
        } else if (this.matches[0][0].startsWith(this.word)) {
            this.listOffset = this.word.length;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnR0FBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUV0RSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFQyxzQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsSUFBRCxFQUFNLElBQU4sRUFBVyxJQUFYLEVBQWdCLElBQWhCLEVBQXFCLElBQXJCLEVBQTBCLE1BQTFCLEVBQWlDLEtBQWpDO1FBQ2hCLElBQUMsQ0FBQSxXQUFELEdBQWdCLENBQUMsSUFBRDtRQUVoQixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsTUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7SUFYRDs7MkJBbUJILFVBQUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBRVIsWUFBQTtRQUZjLGtEQUFTO1FBRXZCLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixH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dXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyBzdG9wRXZlbnQsIGtlcnJvciwgc2xhc2gsIHZhbGlkLCBlbXB0eSwgY2xhbXAsIGtsb2csIGtzdHIsIGVsZW0sICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3ludGF4ID0gcmVxdWlyZSAnLi9zeW50YXgnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHNwbGl0UmVnRXhwID0gL1xccysvZ1xuICAgIFxuICAgICAgICBAZmlsZUNvbW1hbmRzID0gWydjZCcgJ2xzJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIEBkaXJDb21tYW5kcyAgPSBbJ2NkJ11cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2luc2VydCcgQG9uSW5zZXJ0XG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgQGNsb3NlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgZGlyTWF0Y2hlczogKGRpciwgZGlyc09ubHk6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICBub0RpciA9IHNsYXNoLmZpbGUgZGlyXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZGlyXG4gICAgICAgICAgICBpZiBub3QgZGlyIG9yIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCA9IGRpciAgXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gJy8nIGlmIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9IG5vRGlyXG4gICAgICAgICAgICAgICAgZGlyID0gJydcblxuICAgICAgICBpdGVtcyA9IHNsYXNoLmxpc3QgZGlyLCBpZ25vcmVIaWRkZW46ZmFsc2VcblxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuXG4gICAgICAgICAgICByZXN1bHQgPSBpdGVtcy5tYXAgKGkpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIGRpcnNPbmx5IGFuZCBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvdW50ID0gaS50eXBlPT0nZGlyJyBhbmQgNjY2IG9yIDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aCBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgW2kubmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbm9EaXJcbiAgICAgICAgICAgICAgICAgICAgaWYgaS5uYW1lLnN0YXJ0c1dpdGggbm9EaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtpLm5hbWUsIGNvdW50OmNvdW50LCB0eXBlOmkudHlwZV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy8nIG9yIGVtcHR5KGRpcilcbiAgICAgICAgICAgICAgICAgICAgICAgIFtpLm5hbWUsIGNvdW50OmNvdW50LCB0eXBlOmkudHlwZV1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpLm5hbWVbMF0gPT0gJy4nXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtpLm5hbWUsIGNvdW50OmNvdW50LCB0eXBlOmkudHlwZV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbJy8nK2kubmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsnLi8nK2kubmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFsnLycraS5uYW1lLCBjb3VudDpjb3VudCwgdHlwZTppLnR5cGVdXG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5maWx0ZXIgKGYpIC0+IGZcblxuICAgICAgICAgICAgaWYgZGlyLmVuZHNXaXRoICcuLi8nXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLmlzUm9vdCBzbGFzaC5qb2luIHByb2Nlc3MuY3dkKCksIGRpclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy4uJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJycgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICBlbHNlIGlmIGRpciA9PSAnLicgb3IgZGlyLmVuZHNXaXRoKCcvLicpXG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycuLicgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBub0RpciBhbmQgdmFsaWQoZGlyKSBcbiAgICAgICAgICAgICAgICBpZiBub3QgZGlyLmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy8nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICByZXN1bHQgPyBbXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjbWRNYXRjaGVzOiAod29yZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHBpY2sgPSAob2JqLGNtZCkgLT4gY21kLnN0YXJ0c1dpdGgod29yZCkgYW5kIGNtZC5sZW5ndGggPiB3b3JkLmxlbmd0aFxuICAgICAgICBtdGNocyA9IF8udG9QYWlycyBfLnBpY2tCeSB3aW5kb3cuYnJhaW4uY21kcywgcGlja1xuICAgICAgICBtWzFdLnR5cGUgPSAnY21kJyBmb3IgbSBpbiBtdGNoc1xuICAgICAgICBtdGNoc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBvblRhYjogLT5cbiAgICAgICAgXG4gICAgICAgIG1jICAgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lIG1jWzFdXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgbGluZS50cmltKClcbiAgICAgICAgXG4gICAgICAgIGluZm8gPVxuICAgICAgICAgICAgbGluZTogICBsaW5lXG4gICAgICAgICAgICBiZWZvcmU6IGxpbmVbMC4uLm1jWzBdXVxuICAgICAgICAgICAgYWZ0ZXI6ICBsaW5lW21jWzBdLi5dXG4gICAgICAgICAgICBjdXJzb3I6IG1jXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHNwYW5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY3VycmVudCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICAgICAgaWYgQGxpc3QgYW5kIGVtcHR5IGN1cnJlbnRcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGUgMVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdWZmaXggPSAnJ1xuICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgQHNlbGVjdGVkV29yZCgpXG4gICAgICAgICAgICAgICAgaWYgbm90IGN1cnJlbnQuZW5kc1dpdGgoJy8nKSBhbmQgbm90IEBzZWxlY3RlZFdvcmQoKS5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gJy8nXG4gICAgICAgICAgICBrbG9nIFwidGFiICN7QHNlbGVjdGVkV29yZCgpfSB8I3tjdXJyZW50fXwgc3VmZml4ICN7c3VmZml4fVwiXG4gICAgICAgICAgICBAY29tcGxldGUgc3VmZml4OnN1ZmZpeFxuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBvbkluc2VydCBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKEBpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEB3b3JkID0gXy5sYXN0IEBpbmZvLmJlZm9yZS5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgXG4gICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBmaXJzdENtZCA9IEBpbmZvLmJlZm9yZS5zcGxpdCgnICcpWzBdXG4gICAgICAgIGRpcnNPbmx5ID0gZmlyc3RDbWQgaW4gQGRpckNvbW1hbmRzXG4gICAgICAgIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICBpZiBmaXJzdENtZCBpbiBAZmlsZUNvbW1hbmRzXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyBudWxsIGRpcnNPbmx5OmRpcnNPbmx5XG4gICAgICAgICAgICBpZiBlbXB0eSBAbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBjbWRNYXRjaGVzIEBpbmZvLmJlZm9yZVxuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgIEBtYXRjaGVzID0gQGRpck1hdGNoZXMoQHdvcmQsIGRpcnNPbmx5OmRpcnNPbmx5KS5jb25jYXQgQGNtZE1hdGNoZXMgQGluZm8uYmVmb3JlXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEBtYXRjaGVzXG4gICAgICAgIFxuICAgICAgICBAbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uY291bnQgLSBhWzFdLmNvdW50XG4gICAgICAgICAgICBcbiAgICAgICAgZmlyc3QgPSBAbWF0Y2hlcy5zaGlmdCgpICMgc2VwZXJhdGUgZmlyc3QgbWF0Y2hcbiAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdID09ICcvJ1xuICAgICAgICAgICAgQGluZm8uc3BsaXQgPSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aCAtIEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgaWYgMCA8PSBzID0gQHdvcmQubGFzdEluZGV4T2YgJy8nXG4gICAgICAgICAgICAgICAgQGluZm8uc3BsaXQgKz0gcyArIDFcbiAgICAgICAgXG4gICAgICAgIGlmIGluY2x1ZGVzQ21kcyAjIHNob3J0ZW4gY29tbWFuZCBjb21wbGV0aW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdXVxuICAgICAgICAgICAgaWYgZmlyc3RbMV0udHlwZSA9PSAnY21kJ1xuICAgICAgICAgICAgICAgIHNlZW4gPSBbZmlyc3RbMF1bQGluZm8uc3BsaXQuLl1dXG4gICAgICAgICAgICAgICAgZmlyc3RbMF0gPSBmaXJzdFswXVtAaW5mby5iZWZvcmUubGVuZ3RoLi5dXG4gICAgXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGlmIG1bMV0udHlwZSA9PSAnY21kJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAaW5mby5zcGxpdFxuICAgICAgICAgICAgICAgICAgICAgICAgbVswXSA9IG1bMF1bQGluZm8uc3BsaXQuLl1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBtaSA9IDBcbiAgICAgICAgICAgIHdoaWxlIG1pIDwgQG1hdGNoZXMubGVuZ3RoICMgY3JhcHB5IGR1cGxpY2F0ZSBmaWx0ZXJcbiAgICAgICAgICAgICAgICBpZiBAbWF0Y2hlc1ttaV1bMF0gaW4gc2VlblxuICAgICAgICAgICAgICAgICAgICBAbWF0Y2hlcy5zcGxpY2UgbWksIDFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHNlZW4ucHVzaCBAbWF0Y2hlc1ttaV1bMF1cbiAgICAgICAgICAgICAgICAgICAgbWkrK1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggQHdvcmRcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgIGVsc2UgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBAaW5mby5iZWZvcmVcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2UgQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBmaXJzdFswXS5zdGFydHNXaXRoIHNsYXNoLmZpbGUgQHdvcmRcbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIHNsYXNoLmZpbGUoQHdvcmQpLmxlbmd0aFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF1cbiAgICAgICAgXG4gICAgICAgIEBvcGVuKClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBcIiN7QGluZm8uYmVmb3JlfXwje0Bjb21wbGV0aW9ufXwje0BpbmZvLmFmdGVyfSAje0B3b3JkfVwiXG4gICAgICAgIFxuICAgICAgICBAc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOidhdXRvY29tcGxldGUtc3BhbidcbiAgICAgICAgQHNwYW4udGV4dENvbnRlbnQgICAgICA9IEBjb21wbGV0aW9uXG4gICAgICAgIEBzcGFuLnN0eWxlLm9wYWNpdHkgICAgPSAxXG4gICAgICAgIEBzcGFuLnN0eWxlLmJhY2tncm91bmQgPSBcIiM0NGFcIlxuICAgICAgICBAc3Bhbi5zdHlsZS5jb2xvciAgICAgID0gXCIjZmZmXCJcbiAgICAgICAgQHNwYW4uc3R5bGUudHJhbnNmb3JtICA9IFwidHJhbnNsYXRleCgje0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqQGVkaXRvci5tYWluQ3Vyc29yKClbMF19cHgpXCJcblxuICAgICAgICBpZiBub3Qgc3BhbkJlZm9yZSA9IEBlZGl0b3Iuc3BhbkJlZm9yZU1haW4oKVxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gc3BhbkluZm8nXG4gICAgICAgIFxuICAgICAgICBzaWJsaW5nID0gc3BhbkJlZm9yZVxuICAgICAgICB3aGlsZSBzaWJsaW5nID0gc2libGluZy5uZXh0U2libGluZ1xuICAgICAgICAgICAgQGNsb25lcy5wdXNoIHNpYmxpbmcuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIEBjbG9uZWQucHVzaCBzaWJsaW5nXG4gICAgICAgICAgICBcbiAgICAgICAgc3BhbkJlZm9yZS5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkIEBzcGFuXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkIHRoZW4gYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXMgdGhlbiBAc3Bhbi5pbnNlcnRBZGphY2VudEVsZW1lbnQgJ2FmdGVyZW5kJyBjXG4gICAgICAgICAgICBcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAY29tcGxldGlvbi5sZW5ndGggICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBtYXRjaGVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNob3dMaXN0KClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBzaG93TGlzdDogLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBAbWF0Y2hlc1xuICAgICAgICBcbiAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWxpc3QnXG4gICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIEB3b3JkLCBzbGFzaC5kaXIoQHdvcmQpXG4gICAgICAgIFxuICAgICAgICBzcGx0ID0gQHdvcmQuc3BsaXQgJy8nXG4gICAgICAgIFxuICAgICAgICBpZiBzcGx0Lmxlbmd0aD4xIGFuZCBub3QgQHdvcmQuZW5kc1dpdGgoJy8nKSBhbmQgQGNvbXBsZXRpb24gIT0gJy8nXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IHNwbHRbLTFdLmxlbmd0aFxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzWzBdWzBdLnN0YXJ0c1dpdGggQHdvcmRcbiAgICAgICAgICAgIEBsaXN0T2Zmc2V0ID0gQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgQGxpc3Quc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7LUBlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqQGxpc3RPZmZzZXR9cHgpXCJcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgbWF0Y2ggaW4gQG1hdGNoZXNcbiAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOidhdXRvY29tcGxldGUtaXRlbScgaW5kZXg6aW5kZXgrK1xuICAgICAgICAgICAgaXRlbS5pbm5lckhUTUwgPSBTeW50YXguc3BhbkZvclRleHRBbmRTeW50YXggbWF0Y2hbMF0sICdzaCdcbiAgICAgICAgICAgIGl0ZW0uY2xhc3NMaXN0LmFkZCBtYXRjaFsxXS50eXBlXG4gICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBpdGVtXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBtYyA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIGFib3ZlID0gbWNbMV0gKyBAbWF0Y2hlcy5sZW5ndGggPj0gQGVkaXRvci5zY3JvbGwuZnVsbExpbmVzXG4gICAgICAgIGlmIGFib3ZlXG4gICAgICAgICAgICBAbGlzdC5jbGFzc0xpc3QuYWRkICdhYm92ZSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYmVsb3cnXG4gICAgICAgICAgICBcbiAgICAgICAgY3Vyc29yID0kICcubWFpbicgQGVkaXRvci52aWV3XG4gICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzID8gW11cbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkID8gW11cbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBAbWF0Y2hlcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZXMgICAgID0gW11cbiAgICAgICAgQGNsb25lZCAgICAgPSBbXVxuICAgICAgICBAXG5cbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBjb21wbGV0ZSB7fVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGNvbXBsZXRlOiAoc3VmZml4OicnKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5wYXN0ZVRleHQgQHNlbGVjdGVkQ29tcGxldGlvbigpICsgc3VmZml4XG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICBpc0xpc3RJdGVtU2VsZWN0ZWQ6IC0+IEBsaXN0IGFuZCBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBzZWxlY3RlZFdvcmQ6IC0+IEB3b3JkK0BzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgIFxuICAgIHNlbGVjdGVkQ29tcGxldGlvbjogLT5cbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgICMga2xvZyAnY29tcGxldGlvbicgQHNlbGVjdGVkICwgQG1hdGNoZXNbQHNlbGVjdGVkXVswXSwgQGxpc3RPZmZzZXRcbiAgICAgICAgICAgIEBtYXRjaGVzW0BzZWxlY3RlZF1bMF0uc2xpY2UgQGxpc3RPZmZzZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaGVzLmxlbmd0aC0xLCBAc2VsZWN0ZWQrZGVsdGFcbiAgICAgICAgXG4gICAgc2VsZWN0OiAoaW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsaXN0Py5jaGlsZHJlblswXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIEBzcGFuLmlubmVySFRNTCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAbW92ZUNsb25lc0J5IEBzcGFuLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LmFkZCAgICAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHByZXY6ICAtPiBAbmF2aWdhdGUgLTEgICAgXG4gICAgbmV4dDogIC0+IEBuYXZpZ2F0ZSAxXG4gICAgbGFzdDogIC0+IEBuYXZpZ2F0ZSBAbWF0Y2hlcy5sZW5ndGggLSBAc2VsZWN0ZWRcbiAgICBmaXJzdDogLT4gQG5hdmlnYXRlIC1JbmZpbml0eVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAY2xvbmVzXG4gICAgICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb21ibyA9PSAndGFiJ1xuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudCAjIHByZXZlbnQgZm9jdXMgY2hhbmdlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCcgaWYgbm90IEBzcGFuP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvIFxuICAgICAgICAgICAgd2hlbiAncmlnaHQnICAgICB0aGVuIHJldHVybiBAY29tcGxldGUge31cbiAgICAgICAgICAgICMgd2hlbiAnYmFja3NwYWNlJyB0aGVuIGtsb2cgJ2JhY2tzcGFjZSEnXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/IFxuICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIHJldHVybiBAbmF2aWdhdGUgKzlcbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSAtOVxuICAgICAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiByZXR1cm4gQGxhc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiByZXR1cm4gQGZpcnN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gcmV0dXJuIEBuZXh0KClcbiAgICAgICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gcmV0dXJuIEBwcmV2KClcbiAgICAgICAgQGNsb3NlKCkgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZVxuIl19
//# sourceURL=../../coffee/editor/autocomplete.coffee