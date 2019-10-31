// koffee 1.4.0

/*
 0000000  000   000  00000000    0000000   0000000   00000000
000       000   000  000   000  000       000   000  000   000
000       000   000  0000000    0000000   000   000  0000000  
000       000   000  000   000       000  000   000  000   000
 0000000   0000000   000   000  0000000    0000000   000   000
 */
var _, first, last, ref, reversed, stopEvent;

ref = require('kxk'), reversed = ref.reversed, stopEvent = ref.stopEvent, first = ref.first, last = ref.last, _ = ref._;

module.exports = {
    actions: {
        menu: 'Cursors',
        cursorInAllLines: {
            name: 'Cursor in All Lines',
            combo: 'alt+a'
        },
        alignCursorsUp: {
            separator: true,
            name: 'Align Cursors with Top-most Cursor',
            combo: 'alt+ctrl+shift+up'
        },
        alignCursorsDown: {
            name: 'Align Cursors with Bottom-most Cursor',
            combo: 'alt+ctrl+shift+down'
        },
        alignCursorsLeft: {
            name: 'Align Cursors with Left-most Cursor'
        },
        alignCursorsRight: {
            name: 'Align Cursors with Right-most Cursor'
        },
        alignCursorsAndText: {
            name: 'Align Cursors and Text',
            text: 'align text to the right of cursors by inserting spaces',
            combo: 'alt+shift+a'
        },
        setCursorsAtSelectionBoundariesOrSelectSurround: {
            separator: true,
            name: 'Cursors at Selection Boundaries or Select Brackets/Quotes',
            text: "set cursors at selection boundaries, if a selection exists.\nselect brackets or quotes otherwise.",
            combo: 'command+alt+b',
            accel: 'alt+ctrl+b'
        },
        addCursorsUp: {
            separator: true,
            name: 'Add Cursors Up',
            combo: 'command+up',
            accel: 'ctrl+up'
        },
        addCursorsDown: {
            name: 'Add Cursors Down',
            combo: 'command+down',
            accel: 'ctrl+down'
        },
        delCursorsUp: {
            separator: true,
            name: 'Remove Cursors Up',
            combo: 'command+shift+up',
            accel: 'ctrl+shift+up'
        },
        delCursorsDown: {
            name: 'Remove Cursors Down',
            combo: 'command+shift+down',
            accel: 'ctrl+shift+down'
        },
        cursorMoves: {
            name: 'Move Cursors To Start',
            combos: ['ctrl+home', 'ctrl+end', 'page up', 'page down', 'ctrl+shift+home', 'ctrl+shift+end', 'shift+page up', 'shift+page down']
        }
    },
    singleCursorAtEnd: function() {
        this.singleCursorAtPos([this.line(this.numLines() - 1).length, this.numLines() - 1]);
        return this.term.moveInputMeta();
    },
    singleCursorAtPos: function(p, opt) {
        if (opt == null) {
            opt = {
                extend: false
            };
        }
        if (this.numLines() === 0) {
            this["do"].start();
            this["do"].insert(0, '');
            this["do"].end();
        }
        p = this.clampPos(p);
        this["do"].start();
        this.startSelection(opt);
        this["do"].setCursors([[p[0], p[1]]]);
        this.endSelection(opt);
        return this["do"].end();
    },
    setCursor: function(c, l) {
        this["do"].start();
        this["do"].setCursors([[c, l]]);
        return this["do"].end();
    },
    cursorMoves: function(key, info) {
        var extend, ref1;
        extend = (ref1 = info != null ? info.extend : void 0) != null ? ref1 : 0 <= (info != null ? info.mod.indexOf('shift') : void 0);
        switch (key) {
            case 'home':
                return this.singleCursorAtPos([0, 0], {
                    extend: extend
                });
            case 'end':
                return this.singleCursorAtPos([0, this.numLines() - 1], {
                    extend: extend
                });
            case 'page up':
                return this.moveCursorsUp(extend, this.numFullLines() - 3);
            case 'page down':
                return this.moveCursorsDown(extend, this.numFullLines() - 3);
        }
    },
    setCursorsAtSelectionBoundariesOrSelectSurround: function() {
        var j, len, newCursors, ref1, s;
        if (this.numSelections()) {
            this["do"].start();
            newCursors = [];
            ref1 = this["do"].selections();
            for (j = 0, len = ref1.length; j < len; j++) {
                s = ref1[j];
                newCursors.push(rangeStartPos(s));
                newCursors.push(rangeEndPos(s));
            }
            this["do"].select([]);
            this["do"].setCursors(newCursors);
            return this["do"].end();
        } else {
            return this.selectSurround();
        }
    },
    toggleCursorAtPos: function(p) {
        if (isPosInPositions(p, this.state.cursors())) {
            return this.delCursorAtPos(p);
        } else {
            return this.addCursorAtPos(p);
        }
    },
    addCursorAtPos: function(p) {
        var newCursors;
        this["do"].start();
        newCursors = this["do"].cursors();
        newCursors.push(p);
        this["do"].setCursors(newCursors, {
            main: 'last'
        });
        return this["do"].end();
    },
    addCursorsUp: function() {
        return this.addCursors('up');
    },
    addCursorsDown: function() {
        return this.addCursors('down');
    },
    addCursors: function(key) {
        var c, d, dir, j, len, main, newCursors, oldCursors;
        dir = key;
        if (this.numCursors() >= 999) {
            return;
        }
        this["do"].start();
        d = (function() {
            switch (dir) {
                case 'up':
                    return -1;
                case 'down':
                    return +1;
            }
        })();
        oldCursors = this.state.cursors();
        newCursors = this["do"].cursors();
        for (j = 0, len = oldCursors.length; j < len; j++) {
            c = oldCursors[j];
            if (!isPosInPositions([c[0], c[1] + d], oldCursors)) {
                newCursors.push([c[0], c[1] + d]);
                if (newCursors.length >= 999) {
                    break;
                }
            }
        }
        sortPositions(newCursors);
        main = (function() {
            switch (dir) {
                case 'up':
                    return 'first';
                case 'down':
                    return 'last';
            }
        })();
        this["do"].setCursors(newCursors, {
            main: main
        });
        return this["do"].end();
    },
    cursorInAllLines: function() {
        var i;
        this["do"].start();
        this["do"].setCursors((function() {
            var j, ref1, results;
            results = [];
            for (i = j = 0, ref1 = this.numLines(); 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                results.push([0, i]);
            }
            return results;
        }).call(this), {
            main: 'closest'
        });
        return this["do"].end();
    },
    cursorColumns: function(num, step) {
        var cp, i;
        if (step == null) {
            step = 1;
        }
        cp = this.cursorPos();
        this["do"].start();
        this["do"].setCursors((function() {
            var j, ref1, results;
            results = [];
            for (i = j = 0, ref1 = num; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                results.push([cp[0] + i * step, cp[1]]);
            }
            return results;
        })(), {
            main: 'closest'
        });
        return this["do"].end();
    },
    cursorLines: function(num, step) {
        var cp, i;
        if (step == null) {
            step = 1;
        }
        cp = this.cursorPos();
        this["do"].start();
        this["do"].setCursors((function() {
            var j, ref1, results;
            results = [];
            for (i = j = 0, ref1 = num; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                results.push([cp[0], cp[1] + i * step]);
            }
            return results;
        })(), {
            main: 'closest'
        });
        return this["do"].end();
    },
    alignCursorsAndText: function() {
        var c, cx, j, len, li, lines, nc, newCursors, newX;
        this["do"].start();
        newCursors = this["do"].cursors();
        newX = _.max((function() {
            var j, len, results;
            results = [];
            for (j = 0, len = newCursors.length; j < len; j++) {
                c = newCursors[j];
                results.push(c[0]);
            }
            return results;
        })());
        lines = {};
        for (j = 0, len = newCursors.length; j < len; j++) {
            nc = newCursors[j];
            lines[nc[1]] = nc[0];
            cursorSet(nc, newX, c[1]);
        }
        for (li in lines) {
            cx = lines[li];
            this["do"].change(li, this["do"].line(li).slice(0, cx) + _.padStart('', newX - cx) + this["do"].line(li).slice(cx));
        }
        this["do"].setCursors(newCursors);
        return this["do"].end();
    },
    alignCursorsUp: function() {
        return this.alignCursors('up');
    },
    alignCursorsLeft: function() {
        return this.alignCursors('left');
    },
    alignCursorsRight: function() {
        return this.alignCursors('right');
    },
    alignCursorsDown: function() {
        return this.alignCursors('down');
    },
    alignCursors: function(dir) {
        var c, charPos, j, len, main, newCursors;
        if (dir == null) {
            dir = 'down';
        }
        this["do"].start();
        newCursors = this["do"].cursors();
        charPos = (function() {
            switch (dir) {
                case 'up':
                    return first(newCursors)[0];
                case 'down':
                    return last(newCursors)[0];
                case 'left':
                    return _.min((function() {
                        var j, len, results;
                        results = [];
                        for (j = 0, len = newCursors.length; j < len; j++) {
                            c = newCursors[j];
                            results.push(c[0]);
                        }
                        return results;
                    })());
                case 'right':
                    return _.max((function() {
                        var j, len, results;
                        results = [];
                        for (j = 0, len = newCursors.length; j < len; j++) {
                            c = newCursors[j];
                            results.push(c[0]);
                        }
                        return results;
                    })());
            }
        })();
        for (j = 0, len = newCursors.length; j < len; j++) {
            c = newCursors[j];
            cursorSet(c, charPos, c[1]);
        }
        main = (function() {
            switch (dir) {
                case 'up':
                    return 'first';
                case 'down':
                    return 'last';
            }
        })();
        this["do"].setCursors(newCursors, {
            main: main
        });
        return this["do"].end();
    },
    delCursorAtPos: function(p) {
        var c, newCursors, oldCursors;
        oldCursors = this.state.cursors();
        c = posInPositions(p, oldCursors);
        if (c && this.numCursors() > 1) {
            this["do"].start();
            newCursors = this["do"].cursors();
            newCursors.splice(oldCursors.indexOf(c), 1);
            this["do"].setCursors(newCursors, {
                main: 'closest'
            });
            return this["do"].end();
        }
    },
    delCursorsUp: function() {
        return this.delCursors('up');
    },
    delCursorsDown: function() {
        return this.delCursors('down');
    },
    delCursors: function(key, info) {
        var c, ci, d, dir, newCursors;
        dir = key;
        this["do"].start();
        newCursors = this["do"].cursors();
        d = (function() {
            var j, k, len, len1, ref1, ref2, results, results1;
            switch (dir) {
                case 'up':
                    ref1 = this["do"].cursors();
                    results = [];
                    for (j = 0, len = ref1.length; j < len; j++) {
                        c = ref1[j];
                        if (isPosInPositions([c[0], c[1] - 1], newCursors) && !isPosInPositions([c[0], c[1] + 1], newCursors)) {
                            ci = newCursors.indexOf(c);
                            results.push(newCursors.splice(ci, 1));
                        } else {
                            results.push(void 0);
                        }
                    }
                    return results;
                    break;
                case 'down':
                    ref2 = reversed(newCursors);
                    results1 = [];
                    for (k = 0, len1 = ref2.length; k < len1; k++) {
                        c = ref2[k];
                        if (isPosInPositions([c[0], c[1] + 1], newCursors) && !isPosInPositions([c[0], c[1] - 1], newCursors)) {
                            ci = newCursors.indexOf(c);
                            results1.push(newCursors.splice(ci, 1));
                        } else {
                            results1.push(void 0);
                        }
                    }
                    return results1;
            }
        }).call(this);
        this["do"].setCursors(newCursors, {
            main: 'closest'
        });
        return this["do"].end();
    },
    clearCursors: function() {
        this["do"].start();
        this["do"].setCursors([this.mainCursor()]);
        return this["do"].end();
    },
    clearCursorsAndHighlights: function() {
        this.clearCursors();
        return this.clearHighlights();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUEwQyxPQUFBLENBQVEsS0FBUixDQUExQyxFQUFFLHVCQUFGLEVBQVkseUJBQVosRUFBdUIsaUJBQXZCLEVBQThCLGVBQTlCLEVBQW9DOztBQUVwQyxNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFFQSxnQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFPLHFCQUFQO1lBQ0EsS0FBQSxFQUFPLE9BRFA7U0FISjtRQU1BLGNBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQ0EsSUFBQSxFQUFNLG9DQUROO1lBRUEsS0FBQSxFQUFPLG1CQUZQO1NBUEo7UUFXQSxnQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLHVDQUFOO1lBQ0EsS0FBQSxFQUFPLHFCQURQO1NBWko7UUFlQSxnQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLHFDQUFOO1NBaEJKO1FBbUJBLGlCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sc0NBQU47U0FwQko7UUF1QkEsbUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSx3QkFBTjtZQUNBLElBQUEsRUFBTSx3REFETjtZQUVBLEtBQUEsRUFBTyxhQUZQO1NBeEJKO1FBNEJBLCtDQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsSUFBWDtZQUNBLElBQUEsRUFBTSwyREFETjtZQUVBLElBQUEsRUFBTSxtR0FGTjtZQU1BLEtBQUEsRUFBTyxlQU5QO1lBT0EsS0FBQSxFQUFPLFlBUFA7U0E3Qko7UUFzQ0EsWUFBQSxFQUNJO1lBQUEsU0FBQSxFQUFXLElBQVg7WUFDQSxJQUFBLEVBQU0sZ0JBRE47WUFFQSxLQUFBLEVBQU8sWUFGUDtZQUdBLEtBQUEsRUFBTyxTQUhQO1NBdkNKO1FBNENBLGNBQUEsRUFDSTtZQUFBLElBQUEsRUFBTSxrQkFB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REo7O0FBUEo7O1FBV0osSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmLEVBQTJCO1lBQUEsSUFBQSxFQUFLLFNBQUw7U0FBM0I7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBaEJRLENBcFBaO0lBNFFBLFlBQUEsRUFBYyxTQUFBO1FBQ1YsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQWUsQ0FBQyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQUQsQ0FBZjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFIVSxDQTVRZDtJQWlSQSx5QkFBQSxFQUEyQixTQUFBO1FBQ3ZCLElBQUMsQ0FBQSxZQUFELENBQUE7ZUFDQSxJQUFDLENBQUEsZUFBRCxDQUFBO0lBRnVCLENBalIzQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IHJldmVyc2VkLCBzdG9wRXZlbnQsIGZpcnN0LCBsYXN0LCBfIH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICAgIGFjdGlvbnM6XG4gICAgICAgIG1lbnU6ICdDdXJzb3JzJ1xuXG4gICAgICAgIGN1cnNvckluQWxsTGluZXM6XG4gICAgICAgICAgICBuYW1lOiAgJ0N1cnNvciBpbiBBbGwgTGluZXMnXG4gICAgICAgICAgICBjb21ibzogJ2FsdCthJ1xuXG4gICAgICAgIGFsaWduQ3Vyc29yc1VwOlxuICAgICAgICAgICAgc2VwYXJhdG9yOiB0cnVlXG4gICAgICAgICAgICBuYW1lOiAnQWxpZ24gQ3Vyc29ycyB3aXRoIFRvcC1tb3N0IEN1cnNvcidcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrdXAnXG5cbiAgICAgICAgYWxpZ25DdXJzb3JzRG93bjpcbiAgICAgICAgICAgIG5hbWU6ICdBbGlnbiBDdXJzb3JzIHdpdGggQm90dG9tLW1vc3QgQ3Vyc29yJ1xuICAgICAgICAgICAgY29tYm86ICdhbHQrY3RybCtzaGlmdCtkb3duJ1xuXG4gICAgICAgIGFsaWduQ3Vyc29yc0xlZnQ6XG4gICAgICAgICAgICBuYW1lOiAnQWxpZ24gQ3Vyc29ycyB3aXRoIExlZnQtbW9zdCBDdXJzb3InXG4gICAgICAgICAgICAjIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrbGVmdCdcblxuICAgICAgICBhbGlnbkN1cnNvcnNSaWdodDpcbiAgICAgICAgICAgIG5hbWU6ICdBbGlnbiBDdXJzb3JzIHdpdGggUmlnaHQtbW9zdCBDdXJzb3InXG4gICAgICAgICAgICAjIGNvbWJvOiAnYWx0K2N0cmwrc2hpZnQrcmlnaHQnXG5cbiAgICAgICAgYWxpZ25DdXJzb3JzQW5kVGV4dDpcbiAgICAgICAgICAgIG5hbWU6ICdBbGlnbiBDdXJzb3JzIGFuZCBUZXh0J1xuICAgICAgICAgICAgdGV4dDogJ2FsaWduIHRleHQgdG8gdGhlIHJpZ2h0IG9mIGN1cnNvcnMgYnkgaW5zZXJ0aW5nIHNwYWNlcydcbiAgICAgICAgICAgIGNvbWJvOiAnYWx0K3NoaWZ0K2EnXG5cbiAgICAgICAgc2V0Q3Vyc29yc0F0U2VsZWN0aW9uQm91bmRhcmllc09yU2VsZWN0U3Vycm91bmQ6XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICdDdXJzb3JzIGF0IFNlbGVjdGlvbiBCb3VuZGFyaWVzIG9yIFNlbGVjdCBCcmFja2V0cy9RdW90ZXMnXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgICAgICBzZXQgY3Vyc29ycyBhdCBzZWxlY3Rpb24gYm91bmRhcmllcywgaWYgYSBzZWxlY3Rpb24gZXhpc3RzLlxuICAgICAgICAgICAgICAgIHNlbGVjdCBicmFja2V0cyBvciBxdW90ZXMgb3RoZXJ3aXNlLlxuICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2FsdCtiJ1xuICAgICAgICAgICAgYWNjZWw6ICdhbHQrY3RybCtiJ1xuXG4gICAgICAgIGFkZEN1cnNvcnNVcDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogJ0FkZCBDdXJzb3JzIFVwJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3VwJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK3VwJ1xuXG4gICAgICAgIGFkZEN1cnNvcnNEb3duOlxuICAgICAgICAgICAgbmFtZTogJ0FkZCBDdXJzb3JzIERvd24nXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrZG93bidcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtkb3duJ1xuXG4gICAgICAgIGRlbEN1cnNvcnNVcDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogJ1JlbW92ZSBDdXJzb3JzIFVwJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3NoaWZ0K3VwJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK3NoaWZ0K3VwJ1xuXG4gICAgICAgIGRlbEN1cnNvcnNEb3duOlxuICAgICAgICAgICAgbmFtZTogJ1JlbW92ZSBDdXJzb3JzIERvd24nXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrc2hpZnQrZG93bidcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtzaGlmdCtkb3duJ1xuXG4gICAgICAgIGN1cnNvck1vdmVzOlxuICAgICAgICAgICAgbmFtZTogICdNb3ZlIEN1cnNvcnMgVG8gU3RhcnQnXG4gICAgICAgICAgICBjb21ib3M6IFsnY3RybCtob21lJyAnY3RybCtlbmQnICdwYWdlIHVwJyAncGFnZSBkb3duJyAnY3RybCtzaGlmdCtob21lJyAnY3RybCtzaGlmdCtlbmQnICdzaGlmdCtwYWdlIHVwJyAnc2hpZnQrcGFnZSBkb3duJ11cblxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDBcblxuICAgIHNpbmdsZUN1cnNvckF0RW5kOiAtPlxuICAgICAgICBcbiAgICAgICAgQHNpbmdsZUN1cnNvckF0UG9zIFtAbGluZShAbnVtTGluZXMoKS0xKS5sZW5ndGgsQG51bUxpbmVzKCktMV1cbiAgICAgICAgQHRlcm0ubW92ZUlucHV0TWV0YSgpXG4gICAgXG4gICAgc2luZ2xlQ3Vyc29yQXRQb3M6IChwLCBvcHQgPSBleHRlbmQ6ZmFsc2UpIC0+XG5cbiAgICAgICAgaWYgQG51bUxpbmVzKCkgPT0gMFxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIEBkby5pbnNlcnQgMCAnJ1xuICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIHAgPSBAY2xhbXBQb3MgcFxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBzdGFydFNlbGVjdGlvbiBvcHRcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgW1twWzBdLCBwWzFdXV1cbiAgICAgICAgQGVuZFNlbGVjdGlvbiBvcHRcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBzZXRDdXJzb3I6IChjLGwpIC0+XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtbYyxsXV1cbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBjdXJzb3JNb3ZlczogKGtleSwgaW5mbykgLT5cbiAgICAgICAgZXh0ZW5kID0gaW5mbz8uZXh0ZW5kID8gMCA8PSBpbmZvPy5tb2QuaW5kZXhPZiAnc2hpZnQnXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdob21lJyAgICAgIHRoZW4gQHNpbmdsZUN1cnNvckF0UG9zIFswIDBdLCBleHRlbmQ6IGV4dGVuZFxuICAgICAgICAgICAgd2hlbiAnZW5kJyAgICAgICB0aGVuIEBzaW5nbGVDdXJzb3JBdFBvcyBbMCBAbnVtTGluZXMoKS0xXSwgZXh0ZW5kOiBleHRlbmRcbiAgICAgICAgICAgIHdoZW4gJ3BhZ2UgdXAnICAgXG4gICAgICAgICAgICAgICAgQG1vdmVDdXJzb3JzVXAgICBleHRlbmQsIEBudW1GdWxsTGluZXMoKS0zXG4gICAgICAgICAgICB3aGVuICdwYWdlIGRvd24nIHRoZW4gQG1vdmVDdXJzb3JzRG93biBleHRlbmQsIEBudW1GdWxsTGluZXMoKS0zXG4gICAgICAgIFxuICAgIHNldEN1cnNvcnNBdFNlbGVjdGlvbkJvdW5kYXJpZXNPclNlbGVjdFN1cnJvdW5kOiAtPlxuXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKClcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdDdXJzb3JzID0gW11cbiAgICAgICAgICAgIGZvciBzIGluIEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggcmFuZ2VTdGFydFBvcyBzXG4gICAgICAgICAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIHJhbmdlRW5kUG9zIHNcbiAgICAgICAgICAgIEBkby5zZWxlY3QgW11cbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2VsZWN0U3Vycm91bmQoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcblxuICAgIHRvZ2dsZUN1cnNvckF0UG9zOiAocCkgLT5cblxuICAgICAgICBpZiBpc1Bvc0luUG9zaXRpb25zIHAsIEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgICAgIEBkZWxDdXJzb3JBdFBvcyBwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBhZGRDdXJzb3JBdFBvcyBwXG5cbiAgICBhZGRDdXJzb3JBdFBvczogKHApIC0+XG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIHBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjonbGFzdCdcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBhZGRDdXJzb3JzVXA6ICAgLT4gQGFkZEN1cnNvcnMgJ3VwJ1xuICAgIGFkZEN1cnNvcnNEb3duOiAtPiBAYWRkQ3Vyc29ycyAnZG93bidcbiAgICAgICAgXG4gICAgYWRkQ3Vyc29yczogKGtleSkgLT5cblxuICAgICAgICBkaXIgPSBrZXlcbiAgICAgICAgcmV0dXJuIGlmIEBudW1DdXJzb3JzKCkgPj0gOTk5XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIGQgPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiAtMVxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gKzFcbiAgICAgICAgb2xkQ3Vyc29ycyA9IEBzdGF0ZS5jdXJzb3JzKClcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgZm9yIGMgaW4gb2xkQ3Vyc29yc1xuICAgICAgICAgICAgaWYgbm90IGlzUG9zSW5Qb3NpdGlvbnMgW2NbMF0sIGNbMV0rZF0sIG9sZEN1cnNvcnNcbiAgICAgICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggW2NbMF0sIGNbMV0rZF1cbiAgICAgICAgICAgICAgICBicmVhayBpZiBuZXdDdXJzb3JzLmxlbmd0aCA+PSA5OTlcbiAgICAgICAgc29ydFBvc2l0aW9ucyBuZXdDdXJzb3JzXG4gICAgICAgIG1haW4gPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiAnZmlyc3QnXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiAnbGFzdCdcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjptYWluXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgY3Vyc29ySW5BbGxMaW5lczogLT4gICAgICAgXG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgKFswLGldIGZvciBpIGluIFswLi4uQG51bUxpbmVzKCldKSwgbWFpbjonY2xvc2VzdCdcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBjdXJzb3JDb2x1bW5zOiAobnVtLCBzdGVwPTEpIC0+XG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIChbY3BbMF0raSpzdGVwLGNwWzFdXSBmb3IgaSBpbiBbMC4uLm51bV0pLCBtYWluOidjbG9zZXN0J1xuICAgICAgICBAZG8uZW5kKClcblxuICAgIGN1cnNvckxpbmVzOiAobnVtLCBzdGVwPTEpIC0+XG4gICAgICAgIGNwID0gQGN1cnNvclBvcygpXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIChbY3BbMF0sY3BbMV0raSpzdGVwXSBmb3IgaSBpbiBbMC4uLm51bV0pLCBtYWluOidjbG9zZXN0J1xuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuXG4gICAgYWxpZ25DdXJzb3JzQW5kVGV4dDogLT5cblxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBuZXdYID0gXy5tYXggKGNbMF0gZm9yIGMgaW4gbmV3Q3Vyc29ycylcbiAgICAgICAgbGluZXMgPSB7fVxuICAgICAgICBmb3IgbmMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgbGluZXNbbmNbMV1dID0gbmNbMF1cbiAgICAgICAgICAgIGN1cnNvclNldCBuYywgbmV3WCwgY1sxXVxuICAgICAgICBmb3IgbGksIGN4IG9mIGxpbmVzXG4gICAgICAgICAgICBAZG8uY2hhbmdlIGxpLCBAZG8ubGluZShsaSkuc2xpY2UoMCwgY3gpICsgXy5wYWRTdGFydCgnJyBuZXdYLWN4KSArIEBkby5saW5lKGxpKS5zbGljZShjeClcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICBAZG8uZW5kKClcblxuICAgIGFsaWduQ3Vyc29yc1VwOiAgICAtPiBAYWxpZ25DdXJzb3JzICd1cCcgICBcbiAgICBhbGlnbkN1cnNvcnNMZWZ0OiAgLT4gQGFsaWduQ3Vyc29ycyAnbGVmdCcgICBcbiAgICBhbGlnbkN1cnNvcnNSaWdodDogLT4gQGFsaWduQ3Vyc29ycyAncmlnaHQnICAgXG4gICAgYWxpZ25DdXJzb3JzRG93bjogIC0+IEBhbGlnbkN1cnNvcnMgJ2Rvd24nICAgXG4gICAgICAgIFxuICAgIGFsaWduQ3Vyc29yczogKGRpcj0nZG93bicpIC0+XG5cbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgY2hhclBvcyA9IHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIGZpcnN0KG5ld0N1cnNvcnMpWzBdXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiBsYXN0KG5ld0N1cnNvcnMpWzBdXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBfLm1pbiAoY1swXSBmb3IgYyBpbiBuZXdDdXJzb3JzKVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gXy5tYXggKGNbMF0gZm9yIGMgaW4gbmV3Q3Vyc29ycylcbiAgICAgICAgZm9yIGMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgY3Vyc29yU2V0IGMsIGNoYXJQb3MsIGNbMV1cbiAgICAgICAgbWFpbiA9IHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuICdmaXJzdCdcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICB0aGVuICdsYXN0J1xuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOm1haW5cbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgZGVsQ3Vyc29yQXRQb3M6IChwKSAtPlxuICAgICAgICBvbGRDdXJzb3JzID0gQHN0YXRlLmN1cnNvcnMoKVxuICAgICAgICBjID0gcG9zSW5Qb3NpdGlvbnMgcCwgb2xkQ3Vyc29yc1xuICAgICAgICBpZiBjIGFuZCBAbnVtQ3Vyc29ycygpID4gMVxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBuZXdDdXJzb3JzLnNwbGljZSBvbGRDdXJzb3JzLmluZGV4T2YoYyksIDFcbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46J2Nsb3Nlc3QnXG4gICAgICAgICAgICBAZG8uZW5kKClcblxuICAgIGRlbEN1cnNvcnNVcDogICAtPiBAZGVsQ3Vyc29ycyAndXAnXG4gICAgZGVsQ3Vyc29yc0Rvd246IC0+IEBkZWxDdXJzb3JzICdkb3duJ1xuICAgICAgICAgICAgXG4gICAgZGVsQ3Vyc29yczogKGtleSwgaW5mbykgLT5cbiAgICAgICAgZGlyID0ga2V5XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIGQgPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCdcbiAgICAgICAgICAgICAgICBmb3IgYyBpbiBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICAgICAgICAgIGlmIGlzUG9zSW5Qb3NpdGlvbnMoW2NbMF0sIGNbMV0tMV0sIG5ld0N1cnNvcnMpIGFuZCBub3QgaXNQb3NJblBvc2l0aW9ucyBbY1swXSwgY1sxXSsxXSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICAgICAgY2kgPSBuZXdDdXJzb3JzLmluZGV4T2YgY1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Q3Vyc29ycy5zcGxpY2UgY2ksIDFcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nXG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gcmV2ZXJzZWQgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICBpZiBpc1Bvc0luUG9zaXRpb25zKFtjWzBdLCBjWzFdKzFdLCBuZXdDdXJzb3JzKSBhbmQgbm90IGlzUG9zSW5Qb3NpdGlvbnMgW2NbMF0sIGNbMV0tMV0sIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNpID0gbmV3Q3Vyc29ycy5pbmRleE9mIGNcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0N1cnNvcnMuc3BsaWNlIGNpLCAxXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46J2Nsb3Nlc3QnXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG5cbiAgICBjbGVhckN1cnNvcnM6ICgpIC0+XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtAbWFpbkN1cnNvcigpXVxuICAgICAgICBAZG8uZW5kKClcblxuICAgIGNsZWFyQ3Vyc29yc0FuZEhpZ2hsaWdodHM6ICgpIC0+XG4gICAgICAgIEBjbGVhckN1cnNvcnMoKVxuICAgICAgICBAY2xlYXJIaWdobGlnaHRzKClcblxuIl19
//# sourceURL=../../../coffee/editor/actions/cursor.coffee