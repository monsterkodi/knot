// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpR0FBQTtJQUFBOzs7QUFRQSxNQUE2RSxPQUFBLENBQVEsS0FBUixDQUE3RSxFQUFFLHlCQUFGLEVBQWEsaUJBQWIsRUFBb0IsaUJBQXBCLEVBQTJCLGlCQUEzQixFQUFrQyxpQkFBbEMsRUFBeUMsaUJBQXpDLEVBQWdELGVBQWhELEVBQXNELGVBQXRELEVBQTRELG1CQUE1RCxFQUFvRSxTQUFwRSxFQUF1RTs7QUFFdkUsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUVIO0lBRUMsc0JBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOzs7O1FBRUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFFZixJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLElBQUQsRUFBTSxJQUFOLEVBQVcsSUFBWCxFQUFnQixJQUFoQixFQUFxQixJQUFyQixFQUEwQixNQUExQixFQUFpQyxLQUFqQztRQUNoQixJQUFDLENBQUEsV0FBRCxHQUFnQixDQUFDLElBQUQ7UUFFaEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUFvQixJQUFDLENBQUEsUUFBckI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxLQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLE1BQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO0lBWEQ7OzJCQW1CSCxXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixHQUFBLEdBQU0sS0FBSyxDQUFDLEdBQU4sQ0FBVSxHQUFWO1lBQ04sSUFBRyxDQUFJLEdBQUosSUFBVyxDQUFJLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWixDQUFsQjtnQkFDSSxRQUFBLEdBQVc7Z0JBQ1gsSUFBbUIsR0FBbkI7b0JBQUEsUUFBQSxJQUFZLElBQVo7O2dCQUNBLFFBQUEsSUFBWTtnQkFDWixHQUFBLEdBQU0sR0FKVjthQUhKOztlQVNBO1lBQUEsS0FBQSxFQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWCxFQUFnQjtnQkFBQSxZQUFBLEVBQWEsS0FBYjthQUFoQixDQUFQO1lBQ0EsR0FBQSxFQUFJLEdBREo7WUFFQSxLQUFBLEVBQU0sS0FGTjtZQUdBLFFBQUEsRUFBUyxRQUhUOztJQVhTOzsyQkFnQmIsVUFBQSxHQUFZLFNBQUMsR0FBRCxFQUFNLElBQU47QUFFUixZQUFBO1FBRmMsbURBQVM7UUFFdkIsT0FBZ0MsSUFBQyxDQUFBLFdBQUQsQ0FBYSxHQUFiLENBQWhDLEVBQUMsa0JBQUQsRUFBUSxjQUFSLEVBQWEsa0JBQWIsRUFBb0I7UUFFcEIsSUFBRyxLQUFBLENBQU0sS0FBTixDQUFIO1lBRUksTUFBQSxHQUFTLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBQyxDQUFEO0FBRWYsb0JBQUE7Z0JBQUEsSUFBVSxRQUFBLElBQWEsQ0FBQyxDQUFDLElBQUYsS0FBVSxNQUFqQztBQUFBLDJCQUFBOztnQkFFQSxJQUFBLEdBQU87Z0JBQ1AsSUFBRyxRQUFIO29CQUNJLElBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFQLENBQWtCLFFBQWxCLENBQUg7d0JBQW9DLElBQUEsR0FBTyxDQUFDLENBQUMsS0FBN0M7cUJBREo7aUJBQUEsTUFFSyxJQUFHLEtBQUg7b0JBQ0QsSUFBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVAsQ0FBa0IsS0FBbEIsQ0FBSDt3QkFBaUMsSUFBQSxHQUFPLENBQUMsQ0FBQyxLQUExQztxQkFEQztpQkFBQSxNQUFBO29CQUdELElBQUcsR0FBSSxVQUFFLENBQUEsQ0FBQSxDQUFOLEtBQVcsR0FBWCxJQUFrQixLQUFBLENBQU0sR0FBTixDQUFyQjt3QkFBcUMsSUFBQSxHQUFPLENBQUMsQ0FBQyxLQUE5QztxQkFBQSxNQUNLLElBQUcsQ0FBQyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQVAsS0FBYSxHQUFoQjt3QkFDRCxJQUFHLEdBQUksVUFBRSxDQUFBLENBQUEsQ0FBTixLQUFXLEdBQWQ7NEJBQXVCLElBQUEsR0FBTyxDQUFDLENBQUMsS0FBaEM7eUJBQUEsTUFBQTs0QkFDdUIsSUFBQSxHQUFPLEdBQUEsR0FBSSxDQUFDLENBQUMsS0FEcEM7eUJBREM7cUJBQUEsTUFBQTt3QkFJRCxJQUFHLEdBQUksVUFBRSxDQUFBLENBQUEsQ0FBTixLQUFXLEdBQWQ7NEJBQXVCLElBQUEsR0FBTyxJQUFBLEdBQUssQ0FBQyxDQUFDLEtBQXJDO3lCQUFBLE1BQUE7NEJBQ3VCLElBQUEsR0FBTyxHQUFBLEdBQUksQ0FBQyxDQUFDLEtBRHBDO3lCQUpDO3FCQUpKOztnQkFXTCxJQUFHLElBQUg7b0JBQ0ksSUFBRyxDQUFDLENBQUMsSUFBRixLQUFVLE1BQWI7d0JBQ0ksS0FBQSxHQUFRLEVBRFo7cUJBQUEsTUFBQTt3QkFHSSxJQUFHLEdBQUksVUFBRSxDQUFBLENBQUEsQ0FBTixLQUFXLEdBQWQ7NEJBQ0ksS0FBQSxHQUFTLENBQUMsQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUFQLEtBQWEsR0FBYixJQUFxQixHQUFyQixJQUE0QixJQUR6Qzt5QkFBQSxNQUFBOzRCQUdJLEtBQUEsR0FBUyxDQUFDLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBUCxLQUFhLEdBQWIsSUFBcUIsR0FBckIsSUFBNEIsSUFIekM7eUJBSEo7O0FBT0EsMkJBQU87d0JBQUMsSUFBRCxFQUFPOzRCQUFBLEtBQUEsRUFBTSxLQUFOOzRCQUFhLElBQUEsRUFBSyxDQUFDLENBQUMsSUFBcEI7eUJBQVA7c0JBUlg7O1lBbEJlLENBQVY7WUE0QlQsTUFBQSxHQUFTLE1BQU0sQ0FBQyxNQUFQLENBQWMsU0FBQyxDQUFEO3VCQUFPO1lBQVAsQ0FBZDtZQUVULElBQUcsR0FBRyxDQUFDLFFBQUosQ0FBYSxLQUFiLENBQUg7Z0JBQ0ksSUFBRyxDQUFJLEtBQUssQ0FBQyxNQUFOLENBQWEsS0FBSyxDQUFDLElBQU4sQ0FBVyxPQUFPLENBQUMsR0FBUixDQUFBLENBQVgsRUFBMEIsR0FBMUIsQ0FBYixDQUFQO29CQUNJLE1BQU0sQ0FBQyxPQUFQLENBQWU7d0JBQUMsSUFBRCxFQUFNOzRCQUFBLEtBQUEsRUFBTSxHQUFOOzRCQUFVLElBQUEsRUFBSyxLQUFmO3lCQUFOO3FCQUFmLEVBREo7O2dCQUVBLE1BQU0sQ0FBQyxPQUFQLENBQWU7b0JBQUMsRUFBRCxFQUFJO3dCQUFBLEtBQUEsRUFBTSxHQUFOO3dCQUFVLElBQUEsRUFBSyxLQUFmO3FCQUFKO2lCQUFmLEVBSEo7YUFBQSxNQUlLLElBQUcsR0FBQSxLQUFPLEdBQVAsSUFBYyxHQUFHLENBQUMsUUFBSixDQUFhLElBQWIsQ0FBakI7Z0JBQ0QsTUFBTSxDQUFDLE9BQVAsQ0FBZTtvQkFBQyxJQUFELEVBQU07d0JBQUEsS0FBQSxFQUFNLEdBQU47d0JBQVUsSUFBQSxFQUFLLEtBQWY7cUJBQU47aUJBQWYsRUFEQzthQUFBLE1BRUEsSUFBRyxDQUFJLEtBQUosSUFBYyxLQUFBLENBQU0sR0FBTixDQUFqQjtnQkFDRCxJQUFHLENBQUksR0FBRyxDQUFDLFFBQUosQ0FBYSxHQUFiLENBQVA7b0JBQ0ksTUFBTSxDQUFDLE9BQVAsQ0FBZTt3QkFBQyxHQUFELEVBQUs7NEJBQUEsS0FBQSxFQUFNLEdBQU47NEJBQVUsSUFBQSxFQUFLLEtBQWY7eUJBQUw7cUJBQWYsRUFESjtpQkFBQSxNQUFBO29CQUdJLE1BQU0sQ0FBQyxPQUFQLENBQWU7d0JBQUMsRUFBRCxFQUFJOzRCQUFBLEtBQUEsRUFBTSxHQUFOOzRCQUFVLElBQUEsRUFBSyxLQUFmO3lCQUFKO3FCQUFmLEVBSEo7aUJBREM7YUF0Q1Q7U0FBQSxNQUFBO1lBNENJLElBQUcsQ0FBQyxDQUFJLEtBQUwsQ0FBQSxJQUFnQixHQUFJLFVBQUUsQ0FBQSxDQUFBLENBQU4sS0FBVyxHQUE5QjtnQkFDSSxNQUFBLEdBQVM7b0JBQUM7d0JBQUMsR0FBRCxFQUFLOzRCQUFBLEtBQUEsRUFBTSxHQUFOOzRCQUFVLElBQUEsRUFBSyxLQUFmO3lCQUFMO3FCQUFEO2tCQURiO2FBNUNKOztnQ0E4Q0EsU0FBUztJQWxERDs7MkJBMERaLFVBQUEsR0FBWSxTQUFBO0FBRVIsWUFBQTtRQUFBLEtBQUEsR0FBUTtRQUVSLElBQUcsSUFBQSxHQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSyxDQUFBLEtBQUssQ0FBQyxLQUFOLENBQVksT0FBTyxDQUFDLEdBQVIsQ0FBQSxDQUFaLENBQUEsQ0FBNUI7QUFDSSxpQkFBQSxXQUFBOztnQkFDSSxJQUFHLEdBQUcsQ0FBQyxVQUFKLENBQWUsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFyQixDQUFBLElBQWlDLEdBQUcsQ0FBQyxNQUFKLEdBQWEsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBOUQ7b0JBQ0ksS0FBSyxDQUFDLElBQU4sQ0FBVzt3QkFBQyxHQUFELEVBQU07NEJBQUEsSUFBQSxFQUFLLEtBQUw7NEJBQVcsS0FBQSxFQUFNLEtBQWpCO3lCQUFOO3FCQUFYLEVBREo7O0FBREosYUFESjs7UUFLQSxJQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQWIsQ0FBcUIsR0FBckIsQ0FBQSxHQUE0QixDQUEvQjtZQUNJLElBQUEsR0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFiLENBQW1CLEdBQW5CO1lBQ1AsR0FBQSxHQUFNLElBQUksQ0FBQyxLQUFMLENBQUE7WUFDTixJQUFHLElBQUEsR0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUssQ0FBQSxHQUFBLENBQTVCO0FBRUk7QUFBQSxxQkFBQSxXQUFBOztvQkFDSSxJQUFHLGFBQVcsSUFBWCxFQUFBLEdBQUEsS0FBSDt3QkFDSSxJQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQWIsQ0FBc0IsR0FBdEIsQ0FBSDs0QkFDSSxLQUFLLENBQUMsSUFBTixDQUFXO2dDQUFDLEdBQUQsRUFBTTtvQ0FBQSxJQUFBLEVBQUssS0FBTDtvQ0FBVyxLQUFBLEVBQU0sS0FBakI7aUNBQU47NkJBQVgsRUFESjt5QkFBQSxNQUFBOzRCQUdJLElBQUcsR0FBRyxDQUFDLFVBQUosQ0FBZSxJQUFDLENBQUEsSUFBaEIsQ0FBQSxJQUEwQixHQUFHLENBQUMsTUFBSixHQUFhLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBaEQ7Z0NBQ0ksS0FBSyxDQUFDLElBQU4sQ0FBVztvQ0FBQyxHQUFJLHdCQUFMLEVBQXNCO3dDQUFBLElBQUEsRUFBSyxLQUFMO3dDQUFXLEtBQUEsRUFBTSxLQUFqQjtxQ0FBdEI7aUNBQVgsRUFESjs2QkFISjt5QkFESjs7QUFESixpQkFGSjthQUhKOztlQVlBO0lBckJROzsyQkE2QlosU0FBQSxHQUFXLFNBQUE7QUFFUCxZQUFBO1FBQUEsS0FBQSxHQUFRO1FBRVIsR0FBQSxHQUFNLEtBQUssQ0FBQyxLQUFOLENBQVksT0FBTyxDQUFDLEdBQVIsQ0FBQSxDQUFaO1FBQ04sSUFBRyxHQUFBLEdBQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFHLENBQUEsR0FBQSxDQUF6QjtBQUNJLGlCQUFBLFVBQUE7O2dCQUNJLEdBQUEsR0FBTSxLQUFLLENBQUMsUUFBTixDQUFlLEdBQWYsRUFBb0IsR0FBcEI7Z0JBQ04sSUFBRyxHQUFJLENBQUEsQ0FBQSxDQUFKLEtBQVEsR0FBWDtvQkFBb0IsR0FBQSxHQUFNLElBQUEsR0FBTyxJQUFqQzs7Z0JBQ0EsSUFBRyxHQUFBLEtBQVksSUFBWixJQUFBLEdBQUEsS0FBaUIsR0FBcEI7b0JBQ0ksS0FBSyxDQUFDLElBQU4sQ0FBVzt3QkFBQyxHQUFELEVBQU07NEJBQUEsSUFBQSxFQUFLLEtBQUw7NEJBQVcsS0FBQSxFQUFNLEtBQWpCO3lCQUFOO3FCQUFYLEVBREo7O0FBSEosYUFESjs7ZUFNQTtJQVhPOzsyQkFtQlgsS0FBQSxHQUFPLFNBQUE7QUFFSCxZQUFBO1FBQUEsT0FBd0IsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUF4QixFQUFDLGNBQUQsRUFBTyxnQkFBUCxFQUFlO1FBRWYsSUFBVSxLQUFBLENBQU0sSUFBSSxDQUFDLElBQUwsQ0FBQSxDQUFOLENBQVY7QUFBQSxtQkFBQTs7UUFFQSxJQUFHLElBQUMsQ0FBQSxJQUFKO1lBRUksT0FBQSxHQUFVLElBQUMsQ0FBQSxrQkFBRCxDQUFBO1lBQ1YsSUFBRyxJQUFDLENBQUEsSUFBRCxJQUFVLEtBQUEsQ0FBTSxPQUFOLENBQWI7Z0JBQ0ksSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFWLEVBREo7O1lBR0EsTUFBQSxHQUFTO1lBQ1QsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLElBQUMsQ0FBQSxZQUFELENBQUEsQ0FBWixDQUFIO2dCQUNJLElBQUcsQ0FBSSxPQUFPLENBQUMsUUFBUixDQUFpQixHQUFqQixDQUFKLElBQThCLENBQUksSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFlLENBQUMsUUFBaEIsQ0FBeUIsR0FBekIsQ0FBckM7b0JBQ0ksTUFBQSxHQUFTLElBRGI7aUJBREo7O1lBSUEsSUFBQyxDQUFBLFFBQUQsQ0FBVTtnQkFBQSxNQUFBLEVBQU8sTUFBUDthQUFWO21CQUNBLElBQUMsQ0FBQSxLQUFELENBQUEsRUFaSjtTQUFBLE1BQUE7bUJBZUksSUFBQyxDQUFBLFFBQUQsQ0FDSTtnQkFBQSxHQUFBLEVBQVEsSUFBUjtnQkFDQSxJQUFBLEVBQVEsSUFEUjtnQkFFQSxNQUFBLEVBQVEsTUFGUjtnQkFHQSxLQUFBLEVBQVEsS0FIUjtnQkFJQSxNQUFBLEVBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FKUjthQURKLEVBZko7O0lBTkc7OzJCQWtDUCxRQUFBLEdBQVUsU0FBQyxJQUFEO0FBRU4sWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxXQUFVLElBQUksQ0FBQyxNQUFPLFVBQUUsQ0FBQSxDQUFBLENBQWQsRUFBQSxhQUFtQixLQUFuQixFQUFBLElBQUEsTUFBVjtBQUFBLG1CQUFBOztRQUNBLElBQVUsSUFBSSxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQVgsSUFBa0IsUUFBQSxJQUFJLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBWCxFQUFBLGFBQXFCLEdBQXJCLEVBQUEsSUFBQSxLQUFBLENBQTVCO0FBQUEsbUJBQUE7O1FBRUEsSUFBRyxJQUFJLENBQUMsTUFBTyxVQUFFLENBQUEsQ0FBQSxDQUFkLEtBQW1CLEdBQW5CLElBQTJCLFNBQUEsSUFBSSxDQUFDLE1BQU8sY0FBRSxDQUFBLENBQUEsRUFBZCxLQUF3QixNQUF4QixDQUE5QjtZQUNJLElBQUMsQ0FBQSxXQUFELENBQUEsRUFESjs7UUFHQSxJQUFDLENBQUEsSUFBRCxHQUFRO1FBRVIsVUFBQSxHQUFhLElBQUMsQ0FBQSxhQUFELENBQWUsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFyQjtRQUNiLElBQUcsVUFBQSxJQUFjLENBQWpCO1lBQ0ksSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFiLENBQW1CLFVBQUEsR0FBVyxDQUE5QixFQURaO1NBQUEsTUFBQTtZQUdJLElBQUMsQ0FBQSxJQUFELEdBQVEsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFiLENBQW1CLElBQUMsQ0FBQSxXQUFwQixDQUFQLEVBSFo7O1FBS0EsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLEdBQWMsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDM0IsUUFBQSxHQUFXLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQWIsQ0FBbUIsR0FBbkIsQ0FBd0IsQ0FBQSxDQUFBO1FBQ25DLFFBQUEsR0FBVyxhQUFZLElBQUMsQ0FBQSxXQUFiLEVBQUEsUUFBQTtRQUNYLElBQUcsbUNBQVMsQ0FBRSxnQkFBZDtZQUNJLElBQUcsYUFBWSxJQUFDLENBQUEsWUFBYixFQUFBLFFBQUEsTUFBSDtnQkFDSSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxVQUFELENBQVksSUFBWixFQUFpQjtvQkFBQSxRQUFBLEVBQVMsUUFBVDtpQkFBakIsRUFEZjs7WUFFQSxJQUFHLEtBQUEsQ0FBTSxJQUFDLENBQUEsT0FBUCxDQUFIO2dCQUNJLFlBQUEsR0FBZTtnQkFDZixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxVQUFELENBQUEsRUFGZjthQUhKO1NBQUEsTUFBQTtZQU9JLFlBQUEsR0FBZTtZQUNmLElBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLEtBQWdCLEdBQW5CO2dCQUNJLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFZLENBQUMsTUFBYixDQUFvQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQXBCLEVBRGY7YUFBQSxNQUFBO2dCQUdJLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFDLENBQUEsSUFBYixFQUFtQjtvQkFBQSxRQUFBLEVBQVMsUUFBVDtpQkFBbkIsQ0FBcUMsQ0FBQyxNQUF0QyxDQUE2QyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQTdDLEVBSGY7YUFSSjs7UUFhQSxJQUFHLEtBQUEsQ0FBTSxJQUFDLENBQUEsT0FBUCxDQUFIO1lBQ0ksSUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQVQ7Z0JBQWtCLElBQUMsQ0FBQSxXQUFELENBQWEsVUFBYixFQUFsQjs7QUFDQSxtQkFGSjs7UUFJQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxTQUFDLENBQUQsRUFBRyxDQUFIO21CQUFTLENBQUUsQ0FBQSxDQUFBLENBQUUsQ0FBQyxLQUFMLEdBQWEsQ0FBRSxDQUFBLENBQUEsQ0FBRSxDQUFDO1FBQTNCLENBQWQ7UUFFQSxLQUFBLEdBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULENBQUE7UUFFUixJQUFHLEtBQU0sQ0FBQSxDQUFBLENBQU4sS0FBWSxHQUFmO1lBQ0ksSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLEdBQWMsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsT0FEL0I7U0FBQSxNQUFBO1lBR0ksSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLEdBQWMsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBYixHQUFzQixJQUFDLENBQUEsSUFBSSxDQUFDO1lBQzFDLElBQUcsQ0FBQSxJQUFLLENBQUEsQ0FBQSxHQUFJLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixHQUFsQixDQUFKLENBQVI7Z0JBQ0ksSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLElBQWUsQ0FBQSxHQUFJLEVBRHZCO2FBSko7O1FBT0EsSUFBRyxZQUFIO1lBRUksSUFBQSxHQUFPLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBUDtZQUNQLElBQUcsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQVQsS0FBaUIsS0FBcEI7Z0JBQ0ksSUFBQSxHQUFPLENBQUMsS0FBTSxDQUFBLENBQUEsQ0FBRyx1QkFBVjtnQkFDUCxLQUFNLENBQUEsQ0FBQSxDQUFOLEdBQVcsS0FBTSxDQUFBLENBQUEsQ0FBRyxnQ0FGeEI7O0FBSUE7QUFBQSxpQkFBQSxzQ0FBQTs7Z0JBQ0ksSUFBRyxDQUFFLENBQUEsQ0FBQSxDQUFFLENBQUMsSUFBTCxLQUFhLEtBQWhCO29CQUNJLElBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFUO3dCQUNJLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBTyxDQUFFLENBQUEsQ0FBQSxDQUFHLHdCQURoQjtxQkFESjs7QUFESjtZQUlBLEVBQUEsR0FBSztBQUNMLG1CQUFNLEVBQUEsR0FBSyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQXBCO2dCQUNJLFdBQUcsSUFBQyxDQUFBLE9BQVEsQ0FBQSxFQUFBLENBQUksQ0FBQSxDQUFBLENBQWIsRUFBQSxhQUFtQixJQUFuQixFQUFBLElBQUEsTUFBSDtvQkFDSSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBZ0IsRUFBaEIsRUFBb0IsQ0FBcEIsRUFESjtpQkFBQSxNQUFBO29CQUdJLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLE9BQVEsQ0FBQSxFQUFBLENBQUksQ0FBQSxDQUFBLENBQXZCO29CQUNBLEVBQUEsR0FKSjs7WUFESixDQVpKOztRQW1CQSxJQUFHLEtBQU0sQ0FBQSxDQUFBLENBQUUsQ0FBQyxVQUFULENBQW9CLElBQUMsQ0FBQSxJQUFyQixDQUFIO1lBQ0ksSUFBQyxDQUFBLFVBQUQsR0FBYyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBVCxDQUFlLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBckIsRUFEbEI7U0FBQSxNQUVLLElBQUcsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLFVBQVQsQ0FBb0IsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUExQixDQUFIO1lBQ0QsSUFBQyxDQUFBLFVBQUQsR0FBYyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBVCxDQUFlLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQTVCLEVBRGI7U0FBQSxNQUFBO1lBR0QsSUFBRyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsVUFBVCxDQUFvQixLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxJQUFaLENBQXBCLENBQUg7Z0JBQ0ksSUFBQyxDQUFBLFVBQUQsR0FBYyxLQUFNLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBVCxDQUFlLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBQyxDQUFBLElBQVosQ0FBaUIsQ0FBQyxNQUFqQyxFQURsQjthQUFBLE1BQUE7Z0JBR0ksSUFBQyxDQUFBLFVBQUQsR0FBYyxLQUFNLENBQUEsQ0FBQSxFQUh4QjthQUhDOztRQVFMLElBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEtBQW1CLENBQW5CLElBQXlCLEtBQUEsQ0FBTSxJQUFDLENBQUEsVUFBUCxDQUE1QjtZQUNJLElBQUcsSUFBSSxDQUFDLEdBQVI7Z0JBQWlCLElBQUMsQ0FBQSxXQUFELENBQWEsVUFBYixFQUFqQjs7QUFDQSxtQkFGSjs7ZUFJQSxJQUFDLENBQUEsSUFBRCxDQUFBO0lBbEZNOzsyQkEwRlYsSUFBQSxHQUFNLFNBQUE7QUFJRixZQUFBO1FBQUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFBLENBQUssTUFBTCxFQUFZO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxtQkFBTjtTQUFaO1FBQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLEdBQXlCLElBQUMsQ0FBQTtRQUMxQixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFaLEdBQXlCO1FBQ3pCLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVosR0FBeUI7UUFDekIsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBWixHQUF5QjtRQUN6QixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFaLEdBQXlCLGFBQUEsR0FBYSxDQUFDLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQWIsR0FBdUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBcUIsQ0FBQSxDQUFBLENBQTdDLENBQWIsR0FBNkQ7UUFFdEYsSUFBRyxDQUFJLENBQUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBLENBQWIsQ0FBUDtBQUNJLG1CQUFPLE1BQUEsQ0FBTyxhQUFQLEVBRFg7O1FBR0EsT0FBQSxHQUFVO0FBQ1YsZUFBTSxPQUFBLEdBQVUsT0FBTyxDQUFDLFdBQXhCO1lBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLENBQWEsT0FBTyxDQUFDLFNBQVIsQ0FBa0IsSUFBbEIsQ0FBYjtZQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixDQUFhLE9BQWI7UUFGSjtRQUlBLFVBQVUsQ0FBQyxhQUFhLENBQUMsV0FBekIsQ0FBcUMsSUFBQyxDQUFBLElBQXRDO0FBRUE7QUFBQSxhQUFBLHNDQUFBOztZQUFzQixDQUFDLENBQUMsS0FBSyxDQUFDLE9BQVIsR0FBa0I7QUFBeEM7QUFDQTtBQUFBLGFBQUEsd0NBQUE7O1lBQXNCLElBQUMsQ0FBQSxJQUFJLENBQUMscUJBQU4sQ0FBNEIsVUFBNUIsRUFBdUMsQ0FBdkM7QUFBdEI7UUFFQSxJQUFDLENBQUEsWUFBRCxDQUFjLElBQUMsQ0FBQSxVQUFVLENBQUMsTUFBMUI7UUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBWjttQkFFSSxJQUFDLENBQUEsUUFBRCxDQUFBLEVBRko7O0lBMUJFOzsyQkFvQ04sUUFBQSxHQUFVLFNBQUE7QUFFTixZQUFBO1FBQUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLG1CQUFQO1NBQUw7UUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLFdBQXZCLEVBQW1DLElBQUMsQ0FBQSxXQUFwQztRQUNBLElBQUMsQ0FBQSxVQUFELEdBQWM7UUFFZCxJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLENBQVksR0FBWjtRQUVQLElBQUcsSUFBSSxDQUFDLE1BQUwsR0FBWSxDQUFaLElBQWtCLENBQUksSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFOLENBQWUsR0FBZixDQUF0QixJQUE4QyxJQUFDLENBQUEsVUFBRCxLQUFlLEdBQWhFO1lBQ0ksSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFLLFVBQUUsQ0FBQSxDQUFBLENBQUMsQ0FBQyxPQUQzQjtTQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsT0FBUSxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBRSxDQUFDLFVBQWYsQ0FBMEIsSUFBQyxDQUFBLElBQTNCLENBQUg7WUFDRCxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FEbkI7O1FBR0wsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBWixHQUF3QixhQUFBLEdBQWEsQ0FBQyxDQUFDLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQWQsR0FBd0IsSUFBQyxDQUFBLFVBQXpCLEdBQW9DLEVBQXJDLENBQWIsR0FBcUQ7UUFDN0UsS0FBQSxHQUFRO0FBRVI7QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQUEsR0FBTyxJQUFBLENBQUs7Z0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxtQkFBTjtnQkFBMEIsS0FBQSxFQUFNLEtBQUEsRUFBaEM7YUFBTDtZQUNQLElBQUksQ0FBQyxTQUFMLEdBQWlCLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixLQUFNLENBQUEsQ0FBQSxDQUFsQyxFQUFzQyxJQUF0QztZQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsS0FBTSxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQTVCO1lBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQWxCO0FBSko7UUFNQSxFQUFBLEdBQUssSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUE7UUFFTCxVQUFBLEdBQWEsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUF4QixFQUE2QixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUE1QyxDQUFBLEdBQXlELEVBQUcsQ0FBQSxDQUFBLENBQTVELEdBQWlFO1FBQzlFLFVBQUEsR0FBYSxFQUFHLENBQUEsQ0FBQSxDQUFILEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBdkIsR0FBOEI7UUFFM0MsS0FBQSxHQUFRLFVBQUEsR0FBYSxVQUFiLElBQTRCLFVBQUEsR0FBYSxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQXJCO1FBQ2pELElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWhCLENBQW9CLEtBQUEsSUFBVSxPQUFWLElBQXFCLE9BQXpDO1FBRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBWixHQUEwQixDQUFDLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQWYsR0FBMEIsQ0FBQyxLQUFBLElBQVUsVUFBVixJQUF3QixVQUF6QixDQUEzQixDQUFBLEdBQWdFO1FBRTFGLE1BQUEsR0FBUSxDQUFBLENBQUUsT0FBRixFQUFVLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBbEI7ZUFDUixNQUFNLENBQUMsV0FBUCxDQUFtQixJQUFDLENBQUEsSUFBcEI7SUFqQ007OzJCQXlDVixLQUFBLEdBQU8sU0FBQTtBQUVILFlBQUE7UUFBQSxJQUFHLGlCQUFIO1lBQ0ksSUFBQyxDQUFBLElBQUksQ0FBQyxtQkFBTixDQUEwQixPQUExQixFQUFrQyxJQUFDLENBQUEsT0FBbkM7WUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBQSxFQUZKOztBQUlBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxDQUFDLENBQUMsTUFBRixDQUFBO0FBREo7QUFHQTtBQUFBLGFBQUEsd0NBQUE7O1lBQ0ksQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFSLEdBQWtCO0FBRHRCOztnQkFHSyxDQUFFLE1BQVAsQ0FBQTs7UUFDQSxJQUFDLENBQUEsUUFBRCxHQUFjLENBQUM7UUFDZixJQUFDLENBQUEsVUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLElBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxJQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsSUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLFVBQUQsR0FBYztRQUNkLElBQUMsQ0FBQSxPQUFELEdBQWM7UUFDZCxJQUFDLENBQUEsTUFBRCxHQUFjO1FBQ2QsSUFBQyxDQUFBLE1BQUQsR0FBYztlQUNkO0lBdEJHOzsyQkF3QlAsV0FBQSxHQUFhLFNBQUMsS0FBRDtBQUVULFlBQUE7UUFBQSxLQUFBLEdBQVEsSUFBSSxDQUFDLE1BQUwsQ0FBWSxLQUFLLENBQUMsTUFBbEIsRUFBMEIsT0FBMUI7UUFDUixJQUFHLEtBQUg7WUFDSSxJQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7WUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVYsRUFGSjs7ZUFHQSxTQUFBLENBQVUsS0FBVjtJQU5TOzsyQkFjYixXQUFBLEdBQWEsU0FBQyxVQUFEO1FBRVQsSUFBRyxVQUFBLElBQWMsQ0FBakI7WUFDSSxJQUFHLEtBQUEsQ0FBTSxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQVosQ0FBSDt1QkFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLEdBQWEsR0FBbEMsRUFESjthQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQVosS0FBa0IsR0FBckI7dUJBQ0QsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUFBLEVBREM7YUFIVDs7SUFGUzs7MkJBUWIsV0FBQSxHQUFhLFNBQUE7QUFFVCxZQUFBO1FBQUEsT0FBd0IsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUF4QixFQUFDLGNBQUQsRUFBTyxnQkFBUCxFQUFlO1FBRWYsS0FBQSxHQUFRLE1BQU0sQ0FBQztBQUVmLGVBQU0sTUFBTyxVQUFFLENBQUEsQ0FBQSxDQUFULEtBQWMsR0FBcEI7WUFDSSxLQUFBLEdBQVMsTUFBTyxVQUFFLENBQUEsQ0FBQSxDQUFULEdBQWE7WUFDdEIsTUFBQSxHQUFTLE1BQU87UUFGcEI7UUFJQSxLQUFBLEdBQVEsSUFBQyxDQUFBLGFBQUQsQ0FBZSxNQUFmO1FBQ1IsSUFBRyxLQUFBLEdBQVEsQ0FBWDtZQUVJLEdBQUEsR0FBTSxJQUFBLENBQUssTUFBTywwQ0FBa0IsQ0FBQyxLQUExQixDQUFnQyxRQUFoQyxDQUFMO1lBQ04sR0FBQSxHQUFNLEtBQUssQ0FBQyxHQUFOLENBQVUsR0FBVjtZQUNOLE9BQWdDLElBQUMsQ0FBQSxXQUFELENBQWEsR0FBYixDQUFoQyxFQUFDLGtCQUFELEVBQVEsY0FBUixFQUFhLGtCQUFiLEVBQW9CO1lBRXBCLEdBQUEsR0FBTSxLQUFLLENBQUMsT0FBTixDQUFjLEdBQUEsR0FBSSxHQUFsQjtBQUNOO0FBQUEsaUJBQUEsc0NBQUE7O2dCQUNJLElBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFWLENBQXFCLEdBQXJCLENBQUg7b0JBRUksT0FBQSxHQUFZLENBQUMsTUFBTSxDQUFDLEtBQVAsQ0FBYSxDQUFiLEVBQWUsTUFBTSxDQUFDLE1BQVAsR0FBYyxHQUFHLENBQUMsTUFBbEIsR0FBeUIsQ0FBeEMsQ0FBRCxDQUFBLEdBQTRDLElBQTVDLEdBQWdELEdBQWhELEdBQW9ELEdBQXBELEdBQXVEO29CQUNuRSxJQUFrQixLQUFBLEtBQVMsSUFBSSxDQUFDLE1BQWhDO3dCQUFBLE9BQUEsSUFBVyxJQUFYOztvQkFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsT0FBckI7b0JBQ0EsRUFBQSxHQUFLLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBO29CQUNMLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsQ0FBQyxLQUFBLEdBQU0sQ0FBUCxFQUFTLEVBQUcsQ0FBQSxDQUFBLENBQVosQ0FBMUI7QUFDQSwyQkFQSjs7QUFESixhQVBKOztJQVhTOzsyQkE4QmIsYUFBQSxHQUFlLFNBQUMsSUFBRDtBQUVYLFlBQUE7UUFBQSxPQUFBLEdBQVUsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsR0FBakI7UUFDVixJQUFHLE9BQUEsR0FBVSxDQUFiO1lBQ0ksTUFBQSxHQUFTLElBQUs7WUFDZCxLQUFBLEdBQVEsTUFBTSxDQUFDLEtBQVAsQ0FBYSxHQUFiLENBQWlCLENBQUMsTUFBbEIsR0FBMkI7WUFDbkMsSUFBRyxLQUFBLEdBQVEsQ0FBUixLQUFhLENBQWhCO0FBQ0ksdUJBQU8sQ0FBQyxFQURaO2FBSEo7O2VBS0E7SUFSVzs7MkJBVWYsZUFBQSxHQUFpQixTQUFBO0FBRWIsWUFBQTtRQUFBLEVBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQTtRQUNQLElBQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsQ0FBYSxFQUFHLENBQUEsQ0FBQSxDQUFoQjtlQUVQLENBQUMsSUFBRCxFQUFPLElBQUssZ0JBQVosRUFBd0IsSUFBSyxhQUE3QjtJQUxhOzsyQkFhakIsUUFBQSxHQUFVLFNBQUMsSUFBRDtBQUVOLFlBQUE7UUFGTywrQ0FBTztRQUVkLEtBQUEsR0FBUSxJQUFDLENBQUEsa0JBQUQsQ0FBQTtRQUVSLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUixDQUFrQixLQUFBLEdBQVEsTUFBMUI7UUFDQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBRyxLQUFLLENBQUMsT0FBTixDQUFjLEdBQWQsQ0FBQSxJQUFzQixDQUF6QjttQkFDSSxJQUFDLENBQUEsV0FBRCxDQUFBLEVBREo7O0lBUE07OzJCQVVWLGtCQUFBLEdBQW9CLFNBQUE7ZUFBRyxJQUFDLENBQUEsSUFBRCxJQUFVLElBQUMsQ0FBQSxRQUFELElBQWE7SUFBMUI7OzJCQUVwQixZQUFBLEdBQWMsU0FBQTtlQUFHLElBQUMsQ0FBQSxJQUFELEdBQU0sSUFBQyxDQUFBLGtCQUFELENBQUE7SUFBVDs7MkJBRWQsa0JBQUEsR0FBb0IsU0FBQTtRQUNoQixJQUFHLElBQUMsQ0FBQSxRQUFELElBQWEsQ0FBaEI7bUJBRUksSUFBQyxDQUFBLE9BQVEsQ0FBQSxJQUFDLENBQUEsUUFBRCxDQUFXLENBQUEsQ0FBQSxDQUFFLENBQUMsS0FBdkIsQ0FBNkIsSUFBQyxDQUFBLFVBQTlCLEVBRko7U0FBQSxNQUFBO21CQUlJLElBQUMsQ0FBQSxXQUpMOztJQURnQjs7MkJBYXBCLFFBQUEsR0FBVSxTQUFDLEtBQUQ7UUFFTixJQUFVLENBQUksSUFBQyxDQUFBLElBQWY7QUFBQSxtQkFBQTs7ZUFDQSxJQUFDLENBQUEsTUFBRCxDQUFRLEtBQUEsQ0FBTSxDQUFDLENBQVAsRUFBVSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsR0FBZ0IsQ0FBMUIsRUFBNkIsSUFBQyxDQUFBLFFBQUQsR0FBVSxLQUF2QyxDQUFSO0lBSE07OzJCQUtWLE1BQUEsR0FBUSxTQUFDLEtBQUQ7QUFFSixZQUFBOztnQkFBeUIsQ0FBRSxTQUFTLENBQUMsTUFBckMsQ0FBNEMsVUFBNUM7O1FBQ0EsSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUNaLElBQUcsSUFBQyxDQUFBLFFBQUQsSUFBYSxDQUFoQjs7b0JBQzZCLENBQUUsU0FBUyxDQUFDLEdBQXJDLENBQXlDLFVBQXpDOzs7b0JBQ3lCLENBQUUsc0JBQTNCLENBQUE7YUFGSjtTQUFBLE1BQUE7Ozt3QkFJc0IsQ0FBRSxzQkFBcEIsQ0FBQTs7YUFKSjs7UUFLQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0IsSUFBQyxDQUFBLGtCQUFELENBQUE7UUFDbEIsSUFBQyxDQUFBLFlBQUQsQ0FBYyxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUE5QjtRQUNBLElBQXFDLElBQUMsQ0FBQSxRQUFELEdBQVksQ0FBakQ7WUFBQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFoQixDQUF1QixVQUF2QixFQUFBOztRQUNBLElBQXFDLElBQUMsQ0FBQSxRQUFELElBQWEsQ0FBbEQ7bUJBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBaEIsQ0FBdUIsVUFBdkIsRUFBQTs7SUFaSTs7MkJBY1IsSUFBQSxHQUFPLFNBQUE7ZUFBRyxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWDtJQUFIOzsyQkFDUCxJQUFBLEdBQU8sU0FBQTtlQUFHLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBVjtJQUFIOzsyQkFDUCxJQUFBLEdBQU8sU0FBQTtlQUFHLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEdBQWtCLElBQUMsQ0FBQSxRQUE3QjtJQUFIOzsyQkFDUCxLQUFBLEdBQU8sU0FBQTtlQUFHLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxLQUFYO0lBQUg7OzJCQVFQLFlBQUEsR0FBYyxTQUFDLFFBQUQ7QUFFVixZQUFBO1FBQUEsSUFBRyxLQUFBLENBQU0sSUFBQyxDQUFBLE1BQVAsQ0FBSDtZQUNJLFlBQUEsR0FBZSxJQUFDLENBQUEsTUFBTyxDQUFBLENBQUEsQ0FBRSxDQUFDLFNBQVMsQ0FBQztBQUNwQztpQkFBVSxrR0FBVjtnQkFDSSxDQUFBLEdBQUksSUFBQyxDQUFBLE1BQU8sQ0FBQSxFQUFBO2dCQUNaLE1BQUEsR0FBUyxVQUFBLENBQVcsSUFBQyxDQUFBLE1BQU8sQ0FBQSxFQUFBLEdBQUcsQ0FBSCxDQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUE5QixDQUFvQyxhQUFwQyxDQUFtRCxDQUFBLENBQUEsQ0FBOUQ7Z0JBQ1QsVUFBQSxHQUFhO2dCQUNiLElBQThCLEVBQUEsS0FBTSxDQUFwQztvQkFBQSxVQUFBLElBQWMsYUFBZDs7NkJBQ0EsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFSLEdBQW9CLGFBQUEsR0FBYSxDQUFDLE1BQUEsR0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFiLEdBQXVCLFVBQS9CLENBQWIsR0FBdUQ7QUFML0U7MkJBRko7O0lBRlU7OzJCQWlCZCxzQkFBQSxHQUF3QixTQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsS0FBWCxFQUFrQixLQUFsQjtRQUVwQixJQUFHLEtBQUEsS0FBUyxLQUFaO1lBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBQTtZQUNBLFNBQUEsQ0FBVSxLQUFWO0FBQ0EsbUJBSEo7O1FBS0EsSUFBMEIsaUJBQTFCO0FBQUEsbUJBQU8sWUFBUDs7QUFFQSxnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsT0FEVDtBQUMwQix1QkFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVY7QUFEakM7UUFHQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLFdBRFQ7QUFDMEIsMkJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLENBQVg7QUFEakMscUJBRVMsU0FGVDtBQUUwQiwyQkFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWDtBQUZqQyxxQkFHUyxLQUhUO0FBRzBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFIakMscUJBSVMsTUFKVDtBQUkwQiwyQkFBTyxJQUFDLENBQUEsS0FBRCxDQUFBO0FBSmpDLHFCQUtTLE1BTFQ7QUFLMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUxqQyxxQkFNUyxJQU5UO0FBTTBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFOakMsYUFESjs7UUFRQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0E7SUFyQm9COzs7Ozs7QUF1QjVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHN0b3BFdmVudCwgc2xhc2gsIHZhbGlkLCBlbXB0eSwgZmlyc3QsIGNsYW1wLCBlbGVtLCBsYXN0LCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3ludGF4ID0gcmVxdWlyZSAnLi9zeW50YXgnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHNwbGl0UmVnRXhwID0gL1tcXHNcXFwiXSsvZ1xuICAgIFxuICAgICAgICBAZmlsZUNvbW1hbmRzID0gWydjZCcgJ2xzJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIEBkaXJDb21tYW5kcyAgPSBbJ2NkJ11cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2luc2VydCcgQG9uSW5zZXJ0XG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgQGNsb3NlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgaXRlbXNGb3JEaXI6IChkaXIpIC0+XG4gICAgXG4gICAgICAgIGlmIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgIG5vRGlyID0gc2xhc2guZmlsZSBkaXJcbiAgICAgICAgICAgIGRpciA9IHNsYXNoLmRpciBkaXJcbiAgICAgICAgICAgIGlmIG5vdCBkaXIgb3Igbm90IHNsYXNoLmlzRGlyIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ID0gZGlyICBcbiAgICAgICAgICAgICAgICBub1BhcmVudCArPSAnLycgaWYgZGlyXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gbm9EaXJcbiAgICAgICAgICAgICAgICBkaXIgPSAnJ1xuXG4gICAgICAgIGl0ZW1zOiBzbGFzaC5saXN0IGRpciwgaWdub3JlSGlkZGVuOmZhbHNlXG4gICAgICAgIGRpcjpkaXIgXG4gICAgICAgIG5vRGlyOm5vRGlyIFxuICAgICAgICBub1BhcmVudDpub1BhcmVudFxuICAgIFxuICAgIGRpck1hdGNoZXM6IChkaXIsIGRpcnNPbmx5OmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAge2l0ZW1zLCBkaXIsIG5vRGlyLCBub1BhcmVudH0gPSBAaXRlbXNGb3JEaXIgZGlyXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuXG4gICAgICAgICAgICByZXN1bHQgPSBpdGVtcy5tYXAgKGkpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIGRpcnNPbmx5IGFuZCBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lID0gbnVsbFxuICAgICAgICAgICAgICAgIGlmIG5vUGFyZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vUGFyZW50KSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5vRGlyXG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vRGlyKSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy8nIG9yIGVtcHR5KGRpcikgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaS5uYW1lWzBdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLicgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy4nIHRoZW4gbmFtZSA9ICcuLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbmFtZVxuICAgICAgICAgICAgICAgICAgICBpZiBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IChpLm5hbWVbMF0gPT0gJy4nIGFuZCA2NjYgb3IgMzMzKVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gKGkubmFtZVswXSA9PSAnLicgYW5kIDMzMyBvciA2NjYpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuZmlsdGVyIChmKSAtPiBmXG5cbiAgICAgICAgICAgIGlmIGRpci5lbmRzV2l0aCAnLi4vJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC5pc1Jvb3Qgc2xhc2guam9pbiBwcm9jZXNzLmN3ZCgpLCBkaXJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycuLicgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBkaXIgPT0gJy4nIG9yIGRpci5lbmRzV2l0aCgnLy4nKVxuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLi4nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBub3Qgbm9EaXIgYW5kIHZhbGlkKGRpcikgXG4gICAgICAgICAgICAgICAgaWYgbm90IGRpci5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycvJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgKG5vdCBub0RpcikgYW5kIGRpclstMV0gIT0gJy8nXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gW1snLycgY291bnQ6OTk5IHR5cGU6J2RpciddXVxuICAgICAgICByZXN1bHQgPyBbXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjbWRNYXRjaGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgbXRjaHMgPSBbXVxuXG4gICAgICAgIGlmIGNtZHMgPSB3aW5kb3cuYnJhaW4uZGlyc1tzbGFzaC50aWxkZSBwcm9jZXNzLmN3ZCgpXVxuICAgICAgICAgICAgZm9yIGNtZCxjb3VudCBvZiBjbWRzXG4gICAgICAgICAgICAgICAgaWYgY21kLnN0YXJ0c1dpdGgoQGluZm8uYmVmb3JlKSBhbmQgY21kLmxlbmd0aCA+IEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgbXRjaHMucHVzaCBbY21kLCB0eXBlOidjbWQnIGNvdW50OmNvdW50XVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgQGluZm8uYmVmb3JlLmluZGV4T2YoJyAnKSA+IDBcbiAgICAgICAgICAgIHNwbHQgPSBAaW5mby5iZWZvcmUuc3BsaXQgJyAnXG4gICAgICAgICAgICBjbWQgPSBzcGx0LnNoaWZ0KClcbiAgICAgICAgICAgIGlmIGluZm8gPSB3aW5kb3cuYnJhaW4uYXJnc1tjbWRdXG4gICAgICAgICAgICAgICAgIyBrbG9nIEB3b3JkLCBpbmZvLmFyZ3NcbiAgICAgICAgICAgICAgICBmb3IgYXJnLGNvdW50IG9mIGluZm8uYXJnc1xuICAgICAgICAgICAgICAgICAgICBpZiBhcmcgbm90IGluIHNwbHRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIEBpbmZvLmJlZm9yZS5lbmRzV2l0aCAnICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdGNocy5wdXNoIFthcmcsIHR5cGU6J2FyZycgY291bnQ6Y291bnRdXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgYXJnLnN0YXJ0c1dpdGgoQHdvcmQpIGFuZCBhcmcubGVuZ3RoID4gQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG10Y2hzLnB1c2ggW2FyZ1tAd29yZC5sZW5ndGguLl0sIHR5cGU6J2FyZycgY291bnQ6Y291bnRdXG4gICAgICAgIG10Y2hzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY2RNYXRjaGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgbXRjaHMgPSBbXVxuXG4gICAgICAgIHRsZCA9IHNsYXNoLnRpbGRlIHByb2Nlc3MuY3dkKClcbiAgICAgICAgaWYgY2RzID0gd2luZG93LmJyYWluLmNkW3RsZF1cbiAgICAgICAgICAgIGZvciBkaXIsY291bnQgb2YgY2RzXG4gICAgICAgICAgICAgICAgcmVsID0gc2xhc2gucmVsYXRpdmUgZGlyLCB0bGRcbiAgICAgICAgICAgICAgICBpZiByZWxbMF0hPScuJyB0aGVuIHJlbCA9ICcuLycgKyByZWxcbiAgICAgICAgICAgICAgICBpZiByZWwgbm90IGluIFsnLi4nICcuJ11cbiAgICAgICAgICAgICAgICAgICAgbXRjaHMucHVzaCBbcmVsLCB0eXBlOidkaXInIGNvdW50OmNvdW50XVxuICAgICAgICBtdGNoc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAgICAgXG4gICAgb25UYWI6IC0+XG4gICAgICAgIFxuICAgICAgICBbbGluZSwgYmVmb3JlLCBhZnRlcl0gPSBAbGluZUJlZm9yZUFmdGVyKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBsaW5lLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgQHNwYW5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY3VycmVudCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICAgICAgaWYgQGxpc3QgYW5kIGVtcHR5IGN1cnJlbnRcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGUgMVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdWZmaXggPSAnJ1xuICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgQHNlbGVjdGVkV29yZCgpXG4gICAgICAgICAgICAgICAgaWYgbm90IGN1cnJlbnQuZW5kc1dpdGgoJy8nKSBhbmQgbm90IEBzZWxlY3RlZFdvcmQoKS5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9ICcvJ1xuICAgICAgICAgICAgIyBrbG9nIFwidGFiICN7QHNlbGVjdGVkV29yZCgpfSB8I3tjdXJyZW50fXwgc3VmZml4ICN7c3VmZml4fVwiXG4gICAgICAgICAgICBAY29tcGxldGUgc3VmZml4OnN1ZmZpeFxuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAb25JbnNlcnRcbiAgICAgICAgICAgICAgICB0YWI6ICAgIHRydWVcbiAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVcbiAgICAgICAgICAgICAgICBiZWZvcmU6IGJlZm9yZVxuICAgICAgICAgICAgICAgIGFmdGVyOiAgYWZ0ZXJcbiAgICAgICAgICAgICAgICBjdXJzb3I6IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKGluZm8pID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgaW5mby5iZWZvcmVbLTFdIGluICdcIlxcJydcbiAgICAgICAgcmV0dXJuIGlmIGluZm8uYWZ0ZXJbMF0gYW5kIGluZm8uYWZ0ZXJbMF0gbm90IGluICdcIidcbiAgICAgICAgXG4gICAgICAgIGlmIGluZm8uYmVmb3JlWy0xXSA9PSAnICcgYW5kIGluZm8uYmVmb3JlWy0yXSBub3QgaW4gWydcIlxcJyAnXVxuICAgICAgICAgICAgQGhhbmRsZVNwYWNlKClcbiAgICAgICAgXG4gICAgICAgIEBpbmZvID0gaW5mb1xuICAgICAgICBcbiAgICAgICAgc3RyaW5nT3BlbiA9IEBzdHJpbmdPcGVuQ29sIEBpbmZvLmJlZm9yZVxuICAgICAgICBpZiBzdHJpbmdPcGVuID49IDBcbiAgICAgICAgICAgIEB3b3JkID0gQGluZm8uYmVmb3JlLnNsaWNlIHN0cmluZ09wZW4rMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAd29yZCA9IF8ubGFzdCBAaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIFxuICAgICAgICBAaW5mby5zcGxpdCA9IEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgZmlyc3RDbWQgPSBAaW5mby5iZWZvcmUuc3BsaXQoJyAnKVswXVxuICAgICAgICBkaXJzT25seSA9IGZpcnN0Q21kIGluIEBkaXJDb21tYW5kc1xuICAgICAgICBpZiBub3QgQHdvcmQ/Lmxlbmd0aFxuICAgICAgICAgICAgaWYgZmlyc3RDbWQgaW4gQGZpbGVDb21tYW5kc1xuICAgICAgICAgICAgICAgIEBtYXRjaGVzID0gQGRpck1hdGNoZXMgbnVsbCBkaXJzT25seTpkaXJzT25seVxuICAgICAgICAgICAgaWYgZW1wdHkgQG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpbmNsdWRlc0NtZHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAY21kTWF0Y2hlcygpXG4gICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5jbHVkZXNDbWRzID0gdHJ1ZVxuICAgICAgICAgICAgaWYgQGluZm8uYmVmb3JlID09ICcuJ1xuICAgICAgICAgICAgICAgIEBtYXRjaGVzID0gQGNkTWF0Y2hlcygpLmNvbmNhdCBAY21kTWF0Y2hlcygpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyhAd29yZCwgZGlyc09ubHk6ZGlyc09ubHkpLmNvbmNhdCBAY21kTWF0Y2hlcygpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgQG1hdGNoZXMgXG4gICAgICAgICAgICBpZiBAaW5mby50YWIgdGhlbiBAY2xvc2VTdHJpbmcgc3RyaW5nT3BlblxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uY291bnQgLSBhWzFdLmNvdW50XG4gICAgICAgICAgICBcbiAgICAgICAgZmlyc3QgPSBAbWF0Y2hlcy5zaGlmdCgpICMgc2VwZXJhdGUgZmlyc3QgbWF0Y2hcbiAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdID09ICcvJ1xuICAgICAgICAgICAgQGluZm8uc3BsaXQgPSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aCAtIEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgaWYgMCA8PSBzID0gQHdvcmQubGFzdEluZGV4T2YgJy8nXG4gICAgICAgICAgICAgICAgQGluZm8uc3BsaXQgKz0gcyArIDFcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgaW5jbHVkZXNDbWRzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNlZW4gPSBbZmlyc3RbMF1dIFxuICAgICAgICAgICAgaWYgZmlyc3RbMV0udHlwZSA9PSAnY21kJyAjIHNob3J0ZW4gY29tbWFuZCBjb21wbGV0aW9uc1xuICAgICAgICAgICAgICAgIHNlZW4gPSBbZmlyc3RbMF1bQGluZm8uc3BsaXQuLl1dXG4gICAgICAgICAgICAgICAgZmlyc3RbMF0gPSBmaXJzdFswXVtAaW5mby5iZWZvcmUubGVuZ3RoLi5dXG4gICAgXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGlmIG1bMV0udHlwZSA9PSAnY21kJyAjIHNob3J0ZW4gY29tbWFuZCBsaXN0IGl0ZW1zXG4gICAgICAgICAgICAgICAgICAgIGlmIEBpbmZvLnNwbGl0XG4gICAgICAgICAgICAgICAgICAgICAgICBtWzBdID0gbVswXVtAaW5mby5zcGxpdC4uXVxuICAgICAgICAgICAgbWkgPSAwXG4gICAgICAgICAgICB3aGlsZSBtaSA8IEBtYXRjaGVzLmxlbmd0aCAjIGNyYXBweSBkdXBsaWNhdGUgZmlsdGVyXG4gICAgICAgICAgICAgICAgaWYgQG1hdGNoZXNbbWldWzBdIGluIHNlZW5cbiAgICAgICAgICAgICAgICAgICAgQG1hdGNoZXMuc3BsaWNlIG1pLCAxXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBzZWVuLnB1c2ggQG1hdGNoZXNbbWldWzBdXG4gICAgICAgICAgICAgICAgICAgIG1pKytcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBmaXJzdFswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIEB3b3JkLmxlbmd0aFxuICAgICAgICBlbHNlIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggQGluZm8uYmVmb3JlXG4gICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBzbGFzaC5maWxlIEB3b3JkXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBzbGFzaC5maWxlKEB3b3JkKS5sZW5ndGhcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdXG4gICAgICAgIFxuICAgICAgICBpZiBAbWF0Y2hlcy5sZW5ndGggPT0gMCBhbmQgZW1wdHkgQGNvbXBsZXRpb25cbiAgICAgICAgICAgIGlmIGluZm8udGFiIHRoZW4gQGNsb3NlU3RyaW5nIHN0cmluZ09wZW5cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAb3BlbigpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9wZW46IC0+XG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgXCIje0BpbmZvLmJlZm9yZX18I3tAY29tcGxldGlvbn18I3tAaW5mby5hZnRlcn0gI3tAd29yZH1cIlxuICAgICAgICBcbiAgICAgICAgQHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczonYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ICAgICAgPSBAY29tcGxldGlvblxuICAgICAgICBAc3Bhbi5zdHlsZS5vcGFjaXR5ICAgID0gMVxuICAgICAgICBAc3Bhbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNDRhXCJcbiAgICAgICAgQHNwYW4uc3R5bGUuY29sb3IgICAgICA9IFwiI2ZmZlwiXG4gICAgICAgIEBzcGFuLnN0eWxlLnRyYW5zZm9ybSAgPSBcInRyYW5zbGF0ZXgoI3tAZWRpdG9yLnNpemUuY2hhcldpZHRoKkBlZGl0b3IubWFpbkN1cnNvcigpWzBdfXB4KVwiXG5cbiAgICAgICAgaWYgbm90IHNwYW5CZWZvcmUgPSBAZWRpdG9yLnNwYW5CZWZvcmVNYWluKClcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIHNwYW5JbmZvJ1xuICAgICAgICBcbiAgICAgICAgc2libGluZyA9IHNwYW5CZWZvcmVcbiAgICAgICAgd2hpbGUgc2libGluZyA9IHNpYmxpbmcubmV4dFNpYmxpbmdcbiAgICAgICAgICAgIEBjbG9uZXMucHVzaCBzaWJsaW5nLmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICBAY2xvbmVkLnB1c2ggc2libGluZ1xuICAgICAgICAgICAgXG4gICAgICAgIHNwYW5CZWZvcmUucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZCBAc3BhblxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZCB0aGVuIGMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzIHRoZW4gQHNwYW4uaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICdhZnRlcmVuZCcgY1xuICAgICAgICAgICAgXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQGNvbXBsZXRpb24ubGVuZ3RoICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBAbWF0Y2hlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBzaG93TGlzdCgpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc2hvd0xpc3Q6IC0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtbGlzdCdcbiAgICAgICAgQGxpc3QuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25Nb3VzZURvd25cbiAgICAgICAgQGxpc3RPZmZzZXQgPSAwXG4gICAgICAgIFxuICAgICAgICBzcGx0ID0gQHdvcmQuc3BsaXQgJy8nXG4gICAgICAgIFxuICAgICAgICBpZiBzcGx0Lmxlbmd0aD4xIGFuZCBub3QgQHdvcmQuZW5kc1dpdGgoJy8nKSBhbmQgQGNvbXBsZXRpb24gIT0gJy8nXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IHNwbHRbLTFdLmxlbmd0aFxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzWzBdWzBdLnN0YXJ0c1dpdGggQHdvcmRcbiAgICAgICAgICAgIEBsaXN0T2Zmc2V0ID0gQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgQGxpc3Quc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7LUBlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqQGxpc3RPZmZzZXQtMTB9cHgpXCJcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgbWF0Y2ggaW4gQG1hdGNoZXNcbiAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOidhdXRvY29tcGxldGUtaXRlbScgaW5kZXg6aW5kZXgrK1xuICAgICAgICAgICAgaXRlbS5pbm5lckhUTUwgPSBTeW50YXguc3BhbkZvclRleHRBbmRTeW50YXggbWF0Y2hbMF0sICdzaCdcbiAgICAgICAgICAgIGl0ZW0uY2xhc3NMaXN0LmFkZCBtYXRjaFsxXS50eXBlXG4gICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBpdGVtXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBtYyA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIFxuICAgICAgICBsaW5lc0JlbG93ID0gTWF0aC5tYXgoQGVkaXRvci5zY3JvbGwuYm90LCBAZWRpdG9yLnNjcm9sbC52aWV3TGluZXMpIC0gbWNbMV0gLSAzXG4gICAgICAgIGxpbmVzQWJvdmUgPSBtY1sxXSAtIEBlZGl0b3Iuc2Nyb2xsLnRvcCAgLSAzXG4gICAgICAgIFxuICAgICAgICBhYm92ZSA9IGxpbmVzQWJvdmUgPiBsaW5lc0JlbG93IGFuZCBsaW5lc0JlbG93IDwgTWF0aC5taW4gNywgQG1hdGNoZXMubGVuZ3RoXG4gICAgICAgIEBsaXN0LmNsYXNzTGlzdC5hZGQgYWJvdmUgYW5kICdhYm92ZScgb3IgJ2JlbG93J1xuXG4gICAgICAgIEBsaXN0LnN0eWxlLm1heEhlaWdodCA9IFwiI3tAZWRpdG9yLnNjcm9sbC5saW5lSGVpZ2h0KihhYm92ZSBhbmQgbGluZXNBYm92ZSBvciBsaW5lc0JlbG93KX1weFwiXG4gICAgICAgIFxuICAgICAgICBjdXJzb3IgPSQgJy5tYWluJyBAZWRpdG9yLnZpZXdcbiAgICAgICAgY3Vyc29yLmFwcGVuZENoaWxkIEBsaXN0XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBjbG9zZTogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0P1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlRXZlbnRMaXN0ZW5lciAnY2xpY2snIEBvbkNsaWNrXG4gICAgICAgICAgICBAbGlzdC5yZW1vdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXMgPyBbXVxuICAgICAgICAgICAgYy5yZW1vdmUoKVxuXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWQgPyBbXVxuICAgICAgICAgICAgYy5zdHlsZS5kaXNwbGF5ID0gJ2luaXRpYWwnXG4gICAgICAgICAgICBcbiAgICAgICAgQHNwYW4/LnJlbW92ZSgpXG4gICAgICAgIEBzZWxlY3RlZCAgID0gLTFcbiAgICAgICAgQGxpc3RPZmZzZXQgPSAwXG4gICAgICAgIEBpbmZvICAgICAgID0gbnVsbFxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBAbWF0Y2hlcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZXMgICAgID0gW11cbiAgICAgICAgQGNsb25lZCAgICAgPSBbXVxuICAgICAgICBAXG5cbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBjb21wbGV0ZSB7fVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG4gICAgY2xvc2VTdHJpbmc6IChzdHJpbmdPcGVuKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc3RyaW5nT3BlbiA+PSAwXG4gICAgICAgICAgICBpZiBlbXB0eSBAaW5mby5hZnRlclxuICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2V0SW5wdXRUZXh0IEBpbmZvLmxpbmUgKyAnXCInXG4gICAgICAgICAgICBlbHNlIGlmIEBpbmZvLmFmdGVyWzBdID09ICdcIidcbiAgICAgICAgICAgICAgICBAZWRpdG9yLm1vdmVDdXJzb3JzUmlnaHQoKSAgXG4gICAgXG4gICAgaGFuZGxlU3BhY2U6IC0+XG4gICAgICAgIFxuICAgICAgICBbbGluZSwgYmVmb3JlLCBhZnRlcl0gPSBAbGluZUJlZm9yZUFmdGVyKClcbiAgICAgICAgXG4gICAgICAgIG1jQ29sID0gYmVmb3JlLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgd2hpbGUgYmVmb3JlWy0xXSAhPSAnICdcbiAgICAgICAgICAgIGFmdGVyICA9IGJlZm9yZVstMV0gKyBhZnRlclxuICAgICAgICAgICAgYmVmb3JlID0gYmVmb3JlWzAuLmJlZm9yZS5sZW5ndGgtMl1cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gQHN0cmluZ09wZW5Db2wgYmVmb3JlXG4gICAgICAgIGlmIGluZGV4IDwgMFxuXG4gICAgICAgICAgICB3cmQgPSBsYXN0IGJlZm9yZVsuLmJlZm9yZS5sZW5ndGgtMl0uc3BsaXQgL1tcXHNcXFwiXS9cbiAgICAgICAgICAgIHBydCA9IHNsYXNoLmRpciB3cmRcbiAgICAgICAgICAgIHtpdGVtcywgZGlyLCBub0Rpciwgbm9QYXJlbnR9ID0gQGl0ZW1zRm9yRGlyIHBydFxuXG4gICAgICAgICAgICBwdGggPSBzbGFzaC5yZXNvbHZlIHdyZCsnICdcbiAgICAgICAgICAgIGZvciBpdGVtIGluIGl0ZW1zID8gW11cbiAgICAgICAgICAgICAgICBpZiBpdGVtLmZpbGUuc3RhcnRzV2l0aCBwdGhcbiAgICAgICAgICAgICAgICAgICAgIyBrbG9nIFwiSU5TRVJUIHN0cmluZyBkZWxpbWl0ZXJzIGFyb3VuZCB8I3t3cmQrJyAnfXwgbWF0Y2hpbmdcIiBpdGVtLmZpbGVcbiAgICAgICAgICAgICAgICAgICAgbmV3TGluZSA9IFwiI3tiZWZvcmUuc2xpY2UoMCxiZWZvcmUubGVuZ3RoLXdyZC5sZW5ndGgtMSl9XFxcIiN7d3JkfSAje2FmdGVyfVwiXG4gICAgICAgICAgICAgICAgICAgIG5ld0xpbmUgKz0gJ1wiJyBpZiBtY0NvbCA9PSBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBAZWRpdG9yLnNldElucHV0VGV4dCBuZXdMaW5lXG4gICAgICAgICAgICAgICAgICAgIG1jID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdFBvcyBbbWNDb2wrMSxtY1sxXV1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgIyBlbHNlXG4gICAgICAgICAgICAgICAgICAgICMga2xvZyBpdGVtLmZpbGVcblxuICAgIHN0cmluZ09wZW5Db2w6ICh0ZXh0KSAtPlxuXG4gICAgICAgIGxhc3RDb2wgPSB0ZXh0Lmxhc3RJbmRleE9mICdcIidcbiAgICAgICAgaWYgbGFzdENvbCA+IDBcbiAgICAgICAgICAgIGJlZm9yZSA9IHRleHRbLi4ubGFzdENvbF1cbiAgICAgICAgICAgIGNvdW50ID0gYmVmb3JlLnNwbGl0KCdcIicpLmxlbmd0aCAtIDFcbiAgICAgICAgICAgIGlmIGNvdW50ICUgMiAhPSAwXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xXG4gICAgICAgIGxhc3RDb2xcbiAgICAgICAgXG4gICAgbGluZUJlZm9yZUFmdGVyOiAtPiBcblxuICAgICAgICBtYyAgID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZSBtY1sxXVxuICAgICAgICBcbiAgICAgICAgW2xpbmUsIGxpbmVbMC4uLm1jWzBdXSwgbGluZVttY1swXS4uXV1cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBjb21wbGV0ZTogKHN1ZmZpeDonJykgLT5cbiAgICAgICAgXG4gICAgICAgIGNvbXBsID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLnBhc3RlVGV4dCBjb21wbCArIHN1ZmZpeFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgaWYgY29tcGwuaW5kZXhPZignICcpID49IDBcbiAgICAgICAgICAgIEBoYW5kbGVTcGFjZSgpXG5cbiAgICBpc0xpc3RJdGVtU2VsZWN0ZWQ6IC0+IEBsaXN0IGFuZCBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBzZWxlY3RlZFdvcmQ6IC0+IEB3b3JkK0BzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgIFxuICAgIHNlbGVjdGVkQ29tcGxldGlvbjogLT5cbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgICMga2xvZyAnY29tcGxldGlvbicgQHNlbGVjdGVkICwgQG1hdGNoZXNbQHNlbGVjdGVkXVswXSwgQGxpc3RPZmZzZXRcbiAgICAgICAgICAgIEBtYXRjaGVzW0BzZWxlY3RlZF1bMF0uc2xpY2UgQGxpc3RPZmZzZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaGVzLmxlbmd0aC0xLCBAc2VsZWN0ZWQrZGVsdGFcbiAgICAgICAgXG4gICAgc2VsZWN0OiAoaW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsaXN0Py5jaGlsZHJlblswXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIEBzcGFuLmlubmVySFRNTCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAbW92ZUNsb25lc0J5IEBzcGFuLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LmFkZCAgICAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHByZXY6ICAtPiBAbmF2aWdhdGUgLTEgICAgXG4gICAgbmV4dDogIC0+IEBuYXZpZ2F0ZSAxXG4gICAgbGFzdDogIC0+IEBuYXZpZ2F0ZSBAbWF0Y2hlcy5sZW5ndGggLSBAc2VsZWN0ZWRcbiAgICBmaXJzdDogLT4gQG5hdmlnYXRlIC1JbmZpbml0eVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAY2xvbmVzXG4gICAgICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb21ibyA9PSAndGFiJ1xuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudCAjIHByZXZlbnQgZm9jdXMgY2hhbmdlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCcgaWYgbm90IEBzcGFuP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvIFxuICAgICAgICAgICAgd2hlbiAncmlnaHQnICAgICB0aGVuIHJldHVybiBAY29tcGxldGUge31cbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSArOVxuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiByZXR1cm4gQG5hdmlnYXRlIC05XG4gICAgICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIHJldHVybiBAbGFzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIHJldHVybiBAZmlyc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiByZXR1cm4gQG5leHQoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiByZXR1cm4gQHByZXYoKVxuICAgICAgICBAY2xvc2UoKSAgIFxuICAgICAgICAndW5oYW5kbGVkJ1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQXV0b2NvbXBsZXRlXG4iXX0=
//# sourceURL=../../coffee/editor/autocomplete.coffee