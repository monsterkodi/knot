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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpR0FBQTtJQUFBOzs7QUFRQSxNQUE2RSxPQUFBLENBQVEsS0FBUixDQUE3RSxFQUFFLHlCQUFGLEVBQWEsaUJBQWIsRUFBb0IsaUJBQXBCLEVBQTJCLGlCQUEzQixFQUFrQyxpQkFBbEMsRUFBeUMsaUJBQXpDLEVBQWdELGVBQWhELEVBQXNELGVBQXRELEVBQTRELG1CQUE1RCxFQUFvRSxTQUFwRSxFQUF1RTs7QUFFdkUsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUVIO0lBRUMsc0JBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOzs7O1FBRUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFFZixJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLElBQUQsRUFBTSxJQUFOLEVBQVcsSUFBWCxFQUFnQixJQUFoQixFQUFxQixJQUFyQixFQUEwQixNQUExQixFQUFpQyxLQUFqQztRQUNoQixJQUFDLENBQUEsV0FBRCxHQUFnQixDQUFDLElBQUQ7UUFFaEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUFvQixJQUFDLENBQUEsUUFBckI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxLQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLE1BQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO0lBWEQ7OzJCQW1CSCxXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixHQUFBLEdBQU0sS0FBSyxDQUFDLEdB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RCxDQUFVLENBQUMsQ0FBWDtBQUZqQyxxQkFHUyxLQUhUO0FBRzBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFIakMscUJBSVMsTUFKVDtBQUkwQiwyQkFBTyxJQUFDLENBQUEsS0FBRCxDQUFBO0FBSmpDLHFCQUtTLE1BTFQ7QUFLMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUxqQyxxQkFNUyxJQU5UO0FBTTBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFOakMsYUFESjs7UUFRQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0E7SUFyQm9COzs7Ozs7QUF1QjVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHN0b3BFdmVudCwgc2xhc2gsIHZhbGlkLCBlbXB0eSwgZmlyc3QsIGNsYW1wLCBlbGVtLCBsYXN0LCBrZXJyb3IsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3ludGF4ID0gcmVxdWlyZSAnLi9zeW50YXgnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHNwbGl0UmVnRXhwID0gL1tcXHNcXFwiXSsvZ1xuICAgIFxuICAgICAgICBAZmlsZUNvbW1hbmRzID0gWydjZCcgJ2xzJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIEBkaXJDb21tYW5kcyAgPSBbJ2NkJ11cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2luc2VydCcgQG9uSW5zZXJ0XG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgQGNsb3NlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgaXRlbXNGb3JEaXI6IChkaXIpIC0+XG4gICAgXG4gICAgICAgIGlmIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgIG5vRGlyID0gc2xhc2guZmlsZSBkaXJcbiAgICAgICAgICAgIGRpciA9IHNsYXNoLmRpciBkaXJcbiAgICAgICAgICAgIGlmIG5vdCBkaXIgb3Igbm90IHNsYXNoLmlzRGlyIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ID0gZGlyICBcbiAgICAgICAgICAgICAgICBub1BhcmVudCArPSAnLycgaWYgZGlyXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gbm9EaXJcbiAgICAgICAgICAgICAgICBkaXIgPSAnJ1xuXG4gICAgICAgIGl0ZW1zOiBzbGFzaC5saXN0IGRpciwgaWdub3JlSGlkZGVuOmZhbHNlXG4gICAgICAgIGRpcjpkaXIgXG4gICAgICAgIG5vRGlyOm5vRGlyIFxuICAgICAgICBub1BhcmVudDpub1BhcmVudFxuICAgIFxuICAgIGRpck1hdGNoZXM6IChkaXIsIGRpcnNPbmx5OmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAge2l0ZW1zLCBkaXIsIG5vRGlyLCBub1BhcmVudH0gPSBAaXRlbXNGb3JEaXIgZGlyXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuXG4gICAgICAgICAgICByZXN1bHQgPSBpdGVtcy5tYXAgKGkpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIGRpcnNPbmx5IGFuZCBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lID0gbnVsbFxuICAgICAgICAgICAgICAgIGlmIG5vUGFyZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vUGFyZW50KSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5vRGlyXG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vRGlyKSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy8nIG9yIGVtcHR5KGRpcikgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaS5uYW1lWzBdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLicgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy4nIHRoZW4gbmFtZSA9ICcuLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbmFtZVxuICAgICAgICAgICAgICAgICAgICBpZiBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IChpLm5hbWVbMF0gPT0gJy4nIGFuZCA2NjYgb3IgMzMzKVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gKGkubmFtZVswXSA9PSAnLicgYW5kIDMzMyBvciA2NjYpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuZmlsdGVyIChmKSAtPiBmXG5cbiAgICAgICAgICAgIGlmIGRpci5lbmRzV2l0aCAnLi4vJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC5pc1Jvb3Qgc2xhc2guam9pbiBwcm9jZXNzLmN3ZCgpLCBkaXJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycuLicgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBkaXIgPT0gJy4nIG9yIGRpci5lbmRzV2l0aCgnLy4nKVxuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLi4nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBub3Qgbm9EaXIgYW5kIHZhbGlkKGRpcikgXG4gICAgICAgICAgICAgICAgaWYgbm90IGRpci5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycvJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgKG5vdCBub0RpcikgYW5kIGRpclstMV0gIT0gJy8nXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gW1snLycgY291bnQ6OTk5IHR5cGU6J2RpciddXVxuICAgICAgICByZXN1bHQgPyBbXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjbWRNYXRjaGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgbXRjaHMgPSBbXVxuXG4gICAgICAgIGlmIGNtZHMgPSB3aW5kb3cuYnJhaW4uZGlyc1tzbGFzaC50aWxkZSBwcm9jZXNzLmN3ZCgpXVxuICAgICAgICAgICAgZm9yIGNtZCxjb3VudCBvZiBjbWRzXG4gICAgICAgICAgICAgICAgaWYgY21kLnN0YXJ0c1dpdGgoQGluZm8uYmVmb3JlKSBhbmQgY21kLmxlbmd0aCA+IEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgbXRjaHMucHVzaCBbY21kLCB0eXBlOidjbWQnIGNvdW50OmNvdW50XVxuICAgICAgICBtdGNoc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNkTWF0Y2hlczogLT5cbiAgICAgICAgXG4gICAgICAgIG10Y2hzID0gW11cblxuICAgICAgICB0bGQgPSBzbGFzaC50aWxkZSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgIGlmIGNkcyA9IHdpbmRvdy5icmFpbi5jZFt0bGRdXG4gICAgICAgICAgICBmb3IgZGlyLGNvdW50IG9mIGNkc1xuICAgICAgICAgICAgICAgIHJlbCA9IHNsYXNoLnJlbGF0aXZlIGRpciwgdGxkXG4gICAgICAgICAgICAgICAgaWYgcmVsWzBdIT0nLicgdGhlbiByZWwgPSAnLi8nICsgcmVsXG4gICAgICAgICAgICAgICAgaWYgcmVsIG5vdCBpbiBbJy4uJyAnLiddXG4gICAgICAgICAgICAgICAgICAgIG10Y2hzLnB1c2ggW3JlbCwgdHlwZTonZGlyJyBjb3VudDpjb3VudF1cbiAgICAgICAgbXRjaHNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgICAgIFxuICAgIG9uVGFiOiAtPlxuICAgICAgICBcbiAgICAgICAgW2xpbmUsIGJlZm9yZSwgYWZ0ZXJdID0gQGxpbmVCZWZvcmVBZnRlcigpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgbGluZS50cmltKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBzcGFuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGN1cnJlbnQgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgICAgIGlmIEBsaXN0IGFuZCBlbXB0eSBjdXJyZW50XG4gICAgICAgICAgICAgICAgQG5hdmlnYXRlIDFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3VmZml4ID0gJydcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyIEBzZWxlY3RlZFdvcmQoKVxuICAgICAgICAgICAgICAgIGlmIG5vdCBjdXJyZW50LmVuZHNXaXRoKCcvJykgYW5kIG5vdCBAc2VsZWN0ZWRXb3JkKCkuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSAnLydcbiAgICAgICAgICAgICMga2xvZyBcInRhYiAje0BzZWxlY3RlZFdvcmQoKX0gfCN7Y3VycmVudH18IHN1ZmZpeCAje3N1ZmZpeH1cIlxuICAgICAgICAgICAgQGNvbXBsZXRlIHN1ZmZpeDpzdWZmaXhcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG9uSW5zZXJ0XG4gICAgICAgICAgICAgICAgdGFiOiAgICB0cnVlXG4gICAgICAgICAgICAgICAgbGluZTogICBsaW5lXG4gICAgICAgICAgICAgICAgYmVmb3JlOiBiZWZvcmVcbiAgICAgICAgICAgICAgICBhZnRlcjogIGFmdGVyXG4gICAgICAgICAgICAgICAgY3Vyc29yOiBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4gICAgb25JbnNlcnQ6IChpbmZvKSA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGluZm8uYmVmb3JlWy0xXSBpbiAnXCJcXCcnXG4gICAgICAgIHJldHVybiBpZiBpbmZvLmFmdGVyWzBdIGFuZCBpbmZvLmFmdGVyWzBdIG5vdCBpbiAnXCInXG4gICAgICAgIFxuICAgICAgICBpZiBpbmZvLmJlZm9yZVstMV0gPT0gJyAnIGFuZCBpbmZvLmJlZm9yZVstMl0gbm90IGluIFsnXCJcXCcgJ11cbiAgICAgICAgICAgIEBoYW5kbGVTcGFjZSgpXG4gICAgICAgIFxuICAgICAgICBAaW5mbyA9IGluZm9cbiAgICAgICAgXG4gICAgICAgIHN0cmluZ09wZW4gPSBAc3RyaW5nT3BlbkNvbCBAaW5mby5iZWZvcmVcbiAgICAgICAgaWYgc3RyaW5nT3BlbiA+PSAwXG4gICAgICAgICAgICBAd29yZCA9IEBpbmZvLmJlZm9yZS5zbGljZSBzdHJpbmdPcGVuKzFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHdvcmQgPSBfLmxhc3QgQGluZm8uYmVmb3JlLnNwbGl0IEBzcGxpdFJlZ0V4cFxuICAgICAgICBcbiAgICAgICAgQGluZm8uc3BsaXQgPSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGZpcnN0Q21kID0gQGluZm8uYmVmb3JlLnNwbGl0KCcgJylbMF1cbiAgICAgICAgZGlyc09ubHkgPSBmaXJzdENtZCBpbiBAZGlyQ29tbWFuZHNcbiAgICAgICAgaWYgbm90IEB3b3JkPy5sZW5ndGhcbiAgICAgICAgICAgIGlmIGZpcnN0Q21kIGluIEBmaWxlQ29tbWFuZHNcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBkaXJNYXRjaGVzIG51bGwgZGlyc09ubHk6ZGlyc09ubHlcbiAgICAgICAgICAgIGlmIGVtcHR5IEBtYXRjaGVzXG4gICAgICAgICAgICAgICAgaW5jbHVkZXNDbWRzID0gdHJ1ZVxuICAgICAgICAgICAgICAgIEBtYXRjaGVzID0gQGNtZE1hdGNoZXMoKVxuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgIGlmIEBpbmZvLmJlZm9yZSA9PSAnLidcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBjZE1hdGNoZXMoKS5jb25jYXQgQGNtZE1hdGNoZXMoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtYXRjaGVzID0gQGRpck1hdGNoZXMoQHdvcmQsIGRpcnNPbmx5OmRpcnNPbmx5KS5jb25jYXQgQGNtZE1hdGNoZXMoKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IEBtYXRjaGVzIFxuICAgICAgICAgICAgaWYgQGluZm8udGFiIHRoZW4gQGNsb3NlU3RyaW5nIHN0cmluZ09wZW5cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQG1hdGNoZXMuc29ydCAoYSxiKSAtPiBiWzFdLmNvdW50IC0gYVsxXS5jb3VudFxuICAgICAgICAgICAgXG4gICAgICAgIGZpcnN0ID0gQG1hdGNoZXMuc2hpZnQoKSAjIHNlcGVyYXRlIGZpcnN0IG1hdGNoXG4gICAgICAgIFxuICAgICAgICBpZiBmaXJzdFswXSA9PSAnLydcbiAgICAgICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaW5mby5zcGxpdCA9IEBpbmZvLmJlZm9yZS5sZW5ndGggLSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgIGlmIDAgPD0gcyA9IEB3b3JkLmxhc3RJbmRleE9mICcvJ1xuICAgICAgICAgICAgICAgIEBpbmZvLnNwbGl0ICs9IHMgKyAxXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGluY2x1ZGVzQ21kc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdXSBcbiAgICAgICAgICAgIGlmIGZpcnN0WzFdLnR5cGUgPT0gJ2NtZCcgIyBzaG9ydGVuIGNvbW1hbmQgY29tcGxldGlvbnNcbiAgICAgICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdW0BpbmZvLnNwbGl0Li5dXVxuICAgICAgICAgICAgICAgIGZpcnN0WzBdID0gZmlyc3RbMF1bQGluZm8uYmVmb3JlLmxlbmd0aC4uXVxuICAgIFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpZiBtWzFdLnR5cGUgPT0gJ2NtZCcgIyBzaG9ydGVuIGNvbW1hbmQgbGlzdCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICBpZiBAaW5mby5zcGxpdFxuICAgICAgICAgICAgICAgICAgICAgICAgbVswXSA9IG1bMF1bQGluZm8uc3BsaXQuLl1cbiAgICAgICAgICAgIG1pID0gMFxuICAgICAgICAgICAgd2hpbGUgbWkgPCBAbWF0Y2hlcy5sZW5ndGggIyBjcmFwcHkgZHVwbGljYXRlIGZpbHRlclxuICAgICAgICAgICAgICAgIGlmIEBtYXRjaGVzW21pXVswXSBpbiBzZWVuXG4gICAgICAgICAgICAgICAgICAgIEBtYXRjaGVzLnNwbGljZSBtaSwgMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgc2Vlbi5wdXNoIEBtYXRjaGVzW21pXVswXVxuICAgICAgICAgICAgICAgICAgICBtaSsrXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBAd29yZFxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBmaXJzdFswXS5zdGFydHNXaXRoIEBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggc2xhc2guZmlsZSBAd29yZFxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2Ugc2xhc2guZmlsZShAd29yZCkubGVuZ3RoXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXVxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoZXMubGVuZ3RoID09IDAgYW5kIGVtcHR5IEBjb21wbGV0aW9uXG4gICAgICAgICAgICBpZiBpbmZvLnRhYiB0aGVuIEBjbG9zZVN0cmluZyBzdHJpbmdPcGVuXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQG9wZW4oKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBvcGVuOiAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIFwiI3tAaW5mby5iZWZvcmV9fCN7QGNvbXBsZXRpb259fCN7QGluZm8uYWZ0ZXJ9ICN7QHdvcmR9XCJcbiAgICAgICAgXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6J2F1dG9jb21wbGV0ZS1zcGFuJ1xuICAgICAgICBAc3Bhbi50ZXh0Q29udGVudCAgICAgID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuICAgICAgICBAc3Bhbi5zdHlsZS50cmFuc2Zvcm0gID0gXCJ0cmFuc2xhdGV4KCN7QGVkaXRvci5zaXplLmNoYXJXaWR0aCpAZWRpdG9yLm1haW5DdXJzb3IoKVswXX1weClcIlxuXG4gICAgICAgIGlmIG5vdCBzcGFuQmVmb3JlID0gQGVkaXRvci5zcGFuQmVmb3JlTWFpbigpXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBzcGFuSW5mbydcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcGFuQmVmb3JlXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcGFuQmVmb3JlLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWQgdGhlbiBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyB0aGVuIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNob3dMaXN0OiAtPlxuICAgICAgICBcbiAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWxpc3QnXG4gICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBcbiAgICAgICAgc3BsdCA9IEB3b3JkLnNwbGl0ICcvJ1xuICAgICAgICBcbiAgICAgICAgaWYgc3BsdC5sZW5ndGg+MSBhbmQgbm90IEB3b3JkLmVuZHNXaXRoKCcvJykgYW5kIEBjb21wbGV0aW9uICE9ICcvJ1xuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBzcGx0Wy0xXS5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlc1swXVswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgIEBsaXN0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgjey1AZWRpdG9yLnNpemUuY2hhcldpZHRoKkBsaXN0T2Zmc2V0LTEwfXB4KVwiXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIG1hdGNoIGluIEBtYXRjaGVzXG4gICAgICAgICAgICBpdGVtID0gZWxlbSBjbGFzczonYXV0b2NvbXBsZXRlLWl0ZW0nIGluZGV4OmluZGV4KytcbiAgICAgICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IG1hdGNoWzBdLCAnc2gnXG4gICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQgbWF0Y2hbMV0udHlwZVxuICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBcbiAgICAgICAgbGluZXNCZWxvdyA9IE1hdGgubWF4KEBlZGl0b3Iuc2Nyb2xsLmJvdCwgQGVkaXRvci5zY3JvbGwudmlld0xpbmVzKSAtIG1jWzFdIC0gM1xuICAgICAgICBsaW5lc0Fib3ZlID0gbWNbMV0gLSBAZWRpdG9yLnNjcm9sbC50b3AgIC0gM1xuICAgICAgICBcbiAgICAgICAgYWJvdmUgPSBsaW5lc0Fib3ZlID4gbGluZXNCZWxvdyBhbmQgbGluZXNCZWxvdyA8IE1hdGgubWluIDcsIEBtYXRjaGVzLmxlbmd0aFxuICAgICAgICBAbGlzdC5jbGFzc0xpc3QuYWRkIGFib3ZlIGFuZCAnYWJvdmUnIG9yICdiZWxvdydcblxuICAgICAgICBAbGlzdC5zdHlsZS5tYXhIZWlnaHQgPSBcIiN7QGVkaXRvci5zY3JvbGwubGluZUhlaWdodCooYWJvdmUgYW5kIGxpbmVzQWJvdmUgb3IgbGluZXNCZWxvdyl9cHhcIlxuICAgICAgICBcbiAgICAgICAgY3Vyc29yID0kICcubWFpbicgQGVkaXRvci52aWV3XG4gICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzID8gW11cbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkID8gW11cbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBAaW5mbyAgICAgICA9IG51bGxcbiAgICAgICAgQGxpc3QgICAgICAgPSBudWxsXG4gICAgICAgIEBzcGFuICAgICAgID0gbnVsbFxuICAgICAgICBAY29tcGxldGlvbiA9IG51bGxcbiAgICAgICAgQG1hdGNoZXMgICAgPSBbXVxuICAgICAgICBAY2xvbmVzICAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgID0gW11cbiAgICAgICAgQFxuXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gZWxlbS51cEF0dHIgZXZlbnQudGFyZ2V0LCAnaW5kZXgnXG4gICAgICAgIGlmIGluZGV4ICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2VsZWN0IGluZGV4XG4gICAgICAgICAgICBAY29tcGxldGUge31cbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuICAgIGNsb3NlU3RyaW5nOiAoc3RyaW5nT3BlbikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHN0cmluZ09wZW4gPj0gMFxuICAgICAgICAgICAgaWYgZW1wdHkgQGluZm8uYWZ0ZXJcbiAgICAgICAgICAgICAgICBAZWRpdG9yLnNldElucHV0VGV4dCBAaW5mby5saW5lICsgJ1wiJ1xuICAgICAgICAgICAgZWxzZSBpZiBAaW5mby5hZnRlclswXSA9PSAnXCInXG4gICAgICAgICAgICAgICAgQGVkaXRvci5tb3ZlQ3Vyc29yc1JpZ2h0KCkgIFxuICAgIFxuICAgIGhhbmRsZVNwYWNlOiAtPlxuICAgICAgICBcbiAgICAgICAgW2xpbmUsIGJlZm9yZSwgYWZ0ZXJdID0gQGxpbmVCZWZvcmVBZnRlcigpXG4gICAgICAgIFxuICAgICAgICBtY0NvbCA9IGJlZm9yZS5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIGJlZm9yZVstMV0gIT0gJyAnXG4gICAgICAgICAgICBhZnRlciAgPSBiZWZvcmVbLTFdICsgYWZ0ZXJcbiAgICAgICAgICAgIGJlZm9yZSA9IGJlZm9yZVswLi5iZWZvcmUubGVuZ3RoLTJdXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBzdHJpbmdPcGVuQ29sIGJlZm9yZVxuICAgICAgICBpZiBpbmRleCA8IDBcblxuICAgICAgICAgICAgd3JkID0gbGFzdCBiZWZvcmVbLi5iZWZvcmUubGVuZ3RoLTJdLnNwbGl0IC9bXFxzXFxcIl0vXG4gICAgICAgICAgICBwcnQgPSBzbGFzaC5kaXIgd3JkXG4gICAgICAgICAgICB7aXRlbXMsIGRpciwgbm9EaXIsIG5vUGFyZW50fSA9IEBpdGVtc0ZvckRpciBwcnRcblxuICAgICAgICAgICAgcHRoID0gc2xhc2gucmVzb2x2ZSB3cmQrJyAnXG4gICAgICAgICAgICBmb3IgaXRlbSBpbiBpdGVtcyA/IFtdXG4gICAgICAgICAgICAgICAgaWYgaXRlbS5maWxlLnN0YXJ0c1dpdGggcHRoXG4gICAgICAgICAgICAgICAgICAgICMga2xvZyBcIklOU0VSVCBzdHJpbmcgZGVsaW1pdGVycyBhcm91bmQgfCN7d3JkKycgJ318IG1hdGNoaW5nXCIgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIG5ld0xpbmUgPSBcIiN7YmVmb3JlLnNsaWNlKDAsYmVmb3JlLmxlbmd0aC13cmQubGVuZ3RoLTEpfVxcXCIje3dyZH0gI3thZnRlcn1cIlxuICAgICAgICAgICAgICAgICAgICBuZXdMaW5lICs9ICdcIicgaWYgbWNDb2wgPT0gbGluZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgbmV3TGluZVxuICAgICAgICAgICAgICAgICAgICBtYyA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgW21jQ29sKzEsbWNbMV1dXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICMgZWxzZVxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgaXRlbS5maWxlXG5cbiAgICBzdHJpbmdPcGVuQ29sOiAodGV4dCkgLT5cblxuICAgICAgICBsYXN0Q29sID0gdGV4dC5sYXN0SW5kZXhPZiAnXCInXG4gICAgICAgIGlmIGxhc3RDb2wgPiAwXG4gICAgICAgICAgICBiZWZvcmUgPSB0ZXh0Wy4uLmxhc3RDb2xdXG4gICAgICAgICAgICBjb3VudCA9IGJlZm9yZS5zcGxpdCgnXCInKS5sZW5ndGggLSAxXG4gICAgICAgICAgICBpZiBjb3VudCAlIDIgIT0gMFxuICAgICAgICAgICAgICAgIHJldHVybiAtMVxuICAgICAgICBsYXN0Q29sXG4gICAgICAgIFxuICAgIGxpbmVCZWZvcmVBZnRlcjogLT4gXG5cbiAgICAgICAgbWMgICA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmUgbWNbMV1cbiAgICAgICAgXG4gICAgICAgIFtsaW5lLCBsaW5lWzAuLi5tY1swXV0sIGxpbmVbbWNbMF0uLl1dXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY29tcGxldGU6IChzdWZmaXg6JycpIC0+XG4gICAgICAgIFxuICAgICAgICBjb21wbCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5wYXN0ZVRleHQgY29tcGwgKyBzdWZmaXhcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIGlmIGNvbXBsLmluZGV4T2YoJyAnKSA+PSAwXG4gICAgICAgICAgICBAaGFuZGxlU3BhY2UoKVxuXG4gICAgaXNMaXN0SXRlbVNlbGVjdGVkOiAtPiBAbGlzdCBhbmQgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgc2VsZWN0ZWRXb3JkOiAtPiBAd29yZCtAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICBcbiAgICBzZWxlY3RlZENvbXBsZXRpb246IC0+XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICAjIGtsb2cgJ2NvbXBsZXRpb24nIEBzZWxlY3RlZCAsIEBtYXRjaGVzW0BzZWxlY3RlZF1bMF0sIEBsaXN0T2Zmc2V0XG4gICAgICAgICAgICBAbWF0Y2hlc1tAc2VsZWN0ZWRdWzBdLnNsaWNlIEBsaXN0T2Zmc2V0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjb21wbGV0aW9uXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGRlbHRhKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdFxuICAgICAgICBAc2VsZWN0IGNsYW1wIC0xLCBAbWF0Y2hlcy5sZW5ndGgtMSwgQHNlbGVjdGVkK2RlbHRhXG4gICAgICAgIFxuICAgIHNlbGVjdDogKGluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbGlzdD8uY2hpbGRyZW5bMF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAgLT4gQG5hdmlnYXRlIC0xICAgIFxuICAgIG5leHQ6ICAtPiBAbmF2aWdhdGUgMVxuICAgIGxhc3Q6ICAtPiBAbmF2aWdhdGUgQG1hdGNoZXMubGVuZ3RoIC0gQHNlbGVjdGVkXG4gICAgZmlyc3Q6IC0+IEBuYXZpZ2F0ZSAtSW5maW5pdHlcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcblxuICAgIG1vdmVDbG9uZXNCeTogKG51bUNoYXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQGNsb25lc1xuICAgICAgICAgICAgYmVmb3JlTGVuZ3RoID0gQGNsb25lc1swXS5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzEuLi5AY2xvbmVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBjID0gQGNsb25lc1tjaV1cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbY2ktMV0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgICAgICAgICAgY2hhck9mZnNldCA9IG51bUNoYXJzXG4gICAgICAgICAgICAgICAgY2hhck9mZnNldCArPSBiZWZvcmVMZW5ndGggaWYgY2kgPT0gMVxuICAgICAgICAgICAgICAgIGMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7b2Zmc2V0K0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqY2hhck9mZnNldH1weClcIlxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29tYm8gPT0gJ3RhYidcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnQgIyBwcmV2ZW50IGZvY3VzIGNoYW5nZVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnIGlmIG5vdCBAc3Bhbj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ibyBcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAgICAgdGhlbiByZXR1cm4gQGNvbXBsZXRlIHt9XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/IFxuICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIHJldHVybiBAbmF2aWdhdGUgKzlcbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSAtOVxuICAgICAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiByZXR1cm4gQGxhc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiByZXR1cm4gQGZpcnN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gcmV0dXJuIEBuZXh0KClcbiAgICAgICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gcmV0dXJuIEBwcmV2KClcbiAgICAgICAgQGNsb3NlKCkgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZVxuIl19
//# sourceURL=../../coffee/editor/autocomplete.coffee