// koffee 1.4.0

/*
000   000  000   000  00     00  0000000    00000000  00000000    0000000
0000  000  000   000  000   000  000   000  000       000   000  000
000 0 000  000   000  000000000  0000000    0000000   0000000    0000000
000  0000  000   000  000 0 000  000   000  000       000   000       000
000   000   0000000   000   000  0000000    00000000  000   000  0000000
 */
var $, Numbers, _, elem, event, klog, ref, setStyle,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), setStyle = ref.setStyle, elem = ref.elem, klog = ref.klog, $ = ref.$, _ = ref._;

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
        Numbers.__super__.constructor.call(this);
        this.lineDivs = {};
        this.elem = $(".numbers", this.editor.view);
        this.editor.on('clearLines', this.onClearLines);
        this.editor.on('linesShown', this.onLinesShown);
        this.editor.on('linesShifted', this.onLinesShifted);
        this.editor.on('fontSizeChanged', this.onFontSizeChange);
        this.editor.on('highlight', this.updateColors);
        this.editor.on('changed', this.updateColors);
        this.editor.on('linesSet', this.updateColors);
        this.onFontSizeChange();
    }

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
        var fs;
        fs = Math.min(22, this.editor.size.fontSize - 4);
        return this.elem.style.fontSize = fs + "px";
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
        var m, ref1, ref2, ref3;
        m = (ref1 = this.editor.meta.lineMetas[li]) != null ? ref1[0] : void 0;
        if (m && ((ref2 = m[2].number) != null ? ref2.clss : void 0)) {
            this.lineDivs[li].classList.add(m[2].number.clss);
        }
        return this.lineDivs[li].firstChild.innerHTML = m && (((ref3 = m[2].number) != null ? ref3.text : void 0) || '▪') || '●';
    };

    return Numbers;

})(event);

