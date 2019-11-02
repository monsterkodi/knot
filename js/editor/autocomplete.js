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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxnR0FBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUV0RSxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFQyxzQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7UUFFQSxJQUFDLENBQUEsS0FBRCxDQUFBO1FBRUEsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUVmLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsSUFBRCxFQUFNLElBQU4sRUFBVyxJQUFYLEVBQWdCLElBQWhCLEVBQXFCLElBQXJCLEVBQTBCLE1BQTFCLEVBQWlDLEtBQWpDO1FBQ2hCLElBQUMsQ0FBQSxXQUFELEdBQWdCLENBQUMsSUFBRDtRQUVoQixJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxRQUFYLEVBQW9CLElBQUMsQ0FBQSxRQUFyQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLEtBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsTUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7SUFYRDs7MkJBbUJILFVBQUEsR0FBWSxTQUFDLEdBQUQsRUFBTSxHQUFOO0FBRVIsWUFBQTtRQUZjLGtEQUFTO1FBRXZCLElBQUcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBUDtZQUNJLEtBQUEsR0FBUSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7WUFDUixH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QyxLQUFLLENBQUMsU0FBUixHQUFvQixhQUFBLEdBQWEsQ0FBQyxNQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBYixHQUF1QixVQUEvQixDQUFiLEdBQXVEO0FBTC9FOzJCQUZKOztJQUZVOzsyQkFpQmQsc0JBQUEsR0FBd0IsU0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEtBQVgsRUFBa0IsS0FBbEI7UUFFcEIsSUFBRyxLQUFBLEtBQVMsS0FBWjtZQUNJLElBQUMsQ0FBQSxLQUFELENBQUE7WUFDQSxTQUFBLENBQVUsS0FBVjtBQUNBLG1CQUhKOztRQUtBLElBQTBCLGlCQUExQjtBQUFBLG1CQUFPLFlBQVA7O0FBRUEsZ0JBQU8sS0FBUDtBQUFBLGlCQUNTLE9BRFQ7QUFDMEIsdUJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxFQUFWO0FBRGpDO1FBSUEsSUFBRyxpQkFBSDtBQUNJLG9CQUFPLEtBQVA7QUFBQSxxQkFDUyxXQURUO0FBQzBCLDJCQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYO0FBRGpDLHFCQUVTLFNBRlQ7QUFFMEIsMkJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLENBQVg7QUFGakMscUJBR1MsS0FIVDtBQUcwQiwyQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBSGpDLHFCQUlTLE1BSlQ7QUFJMEIsMkJBQU8sSUFBQyxDQUFBLEtBQUQsQ0FBQTtBQUpqQyxxQkFLUyxNQUxUO0FBSzBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFMakMscUJBTVMsSUFOVDtBQU0wQiwyQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFBO0FBTmpDLGFBREo7O1FBUUEsSUFBQyxDQUFBLEtBQUQsQ0FBQTtlQUNBO0lBdEJvQjs7Ozs7O0FBd0I1QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG4jIyNcblxueyBzdG9wRXZlbnQsIGtlcnJvciwgc2xhc2gsIHZhbGlkLCBlbXB0eSwgY2xhbXAsIGtsb2csIGtzdHIsIGVsZW0sICQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuU3ludGF4ID0gcmVxdWlyZSAnLi9zeW50YXgnXG5cbmNsYXNzIEF1dG9jb21wbGV0ZVxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHNwbGl0UmVnRXhwID0gL1xccysvZ1xuICAgIFxuICAgICAgICBAZmlsZUNvbW1hbmRzID0gWydjZCcgJ2xzJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIEBkaXJDb21tYW5kcyAgPSBbJ2NkJ11cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3Iub24gJ2luc2VydCcgQG9uSW5zZXJ0XG4gICAgICAgIEBlZGl0b3Iub24gJ2N1cnNvcicgQGNsb3NlXG4gICAgICAgIEBlZGl0b3Iub24gJ2JsdXInICAgQGNsb3NlXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgZGlyTWF0Y2hlczogKGRpciwgZGlyc09ubHk6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICBub0RpciA9IHNsYXNoLmZpbGUgZGlyXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZGlyXG4gICAgICAgICAgICBpZiBub3QgZGlyIG9yIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCA9IGRpciAgXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gJy8nIGlmIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9IG5vRGlyXG4gICAgICAgICAgICAgICAgZGlyID0gJydcblxuICAgICAgICBpdGVtcyA9IHNsYXNoLmxpc3QgZGlyLCBpZ25vcmVIaWRkZW46ZmFsc2VcblxuICAgICAgICBpZiB2YWxpZCBpdGVtc1xuXG4gICAgICAgICAgICByZXN1bHQgPSBpdGVtcy5tYXAgKGkpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlmIGRpcnNPbmx5IGFuZCBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBuYW1lID0gbnVsbFxuICAgICAgICAgICAgICAgIGlmIG5vUGFyZW50XG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vUGFyZW50KSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlIGlmIG5vRGlyXG4gICAgICAgICAgICAgICAgICAgIGlmIGkubmFtZS5zdGFydHNXaXRoKG5vRGlyKSB0aGVuIG5hbWUgPSBpLm5hbWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy8nIG9yIGVtcHR5KGRpcikgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaS5uYW1lWzBdID09ICcuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLicgdGhlbiBuYW1lID0gaS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGRpclstMV0gPT0gJy4nIHRoZW4gbmFtZSA9ICcuLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgIG5hbWUgPSAnLycraS5uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgbmFtZVxuICAgICAgICAgICAgICAgICAgICBpZiBpLnR5cGUgPT0gJ2ZpbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGlyWy0xXSA9PSAnLidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudCA9IChpLm5hbWVbMF0gPT0gJy4nIGFuZCA2NjYgb3IgMzMzKVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ID0gKGkubmFtZVswXSA9PSAnLicgYW5kIDMzMyBvciA2NjYpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbmFtZSwgY291bnQ6Y291bnQsIHR5cGU6aS50eXBlXVxuXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuZmlsdGVyIChmKSAtPiBmXG5cbiAgICAgICAgICAgIGlmIGRpci5lbmRzV2l0aCAnLi4vJ1xuICAgICAgICAgICAgICAgIGlmIG5vdCBzbGFzaC5pc1Jvb3Qgc2xhc2guam9pbiBwcm9jZXNzLmN3ZCgpLCBkaXJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycuLicgY291bnQ6OTk5IHR5cGU6J2RpciddXG4gICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBkaXIgPT0gJy4nIG9yIGRpci5lbmRzV2l0aCgnLy4nKVxuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLi4nIGNvdW50Ojk5OSB0eXBlOidkaXInXVxuICAgICAgICAgICAgZWxzZSBpZiBub3Qgbm9EaXIgYW5kIHZhbGlkKGRpcikgXG4gICAgICAgICAgICAgICAgaWYgbm90IGRpci5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycvJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnJyBjb3VudDo5OTkgdHlwZTonZGlyJ11cbiAgICAgICAgcmVzdWx0ID8gW11cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgY21kTWF0Y2hlczogKHdvcmQpIC0+XG4gICAgICAgIFxuICAgICAgICBwaWNrID0gKG9iaixjbWQpIC0+IGNtZC5zdGFydHNXaXRoKHdvcmQpIGFuZCBjbWQubGVuZ3RoID4gd29yZC5sZW5ndGhcbiAgICAgICAgbXRjaHMgPSBfLnRvUGFpcnMgXy5waWNrQnkgd2luZG93LmJyYWluLmNtZHMsIHBpY2tcbiAgICAgICAgbVsxXS50eXBlID0gJ2NtZCcgZm9yIG0gaW4gbXRjaHNcbiAgICAgICAgbXRjaHNcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgb25UYWI6IC0+XG4gICAgICAgIFxuICAgICAgICBtYyAgID0gQGVkaXRvci5tYWluQ3Vyc29yKClcbiAgICAgICAgbGluZSA9IEBlZGl0b3IubGluZSBtY1sxXVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGxpbmUudHJpbSgpXG4gICAgICAgIFxuICAgICAgICBpbmZvID1cbiAgICAgICAgICAgIGxpbmU6ICAgbGluZVxuICAgICAgICAgICAgYmVmb3JlOiBsaW5lWzAuLi5tY1swXV1cbiAgICAgICAgICAgIGFmdGVyOiAgbGluZVttY1swXS4uXVxuICAgICAgICAgICAgY3Vyc29yOiBtY1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBzcGFuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGN1cnJlbnQgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgICAgIGlmIEBsaXN0IGFuZCBlbXB0eSBjdXJyZW50XG4gICAgICAgICAgICAgICAgQG5hdmlnYXRlIDFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3VmZml4ID0gJydcbiAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyIEBzZWxlY3RlZFdvcmQoKVxuICAgICAgICAgICAgICAgIGlmIG5vdCBjdXJyZW50LmVuZHNXaXRoKCcvJykgYW5kIG5vdCBAc2VsZWN0ZWRXb3JkKCkuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9ICcvJ1xuICAgICAgICAgICAga2xvZyBcInRhYiAje0BzZWxlY3RlZFdvcmQoKX0gfCN7Y3VycmVudH18IHN1ZmZpeCAje3N1ZmZpeH1cIlxuICAgICAgICAgICAgQGNvbXBsZXRlIHN1ZmZpeDpzdWZmaXhcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAb25JbnNlcnQgaW5mb1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4gICAgb25JbnNlcnQ6IChAaW5mbykgPT5cbiAgICAgICAgXG4gICAgICAgIEBjbG9zZSgpXG4gICAgICAgIFxuICAgICAgICBAd29yZCA9IF8ubGFzdCBAaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIFxuICAgICAgICBAaW5mby5zcGxpdCA9IEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgZmlyc3RDbWQgPSBAaW5mby5iZWZvcmUuc3BsaXQoJyAnKVswXVxuICAgICAgICBkaXJzT25seSA9IGZpcnN0Q21kIGluIEBkaXJDb21tYW5kc1xuICAgICAgICBpZiBub3QgQHdvcmQ/Lmxlbmd0aFxuICAgICAgICAgICAgaWYgZmlyc3RDbWQgaW4gQGZpbGVDb21tYW5kc1xuICAgICAgICAgICAgICAgIEBtYXRjaGVzID0gQGRpck1hdGNoZXMgbnVsbCBkaXJzT25seTpkaXJzT25seVxuICAgICAgICAgICAgaWYgZW1wdHkgQG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpbmNsdWRlc0NtZHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAY21kTWF0Y2hlcyBAaW5mby5iZWZvcmVcbiAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpbmNsdWRlc0NtZHMgPSB0cnVlXG4gICAgICAgICAgICBAbWF0Y2hlcyA9IEBkaXJNYXRjaGVzKEB3b3JkLCBkaXJzT25seTpkaXJzT25seSkuY29uY2F0IEBjbWRNYXRjaGVzIEBpbmZvLmJlZm9yZVxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBAbWF0Y2hlc1xuICAgICAgICBcbiAgICAgICAgQG1hdGNoZXMuc29ydCAoYSxiKSAtPiBiWzFdLmNvdW50IC0gYVsxXS5jb3VudFxuICAgICAgICAgICAgXG4gICAgICAgIGZpcnN0ID0gQG1hdGNoZXMuc2hpZnQoKSAjIHNlcGVyYXRlIGZpcnN0IG1hdGNoXG4gICAgICAgIFxuICAgICAgICBpZiBmaXJzdFswXSA9PSAnLydcbiAgICAgICAgICAgIEBpbmZvLnNwbGl0ID0gQGluZm8uYmVmb3JlLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaW5mby5zcGxpdCA9IEBpbmZvLmJlZm9yZS5sZW5ndGggLSBAd29yZC5sZW5ndGhcbiAgICAgICAgICAgIGlmIDAgPD0gcyA9IEB3b3JkLmxhc3RJbmRleE9mICcvJ1xuICAgICAgICAgICAgICAgIEBpbmZvLnNwbGl0ICs9IHMgKyAxXG4gICAgICAgIFxuICAgICAgICBpZiBpbmNsdWRlc0NtZHMgIyBzaG9ydGVuIGNvbW1hbmQgY29tcGxldGlvbnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VlbiA9IFtmaXJzdFswXV1cbiAgICAgICAgICAgIGlmIGZpcnN0WzFdLnR5cGUgPT0gJ2NtZCdcbiAgICAgICAgICAgICAgICBzZWVuID0gW2ZpcnN0WzBdW0BpbmZvLnNwbGl0Li5dXVxuICAgICAgICAgICAgICAgIGZpcnN0WzBdID0gZmlyc3RbMF1bQGluZm8uYmVmb3JlLmxlbmd0aC4uXVxuICAgIFxuICAgICAgICAgICAgZm9yIG0gaW4gQG1hdGNoZXNcbiAgICAgICAgICAgICAgICBpZiBtWzFdLnR5cGUgPT0gJ2NtZCdcbiAgICAgICAgICAgICAgICAgICAgaWYgQGluZm8uc3BsaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1bMF0gPSBtWzBdW0BpbmZvLnNwbGl0Li5dXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbWkgPSAwXG4gICAgICAgICAgICB3aGlsZSBtaSA8IEBtYXRjaGVzLmxlbmd0aCAjIGNyYXBweSBkdXBsaWNhdGUgZmlsdGVyXG4gICAgICAgICAgICAgICAgaWYgQG1hdGNoZXNbbWldWzBdIGluIHNlZW5cbiAgICAgICAgICAgICAgICAgICAgQG1hdGNoZXMuc3BsaWNlIG1pLCAxXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBzZWVuLnB1c2ggQG1hdGNoZXNbbWldWzBdXG4gICAgICAgICAgICAgICAgICAgIG1pKytcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBmaXJzdFswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIEB3b3JkLmxlbmd0aFxuICAgICAgICBlbHNlIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggQGluZm8uYmVmb3JlXG4gICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIEBpbmZvLmJlZm9yZS5sZW5ndGhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgZmlyc3RbMF0uc3RhcnRzV2l0aCBzbGFzaC5maWxlIEB3b3JkXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXS5zbGljZSBzbGFzaC5maWxlKEB3b3JkKS5sZW5ndGhcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdXG4gICAgICAgIFxuICAgICAgICBAb3BlbigpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgIFxuICAgIG9wZW46IC0+XG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgXCIje0BpbmZvLmJlZm9yZX18I3tAY29tcGxldGlvbn18I3tAaW5mby5hZnRlcn0gI3tAd29yZH1cIlxuICAgICAgICBcbiAgICAgICAgQHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczonYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ICAgICAgPSBAY29tcGxldGlvblxuICAgICAgICBAc3Bhbi5zdHlsZS5vcGFjaXR5ICAgID0gMVxuICAgICAgICBAc3Bhbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNDRhXCJcbiAgICAgICAgQHNwYW4uc3R5bGUuY29sb3IgICAgICA9IFwiI2ZmZlwiXG4gICAgICAgIEBzcGFuLnN0eWxlLnRyYW5zZm9ybSAgPSBcInRyYW5zbGF0ZXgoI3tAZWRpdG9yLnNpemUuY2hhcldpZHRoKkBlZGl0b3IubWFpbkN1cnNvcigpWzBdfXB4KVwiXG5cbiAgICAgICAgaWYgbm90IHNwYW5CZWZvcmUgPSBAZWRpdG9yLnNwYW5CZWZvcmVNYWluKClcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIHNwYW5JbmZvJ1xuICAgICAgICBcbiAgICAgICAgc2libGluZyA9IHNwYW5CZWZvcmVcbiAgICAgICAgd2hpbGUgc2libGluZyA9IHNpYmxpbmcubmV4dFNpYmxpbmdcbiAgICAgICAgICAgIEBjbG9uZXMucHVzaCBzaWJsaW5nLmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICBAY2xvbmVkLnB1c2ggc2libGluZ1xuICAgICAgICAgICAgXG4gICAgICAgIHNwYW5CZWZvcmUucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZCBAc3BhblxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZCB0aGVuIGMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzIHRoZW4gQHNwYW4uaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICdhZnRlcmVuZCcgY1xuICAgICAgICAgICAgXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQGNvbXBsZXRpb24ubGVuZ3RoICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBAbWF0Y2hlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBzaG93TGlzdCgpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc2hvd0xpc3Q6IC0+XG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgQG1hdGNoZXNcbiAgICAgICAgXG4gICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1saXN0J1xuICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuICAgICAgICBAbGlzdE9mZnNldCA9IDBcbiAgICAgICAgXG4gICAgICAgICMga2xvZyBAd29yZCwgc2xhc2guZGlyKEB3b3JkKVxuICAgICAgICBcbiAgICAgICAgc3BsdCA9IEB3b3JkLnNwbGl0ICcvJ1xuICAgICAgICBcbiAgICAgICAgaWYgc3BsdC5sZW5ndGg+MSBhbmQgbm90IEB3b3JkLmVuZHNXaXRoKCcvJykgYW5kIEBjb21wbGV0aW9uICE9ICcvJ1xuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBzcGx0Wy0xXS5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlc1swXVswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IEB3b3JkLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgIEBsaXN0LnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRleCgjey1AZWRpdG9yLnNpemUuY2hhcldpZHRoKkBsaXN0T2Zmc2V0fXB4KVwiXG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIG1hdGNoIGluIEBtYXRjaGVzXG4gICAgICAgICAgICBpdGVtID0gZWxlbSBjbGFzczonYXV0b2NvbXBsZXRlLWl0ZW0nIGluZGV4OmluZGV4KytcbiAgICAgICAgICAgIGl0ZW0uaW5uZXJIVE1MID0gU3ludGF4LnNwYW5Gb3JUZXh0QW5kU3ludGF4IG1hdGNoWzBdLCAnc2gnXG4gICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQgbWF0Y2hbMV0udHlwZVxuICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBhYm92ZSA9IG1jWzFdICsgQG1hdGNoZXMubGVuZ3RoID49IEBlZGl0b3Iuc2Nyb2xsLmZ1bGxMaW5lc1xuICAgICAgICBpZiBhYm92ZVxuICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYWJvdmUnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsaXN0LmNsYXNzTGlzdC5hZGQgJ2JlbG93J1xuICAgICAgICAgICAgXG4gICAgICAgIGN1cnNvciA9JCAnLm1haW4nIEBlZGl0b3Iudmlld1xuICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycgQG9uQ2xpY2tcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyA/IFtdXG4gICAgICAgICAgICBjLnJlbW92ZSgpXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZCA/IFtdXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnaW5pdGlhbCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc3Bhbj8ucmVtb3ZlKClcbiAgICAgICAgQHNlbGVjdGVkICAgPSAtMVxuICAgICAgICBAbGlzdE9mZnNldCA9IDBcbiAgICAgICAgQGxpc3QgICAgICAgPSBudWxsXG4gICAgICAgIEBzcGFuICAgICAgID0gbnVsbFxuICAgICAgICBAY29tcGxldGlvbiA9IG51bGxcbiAgICAgICAgQG1hdGNoZXMgICAgPSBbXVxuICAgICAgICBAY2xvbmVzICAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgID0gW11cbiAgICAgICAgQFxuXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gZWxlbS51cEF0dHIgZXZlbnQudGFyZ2V0LCAnaW5kZXgnXG4gICAgICAgIGlmIGluZGV4ICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2VsZWN0IGluZGV4XG4gICAgICAgICAgICBAY29tcGxldGUge31cbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBjb21wbGV0ZTogKHN1ZmZpeDonJykgLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IucGFzdGVUZXh0IEBzZWxlY3RlZENvbXBsZXRpb24oKSArIHN1ZmZpeFxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgaXNMaXN0SXRlbVNlbGVjdGVkOiAtPiBAbGlzdCBhbmQgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgc2VsZWN0ZWRXb3JkOiAtPiBAd29yZCtAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICBcbiAgICBzZWxlY3RlZENvbXBsZXRpb246IC0+XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICAjIGtsb2cgJ2NvbXBsZXRpb24nIEBzZWxlY3RlZCAsIEBtYXRjaGVzW0BzZWxlY3RlZF1bMF0sIEBsaXN0T2Zmc2V0XG4gICAgICAgICAgICBAbWF0Y2hlc1tAc2VsZWN0ZWRdWzBdLnNsaWNlIEBsaXN0T2Zmc2V0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjb21wbGV0aW9uXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGRlbHRhKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdFxuICAgICAgICBAc2VsZWN0IGNsYW1wIC0xLCBAbWF0Y2hlcy5sZW5ndGgtMSwgQHNlbGVjdGVkK2RlbHRhXG4gICAgICAgIFxuICAgIHNlbGVjdDogKGluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbGlzdD8uY2hpbGRyZW5bMF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAgLT4gQG5hdmlnYXRlIC0xICAgIFxuICAgIG5leHQ6ICAtPiBAbmF2aWdhdGUgMVxuICAgIGxhc3Q6ICAtPiBAbmF2aWdhdGUgQG1hdGNoZXMubGVuZ3RoIC0gQHNlbGVjdGVkXG4gICAgZmlyc3Q6IC0+IEBuYXZpZ2F0ZSAtSW5maW5pdHlcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcblxuICAgIG1vdmVDbG9uZXNCeTogKG51bUNoYXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQGNsb25lc1xuICAgICAgICAgICAgYmVmb3JlTGVuZ3RoID0gQGNsb25lc1swXS5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzEuLi5AY2xvbmVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBjID0gQGNsb25lc1tjaV1cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbY2ktMV0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgICAgICAgICAgY2hhck9mZnNldCA9IG51bUNoYXJzXG4gICAgICAgICAgICAgICAgY2hhck9mZnNldCArPSBiZWZvcmVMZW5ndGggaWYgY2kgPT0gMVxuICAgICAgICAgICAgICAgIGMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7b2Zmc2V0K0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqY2hhck9mZnNldH1weClcIlxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29tYm8gPT0gJ3RhYidcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnQgIyBwcmV2ZW50IGZvY3VzIGNoYW5nZVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnIGlmIG5vdCBAc3Bhbj9cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjb21ibyBcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAgICAgdGhlbiByZXR1cm4gQGNvbXBsZXRlIHt9XG4gICAgICAgICAgICAjIHdoZW4gJ2JhY2tzcGFjZScgdGhlbiBrbG9nICdiYWNrc3BhY2UhJ1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0PyBcbiAgICAgICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgZG93bicgdGhlbiByZXR1cm4gQG5hdmlnYXRlICs5XG4gICAgICAgICAgICAgICAgd2hlbiAncGFnZSB1cCcgICB0aGVuIHJldHVybiBAbmF2aWdhdGUgLTlcbiAgICAgICAgICAgICAgICB3aGVuICdlbmQnICAgICAgIHRoZW4gcmV0dXJuIEBsYXN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gcmV0dXJuIEBmaXJzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnZG93bicgICAgICB0aGVuIHJldHVybiBAbmV4dCgpXG4gICAgICAgICAgICAgICAgd2hlbiAndXAnICAgICAgICB0aGVuIHJldHVybiBAcHJldigpXG4gICAgICAgIEBjbG9zZSgpICAgXG4gICAgICAgICd1bmhhbmRsZWQnXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBdXRvY29tcGxldGVcbiJdfQ==
//# sourceURL=../../coffee/editor/autocomplete.coffee