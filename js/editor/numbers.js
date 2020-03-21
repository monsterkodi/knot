// koffee 1.12.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVycy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvZWRpdG9yIiwic291cmNlcyI6WyJudW1iZXJzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw0QkFBQTtJQUFBOzs7OztBQVFBLE1BQWMsT0FBQSxDQUFRLEtBQVIsQ0FBZCxFQUFFLGVBQUYsRUFBUTs7QUFFUixLQUFBLEdBQVEsT0FBQSxDQUFRLFFBQVI7O0FBRUY7OztJQUVDLGlCQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7UUFFQSx1Q0FBQTtRQUNBLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxVQUFGLEVBQWEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFyQjtRQUVQLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUE4QixJQUFDLENBQUEsWUFBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQThCLElBQUMsQ0FBQSxjQUEvQjtRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGlCQUFYLEVBQThCLElBQUMsQ0FBQSxnQkFBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxTQUFYLEVBQThCLElBQUMsQ0FBQSxTQUEvQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFdBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBR0EsSUFBQyxDQUFBLGdCQUFELENBQUE7SUFqQkQ7O3NCQW1CSCxTQUFBLEdBQVcsU0FBQyxVQUFEO0FBRVAsWUFBQTtRQUFBLElBQUcsVUFBVSxDQUFDLE9BQVgsSUFBc0IsVUFBVSxDQUFDLE9BQXBDO1lBQ0ksSUFBQyxDQUFBLFlB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QUEsQ0FBRSxDQUFBLENBQUE7QUFBRjs7O1FBRU4sR0FBQSxHQUFNO1FBQ04sSUFBRyxhQUFNLEVBQU4sRUFBQSxFQUFBLE1BQUg7WUFDSSxHQUFBLElBQU8sWUFEWDs7UUFFQSxJQUFHLEVBQUEsS0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQSxDQUFxQixDQUFBLENBQUEsQ0FBOUI7WUFDSSxHQUFBLElBQU8sUUFEWDs7UUFFQSxJQUFHLGFBQU0sRUFBTixFQUFBLEVBQUEsTUFBSDtZQUNJLEdBQUEsSUFBTyxZQURYOztRQUVBLElBQUcsYUFBTSxFQUFOLEVBQUEsRUFBQSxNQUFIO1lBQ0ksR0FBQSxJQUFPLFlBRFg7O1FBR0EsSUFBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBLENBQUcsQ0FBQyxTQUFkLEdBQTBCLFlBQUEsR0FBZTtlQUN6QyxJQUFDLENBQUEsVUFBRCxDQUFZLEVBQVo7SUFwQlM7O3NCQXNCYixVQUFBLEdBQVksU0FBQyxFQUFEO0FBRVIsWUFBQTtRQUFBLENBQUEseURBQWdDLENBQUEsQ0FBQTtRQUNoQyxJQUFHLENBQUEsd0NBQWlCLENBQUUsY0FBdEI7QUFDSTtBQUFBLGlCQUFBLHNDQUFBOztnQkFDSSxJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUF4QixDQUE0QixJQUE1QjtBQURKLGFBREo7O2VBR0EsSUFBQyxDQUFBLFFBQVMsQ0FBQSxFQUFBLENBQUcsQ0FBQyxVQUFVLENBQUMsU0FBekIsR0FBcUMsQ0FBQSxJQUFNLHFDQUFZLENBQUUsY0FBYixJQUFxQixHQUF0QixDQUFOLElBQW9DO0lBTmpFOzs7O0dBMUtNOztBQWtMdEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDBcbjAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbjAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDBcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuIyMjXG5cbnsgZWxlbSwgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5ldmVudCA9IHJlcXVpcmUgJ2V2ZW50cydcblxuY2xhc3MgTnVtYmVycyBleHRlbmRzIGV2ZW50XG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG5cbiAgICAgICAgQGVsZW0gPSQgXCIubnVtYmVyc1wiIEBlZGl0b3Iudmlld1xuXG4gICAgICAgIEBlZGl0b3Iub24gJ2NsZWFyTGluZXMnICAgICAgIEBvbkNsZWFyTGluZXNcblxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1Nob3duJyAgICAgICBAb25MaW5lc1Nob3duXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2hpZnRlZCcgICAgIEBvbkxpbmVzU2hpZnRlZFxuXG4gICAgICAgIEBlZGl0b3Iub24gJ2ZvbnRTaXplQ2hhbmdlZCcgIEBvbkZvbnRTaXplQ2hhbmdlXG4gICAgICAgIEBlZGl0b3Iub24gJ2NoYW5nZWQnICAgICAgICAgIEBvbkNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5vbiAnaGlnaGxpZ2h0JyAgICAgICAgQHVwZGF0ZUNvbG9yc1xuICAgICAgICAjIEBlZGl0b3Iub24gJ2xpbmVzU2V0JyAgICAgICAgID0+IGtsb2cgJ2xpbmVzU2V0JyAjOyBAdXBkYXRlQ29sb3JzKClcblxuICAgICAgICBAb25Gb250U2l6ZUNoYW5nZSgpXG5cbiAgICBvbkNoYW5nZWQ6IChjaGFuZ2VJbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgY2hhbmdlSW5mby5jdXJzb3JzIG9yIGNoYW5nZUluZm8uc2VsZWN0c1xuICAgICAgICAgICAgQHVwZGF0ZUNvbG9ycygpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBsaSA9IGNoYW5nZS5kb0luZGV4XG4gICAgICAgICAgICBpZiBjaGFuZ2UuY2hhbmdlID09ICdjaGFuZ2VkJ1xuICAgICAgICAgICAgICAgIEB1cGRhdGVDb2xvciBsaVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMDAgICAwMDBcblxuICAgIG9uTGluZXNTaG93bjogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gJydcbiAgICAgICAgQGxpbmVEaXZzID0ge31cblxuICAgICAgICBmb3IgbGkgaW4gW3RvcC4uYm90XVxuXG4gICAgICAgICAgICBkaXYgPSBAYWRkTGluZSBsaVxuXG4gICAgICAgICAgICBAZW1pdCAnbnVtYmVyQWRkZWQnLFxuICAgICAgICAgICAgICAgIG51bWJlckRpdjogIGRpdlxuICAgICAgICAgICAgICAgIG51bWJlclNwYW46IGRpdi5maXJzdENoaWxkXG4gICAgICAgICAgICAgICAgbGluZUluZGV4OiAgbGlcblxuICAgICAgICAgICAgQHVwZGF0ZUNvbG9yIGxpXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwMDAwICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbkxpbmVzU2hpZnRlZDogKHRvcCwgYm90LCBudW0pID0+XG5cbiAgICAgICAgb2xkVG9wID0gdG9wIC0gbnVtXG4gICAgICAgIG9sZEJvdCA9IGJvdCAtIG51bVxuXG4gICAgICAgIGRpdkludG8gPSAobGksbG8pID0+XG5cbiAgICAgICAgICAgIGlmIG5vdCBAbGluZURpdnNbbG9dXG4gICAgICAgICAgICAgICAgbG9nIFwiI3tAZWRpdG9yLm5hbWV9Lm9uTGluZXNTaGlmdGVkLmRpdkludG8gLS0gbm8gbnVtYmVyIGRpdj8gdG9wICN7dG9wfSBib3QgI3tib3R9IG51bSAje251bX0gbG8gI3tsb30gbGkgI3tsaX1cIlxuICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgICAgICBudW1iZXJEaXYgPSBAbGluZURpdnNbbGldID0gQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgZGVsZXRlIEBsaW5lRGl2c1tsb11cblxuICAgICAgICAgICAgQHVwZGF0ZUNvbG9yIGxpXG5cbiAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgd2hpbGUgb2xkQm90IDwgYm90XG4gICAgICAgICAgICAgICAgb2xkQm90ICs9IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZEJvdCwgb2xkVG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wICs9IDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgb2xkVG9wID4gdG9wXG4gICAgICAgICAgICAgICAgb2xkVG9wIC09IDFcbiAgICAgICAgICAgICAgICBkaXZJbnRvIG9sZFRvcCwgb2xkQm90XG4gICAgICAgICAgICAgICAgb2xkQm90IC09IDFcblxuICAgICAgICBAdXBkYXRlTGluZVBvc2l0aW9ucygpXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICB1cGRhdGVMaW5lUG9zaXRpb25zOiAtPlxuXG4gICAgICAgIGZvciBsaSwgZGl2IG9mIEBsaW5lRGl2c1xuICAgICAgICAgICAgY29udGludWUgaWYgbm90IGRpdj8uc3R5bGVcbiAgICAgICAgICAgIHkgPSBAZWRpdG9yLnNpemUubGluZUhlaWdodCAqIChsaSAtIEBlZGl0b3Iuc2Nyb2xsLnRvcClcbiAgICAgICAgICAgIGRpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZTNkKDAsICN7eX1weCwgMClcIlxuXG4gICAgYWRkTGluZTogKGxpKSAtPlxuXG4gICAgICAgIHRleHQgPSAn4pa2J1xuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOidsaW5lbnVtYmVyJyBjaGlsZDogZWxlbSAnc3BhbicgdGV4dDp0ZXh0XG4gICAgICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIiN7QGVkaXRvci5zaXplLmxpbmVIZWlnaHR9cHhcIlxuICAgICAgICBAbGluZURpdnNbbGldID0gZGl2XG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIGRpdlxuICAgICAgICBkaXZcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25DbGVhckxpbmVzOiA9PlxuXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9IFwiXCJcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRm9udFNpemVDaGFuZ2U6ID0+XG5cbiAgICAgICAgZnN6ID0gTWF0aC5taW4gMjIsIEBlZGl0b3Iuc2l6ZS5mb250U2l6ZS00XG4gICAgICAgIEBlbGVtLnN0eWxlLmZvbnRTaXplID0gXCIje2Zzen1weFwiXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxuICAgIHVwZGF0ZUNvbG9yczogPT5cblxuICAgICAgICBpZiBAZWRpdG9yLnNjcm9sbC5ib3QgPiBAZWRpdG9yLnNjcm9sbC50b3BcbiAgICAgICAgICAgICMga2xvZyBcImNvbG9ycyAje0BlZGl0b3Iuc2Nyb2xsLnRvcH0gI3tAZWRpdG9yLnNjcm9sbC5ib3R9XCJcbiAgICAgICAgICAgIGZvciBsaSBpbiBbQGVkaXRvci5zY3JvbGwudG9wLi5AZWRpdG9yLnNjcm9sbC5ib3RdXG4gICAgICAgICAgICAgICAgQHVwZGF0ZUNvbG9yIGxpXG5cbiAgICB1cGRhdGVDb2xvcjogKGxpKSA9PlxuXG4gICAgICAgICMga2xvZyBcImNvbG9yICN7bGl9XCJcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGluZURpdnNbbGldPyAjIG9rOiBlLmcuIGNvbW1hbmRsaXN0XG5cbiAgICAgICAgc2kgPSAoc1swXSBmb3IgcyBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgbGksIEBlZGl0b3Iuc2VsZWN0aW9ucygpKVxuICAgICAgICBoaSA9IChzWzBdIGZvciBzIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBsaSwgQGVkaXRvci5oaWdobGlnaHRzKCkpXG4gICAgICAgIGNpID0gKHNbMF0gZm9yIHMgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIGxpLCByYW5nZXNGcm9tUG9zaXRpb25zIEBlZGl0b3IuY3Vyc29ycygpKVxuXG4gICAgICAgIGNscyA9ICcnXG4gICAgICAgIGlmIGxpIGluIGNpXG4gICAgICAgICAgICBjbHMgKz0gJyBjdXJzb3JlZCdcbiAgICAgICAgaWYgbGkgPT0gQGVkaXRvci5tYWluQ3Vyc29yKClbMV1cbiAgICAgICAgICAgIGNscyArPSAnIG1haW4nXG4gICAgICAgIGlmIGxpIGluIHNpXG4gICAgICAgICAgICBjbHMgKz0gJyBzZWxlY3RlZCdcbiAgICAgICAgaWYgbGkgaW4gaGlcbiAgICAgICAgICAgIGNscyArPSAnIGhpZ2hsaWdkJ1xuXG4gICAgICAgIEBsaW5lRGl2c1tsaV0uY2xhc3NOYW1lID0gJ2xpbmVudW1iZXInICsgY2xzXG4gICAgICAgIEB1cGRhdGVNZXRhIGxpXG4gICAgICAgIFxuICAgIHVwZGF0ZU1ldGE6IChsaSkgLT5cblxuICAgICAgICBtID0gQGVkaXRvci5tZXRhLmxpbmVNZXRhc1tsaV0/WzBdXG4gICAgICAgIGlmIG0gYW5kIG1bMl0ubnVtYmVyPy5jbHNzXG4gICAgICAgICAgICBmb3IgY2xzcyBpbiBtWzJdLm51bWJlcj8uY2xzcy5zcGxpdCAnICdcbiAgICAgICAgICAgICAgICBAbGluZURpdnNbbGldLmNsYXNzTGlzdC5hZGQgY2xzc1xuICAgICAgICBAbGluZURpdnNbbGldLmZpcnN0Q2hpbGQuaW5uZXJIVE1MID0gbSBhbmQgKG1bMl0ubnVtYmVyPy50ZXh0IG9yICfilqonKSBvciAn4pePJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IE51bWJlcnNcbiJdfQ==
//# sourceURL=../../coffee/editor/numbers.coffee