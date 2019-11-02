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
        } else {
            if ((!noDir) && dir.slice(-1)[0] !== '/') {
                result = [
                    [
                        '/', {
                            count: 999,
                            type: 'dir'
                        }
                    ]
                ];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnR0FBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUV0RSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFQyxzQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsSUFBRCxFQUFNLElBQU4sRUFBVyxJQUFYLEVBQWdCLElBQWhCLEVBQXFCLElBQXJCLEVBQTBCLE1BQTFCLEVBQWlDLEtBQWpDO1FBQ2hCLElBQUMsQ0FBQSxXQUFELEdBQWdCLENBQUMsSUFBRDtRQUVoQixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsTUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7SUFYRDs7MkJBbUJILFVBQUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBRVIsWUFBQTtRQUZjLGtEQUFTO1FBRXZCLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixH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QURUO0FBQzBCLHVCQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsRUFBVjtBQURqQztRQUlBLElBQUcsaUJBQUg7QUFDSSxvQkFBTyxLQUFQO0FBQUEscUJBQ1MsV0FEVDtBQUMwQiwyQkFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWDtBQURqQyxxQkFFUyxTQUZUO0FBRTBCLDJCQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYO0FBRmpDLHFCQUdTLEtBSFQ7QUFHMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUhqQyxxQkFJUyxNQUpUO0FBSTBCLDJCQUFPLElBQUMsQ0FBQSxLQUFELENBQUE7QUFKakMscUJBS1MsTUFMVDtBQUswQiwyQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBTGpDLHFCQU1TLElBTlQ7QUFNMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQU5qQyxhQURKOztRQVFBLElBQUMsQ0FBQSxLQUFELENBQUE7ZUFDQTtJQXRCb0I7Ozs7OztBQXdCNUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuIyMjXG5cbnsgc3RvcEV2ZW50LCBrZXJyb3IsIHNsYXNoLCB2YWxpZCwgZW1wdHksIGNsYW1wLCBrbG9nLCBrc3RyLCBlbGVtLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblN5bnRheCA9IHJlcXVpcmUgJy4vc3ludGF4J1xuXG5jbGFzcyBBdXRvY29tcGxldGVcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEBzcGxpdFJlZ0V4cCA9IC9bXFxzXFxcIl0rL2dcbiAgICBcbiAgICAgICAgQGZpbGVDb21tYW5kcyA9IFsnY2QnICdscycgJ3JtJyAnY3AnICdtdicgJ2tyZXAnICdjYXQnXVxuICAgICAgICBAZGlyQ29tbWFuZHMgID0gWydjZCddXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdpbnNlcnQnIEBvbkluc2VydFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgIEBjbG9zZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGRpck1hdGNoZXM6IChkaXIsIGRpcnNPbmx5OmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHNsYXNoLmlzRGlyIGRpclxuICAgICAgICAgICAgbm9EaXIgPSBzbGFzaC5maWxlIGRpclxuICAgICAgICAgICAgZGlyID0gc2xhc2guZGlyIGRpclxuICAgICAgICAgICAgaWYgbm90IGRpciBvciBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgPSBkaXIgIFxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9ICcvJyBpZiBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCArPSBub0RpclxuICAgICAgICAgICAgICAgIGRpciA9ICcnXG5cbiAgICAgICAgaXRlbXMgPSBzbGFzaC5saXN0IGRpciwgaWdub3JlSGlkZGVuOmZhbHNlXG5cbiAgICAgICAgIyBrbG9nICdkaXJNYXRjaGVzJyBkaXIsIGl0ZW1zLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgaXRlbXNcblxuICAgICAgICAgICAgcmVzdWx0ID0gaXRlbXMubWFwIChpKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBkaXJzT25seSBhbmQgaS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbmFtZSA9IG51bGxcbiAgICAgICAgICAgICAgICBpZiBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aChub1BhcmVudCkgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBub0RpclxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aChub0RpcikgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcvJyBvciBlbXB0eShkaXIpIHRoZW4gbmFtZSA9IGkubmFtZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGkubmFtZVswXSA9PSAnLidcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy4nIHRoZW4gbmFtZSA9IGkubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICBuYW1lID0gJy8nK2kubmFtZVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcuJyB0aGVuIG5hbWUgPSAnLi8nK2kubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICBuYW1lID0gJy8nK2kubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgaS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQgPSAwXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQgPSAoaS5uYW1lWzBdID09ICcuJyBhbmQgNjY2IG9yIDMzMylcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IChpLm5hbWVbMF0gPT0gJy4nIGFuZCAzMzMgb3IgNjY2KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW25hbWUsIGNvdW50OmNvdW50LCB0eXBlOmkudHlwZV1cblxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmZpbHRlciAoZikgLT4gZlxuXG4gICAgICAgICAgICBpZiBkaXIuZW5kc1dpdGggJy4uLydcbiAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2guaXNSb290IHNsYXNoLmpvaW4gcHJvY2Vzcy5jd2QoKSwgZGlyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLi4nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgIGVsc2UgaWYgZGlyID09ICcuJyBvciBkaXIuZW5kc1dpdGgoJy8uJylcbiAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy4uJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgIGVsc2UgaWYgbm90IG5vRGlyIGFuZCB2YWxpZChkaXIpIFxuICAgICAgICAgICAgICAgIGlmIG5vdCBkaXIuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLycgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJycgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIChub3Qgbm9EaXIpIGFuZCBkaXJbLTFdICE9ICcvJ1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtbJy8nIGNvdW50Ojk5OSB0eXBlOidkaXInXV1cbiAgICAgICAgcmVzdWx0ID8gW11cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY21kTWF0Y2hlczogKHdvcmQpIC0+XG4gICAgICAgIFxuICAgICAgICBwaWNrID0gKG9iaixjbWQpIC0+IGNtZC5zdGFydHNXaXRoKHdvcmQpIGFuZCBjbWQubGVuZ3RoID4gd29yZC5sZW5ndGhcbiAgICAgICAgbXRjaHMgPSBfLnRvUGFpcnMgXy5waWNrQnkgd2luZG93LmJyYWluLmNtZHMsIHBpY2tcbiAgICAgICAgbVsxXS50eXBlID0gJ2NtZCcgZm9yIG0gaW4gbXRjaHNcbiAgICAgICAgbXRjaHNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgb25UYWI6IC0+XG4gICAgICAgIFxuICAgICAgICBtYyAgID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZSBtY1sxXVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGxpbmUudHJpbSgpXG4gICAgICAgIFxuICAgICAgICBpbmZvID1cbiAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgYmVmb3JlOiBsaW5lWzAuLi5tY1swXV1cbiAgICAgICAgICAgIGFmdGVyOiAgbGluZVttY1swXS4uXVxuICAgICAgICAgICAgY3Vyc29yOiBtY1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBzcGFuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGN1cnJlbnQgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgICAgIGlmIEBsaXN0IGFuZCBlbXB0eSBjdXJyZW50XG4gICAgICAgICAgICAgICAgQG5hdmlnYXRlIDFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3VmZml4ID0gJydcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyIEBzZWxlY3RlZFdvcmQoKVxuICAgICAgICAgICAgICAgIGlmIG5vdCBjdXJyZW50LmVuZHNXaXRoKCcvJykgYW5kIG5vdCBAc2VsZWN0ZWRXb3JkKCkuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSAnLydcbiAgICAgICAgICAgICMga2xvZyBcInRhYiAje0BzZWxlY3RlZFdvcmQoKX0gfCN7Y3VycmVudH18IHN1ZmZpeCAje3N1ZmZpeH1cIlxuICAgICAgICAgICAgQGNvbXBsZXRlIHN1ZmZpeDpzdWZmaXhcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAb25JbnNlcnQgaW5mb1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4gICAgb25JbnNlcnQ6IChAaW5mbykgPT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICBAd29yZCA9IF8ubGFzdCBAaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIFxuICAgICAgICBAaW5mby5zcGxpdCA9IEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgZmlyc3RDbWQgPSBAaW5mby5iZWZvcmUuc3BsaXQoJyAnKVswXVxuICAgICAgICBkaXJzT25seSA9IGZpcnN0Q21kIGluIEBkaXJDb21tYW5kc1xuICAgICAgICBpZiBub3QgQHdvcmQ/Lmxlbmd0aFxuICAgICAgICAgICAgaWYgZmlyc3RDbWQgaW4gQGZpbGVDb21tYW5kc1xuICAgICAgICAgICAgICAgIEBtYXRjaGVzID0gQGRpck1hdGNoZXMgbnVsbCBkaXJzT25seTpkaXJzT25seVxuICAgICAgICAgICAgaWYgZW1wdHkgQG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpbmNsdWRlc0NtZHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAY21kTWF0Y2hlcyBAaW5mby5iZWZvcmVcbiAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmNsdWRlc0NtZHMgPSB0cnVlXG4gICAgICAgICAgICBAbWF0Y2hlcyA9IEBkaXJNYXRjaGVzKEB3b3JkLCBkaXJzT25seTpkaXJzT25seSkuY29uY2F0IEBjbWRNYXRjaGVzIEBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgXG4gICAgICAgICMga2xvZyBAaW5mbywgQHdvcmQsIEBtYXRjaGVzXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEBtYXRjaGVzXG4gICAgICAgIFxuICAgICAgICBAbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uY291bnQgLSBhWzFdLmNvdW50XG4gICAgICAgICAgICBcbiAgICAgICAgZmlyc3QgPSBAbWF0Y2hlcy5zaGlmdCgpICMgc2VwZXJhdGUgZmlyc3QgbWF0Y2hcbiAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdID09ICcvJ1xuICAgICAgICAgICAgQGluZm8uc3BsaXQgPSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aCAtIEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgaWYgMCA8PSBzID0gQHdvcmQubGFzdEluZGV4T2YgJy8nXG4gICAgICAgICAgICAgICAgQGluZm8uc3BsaXQgKz0gcyArIDFcbiAgICAgICAgXG4gICAgICAgIGlmIGluY2x1ZGVzQ21kc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdXSBcbiAgICAgICAgICAgIGlmIGZpcnN0WzFdLnR5cGUgPT0gJ2NtZCcgIyBzaG9ydGVuIGNvbW1hbmQgY29tcGxldGlvbnNcbiAgICAgICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdW0BpbmZvLnNwbGl0Li5dXVxuICAgICAgICAgICAgICAgIGZpcnN0WzBdID0gZmlyc3RbMF1bQGluZm8uYmVmb3JlLmxlbmd0aC4uXVxuICAgIFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpZiBtWzFdLnR5cGUgPT0gJ2NtZCcgIyBzaG9ydGVuIGNvbW1hbmQgbGlzdCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICBpZiBAaW5mby5zcGxpdFxuICAgICAgICAgICAgICAgICAgICAgICAgbVswXSA9IG1bMF1bQGluZm8uc3BsaXQuLl1cbiAgICAgICAgICAgIG1pID0gMFxuICAgICAgICAgICAgd2hpbGUgbWkgPCBAbWF0Y2hlcy5sZW5ndGggIyBjcmFwcHkgZHVwbGljYXRlIGZpbHRlclxuICAgICAgICAgICAgICAgIGlmIEBtYXRjaGVzW21pXVswXSBpbiBzZWVuXG4gICAgICAgICAgICAgICAgICAgIEBtYXRjaGVzLnNwbGljZSBtaSwgMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgc2Vlbi5wdXNoIEBtYXRjaGVzW21pXVswXVxuICAgICAgICAgICAgICAgICAgICBtaSsrXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBAd29yZFxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBmaXJzdFswXS5zdGFydHNXaXRoIEBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggc2xhc2guZmlsZSBAd29yZFxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2Ugc2xhc2guZmlsZShAd29yZCkubGVuZ3RoXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXVxuICAgICAgICBcbiAgICAgICAgQG9wZW4oKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBvcGVuOiAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIFwiI3tAaW5mby5iZWZvcmV9fCN7QGNvbXBsZXRpb259fCN7QGluZm8uYWZ0ZXJ9ICN7QHdvcmR9XCJcbiAgICAgICAgXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6J2F1dG9jb21wbGV0ZS1zcGFuJ1xuICAgICAgICBAc3Bhbi50ZXh0Q29udGVudCAgICAgID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuICAgICAgICBAc3Bhbi5zdHlsZS50cmFuc2Zvcm0gID0gXCJ0cmFuc2xhdGV4KCN7QGVkaXRvci5zaXplLmNoYXJXaWR0aCpAZWRpdG9yLm1haW5DdXJzb3IoKVswXX1weClcIlxuXG4gICAgICAgIGlmIG5vdCBzcGFuQmVmb3JlID0gQGVkaXRvci5zcGFuQmVmb3JlTWFpbigpXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBzcGFuSW5mbydcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcGFuQmVmb3JlXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcGFuQmVmb3JlLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWQgdGhlbiBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyB0aGVuIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNob3dMaXN0OiAtPlxuICAgICAgICBcbiAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWxpc3QnXG4gICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBcbiAgICAgICAgc3BsdCA9IEB3b3JkLnNwbGl0ICcvJ1xuICAgICAgICBcbiAgICAgICAgaWYgc3BsdC5sZW5ndGg+MSBhbmQgbm90IEB3b3JkLmVuZHNXaXRoKCcvJykgYW5kIEBjb21wbGV0aW9uICE9ICcvJ1xuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBzcGx0Wy0xXS5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlc1swXVswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgIEBsaXN0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgjey1AZWRpdG9yLnNpemUuY2hhcldpZHRoKkBsaXN0T2Zmc2V0LTEwfXB4KVwiXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIG1hdGNoIGluIEBtYXRjaGVzXG4gICAgICAgICAgICBpdGVtID0gZWxlbSBjbGFzczonYXV0b2NvbXBsZXRlLWl0ZW0nIGluZGV4OmluZGV4KytcbiAgICAgICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IG1hdGNoWzBdLCAnc2gnXG4gICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQgbWF0Y2hbMV0udHlwZVxuICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBcbiAgICAgICAgbGluZXNCZWxvdyA9IE1hdGgubWF4KEBlZGl0b3Iuc2Nyb2xsLmJvdCwgQGVkaXRvci5zY3JvbGwudmlld0xpbmVzKSAtIG1jWzFdIC0gM1xuICAgICAgICBsaW5lc0Fib3ZlID0gbWNbMV0gLSBAZWRpdG9yLnNjcm9sbC50b3AgIC0gM1xuICAgICAgICBcbiAgICAgICAgYWJvdmUgPSBsaW5lc0Fib3ZlID4gbGluZXNCZWxvdyBhbmQgbGluZXNCZWxvdyA8IE1hdGgubWluIDcsIEBtYXRjaGVzLmxlbmd0aFxuICAgICAgICBAbGlzdC5jbGFzc0xpc3QuYWRkIGFib3ZlIGFuZCAnYWJvdmUnIG9yICdiZWxvdydcblxuICAgICAgICBAbGlzdC5zdHlsZS5tYXhIZWlnaHQgPSBcIiN7QGVkaXRvci5zY3JvbGwubGluZUhlaWdodCooYWJvdmUgYW5kIGxpbmVzQWJvdmUgb3IgbGluZXNCZWxvdyl9cHhcIlxuICAgICAgICBcbiAgICAgICAgY3Vyc29yID0kICcubWFpbicgQGVkaXRvci52aWV3XG4gICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzID8gW11cbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkID8gW11cbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBAbWF0Y2hlcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZXMgICAgID0gW11cbiAgICAgICAgQGNsb25lZCAgICAgPSBbXVxuICAgICAgICBAXG5cbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBjb21wbGV0ZSB7fVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY29tcGxldGU6IChzdWZmaXg6JycpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAc2VsZWN0ZWRDb21wbGV0aW9uKCkuaW5kZXhPZignICcpID49IDBcbiAgICAgICAgICAgIGtsb2cgXCJjb21wbGV0ZSB8I3tAc2VsZWN0ZWRDb21wbGV0aW9uKCkgKyBzdWZmaXh9fFwiXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnBhc3RlVGV4dCBAc2VsZWN0ZWRDb21wbGV0aW9uKCkgKyBzdWZmaXhcbiAgICAgICAgQGNsb3NlKClcblxuICAgIGlzTGlzdEl0ZW1TZWxlY3RlZDogLT4gQGxpc3QgYW5kIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHNlbGVjdGVkV29yZDogLT4gQHdvcmQrQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgXG4gICAgc2VsZWN0ZWRDb21wbGV0aW9uOiAtPlxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgIyBrbG9nICdjb21wbGV0aW9uJyBAc2VsZWN0ZWQgLCBAbWF0Y2hlc1tAc2VsZWN0ZWRdWzBdLCBAbGlzdE9mZnNldFxuICAgICAgICAgICAgQG1hdGNoZXNbQHNlbGVjdGVkXVswXS5zbGljZSBAbGlzdE9mZnNldFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY29tcGxldGlvblxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgbmF2aWdhdGU6IChkZWx0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3RcbiAgICAgICAgQHNlbGVjdCBjbGFtcCAtMSwgQG1hdGNoZXMubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxpc3Q/LmNoaWxkcmVuWzBdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgQHNwYW4uaW5uZXJIVE1MID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQHNwYW4uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QuYWRkICAgICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgcHJldjogIC0+IEBuYXZpZ2F0ZSAtMSAgICBcbiAgICBuZXh0OiAgLT4gQG5hdmlnYXRlIDFcbiAgICBsYXN0OiAgLT4gQG5hdmlnYXRlIEBtYXRjaGVzLmxlbmd0aCAtIEBzZWxlY3RlZFxuICAgIGZpcnN0OiAtPiBAbmF2aWdhdGUgLUluZmluaXR5XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgXG5cbiAgICBtb3ZlQ2xvbmVzQnk6IChudW1DaGFycykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBjbG9uZXNcbiAgICAgICAgICAgIGJlZm9yZUxlbmd0aCA9IEBjbG9uZXNbMF0uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGNpIGluIFsxLi4uQGNsb25lcy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgYyA9IEBjbG9uZXNbY2ldXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkW2NpLTFdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICAgICAgICAgIGNoYXJPZmZzZXQgPSBudW1DaGFyc1xuICAgICAgICAgICAgICAgIGNoYXJPZmZzZXQgKz0gYmVmb3JlTGVuZ3RoIGlmIGNpID09IDFcbiAgICAgICAgICAgICAgICBjLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje29mZnNldCtAZWRpdG9yLnNpemUuY2hhcldpZHRoKmNoYXJPZmZzZXR9cHgpXCJcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvID09ICd0YWInXG4gICAgICAgICAgICBAb25UYWIoKVxuICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICMgcHJldmVudCBmb2N1cyBjaGFuZ2VcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQHNwYW4/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm8gXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgICAgIHRoZW4gcmV0dXJuIEBjb21wbGV0ZSB7fVxuICAgICAgICAgICAgIyB3aGVuICdiYWNrc3BhY2UnIHRoZW4ga2xvZyAnYmFja3NwYWNlISdcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSArOVxuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiByZXR1cm4gQG5hdmlnYXRlIC05XG4gICAgICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIHJldHVybiBAbGFzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIHJldHVybiBAZmlyc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiByZXR1cm4gQG5leHQoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiByZXR1cm4gQHByZXYoKVxuICAgICAgICBAY2xvc2UoKSAgIFxuICAgICAgICAndW5oYW5kbGVkJ1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQXV0b2NvbXBsZXRlXG4iXX0=
//# sourceURL=../../coffee/editor/autocomplete.coffee