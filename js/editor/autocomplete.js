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
                if (!current.endsWith('/')) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2NvbXBsZXRlLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx3RkFBQTtJQUFBOzs7QUFRQSxNQUE0RSxPQUFBLENBQVEsS0FBUixDQUE1RSxFQUFFLHlCQUFGLEVBQWEsbUJBQWIsRUFBcUIsaUJBQXJCLEVBQTRCLGlCQUE1QixFQUFtQyxpQkFBbkMsRUFBMEMsaUJBQTFDLEVBQWlELGVBQWpELEVBQXVELGVBQXZELEVBQTZELGVBQTdELEVBQW1FLFNBQW5FLEVBQXNFOztBQUVoRTtJQUVDLHNCQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7OztRQUVBLElBQUMsQ0FBQSxLQUFELENBQUE7UUFFQSxJQUFDLENBQUEsV0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLFdBQUQsR0FBZSxDQUFDLElBQUQsRUFBTSxJQUFOLEVBQVcsSUFBWCxFQUFnQixJQUFoQixFQUFxQixJQUFyQixFQUEwQixNQUExQixFQUFpQyxLQUFqQztRQUVmLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFFBQVgsRUFBb0IsSUFBQyxDQUFBLFFBQXJCO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsUUFBWCxFQUFvQixJQUFDLENBQUEsS0FBckI7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxNQUFYLEVBQW9CLElBQUMsQ0FBQSxLQUFyQjtJQVZEOzsyQkFrQkgsVUFBQSxHQUFZLFNBQUMsR0FBRDtBQUVSLFlBQUE7UUFBQSxJQUFHLENBQUksS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaLENBQVA7WUFDSSxLQUFBLEdBQVEsS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYO1lBQ1IsR0FBQSxHQUFNLEtBQUssQ0FBQyxHQUFOLENBQVUsR0FBVjtZQUNOLElBQUcsQ0FBSSxHQUFKLElBQVcsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FB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LENBQUMsTUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQWIsR0FBdUIsVUFBL0IsQ0FBYixHQUF1RDtBQUwvRTsyQkFGSjs7SUFGVTs7MkJBaUJkLHNCQUFBLEdBQXdCLFNBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxLQUFYLEVBQWtCLEtBQWxCO1FBRXBCLElBQUcsS0FBQSxLQUFTLEtBQVo7WUFDSSxJQUFDLENBQUEsS0FBRCxDQUFBO1lBQ0EsU0FBQSxDQUFVLEtBQVY7QUFDQSxtQkFISjs7UUFLQSxJQUEwQixpQkFBMUI7QUFBQSxtQkFBTyxZQUFQOztRQUVBLElBQUcsS0FBQSxLQUFTLE9BQVo7WUFDSSxJQUFDLENBQUEsUUFBRCxDQUFVLEVBQVY7QUFDQSxtQkFGSjs7UUFJQSxJQUFHLGlCQUFIO0FBQ0ksb0JBQU8sS0FBUDtBQUFBLHFCQUNTLFdBRFQ7QUFDMEIsMkJBQU8sSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLENBQVg7QUFEakMscUJBRVMsU0FGVDtBQUUwQiwyQkFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWDtBQUZqQyxxQkFHUyxLQUhUO0FBRzBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFIakMscUJBSVMsTUFKVDtBQUkwQiwyQkFBTyxJQUFDLENBQUEsS0FBRCxDQUFBO0FBSmpDLHFCQUtTLE1BTFQ7QUFLMEIsMkJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBQTtBQUxqQyxxQkFNUyxJQU5UO0FBTTBCLDJCQUFPLElBQUMsQ0FBQSxJQUFELENBQUE7QUFOakMsYUFESjs7UUFRQSxJQUFDLENBQUEsS0FBRCxDQUFBO2VBQ0E7SUF0Qm9COzs7Ozs7QUF3QjVCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIFxuMDAwICAgMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiMjI1xuXG57IHN0b3BFdmVudCwga2Vycm9yLCBzbGFzaCwgdmFsaWQsIGVtcHR5LCBjbGFtcCwga2xvZywga3N0ciwgZWxlbSwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBBdXRvY29tcGxldGVcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEBzcGxpdFJlZ0V4cCA9IC9cXHMrL2dcbiAgICBcbiAgICAgICAgQGRpckNvbW1hbmRzID0gWydscycgJ2NkJyAncm0nICdjcCcgJ212JyAna3JlcCcgJ2NhdCddXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLm9uICdpbnNlcnQnIEBvbkluc2VydFxuICAgICAgICBAZWRpdG9yLm9uICdjdXJzb3InIEBjbG9zZVxuICAgICAgICBAZWRpdG9yLm9uICdibHVyJyAgIEBjbG9zZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGRpck1hdGNoZXM6IChkaXIpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgICAgICBub0RpciA9IHNsYXNoLmZpbGUgZGlyXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZGlyXG4gICAgICAgICAgICBpZiBub3QgZGlyIG9yIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgICAgICAgICBub1BhcmVudCA9IGRpciAgXG4gICAgICAgICAgICAgICAgbm9QYXJlbnQgKz0gJy8nIGlmIGRpclxuICAgICAgICAgICAgICAgIG5vUGFyZW50ICs9IG5vRGlyXG4gICAgICAgICAgICAgICAgZGlyID0gJydcblxuICAgICAgICBpdGVtcyA9IHNsYXNoLmxpc3QgZGlyXG5cbiAgICAgICAgaWYgdmFsaWQgaXRlbXNcblxuICAgICAgICAgICAgcmVzdWx0ID0gaXRlbXMubWFwIChpKSAtPiBcbiAgICAgICAgICAgICAgICBpZiBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aCBub1BhcmVudFxuICAgICAgICAgICAgICAgICAgICAgICAgW2kubmFtZSwgY291bnQ6MCwgdHlwZTppLnR5cGVdXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBub0RpclxuICAgICAgICAgICAgICAgICAgICBpZiBpLm5hbWUuc3RhcnRzV2l0aCBub0RpclxuICAgICAgICAgICAgICAgICAgICAgICAgW2kubmFtZSwgY291bnQ6MCwgdHlwZTppLnR5cGVdXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiBkaXJbLTFdID09ICcvJyBvciBlbXB0eSBkaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtpLm5hbWUsIGNvdW50OjAsIHR5cGU6aS50eXBlXVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBbJy8nK2kubmFtZSwgY291bnQ6MCwgdHlwZTppLnR5cGVdXG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5maWx0ZXIgKGYpIC0+IGZcblxuICAgICAgICAgICAgaWYgZGlyID09ICcuJ1xuICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLi4nIGNvdW50Ojk5OSwgdHlwZTonZGlyJ11cbiAgICAgICAgICAgIGVsc2UgaWYgbm90IG5vRGlyIGFuZCB2YWxpZChkaXIpIFxuICAgICAgICAgICAgICAgIGlmIG5vdCBkaXIuZW5kc1dpdGggJy8nXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC51bnNoaWZ0IFsnLycgY291bnQ6OTk5LCB0eXBlOidkaXInXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQgWycnIGNvdW50Ojk5OSwgdHlwZTonZGlyJ11cblxuICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGNtZE1hdGNoZXM6ICh3b3JkKSAtPlxuICAgICAgICBcbiAgICAgICAgcGljayA9IChvYmosY21kKSAtPiBjbWQuc3RhcnRzV2l0aCh3b3JkKSBhbmQgY21kLmxlbmd0aCA+IHdvcmQubGVuZ3RoXG4gICAgICAgIG10Y2hzID0gXy50b1BhaXJzIF8ucGlja0J5IHdpbmRvdy5icmFpbi5jbWRzLCBwaWNrXG4gICAgICAgIG1bMV0udHlwZSA9ICdjbWQnIGZvciBtIGluIG10Y2hzXG4gICAgICAgIG10Y2hzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIG9uVGFiOiAtPlxuICAgICAgICBcbiAgICAgICAgbWMgICA9IEBlZGl0b3IubWFpbkN1cnNvcigpXG4gICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmUgbWNbMV1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBsaW5lLnRyaW0oKVxuICAgICAgICBcbiAgICAgICAgaW5mbyA9XG4gICAgICAgICAgICBsaW5lOiAgIGxpbmVcbiAgICAgICAgICAgIGJlZm9yZTogbGluZVswLi4ubWNbMF1dXG4gICAgICAgICAgICBhZnRlcjogIGxpbmVbbWNbMF0uLl1cbiAgICAgICAgICAgIGN1cnNvcjogbWNcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAc3BhblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjdXJyZW50ID0gQHNlbGVjdGVkQ29tcGxldGlvbigpXG4gICAgICAgICAgICBpZiBAbGlzdCBhbmQgZW1wdHkgY3VycmVudFxuICAgICAgICAgICAgICAgIEBuYXZpZ2F0ZSAxXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN1ZmZpeCA9ICcnXG4gICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBAc2VsZWN0ZWRXb3JkKClcbiAgICAgICAgICAgICAgICBpZiBub3QgY3VycmVudC5lbmRzV2l0aCAnLycgIyB2YWxpZChjdXJyZW50KVxuICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSAnLydcbiAgICAgICAgICAgIGtsb2cgXCJ0YWIgI3tAc2VsZWN0ZWRXb3JkKCl9IHwje2N1cnJlbnR9fCBzdWZmaXggI3tzdWZmaXh9XCJcbiAgICAgICAgICAgIEBjb21wbGV0ZSBzdWZmaXg6c3VmZml4XG4gICAgICAgICAgICBAb25UYWIoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAb25JbnNlcnQgaW5mb1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuXG4gICAgb25JbnNlcnQ6IChpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgQGNsb3NlKClcbiAgICAgICAgXG4gICAgICAgIEB3b3JkID0gXy5sYXN0IGluZm8uYmVmb3JlLnNwbGl0IEBzcGxpdFJlZ0V4cFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEB3b3JkPy5sZW5ndGhcbiAgICAgICAgICAgIGlmIGluZm8uYmVmb3JlLnNwbGl0KCcgJylbMF0gaW4gQGRpckNvbW1hbmRzXG4gICAgICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcygpXG4gICAgICAgIGVsc2UgIFxuICAgICAgICAgICAgQG1hdGNoZXMgPSBAZGlyTWF0Y2hlcyhAd29yZCkuY29uY2F0IEBjbWRNYXRjaGVzKGluZm8uYmVmb3JlKVxuXG4gICAgICAgIGlmIGVtcHR5IEBtYXRjaGVzXG4gICAgICAgICAgICBAbWF0Y2hlcyA9IEBjbWRNYXRjaGVzIGluZm8uYmVmb3JlXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IEBtYXRjaGVzXG4gICAgICAgIFxuICAgICAgICBAbWF0Y2hlcy5zb3J0IChhLGIpIC0+IGJbMV0uY291bnQgLSBhWzFdLmNvdW50XG4gICAgICAgICAgICBcbiAgICAgICAgZmlyc3QgPSBAbWF0Y2hlcy5zaGlmdCgpXG4gICAgICAgIFxuICAgICAgICBpZiBmaXJzdFswXS5zdGFydHNXaXRoIEB3b3JkXG4gICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIEB3b3JkLmxlbmd0aFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBmaXJzdFswXS5zdGFydHNXaXRoIHNsYXNoLmZpbGUgQHdvcmRcbiAgICAgICAgICAgICAgICBAY29tcGxldGlvbiA9IGZpcnN0WzBdLnNsaWNlIHNsYXNoLmZpbGUoQHdvcmQpLmxlbmd0aFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBjb21wbGV0aW9uID0gZmlyc3RbMF1cbiAgICAgICAgXG4gICAgICAgIEBvcGVuIGluZm9cbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgXG4gICAgb3BlbjogKGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgXCIje2luZm8uYmVmb3JlfXwje0Bjb21wbGV0aW9ufXwje2luZm8uYWZ0ZXJ9ICN7QHdvcmR9XCJcbiAgICAgICAgXG4gICAgICAgIEBzcGFuID0gZWxlbSAnc3BhbicgY2xhc3M6J2F1dG9jb21wbGV0ZS1zcGFuJ1xuICAgICAgICBAc3Bhbi50ZXh0Q29udGVudCAgICAgID0gQGNvbXBsZXRpb25cbiAgICAgICAgQHNwYW4uc3R5bGUub3BhY2l0eSAgICA9IDFcbiAgICAgICAgQHNwYW4uc3R5bGUuYmFja2dyb3VuZCA9IFwiIzQ0YVwiXG4gICAgICAgIEBzcGFuLnN0eWxlLmNvbG9yICAgICAgPSBcIiNmZmZcIlxuICAgICAgICBAc3Bhbi5zdHlsZS50cmFuc2Zvcm0gID0gXCJ0cmFuc2xhdGV4KCN7QGVkaXRvci5zaXplLmNoYXJXaWR0aCpAZWRpdG9yLm1haW5DdXJzb3IoKVswXX1weClcIlxuXG4gICAgICAgIGlmIG5vdCBzcGFuQmVmb3JlID0gQGVkaXRvci5zcGFuQmVmb3JlTWFpbigpXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yICdubyBzcGFuSW5mbydcbiAgICAgICAgXG4gICAgICAgIHNpYmxpbmcgPSBzcGFuQmVmb3JlXG4gICAgICAgIHdoaWxlIHNpYmxpbmcgPSBzaWJsaW5nLm5leHRTaWJsaW5nXG4gICAgICAgICAgICBAY2xvbmVzLnB1c2ggc2libGluZy5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICAgICAgQGNsb25lZC5wdXNoIHNpYmxpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBzcGFuQmVmb3JlLnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQgQHNwYW5cbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIEBjbG9uZWQgdGhlbiBjLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyB0aGVuIEBzcGFuLmluc2VydEFkamFjZW50RWxlbWVudCAnYWZ0ZXJlbmQnIGNcbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUNsb25lc0J5IEBjb21wbGV0aW9uLmxlbmd0aCAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQG1hdGNoZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2hvd0xpc3QoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNob3dMaXN0OiAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nIEBtYXRjaGVzXG4gICAgICAgIFxuICAgICAgICBAbGlzdCA9IGVsZW0gY2xhc3M6ICdhdXRvY29tcGxldGUtbGlzdCdcbiAgICAgICAgQGxpc3QuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25Nb3VzZURvd25cbiAgICAgICAgQGxpc3RPZmZzZXQgPSAwXG4gICAgICAgIGlmIHNsYXNoLmRpcihAd29yZCkgYW5kIG5vdCBAd29yZC5lbmRzV2l0aCAnLydcbiAgICAgICAgICAgIEBsaXN0T2Zmc2V0ID0gc2xhc2guZmlsZShAd29yZCkubGVuZ3RoXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXNbMF1bMF0uc3RhcnRzV2l0aCBAd29yZFxuICAgICAgICAgICAgQGxpc3RPZmZzZXQgPSBAd29yZC5sZW5ndGhcbiAgICAgICAgQGxpc3Quc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7LUBlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqQGxpc3RPZmZzZXR9cHgpXCJcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgbWF0Y2ggaW4gQG1hdGNoZXNcbiAgICAgICAgICAgIGl0ZW0gPSBlbGVtIGNsYXNzOidhdXRvY29tcGxldGUtaXRlbScgaW5kZXg6aW5kZXgrK1xuICAgICAgICAgICAgaXRlbS50ZXh0Q29udGVudCA9IG1hdGNoWzBdXG4gICAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQgbWF0Y2hbMV0udHlwZVxuICAgICAgICAgICAgQGxpc3QuYXBwZW5kQ2hpbGQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgbWMgPSBAZWRpdG9yLm1haW5DdXJzb3IoKVxuICAgICAgICBhYm92ZSA9IG1jWzFdICsgQG1hdGNoZXMubGVuZ3RoID49IEBlZGl0b3Iuc2Nyb2xsLmZ1bGxMaW5lc1xuICAgICAgICBpZiBhYm92ZVxuICAgICAgICAgICAgQGxpc3QuY2xhc3NMaXN0LmFkZCAnYWJvdmUnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBsaXN0LmNsYXNzTGlzdC5hZGQgJ2JlbG93J1xuICAgICAgICAgICAgXG4gICAgICAgIGN1cnNvciA9JCAnLm1haW4nIEBlZGl0b3Iudmlld1xuICAgICAgICBjdXJzb3IuYXBwZW5kQ2hpbGQgQGxpc3RcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIGNsb3NlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/XG4gICAgICAgICAgICBAbGlzdC5yZW1vdmVFdmVudExpc3RlbmVyICdjbGljaycgQG9uQ2xpY2tcbiAgICAgICAgICAgIEBsaXN0LnJlbW92ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gQGNsb25lcyA/IFtdXG4gICAgICAgICAgICBjLnJlbW92ZSgpXG5cbiAgICAgICAgZm9yIGMgaW4gQGNsb25lZCA/IFtdXG4gICAgICAgICAgICBjLnN0eWxlLmRpc3BsYXkgPSAnaW5pdGlhbCdcbiAgICAgICAgICAgIFxuICAgICAgICBAc3Bhbj8ucmVtb3ZlKClcbiAgICAgICAgQHNlbGVjdGVkICAgPSAtMVxuICAgICAgICBAbGlzdE9mZnNldCA9IDBcbiAgICAgICAgQGxpc3QgICAgICAgPSBudWxsXG4gICAgICAgIEBzcGFuICAgICAgID0gbnVsbFxuICAgICAgICBAY29tcGxldGlvbiA9IG51bGxcbiAgICAgICAgQG1hdGNoZXMgICAgPSBbXVxuICAgICAgICBAY2xvbmVzICAgICA9IFtdXG4gICAgICAgIEBjbG9uZWQgICAgID0gW11cbiAgICAgICAgQFxuXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGluZGV4ID0gZWxlbS51cEF0dHIgZXZlbnQudGFyZ2V0LCAnaW5kZXgnXG4gICAgICAgIGlmIGluZGV4ICAgICAgICAgICAgXG4gICAgICAgICAgICBAc2VsZWN0IGluZGV4XG4gICAgICAgICAgICBAY29tcGxldGUge31cbiAgICAgICAgc3RvcEV2ZW50IGV2ZW50XG5cbiAgICBjb21wbGV0ZTogKHN1ZmZpeDonJykgLT5cbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IucGFzdGVUZXh0IEBzZWxlY3RlZENvbXBsZXRpb24oKSArIHN1ZmZpeFxuICAgICAgICBAY2xvc2UoKVxuXG4gICAgaXNMaXN0SXRlbVNlbGVjdGVkOiAtPiBAbGlzdCBhbmQgQHNlbGVjdGVkID49IDBcbiAgICAgICAgXG4gICAgc2VsZWN0ZWRXb3JkOiAtPiBAd29yZCtAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICBcbiAgICBzZWxlY3RlZENvbXBsZXRpb246IC0+XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICAjIGtsb2cgJ2NvbXBsZXRpb24nIEBzZWxlY3RlZCAsIEBtYXRjaGVzW0BzZWxlY3RlZF1bMF0sIEBsaXN0T2Zmc2V0XG4gICAgICAgICAgICBAbWF0Y2hlc1tAc2VsZWN0ZWRdWzBdLnNsaWNlIEBsaXN0T2Zmc2V0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjb21wbGV0aW9uXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcbiAgICBcbiAgICBuYXZpZ2F0ZTogKGRlbHRhKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGlzdFxuICAgICAgICBAc2VsZWN0IGNsYW1wIC0xLCBAbWF0Y2hlcy5sZW5ndGgtMSwgQHNlbGVjdGVkK2RlbHRhXG4gICAgICAgIFxuICAgIHNlbGVjdDogKGluZGV4KSAtPlxuICAgICAgICBcbiAgICAgICAgQGxpc3QuY2hpbGRyZW5bQHNlbGVjdGVkXT8uY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG4gICAgICAgIEBzZWxlY3RlZCA9IGluZGV4XG4gICAgICAgIGlmIEBzZWxlY3RlZCA+PSAwXG4gICAgICAgICAgICBAbGlzdC5jaGlsZHJlbltAc2VsZWN0ZWRdPy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcbiAgICAgICAgICAgIEBsaXN0LmNoaWxkcmVuW0BzZWxlY3RlZF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbGlzdD8uY2hpbGRyZW5bMF0/LnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKVxuICAgICAgICBAc3Bhbi5pbm5lckhUTUwgPSBAc2VsZWN0ZWRDb21wbGV0aW9uKClcbiAgICAgICAgQG1vdmVDbG9uZXNCeSBAc3Bhbi5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPCAwXG4gICAgICAgIEBzcGFuLmNsYXNzTGlzdC5hZGQgICAgJ3NlbGVjdGVkJyBpZiBAc2VsZWN0ZWQgPj0gMFxuICAgICAgICBcbiAgICBwcmV2OiAgLT4gQG5hdmlnYXRlIC0xICAgIFxuICAgIG5leHQ6ICAtPiBAbmF2aWdhdGUgMVxuICAgIGxhc3Q6ICAtPiBAbmF2aWdhdGUgQG1hdGNoZXMubGVuZ3RoIC0gQHNlbGVjdGVkXG4gICAgZmlyc3Q6IC0+IEBuYXZpZ2F0ZSAtSW5maW5pdHlcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCBcblxuICAgIG1vdmVDbG9uZXNCeTogKG51bUNoYXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgQGNsb25lc1xuICAgICAgICAgICAgYmVmb3JlTGVuZ3RoID0gQGNsb25lc1swXS5pbm5lckhUTUwubGVuZ3RoXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzEuLi5AY2xvbmVzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBjID0gQGNsb25lc1tjaV1cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUZsb2F0IEBjbG9uZWRbY2ktMV0uc3R5bGUudHJhbnNmb3JtLnNwbGl0KCd0cmFuc2xhdGVYKCcpWzFdXG4gICAgICAgICAgICAgICAgY2hhck9mZnNldCA9IG51bUNoYXJzXG4gICAgICAgICAgICAgICAgY2hhck9mZnNldCArPSBiZWZvcmVMZW5ndGggaWYgY2kgPT0gMVxuICAgICAgICAgICAgICAgIGMuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGV4KCN7b2Zmc2V0K0BlZGl0b3Iuc2l6ZS5jaGFyV2lkdGgqY2hhck9mZnNldH1weClcIlxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICBcblxuICAgIGhhbmRsZU1vZEtleUNvbWJvRXZlbnQ6IChtb2QsIGtleSwgY29tYm8sIGV2ZW50KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY29tYm8gPT0gJ3RhYidcbiAgICAgICAgICAgIEBvblRhYigpXG4gICAgICAgICAgICBzdG9wRXZlbnQgZXZlbnQgIyBwcmV2ZW50IGZvY3VzIGNoYW5nZVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuICd1bmhhbmRsZWQnIGlmIG5vdCBAc3Bhbj9cbiAgICAgICAgXG4gICAgICAgIGlmIGNvbWJvID09ICdyaWdodCdcbiAgICAgICAgICAgIEBjb21wbGV0ZSB7fVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGxpc3Q/IFxuICAgICAgICAgICAgc3dpdGNoIGNvbWJvXG4gICAgICAgICAgICAgICAgd2hlbiAncGFnZSBkb3duJyB0aGVuIHJldHVybiBAbmF2aWdhdGUgKzlcbiAgICAgICAgICAgICAgICB3aGVuICdwYWdlIHVwJyAgIHRoZW4gcmV0dXJuIEBuYXZpZ2F0ZSAtOVxuICAgICAgICAgICAgICAgIHdoZW4gJ2VuZCcgICAgICAgdGhlbiByZXR1cm4gQGxhc3QoKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2hvbWUnICAgICAgdGhlbiByZXR1cm4gQGZpcnN0KClcbiAgICAgICAgICAgICAgICB3aGVuICdkb3duJyAgICAgIHRoZW4gcmV0dXJuIEBuZXh0KClcbiAgICAgICAgICAgICAgICB3aGVuICd1cCcgICAgICAgIHRoZW4gcmV0dXJuIEBwcmV2KClcbiAgICAgICAgQGNsb3NlKCkgICBcbiAgICAgICAgJ3VuaGFuZGxlZCdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZVxuIl19
//# sourceURL=../../coffee/editor/autocomplete.coffee