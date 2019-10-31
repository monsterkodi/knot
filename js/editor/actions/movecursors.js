// koffee 1.4.0
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
            accels: ['ctrl+right', 'ctrl+e']
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZWN1cnNvcnMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFPQSxJQUFBOztBQUFBLE1BQWMsT0FBQSxDQUFRLEtBQVIsQ0FBZCxFQUFFLGVBQUYsRUFBUTs7QUFFUixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFFQSx5QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLHlDQUFOO1lBQ0EsS0FBQSxFQUFPLGNBRFA7WUFFQSxNQUFBLEVBQVEsQ0FBQyxXQUFELEVBQWEsUUFBYixDQUZSO1NBSEo7UUFPQSwwQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLDZCQUFOO1lBQ0EsS0FBQSxFQUFPLGVBRFA7WUFFQSxNQUFBLEVBQVEsQ0FBQyxZQUFELEVBQWMsUUFBZCxDQUZSO1NBUko7UUFZQSx5QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLGlDQUFSO1lBQ0EsSUFBQSxFQUFRLDRFQURSO1lBRUEsTUFBQSxFQUFRLENBQUMsZ0JBQUQsRUFBa0IsaUJBQWxCLENBRlI7U0FiSjtRQWlCQSw2QkFBQSxFQUNJO1lBQUEsU0FBQSxFQUFXLElBQVg7WUFDQSxJQUFBLEVBQVEsK0JBRFI7WUFFQSxLQUFBLEVBQVEsVUFGUjtTQWxCSjtRQXNCQSw4QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLDZCQUFSO1lBQ0EsS0FBQSxFQUFRLFdBRFI7U0F2Qko7UUEwQkEseUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBUSxpQ0FBUjtZQUNBLElBQUEsRUFBUSw0RUFEUjtZQUVBLE1BQUEsRUFBUSxDQUFDLE1BQUQsRUFBUSxLQUFSLEVBQWMsb0JBQWQsRUFBbUMscUJBQW5DLEVBQXlELGlCQUF6RCxFQUEyRSxrQkFBM0UsQ0FGUjtZQUdBLE1BQUEsRUFBUSxDQUFDLE1BQUQsRUFBUSxLQUFSLEVBQWMsWUFBZCxFQUEyQixXQUEzQixFQUF1QyxpQkFBdkMsRUFBeUQsa0JBQXpE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QUE7Z0JBQ2hCLGFBQWEsQ0FBQyxJQUFkLENBQW1CLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQWMsQ0FBQSxDQUFBLENBQW5DLENBQW5CO2dCQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsYUFBWDtnQkFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0FBQ0EsdUJBTko7YUFEQzs7ZUFTTCxJQUFDLENBQUEsY0FBRCxDQUFnQixDQUFDLFNBQUMsQ0FBRDttQkFBSyxTQUFDLENBQUQ7dUJBQUssQ0FBQyxDQUFFLENBQUEsQ0FBQSxDQUFILEVBQU0sQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQVg7WUFBTDtRQUFMLENBQUQsQ0FBQSxDQUEwQixDQUExQixDQUFoQixFQUE4QztZQUFBLE1BQUEsRUFBTyxDQUFQO1lBQVUsSUFBQSxFQUFNLEtBQWhCO1NBQTlDO0lBakJhLENBMU1qQiIsInNvdXJjZXNDb250ZW50IjpbIlxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcblxueyBrbG9nLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID0gXG5cbiAgICBhY3Rpb25zOlxuICAgICAgICBtZW51OiAnQ3Vyc29ycydcbiAgICAgICAgXG4gICAgICAgIG1vdmVDdXJzb3JzQXRCb3VuZGFyeUxlZnQ6IFxuICAgICAgICAgICAgbmFtZTogJ01vdmUgQ3Vyc29ycyB0byBJbmRlbnQgb3IgU3RhcnQgb2YgTGluZSdcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCtsZWZ0J1xuICAgICAgICAgICAgYWNjZWxzOiBbJ2N0cmwrbGVmdCcgJ2N0cmwrYSddXG5cbiAgICAgICAgbW92ZUN1cnNvcnNBdEJvdW5kYXJ5UmlnaHQ6IFxuICAgICAgICAgICAgbmFtZTogJ01vdmUgQ3Vyc29ycyB0byBFbmQgb2YgTGluZSdcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCtyaWdodCdcbiAgICAgICAgICAgIGFjY2VsczogWydjdHJsK3JpZ2h0JyAnY3RybCtlJ11cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeTpcbiAgICAgICAgICAgIG5hbWU6ICAgJ21vdmUgY3Vyc29ycyB0byB3b3JkIGJvdW5kYXJpZXMnXG4gICAgICAgICAgICB0ZXh0OiAgICdtb3ZlcyBjdXJzb3JzIHRvIHdvcmQgYm91bmRhcmllcy4gZXh0ZW5kcyBzZWxlY3Rpb25zLCBpZiBzaGlmdCBpcyBwcmVzc2VkLicgICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbWJvczogWydhbHQrc2hpZnQrbGVmdCcgJ2FsdCtzaGlmdCtyaWdodCddXG4gICAgICAgIFxuICAgICAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5TGVmdDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogICAnTW92ZSBDdXJzb3JzIHRvIFN0YXJ0IG9mIFdvcmQnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrbGVmdCdcblxuICAgICAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5UmlnaHQ6XG4gICAgICAgICAgICBuYW1lOiAgICdNb3ZlIEN1cnNvcnMgdG8gRW5kIG9mIFdvcmQnXG4gICAgICAgICAgICBjb21ibzogICdhbHQrcmlnaHQnXG4gICAgICAgICAgICBcbiAgICAgICAgbW92ZUN1cnNvcnNUb0xpbmVCb3VuZGFyeTpcbiAgICAgICAgICAgIG5hbWU6ICAgJ21vdmUgY3Vyc29ycyB0byBsaW5lIGJvdW5kYXJpZXMnXG4gICAgICAgICAgICB0ZXh0OiAgICdtb3ZlcyBjdXJzb3JzIHRvIGxpbmUgYm91bmRhcmllcy4gZXh0ZW5kcyBzZWxlY3Rpb25zLCBpZiBzaGlmdCBpcyBwcmVzc2VkLidcbiAgICAgICAgICAgIGNvbWJvczogWydob21lJyAnZW5kJyAnY29tbWFuZCtzaGlmdCtsZWZ0JyAnY29tbWFuZCtzaGlmdCtyaWdodCcgJ2N0cmwrc2hpZnQrbGVmdCcgJ2N0cmwrc2hpZnQrcmlnaHQnXVxuICAgICAgICAgICAgYWNjZWxzOiBbJ2hvbWUnICdlbmQnICdzaGlmdCtob21lJyAnc2hpZnQrZW5kJyAnY3RybCtzaGlmdCtsZWZ0JyAnY3RybCtzaGlmdCtyaWdodCcgJ2N0cmwrc2hpZnQrZScgJ2N0cmwrc2hpZnQrYSddXG5cbiAgICAgICAgbW92ZU1haW5DdXJzb3I6XG4gICAgICAgICAgICBuYW1lOiAgICdtb3ZlIG1haW4gY3Vyc29yJ1xuICAgICAgICAgICAgdGV4dDogICBcIlwiXCJtb3ZlIG1haW4gY3Vyc29yIGluZGVwZW5kZW50bHkgb2Ygb3RoZXIgY3Vyc29ycy5cbiAgICAgICAgICAgICAgICBlcmFzZXMgb3RoZXIgY3Vyc29ycyBpZiBzaGlmdCBpcyBwcmVzc2VkLiBcbiAgICAgICAgICAgICAgICBzZXRzIG5ldyBjdXJzb3JzIG90aGVyd2lzZS5cIlwiXCJcbiAgICAgICAgICAgIGNvbWJvczogWyAnY3RybCtzaGlmdCt1cCcgJ2N0cmwrc2hpZnQrZG93bicgJ2N0cmwrc2hpZnQrbGVmdCcgJ2N0cmwrc2hpZnQrcmlnaHQnICdjdHJsK3VwJyAnY3RybCtkb3duJyAnY3RybCtsZWZ0JyAnY3RybCtyaWdodCddXG4gICAgICAgICAgICBhY2NlbHM6IFsgJ2N0cmwrc2hpZnQrdXAnICdjdHJsK3NoaWZ0K2Rvd24nXVxuICAgICAgICAgICAgXG4gICAgICAgIG1vdmVDdXJzb3JzOlxuICAgICAgICAgICAgbmFtZTogICdtb3ZlIGN1cnNvcnMnXG4gICAgICAgICAgICBjb21ib3M6IFsnbGVmdCcgJ3JpZ2h0JyAndXAnICdkb3duJyAnc2hpZnQrZG93bicgJ3NoaWZ0K3JpZ2h0JyAnc2hpZnQrdXAnICdzaGlmdCtsZWZ0J11cblxuICAgIG1vdmVDdXJzb3JzQXRCb3VuZGFyeUxlZnQ6ICAtPiBAc2V0T3JNb3ZlQ3Vyc29yc0F0Qm91bmRhcnkgJ2xlZnQnXG4gICAgbW92ZUN1cnNvcnNBdEJvdW5kYXJ5UmlnaHQ6IC0+IEBzZXRPck1vdmVDdXJzb3JzQXRCb3VuZGFyeSAncmlnaHQnXG4gICAgICAgIFxuICAgIHNldE9yTW92ZUN1cnNvcnNBdEJvdW5kYXJ5OiAoa2V5KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQG51bVNlbGVjdGlvbnMoKSA+IDEgYW5kIEBudW1DdXJzb3JzKCkgPT0gMVxuICAgICAgICAgICAgQHNldEN1cnNvcnNBdFNlbGVjdGlvbkJvdW5kYXJ5IGtleVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbW92ZUN1cnNvcnNUb0xpbmVCb3VuZGFyeSBrZXlcblxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbW92ZU1haW5DdXJzb3I6IChrZXksIGluZm8pIC0+XG4gICAgICAgIFxuICAgICAgICBrbG9nICdtb3ZlTWFpbkN1cnNvcicga2V5LCBpbmZvXG4gICAgICAgIFxuICAgICAgICBkaXIgPSBrZXkgXG4gICAgICAgIGhyeiA9IGtleSBpbiBbJ2xlZnQnICdyaWdodCddXG4gICAgICAgIG9wdCA9IF8uY2xvbmUgaW5mb1xuICAgICAgICBvcHQuZXJhc2UgPz0gaW5mby5tb2Q/LmluZGV4T2YoJ3NoaWZ0JykgPj0gMCBvciBocnpcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgW2R4LCBkeV0gPSBzd2l0Y2ggZGlyXG4gICAgICAgICAgICB3aGVuICd1cCcgICAgdGhlbiBbMCwtMV1cbiAgICAgICAgICAgIHdoZW4gJ2Rvd24nICB0aGVuIFswLCsxXVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gWy0xLDBdXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBbKzEsMF1cbiAgICAgICAgbmV3Q3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgb2xkTWFpbiA9IEBtYWluQ3Vyc29yKClcbiAgICAgICAgbmV3TWFpbiA9IFtvbGRNYWluWzBdK2R4LCBvbGRNYWluWzFdK2R5XVxuICAgICAgICBfLnJlbW92ZSBuZXdDdXJzb3JzLCAoYykgLT4gXG4gICAgICAgICAgICBpZiBvcHQ/LmVyYXNlXG4gICAgICAgICAgICAgICAgaXNTYW1lUG9zKGMsIG9sZE1haW4pIG9yIGlzU2FtZVBvcyhjLCBuZXdNYWluKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlzU2FtZVBvcyhjLCBuZXdNYWluKVxuICAgICAgICBuZXdDdXJzb3JzLnB1c2ggbmV3TWFpblxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOm5ld01haW5cbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIFxuICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnlMZWZ0OiAgLT4gQG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnkgJ2xlZnQnXG4gICAgbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeVJpZ2h0OiAtPiBAbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeSAncmlnaHQnXG4gICAgXG4gICAgbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeTogKGxlZnRPclJpZ2h0LCBpbmZvID0gZXh0ZW5kOmZhbHNlKSAtPlxuICAgICAgICBleHRlbmQgPSBpbmZvLmV4dGVuZCA/IDAgPD0gaW5mby5tb2QuaW5kZXhPZiAnc2hpZnQnXG4gICAgICAgIGYgPSBzd2l0Y2ggbGVmdE9yUmlnaHRcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBlbmRPZldvcmRBdFBvc1xuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQHN0YXJ0T2ZXb3JkQXRQb3NcbiAgICAgICAgQG1vdmVBbGxDdXJzb3JzIGYsIGV4dGVuZDpleHRlbmQsIGtlZXBMaW5lOnRydWVcbiAgICAgICAgdHJ1ZVxuXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBtb3ZlQ3Vyc29yc1RvTGluZUJvdW5kYXJ5OiAoa2V5LCBpbmZvID0gZXh0ZW5kOmZhbHNlKSAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgZXh0ZW5kID0gaW5mby5leHRlbmQgPyAwIDw9IGluZm8ubW9kLmluZGV4T2YgJ3NoaWZ0J1xuICAgICAgICBmdW5jID0gc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAncmlnaHQnICdlJyAnZW5kJyB0aGVuIChjKSA9PiBbQGRvLmxpbmUoY1sxXSkubGVuZ3RoLCBjWzFdXVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgJ2EnICdob21lJyAgdGhlbiAoYykgPT4gXG4gICAgICAgICAgICAgICAgaWYgQGRvLmxpbmUoY1sxXSkuc2xpY2UoMCxjWzBdKS50cmltKCkubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgICAgICAgWzAsIGNbMV1dXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBkID0gQGRvLmxpbmUoY1sxXSkubGVuZ3RoIC0gQGRvLmxpbmUoY1sxXSkudHJpbUxlZnQoKS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgW2QsIGNbMV1dXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyBmdW5jLCBleHRlbmQ6ZXh0ZW5kLCBrZWVwTGluZTp0cnVlXG4gICAgICAgIEBkby5lbmQoKVxuXG4gICAgbW92ZUN1cnNvcnM6IChrZXksIGluZm8gPSBleHRlbmQ6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICBleHRlbmQgPSBpbmZvLmV4dGVuZCA/ICdzaGlmdCcgPT0gaW5mby5tb2RcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQG1vdmVDdXJzb3JzTGVmdCAgZXh0ZW5kXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAbW92ZUN1cnNvcnNSaWdodCBleHRlbmRcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIEBtb3ZlQ3Vyc29yc1VwICAgIGV4dGVuZFxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gQG1vdmVDdXJzb3JzRG93biAgZXh0ZW5kXG4gICAgICAgIFxuICAgIHNldEN1cnNvcnNBdFNlbGVjdGlvbkJvdW5kYXJ5OiAobGVmdE9yUmlnaHQ9J3JpZ2h0JykgLT5cbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIGkgPSBsZWZ0T3JSaWdodCA9PSAncmlnaHQnIGFuZCAxIG9yIDBcbiAgICAgICAgbmV3Q3Vyc29ycyA9IFtdXG4gICAgICAgIG1haW4gPSAnbGFzdCdcbiAgICAgICAgZm9yIHMgaW4gQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgcCA9IHJhbmdlSW5kZXhQb3MgcyxpXG4gICAgICAgICAgICBuZXdDdXJzb3JzLnB1c2ggcFxuICAgICAgICAgICAgaWYgQGlzQ3Vyc29ySW5SYW5nZSBzXG4gICAgICAgICAgICAgICAgbWFpbiA9IG5ld0N1cnNvcnMuaW5kZXhPZiBwXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46bWFpblxuICAgICAgICBAZG8uZW5kKCkgICAgICAgXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBtb3ZlQWxsQ3Vyc29yczogKGZ1bmMsIG9wdCA9IGV4dGVuZDpmYWxzZSwga2VlcExpbmU6dHJ1ZSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQHN0YXJ0U2VsZWN0aW9uIG9wdFxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBvbGRNYWluID0gQGRvLm1haW5DdXJzb3IoKVxuICAgICAgICBtYWluTGluZSA9IG9sZE1haW5bMV1cbiAgICAgICAgXG4gICAgICAgIGlmIG5ld0N1cnNvcnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgZm9yIGMgaW4gbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgIG5ld1BvcyA9IGZ1bmMgYyBcbiAgICAgICAgICAgICAgICBpZiBuZXdQb3NbMV0gPT0gY1sxXSBvciBub3Qgb3B0LmtlZXBMaW5lXG4gICAgICAgICAgICAgICAgICAgIG1haW5MaW5lID0gbmV3UG9zWzFdIGlmIGlzU2FtZVBvcyBvbGRNYWluLCBjXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvclNldCBjLCBuZXdQb3NcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY3Vyc29yU2V0IG5ld0N1cnNvcnNbMF0sIGZ1bmMgbmV3Q3Vyc29yc1swXVxuICAgICAgICAgICAgbWFpbkxpbmUgPSBuZXdDdXJzb3JzWzBdWzFdXG4gICAgICAgICAgICBcbiAgICAgICAgbWFpbiA9IHN3aXRjaCBvcHQubWFpblxuICAgICAgICAgICAgd2hlbiAndG9wJyAgIHRoZW4gJ2ZpcnN0J1xuICAgICAgICAgICAgd2hlbiAnYm90JyAgIHRoZW4gJ2xhc3QnXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiAnY2xvc2VzdCdcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuICdjbG9zZXN0J1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9wdC5jbGFtcFxuICAgICAgICAgICAgZm9yIGNpIGluIFswLi4ubmV3Q3Vyc29ycy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgbmV3Q3Vyc29yc1tjaV0gPSBAY2xhbXBQb3MgbmV3Q3Vyc29yc1tjaV1cbiAgICAgICAgICAgIFxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzLCBtYWluOm1haW5cbiAgICAgICAgQGVuZFNlbGVjdGlvbiBvcHRcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgIG1vdmVDdXJzb3JzVXA6IChlLCBuPTEpIC0+IFxuICAgICAgICBcbiAgICAgICAgQG1vdmVBbGxDdXJzb3JzICgobiktPihjKS0+W2NbMF0sY1sxXS1uXSkobiksIGV4dGVuZDplLCBtYWluOiAndG9wJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgbW92ZUN1cnNvcnNSaWdodDogKGUsIG49MSkgLT5cbiAgICAgICAgXG4gICAgICAgIG1vdmVSaWdodCA9IChuKSAtPiAoYykgLT4gW2NbMF0rbiwgY1sxXV1cbiAgICAgICAgQG1vdmVBbGxDdXJzb3JzIG1vdmVSaWdodChuKSwgZXh0ZW5kOmUsIGtlZXBMaW5lOnRydWUsIGNsYW1wOnRydWUsIG1haW46ICdyaWdodCdcbiAgICBcbiAgICBtb3ZlQ3Vyc29yc0xlZnQ6IChlLCBuPTEpIC0+XG4gICAgICAgIFxuICAgICAgICBtb3ZlTGVmdCA9IChuKSAtPiAoYykgLT4gW01hdGgubWF4KDAsY1swXS1uKSwgY1sxXV1cbiAgICAgICAgQG1vdmVBbGxDdXJzb3JzIG1vdmVMZWZ0KG4pLCBleHRlbmQ6ZSwga2VlcExpbmU6dHJ1ZSwgbWFpbjogJ2xlZnQnXG4gICAgICAgIFxuICAgIG1vdmVDdXJzb3JzRG93bjogKGUsIG49MSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGUgYW5kIEBudW1TZWxlY3Rpb25zKCkgPT0gMCAjIHNlbGVjdGluZyBsaW5lcyBkb3duXG4gICAgICAgICAgICBpZiAwID09IF8ubWF4IChjWzBdIGZvciBjIGluIEBjdXJzb3JzKCkpICMgYWxsIGN1cnNvcnMgaW4gZmlyc3QgY29sdW1uXG4gICAgICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgICAgICBAZG8uc2VsZWN0IEByYW5nZXNGb3JDdXJzb3JMaW5lcygpICMgc2VsZWN0IGxpbmVzIHdpdGhvdXQgbW92aW5nIGN1cnNvcnNcbiAgICAgICAgICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgZWxzZSBpZiBlIGFuZCBAc3RpY2t5U2VsZWN0aW9uIGFuZCBAbnVtQ3Vyc29ycygpID09IDFcbiAgICAgICAgICAgIGlmIEBtYWluQ3Vyc29yKClbMF0gPT0gMCBhbmQgbm90IEBpc1NlbGVjdGVkTGluZUF0SW5kZXggQG1haW5DdXJzb3IoKVsxXVxuICAgICAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICAgICAgbmV3U2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICBuZXdTZWxlY3Rpb25zLnB1c2ggQHJhbmdlRm9yTGluZUF0SW5kZXggQG1haW5DdXJzb3IoKVsxXVxuICAgICAgICAgICAgICAgIEBkby5zZWxlY3QgbmV3U2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIEBtb3ZlQWxsQ3Vyc29ycyAoKG4pLT4oYyktPltjWzBdLGNbMV0rbl0pKG4pLCBleHRlbmQ6ZSwgbWFpbjogJ2JvdCdcbiAgICAgICAgXG4iXX0=
//# sourceURL=../../../coffee/editor/actions/movecursors.coffee