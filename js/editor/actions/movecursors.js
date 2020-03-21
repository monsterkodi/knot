// koffee 1.12.0
var _, klog, ref;

ref = require('kxk'), klog = ref.klog, _ = ref._;

module.exports = {
    actions: {
        menu: 'Cursors',
        moveCursorsAtBoundaryLeft: {
            name: 'Move Cursors to Indent or Start of Line',
            combo: 'command+left',
            accels: ['ctrl+left', 'ctrl+a']
        },
        moveCursorsAtBoundaryRight: {
            name: 'Move Cursors to End of Line',
            combo: 'command+right',
            accels: ['ctrl+right']
        },
        moveCursorsToWordBoundary: {
            name: 'move cursors to word boundaries',
            text: 'moves cursors to word boundaries. extends selections, if shift is pressed.',
            combos: ['alt+shift+left', 'alt+shift+right']
        },
        moveCursorsToWordBoundaryLeft: {
            separator: true,
            name: 'Move Cursors to Start of Word',
            combo: 'alt+left'
        },
        moveCursorsToWordBoundaryRight: {
            name: 'Move Cursors to End of Word',
            combo: 'alt+right'
        },
        moveCursorsToLineBoundary: {
            name: 'move cursors to line boundaries',
            text: 'moves cursors to line boundaries. extends selections, if shift is pressed.',
            combos: ['home', 'end', 'command+shift+left', 'command+shift+right', 'ctrl+shift+left', 'ctrl+shift+right'],
            accels: ['home', 'end', 'shift+home', 'shift+end', 'ctrl+shift+left', 'ctrl+shift+right', 'ctrl+shift+e', 'ctrl+shift+a']
        },
        moveMainCursor: {
            name: 'move main cursor',
            text: "move main cursor independently of other cursors.\nerases other cursors if shift is pressed. \nsets new cursors otherwise.",
            combos: ['ctrl+shift+up', 'ctrl+shift+down', 'ctrl+shift+left', 'ctrl+shift+right', 'ctrl+up', 'ctrl+down', 'ctrl+left', 'ctrl+right'],
            accels: ['ctrl+shift+up', 'ctrl+shift+down']
        },
        moveCursors: {
            name: 'move cursors',
            combos: ['left', 'right', 'up', 'down', 'shift+down', 'shift+right', 'shift+up', 'shift+left']
        }
    },
    moveCursorsAtBoundaryLeft: function() {
        return this.setOrMoveCursorsAtBoundary('left');
    },
    moveCursorsAtBoundaryRight: function() {
        return this.setOrMoveCursorsAtBoundary('right');
    },
    setOrMoveCursorsAtBoundary: function(key) {
        if (this.numSelections() > 1 && this.numCursors() === 1) {
            return this.setCursorsAtSelectionBoundary(key);
        } else {
            return this.moveCursorsToLineBoundary(key);
        }
    },
    moveMainCursor: function(key, info) {
        var dir, dx, dy, hrz, newCursors, newMain, oldMain, opt, ref1, ref2;
        klog('moveMainCursor', key, info);
        dir = key;
        hrz = key === 'left' || key === 'right';
        opt = _.clone(info);
        if (opt.erase != null) {
            opt.erase;
        } else {
            opt.erase = ((ref1 = info.mod) != null ? ref1.indexOf('shift') : void 0) >= 0 || hrz;
        }
        this["do"].start();
        ref2 = (function() {
            switch (dir) {
                case 'up':
                    return [0, -1];
                case 'down':
                    return [0, +1];
                case 'left':
                    return [-1, 0];
                case 'right':
                    return [+1, 0];
            }
        })(), dx = ref2[0], dy = ref2[1];
        newCursors = this["do"].cursors();
        oldMain = this.mainCursor();
        newMain = [oldMain[0] + dx, oldMain[1] + dy];
        _.remove(newCursors, function(c) {
            if (opt != null ? opt.erase : void 0) {
                return isSamePos(c, oldMain) || isSamePos(c, newMain);
            } else {
                return isSamePos(c, newMain);
            }
        });
        newCursors.push(newMain);
        this["do"].setCursors(newCursors, {
            main: newMain
        });
        return this["do"].end();
    },
    moveCursorsToWordBoundaryLeft: function() {
        return this.moveCursorsToWordBoundary('left');
    },
    moveCursorsToWordBoundaryRight: function() {
        return this.moveCursorsToWordBoundary('right');
    },
    moveCursorsToWordBoundary: function(leftOrRight, info) {
        var extend, f, ref1;
        if (info == null) {
            info = {
                extend: false
            };
        }
        extend = (ref1 = info.extend) != null ? ref1 : 0 <= info.mod.indexOf('shift');
        f = (function() {
            switch (leftOrRight) {
                case 'right':
                    return this.endOfWordAtPos;
                case 'left':
                    return this.startOfWordAtPos;
            }
        }).call(this);
        this.moveAllCursors(f, {
            extend: extend,
            keepLine: true
        });
        return true;
    },
    moveCursorsToLineBoundary: function(key, info) {
        var extend, func, ref1;
        if (info == null) {
            info = {
                extend: false
            };
        }
        this["do"].start();
        extend = (ref1 = info.extend) != null ? ref1 : 0 <= info.mod.indexOf('shift');
        func = (function() {
            switch (key) {
                case 'right':
                case 'e':
                case 'end':
                    return (function(_this) {
                        return function(c) {
                            return [_this["do"].line(c[1]).length, c[1]];
                        };
                    })(this);
                case 'left':
                case 'a':
                case 'home':
                    return (function(_this) {
                        return function(c) {
                            var d;
                            if (_this["do"].line(c[1]).slice(0, c[0]).trim().length === 0) {
                                return [0, c[1]];
                            } else {
                                d = _this["do"].line(c[1]).length - _this["do"].line(c[1]).trimLeft().length;
                                return [d, c[1]];
                            }
                        };
                    })(this);
            }
        }).call(this);
        this.moveAllCursors(func, {
            extend: extend,
            keepLine: true
        });
        return this["do"].end();
    },
    moveCursors: function(key, info) {
        var extend, ref1;
        if (info == null) {
            info = {
                extend: false
            };
        }
        extend = (ref1 = info.extend) != null ? ref1 : 'shift' === info.mod;
        switch (key) {
            case 'left':
                return this.moveCursorsLeft(extend);
            case 'right':
                return this.moveCursorsRight(extend);
            case 'up':
                return this.moveCursorsUp(extend);
            case 'down':
                return this.moveCursorsDown(extend);
        }
    },
    setCursorsAtSelectionBoundary: function(leftOrRight) {
        var i, j, len, main, newCursors, p, ref1, s;
        if (leftOrRight == null) {
            leftOrRight = 'right';
        }
        this["do"].start();
        i = leftOrRight === 'right' && 1 || 0;
        newCursors = [];
        main = 'last';
        ref1 = this["do"].selections();
        for (j = 0, len = ref1.length; j < len; j++) {
            s = ref1[j];
            p = rangeIndexPos(s, i);
            newCursors.push(p);
            if (this.isCursorInRange(s)) {
                main = newCursors.indexOf(p);
            }
        }
        this["do"].setCursors(newCursors, {
            main: main
        });
        return this["do"].end();
    },
    moveAllCursors: function(func, opt) {
        var c, ci, j, k, len, main, mainLine, newCursors, newPos, oldMain, ref1;
        if (opt == null) {
            opt = {
                extend: false,
                keepLine: true
            };
        }
        this["do"].start();
        this.startSelection(opt);
        newCursors = this["do"].cursors();
        oldMain = this["do"].mainCursor();
        mainLine = oldMain[1];
        if (newCursors.length > 1) {
            for (j = 0, len = newCursors.length; j < len; j++) {
                c = newCursors[j];
                newPos = func(c);
                if (newPos[1] === c[1] || !opt.keepLine) {
                    if (isSamePos(oldMain, c)) {
                        mainLine = newPos[1];
                    }
                    cursorSet(c, newPos);
                }
            }
        } else {
            cursorSet(newCursors[0], func(newCursors[0]));
            mainLine = newCursors[0][1];
        }
        main = (function() {
            switch (opt.main) {
                case 'top':
                    return 'first';
                case 'bot':
                    return 'last';
                case 'left':
                    return 'closest';
                case 'right':
                    return 'closest';
            }
        })();
        if (opt.clamp) {
            for (ci = k = 0, ref1 = newCursors.length; 0 <= ref1 ? k < ref1 : k > ref1; ci = 0 <= ref1 ? ++k : --k) {
                newCursors[ci] = this.clampPos(newCursors[ci]);
            }
        }
        this["do"].setCursors(newCursors, {
            main: main
        });
        this.endSelection(opt);
        return this["do"].end();
    },
    moveCursorsUp: function(e, n) {
        if (n == null) {
            n = 1;
        }
        return this.moveAllCursors((function(n) {
            return function(c) {
                return [c[0], c[1] - n];
            };
        })(n), {
            extend: e,
            main: 'top'
        });
    },
    moveCursorsRight: function(e, n) {
        var moveRight;
        if (n == null) {
            n = 1;
        }
        moveRight = function(n) {
            return function(c) {
                return [c[0] + n, c[1]];
            };
        };
        return this.moveAllCursors(moveRight(n), {
            extend: e,
            keepLine: true,
            clamp: true,
            main: 'right'
        });
    },
    moveCursorsLeft: function(e, n) {
        var moveLeft;
        if (n == null) {
            n = 1;
        }
        moveLeft = function(n) {
            return function(c) {
                return [Math.max(0, c[0] - n), c[1]];
            };
        };
        return this.moveAllCursors(moveLeft(n), {
            extend: e,
            keepLine: true,
            main: 'left'
        });
    },
    moveCursorsDown: function(e, n) {
        var c, newSelections;
        if (n == null) {
            n = 1;
        }
        if (e && this.numSelections() === 0) {
            if (0 === _.max((function() {
                var j, len, ref1, results;
                ref1 = this.cursors();
                results = [];
                for (j = 0, len = ref1.length; j < len; j++) {
                    c = ref1[j];
                    results.push(c[0]);
                }
                return results;
            }).call(this))) {
                this["do"].start();
                this["do"].select(this.rangesForCursorLines());
                this["do"].end();
                return;
            }
        } else if (e && this.stickySelection && this.numCursors() === 1) {
            if (this.mainCursor()[0] === 0 && !this.isSelectedLineAtIndex(this.mainCursor()[1])) {
                this["do"].start();
                newSelections = this["do"].selections();
                newSelections.push(this.rangeForLineAtIndex(this.mainCursor()[1]));
                this["do"].select(newSelections);
                this["do"].end();
                return;
            }
        }
        return this.moveAllCursors((function(n) {
            return function(c) {
                return [c[0], c[1] + n];
            };
        })(n), {
            extend: e,
            main: 'bot'
        });
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZWN1cnNvcnMuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vY29mZmVlL2VkaXRvci9hY3Rpb25zIiwic291cmNlcyI6WyJtb3ZlY3Vyc29ycy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUEsTUFBYyxPQUFBLENBQVEsS0FBUixDQUFkLEVBQUUsZUFBRixFQUFROztBQUVSLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxPQUFBLEVBQ0k7UUFBQSxJQUFBLEVBQU0sU0FBTjtRQUVBLHlCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0seUNBQU47WUFDQSxLQUFBLEVBQU8sY0FEUDtZQUVBLE1BQUEsRUFBUSxDQUFDLFdBQUQsRUFBYSxRQUFiLENBRlI7U0FISjtRQU9BLDBCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sNkJBQU47WUFDQSxLQUFBLEVBQU8sZUFEUDtZQUVBLE1BQUEsRUFBUSxDQUFDLFlBQUQsQ0FGUjtTQVJKO1FBWUEseUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBUSxpQ0FBUjtZQUNBLElBQUEsRUFBUSw0RUFEUjtZQUVBLE1BQUEsRUFBUSxDQUFDLGdCQUFELEVBQWtCLGlCQUFsQixDQUZSO1NBYko7UUFpQkEsNkJBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxJQUFYO1lBQ0EsSUFBQSxFQUFRLCtCQURSO1lBRUEsS0FBQSxFQUFRLFVBRlI7U0FsQko7UUFzQkEsOEJBQUEsRUFDSTtZQUFBLElBQUEsRUFBUSw2QkFBUjtZQUNBLEtBQUEsRUFBUSxXQURSO1NBdkJKO1FBMEJBLHlCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQVEsaUNBQVI7WUFDQSxJQUFBLEVBQVEsNEVBRFI7WUFFQSxNQUFBLEVBQVEsQ0FBQyxNQUFELEVBQVEsS0FBUixFQUFjLG9CQUFkLEVBQW1DLHFCQUFuQyxFQUF5RCxpQkFBekQsRUFBMkUsa0JBQTNFLENBRlI7WUFHQSxNQUFBLEVBQVEsQ0FBQyxNQUFELEVBQVEsS0FBUixFQUFjLFlBQWQs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QUFnQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFBO2dCQUNoQixhQUFhLENBQUMsSUFBZCxDQUFtQixJQUFDLENBQUEsbUJBQUQsQ0FBcUIsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFjLENBQUEsQ0FBQSxDQUFuQyxDQUFuQjtnQkFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLGFBQVg7Z0JBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtBQUNBLHVCQU5KO2FBREM7O2VBU0wsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsQ0FBQyxTQUFDLENBQUQ7bUJBQUssU0FBQyxDQUFEO3VCQUFLLENBQUMsQ0FBRSxDQUFBLENBQUEsQ0FBSCxFQUFNLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFYO1lBQUw7UUFBTCxDQUFELENBQUEsQ0FBMEIsQ0FBMUIsQ0FBaEIsRUFBOEM7WUFBQSxNQUFBLEVBQU8sQ0FBUDtZQUFVLElBQUEsRUFBTSxLQUFoQjtTQUE5QztJQWpCYSxDQTFNakIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG5cbnsga2xvZywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IFxuXG4gICAgYWN0aW9uczpcbiAgICAgICAgbWVudTogJ0N1cnNvcnMnXG4gICAgICAgIFxuICAgICAgICBtb3ZlQ3Vyc29yc0F0Qm91bmRhcnlMZWZ0OiBcbiAgICAgICAgICAgIG5hbWU6ICdNb3ZlIEN1cnNvcnMgdG8gSW5kZW50IG9yIFN0YXJ0IG9mIExpbmUnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrbGVmdCdcbiAgICAgICAgICAgIGFjY2VsczogWydjdHJsK2xlZnQnICdjdHJsK2EnXVxuXG4gICAgICAgIG1vdmVDdXJzb3JzQXRCb3VuZGFyeVJpZ2h0OiBcbiAgICAgICAgICAgIG5hbWU6ICdNb3ZlIEN1cnNvcnMgdG8gRW5kIG9mIExpbmUnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrcmlnaHQnXG4gICAgICAgICAgICBhY2NlbHM6IFsnY3RybCtyaWdodCddXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnk6XG4gICAgICAgICAgICBuYW1lOiAgICdtb3ZlIGN1cnNvcnMgdG8gd29yZCBib3VuZGFyaWVzJ1xuICAgICAgICAgICAgdGV4dDogICAnbW92ZXMgY3Vyc29ycyB0byB3b3JkIGJvdW5kYXJpZXMuIGV4dGVuZHMgc2VsZWN0aW9ucywgaWYgc2hpZnQgaXMgcHJlc3NlZC4nICAgICAgICAgICAgXG4gICAgICAgICAgICBjb21ib3M6IFsnYWx0K3NoaWZ0K2xlZnQnICdhbHQrc2hpZnQrcmlnaHQnXVxuICAgICAgICBcbiAgICAgICAgbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeUxlZnQ6XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICAgJ01vdmUgQ3Vyc29ycyB0byBTdGFydCBvZiBXb3JkJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K2xlZnQnXG5cbiAgICAgICAgbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeVJpZ2h0OlxuICAgICAgICAgICAgbmFtZTogICAnTW92ZSBDdXJzb3JzIHRvIEVuZCBvZiBXb3JkJ1xuICAgICAgICAgICAgY29tYm86ICAnYWx0K3JpZ2h0J1xuICAgICAgICAgICAgXG4gICAgICAgIG1vdmVDdXJzb3JzVG9MaW5lQm91bmRhcnk6XG4gICAgICAgICAgICBuYW1lOiAgICdtb3ZlIGN1cnNvcnMgdG8gbGluZSBib3VuZGFyaWVzJ1xuICAgICAgICAgICAgdGV4dDogICAnbW92ZXMgY3Vyc29ycyB0byBsaW5lIGJvdW5kYXJpZXMuIGV4dGVuZHMgc2VsZWN0aW9ucywgaWYgc2hpZnQgaXMgcHJlc3NlZC4nXG4gICAgICAgICAgICBjb21ib3M6IFsnaG9tZScgJ2VuZCcgJ2NvbW1hbmQrc2hpZnQrbGVmdCcgJ2NvbW1hbmQrc2hpZnQrcmlnaHQnICdjdHJsK3NoaWZ0K2xlZnQnICdjdHJsK3NoaWZ0K3JpZ2h0J11cbiAgICAgICAgICAgIGFjY2VsczogWydob21lJyAnZW5kJyAnc2hpZnQraG9tZScgJ3NoaWZ0K2VuZCcgJ2N0cmwrc2hpZnQrbGVmdCcgJ2N0cmwrc2hpZnQrcmlnaHQnICdjdHJsK3NoaWZ0K2UnICdjdHJsK3NoaWZ0K2EnXVxuXG4gICAgICAgIG1vdmVNYWluQ3Vyc29yOlxuICAgICAgICAgICAgbmFtZTogICAnbW92ZSBtYWluIGN1cnNvcidcbiAgICAgICAgICAgIHRleHQ6ICAgXCJcIlwibW92ZSBtYWluIGN1cnNvciBpbmRlcGVuZGVudGx5IG9mIG90aGVyIGN1cnNvcnMuXG4gICAgICAgICAgICAgICAgZXJhc2VzIG90aGVyIGN1cnNvcnMgaWYgc2hpZnQgaXMgcHJlc3NlZC4gXG4gICAgICAgICAgICAgICAgc2V0cyBuZXcgY3Vyc29ycyBvdGhlcndpc2UuXCJcIlwiXG4gICAgICAgICAgICBjb21ib3M6IFsgJ2N0cmwrc2hpZnQrdXAnICdjdHJsK3NoaWZ0K2Rvd24nICdjdHJsK3NoaWZ0K2xlZnQnICdjdHJsK3NoaWZ0K3JpZ2h0JyAnY3RybCt1cCcgJ2N0cmwrZG93bicgJ2N0cmwrbGVmdCcgJ2N0cmwrcmlnaHQnXVxuICAgICAgICAgICAgYWNjZWxzOiBbICdjdHJsK3NoaWZ0K3VwJyAnY3RybCtzaGlmdCtkb3duJ11cbiAgICAgICAgICAgIFxuICAgICAgICBtb3ZlQ3Vyc29yczpcbiAgICAgICAgICAgIG5hbWU6ICAnbW92ZSBjdXJzb3JzJ1xuICAgICAgICAgICAgY29tYm9zOiBbJ2xlZnQnICdyaWdodCcgJ3VwJyAnZG93bicgJ3NoaWZ0K2Rvd24nICdzaGlmdCtyaWdodCcgJ3NoaWZ0K3VwJyAnc2hpZnQrbGVmdCddXG5cbiAgICBtb3ZlQ3Vyc29yc0F0Qm91bmRhcnlMZWZ0OiAgLT4gQHNldE9yTW92ZUN1cnNvcnNBdEJvdW5kYXJ5ICdsZWZ0J1xuICAgIG1vdmVDdXJzb3JzQXRCb3VuZGFyeVJpZ2h0OiAtPiBAc2V0T3JNb3ZlQ3Vyc29yc0F0Qm91bmRhcnkgJ3JpZ2h0J1xuICAgICAgICBcbiAgICBzZXRPck1vdmVDdXJzb3JzQXRCb3VuZGFyeTogKGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBudW1TZWxlY3Rpb25zKCkgPiAxIGFuZCBAbnVtQ3Vyc29ycygpID09IDFcbiAgICAgICAgICAgIEBzZXRDdXJzb3JzQXRTZWxlY3Rpb25Cb3VuZGFyeSBrZXlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1vdmVDdXJzb3JzVG9MaW5lQm91bmRhcnkga2V5XG5cbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG1vdmVNYWluQ3Vyc29yOiAoa2V5LCBpbmZvKSAtPlxuICAgICAgICBcbiAgICAgICAga2xvZyAnbW92ZU1haW5DdXJzb3InIGtleSwgaW5mb1xuICAgICAgICBcbiAgICAgICAgZGlyID0ga2V5IFxuICAgICAgICBocnogPSBrZXkgaW4gWydsZWZ0JyAncmlnaHQnXVxuICAgICAgICBvcHQgPSBfLmNsb25lIGluZm9cbiAgICAgICAgb3B0LmVyYXNlID89IGluZm8ubW9kPy5pbmRleE9mKCdzaGlmdCcpID49IDAgb3IgaHJ6XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIFtkeCwgZHldID0gc3dpdGNoIGRpclxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gWzAsLTFdXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiBbMCwrMV1cbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIFstMSwwXVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gWysxLDBdXG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIG9sZE1haW4gPSBAbWFpbkN1cnNvcigpXG4gICAgICAgIG5ld01haW4gPSBbb2xkTWFpblswXStkeCwgb2xkTWFpblsxXStkeV1cbiAgICAgICAgXy5yZW1vdmUgbmV3Q3Vyc29ycywgKGMpIC0+IFxuICAgICAgICAgICAgaWYgb3B0Py5lcmFzZVxuICAgICAgICAgICAgICAgIGlzU2FtZVBvcyhjLCBvbGRNYWluKSBvciBpc1NhbWVQb3MoYywgbmV3TWFpbilcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpc1NhbWVQb3MoYywgbmV3TWFpbilcbiAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIG5ld01haW5cbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjpuZXdNYWluXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBcbiAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5TGVmdDogIC0+IEBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5ICdsZWZ0J1xuICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnlSaWdodDogLT4gQG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnkgJ3JpZ2h0J1xuICAgIFxuICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnk6IChsZWZ0T3JSaWdodCwgaW5mbyA9IGV4dGVuZDpmYWxzZSkgLT5cbiAgICAgICAgZXh0ZW5kID0gaW5mby5leHRlbmQgPyAwIDw9IGluZm8ubW9kLmluZGV4T2YgJ3NoaWZ0J1xuICAgICAgICBmID0gc3dpdGNoIGxlZnRPclJpZ2h0XG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAZW5kT2ZXb3JkQXRQb3NcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIEBzdGFydE9mV29yZEF0UG9zXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyBmLCBleHRlbmQ6ZXh0ZW5kLCBrZWVwTGluZTp0cnVlXG4gICAgICAgIHRydWVcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbW92ZUN1cnNvcnNUb0xpbmVCb3VuZGFyeTogKGtleSwgaW5mbyA9IGV4dGVuZDpmYWxzZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIGV4dGVuZCA9IGluZm8uZXh0ZW5kID8gMCA8PSBpbmZvLm1vZC5pbmRleE9mICdzaGlmdCdcbiAgICAgICAgZnVuYyA9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyAnZScgJ2VuZCcgdGhlbiAoYykgPT4gW0Bkby5saW5lKGNbMV0pLmxlbmd0aCwgY1sxXV1cbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICdhJyAnaG9tZScgIHRoZW4gKGMpID0+IFxuICAgICAgICAgICAgICAgIGlmIEBkby5saW5lKGNbMV0pLnNsaWNlKDAsY1swXSkudHJpbSgpLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICAgICAgICAgIFswLCBjWzFdXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgZCA9IEBkby5saW5lKGNbMV0pLmxlbmd0aCAtIEBkby5saW5lKGNbMV0pLnRyaW1MZWZ0KCkubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIFtkLCBjWzFdXVxuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgZnVuYywgZXh0ZW5kOmV4dGVuZCwga2VlcExpbmU6dHJ1ZVxuICAgICAgICBAZG8uZW5kKClcblxuICAgIG1vdmVDdXJzb3JzOiAoa2V5LCBpbmZvID0gZXh0ZW5kOmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAgZXh0ZW5kID0gaW5mby5leHRlbmQgPyAnc2hpZnQnID09IGluZm8ubW9kXG4gICAgICAgIHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuIEBtb3ZlQ3Vyc29yc0xlZnQgIGV4dGVuZFxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQG1vdmVDdXJzb3JzUmlnaHQgZXh0ZW5kXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBAbW92ZUN1cnNvcnNVcCAgICBleHRlbmRcbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICB0aGVuIEBtb3ZlQ3Vyc29yc0Rvd24gIGV4dGVuZFxuICAgICAgICBcbiAgICBzZXRDdXJzb3JzQXRTZWxlY3Rpb25Cb3VuZGFyeTogKGxlZnRPclJpZ2h0PSdyaWdodCcpIC0+XG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBpID0gbGVmdE9yUmlnaHQgPT0gJ3JpZ2h0JyBhbmQgMSBvciAwXG4gICAgICAgIG5ld0N1cnNvcnMgPSBbXVxuICAgICAgICBtYWluID0gJ2xhc3QnXG4gICAgICAgIGZvciBzIGluIEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgIHAgPSByYW5nZUluZGV4UG9zIHMsaVxuICAgICAgICAgICAgbmV3Q3Vyc29ycy5wdXNoIHBcbiAgICAgICAgICAgIGlmIEBpc0N1cnNvckluUmFuZ2Ugc1xuICAgICAgICAgICAgICAgIG1haW4gPSBuZXdDdXJzb3JzLmluZGV4T2YgcFxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOm1haW5cbiAgICAgICAgQGRvLmVuZCgpICAgICAgIFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMCAgXG4gICAgXG4gICAgbW92ZUFsbEN1cnNvcnM6IChmdW5jLCBvcHQgPSBleHRlbmQ6ZmFsc2UsIGtlZXBMaW5lOnRydWUpIC0+IFxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEBzdGFydFNlbGVjdGlvbiBvcHRcbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgb2xkTWFpbiA9IEBkby5tYWluQ3Vyc29yKClcbiAgICAgICAgbWFpbkxpbmUgPSBvbGRNYWluWzFdXG4gICAgICAgIFxuICAgICAgICBpZiBuZXdDdXJzb3JzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIGZvciBjIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICBuZXdQb3MgPSBmdW5jIGMgXG4gICAgICAgICAgICAgICAgaWYgbmV3UG9zWzFdID09IGNbMV0gb3Igbm90IG9wdC5rZWVwTGluZVxuICAgICAgICAgICAgICAgICAgICBtYWluTGluZSA9IG5ld1Bvc1sxXSBpZiBpc1NhbWVQb3Mgb2xkTWFpbiwgY1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3JTZXQgYywgbmV3UG9zXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGN1cnNvclNldCBuZXdDdXJzb3JzWzBdLCBmdW5jIG5ld0N1cnNvcnNbMF1cbiAgICAgICAgICAgIG1haW5MaW5lID0gbmV3Q3Vyc29yc1swXVsxXVxuICAgICAgICAgICAgXG4gICAgICAgIG1haW4gPSBzd2l0Y2ggb3B0Lm1haW5cbiAgICAgICAgICAgIHdoZW4gJ3RvcCcgICB0aGVuICdmaXJzdCdcbiAgICAgICAgICAgIHdoZW4gJ2JvdCcgICB0aGVuICdsYXN0J1xuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gJ2Nsb3Nlc3QnXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiAnY2xvc2VzdCdcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQuY2xhbXBcbiAgICAgICAgICAgIGZvciBjaSBpbiBbMC4uLm5ld0N1cnNvcnMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIG5ld0N1cnNvcnNbY2ldID0gQGNsYW1wUG9zIG5ld0N1cnNvcnNbY2ldXG4gICAgICAgICAgICBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjptYWluXG4gICAgICAgIEBlbmRTZWxlY3Rpb24gb3B0XG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICBtb3ZlQ3Vyc29yc1VwOiAoZSwgbj0xKSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyAoKG4pLT4oYyktPltjWzBdLGNbMV0tbl0pKG4pLCBleHRlbmQ6ZSwgbWFpbjogJ3RvcCdcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG1vdmVDdXJzb3JzUmlnaHQ6IChlLCBuPTEpIC0+XG4gICAgICAgIFxuICAgICAgICBtb3ZlUmlnaHQgPSAobikgLT4gKGMpIC0+IFtjWzBdK24sIGNbMV1dXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyBtb3ZlUmlnaHQobiksIGV4dGVuZDplLCBrZWVwTGluZTp0cnVlLCBjbGFtcDp0cnVlLCBtYWluOiAncmlnaHQnXG4gICAgXG4gICAgbW92ZUN1cnNvcnNMZWZ0OiAoZSwgbj0xKSAtPlxuICAgICAgICBcbiAgICAgICAgbW92ZUxlZnQgPSAobikgLT4gKGMpIC0+IFtNYXRoLm1heCgwLGNbMF0tbiksIGNbMV1dXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyBtb3ZlTGVmdChuKSwgZXh0ZW5kOmUsIGtlZXBMaW5lOnRydWUsIG1haW46ICdsZWZ0J1xuICAgICAgICBcbiAgICBtb3ZlQ3Vyc29yc0Rvd246IChlLCBuPTEpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBlIGFuZCBAbnVtU2VsZWN0aW9ucygpID09IDAgIyBzZWxlY3RpbmcgbGluZXMgZG93blxuICAgICAgICAgICAgaWYgMCA9PSBfLm1heCAoY1swXSBmb3IgYyBpbiBAY3Vyc29ycygpKSAjIGFsbCBjdXJzb3JzIGluIGZpcnN0IGNvbHVtblxuICAgICAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICAgICAgQGRvLnNlbGVjdCBAcmFuZ2VzRm9yQ3Vyc29yTGluZXMoKSAjIHNlbGVjdCBsaW5lcyB3aXRob3V0IG1vdmluZyBjdXJzb3JzXG4gICAgICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGVsc2UgaWYgZSBhbmQgQHN0aWNreVNlbGVjdGlvbiBhbmQgQG51bUN1cnNvcnMoKSA9PSAxXG4gICAgICAgICAgICBpZiBAbWFpbkN1cnNvcigpWzBdID09IDAgYW5kIG5vdCBAaXNTZWxlY3RlZExpbmVBdEluZGV4IEBtYWluQ3Vyc29yKClbMV1cbiAgICAgICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgbmV3U2VsZWN0aW9ucy5wdXNoIEByYW5nZUZvckxpbmVBdEluZGV4IEBtYWluQ3Vyc29yKClbMV1cbiAgICAgICAgICAgICAgICBAZG8uc2VsZWN0IG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgKChuKS0+KGMpLT5bY1swXSxjWzFdK25dKShuKSwgZXh0ZW5kOmUsIG1haW46ICdib3QnXG4gICAgICAgIFxuIl19
//# sourceURL=../../../coffee/editor/actions/movecursors.coffee