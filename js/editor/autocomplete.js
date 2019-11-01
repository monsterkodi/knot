// koffee 1.4.0

/*
 0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
 */
var $, Autocomplete, _, clamp, elem, empty, kerror, klog, kstr, ref, slash, stopEvent, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), stopEvent = ref.stopEvent, kerror = ref.kerror, slash = ref.slash, valid = ref.valid, empty = ref.empty, clamp = ref.clamp, klog = ref.klog, kstr = ref.kstr, elem = ref.elem, $ = ref.$, _ = ref._;

Autocomplete = (function() {
    function Autocomplete(editor) {
        this.editor = editor;
        this.onMouseDown = bind(this.onMouseDown, this);
        this.close = bind(this.close, this);
        this.onInsert = bind(this.onInsert, this);
        this.close();
        this.splitRegExp = /\s+/g;
        this.dirCommands = ['ls', 'cd', 'rm', 'cp', 'mv', 'krep', 'cat'];
        this.editor.on('insert', this.onInsert);
        this.editor.on('cursor', this.close);
        this.editor.on('blur', this.close);
    }

    Autocomplete.prototype.dirMatches = function(dir) {
        var items, noDir, noParent, result;
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
        items = slash.list(dir);
        if (valid(items)) {
            result = items.map(function(i) {
                if (noParent) {
                    if (i.name.startsWith(noParent)) {
                        return [
                            i.name, {
                                count: 0,
                                type: i.type
                            }
                        ];
                    }
                } else if (noDir) {
                    if (i.name.startsWith(noDir)) {
                        return [
                            i.name, {
                                count: 0,
                                type: i.type
                            }
                        ];
                    }
                } else {
                    if (dir.slice(-1)[0] === '/' || empty(dir)) {
                        return [
                            i.name, {
                                count: 0,
                                type: i.type
                            }
                        ];
                    } else {
                        return [
                            '/' + i.name, {
                                count: 0,
                                type: i.type
                            }
                        ];
                    }
                }
            });
            result = result.filter(function(f) {
                return f;
            });
            if (dir === '.') {
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
            return result;
        }
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
                if (valid(current) && !current.endsWith('/')) {
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

    Autocomplete.prototype.onInsert = function(info) {
        var first, ref1, ref2;
        this.close();
        this.word = _.last(info.before.split(this.splitRegExp));
        if (!((ref1 = this.word) != null ? ref1.length : void 0)) {
            if (ref2 = info.before.split(' ')[0], indexOf.call(this.dirCommands, ref2) >= 0) {
                this.matches = this.dirMatches();
            }
        } else {
            this.matches = this.dirMatches(this.word).concat(this.cmdMatches(info.before));
        }
        if (empty(this.matches)) {
            this.matches = this.cmdMatches(info.before);
        }
        if (empty(this.matches)) {
            return;
        }
        this.matches.sort(function(a, b) {
            return b[1].count - a[1].count;
        });
        first = this.matches.shift();
        if (first[0].startsWith(this.word)) {
            this.completion = first[0].slice(this.word.length);
        } else {
            if (first[0].startsWith(slash.file(this.word))) {
                this.completion = first[0].slice(slash.file(this.word).length);
            } else {
                this.completion = first[0];
            }
        }
        return this.open(info);
    };

    Autocomplete.prototype.open = function(info) {
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
        var above, cursor, index, item, j, len, match, mc, ref1;
        this.list = elem({
            "class": 'autocomplete-list'
        });
        this.list.addEventListener('mousedown', this.onMouseDown);
        this.listOffset = 0;
        if (slash.dir(this.word) && !this.word.endsWith('/')) {
            this.listOffset = slash.file(this.word).length;
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
            item.textContent = match[0];
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
        if (combo === 'right') {
            this.complete({});
            return;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx3RkFBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUVoRTtJQUVDLHNCQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7OztRQUVBLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLFdBQUQsR0FBZSxDQUFDLElBQUQsRUFBTSxJQUFOLEVBQVcsSUFBWCxFQUFnQixJQUFoQixFQUFxQixJQUFyQixFQUEwQixNQUExQixFQUFpQyxLQUFqQztRQUVmLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLFFBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxNQUFYLEVBQW9CLElBQUMsQ0FBQSxLQUFyQjtJQVZEOzsyQkFrQkgsVUFBQSxHQUFZLFNBQUMsR0FBRDtBQUVSLFlBQUE7UUFBQSxJQUFHLENBQUksS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaLENBQVA7WUFDSSxLQUFBLEdBQVEsS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYO1lBQ1IsR0FBQSxHQUFNLEtBQUssQ0FBQyxHQUFOLENBQVUsR0FBVjtZQUNOLElBQUcsQ0FBSSxHQUFKLElBQVcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FB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SyxDQUFDLFNBQVIsR0FBb0IsYUFBQSxHQUFhLENBQUMsTUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQWIsR0FBdUIsVUFBL0IsQ0FBYixHQUF1RDtBQUwvRTsyQkFGSjs7SUFGVTs7MkJBaUJkLHNCQUFBLEdBQXdCLFNBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxLQUFYLEVBQWtCLEtBQWxCO1FBRXBCLElBQUcsS0FBQSxLQUFTLEtBQVo7WUFDSSxJQUFDLENBQUEsS0FBRCxDQUFBO1lBQ0EsU0FBQSxDQUFVLEtBQVY7QUFDQSxtQkFISjs7UUFLQSxJQUEwQixpQkFBMUI7QUFBQSxtQkFBTyxZQUFQOztRQUVBLElBQUcsS0FBQSxLQUFTLE9BQVo7WUFDSSxJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVY7QUFDQSxtQkFGSjs7UUFJQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLFdBRFQ7QUFDMEIsMkJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLENBQVg7QUFEakMscUJBRVMsU0FGVDtBQUUwQiwyQkFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWDtBQUZqQyxxQkFHUyxLQUhUO0FBRzBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFIakMscUJBSVMsTUFKVDtBQUkwQiwyQkFBTyxJQUFDLENBQUEsS0FBRCxDQUFBO0FBSmpDLHFCQUtTLE1BTFQ7QUFLMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUxqQyxxQkFNUyxJQU5UO0FBTTBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFOakMsYUFESjs7UUFRQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0E7SUF0Qm9COzs7Ozs7QUF3QjVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHN0b3BFdmVudCwga2Vycm9yLCBzbGFzaCwgdmFsaWQsIGVtcHR5LCBjbGFtcCwga2xvZywga3N0ciwgZWxlbSwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBBdXRvY29tcGxldGVcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEBzcGxpdFJlZ0V4cCA9IC9cXHMrL2dcbiAgICBcbiAgICAgICAgQGRpckNvbW1hbmRzID0gWydscycgJ2NkJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdpbnNlcnQnIEBvbkluc2VydFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgIEBjbG9zZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGRpck1hdGNoZXM6IChkaXIpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICBub0RpciA9IHNsYXNoLmZpbGUgZGlyXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZGlyXG4gICAgICAgICAgICBpZiBub3QgZGlyIG9yIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCA9IGRpciAgXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gJy8nIGlmIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9IG5vRGlyXG4gICAgICAgICAgICAgICAgZGlyID0gJydcblxuICAgICAgICBpdGVtcyA9IHNsYXNoLmxpc3QgZGlyXG5cbiAgICAgICAgaWYgdmFsaWQgaXRlbXNcblxuICAgICAgICAgICAgcmVzdWx0ID0gaXRlbXMubWFwIChpKSAtPiBcbiAgICAgICAgICAgICAgICBpZiBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aCBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgW2kubmFtZSwgY291bnQ6MCwgdHlwZTppLnR5cGVdXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBub0RpclxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aCBub0RpclxuICAgICAgICAgICAgICAgICAgICAgICAgW2kubmFtZSwgY291bnQ6MCwgdHlwZTppLnR5cGVdXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcvJyBvciBlbXB0eSBkaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtpLm5hbWUsIGNvdW50OjAsIHR5cGU6aS50eXBlXVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBbJy8nK2kubmFtZSwgY291bnQ6MCwgdHlwZTppLnR5cGVdXG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5maWx0ZXIgKGYpIC0+IGZcblxuICAgICAgICAgICAgaWYgZGlyID09ICcuJ1xuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLi4nIGNvdW50Ojk5OSwgdHlwZTonZGlyJ11cbiAgICAgICAgICAgIGVsc2UgaWYgbm90IG5vRGlyIGFuZCB2YWxpZChkaXIpIFxuICAgICAgICAgICAgICAgIGlmIG5vdCBkaXIuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLycgY291bnQ6OTk5LCB0eXBlOidkaXInXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSwgdHlwZTonZGlyJ11cblxuICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNtZE1hdGNoZXM6ICh3b3JkKSAtPlxuICAgICAgICBcbiAgICAgICAgcGljayA9IChvYmosY21kKSAtPiBjbWQuc3RhcnRzV2l0aCh3b3JkKSBhbmQgY21kLmxlbmd0aCA+IHdvcmQubGVuZ3RoXG4gICAgICAgIG10Y2hzID0gXy50b1BhaXJzIF8ucGlja0J5IHdpbmRvdy5icmFpbi5jbWRzLCBwaWNrXG4gICAgICAgIG1bMV0udHlwZSA9ICdjbWQnIGZvciBtIGluIG10Y2hzXG4gICAgICAgIG10Y2hzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIG9uVGFiOiAtPlxuICAgICAgICBcbiAgICAgICAgbWMgICA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmUgbWNbMV1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBsaW5lLnRyaW0oKVxuICAgICAgICBcbiAgICAgICAgaW5mbyA9XG4gICAgICAgICAgICBsaW5lOiAgIGxpbmVcbiAgICAgICAgICAgIGJlZm9yZTogbGluZVswLi4ubWNbMF1dXG4gICAgICAgICAgICBhZnRlcjogIGxpbmVbbWNbMF0uLl1cbiAgICAgICAgICAgIGN1cnNvcjogbWNcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAc3BhblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjdXJyZW50ID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgICAgICBpZiBAbGlzdCBhbmQgZW1wdHkgY3VycmVudFxuICAgICAgICAgICAgICAgIEBuYXZpZ2F0ZSAxXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN1ZmZpeCA9ICcnXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBAc2VsZWN0ZWRXb3JkKClcbiAgICAgICAgICAgICAgICBpZiB2YWxpZChjdXJyZW50KSBhbmQgbm90IGN1cnJlbnQuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9ICcvJ1xuICAgICAgICAgICAga2xvZyBcInRhYiAje0BzZWxlY3RlZFdvcmQoKX0gfCN7Y3VycmVudH18IHN1ZmZpeCAje3N1ZmZpeH1cIlxuICAgICAgICAgICAgQGNvbXBsZXRlIHN1ZmZpeDpzdWZmaXhcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBvbkluc2VydCBpbmZvXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG5cbiAgICBvbkluc2VydDogKGluZm8pID0+XG4gICAgICAgIFxuICAgICAgICBAY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgQHdvcmQgPSBfLmxhc3QgaW5mby5iZWZvcmUuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQHdvcmQ/Lmxlbmd0aFxuICAgICAgICAgICAgaWYgaW5mby5iZWZvcmUuc3BsaXQoJyAnKVswXSBpbiBAZGlyQ29tbWFuZHNcbiAgICAgICAgICAgICAgICBAbWF0Y2hlcyA9IEBkaXJNYXRjaGVzKClcbiAgICAgICAgZWxzZSAgXG4gICAgICAgICAgICBAbWF0Y2hlcyA9IEBkaXJNYXRjaGVzKEB3b3JkKS5jb25jYXQgQGNtZE1hdGNoZXMoaW5mby5iZWZvcmUpXG5cbiAgICAgICAgaWYgZW1wdHkgQG1hdGNoZXNcbiAgICAgICAgICAgIEBtYXRjaGVzID0gQGNtZE1hdGNoZXMgaW5mby5iZWZvcmVcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgZW1wdHkgQG1hdGNoZXNcbiAgICAgICAgXG4gICAgICAgIEBtYXRjaGVzLnNvcnQgKGEsYikgLT4gYlsxXS5jb3VudCAtIGFbMV0uY291bnRcbiAgICAgICAgICAgIFxuICAgICAgICBmaXJzdCA9IEBtYXRjaGVzLnNoaWZ0KClcbiAgICAgICAgXG4gICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggQHdvcmRcbiAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2UgQHdvcmQubGVuZ3RoXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIGZpcnN0WzBdLnN0YXJ0c1dpdGggc2xhc2guZmlsZSBAd29yZFxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF0uc2xpY2Ugc2xhc2guZmlsZShAd29yZCkubGVuZ3RoXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNvbXBsZXRpb24gPSBmaXJzdFswXVxuICAgICAgICBcbiAgICAgICAgQG9wZW4gaW5mb1xuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBvcGVuOiAoaW5mbykgLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBcIiN7aW5mby5iZWZvcmV9fCN7QGNvbXBsZXRpb259fCN7aW5mby5hZnRlcn0gI3tAd29yZH1cIlxuICAgICAgICBcbiAgICAgICAgQHNwYW4gPSBlbGVtICdzcGFuJyBjbGFzczonYXV0b2NvbXBsZXRlLXNwYW4nXG4gICAgICAgIEBzcGFuLnRleHRDb250ZW50ICAgICAgPSBAY29tcGxldGlvblxuICAgICAgICBAc3Bhbi5zdHlsZS5vcGFjaXR5ICAgID0gMVxuICAgICAgICBAc3Bhbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNDRhXCJcbiAgICAgICAgQHNwYW4uc3R5bGUuY29sb3IgICAgICA9IFwiI2ZmZlwiXG4gICAgICAgIEBzcGFuLnN0eWxlLnRyYW5zZm9ybSAgPSBcInRyYW5zbGF0ZXgoI3tAZWRpdG9yLnNpemUuY2hhcldpZHRoKkBlZGl0b3IubWFpbkN1cnNvcigpWzBdfXB4KVwiXG5cbiAgICAgICAgaWYgbm90IHNwYW5CZWZvcmUgPSBAZWRpdG9yLnNwYW5CZWZvcmVNYWluKClcbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgJ25vIHNwYW5JbmZvJ1xuICAgICAgICBcbiAgICAgICAgc2libGluZyA9IHNwYW5CZWZvcmVcbiAgICAgICAgd2hpbGUgc2libGluZyA9IHNpYmxpbmcubmV4dFNpYmxpbmdcbiAgICAgICAgICAgIEBjbG9uZXMucHVzaCBzaWJsaW5nLmNsb25lTm9kZSB0cnVlXG4gICAgICAgICAgICBAY2xvbmVkLnB1c2ggc2libGluZ1xuICAgICAgICAgICAgXG4gICAgICAgIHNwYW5CZWZvcmUucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZCBAc3BhblxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZCB0aGVuIGMuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzIHRoZW4gQHNwYW4uaW5zZXJ0QWRqYWNlbnRFbGVtZW50ICdhZnRlcmVuZCcgY1xuICAgICAgICAgICAgXG4gICAgICAgIEBtb3ZlQ2xvbmVzQnkgQGNvbXBsZXRpb24ubGVuZ3RoICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBAbWF0Y2hlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBzaG93TGlzdCgpXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc2hvd0xpc3Q6IC0+XG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgQG1hdGNoZXNcbiAgICAgICAgXG4gICAgICAgIEBsaXN0ID0gZWxlbSBjbGFzczogJ2F1dG9jb21wbGV0ZS1saXN0J1xuICAgICAgICBAbGlzdC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuICAgICAgICBAbGlzdE9mZnNldCA9IDBcbiAgICAgICAgaWYgc2xhc2guZGlyKEB3b3JkKSBhbmQgbm90IEB3b3JkLmVuZHNXaXRoICcvJ1xuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBzbGFzaC5maWxlKEB3b3JkKS5sZW5ndGhcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlc1swXVswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAbGlzdE9mZnNldCA9IEB3b3JkLmxlbmd0aFxuICAgICAgICBAbGlzdC5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3stQGVkaXRvci5zaXplLmNoYXJXaWR0aCpAbGlzdE9mZnNldH1weClcIlxuICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgXG4gICAgICAgIGZvciBtYXRjaCBpbiBAbWF0Y2hlc1xuICAgICAgICAgICAgaXRlbSA9IGVsZW0gY2xhc3M6J2F1dG9jb21wbGV0ZS1pdGVtJyBpbmRleDppbmRleCsrXG4gICAgICAgICAgICBpdGVtLnRleHRDb250ZW50ID0gbWF0Y2hbMF1cbiAgICAgICAgICAgIGl0ZW0uY2xhc3NMaXN0LmFkZCBtYXRjaFsxXS50eXBlXG4gICAgICAgICAgICBAbGlzdC5hcHBlbmRDaGlsZCBpdGVtXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBtYyA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIGFib3ZlID0gbWNbMV0gKyBAbWF0Y2hlcy5sZW5ndGggPj0gQGVkaXRvci5zY3JvbGwuZnVsbExpbmVzXG4gICAgICAgIGlmIGFib3ZlXG4gICAgICAgICAgICBAbGlzdC5jbGFzc0xpc3QuYWRkICdhYm92ZSdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYmVsb3cnXG4gICAgICAgICAgICBcbiAgICAgICAgY3Vyc29yID0kICcubWFpbicgQGVkaXRvci52aWV3XG4gICAgICAgIGN1cnNvci5hcHBlbmRDaGlsZCBAbGlzdFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG4gICAgY2xvc2U6ID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGlzdD9cbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZUV2ZW50TGlzdGVuZXIgJ2NsaWNrJyBAb25DbGlja1xuICAgICAgICAgICAgQGxpc3QucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVzID8gW11cbiAgICAgICAgICAgIGMucmVtb3ZlKClcblxuICAgICAgICBmb3IgYyBpbiBAY2xvbmVkID8gW11cbiAgICAgICAgICAgIGMuc3R5bGUuZGlzcGxheSA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBzcGFuPy5yZW1vdmUoKVxuICAgICAgICBAc2VsZWN0ZWQgICA9IC0xXG4gICAgICAgIEBsaXN0T2Zmc2V0ID0gMFxuICAgICAgICBAbGlzdCAgICAgICA9IG51bGxcbiAgICAgICAgQHNwYW4gICAgICAgPSBudWxsXG4gICAgICAgIEBjb21wbGV0aW9uID0gbnVsbFxuICAgICAgICBAbWF0Y2hlcyAgICA9IFtdXG4gICAgICAgIEBjbG9uZXMgICAgID0gW11cbiAgICAgICAgQGNsb25lZCAgICAgPSBbXVxuICAgICAgICBAXG5cbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBlbGVtLnVwQXR0ciBldmVudC50YXJnZXQsICdpbmRleCdcbiAgICAgICAgaWYgaW5kZXggICAgICAgICAgICBcbiAgICAgICAgICAgIEBzZWxlY3QgaW5kZXhcbiAgICAgICAgICAgIEBjb21wbGV0ZSB7fVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnRcblxuICAgIGNvbXBsZXRlOiAoc3VmZml4OicnKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVkaXRvci5wYXN0ZVRleHQgQHNlbGVjdGVkQ29tcGxldGlvbigpICsgc3VmZml4XG4gICAgICAgIEBjbG9zZSgpXG5cbiAgICBpc0xpc3RJdGVtU2VsZWN0ZWQ6IC0+IEBsaXN0IGFuZCBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBzZWxlY3RlZFdvcmQ6IC0+IEB3b3JkK0BzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgIFxuICAgIHNlbGVjdGVkQ29tcGxldGlvbjogLT5cbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgICMga2xvZyAnY29tcGxldGlvbicgQHNlbGVjdGVkICwgQG1hdGNoZXNbQHNlbGVjdGVkXVswXSwgQGxpc3RPZmZzZXRcbiAgICAgICAgICAgIEBtYXRjaGVzW0BzZWxlY3RlZF1bMF0uc2xpY2UgQGxpc3RPZmZzZXRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbXBsZXRpb25cblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuICAgIFxuICAgIG5hdmlnYXRlOiAoZGVsdGEpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaXN0XG4gICAgICAgIEBzZWxlY3QgY2xhbXAgLTEsIEBtYXRjaGVzLmxlbmd0aC0xLCBAc2VsZWN0ZWQrZGVsdGFcbiAgICAgICAgXG4gICAgc2VsZWN0OiAoaW5kZXgpIC0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcbiAgICAgICAgQHNlbGVjdGVkID0gaW5kZXhcbiAgICAgICAgaWYgQHNlbGVjdGVkID49IDBcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsaXN0Py5jaGlsZHJlblswXT8uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpXG4gICAgICAgIEBzcGFuLmlubmVySFRNTCA9IEBzZWxlY3RlZENvbXBsZXRpb24oKVxuICAgICAgICBAbW92ZUNsb25lc0J5IEBzcGFuLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA8IDBcbiAgICAgICAgQHNwYW4uY2xhc3NMaXN0LmFkZCAgICAnc2VsZWN0ZWQnIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgIFxuICAgIHByZXY6ICAtPiBAbmF2aWdhdGUgLTEgICAgXG4gICAgbmV4dDogIC0+IEBuYXZpZ2F0ZSAxXG4gICAgbGFzdDogIC0+IEBuYXZpZ2F0ZSBAbWF0Y2hlcy5sZW5ndGggLSBAc2VsZWN0ZWRcbiAgICBmaXJzdDogLT4gQG5hdmlnYXRlIC1JbmZpbml0eVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwIFxuXG4gICAgbW92ZUNsb25lc0J5OiAobnVtQ2hhcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBAY2xvbmVzXG4gICAgICAgICAgICBiZWZvcmVMZW5ndGggPSBAY2xvbmVzWzBdLmlubmVySFRNTC5sZW5ndGhcbiAgICAgICAgICAgIGZvciBjaSBpbiBbMS4uLkBjbG9uZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIGMgPSBAY2xvbmVzW2NpXVxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlRmxvYXQgQGNsb25lZFtjaS0xXS5zdHlsZS50cmFuc2Zvcm0uc3BsaXQoJ3RyYW5zbGF0ZVgoJylbMV1cbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ID0gbnVtQ2hhcnNcbiAgICAgICAgICAgICAgICBjaGFyT2Zmc2V0ICs9IGJlZm9yZUxlbmd0aCBpZiBjaSA9PSAxXG4gICAgICAgICAgICAgICAgYy5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tvZmZzZXQrQGVkaXRvci5zaXplLmNoYXJXaWR0aCpjaGFyT2Zmc2V0fXB4KVwiXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgIFxuXG4gICAgaGFuZGxlTW9kS2V5Q29tYm9FdmVudDogKG1vZCwga2V5LCBjb21ibywgZXZlbnQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjb21ibyA9PSAndGFiJ1xuICAgICAgICAgICAgQG9uVGFiKClcbiAgICAgICAgICAgIHN0b3BFdmVudCBldmVudCAjIHByZXZlbnQgZm9jdXMgY2hhbmdlXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gJ3VuaGFuZGxlZCcgaWYgbm90IEBzcGFuP1xuICAgICAgICBcbiAgICAgICAgaWYgY29tYm8gPT0gJ3JpZ2h0J1xuICAgICAgICAgICAgQGNvbXBsZXRlIHt9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGlzdD8gXG4gICAgICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSArOVxuICAgICAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgdGhlbiByZXR1cm4gQG5hdmlnYXRlIC05XG4gICAgICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIHJldHVybiBAbGFzdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAnaG9tZScgICAgICB0aGVuIHJldHVybiBAZmlyc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2Rvd24nICAgICAgdGhlbiByZXR1cm4gQG5leHQoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ3VwJyAgICAgICAgdGhlbiByZXR1cm4gQHByZXYoKVxuICAgICAgICBAY2xvc2UoKSAgIFxuICAgICAgICAndW5oYW5kbGVkJ1xuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQXV0b2NvbXBsZXRlXG4iXX0=
//# sourceURL=../../coffee/editor/autocomplete.coffee