module.exports = Numbers;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVycy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsK0NBQUE7SUFBQTs7Ozs7QUFRQSxNQUFpQyxPQUFBLENBQVEsS0FBUixDQUFqQyxFQUFFLHVCQUFGLEVBQVksZUFBWixFQUFrQixlQUFsQixFQUF3QixTQUF4QixFQUEyQjs7QUFFM0IsS0FBQSxHQUFRLE9BQUEsQ0FBUSxRQUFSOztBQUVGOzs7SUFFQyxpQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7Ozs7UUFFQSx1Q0FBQTtRQUNBLElBQUMsQ0FBQSxRQUFELEdBQVk7UUFFWixJQUFDLENBQUEsSUFBRCxHQUFPLENBQUEsQ0FBRSxVQUFGLEVBQWEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFyQjtRQUVQLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFlBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsWUFBWCxFQUE4QixJQUFDLENBQUEsWUFBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxjQUFYLEVBQThCLElBQUMsQ0FBQSxjQUEvQjtRQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGlCQUFYLEVBQThCLElBQUMsQ0FBQSxnQkFBL0I7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxXQUFYLEVBQThCLElBQUMsQ0FBQSxZQUEvQjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLFNBQVgsRUFBOEIsSUFBQyxDQUFBLFlBQS9CO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxFQUFSLENBQVcsVUFBWCxFQUE4QixJQUFDLENBQUEsWUFBL0I7UUFFQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQTtJQWpCRDs7c0JBeUJILFlBQUEsR0FBYyxTQUFDLEdBQUQsRUFBTSxH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TSxFQUFOLEVBQUEsRUFBQSxNQUFIO1lBQ0ksR0FBQSxJQUFPLFlBRFg7O1FBRUEsSUFBRyxhQUFNLEVBQU4sRUFBQSxFQUFBLE1BQUg7WUFDSSxHQUFBLElBQU8sWUFEWDs7UUFHQSxJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFNBQWQsR0FBMEIsWUFBQSxHQUFlO2VBQ3pDLElBQUMsQ0FBQSxVQUFELENBQVksRUFBWjtJQW5CUzs7c0JBcUJiLFVBQUEsR0FBWSxTQUFDLEVBQUQ7QUFFUixZQUFBO1FBQUEsQ0FBQSx5REFBZ0MsQ0FBQSxDQUFBO1FBQ2hDLElBQUcsQ0FBQSx3Q0FBaUIsQ0FBRSxjQUF0QjtZQUNJLElBQUMsQ0FBQSxRQUFTLENBQUEsRUFBQSxDQUFHLENBQUMsU0FBUyxDQUFDLEdBQXhCLENBQTRCLENBQUUsQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUFNLENBQUMsSUFBeEMsRUFESjs7ZUFFQSxJQUFDLENBQUEsUUFBUyxDQUFBLEVBQUEsQ0FBRyxDQUFDLFVBQVUsQ0FBQyxTQUF6QixHQUFxQyxDQUFBLElBQU0scUNBQVksQ0FBRSxjQUFiLElBQXFCLEdBQXRCLENBQU4sSUFBb0M7SUFMakU7Ozs7R0FqS007O0FBd0t0QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG4jIyNcblxueyBzZXRTdHlsZSwgZWxlbSwga2xvZywgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5ldmVudCA9IHJlcXVpcmUgJ2V2ZW50cydcblxuY2xhc3MgTnVtYmVycyBleHRlbmRzIGV2ZW50XG5cbiAgICBAOiAoQGVkaXRvcikgLT5cblxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG5cbiAgICAgICAgQGVsZW0gPSQgXCIubnVtYmVyc1wiIEBlZGl0b3Iudmlld1xuXG4gICAgICAgIEBlZGl0b3Iub24gJ2NsZWFyTGluZXMnICAgICAgIEBvbkNsZWFyTGluZXNcblxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1Nob3duJyAgICAgICBAb25MaW5lc1Nob3duXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2hpZnRlZCcgICAgIEBvbkxpbmVzU2hpZnRlZFxuXG4gICAgICAgIEBlZGl0b3Iub24gJ2ZvbnRTaXplQ2hhbmdlZCcgIEBvbkZvbnRTaXplQ2hhbmdlXG4gICAgICAgIEBlZGl0b3Iub24gJ2hpZ2hsaWdodCcgICAgICAgIEB1cGRhdGVDb2xvcnNcbiAgICAgICAgQGVkaXRvci5vbiAnY2hhbmdlZCcgICAgICAgICAgQHVwZGF0ZUNvbG9yc1xuICAgICAgICBAZWRpdG9yLm9uICdsaW5lc1NldCcgICAgICAgICBAdXBkYXRlQ29sb3JzXG5cbiAgICAgICAgQG9uRm9udFNpemVDaGFuZ2UoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkxpbmVzU2hvd246ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgICMga2xvZyAnb25MaW5lc1Nob3duJyB0b3AsIGJvdCwgbnVtXG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG5cbiAgICAgICAgZm9yIGxpIGluIFt0b3AuLmJvdF1cblxuICAgICAgICAgICAgZGl2ID0gQGFkZExpbmUgbGlcblxuICAgICAgICAgICAgQGVtaXQgJ251bWJlckFkZGVkJyxcbiAgICAgICAgICAgICAgICBudW1iZXJEaXY6ICBkaXZcbiAgICAgICAgICAgICAgICBudW1iZXJTcGFuOiBkaXYuZmlyc3RDaGlsZFxuICAgICAgICAgICAgICAgIGxpbmVJbmRleDogIGxpXG5cbiAgICAgICAgICAgIEB1cGRhdGVDb2xvciBsaVxuXG4gICAgICAgIEB1cGRhdGVMaW5lUG9zaXRpb25zKClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMDAwMCAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25MaW5lc1NoaWZ0ZWQ6ICh0b3AsIGJvdCwgbnVtKSA9PlxuXG4gICAgICAgIG9sZFRvcCA9IHRvcCAtIG51bVxuICAgICAgICBvbGRCb3QgPSBib3QgLSBudW1cblxuICAgICAgICBkaXZJbnRvID0gKGxpLGxvKSA9PlxuXG4gICAgICAgICAgICBpZiBub3QgQGxpbmVEaXZzW2xvXVxuICAgICAgICAgICAgICAgIGxvZyBcIiN7QGVkaXRvci5uYW1lfS5vbkxpbmVzU2hpZnRlZC5kaXZJbnRvIC0tIG5vIG51bWJlciBkaXY/IHRvcCAje3RvcH0gYm90ICN7Ym90fSBudW0gI3tudW19IGxvICN7bG99IGxpICN7bGl9XCJcbiAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAgICAgbnVtYmVyRGl2ID0gQGxpbmVEaXZzW2xpXSA9IEBsaW5lRGl2c1tsb11cbiAgICAgICAgICAgIGRlbGV0ZSBAbGluZURpdnNbbG9dXG5cbiAgICAgICAgICAgIEB1cGRhdGVDb2xvciBsaVxuXG4gICAgICAgIGlmIG51bSA+IDBcbiAgICAgICAgICAgIHdoaWxlIG9sZEJvdCA8IGJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCArPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRCb3QsIG9sZFRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCArPSAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdoaWxlIG9sZFRvcCA+IHRvcFxuICAgICAgICAgICAgICAgIG9sZFRvcCAtPSAxXG4gICAgICAgICAgICAgICAgZGl2SW50byBvbGRUb3AsIG9sZEJvdFxuICAgICAgICAgICAgICAgIG9sZEJvdCAtPSAxXG5cbiAgICAgICAgQHVwZGF0ZUxpbmVQb3NpdGlvbnMoKVxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuXG4gICAgdXBkYXRlTGluZVBvc2l0aW9uczogLT5cblxuICAgICAgICBmb3IgbGksIGRpdiBvZiBAbGluZURpdnNcbiAgICAgICAgICAgIGNvbnRpbnVlIGlmIG5vdCBkaXY/LnN0eWxlXG4gICAgICAgICAgICB5ID0gQGVkaXRvci5zaXplLmxpbmVIZWlnaHQgKiAobGkgLSBAZWRpdG9yLnNjcm9sbC50b3ApXG4gICAgICAgICAgICBkaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUzZCgwLCAje3l9cHgsIDApXCJcblxuICAgIGFkZExpbmU6IChsaSkgLT5cblxuICAgICAgICB0ZXh0ID0gJ+KWtidcbiAgICAgICAgIyB0ZXh0ID0gQGVkaXRvci5tZXRhLmxpbmVNZXRhc1tsaV0gYW5kICcgJyBvciAn4pa2J1xuICAgICAgICAjIGtsb2cgJ2FkZExpbmUnIGxpLCB0ZXh0LCBAZWRpdG9yLm1ldGEubGluZU1ldGFzW2xpXVxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOidsaW5lbnVtYmVyJyBjaGlsZDogZWxlbSAnc3BhbicgdGV4dDp0ZXh0XG4gICAgICAgIGRpdi5zdHlsZS5oZWlnaHQgPSBcIiN7QGVkaXRvci5zaXplLmxpbmVIZWlnaHR9cHhcIlxuICAgICAgICBAbGluZURpdnNbbGldID0gZGl2XG4gICAgICAgIEBlbGVtLmFwcGVuZENoaWxkIGRpdlxuICAgICAgICBkaXZcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgb25DbGVhckxpbmVzOiA9PlxuXG4gICAgICAgIEBsaW5lRGl2cyA9IHt9XG4gICAgICAgIEBlbGVtLmlubmVySFRNTCA9IFwiXCJcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgICAgICAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcblxuICAgIG9uRm9udFNpemVDaGFuZ2U6ID0+XG5cbiAgICAgICAgZnMgPSBNYXRoLm1pbiAyMiwgQGVkaXRvci5zaXplLmZvbnRTaXplLTRcbiAgICAgICAgQGVsZW0uc3R5bGUuZm9udFNpemUgPSBcIiN7ZnN9cHhcIlxuICAgICAgICAjIHNldFN0eWxlICcubGluZW51bWJlcicgJ3BhZGRpbmctdG9wJyBcIiN7cGFyc2VJbnQgQGVkaXRvci5zaXplLmZvbnRTaXplLzEwfXB4XCJcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgdXBkYXRlQ29sb3JzOiA9PlxuXG4gICAgICAgIGlmIEBlZGl0b3Iuc2Nyb2xsLmJvdCA+IEBlZGl0b3Iuc2Nyb2xsLnRvcFxuICAgICAgICAgICAgZm9yIGxpIGluIFtAZWRpdG9yLnNjcm9sbC50b3AuLkBlZGl0b3Iuc2Nyb2xsLmJvdF1cbiAgICAgICAgICAgICAgICBAdXBkYXRlQ29sb3IgbGlcblxuICAgIHVwZGF0ZUNvbG9yOiAobGkpID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbGluZURpdnNbbGldPyAjIG9rOiBlLmcuIGNvbW1hbmRsaXN0XG5cbiAgICAgICAgc2kgPSAoc1swXSBmb3IgcyBpbiByYW5nZXNGcm9tVG9wVG9Cb3RJblJhbmdlcyBsaSwgbGksIEBlZGl0b3Iuc2VsZWN0aW9ucygpKVxuICAgICAgICBoaSA9IChzWzBdIGZvciBzIGluIHJhbmdlc0Zyb21Ub3BUb0JvdEluUmFuZ2VzIGxpLCBsaSwgQGVkaXRvci5oaWdobGlnaHRzKCkpXG4gICAgICAgIGNpID0gKHNbMF0gZm9yIHMgaW4gcmFuZ2VzRnJvbVRvcFRvQm90SW5SYW5nZXMgbGksIGxpLCByYW5nZXNGcm9tUG9zaXRpb25zIEBlZGl0b3IuY3Vyc29ycygpKVxuXG4gICAgICAgIGNscyA9ICcnXG4gICAgICAgIGlmIGxpIGluIGNpXG4gICAgICAgICAgICBjbHMgKz0gJyBjdXJzb3JlZCdcbiAgICAgICAgaWYgbGkgPT0gQGVkaXRvci5tYWluQ3Vyc29yKClbMV1cbiAgICAgICAgICAgIGNscyArPSAnIG1haW4nXG4gICAgICAgIGlmIGxpIGluIHNpXG4gICAgICAgICAgICBjbHMgKz0gJyBzZWxlY3RlZCdcbiAgICAgICAgaWYgbGkgaW4gaGlcbiAgICAgICAgICAgIGNscyArPSAnIGhpZ2hsaWdkJ1xuXG4gICAgICAgIEBsaW5lRGl2c1tsaV0uY2xhc3NOYW1lID0gJ2xpbmVudW1iZXInICsgY2xzXG4gICAgICAgIEB1cGRhdGVNZXRhIGxpXG4gICAgICAgIFxuICAgIHVwZGF0ZU1ldGE6IChsaSkgLT5cbiAgICAgICAgXG4gICAgICAgIG0gPSBAZWRpdG9yLm1ldGEubGluZU1ldGFzW2xpXT9bMF1cbiAgICAgICAgaWYgbSBhbmQgbVsyXS5udW1iZXI/LmNsc3NcbiAgICAgICAgICAgIEBsaW5lRGl2c1tsaV0uY2xhc3NMaXN0LmFkZCBtWzJdLm51bWJlci5jbHNzXG4gICAgICAgIEBsaW5lRGl2c1tsaV0uZmlyc3RDaGlsZC5pbm5lckhUTUwgPSBtIGFuZCAobVsyXS5udW1iZXI/LnRleHQgb3IgJ+KWqicpIG9yICfil48nXG5cbm1vZHVsZS5leHBvcnRzID0gTnVtYmVyc1xuIl19
//# sourceURL=../../coffee/editor/numbers.coffee