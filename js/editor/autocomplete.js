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
        this.splitRegExp = /[\s\"]+/g;
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
                var count, name;
                if (dirsOnly && i.type === 'file') {
                    return;
                }
                name = null;
                if (noParent) {
                    if (i.name.startsWith(noParent)) {
                        name = i.name;
                    }
                } else if (noDir) {
                    if (i.name.startsWith(noDir)) {
                        name = i.name;
                    }
                } else {
                    if (dir.slice(-1)[0] === '/' || empty(dir)) {
                        name = i.name;
                    } else if (i.name[0] === '.') {
                        if (dir.slice(-1)[0] === '.') {
                            name = i.name;
                        } else {
                            name = '/' + i.name;
                        }
                    } else {
                        if (dir.slice(-1)[0] === '.') {
                            name = './' + i.name;
                        } else {
                            name = '/' + i.name;
                        }
                    }
                }
                if (name) {
                    if (i.type === 'file') {
                        count = 0;
                    } else {
                        if (dir.slice(-1)[0] === '.') {
                            count = i.name[0] === '.' && 666 || 333;
                        } else {
                            count = i.name[0] === '.' && 333 || 666;
                        }
                    }
                    return [
                        name, {
                            count: count,
                            type: i.type
                        }
                    ];
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
        var above, cursor, index, item, j, len, linesAbove, linesBelow, match, mc, ref1, splt;
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
        this.list.style.transform = "translatex(" + (-this.editor.size.charWidth * this.listOffset - 10) + "px)";
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
        linesBelow = Math.max(this.editor.scroll.bot, this.editor.scroll.viewLines) - mc[1] - 3;
        linesAbove = mc[1] - this.editor.scroll.top - 3;
        above = linesAbove > linesBelow && linesBelow < Math.min(7, this.matches.length);
        this.list.classList.add(above && 'above' || 'below');
        this.list.style.maxHeight = (this.editor.scroll.lineHeight * (above && linesAbove || linesBelow)) + "px";
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
        if (this.selectedCompletion().indexOf(' ') >= 0) {
            klog("complete |" + (this.selectedCompletion() + suffix) + "|");
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnR0FBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUV0RSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFQyxzQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsSUFBRCxFQUFNLElBQU4sRUFBVyxJQUFYLEVBQWdCLElBQWhCLEVBQXFCLElBQXJCLEVBQTBCLE1BQTFCLEVBQWlDLEtBQWpDO1FBQ2hCLElBQUMsQ0FBQSxXQUFELEdBQWdCLENBQUMsSUFBRDtRQUVoQixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsTUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7SUFYRDs7MkJBbUJILFVBQUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBRVIsWUFBQTtRQUZjLGtEQUFTO1FBRXZCLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixH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QUFDLENBQVg7QUFGakMscUJBR1MsS0FIVDtBQUcwQiwyQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBSGpDLHFCQUlTLE1BSlQ7QUFJMEIsMkJBQU8sSUFBQyxDQUFBLEtBQUQsQ0FBQTtBQUpqQyxxQkFLUyxNQUxUO0FBSzBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFMakMscUJBTVMsSUFOVDtBQU0wQiwyQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBTmpDLGFBREo7O1FBUUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBO0lBdEJvQjs7Ozs7O0FBd0I1QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyBzdG9wRXZlbnQsIGtlcnJvciwgc2xhc2gsIHZhbGlkLCBlbXB0eSwgY2xhbXAsIGtsb2csIGtzdHIsIGVsZW0sICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3ludGF4ID0gcmVxdWlyZSAnLi9zeW50YXgnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHNwbGl0UmVnRXhwID0gL1tcXHNcXFwiXSsvZ1xuICAgIFxuICAgICAgICBAZmlsZUNvbW1hbmRzID0gWydjZCcgJ2xzJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIEBkaXJDb21tYW5kcyAgPSBbJ2NkJ11cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2luc2VydCcgQG9uSW5zZXJ0XG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgQGNsb3NlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgZGlyTWF0Y2hlczogKGRpciwgZGlyc09ubHk6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICBub0RpciA9IHNsYXNoLmZpbGUgZGlyXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZGlyXG4gICAgICAgICAgICBpZiBub3QgZGlyIG9yIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCA9IGRpciAgXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gJy8nIGlmIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9IG5vRGlyXG4gICAgICAgICAgICAgICAgZGlyID0gJydcblxuICAgICAgICBpdGVtcyA9IHNsYXNoLmxpc3QgZGlyLCBpZ25vcmVIaWRkZW46ZmFsc2VcblxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuXG4gICAgICAgICAgICByZXN1bHQgPSBpdGVtcy5tYXAgKGkpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIGRpcnNPbmx5IGFuZCBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lID0gbnVsbFxuICAgICAgICAgICAgICAgIGlmIG5vUGFyZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vUGFyZW50KSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5vRGlyXG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vRGlyKSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy8nIG9yIGVtcHR5KGRpcikgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaS5uYW1lWzBdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLicgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy4nIHRoZW4gbmFtZSA9ICcuLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbmFtZVxuICAgICAgICAgICAgICAgICAgICBpZiBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IChpLm5hbWVbMF0gPT0gJy4nIGFuZCA2NjYgb3IgMzMzKVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gKGkubmFtZVswXSA9PSAnLicgYW5kIDMzMyBvciA2NjYpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuZmlsdGVyIChmKSAtPiBmXG5cbiAgICAgICAgICAgIGlmIGRpci5lbmRzV2l0aCAnLi4vJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC5pc1Jvb3Qgc2xhc2guam9pbiBwcm9jZXNzLmN3ZCgpLCBkaXJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycuLicgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBkaXIgPT0gJy4nIG9yIGRpci5lbmRzV2l0aCgnLy4nKVxuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLi4nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBub3Qgbm9EaXIgYW5kIHZhbGlkKGRpcikgXG4gICAgICAgICAgICAgICAgaWYgbm90IGRpci5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycvJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgcmVzdWx0ID8gW11cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY21kTWF0Y2hlczogKHdvcmQpIC0+XG4gICAgICAgIFxuICAgICAgICBwaWNrID0gKG9iaixjbWQpIC0+IGNtZC5zdGFydHNXaXRoKHdvcmQpIGFuZCBjbWQubGVuZ3RoID4gd29yZC5sZW5ndGhcbiAgICAgICAgbXRjaHMgPSBfLnRvUGFpcnMgXy5waWNrQnkgd2luZG93LmJyYWluLmNtZHMsIHBpY2tcbiAgICAgICAgbVsxXS50eXBlID0gJ2NtZCcgZm9yIG0gaW4gbXRjaHNcbiAgICAgICAgbXRjaHNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgb25UYWI6IC0+XG4gICAgICAgIFxuICAgICAgICBtYyAgID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZSBtY1sxXVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGxpbmUudHJpbSgpXG4gICAgICAgIFxuICAgICAgICBpbmZvID1cbiAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgYmVmb3JlOiBsaW5lWzAuLi5tY1swXV1cbiAgICAgICAgICAgIGFmdGVyOiAgbGluZVttY1swXS4uXVxuICAgICAgICAgICAgY3Vyc29yOiBtY1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBzcGFuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGN1cnJlbnQgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgICAgIGlmIEBsaXN0IGFuZCBlbXB0eSBjdXJyZW50XG4gICAgICAgICAgICAgICAgQG5hdmlnYXRlIDFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3VmZml4ID0gJydcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyIEBzZWxlY3RlZFdvcmQoKVxuICAgICAgICAgICAgICAgIGlmIG5vdCBjdXJyZW50LmVuZHNXaXRoKCcvJykgYW5kIG5vdCBAc2VsZWN0ZWRXb3JkKCkuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9ICcvJ1xuICAgICAgICAgICAgIyBrbG9nIFwidGFiICN7QHNlbGVjdGVkV29yZCgpfSB8I3tjdXJyZW50fXwgc3VmZml4ICN7c3VmZml4fVwiXG4gICAgICAgICAgICBAY29tcGxldGUgc3VmZml4OnN1ZmZpeFxuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBvbkluc2VydCBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKEBpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEB3b3JkID0gXy5sYXN0IEBpbmZvLmJlZm9yZS5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgXG4gICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBmaXJzdENtZCA9IEBpbmZvLmJlZm9yZS5zcGxpdCgnICcpWzBdXG4gICAgICAgIGRpcnNPbmx5ID0gZmlyc3RDbWQgaW4gQGRpckNvbW1hbmRzXG4gICAgICAgIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICBpZiBmaXJzdENtZCBpbiBAZmlsZUNvbW1hbmRzXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyBudWxsIGRpcnNPbmx5OmRpcnNPbmx5XG4gICAgICAgICAgICBpZiBlbXB0eSBAbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBjbWRNYXRjaGVzIEBpbmZvLmJlZm9yZVxuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgIEBtYXRjaGVzID0gQGRpck1hdGNoZXMoQHdvcmQsIGRpcnNPbmx5OmRpcnNPbmx5KS5jb25jYXQgQGNtZE1hdGNoZXMgQGluZm8uYmVmb3JlXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEBtYXRjaGVzXG4gICAgICAgIFxuICAgICAgICBAbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uY291bnQgLSBhWzFdLmNvdW50XG4gICAgICAgICAgICBcbiAgICAgICAgZmlyc3QgPSBAbWF0Y2hlcy5zaGlmdCgpICMgc2VwZXJhdGUgZmlyc3QgbWF0Y2hcbiAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdID09ICcvJ1xuICAgICAgICAgICAgQGluZm8uc3BsaXQgPSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aCAtIEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgaWYgMCA8PSBzID0gQHdvcmQubGFzdEluZGV4T2YgJy8nXG4gICAgICAgICAgICAgICAgQGluZm8uc3BsaXQgKz0gcyArIDFcbiAgICAgICAgXG4gICAgICAgIGlmIGluY2x1ZGVzQ21kc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdXSBcbiAgICAgICAgICAgIGlmIGZpcnN0WzFdLnR5cGUgPT0gJ2NtZCcgIyBzaG9ydGVuIGNvbW1hbmQgY29tcGxldGlvbnNcbiAgICAgICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdW0BpbmZvLnNwbGl0Li5dXVxuICAgICAgICAgICAgICAgIGZpcnN0WzBdID0gZmlyc3RbMF1bQGluZm8uYmVmb3JlLmxlbmd0aC4uXVxuICAgIFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpZiBtWzFdLnR5cGUgPT0gJ2NtZCcgIyBzaG9ydGVuIGNvbW1hbmQgbGlzdCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICBpZiBAaW5mby5zcGxpdFxuICAgICAgICAgICAgICAgICAgICAgICAgbVswXSA9IG1bMF1bQGluZm8uc3BsaXQuLl1cbiAgICAgICAgICAgIG1pID0gMFxuICAgICAgICAgICAgd2hpbGUgbWkgPCBAbWF0Y2hlcy5sZW5ndGggIyBjcmFwcHkgZHVwbGljYXRlIGZpbHRlclxuICAgICAgICAgICAgICAgIGlmIEBtYXRjaGVzW21pXVswXSBpbiBzZWVuXG4gICAgICAgICAgICAgICAgICAgIEBtYXRjaGVzLnNwbGljZSBtaSwgMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgc2Vlbi5wdXNoIEBtYXRjaGVzW21pXVswXVxuICAgICAgICAgICAgICAgICAgICBtaSsrXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBAd29yZFxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBmaXJzdFswXS5zdGFydHNXaXRoIEBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggc2xhc2guZmlsZSBAd29yZFxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2Ugc2xhc2guZmlsZShAd29yZCkubGVuZ3RoXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXVxuICAgICAgICBcbiAgICAgICAgQG9wZW4oKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBvcGVuOiAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIFwiI3tAaW5mby5iZWZvcmV9fCN7QGNvbXBsZXRpb259fCN7QGluZm8uYWZ0ZXJ9ICN7QHdvcmR9XCJcbiAgICAgICAgXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6J2F1dG9jb21wbGV0ZS1zcGFuJ1xuICAgICAgICBAc3Bhbi50ZXh0Q29udGVudCAgICAgID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuICAgICAgICBAc3Bhbi5zdHlsZS50cmFuc2Zvcm0gID0gXCJ0cmFuc2xhdGV4KCN7QGVkaXRvci5zaXplLmNoYXJXaWR0aCpAZWRpdG9yLm1haW5DdXJzb3IoKVswXX1weClcIlxuXG4gICAgICAgIGlmIG5vdCBzcGFuQmVmb3JlID0gQGVkaXRvci5zcGFuQmVmb3JlTWFpbigpXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBzcGFuSW5mbydcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcGFuQmVmb3JlXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcGFuQmVmb3JlLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWQgdGhlbiBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyB0aGVuIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNob3dMaXN0OiAtPlxuICAgICAgICBcbiAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWxpc3QnXG4gICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBcbiAgICAgICAgc3BsdCA9IEB3b3JkLnNwbGl0ICcvJ1xuICAgICAgICBcbiAgICAgICAgaWYgc3BsdC5sZW5ndGg+MSBhbmQgbm90IEB3b3JkLmVuZHNXaXRoKCcvJykgYW5kIEBjb21wbGV0aW9uICE9ICcvJ1xuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBzcGx0Wy0xXS5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlc1swXVswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgIEBsaXN0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgjey1AZWRpdG9yLnNpemUuY2hhcldpZHRoKkBsaXN0T2Zmc2V0LTEwfXB4KVwiXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIG1hdGNoIGluIEBtYXRjaGVzXG4gICAgICAgICAgICBpdGVtID0gZWxlbSBjbGFzczonYXV0b2NvbXBsZXRlLWl0ZW0nIGluZGV4OmluZGV4KytcbiAgICAgICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IG1hdGNoWzBdLCAnc2gnXG4gICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQgbWF0Y2hbMV0udHlwZVxuICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBcbiAgICAgICAgbGluZXNCZWxvdyA9IE1hdGgubWF4KEBlZGl0b3Iuc2Nyb2xsLmJvdCwgQGVkaXRvci5zY3JvbGwudmlld0xpbmVzKSAtIG1jWzFdIC0gM1xuICAgICAgICBsaW5lc0Fib3ZlID0gbWNbMV0gLSBAZWRpdG9yLnNjcm9sbC50b3AgIC0gM1xuICAgICAgICBcbiAgICAgICAgYWJvdmUgPSBsaW5lc0Fib3ZlID4gbGluZXNCZWxvdyBhbmQgbGluZXNCZWxvdyA8IE1hdGgubWluIDcsIEBtYXRjaGVzLmxlbmd0aFxuICAgICAgICBAbGlzdC5jbGFzc0xpc3QuYWRkIGFib3ZlIGFuZCAnYWJvdmUnIG9yICdiZWxvdydcblxuICAgICAgICBAbGlzdC5zdHlsZS5tYXhIZWlnaHQgPSBcIiN7QGVkaXRvci5zY3JvbGwubGluZUhlaWdodCooYWJvdmUgYW5kIGxpbmVzQWJvdmUgb3IgbGluZXNCZWxvdyl9cHhcIlxuICAgICAgICBcbiAgICAgICAgY3Vyc29yID0kICcubWFpbicgQGVkaXRvci52aWV3XG4gICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzID8gW11cbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkID8gW11cbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBAbWF0Y2hlcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZXMgICAgID0gW11cbiAgICAgICAgQGNsb25lZCAgICAgPSBbXVxuICAgICAgICBAXG5cbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBjb21wbGV0ZSB7fVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY29tcGxldGU6IChzdWZmaXg6JycpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2VsZWN0ZWRDb21wbGV0aW9uKCkuaW5kZXhPZignICcpID49IDBcbiAgICAgICAgICAgIGtsb2cgXCJjb21wbGV0ZSB8I3tAc2VsZWN0ZWRDb21wbGV0aW9uKCkgKyBzdWZmaXh9fFwiXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnBhc3RlVGV4dCBAc2VsZWN0ZWRDb21wbGV0aW9uKCkgKyBzdWZmaXhcbiAgICAgICAgQGNsb3NlKClcblxuICAgIGlzTGlzdEl0ZW1TZWxlY3RlZDogLT4gQGxpc3QgYW5kIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHNlbGVjdGVkV29yZDogLT4gQHdvcmQrQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgXG4gICAgc2VsZWN0ZWRDb21wbGV0aW9uOiAtPlxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgIyBrbG9nICdjb21wbGV0aW9uJyBAc2VsZWN0ZWQgLCBAbWF0Y2hlc1tAc2VsZWN0ZWRdWzBdLCBAbGlzdE9mZnNldFxuICAgICAgICAgICAgQG1hdGNoZXNbQHNlbGVjdGVkXVswXS5zbGljZSBAbGlzdE9mZnNldFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY29tcGxldGlvblxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgbmF2aWdhdGU6IChkZWx0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3RcbiAgICAgICAgQHNlbGVjdCBjbGFtcCAtMSwgQG1hdGNoZXMubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxpc3Q/LmNoaWxkcmVuWzBdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgQHNwYW4uaW5uZXJIVE1MID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQHNwYW4uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QuYWRkICAgICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgcHJldjogIC0+IEBuYXZpZ2F0ZSAtMSAgICBcbiAgICBuZXh0OiAgLT4gQG5hdmlnYXRlIDFcbiAgICBsYXN0OiAgLT4gQG5hdmlnYXRlIEBtYXRjaGVzLmxlbmd0aCAtIEBzZWxlY3RlZFxuICAgIGZpcnN0OiAtPiBAbmF2aWdhdGUgLUluZmluaXR5XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgXG5cbiAgICBtb3ZlQ2xvbmVzQnk6IChudW1DaGFycykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBjbG9uZXNcbiAgICAgICAgICAgIGJlZm9yZUxlbmd0aCA9IEBjbG9uZXNbMF0uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGNpIGluIFsxLi4uQGNsb25lcy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgYyA9IEBjbG9uZXNbY2ldXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkW2NpLTFdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICAgICAgICAgIGNoYXJPZmZzZXQgPSBudW1DaGFyc1xuICAgICAgICAgICAgICAgIGNoYXJPZmZzZXQgKz0gYmVmb3JlTGVuZ3RoIGlmIGNpID09IDFcbiAgICAgICAgICAgICAgICBjLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje29mZnNldCtAZWRpdG9yLnNpemUuY2hhcldpZHRoKmNoYXJPZmZzZXR9cHgpXCJcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvID09ICd0YWInXG4gICAgICAgICAgICBAb25UYWIoKVxuICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICMgcHJldmVudCBmb2N1cyBjaGFuZ2VcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQHNwYW4/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm8gXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgICAgIHRoZW4gcmV0dXJuIEBjb21wbGV0ZSB7fVxuICAgICAgICAgICAgIyB3aGVuICdiYWNrc3BhY2UnIHRoZW4ga2xvZyAnYmFja3NwYWNlISdcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSArOVxuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiByZXR1cm4gQG5hdmlnYXRlIC05XG4gICAgICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIHJldHVybiBAbGFzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIHJldHVybiBAZmlyc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiByZXR1cm4gQG5leHQoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiByZXR1cm4gQHByZXYoKVxuICAgICAgICBAY2xvc2UoKSAgIFxuICAgICAgICAndW5oYW5kbGVkJ1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQXV0b2NvbXBsZXRlXG4iXX0=
//# sourceURL=../../coffee/editor/autocomplete.coffee