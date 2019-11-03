// koffee 1.4.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, Syntax, _, clamp, elem, empty, first, kerror, klog, last, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), stopEvent = ref.stopEvent, slash = ref.slash, valid = ref.valid, empty = ref.empty, first = ref.first, clamp = ref.clamp, elem = ref.elem, last = ref.last, kerror = ref.kerror, klog = ref.klog, $ = ref.$, _ = ref._;

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

    Autocomplete.prototype.itemsForDir = function(dir) {
        var noDir, noParent;
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
        return {
            items: slash.list(dir, {
                ignoreHidden: false
            }),
            dir: dir,
            noDir: noDir,
            noParent: noParent
        };
    };

    Autocomplete.prototype.dirMatches = function(dir, arg) {
        var dirsOnly, items, noDir, noParent, ref1, ref2, result;
        dirsOnly = (ref1 = arg.dirsOnly) != null ? ref1 : false;
        ref2 = this.itemsForDir(dir), items = ref2.items, dir = ref2.dir, noDir = ref2.noDir, noParent = ref2.noParent;
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

    Autocomplete.prototype.cmdMatches = function() {
        var cmd, cmds, count, mtchs;
        mtchs = [];
        if (cmds = window.brain.dirs[slash.tilde(process.cwd())]) {
            for (cmd in cmds) {
                count = cmds[cmd];
                if (cmd.startsWith(this.info.before) && cmd.length > this.info.before.length) {
                    mtchs.push([
                        cmd, {
                            type: 'cmd',
                            count: count
                        }
                    ]);
                }
            }
        }
        return mtchs;
    };

    Autocomplete.prototype.cdMatches = function() {
        var cds, count, dir, mtchs, rel, tld;
        mtchs = [];
        tld = slash.tilde(process.cwd());
        if (cds = window.brain.cd[tld]) {
            for (dir in cds) {
                count = cds[dir];
                rel = slash.relative(dir, tld);
                if (rel[0] !== '.') {
                    rel = './' + rel;
                }
                if (rel !== '..' && rel !== '.') {
                    mtchs.push([
                        rel, {
                            type: 'chdir',
                            count: count
                        }
                    ]);
                }
            }
        }
        return mtchs;
    };

    Autocomplete.prototype.onTab = function() {
        var after, before, current, line, ref1, suffix;
        ref1 = this.lineBeforeAfter(), line = ref1[0], before = ref1[1], after = ref1[2];
        if (empty(line.trim())) {
            return;
        }
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
            return this.onInsert({
                tab: true,
                line: line,
                before: before,
                after: after,
                cursor: this.editor.mainCursor()
            });
        }
    };

    Autocomplete.prototype.onInsert = function(info) {
        var dirsOnly, firstCmd, includesCmds, j, len, m, mi, ref1, ref2, ref3, ref4, ref5, ref6, s, seen, stringOpen;
        this.close();
        if (ref1 = info.before.slice(-1)[0], indexOf.call('"\'', ref1) >= 0) {
            return;
        }
        if (info.after[0] && (ref2 = info.after[0], indexOf.call('"', ref2) < 0)) {
            return;
        }
        if (info.before.slice(-1)[0] === ' ' && ((ref3 = info.before.slice(-2, -1)[0]) !== '"\' ')) {
            this.handleSpace();
        }
        this.info = info;
        stringOpen = this.stringOpenCol(this.info.before);
        if (stringOpen >= 0) {
            this.word = this.info.before.slice(stringOpen + 1);
        } else {
            this.word = _.last(this.info.before.split(this.splitRegExp));
        }
        this.info.split = this.info.before.length;
        firstCmd = this.info.before.split(' ')[0];
        dirsOnly = indexOf.call(this.dirCommands, firstCmd) >= 0;
        if (!((ref4 = this.word) != null ? ref4.length : void 0)) {
            if (indexOf.call(this.fileCommands, firstCmd) >= 0) {
                this.matches = this.dirMatches(null, {
                    dirsOnly: dirsOnly
                });
            }
            if (empty(this.matches)) {
                includesCmds = true;
                this.matches = this.cmdMatches();
            }
        } else {
            includesCmds = true;
            if (this.info.before === '.') {
                this.matches = this.cdMatches().concat(this.cmdMatches());
            } else {
                this.matches = this.dirMatches(this.word, {
                    dirsOnly: dirsOnly
                }).concat(this.cmdMatches());
            }
        }
        if (empty(this.matches)) {
            if (this.info.tab) {
                this.closeString(stringOpen);
            }
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
            ref5 = this.matches;
            for (j = 0, len = ref5.length; j < len; j++) {
                m = ref5[j];
                if (m[1].type === 'cmd') {
                    if (this.info.split) {
                        m[0] = m[0].slice(this.info.split);
                    }
                }
            }
            mi = 0;
            while (mi < this.matches.length) {
                if (ref6 = this.matches[mi][0], indexOf.call(seen, ref6) >= 0) {
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
        if (this.matches.length === 0 && empty(this.completion)) {
            if (info.tab) {
                this.closeString(stringOpen);
            }
            return;
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
        this.info = null;
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

    Autocomplete.prototype.closeString = function(stringOpen) {
        if (stringOpen >= 0) {
            if (empty(this.info.after)) {
                return this.editor.setInputText(this.info.line + '"');
            } else if (this.info.after[0] === '"') {
                return this.editor.moveCursorsRight();
            }
        }
    };

    Autocomplete.prototype.handleSpace = function() {
        var after, before, dir, index, item, items, j, len, line, mc, mcCol, newLine, noDir, noParent, prt, pth, ref1, ref2, ref3, wrd;
        ref1 = this.lineBeforeAfter(), line = ref1[0], before = ref1[1], after = ref1[2];
        mcCol = before.length;
        while (before.slice(-1)[0] !== ' ') {
            after = before.slice(-1)[0] + after;
            before = before.slice(0, +(before.length - 2) + 1 || 9e9);
        }
        index = this.stringOpenCol(before);
        if (index < 0) {
            wrd = last(before.slice(0, +(before.length - 2) + 1 || 9e9).split(/[\s\"]/));
            prt = slash.dir(wrd);
            ref2 = this.itemsForDir(prt), items = ref2.items, dir = ref2.dir, noDir = ref2.noDir, noParent = ref2.noParent;
            pth = slash.resolve(wrd + ' ');
            ref3 = items != null ? items : [];
            for (j = 0, len = ref3.length; j < len; j++) {
                item = ref3[j];
                if (item.file.startsWith(pth)) {
                    newLine = (before.slice(0, before.length - wrd.length - 1)) + "\"" + wrd + " " + after;
                    if (mcCol === line.length) {
                        newLine += '"';
                    }
                    this.editor.setInputText(newLine);
                    mc = this.editor.mainCursor();
                    this.editor.singleCursorAtPos([mcCol + 1, mc[1]]);
                    return;
                }
            }
            return klog("no items match in dir |" + dir + "|");
        }
    };

    Autocomplete.prototype.stringOpenCol = function(text) {
        var before, count, lastCol;
        lastCol = text.lastIndexOf('"');
        if (lastCol > 0) {
            before = text.slice(0, lastCol);
            count = before.split('"').length - 1;
            if (count % 2 !== 0) {
                return -1;
            }
        }
        return lastCol;
    };

    Autocomplete.prototype.lineBeforeAfter = function() {
        var line, mc;
        mc = this.editor.mainCursor();
        line = this.editor.line(mc[1]);
        return [line, line.slice(0, mc[0]), line.slice(mc[0])];
    };

    Autocomplete.prototype.complete = function(arg) {
        var compl, ref1, suffix;
        suffix = (ref1 = arg.suffix) != null ? ref1 : '';
        compl = this.selectedCompletion();
        this.editor.pasteText(compl + suffix);
        this.close();
        if (compl.indexOf(' ') >= 0) {
            return this.handleSpace();
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1R0FBQTtJQUFBOzs7QUFRQSxNQUFtRixPQUFBLENBQVEsS0FBUixDQUFuRixFQUFFLHlCQUFGLEVBQWEsaUJBQWIsRUFBb0IsaUJBQXBCLEVBQTJCLGlCQUEzQixFQUFrQyxpQkFBbEMsRUFBeUMsaUJBQXpDLEVBQWdELGVBQWhELEVBQXNELGVBQXRELEVBQTRELG1CQUE1RCxFQUFvRSxlQUFwRSxFQUEwRSxTQUExRSxFQUE2RTs7QUFFN0UsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUVIO0lBRUMsc0JBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOzs7O1FBRUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFFZixJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLElBQUQsRUFBTSxJQUFOLEVBQVcsSUFBWCxFQUFnQixJQUFoQixFQUFxQixJQUFyQixFQUEwQixNQUExQixFQUFpQyxLQUFqQztRQUNoQixJQUFDLENBQUEsV0FBRCxHQUFnQixDQUFDLElBQUQ7UUFFaEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUFvQixJQUFDLENBQUEsUUFBckI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxLQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLE1BQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO0lBWEQ7OzJCQW1CSCxXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixHQUFBLEdBQU0s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RCxDQUFVLENBQUMsQ0FBWDtBQURqQyxxQkFFUyxTQUZUO0FBRTBCLDJCQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYO0FBRmpDLHFCQUdTLEtBSFQ7QUFHMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUhqQyxxQkFJUyxNQUpUO0FBSTBCLDJCQUFPLElBQUMsQ0FBQSxLQUFELENBQUE7QUFKakMscUJBS1MsTUFMVDtBQUswQiwyQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBTGpDLHFCQU1TLElBTlQ7QUFNMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQU5qQyxhQURKOztRQVFBLElBQUMsQ0FBQSxLQUFELENBQUE7ZUFDQTtJQXJCb0I7Ozs7OztBQXVCNUIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAgICAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuIyMjXG5cbnsgc3RvcEV2ZW50LCBzbGFzaCwgdmFsaWQsIGVtcHR5LCBmaXJzdCwgY2xhbXAsIGVsZW0sIGxhc3QsIGtlcnJvciwga2xvZywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TeW50YXggPSByZXF1aXJlICcuL3N5bnRheCdcblxuY2xhc3MgQXV0b2NvbXBsZXRlXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICBAc3BsaXRSZWdFeHAgPSAvW1xcc1xcXCJdKy9nXG4gICAgXG4gICAgICAgIEBmaWxlQ29tbWFuZHMgPSBbJ2NkJyAnbHMnICdybScgJ2NwJyAnbXYnICdrcmVwJyAnY2F0J11cbiAgICAgICAgQGRpckNvbW1hbmRzICA9IFsnY2QnXVxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnaW5zZXJ0JyBAb25JbnNlcnRcbiAgICAgICAgQGVkaXRvci5vbiAnY3Vyc29yJyBAY2xvc2VcbiAgICAgICAgQGVkaXRvci5vbiAnYmx1cicgICBAY2xvc2VcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBpdGVtc0ZvckRpcjogKGRpcikgLT5cbiAgICBcbiAgICAgICAgaWYgbm90IHNsYXNoLmlzRGlyIGRpclxuICAgICAgICAgICAgbm9EaXIgPSBzbGFzaC5maWxlIGRpclxuICAgICAgICAgICAgZGlyID0gc2xhc2guZGlyIGRpclxuICAgICAgICAgICAgaWYgbm90IGRpciBvciBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgPSBkaXIgIFxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9ICcvJyBpZiBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCArPSBub0RpclxuICAgICAgICAgICAgICAgIGRpciA9ICcnXG5cbiAgICAgICAgaXRlbXM6IHNsYXNoLmxpc3QgZGlyLCBpZ25vcmVIaWRkZW46ZmFsc2VcbiAgICAgICAgZGlyOmRpciBcbiAgICAgICAgbm9EaXI6bm9EaXIgXG4gICAgICAgIG5vUGFyZW50Om5vUGFyZW50XG4gICAgXG4gICAgZGlyTWF0Y2hlczogKGRpciwgZGlyc09ubHk6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICB7aXRlbXMsIGRpciwgbm9EaXIsIG5vUGFyZW50fSA9IEBpdGVtc0ZvckRpciBkaXJcbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIGl0ZW1zXG5cbiAgICAgICAgICAgIHJlc3VsdCA9IGl0ZW1zLm1hcCAoaSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgZGlyc09ubHkgYW5kIGkudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5hbWUgPSBudWxsXG4gICAgICAgICAgICAgICAgaWYgbm9QYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgaS5uYW1lLnN0YXJ0c1dpdGgobm9QYXJlbnQpIHRoZW4gbmFtZSA9IGkubmFtZVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbm9EaXJcbiAgICAgICAgICAgICAgICAgICAgaWYgaS5uYW1lLnN0YXJ0c1dpdGgobm9EaXIpIHRoZW4gbmFtZSA9IGkubmFtZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLycgb3IgZW1wdHkoZGlyKSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpLm5hbWVbMF0gPT0gJy4nXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcuJyB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgbmFtZSA9ICcvJytpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLicgdGhlbiBuYW1lID0gJy4vJytpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgbmFtZSA9ICcvJytpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBuYW1lXG4gICAgICAgICAgICAgICAgICAgIGlmIGkudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gMFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gKGkubmFtZVswXSA9PSAnLicgYW5kIDY2NiBvciAzMzMpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQgPSAoaS5uYW1lWzBdID09ICcuJyBhbmQgMzMzIG9yIDY2NilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtuYW1lLCBjb3VudDpjb3VudCwgdHlwZTppLnR5cGVdXG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5maWx0ZXIgKGYpIC0+IGZcblxuICAgICAgICAgICAgaWYgZGlyLmVuZHNXaXRoICcuLi8nXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLmlzUm9vdCBzbGFzaC5qb2luIHByb2Nlc3MuY3dkKCksIGRpclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy4uJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJycgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICBlbHNlIGlmIGRpciA9PSAnLicgb3IgZGlyLmVuZHNXaXRoKCcvLicpXG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycuLicgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBub0RpciBhbmQgdmFsaWQoZGlyKSBcbiAgICAgICAgICAgICAgICBpZiBub3QgZGlyLmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy8nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiAobm90IG5vRGlyKSBhbmQgZGlyWy0xXSAhPSAnLydcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBbWycvJyBjb3VudDo5OTkgdHlwZTonZGlyJ11dXG4gICAgICAgIHJlc3VsdCA/IFtdXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNtZE1hdGNoZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBtdGNocyA9IFtdXG5cbiAgICAgICAgaWYgY21kcyA9IHdpbmRvdy5icmFpbi5kaXJzW3NsYXNoLnRpbGRlIHByb2Nlc3MuY3dkKCldXG4gICAgICAgICAgICBmb3IgY21kLGNvdW50IG9mIGNtZHNcbiAgICAgICAgICAgICAgICBpZiBjbWQuc3RhcnRzV2l0aChAaW5mby5iZWZvcmUpIGFuZCBjbWQubGVuZ3RoID4gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBtdGNocy5wdXNoIFtjbWQsIHR5cGU6J2NtZCcgY291bnQ6Y291bnRdXG4gICAgICAgIG10Y2hzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY2RNYXRjaGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgbXRjaHMgPSBbXVxuXG4gICAgICAgIHRsZCA9IHNsYXNoLnRpbGRlIHByb2Nlc3MuY3dkKClcbiAgICAgICAgaWYgY2RzID0gd2luZG93LmJyYWluLmNkW3RsZF1cbiAgICAgICAgICAgIGZvciBkaXIsY291bnQgb2YgY2RzXG4gICAgICAgICAgICAgICAgcmVsID0gc2xhc2gucmVsYXRpdmUgZGlyLCB0bGRcbiAgICAgICAgICAgICAgICBpZiByZWxbMF0hPScuJyB0aGVuIHJlbCA9ICcuLycgKyByZWxcbiAgICAgICAgICAgICAgICBpZiByZWwgbm90IGluIFsnLi4nICcuJ11cbiAgICAgICAgICAgICAgICAgICAgbXRjaHMucHVzaCBbcmVsLCB0eXBlOidjaGRpcicgY291bnQ6Y291bnRdXG4gICAgICAgIG10Y2hzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICAgICBcbiAgICBvblRhYjogLT5cbiAgICAgICAgXG4gICAgICAgIFtsaW5lLCBiZWZvcmUsIGFmdGVyXSA9IEBsaW5lQmVmb3JlQWZ0ZXIoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGxpbmUudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAc3BhblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjdXJyZW50ID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgICAgICBpZiBAbGlzdCBhbmQgZW1wdHkgY3VycmVudFxuICAgICAgICAgICAgICAgIEBuYXZpZ2F0ZSAxXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN1ZmZpeCA9ICcnXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBAc2VsZWN0ZWRXb3JkKClcbiAgICAgICAgICAgICAgICBpZiBub3QgY3VycmVudC5lbmRzV2l0aCgnLycpIGFuZCBub3QgQHNlbGVjdGVkV29yZCgpLmVuZHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gJy8nXG4gICAgICAgICAgICAjIGtsb2cgXCJ0YWIgI3tAc2VsZWN0ZWRXb3JkKCl9IHwje2N1cnJlbnR9fCBzdWZmaXggI3tzdWZmaXh9XCJcbiAgICAgICAgICAgIEBjb21wbGV0ZSBzdWZmaXg6c3VmZml4XG4gICAgICAgICAgICBAb25UYWIoKVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBvbkluc2VydFxuICAgICAgICAgICAgICAgIHRhYjogICAgdHJ1ZVxuICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgICAgIGJlZm9yZTogYmVmb3JlXG4gICAgICAgICAgICAgICAgYWZ0ZXI6ICBhZnRlclxuICAgICAgICAgICAgICAgIGN1cnNvcjogQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuICAgIG9uSW5zZXJ0OiAoaW5mbykgPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBpbmZvLmJlZm9yZVstMV0gaW4gJ1wiXFwnJ1xuICAgICAgICByZXR1cm4gaWYgaW5mby5hZnRlclswXSBhbmQgaW5mby5hZnRlclswXSBub3QgaW4gJ1wiJ1xuICAgICAgICBcbiAgICAgICAgaWYgaW5mby5iZWZvcmVbLTFdID09ICcgJyBhbmQgaW5mby5iZWZvcmVbLTJdIG5vdCBpbiBbJ1wiXFwnICddXG4gICAgICAgICAgICBAaGFuZGxlU3BhY2UoKVxuICAgICAgICBcbiAgICAgICAgQGluZm8gPSBpbmZvXG4gICAgICAgIFxuICAgICAgICBzdHJpbmdPcGVuID0gQHN0cmluZ09wZW5Db2wgQGluZm8uYmVmb3JlXG4gICAgICAgIGlmIHN0cmluZ09wZW4gPj0gMFxuICAgICAgICAgICAgQHdvcmQgPSBAaW5mby5iZWZvcmUuc2xpY2Ugc3RyaW5nT3BlbisxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3b3JkID0gXy5sYXN0IEBpbmZvLmJlZm9yZS5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgXG4gICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBmaXJzdENtZCA9IEBpbmZvLmJlZm9yZS5zcGxpdCgnICcpWzBdXG4gICAgICAgIGRpcnNPbmx5ID0gZmlyc3RDbWQgaW4gQGRpckNvbW1hbmRzXG4gICAgICAgIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICBpZiBmaXJzdENtZCBpbiBAZmlsZUNvbW1hbmRzXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyBudWxsIGRpcnNPbmx5OmRpcnNPbmx5XG4gICAgICAgICAgICBpZiBlbXB0eSBAbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBjbWRNYXRjaGVzKClcbiAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmNsdWRlc0NtZHMgPSB0cnVlXG4gICAgICAgICAgICBpZiBAaW5mby5iZWZvcmUgPT0gJy4nXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAY2RNYXRjaGVzKCkuY29uY2F0IEBjbWRNYXRjaGVzKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBkaXJNYXRjaGVzKEB3b3JkLCBkaXJzT25seTpkaXJzT25seSkuY29uY2F0IEBjbWRNYXRjaGVzKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBlbXB0eSBAbWF0Y2hlcyBcbiAgICAgICAgICAgIGlmIEBpbmZvLnRhYiB0aGVuIEBjbG9zZVN0cmluZyBzdHJpbmdPcGVuXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBtYXRjaGVzLnNvcnQgKGEsYikgLT4gYlsxXS5jb3VudCAtIGFbMV0uY291bnRcbiAgICAgICAgICAgIFxuICAgICAgICBmaXJzdCA9IEBtYXRjaGVzLnNoaWZ0KCkgIyBzZXBlcmF0ZSBmaXJzdCBtYXRjaFxuICAgICAgICBcbiAgICAgICAgaWYgZmlyc3RbMF0gPT0gJy8nXG4gICAgICAgICAgICBAaW5mby5zcGxpdCA9IEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGluZm8uc3BsaXQgPSBAaW5mby5iZWZvcmUubGVuZ3RoIC0gQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICBpZiAwIDw9IHMgPSBAd29yZC5sYXN0SW5kZXhPZiAnLydcbiAgICAgICAgICAgICAgICBAaW5mby5zcGxpdCArPSBzICsgMVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBpbmNsdWRlc0NtZHNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VlbiA9IFtmaXJzdFswXV0gXG4gICAgICAgICAgICBpZiBmaXJzdFsxXS50eXBlID09ICdjbWQnICMgc2hvcnRlbiBjb21tYW5kIGNvbXBsZXRpb25zXG4gICAgICAgICAgICAgICAgc2VlbiA9IFtmaXJzdFswXVtAaW5mby5zcGxpdC4uXV1cbiAgICAgICAgICAgICAgICBmaXJzdFswXSA9IGZpcnN0WzBdW0BpbmZvLmJlZm9yZS5sZW5ndGguLl1cbiAgICBcbiAgICAgICAgICAgIGZvciBtIGluIEBtYXRjaGVzXG4gICAgICAgICAgICAgICAgaWYgbVsxXS50eXBlID09ICdjbWQnICMgc2hvcnRlbiBjb21tYW5kIGxpc3QgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgaWYgQGluZm8uc3BsaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1bMF0gPSBtWzBdW0BpbmZvLnNwbGl0Li5dXG4gICAgICAgICAgICBtaSA9IDBcbiAgICAgICAgICAgIHdoaWxlIG1pIDwgQG1hdGNoZXMubGVuZ3RoICMgY3JhcHB5IGR1cGxpY2F0ZSBmaWx0ZXJcbiAgICAgICAgICAgICAgICBpZiBAbWF0Y2hlc1ttaV1bMF0gaW4gc2VlblxuICAgICAgICAgICAgICAgICAgICBAbWF0Y2hlcy5zcGxpY2UgbWksIDFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHNlZW4ucHVzaCBAbWF0Y2hlc1ttaV1bMF1cbiAgICAgICAgICAgICAgICAgICAgbWkrK1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggQHdvcmRcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgIGVsc2UgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBAaW5mby5iZWZvcmVcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2UgQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBmaXJzdFswXS5zdGFydHNXaXRoIHNsYXNoLmZpbGUgQHdvcmRcbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIHNsYXNoLmZpbGUoQHdvcmQpLmxlbmd0aFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF1cbiAgICAgICAgXG4gICAgICAgIGlmIEBtYXRjaGVzLmxlbmd0aCA9PSAwIGFuZCBlbXB0eSBAY29tcGxldGlvblxuICAgICAgICAgICAgaWYgaW5mby50YWIgdGhlbiBAY2xvc2VTdHJpbmcgc3RyaW5nT3BlblxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBvcGVuKClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBcIiN7QGluZm8uYmVmb3JlfXwje0Bjb21wbGV0aW9ufXwje0BpbmZvLmFmdGVyfSAje0B3b3JkfVwiXG4gICAgICAgIFxuICAgICAgICBAc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOidhdXRvY29tcGxldGUtc3BhbidcbiAgICAgICAgQHNwYW4udGV4dENvbnRlbnQgICAgICA9IEBjb21wbGV0aW9uXG4gICAgICAgIEBzcGFuLnN0eWxlLm9wYWNpdHkgICAgPSAxXG4gICAgICAgIEBzcGFuLnN0eWxlLmJhY2tncm91bmQgPSBcIiM0NGFcIlxuICAgICAgICBAc3Bhbi5zdHlsZS5jb2xvciAgICAgID0gXCIjZmZmXCJcbiAgICAgICAgQHNwYW4uc3R5bGUudHJhbnNmb3JtICA9IFwidHJhbnNsYXRleCgje0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqQGVkaXRvci5tYWluQ3Vyc29yKClbMF19cHgpXCJcblxuICAgICAgICBpZiBub3Qgc3BhbkJlZm9yZSA9IEBlZGl0b3Iuc3BhbkJlZm9yZU1haW4oKVxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gc3BhbkluZm8nXG4gICAgICAgIFxuICAgICAgICBzaWJsaW5nID0gc3BhbkJlZm9yZVxuICAgICAgICB3aGlsZSBzaWJsaW5nID0gc2libGluZy5uZXh0U2libGluZ1xuICAgICAgICAgICAgQGNsb25lcy5wdXNoIHNpYmxpbmcuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIEBjbG9uZWQucHVzaCBzaWJsaW5nXG4gICAgICAgICAgICBcbiAgICAgICAgc3BhbkJlZm9yZS5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkIEBzcGFuXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkIHRoZW4gYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXMgdGhlbiBAc3Bhbi5pbnNlcnRBZGphY2VudEVsZW1lbnQgJ2FmdGVyZW5kJyBjXG4gICAgICAgICAgICBcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAY29tcGxldGlvbi5sZW5ndGggICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBtYXRjaGVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNob3dMaXN0KClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBzaG93TGlzdDogLT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1saXN0J1xuICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuICAgICAgICBAbGlzdE9mZnNldCA9IDBcbiAgICAgICAgXG4gICAgICAgIHNwbHQgPSBAd29yZC5zcGxpdCAnLydcbiAgICAgICAgXG4gICAgICAgIGlmIHNwbHQubGVuZ3RoPjEgYW5kIG5vdCBAd29yZC5lbmRzV2l0aCgnLycpIGFuZCBAY29tcGxldGlvbiAhPSAnLydcbiAgICAgICAgICAgIEBsaXN0T2Zmc2V0ID0gc3BsdFstMV0ubGVuZ3RoXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXNbMF1bMF0uc3RhcnRzV2l0aCBAd29yZFxuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICBAbGlzdC5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3stQGVkaXRvci5zaXplLmNoYXJXaWR0aCpAbGlzdE9mZnNldC0xMH1weClcIlxuICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciBtYXRjaCBpbiBAbWF0Y2hlc1xuICAgICAgICAgICAgaXRlbSA9IGVsZW0gY2xhc3M6J2F1dG9jb21wbGV0ZS1pdGVtJyBpbmRleDppbmRleCsrXG4gICAgICAgICAgICBpdGVtLmlubmVySFRNTCA9IFN5bnRheC5zcGFuRm9yVGV4dEFuZFN5bnRheCBtYXRjaFswXSwgJ3NoJ1xuICAgICAgICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkIG1hdGNoWzFdLnR5cGVcbiAgICAgICAgICAgIEBsaXN0LmFwcGVuZENoaWxkIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIG1jID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgXG4gICAgICAgIGxpbmVzQmVsb3cgPSBNYXRoLm1heChAZWRpdG9yLnNjcm9sbC5ib3QsIEBlZGl0b3Iuc2Nyb2xsLnZpZXdMaW5lcykgLSBtY1sxXSAtIDNcbiAgICAgICAgbGluZXNBYm92ZSA9IG1jWzFdIC0gQGVkaXRvci5zY3JvbGwudG9wICAtIDNcbiAgICAgICAgXG4gICAgICAgIGFib3ZlID0gbGluZXNBYm92ZSA+IGxpbmVzQmVsb3cgYW5kIGxpbmVzQmVsb3cgPCBNYXRoLm1pbiA3LCBAbWF0Y2hlcy5sZW5ndGhcbiAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCBhYm92ZSBhbmQgJ2Fib3ZlJyBvciAnYmVsb3cnXG5cbiAgICAgICAgQGxpc3Quc3R5bGUubWF4SGVpZ2h0ID0gXCIje0BlZGl0b3Iuc2Nyb2xsLmxpbmVIZWlnaHQqKGFib3ZlIGFuZCBsaW5lc0Fib3ZlIG9yIGxpbmVzQmVsb3cpfXB4XCJcbiAgICAgICAgXG4gICAgICAgIGN1cnNvciA9JCAnLm1haW4nIEBlZGl0b3Iudmlld1xuICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycgQG9uQ2xpY2tcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyA/IFtdXG4gICAgICAgICAgICBjLnJlbW92ZSgpXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZCA/IFtdXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnaW5pdGlhbCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc3Bhbj8ucmVtb3ZlKClcbiAgICAgICAgQHNlbGVjdGVkICAgPSAtMVxuICAgICAgICBAbGlzdE9mZnNldCA9IDBcbiAgICAgICAgQGluZm8gICAgICAgPSBudWxsXG4gICAgICAgIEBsaXN0ICAgICAgID0gbnVsbFxuICAgICAgICBAc3BhbiAgICAgICA9IG51bGxcbiAgICAgICAgQGNvbXBsZXRpb24gPSBudWxsXG4gICAgICAgIEBtYXRjaGVzICAgID0gW11cbiAgICAgICAgQGNsb25lcyAgICAgPSBbXVxuICAgICAgICBAY2xvbmVkICAgICA9IFtdXG4gICAgICAgIEBcblxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IGVsZW0udXBBdHRyIGV2ZW50LnRhcmdldCwgJ2luZGV4J1xuICAgICAgICBpZiBpbmRleCAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNlbGVjdCBpbmRleFxuICAgICAgICAgICAgQGNvbXBsZXRlIHt9XG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiAgICBjbG9zZVN0cmluZzogKHN0cmluZ09wZW4pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzdHJpbmdPcGVuID49IDBcbiAgICAgICAgICAgIGlmIGVtcHR5IEBpbmZvLmFmdGVyXG4gICAgICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgQGluZm8ubGluZSArICdcIidcbiAgICAgICAgICAgIGVsc2UgaWYgQGluZm8uYWZ0ZXJbMF0gPT0gJ1wiJ1xuICAgICAgICAgICAgICAgIEBlZGl0b3IubW92ZUN1cnNvcnNSaWdodCgpICBcbiAgICBcbiAgICBoYW5kbGVTcGFjZTogLT5cbiAgICAgICAgXG4gICAgICAgIFtsaW5lLCBiZWZvcmUsIGFmdGVyXSA9IEBsaW5lQmVmb3JlQWZ0ZXIoKVxuICAgICAgICBcbiAgICAgICAgbWNDb2wgPSBiZWZvcmUubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICB3aGlsZSBiZWZvcmVbLTFdICE9ICcgJ1xuICAgICAgICAgICAgYWZ0ZXIgID0gYmVmb3JlWy0xXSArIGFmdGVyXG4gICAgICAgICAgICBiZWZvcmUgPSBiZWZvcmVbMC4uYmVmb3JlLmxlbmd0aC0yXVxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAc3RyaW5nT3BlbkNvbCBiZWZvcmVcbiAgICAgICAgaWYgaW5kZXggPCAwXG5cbiAgICAgICAgICAgIHdyZCA9IGxhc3QgYmVmb3JlWy4uYmVmb3JlLmxlbmd0aC0yXS5zcGxpdCAvW1xcc1xcXCJdL1xuICAgICAgICAgICAgcHJ0ID0gc2xhc2guZGlyIHdyZFxuICAgICAgICAgICAge2l0ZW1zLCBkaXIsIG5vRGlyLCBub1BhcmVudH0gPSBAaXRlbXNGb3JEaXIgcHJ0XG5cbiAgICAgICAgICAgIHB0aCA9IHNsYXNoLnJlc29sdmUgd3JkKycgJ1xuICAgICAgICAgICAgZm9yIGl0ZW0gaW4gaXRlbXMgPyBbXVxuICAgICAgICAgICAgICAgIGlmIGl0ZW0uZmlsZS5zdGFydHNXaXRoIHB0aFxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgXCJJTlNFUlQgc3RyaW5nIGRlbGltaXRlcnMgYXJvdW5kIHwje3dyZCsnICd9fCBtYXRjaGluZ1wiIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBuZXdMaW5lID0gXCIje2JlZm9yZS5zbGljZSgwLGJlZm9yZS5sZW5ndGgtd3JkLmxlbmd0aC0xKX1cXFwiI3t3cmR9ICN7YWZ0ZXJ9XCJcbiAgICAgICAgICAgICAgICAgICAgbmV3TGluZSArPSAnXCInIGlmIG1jQ29sID09IGxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2V0SW5wdXRUZXh0IG5ld0xpbmVcbiAgICAgICAgICAgICAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFttY0NvbCsxLG1jWzFdXVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAjIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgIyBrbG9nIGl0ZW0uZmlsZVxuXG4gICAgICAgICAgICBrbG9nIFwibm8gaXRlbXMgbWF0Y2ggaW4gZGlyIHwje2Rpcn18XCJcblxuICAgIHN0cmluZ09wZW5Db2w6ICh0ZXh0KSAtPlxuXG4gICAgICAgIGxhc3RDb2wgPSB0ZXh0Lmxhc3RJbmRleE9mICdcIidcbiAgICAgICAgaWYgbGFzdENvbCA+IDBcbiAgICAgICAgICAgIGJlZm9yZSA9IHRleHRbLi4ubGFzdENvbF1cbiAgICAgICAgICAgIGNvdW50ID0gYmVmb3JlLnNwbGl0KCdcIicpLmxlbmd0aCAtIDFcbiAgICAgICAgICAgIGlmIGNvdW50ICUgMiAhPSAwXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xXG4gICAgICAgIGxhc3RDb2xcbiAgICAgICAgXG4gICAgbGluZUJlZm9yZUFmdGVyOiAtPiBcblxuICAgICAgICBtYyAgID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZSBtY1sxXVxuICAgICAgICBcbiAgICAgICAgW2xpbmUsIGxpbmVbMC4uLm1jWzBdXSwgbGluZVttY1swXS4uXV1cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBjb21wbGV0ZTogKHN1ZmZpeDonJykgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbXBsID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnBhc3RlVGV4dCBjb21wbCArIHN1ZmZpeFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgaWYgY29tcGwuaW5kZXhPZignICcpID49IDBcbiAgICAgICAgICAgIEBoYW5kbGVTcGFjZSgpXG5cbiAgICBpc0xpc3RJdGVtU2VsZWN0ZWQ6IC0+IEBsaXN0IGFuZCBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBzZWxlY3RlZFdvcmQ6IC0+IEB3b3JkK0BzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgIFxuICAgIHNlbGVjdGVkQ29tcGxldGlvbjogLT5cbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgICMga2xvZyAnY29tcGxldGlvbicgQHNlbGVjdGVkICwgQG1hdGNoZXNbQHNlbGVjdGVkXVswXSwgQGxpc3RPZmZzZXRcbiAgICAgICAgICAgIEBtYXRjaGVzW0BzZWxlY3RlZF1bMF0uc2xpY2UgQGxpc3RPZmZzZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaGVzLmxlbmd0aC0xLCBAc2VsZWN0ZWQrZGVsdGFcbiAgICAgICAgXG4gICAgc2VsZWN0OiAoaW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsaXN0Py5jaGlsZHJlblswXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIEBzcGFuLmlubmVySFRNTCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAbW92ZUNsb25lc0J5IEBzcGFuLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LmFkZCAgICAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHByZXY6ICAtPiBAbmF2aWdhdGUgLTEgICAgXG4gICAgbmV4dDogIC0+IEBuYXZpZ2F0ZSAxXG4gICAgbGFzdDogIC0+IEBuYXZpZ2F0ZSBAbWF0Y2hlcy5sZW5ndGggLSBAc2VsZWN0ZWRcbiAgICBmaXJzdDogLT4gQG5hdmlnYXRlIC1JbmZpbml0eVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAY2xvbmVzXG4gICAgICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb21ibyA9PSAndGFiJ1xuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudCAjIHByZXZlbnQgZm9jdXMgY2hhbmdlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCcgaWYgbm90IEBzcGFuP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvIFxuICAgICAgICAgICAgd2hlbiAncmlnaHQnICAgICB0aGVuIHJldHVybiBAY29tcGxldGUge31cbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSArOVxuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiByZXR1cm4gQG5hdmlnYXRlIC05XG4gICAgICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIHJldHVybiBAbGFzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIHJldHVybiBAZmlyc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiByZXR1cm4gQG5leHQoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiByZXR1cm4gQHByZXYoKVxuICAgICAgICBAY2xvc2UoKSAgIFxuICAgICAgICAndW5oYW5kbGVkJ1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQXV0b2NvbXBsZXRlXG4iXX0=
//# sourceURL=../../coffee/editor/autocomplete.coffee