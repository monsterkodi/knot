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

ref = require('kxk'), stopEvent = ref.stopEvent, kerror = ref.kerror, slash = ref.slash, valid = ref.valid, empty = ref.empty, first = ref.first, clamp = ref.clamp, klog = ref.klog, elem = ref.elem, last = ref.last, $ = ref.$, _ = ref._;

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
                this.matches = this.cmdMatches(this.info.before);
            }
        } else {
            includesCmds = true;
            this.matches = this.dirMatches(this.word, {
                dirsOnly: dirsOnly
            }).concat(this.cmdMatches(this.info.before));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx1R0FBQTtJQUFBOzs7QUFRQSxNQUFtRixPQUFBLENBQVEsS0FBUixDQUFuRixFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGlCQUFqRCxFQUF3RCxlQUF4RCxFQUE4RCxlQUE5RCxFQUFvRSxlQUFwRSxFQUEwRSxTQUExRSxFQUE2RTs7QUFFN0UsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztBQUVIO0lBRUMsc0JBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOzs7O1FBRUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFFZixJQUFDLENBQUEsWUFBRCxHQUFnQixDQUFDLElBQUQsRUFBTSxJQUFOLEVBQVcsSUFBWCxFQUFnQixJQUFoQixFQUFxQixJQUFyQixFQUEwQixNQUExQixFQUFpQyxLQUFqQztRQUNoQixJQUFDLENBQUEsV0FBRCxHQUFnQixDQUFDLElBQUQ7UUFFaEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUFvQixJQUFDLENBQUEsUUFBckI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxLQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLE1BQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO0lBWEQ7OzJCQW1CSCxXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTtRQUFBLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixHQUFBLEdBQU0s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Q0FBVSxLQUFWO0FBQ0EsbUJBSEo7O1FBS0EsSUFBMEIsaUJBQTFCO0FBQUEsbUJBQU8sWUFBUDs7QUFFQSxnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsT0FEVDtBQUMwQix1QkFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVY7QUFEakM7UUFHQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLFdBRFQ7QUFDMEIsMkJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLENBQVg7QUFEakMscUJBRVMsU0FGVDtBQUUwQiwyQkFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWDtBQUZqQyxxQkFHUyxLQUhUO0FBRzBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFIakMscUJBSVMsTUFKVDtBQUkwQiwyQkFBTyxJQUFDLENBQUEsS0FBRCxDQUFBO0FBSmpDLHFCQUtTLE1BTFQ7QUFLMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUxqQyxxQkFNUyxJQU5UO0FBTTBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFOakMsYUFESjs7UUFRQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0E7SUFyQm9COzs7Ozs7QUF1QjVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHN0b3BFdmVudCwga2Vycm9yLCBzbGFzaCwgdmFsaWQsIGVtcHR5LCBmaXJzdCwgY2xhbXAsIGtsb2csIGVsZW0sIGxhc3QsICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3ludGF4ID0gcmVxdWlyZSAnLi9zeW50YXgnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHNwbGl0UmVnRXhwID0gL1tcXHNcXFwiXSsvZ1xuICAgIFxuICAgICAgICBAZmlsZUNvbW1hbmRzID0gWydjZCcgJ2xzJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIEBkaXJDb21tYW5kcyAgPSBbJ2NkJ11cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2luc2VydCcgQG9uSW5zZXJ0XG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgQGNsb3NlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgaXRlbXNGb3JEaXI6IChkaXIpIC0+XG4gICAgXG4gICAgICAgIGlmIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgIG5vRGlyID0gc2xhc2guZmlsZSBkaXJcbiAgICAgICAgICAgIGRpciA9IHNsYXNoLmRpciBkaXJcbiAgICAgICAgICAgIGlmIG5vdCBkaXIgb3Igbm90IHNsYXNoLmlzRGlyIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ID0gZGlyICBcbiAgICAgICAgICAgICAgICBub1BhcmVudCArPSAnLycgaWYgZGlyXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gbm9EaXJcbiAgICAgICAgICAgICAgICBkaXIgPSAnJ1xuXG4gICAgICAgIGl0ZW1zOiBzbGFzaC5saXN0IGRpciwgaWdub3JlSGlkZGVuOmZhbHNlXG4gICAgICAgIGRpcjpkaXIgXG4gICAgICAgIG5vRGlyOm5vRGlyIFxuICAgICAgICBub1BhcmVudDpub1BhcmVudFxuICAgIFxuICAgIGRpck1hdGNoZXM6IChkaXIsIGRpcnNPbmx5OmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAge2l0ZW1zLCBkaXIsIG5vRGlyLCBub1BhcmVudH0gPSBAaXRlbXNGb3JEaXIgZGlyXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuXG4gICAgICAgICAgICByZXN1bHQgPSBpdGVtcy5tYXAgKGkpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIGRpcnNPbmx5IGFuZCBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lID0gbnVsbFxuICAgICAgICAgICAgICAgIGlmIG5vUGFyZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vUGFyZW50KSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5vRGlyXG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vRGlyKSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy8nIG9yIGVtcHR5KGRpcikgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaS5uYW1lWzBdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLicgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy4nIHRoZW4gbmFtZSA9ICcuLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbmFtZVxuICAgICAgICAgICAgICAgICAgICBpZiBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IChpLm5hbWVbMF0gPT0gJy4nIGFuZCA2NjYgb3IgMzMzKVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gKGkubmFtZVswXSA9PSAnLicgYW5kIDMzMyBvciA2NjYpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuZmlsdGVyIChmKSAtPiBmXG5cbiAgICAgICAgICAgIGlmIGRpci5lbmRzV2l0aCAnLi4vJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC5pc1Jvb3Qgc2xhc2guam9pbiBwcm9jZXNzLmN3ZCgpLCBkaXJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycuLicgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBkaXIgPT0gJy4nIG9yIGRpci5lbmRzV2l0aCgnLy4nKVxuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLi4nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBub3Qgbm9EaXIgYW5kIHZhbGlkKGRpcikgXG4gICAgICAgICAgICAgICAgaWYgbm90IGRpci5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycvJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgKG5vdCBub0RpcikgYW5kIGRpclstMV0gIT0gJy8nXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gW1snLycgY291bnQ6OTk5IHR5cGU6J2RpciddXVxuICAgICAgICByZXN1bHQgPyBbXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjbWRNYXRjaGVzOiAod29yZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHBpY2sgPSAob2JqLGNtZCkgLT4gY21kLnN0YXJ0c1dpdGgod29yZCkgYW5kIGNtZC5sZW5ndGggPiB3b3JkLmxlbmd0aFxuICAgICAgICBtdGNocyA9IF8udG9QYWlycyBfLnBpY2tCeSB3aW5kb3cuYnJhaW4uY21kcywgcGlja1xuICAgICAgICBtWzFdLnR5cGUgPSAnY21kJyBmb3IgbSBpbiBtdGNoc1xuICAgICAgICBtdGNoc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICAgICAgXG4gICAgb25UYWI6IC0+XG4gICAgICAgIFxuICAgICAgICBbbGluZSwgYmVmb3JlLCBhZnRlcl0gPSBAbGluZUJlZm9yZUFmdGVyKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBsaW5lLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgQHNwYW5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY3VycmVudCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICAgICAgaWYgQGxpc3QgYW5kIGVtcHR5IGN1cnJlbnRcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGUgMVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdWZmaXggPSAnJ1xuICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgQHNlbGVjdGVkV29yZCgpXG4gICAgICAgICAgICAgICAgaWYgbm90IGN1cnJlbnQuZW5kc1dpdGgoJy8nKSBhbmQgbm90IEBzZWxlY3RlZFdvcmQoKS5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9ICcvJ1xuICAgICAgICAgICAgIyBrbG9nIFwidGFiICN7QHNlbGVjdGVkV29yZCgpfSB8I3tjdXJyZW50fXwgc3VmZml4ICN7c3VmZml4fVwiXG4gICAgICAgICAgICBAY29tcGxldGUgc3VmZml4OnN1ZmZpeFxuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAb25JbnNlcnRcbiAgICAgICAgICAgICAgICB0YWI6ICAgIHRydWVcbiAgICAgICAgICAgICAgICBsaW5lOiAgIGxpbmVcbiAgICAgICAgICAgICAgICBiZWZvcmU6IGJlZm9yZVxuICAgICAgICAgICAgICAgIGFmdGVyOiAgYWZ0ZXJcbiAgICAgICAgICAgICAgICBjdXJzb3I6IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKGluZm8pID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgaW5mby5iZWZvcmVbLTFdIGluICdcIlxcJydcbiAgICAgICAgcmV0dXJuIGlmIGluZm8uYWZ0ZXJbMF0gYW5kIGluZm8uYWZ0ZXJbMF0gbm90IGluICdcIidcbiAgICAgICAgXG4gICAgICAgIGlmIGluZm8uYmVmb3JlWy0xXSA9PSAnICcgYW5kIGluZm8uYmVmb3JlWy0yXSBub3QgaW4gWydcIlxcJyAnXVxuICAgICAgICAgICAgQGhhbmRsZVNwYWNlKClcbiAgICAgICAgXG4gICAgICAgIEBpbmZvID0gaW5mb1xuICAgICAgICBcbiAgICAgICAgc3RyaW5nT3BlbiA9IEBzdHJpbmdPcGVuQ29sIEBpbmZvLmJlZm9yZVxuICAgICAgICBpZiBzdHJpbmdPcGVuID49IDBcbiAgICAgICAgICAgIEB3b3JkID0gQGluZm8uYmVmb3JlLnNsaWNlIHN0cmluZ09wZW4rMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAd29yZCA9IF8ubGFzdCBAaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIFxuICAgICAgICBAaW5mby5zcGxpdCA9IEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgZmlyc3RDbWQgPSBAaW5mby5iZWZvcmUuc3BsaXQoJyAnKVswXVxuICAgICAgICBkaXJzT25seSA9IGZpcnN0Q21kIGluIEBkaXJDb21tYW5kc1xuICAgICAgICBpZiBub3QgQHdvcmQ/Lmxlbmd0aFxuICAgICAgICAgICAgaWYgZmlyc3RDbWQgaW4gQGZpbGVDb21tYW5kc1xuICAgICAgICAgICAgICAgIEBtYXRjaGVzID0gQGRpck1hdGNoZXMgbnVsbCBkaXJzT25seTpkaXJzT25seVxuICAgICAgICAgICAgaWYgZW1wdHkgQG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpbmNsdWRlc0NtZHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAY21kTWF0Y2hlcyBAaW5mby5iZWZvcmVcbiAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmNsdWRlc0NtZHMgPSB0cnVlXG4gICAgICAgICAgICBAbWF0Y2hlcyA9IEBkaXJNYXRjaGVzKEB3b3JkLCBkaXJzT25seTpkaXJzT25seSkuY29uY2F0IEBjbWRNYXRjaGVzIEBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IEBtYXRjaGVzIFxuICAgICAgICAgICAgaWYgQGluZm8udGFiIHRoZW4gQGNsb3NlU3RyaW5nIHN0cmluZ09wZW5cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQG1hdGNoZXMuc29ydCAoYSxiKSAtPiBiWzFdLmNvdW50IC0gYVsxXS5jb3VudFxuICAgICAgICAgICAgXG4gICAgICAgIGZpcnN0ID0gQG1hdGNoZXMuc2hpZnQoKSAjIHNlcGVyYXRlIGZpcnN0IG1hdGNoXG4gICAgICAgIFxuICAgICAgICBpZiBmaXJzdFswXSA9PSAnLydcbiAgICAgICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaW5mby5zcGxpdCA9IEBpbmZvLmJlZm9yZS5sZW5ndGggLSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgIGlmIDAgPD0gcyA9IEB3b3JkLmxhc3RJbmRleE9mICcvJ1xuICAgICAgICAgICAgICAgIEBpbmZvLnNwbGl0ICs9IHMgKyAxXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGluY2x1ZGVzQ21kc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdXSBcbiAgICAgICAgICAgIGlmIGZpcnN0WzFdLnR5cGUgPT0gJ2NtZCcgIyBzaG9ydGVuIGNvbW1hbmQgY29tcGxldGlvbnNcbiAgICAgICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdW0BpbmZvLnNwbGl0Li5dXVxuICAgICAgICAgICAgICAgIGZpcnN0WzBdID0gZmlyc3RbMF1bQGluZm8uYmVmb3JlLmxlbmd0aC4uXVxuICAgIFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpZiBtWzFdLnR5cGUgPT0gJ2NtZCcgIyBzaG9ydGVuIGNvbW1hbmQgbGlzdCBpdGVtc1xuICAgICAgICAgICAgICAgICAgICBpZiBAaW5mby5zcGxpdFxuICAgICAgICAgICAgICAgICAgICAgICAgbVswXSA9IG1bMF1bQGluZm8uc3BsaXQuLl1cbiAgICAgICAgICAgIG1pID0gMFxuICAgICAgICAgICAgd2hpbGUgbWkgPCBAbWF0Y2hlcy5sZW5ndGggIyBjcmFwcHkgZHVwbGljYXRlIGZpbHRlclxuICAgICAgICAgICAgICAgIGlmIEBtYXRjaGVzW21pXVswXSBpbiBzZWVuXG4gICAgICAgICAgICAgICAgICAgIEBtYXRjaGVzLnNwbGljZSBtaSwgMVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgc2Vlbi5wdXNoIEBtYXRjaGVzW21pXVswXVxuICAgICAgICAgICAgICAgICAgICBtaSsrXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBAd29yZFxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAd29yZC5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBmaXJzdFswXS5zdGFydHNXaXRoIEBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggc2xhc2guZmlsZSBAd29yZFxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2Ugc2xhc2guZmlsZShAd29yZCkubGVuZ3RoXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXVxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoZXMubGVuZ3RoID09IDAgYW5kIGVtcHR5IEBjb21wbGV0aW9uXG4gICAgICAgICAgICBpZiBpbmZvLnRhYiB0aGVuIEBjbG9zZVN0cmluZyBzdHJpbmdPcGVuXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQG9wZW4oKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBvcGVuOiAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIFwiI3tAaW5mby5iZWZvcmV9fCN7QGNvbXBsZXRpb259fCN7QGluZm8uYWZ0ZXJ9ICN7QHdvcmR9XCJcbiAgICAgICAgXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6J2F1dG9jb21wbGV0ZS1zcGFuJ1xuICAgICAgICBAc3Bhbi50ZXh0Q29udGVudCAgICAgID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuICAgICAgICBAc3Bhbi5zdHlsZS50cmFuc2Zvcm0gID0gXCJ0cmFuc2xhdGV4KCN7QGVkaXRvci5zaXplLmNoYXJXaWR0aCpAZWRpdG9yLm1haW5DdXJzb3IoKVswXX1weClcIlxuXG4gICAgICAgIGlmIG5vdCBzcGFuQmVmb3JlID0gQGVkaXRvci5zcGFuQmVmb3JlTWFpbigpXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBzcGFuSW5mbydcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcGFuQmVmb3JlXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcGFuQmVmb3JlLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWQgdGhlbiBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyB0aGVuIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNob3dMaXN0OiAtPlxuICAgICAgICBcbiAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWxpc3QnXG4gICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBcbiAgICAgICAgc3BsdCA9IEB3b3JkLnNwbGl0ICcvJ1xuICAgICAgICBcbiAgICAgICAgaWYgc3BsdC5sZW5ndGg+MSBhbmQgbm90IEB3b3JkLmVuZHNXaXRoKCcvJykgYW5kIEBjb21wbGV0aW9uICE9ICcvJ1xuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBzcGx0Wy0xXS5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlc1swXVswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgIEBsaXN0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgjey1AZWRpdG9yLnNpemUuY2hhcldpZHRoKkBsaXN0T2Zmc2V0LTEwfXB4KVwiXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIG1hdGNoIGluIEBtYXRjaGVzXG4gICAgICAgICAgICBpdGVtID0gZWxlbSBjbGFzczonYXV0b2NvbXBsZXRlLWl0ZW0nIGluZGV4OmluZGV4KytcbiAgICAgICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IG1hdGNoWzBdLCAnc2gnXG4gICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQgbWF0Y2hbMV0udHlwZVxuICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBcbiAgICAgICAgbGluZXNCZWxvdyA9IE1hdGgubWF4KEBlZGl0b3Iuc2Nyb2xsLmJvdCwgQGVkaXRvci5zY3JvbGwudmlld0xpbmVzKSAtIG1jWzFdIC0gM1xuICAgICAgICBsaW5lc0Fib3ZlID0gbWNbMV0gLSBAZWRpdG9yLnNjcm9sbC50b3AgIC0gM1xuICAgICAgICBcbiAgICAgICAgYWJvdmUgPSBsaW5lc0Fib3ZlID4gbGluZXNCZWxvdyBhbmQgbGluZXNCZWxvdyA8IE1hdGgubWluIDcsIEBtYXRjaGVzLmxlbmd0aFxuICAgICAgICBAbGlzdC5jbGFzc0xpc3QuYWRkIGFib3ZlIGFuZCAnYWJvdmUnIG9yICdiZWxvdydcblxuICAgICAgICBAbGlzdC5zdHlsZS5tYXhIZWlnaHQgPSBcIiN7QGVkaXRvci5zY3JvbGwubGluZUhlaWdodCooYWJvdmUgYW5kIGxpbmVzQWJvdmUgb3IgbGluZXNCZWxvdyl9cHhcIlxuICAgICAgICBcbiAgICAgICAgY3Vyc29yID0kICcubWFpbicgQGVkaXRvci52aWV3XG4gICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzID8gW11cbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkID8gW11cbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBAaW5mbyAgICAgICA9IG51bGxcbiAgICAgICAgQGxpc3QgICAgICAgPSBudWxsXG4gICAgICAgIEBzcGFuICAgICAgID0gbnVsbFxuICAgICAgICBAY29tcGxldGlvbiA9IG51bGxcbiAgICAgICAgQG1hdGNoZXMgICAgPSBbXVxuICAgICAgICBAY2xvbmVzICAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgID0gW11cbiAgICAgICAgQFxuXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gZWxlbS51cEF0dHIgZXZlbnQudGFyZ2V0LCAnaW5kZXgnXG4gICAgICAgIGlmIGluZGV4ICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2VsZWN0IGluZGV4XG4gICAgICAgICAgICBAY29tcGxldGUge31cbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICBcblxuICAgIGNsb3NlU3RyaW5nOiAoc3RyaW5nT3BlbikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHN0cmluZ09wZW4gPj0gMFxuICAgICAgICAgICAgaWYgZW1wdHkgQGluZm8uYWZ0ZXJcbiAgICAgICAgICAgICAgICBAZWRpdG9yLnNldElucHV0VGV4dCBAaW5mby5saW5lICsgJ1wiJ1xuICAgICAgICAgICAgZWxzZSBpZiBAaW5mby5hZnRlclswXSA9PSAnXCInXG4gICAgICAgICAgICAgICAgQGVkaXRvci5tb3ZlQ3Vyc29yc1JpZ2h0KCkgIFxuICAgIFxuICAgIGhhbmRsZVNwYWNlOiAtPlxuICAgICAgICBcbiAgICAgICAgW2xpbmUsIGJlZm9yZSwgYWZ0ZXJdID0gQGxpbmVCZWZvcmVBZnRlcigpXG4gICAgICAgIFxuICAgICAgICBtY0NvbCA9IGJlZm9yZS5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIHdoaWxlIGJlZm9yZVstMV0gIT0gJyAnXG4gICAgICAgICAgICBhZnRlciAgPSBiZWZvcmVbLTFdICsgYWZ0ZXJcbiAgICAgICAgICAgIGJlZm9yZSA9IGJlZm9yZVswLi5iZWZvcmUubGVuZ3RoLTJdXG4gICAgICAgIFxuICAgICAgICBpbmRleCA9IEBzdHJpbmdPcGVuQ29sIGJlZm9yZVxuICAgICAgICBpZiBpbmRleCA8IDBcblxuICAgICAgICAgICAgd3JkID0gbGFzdCBiZWZvcmVbLi5iZWZvcmUubGVuZ3RoLTJdLnNwbGl0IC9bXFxzXFxcIl0vXG4gICAgICAgICAgICBwcnQgPSBzbGFzaC5kaXIgd3JkXG4gICAgICAgICAgICB7aXRlbXMsIGRpciwgbm9EaXIsIG5vUGFyZW50fSA9IEBpdGVtc0ZvckRpciBwcnRcblxuICAgICAgICAgICAgcHRoID0gc2xhc2gucmVzb2x2ZSB3cmQrJyAnXG4gICAgICAgICAgICBmb3IgaXRlbSBpbiBpdGVtcyA/IFtdXG4gICAgICAgICAgICAgICAgaWYgaXRlbS5maWxlLnN0YXJ0c1dpdGggcHRoXG4gICAgICAgICAgICAgICAgICAgICMga2xvZyBcIklOU0VSVCBzdHJpbmcgZGVsaW1pdGVycyBhcm91bmQgfCN7d3JkKycgJ318IG1hdGNoaW5nXCIgaXRlbS5maWxlXG4gICAgICAgICAgICAgICAgICAgIG5ld0xpbmUgPSBcIiN7YmVmb3JlLnNsaWNlKDAsYmVmb3JlLmxlbmd0aC13cmQubGVuZ3RoLTEpfVxcXCIje3dyZH0gI3thZnRlcn1cIlxuICAgICAgICAgICAgICAgICAgICBuZXdMaW5lICs9ICdcIicgaWYgbWNDb2wgPT0gbGluZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgbmV3TGluZVxuICAgICAgICAgICAgICAgICAgICBtYyA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgICAgICAgICAgICAgIEBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgW21jQ29sKzEsbWNbMV1dXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICMgZWxzZVxuICAgICAgICAgICAgICAgICAgICAjIGtsb2cgaXRlbS5maWxlXG5cbiAgICAgICAgICAgIGtsb2cgXCJubyBpdGVtcyBtYXRjaCBpbiBkaXIgfCN7ZGlyfXxcIlxuXG4gICAgc3RyaW5nT3BlbkNvbDogKHRleHQpIC0+XG5cbiAgICAgICAgbGFzdENvbCA9IHRleHQubGFzdEluZGV4T2YgJ1wiJ1xuICAgICAgICBpZiBsYXN0Q29sID4gMFxuICAgICAgICAgICAgYmVmb3JlID0gdGV4dFsuLi5sYXN0Q29sXVxuICAgICAgICAgICAgY291bnQgPSBiZWZvcmUuc3BsaXQoJ1wiJykubGVuZ3RoIC0gMVxuICAgICAgICAgICAgaWYgY291bnQgJSAyICE9IDBcbiAgICAgICAgICAgICAgICByZXR1cm4gLTFcbiAgICAgICAgbGFzdENvbFxuICAgICAgICBcbiAgICBsaW5lQmVmb3JlQWZ0ZXI6IC0+IFxuXG4gICAgICAgIG1jICAgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lIG1jWzFdXG4gICAgICAgIFxuICAgICAgICBbbGluZSwgbGluZVswLi4ubWNbMF1dLCBsaW5lW21jWzBdLi5dXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGNvbXBsZXRlOiAoc3VmZml4OicnKSAtPlxuICAgICAgICBcbiAgICAgICAgY29tcGwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IucGFzdGVUZXh0IGNvbXBsICsgc3VmZml4XG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICBpZiBjb21wbC5pbmRleE9mKCcgJykgPj0gMFxuICAgICAgICAgICAgQGhhbmRsZVNwYWNlKClcblxuICAgIGlzTGlzdEl0ZW1TZWxlY3RlZDogLT4gQGxpc3QgYW5kIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHNlbGVjdGVkV29yZDogLT4gQHdvcmQrQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgXG4gICAgc2VsZWN0ZWRDb21wbGV0aW9uOiAtPlxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgIyBrbG9nICdjb21wbGV0aW9uJyBAc2VsZWN0ZWQgLCBAbWF0Y2hlc1tAc2VsZWN0ZWRdWzBdLCBAbGlzdE9mZnNldFxuICAgICAgICAgICAgQG1hdGNoZXNbQHNlbGVjdGVkXVswXS5zbGljZSBAbGlzdE9mZnNldFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY29tcGxldGlvblxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgbmF2aWdhdGU6IChkZWx0YSkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpc3RcbiAgICAgICAgQHNlbGVjdCBjbGFtcCAtMSwgQG1hdGNoZXMubGVuZ3RoLTEsIEBzZWxlY3RlZCtkZWx0YVxuICAgICAgICBcbiAgICBzZWxlY3Q6IChpbmRleCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuICAgICAgICBAc2VsZWN0ZWQgPSBpbmRleFxuICAgICAgICBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxpc3Q/LmNoaWxkcmVuWzBdPy5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKClcbiAgICAgICAgQHNwYW4uaW5uZXJIVE1MID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQHNwYW4uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkIDwgMFxuICAgICAgICBAc3Bhbi5jbGFzc0xpc3QuYWRkICAgICdzZWxlY3RlZCcgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgcHJldjogIC0+IEBuYXZpZ2F0ZSAtMSAgICBcbiAgICBuZXh0OiAgLT4gQG5hdmlnYXRlIDFcbiAgICBsYXN0OiAgLT4gQG5hdmlnYXRlIEBtYXRjaGVzLmxlbmd0aCAtIEBzZWxlY3RlZFxuICAgIGZpcnN0OiAtPiBAbmF2aWdhdGUgLUluZmluaXR5XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgXG5cbiAgICBtb3ZlQ2xvbmVzQnk6IChudW1DaGFycykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHZhbGlkIEBjbG9uZXNcbiAgICAgICAgICAgIGJlZm9yZUxlbmd0aCA9IEBjbG9uZXNbMF0uaW5uZXJIVE1MLmxlbmd0aFxuICAgICAgICAgICAgZm9yIGNpIGluIFsxLi4uQGNsb25lcy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgYyA9IEBjbG9uZXNbY2ldXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VGbG9hdCBAY2xvbmVkW2NpLTFdLnN0eWxlLnRyYW5zZm9ybS5zcGxpdCgndHJhbnNsYXRlWCgnKVsxXVxuICAgICAgICAgICAgICAgIGNoYXJPZmZzZXQgPSBudW1DaGFyc1xuICAgICAgICAgICAgICAgIGNoYXJPZmZzZXQgKz0gYmVmb3JlTGVuZ3RoIGlmIGNpID09IDFcbiAgICAgICAgICAgICAgICBjLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgje29mZnNldCtAZWRpdG9yLnNpemUuY2hhcldpZHRoKmNoYXJPZmZzZXR9cHgpXCJcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwICAgXG5cbiAgICBoYW5kbGVNb2RLZXlDb21ib0V2ZW50OiAobW9kLCBrZXksIGNvbWJvLCBldmVudCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvID09ICd0YWInXG4gICAgICAgICAgICBAb25UYWIoKVxuICAgICAgICAgICAgc3RvcEV2ZW50IGV2ZW50ICMgcHJldmVudCBmb2N1cyBjaGFuZ2VcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQHNwYW4/XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29tYm8gXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgICAgIHRoZW4gcmV0dXJuIEBjb21wbGV0ZSB7fVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0PyBcbiAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiByZXR1cm4gQG5hdmlnYXRlICs5XG4gICAgICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIHJldHVybiBAbmF2aWdhdGUgLTlcbiAgICAgICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gcmV0dXJuIEBsYXN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gcmV0dXJuIEBmaXJzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIHJldHVybiBAbmV4dCgpXG4gICAgICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIHJldHVybiBAcHJldigpXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee