// koffee 1.12.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, Syntax, _, clamp, elem, empty, first, kerror, last, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), stopEvent = ref.stopEvent, slash = ref.slash, valid = ref.valid, empty = ref.empty, first = ref.first, clamp = ref.clamp, elem = ref.elem, last = ref.last, kerror = ref.kerror, $ = ref.$, _ = ref._;

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

    Autocomplete.prototype.dirMatches = function(dir, arg1) {
        var dirsOnly, items, noDir, noParent, ref1, ref2, result;
        dirsOnly = (ref1 = arg1.dirsOnly) != null ? ref1 : false;
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
        var arg, cmd, cmds, count, info, mtchs, ref1, splt;
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
        if (this.info.before.indexOf(' ') > 0) {
            splt = this.info.before.split(' ');
            cmd = splt.shift();
            if (info = window.brain.args[cmd]) {
                ref1 = info.args;
                for (arg in ref1) {
                    count = ref1[arg];
                    if (indexOf.call(splt, arg) < 0) {
                        if (this.info.before.endsWith(' ')) {
                            mtchs.push([
                                arg, {
                                    type: 'arg',
                                    count: count
                                }
                            ]);
                        } else {
                            if (arg.startsWith(this.word) && arg.length > this.word.length) {
                                mtchs.push([
                                    arg.slice(this.word.length), {
                                        type: 'arg',
                                        count: count
                                    }
                                ]);
                            }
                        }
                    }
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
                            type: 'dir',
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

    Autocomplete.prototype.complete = function(arg1) {
        var compl, ref1, suffix;
        suffix = (ref1 = arg1.suffix) != null ? ref1 : '';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9lZGl0b3IiLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsaUdBQUE7SUFBQTs7O0FBUUEsTUFBNkUsT0FBQSxDQUFRLEtBQVIsQ0FBN0UsRUFBRSx5QkFBRixFQUFhLGlCQUFiLEVBQW9CLGlCQUFwQixFQUEyQixpQkFBM0IsRUFBa0MsaUJBQWxDLEVBQXlDLGlCQUF6QyxFQUFnRCxlQUFoRCxFQUFzRCxlQUF0RCxFQUE0RCxtQkFBNUQsRUFBb0UsU0FBcEUsRUFBdUU7O0FBRXZFLE1BQUEsR0FBUyxPQUFBLENBQVEsVUFBUjs7QUFFSDtJQUVDLHNCQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7OztRQUVBLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQyxJQUFELEVBQU0sSUFBTixFQUFXLElBQVgsRUFBZ0IsSUFBaEIsRUFBcUIsSUFBckIsRUFBMEIsTUFBMUIsRUFBaUMsS0FBakM7UUFDaEIsSUFBQyxDQUFBLFdBQUQsR0FBZ0IsQ0FBQyxJQUFEO1FBRWhCLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLFFBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxNQUFYLEVBQW9CLElBQUMsQ0FBQSxLQUFyQjtJQVhEOzsyQkFtQkgsV0FBQSxHQUFhLFNBQUMsR0FBRDtBQUVULFlBQUE7UUFBQSxJQUFHLENBQUksS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaLENBQVA7WUFDSSxLQUFBLEdBQVEsS0FBSyxDQUFDLElBQU4s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QSxJQUFELENBQUE7QUFMakMscUJBTVMsSUFOVDtBQU0wQiwyQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBTmpDLGFBREo7O1FBUUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBO0lBckJvQjs7Ozs7O0FBdUI1QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyBzdG9wRXZlbnQsIHNsYXNoLCB2YWxpZCwgZW1wdHksIGZpcnN0LCBjbGFtcCwgZWxlbSwgbGFzdCwga2Vycm9yLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cblN5bnRheCA9IHJlcXVpcmUgJy4vc3ludGF4J1xuXG5jbGFzcyBBdXRvY29tcGxldGVcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEBzcGxpdFJlZ0V4cCA9IC9bXFxzXFxcIl0rL2dcbiAgICBcbiAgICAgICAgQGZpbGVDb21tYW5kcyA9IFsnY2QnICdscycgJ3JtJyAnY3AnICdtdicgJ2tyZXAnICdjYXQnXVxuICAgICAgICBAZGlyQ29tbWFuZHMgID0gWydjZCddXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdpbnNlcnQnIEBvbkluc2VydFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgIEBjbG9zZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGl0ZW1zRm9yRGlyOiAoZGlyKSAtPlxuICAgIFxuICAgICAgICBpZiBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICBub0RpciA9IHNsYXNoLmZpbGUgZGlyXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZGlyXG4gICAgICAgICAgICBpZiBub3QgZGlyIG9yIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCA9IGRpciAgXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gJy8nIGlmIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9IG5vRGlyXG4gICAgICAgICAgICAgICAgZGlyID0gJydcblxuICAgICAgICBpdGVtczogc2xhc2gubGlzdCBkaXIsIGlnbm9yZUhpZGRlbjpmYWxzZVxuICAgICAgICBkaXI6ZGlyIFxuICAgICAgICBub0Rpcjpub0RpciBcbiAgICAgICAgbm9QYXJlbnQ6bm9QYXJlbnRcbiAgICBcbiAgICBkaXJNYXRjaGVzOiAoZGlyLCBkaXJzT25seTpmYWxzZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHtpdGVtcywgZGlyLCBub0Rpciwgbm9QYXJlbnR9ID0gQGl0ZW1zRm9yRGlyIGRpclxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgaXRlbXNcblxuICAgICAgICAgICAgcmVzdWx0ID0gaXRlbXMubWFwIChpKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVybiBpZiBkaXJzT25seSBhbmQgaS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbmFtZSA9IG51bGxcbiAgICAgICAgICAgICAgICBpZiBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aChub1BhcmVudCkgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBub0RpclxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aChub0RpcikgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcvJyBvciBlbXB0eShkaXIpIHRoZW4gbmFtZSA9IGkubmFtZVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGkubmFtZVswXSA9PSAnLidcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy4nIHRoZW4gbmFtZSA9IGkubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICBuYW1lID0gJy8nK2kubmFtZVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcuJyB0aGVuIG5hbWUgPSAnLi8nK2kubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICBuYW1lID0gJy8nK2kubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgaWYgaS50eXBlID09ICdmaWxlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQgPSAwXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQgPSAoaS5uYW1lWzBdID09ICcuJyBhbmQgNjY2IG9yIDMzMylcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IChpLm5hbWVbMF0gPT0gJy4nIGFuZCAzMzMgb3IgNjY2KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW25hbWUsIGNvdW50OmNvdW50LCB0eXBlOmkudHlwZV1cblxuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmZpbHRlciAoZikgLT4gZlxuXG4gICAgICAgICAgICBpZiBkaXIuZW5kc1dpdGggJy4uLydcbiAgICAgICAgICAgICAgICBpZiBub3Qgc2xhc2guaXNSb290IHNsYXNoLmpvaW4gcHJvY2Vzcy5jd2QoKSwgZGlyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLi4nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgIGVsc2UgaWYgZGlyID09ICcuJyBvciBkaXIuZW5kc1dpdGgoJy8uJylcbiAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy4uJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgIGVsc2UgaWYgbm90IG5vRGlyIGFuZCB2YWxpZChkaXIpIFxuICAgICAgICAgICAgICAgIGlmIG5vdCBkaXIuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLycgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJycgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIChub3Qgbm9EaXIpIGFuZCBkaXJbLTFdICE9ICcvJ1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IFtbJy8nIGNvdW50Ojk5OSB0eXBlOidkaXInXV1cbiAgICAgICAgcmVzdWx0ID8gW11cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY21kTWF0Y2hlczogLT5cbiAgICAgICAgXG4gICAgICAgIG10Y2hzID0gW11cblxuICAgICAgICBpZiBjbWRzID0gd2luZG93LmJyYWluLmRpcnNbc2xhc2gudGlsZGUgcHJvY2Vzcy5jd2QoKV1cbiAgICAgICAgICAgIGZvciBjbWQsY291bnQgb2YgY21kc1xuICAgICAgICAgICAgICAgIGlmIGNtZC5zdGFydHNXaXRoKEBpbmZvLmJlZm9yZSkgYW5kIGNtZC5sZW5ndGggPiBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIG10Y2hzLnB1c2ggW2NtZCwgdHlwZTonY21kJyBjb3VudDpjb3VudF1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBpbmZvLmJlZm9yZS5pbmRleE9mKCcgJykgPiAwXG4gICAgICAgICAgICBzcGx0ID0gQGluZm8uYmVmb3JlLnNwbGl0ICcgJ1xuICAgICAgICAgICAgY21kID0gc3BsdC5zaGlmdCgpXG4gICAgICAgICAgICBpZiBpbmZvID0gd2luZG93LmJyYWluLmFyZ3NbY21kXVxuICAgICAgICAgICAgICAgIGZvciBhcmcsY291bnQgb2YgaW5mby5hcmdzXG4gICAgICAgICAgICAgICAgICAgIGlmIGFyZyBub3QgaW4gc3BsdFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgQGluZm8uYmVmb3JlLmVuZHNXaXRoICcgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG10Y2hzLnB1c2ggW2FyZywgdHlwZTonYXJnJyBjb3VudDpjb3VudF1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBhcmcuc3RhcnRzV2l0aChAd29yZCkgYW5kIGFyZy5sZW5ndGggPiBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXRjaHMucHVzaCBbYXJnW0B3b3JkLmxlbmd0aC4uXSwgdHlwZTonYXJnJyBjb3VudDpjb3VudF1cbiAgICAgICAgbXRjaHNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjZE1hdGNoZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBtdGNocyA9IFtdXG5cbiAgICAgICAgdGxkID0gc2xhc2gudGlsZGUgcHJvY2Vzcy5jd2QoKVxuICAgICAgICBpZiBjZHMgPSB3aW5kb3cuYnJhaW4uY2RbdGxkXVxuICAgICAgICAgICAgZm9yIGRpcixjb3VudCBvZiBjZHNcbiAgICAgICAgICAgICAgICByZWwgPSBzbGFzaC5yZWxhdGl2ZSBkaXIsIHRsZFxuICAgICAgICAgICAgICAgIGlmIHJlbFswXSE9Jy4nIHRoZW4gcmVsID0gJy4vJyArIHJlbFxuICAgICAgICAgICAgICAgIGlmIHJlbCBub3QgaW4gWycuLicgJy4nXVxuICAgICAgICAgICAgICAgICAgICBtdGNocy5wdXNoIFtyZWwsIHR5cGU6J2RpcicgY291bnQ6Y291bnRdXG4gICAgICAgIG10Y2hzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgICAgICBcbiAgICBvblRhYjogLT5cbiAgICAgICAgXG4gICAgICAgIFtsaW5lLCBiZWZvcmUsIGFmdGVyXSA9IEBsaW5lQmVmb3JlQWZ0ZXIoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGxpbmUudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAc3BhblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjdXJyZW50ID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgICAgICBpZiBAbGlzdCBhbmQgZW1wdHkgY3VycmVudFxuICAgICAgICAgICAgICAgIEBuYXZpZ2F0ZSAxXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN1ZmZpeCA9ICcnXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBAc2VsZWN0ZWRXb3JkKClcbiAgICAgICAgICAgICAgICBpZiBub3QgY3VycmVudC5lbmRzV2l0aCgnLycpIGFuZCBub3QgQHNlbGVjdGVkV29yZCgpLmVuZHNXaXRoKCcvJylcbiAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gJy8nXG4gICAgICAgICAgICAjIGtsb2cgXCJ0YWIgI3tAc2VsZWN0ZWRXb3JkKCl9IHwje2N1cnJlbnR9fCBzdWZmaXggI3tzdWZmaXh9XCJcbiAgICAgICAgICAgIEBjb21wbGV0ZSBzdWZmaXg6c3VmZml4XG4gICAgICAgICAgICBAb25UYWIoKVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBvbkluc2VydFxuICAgICAgICAgICAgICAgIHRhYjogICAgdHJ1ZVxuICAgICAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgICAgIGJlZm9yZTogYmVmb3JlXG4gICAgICAgICAgICAgICAgYWZ0ZXI6ICBhZnRlclxuICAgICAgICAgICAgICAgIGN1cnNvcjogQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcblxuICAgIG9uSW5zZXJ0OiAoaW5mbykgPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBpbmZvLmJlZm9yZVstMV0gaW4gJ1wiXFwnJ1xuICAgICAgICByZXR1cm4gaWYgaW5mby5hZnRlclswXSBhbmQgaW5mby5hZnRlclswXSBub3QgaW4gJ1wiJ1xuICAgICAgICBcbiAgICAgICAgaWYgaW5mby5iZWZvcmVbLTFdID09ICcgJyBhbmQgaW5mby5iZWZvcmVbLTJdIG5vdCBpbiBbJ1wiXFwnICddXG4gICAgICAgICAgICBAaGFuZGxlU3BhY2UoKVxuICAgICAgICBcbiAgICAgICAgQGluZm8gPSBpbmZvXG4gICAgICAgIFxuICAgICAgICBzdHJpbmdPcGVuID0gQHN0cmluZ09wZW5Db2wgQGluZm8uYmVmb3JlXG4gICAgICAgIGlmIHN0cmluZ09wZW4gPj0gMFxuICAgICAgICAgICAgQHdvcmQgPSBAaW5mby5iZWZvcmUuc2xpY2Ugc3RyaW5nT3BlbisxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB3b3JkID0gXy5sYXN0IEBpbmZvLmJlZm9yZS5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgXG4gICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBmaXJzdENtZCA9IEBpbmZvLmJlZm9yZS5zcGxpdCgnICcpWzBdXG4gICAgICAgIGRpcnNPbmx5ID0gZmlyc3RDbWQgaW4gQGRpckNvbW1hbmRzXG4gICAgICAgIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICBpZiBmaXJzdENtZCBpbiBAZmlsZUNvbW1hbmRzXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyBudWxsIGRpcnNPbmx5OmRpcnNPbmx5XG4gICAgICAgICAgICBpZiBlbXB0eSBAbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBjbWRNYXRjaGVzKClcbiAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmNsdWRlc0NtZHMgPSB0cnVlXG4gICAgICAgICAgICBpZiBAaW5mby5iZWZvcmUgPT0gJy4nXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAY2RNYXRjaGVzKCkuY29uY2F0IEBjbWRNYXRjaGVzKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBkaXJNYXRjaGVzKEB3b3JkLCBkaXJzT25seTpkaXJzT25seSkuY29uY2F0IEBjbWRNYXRjaGVzKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBlbXB0eSBAbWF0Y2hlcyBcbiAgICAgICAgICAgIGlmIEBpbmZvLnRhYiB0aGVuIEBjbG9zZVN0cmluZyBzdHJpbmdPcGVuXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBtYXRjaGVzLnNvcnQgKGEsYikgLT4gYlsxXS5jb3VudCAtIGFbMV0uY291bnRcbiAgICAgICAgICAgIFxuICAgICAgICBmaXJzdCA9IEBtYXRjaGVzLnNoaWZ0KCkgIyBzZXBlcmF0ZSBmaXJzdCBtYXRjaFxuICAgICAgICBcbiAgICAgICAgaWYgZmlyc3RbMF0gPT0gJy8nXG4gICAgICAgICAgICBAaW5mby5zcGxpdCA9IEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGluZm8uc3BsaXQgPSBAaW5mby5iZWZvcmUubGVuZ3RoIC0gQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICBpZiAwIDw9IHMgPSBAd29yZC5sYXN0SW5kZXhPZiAnLydcbiAgICAgICAgICAgICAgICBAaW5mby5zcGxpdCArPSBzICsgMVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBpbmNsdWRlc0NtZHNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VlbiA9IFtmaXJzdFswXV0gXG4gICAgICAgICAgICBpZiBmaXJzdFsxXS50eXBlID09ICdjbWQnICMgc2hvcnRlbiBjb21tYW5kIGNvbXBsZXRpb25zXG4gICAgICAgICAgICAgICAgc2VlbiA9IFtmaXJzdFswXVtAaW5mby5zcGxpdC4uXV1cbiAgICAgICAgICAgICAgICBmaXJzdFswXSA9IGZpcnN0WzBdW0BpbmZvLmJlZm9yZS5sZW5ndGguLl1cbiAgICBcbiAgICAgICAgICAgIGZvciBtIGluIEBtYXRjaGVzXG4gICAgICAgICAgICAgICAgaWYgbVsxXS50eXBlID09ICdjbWQnICMgc2hvcnRlbiBjb21tYW5kIGxpc3QgaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgaWYgQGluZm8uc3BsaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1bMF0gPSBtWzBdW0BpbmZvLnNwbGl0Li5dXG4gICAgICAgICAgICBtaSA9IDBcbiAgICAgICAgICAgIHdoaWxlIG1pIDwgQG1hdGNoZXMubGVuZ3RoICMgY3JhcHB5IGR1cGxpY2F0ZSBmaWx0ZXJcbiAgICAgICAgICAgICAgICBpZiBAbWF0Y2hlc1ttaV1bMF0gaW4gc2VlblxuICAgICAgICAgICAgICAgICAgICBAbWF0Y2hlcy5zcGxpY2UgbWksIDFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHNlZW4ucHVzaCBAbWF0Y2hlc1ttaV1bMF1cbiAgICAgICAgICAgICAgICAgICAgbWkrK1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggQHdvcmRcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgIGVsc2UgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBAaW5mby5iZWZvcmVcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2UgQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBmaXJzdFswXS5zdGFydHNXaXRoIHNsYXNoLmZpbGUgQHdvcmRcbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIHNsYXNoLmZpbGUoQHdvcmQpLmxlbmd0aFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF1cbiAgICAgICAgXG4gICAgICAgIGlmIEBtYXRjaGVzLmxlbmd0aCA9PSAwIGFuZCBlbXB0eSBAY29tcGxldGlvblxuICAgICAgICAgICAgaWYgaW5mby50YWIgdGhlbiBAY2xvc2VTdHJpbmcgc3RyaW5nT3BlblxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBvcGVuKClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBcIiN7QGluZm8uYmVmb3JlfXwje0Bjb21wbGV0aW9ufXwje0BpbmZvLmFmdGVyfSAje0B3b3JkfVwiXG4gICAgICAgIFxuICAgICAgICBAc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOidhdXRvY29tcGxldGUtc3BhbidcbiAgICAgICAgQHNwYW4udGV4dENvbnRlbnQgICAgICA9IEBjb21wbGV0aW9uXG4gICAgICAgIEBzcGFuLnN0eWxlLm9wYWNpdHkgICAgPSAxXG4gICAgICAgIEBzcGFuLnN0eWxlLmJhY2tncm91bmQgPSBcIiM0NGFcIlxuICAgICAgICBAc3Bhbi5zdHlsZS5jb2xvciAgICAgID0gXCIjZmZmXCJcbiAgICAgICAgQHNwYW4uc3R5bGUudHJhbnNmb3JtICA9IFwidHJhbnNsYXRleCgje0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqQGVkaXRvci5tYWluQ3Vyc29yKClbMF19cHgpXCJcblxuICAgICAgICBpZiBub3Qgc3BhbkJlZm9yZSA9IEBlZGl0b3Iuc3BhbkJlZm9yZU1haW4oKVxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gc3BhbkluZm8nXG4gICAgICAgIFxuICAgICAgICBzaWJsaW5nID0gc3BhbkJlZm9yZVxuICAgICAgICB3aGlsZSBzaWJsaW5nID0gc2libGluZy5uZXh0U2libGluZ1xuICAgICAgICAgICAgQGNsb25lcy5wdXNoIHNpYmxpbmcuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIEBjbG9uZWQucHVzaCBzaWJsaW5nXG4gICAgICAgICAgICBcbiAgICAgICAgc3BhbkJlZm9yZS5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkIEBzcGFuXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkIHRoZW4gYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXMgdGhlbiBAc3Bhbi5pbnNlcnRBZGphY2VudEVsZW1lbnQgJ2FmdGVyZW5kJyBjXG4gICAgICAgICAgICBcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAY29tcGxldGlvbi5sZW5ndGggICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBtYXRjaGVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNob3dMaXN0KClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBzaG93TGlzdDogLT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1saXN0J1xuICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuICAgICAgICBAbGlzdE9mZnNldCA9IDBcbiAgICAgICAgXG4gICAgICAgIHNwbHQgPSBAd29yZC5zcGxpdCAnLydcbiAgICAgICAgXG4gICAgICAgIGlmIHNwbHQubGVuZ3RoPjEgYW5kIG5vdCBAd29yZC5lbmRzV2l0aCgnLycpIGFuZCBAY29tcGxldGlvbiAhPSAnLydcbiAgICAgICAgICAgIEBsaXN0T2Zmc2V0ID0gc3BsdFstMV0ubGVuZ3RoXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXNbMF1bMF0uc3RhcnRzV2l0aCBAd29yZFxuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICBAbGlzdC5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3stQGVkaXRvci5zaXplLmNoYXJXaWR0aCpAbGlzdE9mZnNldC0xMH1weClcIlxuICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciBtYXRjaCBpbiBAbWF0Y2hlc1xuICAgICAgICAgICAgaXRlbSA9IGVsZW0gY2xhc3M6J2F1dG9jb21wbGV0ZS1pdGVtJyBpbmRleDppbmRleCsrXG4gICAgICAgICAgICBpdGVtLmlubmVySFRNTCA9IFN5bnRheC5zcGFuRm9yVGV4dEFuZFN5bnRheCBtYXRjaFswXSwgJ3NoJ1xuICAgICAgICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkIG1hdGNoWzFdLnR5cGVcbiAgICAgICAgICAgIEBsaXN0LmFwcGVuZENoaWxkIGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIG1jID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgXG4gICAgICAgIGxpbmVzQmVsb3cgPSBNYXRoLm1heChAZWRpdG9yLnNjcm9sbC5ib3QsIEBlZGl0b3Iuc2Nyb2xsLnZpZXdMaW5lcykgLSBtY1sxXSAtIDNcbiAgICAgICAgbGluZXNBYm92ZSA9IG1jWzFdIC0gQGVkaXRvci5zY3JvbGwudG9wICAtIDNcbiAgICAgICAgXG4gICAgICAgIGFib3ZlID0gbGluZXNBYm92ZSA+IGxpbmVzQmVsb3cgYW5kIGxpbmVzQmVsb3cgPCBNYXRoLm1pbiA3LCBAbWF0Y2hlcy5sZW5ndGhcbiAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCBhYm92ZSBhbmQgJ2Fib3ZlJyBvciAnYmVsb3cnXG5cbiAgICAgICAgQGxpc3Quc3R5bGUubWF4SGVpZ2h0ID0gXCIje0BlZGl0b3Iuc2Nyb2xsLmxpbmVIZWlnaHQqKGFib3ZlIGFuZCBsaW5lc0Fib3ZlIG9yIGxpbmVzQmVsb3cpfXB4XCJcbiAgICAgICAgXG4gICAgICAgIGN1cnNvciA9JCAnLm1haW4nIEBlZGl0b3Iudmlld1xuICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycgQG9uQ2xpY2tcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyA/IFtdXG4gICAgICAgICAgICBjLnJlbW92ZSgpXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZCA/IFtdXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnaW5pdGlhbCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc3Bhbj8ucmVtb3ZlKClcbiAgICAgICAgQHNlbGVjdGVkICAgPSAtMVxuICAgICAgICBAbGlzdE9mZnNldCA9IDBcbiAgICAgICAgQGluZm8gICAgICAgPSBudWxsXG4gICAgICAgIEBsaXN0ICAgICAgID0gbnVsbFxuICAgICAgICBAc3BhbiAgICAgICA9IG51bGxcbiAgICAgICAgQGNvbXBsZXRpb24gPSBudWxsXG4gICAgICAgIEBtYXRjaGVzICAgID0gW11cbiAgICAgICAgQGNsb25lcyAgICAgPSBbXVxuICAgICAgICBAY2xvbmVkICAgICA9IFtdXG4gICAgICAgIEBcblxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IGVsZW0udXBBdHRyIGV2ZW50LnRhcmdldCwgJ2luZGV4J1xuICAgICAgICBpZiBpbmRleCAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNlbGVjdCBpbmRleFxuICAgICAgICAgICAgQGNvbXBsZXRlIHt9XG4gICAgICAgIHN0b3BFdmVudCBldmVudFxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG5cbiAgICBjbG9zZVN0cmluZzogKHN0cmluZ09wZW4pIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzdHJpbmdPcGVuID49IDBcbiAgICAgICAgICAgIGlmIGVtcHR5IEBpbmZvLmFmdGVyXG4gICAgICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgQGluZm8ubGluZSArICdcIidcbiAgICAgICAgICAgIGVsc2UgaWYgQGluZm8uYWZ0ZXJbMF0gPT0gJ1wiJ1xuICAgICAgICAgICAgICAgIEBlZGl0b3IubW92ZUN1cnNvcnNSaWdodCgpICBcbiAgICBcbiAgICBoYW5kbGVTcGFjZTogLT5cbiAgICAgICAgXG4gICAgICAgIFtsaW5lLCBiZWZvcmUsIGFmdGVyXSA9IEBsaW5lQmVmb3JlQWZ0ZXIoKVxuICAgICAgICBcbiAgICAgICAgbWNDb2wgPSBiZWZvcmUubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICB3aGlsZSBiZWZvcmVbLTFdICE9ICcgJ1xuICAgICAgICAgICAgYWZ0ZXIgID0gYmVmb3JlWy0xXSArIGFmdGVyXG4gICAgICAgICAgICBiZWZvcmUgPSBiZWZvcmVbMC4uYmVmb3JlLmxlbmd0aC0yXVxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAc3RyaW5nT3BlbkNvbCBiZWZvcmVcbiAgICAgICAgaWYgaW5kZXggPCAwXG5cbiAgICAgICAgICAgIHdyZCA9IGxhc3QgYmVmb3JlWy4uYmVmb3JlLmxlbmd0aC0yXS5zcGxpdCAvW1xcc1xcXCJdL1xuICAgICAgICAgICAgcHJ0ID0gc2xhc2guZGlyIHdyZFxuICAgICAgICAgICAge2l0ZW1zLCBkaXIsIG5vRGlyLCBub1BhcmVudH0gPSBAaXRlbXNGb3JEaXIgcHJ0XG5cbiAgICAgICAgICAgIHB0aCA9IHNsYXNoLnJlc29sdmUgd3JkKycgJ1xuICAgICAgICAgICAgZm9yIGl0ZW0gaW4gaXRlbXMgPyBbXVxuICAgICAgICAgICAgICAgIGlmIGl0ZW0uZmlsZS5zdGFydHNXaXRoIHB0aFxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgXCJJTlNFUlQgc3RyaW5nIGRlbGltaXRlcnMgYXJvdW5kIHwje3dyZCsnICd9fCBtYXRjaGluZ1wiIGl0ZW0uZmlsZVxuICAgICAgICAgICAgICAgICAgICBuZXdMaW5lID0gXCIje2JlZm9yZS5zbGljZSgwLGJlZm9yZS5sZW5ndGgtd3JkLmxlbmd0aC0xKX1cXFwiI3t3cmR9ICN7YWZ0ZXJ9XCJcbiAgICAgICAgICAgICAgICAgICAgbmV3TGluZSArPSAnXCInIGlmIG1jQ29sID09IGxpbmUubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2V0SW5wdXRUZXh0IG5ld0xpbmVcbiAgICAgICAgICAgICAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLnNpbmdsZUN1cnNvckF0UG9zIFttY0NvbCsxLG1jWzFdXVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAjIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgIyBrbG9nIGl0ZW0uZmlsZVxuXG4gICAgc3RyaW5nT3BlbkNvbDogKHRleHQpIC0+XG5cbiAgICAgICAgbGFzdENvbCA9IHRleHQubGFzdEluZGV4T2YgJ1wiJ1xuICAgICAgICBpZiBsYXN0Q29sID4gMFxuICAgICAgICAgICAgYmVmb3JlID0gdGV4dFsuLi5sYXN0Q29sXVxuICAgICAgICAgICAgY291bnQgPSBiZWZvcmUuc3BsaXQoJ1wiJykubGVuZ3RoIC0gMVxuICAgICAgICAgICAgaWYgY291bnQgJSAyICE9IDBcbiAgICAgICAgICAgICAgICByZXR1cm4gLTFcbiAgICAgICAgbGFzdENvbFxuICAgICAgICBcbiAgICBsaW5lQmVmb3JlQWZ0ZXI6IC0+IFxuXG4gICAgICAgIG1jICAgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lIG1jWzFdXG4gICAgICAgIFxuICAgICAgICBbbGluZSwgbGluZVswLi4ubWNbMF1dLCBsaW5lW21jWzBdLi5dXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGNvbXBsZXRlOiAoc3VmZml4OicnKSAtPlxuICAgICAgICBcbiAgICAgICAgY29tcGwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IucGFzdGVUZXh0IGNvbXBsICsgc3VmZml4XG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICBpZiBjb21wbC5pbmRleE9mKCcgJykgPj0gMFxuICAgICAgICAgICAgQGhhbmRsZVNwYWNlKClcblxuICAgIGlzTGlzdEl0ZW1TZWxlY3RlZDogLT4gQGxpc3QgYW5kIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHNlbGVjdGVkV29yZDogLT4gQHdvcmQrQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgXG4gICAgc2VsZWN0ZWRDb21wbGV0aW9uOiAtPlxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgIyBrbG9nICdjb21wbGV0aW9uJyBAc2VsZWN0ZWQgLCBAbWF0Y2hlc1tAc2VsZWN0ZWRdWzBdLCBAbGlzdE9mZnNldFxuICAgICAgICAgICAgQG1hdGNoZXNbQHNlbGVjdGVkXVswXS5zbGljZSBAbGlzdE9mZnNldFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY29tcGxldGlvblxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgbmF2aWdhdGU6IChkZWx0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3RcbiAgICAgICAgQHNlbGVjdCBjbGFtcCAtMSwgQG1hdGNoZXMubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxpc3Q/LmNoaWxkcmVuWzBdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgQHNwYW4uaW5uZXJIVE1MID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQHNwYW4uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QuYWRkICAgICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgcHJldjogIC0+IEBuYXZpZ2F0ZSAtMSAgICBcbiAgICBuZXh0OiAgLT4gQG5hdmlnYXRlIDFcbiAgICBsYXN0OiAgLT4gQG5hdmlnYXRlIEBtYXRjaGVzLmxlbmd0aCAtIEBzZWxlY3RlZFxuICAgIGZpcnN0OiAtPiBAbmF2aWdhdGUgLUluZmluaXR5XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgXG5cbiAgICBtb3ZlQ2xvbmVzQnk6IChudW1DaGFycykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBjbG9uZXNcbiAgICAgICAgICAgIGJlZm9yZUxlbmd0aCA9IEBjbG9uZXNbMF0uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGNpIGluIFsxLi4uQGNsb25lcy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgYyA9IEBjbG9uZXNbY2ldXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkW2NpLTFdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICAgICAgICAgIGNoYXJPZmZzZXQgPSBudW1DaGFyc1xuICAgICAgICAgICAgICAgIGNoYXJPZmZzZXQgKz0gYmVmb3JlTGVuZ3RoIGlmIGNpID09IDFcbiAgICAgICAgICAgICAgICBjLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje29mZnNldCtAZWRpdG9yLnNpemUuY2hhcldpZHRoKmNoYXJPZmZzZXR9cHgpXCJcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvID09ICd0YWInXG4gICAgICAgICAgICBAb25UYWIoKVxuICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICMgcHJldmVudCBmb2N1cyBjaGFuZ2VcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQHNwYW4/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm8gXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgICAgIHRoZW4gcmV0dXJuIEBjb21wbGV0ZSB7fVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0PyBcbiAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiByZXR1cm4gQG5hdmlnYXRlICs5XG4gICAgICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIHJldHVybiBAbmF2aWdhdGUgLTlcbiAgICAgICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gcmV0dXJuIEBsYXN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gcmV0dXJuIEBmaXJzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIHJldHVybiBAbmV4dCgpXG4gICAgICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIHJldHVybiBAcHJldigpXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee