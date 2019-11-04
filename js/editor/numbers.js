// koffee 1.4.0

/*
000   000  000   000  00     00  0000000    00000000  00000000    0000000
0000  000  000   000  000   000  000   000  000       000   000  000
000 0 000  000   000  000000000  0000000    0000000   0000000    0000000
000  0000  000   000  000 0 000  000   000  000       000   000       000
000   000   0000000   000   000  0000000    00000000  000   000  0000000
 */
var $, Numbers, elem, event, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), elem = ref.elem, $ = ref.$;

event = require('events');

Numbers = (function(superClass) {
    extend(Numbers, superClass);

    function Numbers(editor) {
        this.editor = editor;
        this.updateColor = bind(this.updateColor, this);
        this.updateColors = bind(this.updateColors, this);
        this.onFontSizeChange = bind(this.onFontSizeChange, this);
        this.onClearLines = bind(this.onClearLines, this);
        this.onLinesShifted = bind(this.onLinesShifted, this);
        this.onLinesShown = bind(this.onLinesShown, this);
        this.onChanged = bind(this.onChanged, this);
        Numbers.__super__.constructor.call(this);
        this.lineDivs = {};
        this.elem = $(".numbers", this.editor.view);
        this.editor.on('clearLines', this.onClearLines);
        this.editor.on('linesShown', this.onLinesShown);
        this.editor.on('linesShifted', this.onLinesShifted);
        this.editor.on('fontSizeChanged', this.onFontSizeChange);
        this.editor.on('changed', this.onChanged);
        this.editor.on('highlight', this.updateColors);
        this.onFontSizeChange();
    }

    Numbers.prototype.onChanged = function(changeInfo) {
        var change, i, len, li, ref1, results;
        if (changeInfo.cursors || changeInfo.selects) {
            this.updateColors();
            return;
        }
        ref1 = changeInfo.changes;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            li = change.doIndex;
            if (change.change === 'changed') {
                results.push(this.updateColor(li));
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    Numbers.prototype.onLinesShown = function(top, bot, num) {
        var div, i, li, ref1, ref2;
        this.elem.innerHTML = '';
        this.lineDivs = {};
        for (li = i = ref1 = top, ref2 = bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
            div = this.addLine(li);
            this.emit('numberAdded', {
                numberDiv: div,
                numberSpan: div.firstChild,
                lineIndex: li
            });
            this.updateColor(li);
        }
        return this.updateLinePositions();
    };

    Numbers.prototype.onLinesShifted = function(top, bot, num) {
        var divInto, oldBot, oldTop;
        oldTop = top - num;
        oldBot = bot - num;
        divInto = (function(_this) {
            return function(li, lo) {
                var numberDiv;
                if (!_this.lineDivs[lo]) {
                    console.log(_this.editor.name + ".onLinesShifted.divInto -- no number div? top " + top + " bot " + bot + " num " + num + " lo " + lo + " li " + li);
                    return;
                }
                numberDiv = _this.lineDivs[li] = _this.lineDivs[lo];
                delete _this.lineDivs[lo];
                return _this.updateColor(li);
            };
        })(this);
        if (num > 0) {
            while (oldBot < bot) {
                oldBot += 1;
                divInto(oldBot, oldTop);
                oldTop += 1;
            }
        } else {
            while (oldTop > top) {
                oldTop -= 1;
                divInto(oldTop, oldBot);
                oldBot -= 1;
            }
        }
        return this.updateLinePositions();
    };

    Numbers.prototype.updateLinePositions = function() {
        var div, li, ref1, results, y;
        ref1 = this.lineDivs;
        results = [];
        for (li in ref1) {
            div = ref1[li];
            if (!(div != null ? div.style : void 0)) {
                continue;
            }
            y = this.editor.size.lineHeight * (li - this.editor.scroll.top);
            results.push(div.style.transform = "translate3d(0, " + y + "px, 0)");
        }
        return results;
    };

    Numbers.prototype.addLine = function(li) {
        var div, text;
        text = '▶';
        div = elem({
            "class": 'linenumber',
            child: elem('span', {
                text: text
            })
        });
        div.style.height = this.editor.size.lineHeight + "px";
        this.lineDivs[li] = div;
        this.elem.appendChild(div);
        return div;
    };

    Numbers.prototype.onClearLines = function() {
        this.lineDivs = {};
        return this.elem.innerHTML = "";
    };

    Numbers.prototype.onFontSizeChange = function() {
        var fsz;
        fsz = Math.min(22, this.editor.size.fontSize - 4);
        return this.elem.style.fontSize = fsz + "px";
    };

    Numbers.prototype.updateColors = function() {
        var i, li, ref1, ref2, results;
        if (this.editor.scroll.bot > this.editor.scroll.top) {
            results = [];
            for (li = i = ref1 = this.editor.scroll.top, ref2 = this.editor.scroll.bot; ref1 <= ref2 ? i <= ref2 : i >= ref2; li = ref1 <= ref2 ? ++i : --i) {
                results.push(this.updateColor(li));
            }
            return results;
        }
    };

    Numbers.prototype.updateColor = function(li) {
        var ci, cls, hi, s, si;
        if (this.lineDivs[li] == null) {
            return;
        }
        si = (function() {
            var i, len, ref1, results;
            ref1 = rangesFromTopToBotInRanges(li, li, this.editor.selections());
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                s = ref1[i];
                results.push(s[0]);
            }
            return results;
        }).call(this);
        hi = (function() {
            var i, len, ref1, results;
            ref1 = rangesFromTopToBotInRanges(li, li, this.editor.highlights());
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                s = ref1[i];
                results.push(s[0]);
            }
            return results;
        }).call(this);
        ci = (function() {
            var i, len, ref1, results;
            ref1 = rangesFromTopToBotInRanges(li, li, rangesFromPositions(this.editor.cursors()));
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                s = ref1[i];
                results.push(s[0]);
            }
            return results;
        }).call(this);
        cls = '';
        if (indexOf.call(ci, li) >= 0) {
            cls += ' cursored';
        }
        if (li === this.editor.mainCursor()[1]) {
            cls += ' main';
        }
        if (indexOf.call(si, li) >= 0) {
            cls += ' selected';
        }
        if (indexOf.call(hi, li) >= 0) {
            cls += ' highligd';
        }
        this.lineDivs[li].className = 'linenumber' + cls;
        return this.updateMeta(li);
    };

    Numbers.prototype.updateMeta = function(li) {
        var clss, i, len, m, ref1, ref2, ref3, ref4, ref5;
        m = (ref1 = this.editor.meta.lineMetas[li]) != null ? ref1[0] : void 0;
        if (m && ((ref2 = m[2].number) != null ? ref2.clss : void 0)) {
            ref4 = (ref3 = m[2].number) != null ? ref3.clss.split(' ') : void 0;
            for (i = 0, len = ref4.length; i < len; i++) {
                clss = ref4[i];
                this.lineDivs[li].classList.add(clss);
            }
        }
        return this.lineDivs[li].firstChild.innerHTML = m && (((ref5 = m[2].number) != null ? ref5.text : void 0) || '▪') || '●';
    };

    return Numbers;

})(event);

