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
                    count = i.type === 'dir' && 666 || 0;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnR0FBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUV0RSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFQyxzQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsSUFBRCxFQUFNLElBQU4sRUFBVyxJQUFYLEVBQWdCLElBQWhCLEVBQXFCLElBQXJCLEVBQTBCLE1BQTFCLEVBQWlDLEtBQWpDO1FBQ2hCLElBQUMsQ0FBQSxXQUFELEdBQWdCLENBQUMsSUFBRDtRQUVoQixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsTUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7SUFYRDs7MkJBbUJILFVBQUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBRVIsWUFBQTtRQUZjLGtEQUFTO1FBRXZCLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixH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Q0FBQTtZQUNBLFNBQUEsQ0FBVSxLQUFWO0FBQ0EsbUJBSEo7O1FBS0EsSUFBMEIsaUJBQTFCO0FBQUEsbUJBQU8sWUFBUDs7QUFFQSxnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsT0FEVDtBQUMwQix1QkFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVY7QUFEakM7UUFJQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLFdBRFQ7QUFDMEIsMkJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLENBQVg7QUFEakMscUJBRVMsU0FGVDtBQUUwQiwyQkFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWDtBQUZqQyxxQkFHUyxLQUhUO0FBRzBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFIakMscUJBSVMsTUFKVDtBQUkwQiwyQkFBTyxJQUFDLENBQUEsS0FBRCxDQUFBO0FBSmpDLHFCQUtTLE1BTFQ7QUFLMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUxqQyxxQkFNUyxJQU5UO0FBTTBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFOakMsYUFESjs7UUFRQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0E7SUF0Qm9COzs7Ozs7QUF3QjVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHN0b3BFdmVudCwga2Vycm9yLCBzbGFzaCwgdmFsaWQsIGVtcHR5LCBjbGFtcCwga2xvZywga3N0ciwgZWxlbSwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TeW50YXggPSByZXF1aXJlICcuL3N5bnRheCdcblxuY2xhc3MgQXV0b2NvbXBsZXRlXG5cbiAgICBAOiAoQGVkaXRvcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICBAc3BsaXRSZWdFeHAgPSAvXFxzKy9nXG4gICAgXG4gICAgICAgIEBmaWxlQ29tbWFuZHMgPSBbJ2NkJyAnbHMnICdybScgJ2NwJyAnbXYnICdrcmVwJyAnY2F0J11cbiAgICAgICAgQGRpckNvbW1hbmRzICA9IFsnY2QnXVxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5vbiAnaW5zZXJ0JyBAb25JbnNlcnRcbiAgICAgICAgQGVkaXRvci5vbiAnY3Vyc29yJyBAY2xvc2VcbiAgICAgICAgQGVkaXRvci5vbiAnYmx1cicgICBAY2xvc2VcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBkaXJNYXRjaGVzOiAoZGlyLCBkaXJzT25seTpmYWxzZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgIG5vRGlyID0gc2xhc2guZmlsZSBkaXJcbiAgICAgICAgICAgIGRpciA9IHNsYXNoLmRpciBkaXJcbiAgICAgICAgICAgIGlmIG5vdCBkaXIgb3Igbm90IHNsYXNoLmlzRGlyIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ID0gZGlyICBcbiAgICAgICAgICAgICAgICBub1BhcmVudCArPSAnLycgaWYgZGlyXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gbm9EaXJcbiAgICAgICAgICAgICAgICBkaXIgPSAnJ1xuXG4gICAgICAgIGl0ZW1zID0gc2xhc2gubGlzdCBkaXIsIGlnbm9yZUhpZGRlbjpmYWxzZVxuXG4gICAgICAgIGlmIHZhbGlkIGl0ZW1zXG5cbiAgICAgICAgICAgIHJlc3VsdCA9IGl0ZW1zLm1hcCAoaSkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgZGlyc09ubHkgYW5kIGkudHlwZSA9PSAnZmlsZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIG5hbWUgPSBudWxsXG4gICAgICAgICAgICAgICAgaWYgbm9QYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgaS5uYW1lLnN0YXJ0c1dpdGgobm9QYXJlbnQpIHRoZW4gbmFtZSA9IGkubmFtZVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgbm9EaXJcbiAgICAgICAgICAgICAgICAgICAgaWYgaS5uYW1lLnN0YXJ0c1dpdGgobm9EaXIpIHRoZW4gbmFtZSA9IGkubmFtZVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLycgb3IgZW1wdHkoZGlyKSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpLm5hbWVbMF0gPT0gJy4nXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcuJyB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgbmFtZSA9ICcvJytpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLicgdGhlbiBuYW1lID0gJy4vJytpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgbmFtZSA9ICcvJytpLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBuYW1lXG4gICAgICAgICAgICAgICAgICAgIGNvdW50ID0gaS50eXBlPT0nZGlyJyBhbmQgNjY2IG9yIDBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtuYW1lLCBjb3VudDpjb3VudCwgdHlwZTppLnR5cGVdXG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5maWx0ZXIgKGYpIC0+IGZcblxuICAgICAgICAgICAgaWYgZGlyLmVuZHNXaXRoICcuLi8nXG4gICAgICAgICAgICAgICAgaWYgbm90IHNsYXNoLmlzUm9vdCBzbGFzaC5qb2luIHByb2Nlc3MuY3dkKCksIGRpclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy4uJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJycgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICBlbHNlIGlmIGRpciA9PSAnLicgb3IgZGlyLmVuZHNXaXRoKCcvLicpXG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycuLicgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBub0RpciBhbmQgdmFsaWQoZGlyKSBcbiAgICAgICAgICAgICAgICBpZiBub3QgZGlyLmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQudW5zaGlmdCBbJy8nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICByZXN1bHQgPyBbXVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBjbWRNYXRjaGVzOiAod29yZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHBpY2sgPSAob2JqLGNtZCkgLT4gY21kLnN0YXJ0c1dpdGgod29yZCkgYW5kIGNtZC5sZW5ndGggPiB3b3JkLmxlbmd0aFxuICAgICAgICBtdGNocyA9IF8udG9QYWlycyBfLnBpY2tCeSB3aW5kb3cuYnJhaW4uY21kcywgcGlja1xuICAgICAgICBtWzFdLnR5cGUgPSAnY21kJyBmb3IgbSBpbiBtdGNoc1xuICAgICAgICBtdGNoc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBvblRhYjogLT5cbiAgICAgICAgXG4gICAgICAgIG1jICAgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lIG1jWzFdXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgbGluZS50cmltKClcbiAgICAgICAgXG4gICAgICAgIGluZm8gPVxuICAgICAgICAgICAgbGluZTogICBsaW5lXG4gICAgICAgICAgICBiZWZvcmU6IGxpbmVbMC4uLm1jWzBdXVxuICAgICAgICAgICAgYWZ0ZXI6ICBsaW5lW21jWzBdLi5dXG4gICAgICAgICAgICBjdXJzb3I6IG1jXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQHNwYW5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY3VycmVudCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICAgICAgaWYgQGxpc3QgYW5kIGVtcHR5IGN1cnJlbnRcbiAgICAgICAgICAgICAgICBAbmF2aWdhdGUgMVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzdWZmaXggPSAnJ1xuICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgQHNlbGVjdGVkV29yZCgpXG4gICAgICAgICAgICAgICAgaWYgbm90IGN1cnJlbnQuZW5kc1dpdGgoJy8nKSBhbmQgbm90IEBzZWxlY3RlZFdvcmQoKS5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gJy8nXG4gICAgICAgICAgICBrbG9nIFwidGFiICN7QHNlbGVjdGVkV29yZCgpfSB8I3tjdXJyZW50fXwgc3VmZml4ICN7c3VmZml4fVwiXG4gICAgICAgICAgICBAY29tcGxldGUgc3VmZml4OnN1ZmZpeFxuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBvbkluc2VydCBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKEBpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEB3b3JkID0gXy5sYXN0IEBpbmZvLmJlZm9yZS5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAgXG4gICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBmaXJzdENtZCA9IEBpbmZvLmJlZm9yZS5zcGxpdCgnICcpWzBdXG4gICAgICAgIGRpcnNPbmx5ID0gZmlyc3RDbWQgaW4gQGRpckNvbW1hbmRzXG4gICAgICAgIGlmIG5vdCBAd29yZD8ubGVuZ3RoXG4gICAgICAgICAgICBpZiBmaXJzdENtZCBpbiBAZmlsZUNvbW1hbmRzXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyBudWxsIGRpcnNPbmx5OmRpcnNPbmx5XG4gICAgICAgICAgICBpZiBlbXB0eSBAbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBjbWRNYXRjaGVzIEBpbmZvLmJlZm9yZVxuICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGluY2x1ZGVzQ21kcyA9IHRydWVcbiAgICAgICAgICAgIEBtYXRjaGVzID0gQGRpck1hdGNoZXMoQHdvcmQsIGRpcnNPbmx5OmRpcnNPbmx5KS5jb25jYXQgQGNtZE1hdGNoZXMgQGluZm8uYmVmb3JlXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEBtYXRjaGVzXG4gICAgICAgIFxuICAgICAgICBAbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uY291bnQgLSBhWzFdLmNvdW50XG4gICAgICAgICAgICBcbiAgICAgICAgZmlyc3QgPSBAbWF0Y2hlcy5zaGlmdCgpICMgc2VwZXJhdGUgZmlyc3QgbWF0Y2hcbiAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdID09ICcvJ1xuICAgICAgICAgICAgQGluZm8uc3BsaXQgPSBAaW5mby5iZWZvcmUubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aCAtIEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgaWYgMCA8PSBzID0gQHdvcmQubGFzdEluZGV4T2YgJy8nXG4gICAgICAgICAgICAgICAgQGluZm8uc3BsaXQgKz0gcyArIDFcbiAgICAgICAgXG4gICAgICAgIGlmIGluY2x1ZGVzQ21kcyAjIHNob3J0ZW4gY29tbWFuZCBjb21wbGV0aW9uc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdXVxuICAgICAgICAgICAgaWYgZmlyc3RbMV0udHlwZSA9PSAnY21kJ1xuICAgICAgICAgICAgICAgIHNlZW4gPSBbZmlyc3RbMF1bQGluZm8uc3BsaXQuLl1dXG4gICAgICAgICAgICAgICAgZmlyc3RbMF0gPSBmaXJzdFswXVtAaW5mby5iZWZvcmUubGVuZ3RoLi5dXG4gICAgXG4gICAgICAgICAgICBmb3IgbSBpbiBAbWF0Y2hlc1xuICAgICAgICAgICAgICAgIGlmIG1bMV0udHlwZSA9PSAnY21kJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAaW5mby5zcGxpdFxuICAgICAgICAgICAgICAgICAgICAgICAgbVswXSA9IG1bMF1bQGluZm8uc3BsaXQuLl1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBtaSA9IDBcbiAgICAgICAgICAgIHdoaWxlIG1pIDwgQG1hdGNoZXMubGVuZ3RoICMgY3JhcHB5IGR1cGxpY2F0ZSBmaWx0ZXJcbiAgICAgICAgICAgICAgICBpZiBAbWF0Y2hlc1ttaV1bMF0gaW4gc2VlblxuICAgICAgICAgICAgICAgICAgICBAbWF0Y2hlcy5zcGxpY2UgbWksIDFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHNlZW4ucHVzaCBAbWF0Y2hlc1ttaV1bMF1cbiAgICAgICAgICAgICAgICAgICAgbWkrK1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggQHdvcmRcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgIGVsc2UgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBAaW5mby5iZWZvcmVcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2UgQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBmaXJzdFswXS5zdGFydHNXaXRoIHNsYXNoLmZpbGUgQHdvcmRcbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIHNsYXNoLmZpbGUoQHdvcmQpLmxlbmd0aFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF1cbiAgICAgICAgXG4gICAgICAgIEBvcGVuKClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBcIiN7QGluZm8uYmVmb3JlfXwje0Bjb21wbGV0aW9ufXwje0BpbmZvLmFmdGVyfSAje0B3b3JkfVwiXG4gICAgICAgIFxuICAgICAgICBAc3BhbiA9IGVsZW0gJ3NwYW4nIGNsYXNzOidhdXRvY29tcGxldGUtc3BhbidcbiAgICAgICAgQHNwYW4udGV4dENvbnRlbnQgICAgICA9IEBjb21wbGV0aW9uXG4gICAgICAgIEBzcGFuLnN0eWxlLm9wYWNpdHkgICAgPSAxXG4gICAgICAgIEBzcGFuLnN0eWxlLmJhY2tncm91bmQgPSBcIiM0NGFcIlxuICAgICAgICBAc3Bhbi5zdHlsZS5jb2xvciAgICAgID0gXCIjZmZmXCJcbiAgICAgICAgQHNwYW4uc3R5bGUudHJhbnNmb3JtICA9IFwidHJhbnNsYXRleCgje0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqQGVkaXRvci5tYWluQ3Vyc29yKClbMF19cHgpXCJcblxuICAgICAgICBpZiBub3Qgc3BhbkJlZm9yZSA9IEBlZGl0b3Iuc3BhbkJlZm9yZU1haW4oKVxuICAgICAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gc3BhbkluZm8nXG4gICAgICAgIFxuICAgICAgICBzaWJsaW5nID0gc3BhbkJlZm9yZVxuICAgICAgICB3aGlsZSBzaWJsaW5nID0gc2libGluZy5uZXh0U2libGluZ1xuICAgICAgICAgICAgQGNsb25lcy5wdXNoIHNpYmxpbmcuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgICAgIEBjbG9uZWQucHVzaCBzaWJsaW5nXG4gICAgICAgICAgICBcbiAgICAgICAgc3BhbkJlZm9yZS5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkIEBzcGFuXG4gICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkIHRoZW4gYy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgIGZvciBjIGluIEBjbG9uZXMgdGhlbiBAc3Bhbi5pbnNlcnRBZGphY2VudEVsZW1lbnQgJ2FmdGVyZW5kJyBjXG4gICAgICAgICAgICBcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAY29tcGxldGlvbi5sZW5ndGggICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIEBtYXRjaGVzLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHNob3dMaXN0KClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBzaG93TGlzdDogLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBAbWF0Y2hlc1xuICAgICAgICBcbiAgICAgICAgQGxpc3QgPSBlbGVtIGNsYXNzOiAnYXV0b2NvbXBsZXRlLWxpc3QnXG4gICAgICAgIEBsaXN0LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIEB3b3JkLCBzbGFzaC5kaXIoQHdvcmQpXG4gICAgICAgIFxuICAgICAgICBzcGx0ID0gQHdvcmQuc3BsaXQgJy8nXG4gICAgICAgIFxuICAgICAgICBpZiBzcGx0Lmxlbmd0aD4xIGFuZCBub3QgQHdvcmQuZW5kc1dpdGgoJy8nKSBhbmQgQGNvbXBsZXRpb24gIT0gJy8nXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IHNwbHRbLTFdLmxlbmd0aFxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzWzBdWzBdLnN0YXJ0c1dpdGggQHdvcmRcbiAgICAgICAgICAgIEBsaXN0T2Zmc2V0ID0gQHdvcmQubGVuZ3RoXG4gICAgICAgICAgICBcbiAgICAgICAgQGxpc3Quc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7LUBlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqQGxpc3RPZmZzZXR9cHgpXCJcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgbWF0Y2ggaW4gQG1hdGNoZXNcbiAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOidhdXRvY29tcGxldGUtaXRlbScgaW5kZXg6aW5kZXgrK1xuICAgICAgICAgICAgaXRlbS5pbm5lckhUTUwgPSBTeW50YXguc3BhbkZvclRleHRBbmRTeW50YXggbWF0Y2hbMF0sICdzaCdcbiAgICAgICAgICAgIGl0ZW0uY2xhc3NMaXN0LmFkZCBtYXRjaFsxXS50eXBlXG4gICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBpdGVtXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBtYyA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIGFib3ZlID0gbWNbMV0gKyBAbWF0Y2hlcy5sZW5ndGggPj0gQGVkaXRvci5zY3JvbGwuZnVsbExpbmVzXG4gICAgICAgIGlmIGFib3ZlXG4gICAgICAgICAgICBAbGlzdC5jbGFzc0xpc3QuYWRkICdhYm92ZSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYmVsb3cnXG4gICAgICAgICAgICBcbiAgICAgICAgY3Vyc29yID0kICcubWFpbicgQGVkaXRvci52aWV3XG4gICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzID8gW11cbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkID8gW11cbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBAbWF0Y2hlcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZXMgICAgID0gW11cbiAgICAgICAgQGNsb25lZCAgICAgPSBbXVxuICAgICAgICBAXG5cbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBjb21wbGV0ZSB7fVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGNvbXBsZXRlOiAoc3VmZml4OicnKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5wYXN0ZVRleHQgQHNlbGVjdGVkQ29tcGxldGlvbigpICsgc3VmZml4XG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICBpc0xpc3RJdGVtU2VsZWN0ZWQ6IC0+IEBsaXN0IGFuZCBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBzZWxlY3RlZFdvcmQ6IC0+IEB3b3JkK0BzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgIFxuICAgIHNlbGVjdGVkQ29tcGxldGlvbjogLT5cbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgICMga2xvZyAnY29tcGxldGlvbicgQHNlbGVjdGVkICwgQG1hdGNoZXNbQHNlbGVjdGVkXVswXSwgQGxpc3RPZmZzZXRcbiAgICAgICAgICAgIEBtYXRjaGVzW0BzZWxlY3RlZF1bMF0uc2xpY2UgQGxpc3RPZmZzZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaGVzLmxlbmd0aC0xLCBAc2VsZWN0ZWQrZGVsdGFcbiAgICAgICAgXG4gICAgc2VsZWN0OiAoaW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsaXN0Py5jaGlsZHJlblswXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIEBzcGFuLmlubmVySFRNTCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAbW92ZUNsb25lc0J5IEBzcGFuLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LmFkZCAgICAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHByZXY6ICAtPiBAbmF2aWdhdGUgLTEgICAgXG4gICAgbmV4dDogIC0+IEBuYXZpZ2F0ZSAxXG4gICAgbGFzdDogIC0+IEBuYXZpZ2F0ZSBAbWF0Y2hlcy5sZW5ndGggLSBAc2VsZWN0ZWRcbiAgICBmaXJzdDogLT4gQG5hdmlnYXRlIC1JbmZpbml0eVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAY2xvbmVzXG4gICAgICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb21ibyA9PSAndGFiJ1xuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudCAjIHByZXZlbnQgZm9jdXMgY2hhbmdlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCcgaWYgbm90IEBzcGFuP1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNvbWJvIFxuICAgICAgICAgICAgd2hlbiAncmlnaHQnICAgICB0aGVuIHJldHVybiBAY29tcGxldGUge31cbiAgICAgICAgICAgICMgd2hlbiAnYmFja3NwYWNlJyB0aGVuIGtsb2cgJ2JhY2tzcGFjZSEnXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/IFxuICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIHJldHVybiBAbmF2aWdhdGUgKzlcbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSAtOVxuICAgICAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiByZXR1cm4gQGxhc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiByZXR1cm4gQGZpcnN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gcmV0dXJuIEBuZXh0KClcbiAgICAgICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gcmV0dXJuIEBwcmV2KClcbiAgICAgICAgQGNsb3NlKCkgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZVxuIl19
//# sourceURL=../../coffee/editor/autocomplete.coffee