module.exports = Numbers;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVycy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNEJBQUE7SUFBQTs7Ozs7QUFRQSxNQUFjLE9BQUEsQ0FBUSxLQUFSLENBQWQsRUFBRSxlQUFGLEVBQVE7O0FBRVIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxRQUFSOztBQUVGOzs7SUFFQyxpQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7O1FBRUEsdUNBQUE7UUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZO1FBRVosSUFBQyxDQUFBLElBQUQsR0FBTyxDQUFBLENBQUUsVUFBRixFQUFhLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBckI7UUFFUCxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQThCLElBQUMsQ0FBQSxZQUEvQjtRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsY0FBWCxFQUE4QixJQUFDLENBQUEsY0FBL0I7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxpQkFBWCxFQUE4QixJQUFDLENBQUEsZ0JBQS9CO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsU0FBWCxFQUE4QixJQUFDLENBQUEsU0FBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxXQUFYLEVBQThCLElBQUMsQ0FBQSxZQUEvQjtRQUdBLElBQUMsQ0FBQSxnQkFBRCxDQUFBO0lBakJEOztzQkFtQkgsU0FBQSxHQUFXLFNBQUMsVUFBRDtBQUVQLFlBQUE7UUFBQSxJQUFHLFVBQVUsQ0FBQyxPQUFYLElBQXNCLFVBQVUsQ0FBQyxPQUFwQztZQUNJLElBQUMsQ0FBQSxZQUFELENBQUE7QUFDQSxtQkFGSjs7QUFJQTtBQUFBO2FB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QUEsR0FBTTtRQUNOLElBQUcsYUFBTSxFQUFOLEVBQUEsRUFBQSxNQUFIO1lBQ0ksR0FBQSxJQUFPLFlBRFg7O1FBRUEsSUFBRyxFQUFBLEtBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBcUIsQ0FBQSxDQUFBLENBQTlCO1lBQ0ksR0FBQSxJQUFPLFFBRFg7O1FBRUEsSUFBRyxhQUFNLEVBQU4sRUFBQSxFQUFBLE1BQUg7WUFDSSxHQUFBLElBQU8sWUFEWDs7UUFFQSxJQUFHLGFBQU0sRUFBTixFQUFBLEVBQUEsTUFBSDtZQUNJLEdBQUEsSUFBTyxZQURYOztRQUdBLElBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQSxDQUFHLENBQUMsU0FBZCxHQUEwQixZQUFBLEdBQWU7ZUFDekMsSUFBQyxDQUFBLFVBQUQsQ0FBWSxFQUFaO0lBcEJTOztzQkFzQmIsVUFBQSxHQUFZLFNBQUMsRUFBRDtBQUVSLFlBQUE7UUFBQSxDQUFBLHlEQUFnQyxDQUFBLENBQUE7UUFDaEMsSUFBRyxDQUFBLHdDQUFpQixDQUFFLGNBQXRCO0FBQ0k7QUFBQSxpQkFBQSxzQ0FBQTs7Z0JBQ0ksSUFBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBLENBQUcsQ0FBQyxTQUFTLENBQUMsR0FBeEIsQ0FBNEIsSUFBNUI7QUFESixhQURKOztlQUdBLElBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQSxDQUFHLENBQUMsVUFBVSxDQUFDLFNBQXpCLEdBQXFDLENBQUEsSUFBTSxxQ0FBWSxDQUFFLGNBQWIsSUFBcUIsR0FBdEIsQ0FBTixJQUFvQztJQU5qRTs7OztHQTFLTTs7QUFrTHRCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwXG4wMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4wMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcbiMjI1xuXG57IGVsZW0sICQgfSA9IHJlcXVpcmUgJ2t4aydcblxuZXZlbnQgPSByZXF1aXJlICdldmVudHMnXG5cbmNsYXNzIE51bWJlcnMgZXh0ZW5kcyBldmVudFxuXG4gICAgQDogKEBlZGl0b3IpIC0+XG5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBAbGluZURpdnMgPSB7fVxuXG4gICAgICAgIEBlbGVtID0kIFwiLm51bWJlcnNcIiBAZWRpdG9yLnZpZXdcblxuICAgICAgICBAZWRpdG9yLm9uICdjbGVhckxpbmVzJyAgICAgICBAb25DbGVhckxpbmVzXG5cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNTaG93bicgICAgICAgQG9uTGluZXNTaG93blxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1NoaWZ0ZWQnICAgICBAb25MaW5lc1NoaWZ0ZWRcblxuICAgICAgICBAZWRpdG9yLm9uICdmb250U2l6ZUNoYW5nZWQnICBAb25Gb250U2l6ZUNoYW5nZVxuICAgICAgICBAZWRpdG9yLm9uICdjaGFuZ2VkJyAgICAgICAgICBAb25DaGFuZ2VkXG4gICAgICAgIEBlZGl0b3Iub24gJ2hpZ2hsaWdodCcgICAgICAgIEB1cGRhdGVDb2xvcnNcbiAgICAgICAgIyBAZWRpdG9yLm9uICdsaW5lc1NldCcgICAgICAgICA9PiBrbG9nICdsaW5lc1NldCcgIzsgQHVwZGF0ZUNvbG9ycygpXG5cbiAgICAgICAgQG9uRm9udFNpemVDaGFuZ2UoKVxuXG4gICAgb25DaGFuZ2VkOiAoY2hhbmdlSW5mbykgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNoYW5nZUluZm8uY3Vyc29ycyBvciBjaGFuZ2VJbmZvLnNlbGVjdHNcbiAgICAgICAgICAgIEB1cGRhdGVDb2xvcnMoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZUluZm8uY2hhbmdlc1xuICAgICAgICAgICAgbGkgPSBjaGFuZ2UuZG9JbmRleFxuICAgICAgICAgICAgaWYgY2hhbmdlLmNoYW5nZSA9PSAnY2hhbmdlZCdcbiAgICAgICAgICAgICAgICBAdXBkYXRlQ29sb3IgbGlcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkxpbmVzU2hvd246ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cblxuICAgICAgICAgICAgZGl2ID0gQGFkZExpbmUgbGlcblxuICAgICAgICAgICAgQGVtaXQgJ251bWJlckFkZGVkJyxcbiAgICAgICAgICAgICAgICBudW1iZXJEaXY6ICBkaXZcbiAgICAgICAgICAgICAgICBudW1iZXJTcGFuOiBkaXYuZmlyc3RDaGlsZFxuICAgICAgICAgICAgICAgIGxpbmVJbmRleDogIGxpXG5cbiAgICAgICAgICAgIEB1cGRhdGVDb2xvciBsaVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25MaW5lc1NoaWZ0ZWQ6ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIG9sZFRvcCA9IHRvcCAtIG51bVxuICAgICAgICBvbGRCb3QgPSBib3QgLSBudW1cblxuICAgICAgICBkaXZJbnRvID0gKGxpLGxvKSA9PlxuXG4gICAgICAgICAgICBpZiBub3QgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgICAgIGxvZyBcIiN7QGVkaXRvci5uYW1lfS5vbkxpbmVzU2hpZnRlZC5kaXZJbnRvIC0tIG5vIG51bWJlciBkaXY/IHRvcCAje3RvcH0gYm90ICN7Ym90fSBudW0gI3tudW19IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgbnVtYmVyRGl2ID0gQGxpbmVEaXZzW2xpXSA9IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIGRlbGV0ZSBAbGluZURpdnNbbG9dXG5cbiAgICAgICAgICAgIEB1cGRhdGVDb2xvciBsaVxuXG4gICAgICAgIGlmIG51bSA+IDBcbiAgICAgICAgICAgIHdoaWxlIG9sZEJvdCA8IGJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCArPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRCb3QsIG9sZFRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCArPSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIG9sZFRvcCA+IHRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCAtPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRUb3AsIG9sZEJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCAtPSAxXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgdXBkYXRlTGluZVBvc2l0aW9uczogLT5cblxuICAgICAgICBmb3IgbGksIGRpdiBvZiBAbGluZURpdnNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBkaXY/LnN0eWxlXG4gICAgICAgICAgICB5ID0gQGVkaXRvci5zaXplLmxpbmVIZWlnaHQgKiAobGkgLSBAZWRpdG9yLnNjcm9sbC50b3ApXG4gICAgICAgICAgICBkaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUzZCgwLCAje3l9cHgsIDApXCJcblxuICAgIGFkZExpbmU6IChsaSkgLT5cblxuICAgICAgICB0ZXh0ID0gJ+KWtidcbiAgICAgICAgZGl2ID0gZWxlbSBjbGFzczonbGluZW51bWJlcicgY2hpbGQ6IGVsZW0gJ3NwYW4nIHRleHQ6dGV4dFxuICAgICAgICBkaXYuc3R5bGUuaGVpZ2h0ID0gXCIje0BlZGl0b3Iuc2l6ZS5saW5lSGVpZ2h0fXB4XCJcbiAgICAgICAgQGxpbmVEaXZzW2xpXSA9IGRpdlxuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBkaXZcbiAgICAgICAgZGl2XG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIG9uQ2xlYXJMaW5lczogPT5cblxuICAgICAgICBAbGluZURpdnMgPSB7fVxuICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBcIlwiXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG5cbiAgICBvbkZvbnRTaXplQ2hhbmdlOiA9PlxuXG4gICAgICAgIGZzeiA9IE1hdGgubWluIDIyLCBAZWRpdG9yLnNpemUuZm9udFNpemUtNFxuICAgICAgICBAZWxlbS5zdHlsZS5mb250U2l6ZSA9IFwiI3tmc3p9cHhcIlxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICB1cGRhdGVDb2xvcnM6ID0+XG5cbiAgICAgICAgaWYgQGVkaXRvci5zY3JvbGwuYm90ID4gQGVkaXRvci5zY3JvbGwudG9wXG4gICAgICAgICAgICAjIGtsb2cgXCJjb2xvcnMgI3tAZWRpdG9yLnNjcm9sbC50b3B9ICN7QGVkaXRvci5zY3JvbGwuYm90fVwiXG4gICAgICAgICAgICBmb3IgbGkgaW4gW0BlZGl0b3Iuc2Nyb2xsLnRvcC4uQGVkaXRvci5zY3JvbGwuYm90XVxuICAgICAgICAgICAgICAgIEB1cGRhdGVDb2xvciBsaVxuXG4gICAgdXBkYXRlQ29sb3I6IChsaSkgPT5cblxuICAgICAgICAjIGtsb2cgXCJjb2xvciAje2xpfVwiXG4gICAgICAgIHJldHVybiBpZiBub3QgQGxpbmVEaXZzW2xpXT8gIyBvazogZS5nLiBjb21tYW5kbGlzdFxuXG4gICAgICAgIHNpID0gKHNbMF0gZm9yIHMgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIGxpLCBAZWRpdG9yLnNlbGVjdGlvbnMoKSlcbiAgICAgICAgaGkgPSAoc1swXSBmb3IgcyBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgbGksIEBlZGl0b3IuaGlnaGxpZ2h0cygpKVxuICAgICAgICBjaSA9IChzWzBdIGZvciBzIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBsaSwgcmFuZ2VzRnJvbVBvc2l0aW9ucyBAZWRpdG9yLmN1cnNvcnMoKSlcblxuICAgICAgICBjbHMgPSAnJ1xuICAgICAgICBpZiBsaSBpbiBjaVxuICAgICAgICAgICAgY2xzICs9ICcgY3Vyc29yZWQnXG4gICAgICAgIGlmIGxpID09IEBlZGl0b3IubWFpbkN1cnNvcigpWzFdXG4gICAgICAgICAgICBjbHMgKz0gJyBtYWluJ1xuICAgICAgICBpZiBsaSBpbiBzaVxuICAgICAgICAgICAgY2xzICs9ICcgc2VsZWN0ZWQnXG4gICAgICAgIGlmIGxpIGluIGhpXG4gICAgICAgICAgICBjbHMgKz0gJyBoaWdobGlnZCdcblxuICAgICAgICBAbGluZURpdnNbbGldLmNsYXNzTmFtZSA9ICdsaW5lbnVtYmVyJyArIGNsc1xuICAgICAgICBAdXBkYXRlTWV0YSBsaVxuICAgICAgICBcbiAgICB1cGRhdGVNZXRhOiAobGkpIC0+XG5cbiAgICAgICAgbSA9IEBlZGl0b3IubWV0YS5saW5lTWV0YXNbbGldP1swXVxuICAgICAgICBpZiBtIGFuZCBtWzJdLm51bWJlcj8uY2xzc1xuICAgICAgICAgICAgZm9yIGNsc3MgaW4gbVsyXS5udW1iZXI/LmNsc3Muc3BsaXQgJyAnXG4gICAgICAgICAgICAgICAgQGxpbmVEaXZzW2xpXS5jbGFzc0xpc3QuYWRkIGNsc3NcbiAgICAgICAgQGxpbmVEaXZzW2xpXS5maXJzdENoaWxkLmlubmVySFRNTCA9IG0gYW5kIChtWzJdLm51bWJlcj8udGV4dCBvciAn4paqJykgb3IgJ+KXjydcblxubW9kdWxlLmV4cG9ydHMgPSBOdW1iZXJzXG4iXX0=
//# sourceURL=../../coffee/editor/numbers.coffee