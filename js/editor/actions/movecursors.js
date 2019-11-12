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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZWN1cnNvcnMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFPQSxJQUFBOztBQUFBLE1BQWMsT0FBQSxDQUFRLEtBQVIsQ0FBZCxFQUFFLGVBQUYsRUFBUTs7QUFFUixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFNBQU47UUFFQSx5QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLHlDQUFOO1lBQ0EsS0FBQSxFQUFPLGNBRFA7WUFFQSxNQUFBLEVBQVEsQ0FBQyxXQUFELEVBQWEsUUFBYixDQUZSO1NBSEo7UUFPQSwwQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFNLDZCQUFOO1lBQ0EsS0FBQSxFQUFPLGVBRFA7WUFFQSxNQUFBLEVBQVEsQ0FBQyxZQUFELENBRlI7U0FSSjtRQVlBLHlCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQVEsaUNBQVI7WUFDQSxJQUFBLEVBQVEsNEVBRFI7WUFFQSxNQUFBLEVBQVEsQ0FBQyxnQkFBRCxFQUFrQixpQkFBbEIsQ0FGUjtTQWJKO1FBaUJBLDZCQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsSUFBWDtZQUNBLElBQUEsRUFBUSwrQkFEUjtZQUVBLEtBQUEsRUFBUSxVQUZSO1NBbEJKO1FBc0JBLDhCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQVEsNkJBQVI7WUFDQSxLQUFBLEVBQVEsV0FEUjtTQXZCSjtRQTBCQSx5QkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLGlDQUFSO1lBQ0EsSUFBQSxFQUFRLDRFQURSO1lBRUEsTUFBQSxFQUFRLENBQUMsTUFBRCxFQUFRLEtBQVIsRUFBYyxvQkFBZCxFQUFtQyxxQkFBbkMsRUFBeUQsaUJBQXpELEVBQTJFLGtCQUEzRSxDQUZSO1lBR0EsTUFBQSxFQUFRLENBQUMsTUFBRCxFQUFRLEtBQVIsRUFBYyxZQUFkLEVBQTJCLFdBQTNCLEVBQXVDLGlCQUF2QyxFQUF5RCxrQkFBekQsRUFBNEUsY0FBNUUsRUFBMkYsY0FBM0YsQ0FIUjtTQTNCSjtRQWdDQSxjQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQVEsa0JBQVI7WUFDQSxJQUFBLEVBQVEsMkhBRFI7WUFJQSxNQUFBLEVBQVEsQ0FBRSxlQUFGLEVBQWtCLGlCQUFsQixFQUFvQyxpQkFBcEMsRUFBc0Qsa0JBQXRELEVBQXlFLFNBQXpFLEVBQW1GLFdBQW5GLEVBQStGLFdBQS9GLEVBQTJHLFlBQTNHLENBSlI7WUFLQSxNQUFBLEVBQVEsQ0FBRSxlQUFGLEVBQWtCLGlCQUFsQixDQUxSO1NBakNKO1FBd0NBLFdBQUEsRUFDSTtZQUFBLElBQUEsRUFBTyxjQUFQO1lBQ0EsTUFBQSxFQUFRLENBQUMsTUFBRCxFQUFRLE9BQVIsRUFBZ0IsSUFBaEIsRUFBcUIsTUFBckIsRUFBNEIsWUFBNUIsRUFBeUMsYUFBekMsRUFBdUQsVUFBdkQsRUFBa0UsWUFBbEUsQ0FEUjtTQXpDSjtLQURKO0lBNkNBLHlCQUFBLEVBQTRCLFNBQUE7ZUFBRyxJQUFDLENBQUEsMEJBQUQsQ0FBNEIsTUFBNUI7SUFBSCxDQTdDNUI7SUE4Q0EsMEJBQUEsRUFBNEIsU0FBQTtlQUFHLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixPQUE1QjtJQUFILENBOUM1QjtJQWdEQSwwQkFBQSxFQUE0QixTQUFDLEdBQUQ7UUFFeEIsSUFBRyxJQUFDLENBQUEsYUFBRCxDQUFBLENBQUEsR0FBbUIsQ0FBbkIsSUFBeUIsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFBLEtBQWlCLENBQTdDO21CQUNJLElBQUMsQ0FBQSw2QkFBRCxDQUErQixHQUEvQixFQURKO1NBQUEsTUFBQTttQkFHSSxJQUFDLENBQUEseUJBQUQsQ0FBMkIsR0FBM0IsRUFISjs7SUFGd0IsQ0FoRDVCO0lBNkRBLGNBQUEsRUFBZ0IsU0FBQyxHQUFELEVBQU0sSUFBTjtBQUVaLFlBQUE7UUFBQSxJQUFBLENBQUssZ0JBQUwsRUFBc0IsR0FBdEIsRUFBMkIsSUFBM0I7UUFFQSxHQUFBLEdBQU07UUFDTixHQUFBLEdBQU0sR0FBQSxLQUFRLE1BQVIsSUFBQSxHQUFBLEtBQWU7UUFDckIsR0FBQSxHQUFNLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBUjs7WUFDTixHQUFHLENBQUM7O1lBQUosR0FBRyxDQUFDLHlDQUFpQixDQUFFLE9BQVYsQ0FBa0IsT0FBbEIsV0FBQSxJQUE4QixDQUE5QixJQUFtQzs7UUFDaEQsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBO0FBQVcsb0JBQU8sR0FBUDtBQUFBLHFCQUNGLElBREU7MkJBQ1csQ0FBQyxDQUFELEVBQUcsQ0FBQyxDQUFKO0FBRFgscUJBRUYsTUFGRTsyQkFFVyxDQUFDLENBQUQsRUFBRyxDQUFDLENBQUo7QUFGWCxxQkFHRixNQUhFOzJCQUdXLENBQUMsQ0FBQyxDQUFGLEVBQUksQ0FBSjtBQUhYLHFCQUlGLE9BSkU7MkJBSVcsQ0FBQyxDQUFDLENBQUYsRUFBSSxDQUFKO0FBSlg7WUFBWCxFQUFDLFlBQUQsRUFBSztRQUtMLFVBQUEsR0FBYSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsT0FBSixDQUFBO1FBQ2IsT0FBQSxHQUFVLElBQUMsQ0FBQSxVQUFELENBQUE7UUFDVixPQUFBLEdBQVUsQ0FBQyxPQUFRLENBQUEsQ0FBQSxDQUFSLEdBQVcsRUFBWixFQUFnQixPQUFRLENBQUEsQ0FBQSxDQUFSLEdBQVcsRUFBM0I7UUFDVixDQUFDLENBQUMsTUFBRixDQUFTLFVBQVQsRUFBcUIsU0FBQyxDQUFEO1lBQ2pCLGtCQUFHLEdBQUcsQ0FBRSxjQUFSO3VCQUNJLFNBQUEsQ0FBVSxDQUFWLEVBQWEsT0FBYixDQUFBLElBQXlCLFNBQUEsQ0FBVSxDQUFWLEVBQWEsT0FBYixFQUQ3QjthQUFBLE1BQUE7dUJBR0ksU0FBQSxDQUFVLENBQVYsRUFBYSxPQUFiLEVBSEo7O1FBRGlCLENBQXJCO1FBS0EsVUFBVSxDQUFDLElBQVgsQ0FBZ0IsT0FBaEI7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWYsRUFBMkI7WUFBQSxJQUFBLEVBQUssT0FBTDtTQUEzQjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUF4QlksQ0E3RGhCO0lBOEZBLDZCQUFBLEVBQWdDLFNBQUE7ZUFBRyxJQUFDLENBQUEseUJBQUQsQ0FBMkIsTUFBM0I7SUFBSCxDQTlGaEM7SUErRkEsOEJBQUEsRUFBZ0MsU0FBQTtlQUFHLElBQUMsQ0FBQSx5QkFBRCxDQUEyQixPQUEzQjtJQUFILENBL0ZoQztJQWlHQSx5QkFBQSxFQUEyQixTQUFDLFdBQUQsRUFBYyxJQUFkO0FBQ3ZCLFlBQUE7O1lBRHFDLE9BQU87Z0JBQUEsTUFBQSxFQUFPLEtBQVA7OztRQUM1QyxNQUFBLHlDQUF1QixDQUFBLElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFULENBQWlCLE9BQWpCO1FBQzVCLENBQUE7QUFBSSxvQkFBTyxXQUFQO0FBQUEscUJBQ0ssT0FETDsyQkFDa0IsSUFBQyxDQUFBO0FBRG5CLHFCQUVLLE1BRkw7MkJBRWtCLElBQUMsQ0FBQTtBQUZuQjs7UUFHSixJQUFDLENBQUEsY0FBRCxDQUFnQixDQUFoQixFQUFtQjtZQUFBLE1BQUEsRUFBTyxNQUFQO1lBQWUsUUFBQSxFQUFTLElBQXhCO1NBQW5CO2VBQ0E7SUFOdUIsQ0FqRzNCO0lBK0dBLHlCQUFBLEVBQTJCLFNBQUMsR0FBRCxFQUFNLElBQU47QUFFdkIsWUFBQTs7WUFGNkIsT0FBTztnQkFBQSxNQUFBLEVBQU8sS0FBUDs7O1FBRXBDLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxNQUFBLHlDQUF1QixDQUFBLElBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFULENBQWlCLE9BQWpCO1FBQzVCLElBQUE7QUFBTyxvQkFBTyxHQUFQO0FBQUEscUJBQ0UsT0FERjtBQUFBLHFCQUNVLEdBRFY7QUFBQSxxQkFDYyxLQURkOzJCQUN5QixDQUFBLFNBQUEsS0FBQTsrQkFBQSxTQUFDLENBQUQ7bUNBQU8sQ0FBQyxLQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsQ0FBYyxDQUFDLE1BQWhCLEVBQXdCLENBQUUsQ0FBQSxDQUFBLENBQTFCO3dCQUFQO29CQUFBLENBQUEsQ0FBQSxDQUFBLElBQUE7QUFEekIscUJBRUUsTUFGRjtBQUFBLHFCQUVTLEdBRlQ7QUFBQSxxQkFFYSxNQUZiOzJCQUUwQixDQUFBLFNBQUEsS0FBQTsrQkFBQSxTQUFDLENBQUQ7QUFDekIsZ0NBQUE7NEJBQUEsSUFBRyxLQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsQ0FBYyxDQUFDLEtBQWYsQ0FBcUIsQ0FBckIsRUFBdUIsQ0FBRSxDQUFBLENBQUEsQ0FBekIsQ0FBNEIsQ0FBQyxJQUE3QixDQUFBLENBQW1DLENBQUMsTUFBcEMsS0FBOEMsQ0FBakQ7dUNBQ0ksQ0FBQyxDQUFELEVBQUksQ0FBRSxDQUFBLENBQUEsQ0FBTixFQURKOzZCQUFBLE1BQUE7Z0NBR0ksQ0FBQSxHQUFJLEtBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBZixHQUF3QixLQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsQ0FBYyxDQUFDLFFBQWYsQ0FBQSxDQUF5QixDQUFDO3VDQUN0RCxDQUFDLENBQUQsRUFBSSxDQUFFLENBQUEsQ0FBQSxDQUFOLEVBSko7O3dCQUR5QjtvQkFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO0FBRjFCOztRQVFQLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQWhCLEVBQXNCO1lBQUEsTUFBQSxFQUFPLE1BQVA7WUFBZSxRQUFBLEVBQVMsSUFBeEI7U0FBdEI7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBYnVCLENBL0czQjtJQThIQSxXQUFBLEVBQWEsU0FBQyxHQUFELEVBQU0sSUFBTjtBQUVULFlBQUE7O1lBRmUsT0FBTztnQkFBQSxNQUFBLEVBQU8sS0FBUDs7O1FBRXRCLE1BQUEseUNBQXVCLE9BQUEsS0FBVyxJQUFJLENBQUM7QUFDdkMsZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE1BRFQ7dUJBQ3NCLElBQUMsQ0FBQSxlQUFELENBQWtCLE1BQWxCO0FBRHRCLGlCQUVTLE9BRlQ7dUJBRXNCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixNQUFsQjtBQUZ0QixpQkFHUyxJQUhUO3VCQUdzQixJQUFDLENBQUEsYUFBRCxDQUFrQixNQUFsQjtBQUh0QixpQkFJUyxNQUpUO3VCQUlzQixJQUFDLENBQUEsZUFBRCxDQUFrQixNQUFsQjtBQUp0QjtJQUhTLENBOUhiO0lBdUlBLDZCQUFBLEVBQStCLFNBQUMsV0FBRDtBQUUzQixZQUFBOztZQUY0QixjQUFZOztRQUV4QyxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBQ0EsQ0FBQSxHQUFJLFdBQUEsS0FBZSxPQUFmLElBQTJCLENBQTNCLElBQWdDO1FBQ3BDLFVBQUEsR0FBYTtRQUNiLElBQUEsR0FBTztBQUNQO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxDQUFBLEdBQUksYUFBQSxDQUFjLENBQWQsRUFBZ0IsQ0FBaEI7WUFDSixVQUFVLENBQUMsSUFBWCxDQUFnQixDQUFoQjtZQUNBLElBQUcsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsQ0FBakIsQ0FBSDtnQkFDSSxJQUFBLEdBQU8sVUFBVSxDQUFDLE9BQVgsQ0FBbUIsQ0FBbkIsRUFEWDs7QUFISjtRQUtBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQWUsVUFBZixFQUEyQjtZQUFBLElBQUEsRUFBSyxJQUFMO1NBQTNCO2VBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQVoyQixDQXZJL0I7SUEySkEsY0FBQSxFQUFnQixTQUFDLElBQUQsRUFBTyxHQUFQO0FBRVosWUFBQTs7WUFGbUIsTUFBTTtnQkFBQSxNQUFBLEVBQU8sS0FBUDtnQkFBYyxRQUFBLEVBQVMsSUFBdkI7OztRQUV6QixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBRUEsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsR0FBaEI7UUFDQSxVQUFBLEdBQWEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtRQUNiLE9BQUEsR0FBVSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFBO1FBQ1YsUUFBQSxHQUFXLE9BQVEsQ0FBQSxDQUFBO1FBRW5CLElBQUcsVUFBVSxDQUFDLE1BQVgsR0FBb0IsQ0FBdkI7QUFDSSxpQkFBQSw0Q0FBQTs7Z0JBQ0ksTUFBQSxHQUFTLElBQUEsQ0FBSyxDQUFMO2dCQUNULElBQUcsTUFBTyxDQUFBLENBQUEsQ0FBUCxLQUFhLENBQUUsQ0FBQSxDQUFBLENBQWYsSUFBcUIsQ0FBSSxHQUFHLENBQUMsUUFBaEM7b0JBQ0ksSUFBd0IsU0FBQSxDQUFVLE9BQVYsRUFBbUIsQ0FBbkIsQ0FBeEI7d0JBQUEsUUFBQSxHQUFXLE1BQU8sQ0FBQSxDQUFBLEVBQWxCOztvQkFDQSxTQUFBLENBQVUsQ0FBVixFQUFhLE1BQWIsRUFGSjs7QUFGSixhQURKO1NBQUEsTUFBQTtZQU9JLFNBQUEsQ0FBVSxVQUFXLENBQUEsQ0FBQSxDQUFyQixFQUF5QixJQUFBLENBQUssVUFBVyxDQUFBLENBQUEsQ0FBaEIsQ0FBekI7WUFDQSxRQUFBLEdBQVcsVUFBVyxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsRUFSN0I7O1FBVUEsSUFBQTtBQUFPLG9CQUFPLEdBQUcsQ0FBQyxJQUFYO0FBQUEscUJBQ0UsS0FERjsyQkFDZTtBQURmLHFCQUVFLEtBRkY7MkJBRWU7QUFGZixxQkFHRSxNQUhGOzJCQUdlO0FBSGYscUJBSUUsT0FKRjsyQkFJZTtBQUpmOztRQU1QLElBQUcsR0FBRyxDQUFDLEtBQVA7QUFDSSxpQkFBVSxpR0FBVjtnQkFDSSxVQUFXLENBQUEsRUFBQSxDQUFYLEdBQWlCLElBQUMsQ0FBQSxRQUFELENBQVUsVUFBVyxDQUFBLEVBQUEsQ0FBckI7QUFEckIsYUFESjs7UUFJQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWYsRUFBMkI7WUFBQSxJQUFBLEVBQUssSUFBTDtTQUEzQjtRQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsR0FBZDtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUEvQlksQ0EzSmhCO0lBNExBLGFBQUEsRUFBZSxTQUFDLENBQUQsRUFBSSxDQUFKOztZQUFJLElBQUU7O2VBRWpCLElBQUMsQ0FBQSxjQUFELENBQWdCLENBQUMsU0FBQyxDQUFEO21CQUFLLFNBQUMsQ0FBRDt1QkFBSyxDQUFDLENBQUUsQ0FBQSxDQUFBLENBQUgsRUFBTSxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBWDtZQUFMO1FBQUwsQ0FBRCxDQUFBLENBQTBCLENBQTFCLENBQWhCLEVBQThDO1lBQUEsTUFBQSxFQUFPLENBQVA7WUFBVSxJQUFBLEVBQU0sS0FBaEI7U0FBOUM7SUFGVyxDQTVMZjtJQWdNQSxnQkFBQSxFQUFrQixTQUFDLENBQUQsRUFBSSxDQUFKO0FBRWQsWUFBQTs7WUFGa0IsSUFBRTs7UUFFcEIsU0FBQSxHQUFZLFNBQUMsQ0FBRDttQkFBTyxTQUFDLENBQUQ7dUJBQU8sQ0FBQyxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBTixFQUFTLENBQUUsQ0FBQSxDQUFBLENBQVg7WUFBUDtRQUFQO2VBQ1osSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsU0FBQSxDQUFVLENBQVYsQ0FBaEIsRUFBOEI7WUFBQSxNQUFBLEVBQU8sQ0FBUDtZQUFVLFFBQUEsRUFBUyxJQUFuQjtZQUF5QixLQUFBLEVBQU0sSUFBL0I7WUFBcUMsSUFBQSxFQUFNLE9BQTNDO1NBQTlCO0lBSGMsQ0FoTWxCO0lBcU1BLGVBQUEsRUFBaUIsU0FBQyxDQUFELEVBQUksQ0FBSjtBQUViLFlBQUE7O1lBRmlCLElBQUU7O1FBRW5CLFFBQUEsR0FBVyxTQUFDLENBQUQ7bUJBQU8sU0FBQyxDQUFEO3VCQUFPLENBQUMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQWhCLENBQUQsRUFBcUIsQ0FBRSxDQUFBLENBQUEsQ0FBdkI7WUFBUDtRQUFQO2VBQ1gsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsUUFBQSxDQUFTLENBQVQsQ0FBaEIsRUFBNkI7WUFBQSxNQUFBLEVBQU8sQ0FBUDtZQUFVLFFBQUEsRUFBUyxJQUFuQjtZQUF5QixJQUFBLEVBQU0sTUFBL0I7U0FBN0I7SUFIYSxDQXJNakI7SUEwTUEsZUFBQSxFQUFpQixTQUFDLENBQUQsRUFBSSxDQUFKO0FBRWIsWUFBQTs7WUFGaUIsSUFBRTs7UUFFbkIsSUFBRyxDQUFBLElBQU0sSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFBLEtBQW9CLENBQTdCO1lBQ0ksSUFBRyxDQUFBLEtBQUssQ0FBQyxDQUFDLEdBQUY7O0FBQU87QUFBQTtxQkFBQSxzQ0FBQTs7aUNBQUEsQ0FBRSxDQUFBLENBQUE7QUFBRjs7eUJBQVAsQ0FBUjtnQkFDSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO2dCQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsSUFBQyxDQUFBLG9CQUFELENBQUEsQ0FBWDtnQkFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0FBQ0EsdUJBSko7YUFESjtTQUFBLE1BTUssSUFBRyxDQUFBLElBQU0sSUFBQyxDQUFBLGVBQVAsSUFBMkIsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFBLEtBQWlCLENBQS9DO1lBQ0QsSUFBRyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQWMsQ0FBQSxDQUFBLENBQWQsS0FBb0IsQ0FBcEIsSUFBMEIsQ0FBSSxJQUFDLENBQUEscUJBQUQsQ0FBdUIsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFjLENBQUEsQ0FBQSxDQUFyQyxDQUFqQztnQkFDSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO2dCQUNBLGFBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBQTtnQkFDaEIsYUFBYSxDQUFDLElBQWQsQ0FBbUIsSUFBQyxDQUFBLG1CQUFELENBQXFCLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYyxDQUFBLENBQUEsQ0FBbkMsQ0FBbkI7Z0JBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxhQUFYO2dCQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7QUFDQSx1QkFOSjthQURDOztlQVNMLElBQUMsQ0FBQSxjQUFELENBQWdCLENBQUMsU0FBQyxDQUFEO21CQUFLLFNBQUMsQ0FBRDt1QkFBSyxDQUFDLENBQUUsQ0FBQSxDQUFBLENBQUgsRUFBTSxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQUssQ0FBWDtZQUFMO1FBQUwsQ0FBRCxDQUFBLENBQTBCLENBQTFCLENBQWhCLEVBQThDO1lBQUEsTUFBQSxFQUFPLENBQVA7WUFBVSxJQUFBLEVBQU0sS0FBaEI7U0FBOUM7SUFqQmEsQ0ExTWpCIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICBcbiMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuXG57IGtsb2csIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubW9kdWxlLmV4cG9ydHMgPSBcblxuICAgIGFjdGlvbnM6XG4gICAgICAgIG1lbnU6ICdDdXJzb3JzJ1xuICAgICAgICBcbiAgICAgICAgbW92ZUN1cnNvcnNBdEJvdW5kYXJ5TGVmdDogXG4gICAgICAgICAgICBuYW1lOiAnTW92ZSBDdXJzb3JzIHRvIEluZGVudCBvciBTdGFydCBvZiBMaW5lJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2xlZnQnXG4gICAgICAgICAgICBhY2NlbHM6IFsnY3RybCtsZWZ0JyAnY3RybCthJ11cblxuICAgICAgICBtb3ZlQ3Vyc29yc0F0Qm91bmRhcnlSaWdodDogXG4gICAgICAgICAgICBuYW1lOiAnTW92ZSBDdXJzb3JzIHRvIEVuZCBvZiBMaW5lJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK3JpZ2h0J1xuICAgICAgICAgICAgYWNjZWxzOiBbJ2N0cmwrcmlnaHQnXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5OlxuICAgICAgICAgICAgbmFtZTogICAnbW92ZSBjdXJzb3JzIHRvIHdvcmQgYm91bmRhcmllcydcbiAgICAgICAgICAgIHRleHQ6ICAgJ21vdmVzIGN1cnNvcnMgdG8gd29yZCBib3VuZGFyaWVzLiBleHRlbmRzIHNlbGVjdGlvbnMsIGlmIHNoaWZ0IGlzIHByZXNzZWQuJyAgICAgICAgICAgIFxuICAgICAgICAgICAgY29tYm9zOiBbJ2FsdCtzaGlmdCtsZWZ0JyAnYWx0K3NoaWZ0K3JpZ2h0J11cbiAgICAgICAgXG4gICAgICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnlMZWZ0OlxuICAgICAgICAgICAgc2VwYXJhdG9yOiB0cnVlXG4gICAgICAgICAgICBuYW1lOiAgICdNb3ZlIEN1cnNvcnMgdG8gU3RhcnQgb2YgV29yZCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtsZWZ0J1xuXG4gICAgICAgIG1vdmVDdXJzb3JzVG9Xb3JkQm91bmRhcnlSaWdodDpcbiAgICAgICAgICAgIG5hbWU6ICAgJ01vdmUgQ3Vyc29ycyB0byBFbmQgb2YgV29yZCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2FsdCtyaWdodCdcbiAgICAgICAgICAgIFxuICAgICAgICBtb3ZlQ3Vyc29yc1RvTGluZUJvdW5kYXJ5OlxuICAgICAgICAgICAgbmFtZTogICAnbW92ZSBjdXJzb3JzIHRvIGxpbmUgYm91bmRhcmllcydcbiAgICAgICAgICAgIHRleHQ6ICAgJ21vdmVzIGN1cnNvcnMgdG8gbGluZSBib3VuZGFyaWVzLiBleHRlbmRzIHNlbGVjdGlvbnMsIGlmIHNoaWZ0IGlzIHByZXNzZWQuJ1xuICAgICAgICAgICAgY29tYm9zOiBbJ2hvbWUnICdlbmQnICdjb21tYW5kK3NoaWZ0K2xlZnQnICdjb21tYW5kK3NoaWZ0K3JpZ2h0JyAnY3RybCtzaGlmdCtsZWZ0JyAnY3RybCtzaGlmdCtyaWdodCddXG4gICAgICAgICAgICBhY2NlbHM6IFsnaG9tZScgJ2VuZCcgJ3NoaWZ0K2hvbWUnICdzaGlmdCtlbmQnICdjdHJsK3NoaWZ0K2xlZnQnICdjdHJsK3NoaWZ0K3JpZ2h0JyAnY3RybCtzaGlmdCtlJyAnY3RybCtzaGlmdCthJ11cblxuICAgICAgICBtb3ZlTWFpbkN1cnNvcjpcbiAgICAgICAgICAgIG5hbWU6ICAgJ21vdmUgbWFpbiBjdXJzb3InXG4gICAgICAgICAgICB0ZXh0OiAgIFwiXCJcIm1vdmUgbWFpbiBjdXJzb3IgaW5kZXBlbmRlbnRseSBvZiBvdGhlciBjdXJzb3JzLlxuICAgICAgICAgICAgICAgIGVyYXNlcyBvdGhlciBjdXJzb3JzIGlmIHNoaWZ0IGlzIHByZXNzZWQuIFxuICAgICAgICAgICAgICAgIHNldHMgbmV3IGN1cnNvcnMgb3RoZXJ3aXNlLlwiXCJcIlxuICAgICAgICAgICAgY29tYm9zOiBbICdjdHJsK3NoaWZ0K3VwJyAnY3RybCtzaGlmdCtkb3duJyAnY3RybCtzaGlmdCtsZWZ0JyAnY3RybCtzaGlmdCtyaWdodCcgJ2N0cmwrdXAnICdjdHJsK2Rvd24nICdjdHJsK2xlZnQnICdjdHJsK3JpZ2h0J11cbiAgICAgICAgICAgIGFjY2VsczogWyAnY3RybCtzaGlmdCt1cCcgJ2N0cmwrc2hpZnQrZG93biddXG4gICAgICAgICAgICBcbiAgICAgICAgbW92ZUN1cnNvcnM6XG4gICAgICAgICAgICBuYW1lOiAgJ21vdmUgY3Vyc29ycydcbiAgICAgICAgICAgIGNvbWJvczogWydsZWZ0JyAncmlnaHQnICd1cCcgJ2Rvd24nICdzaGlmdCtkb3duJyAnc2hpZnQrcmlnaHQnICdzaGlmdCt1cCcgJ3NoaWZ0K2xlZnQnXVxuXG4gICAgbW92ZUN1cnNvcnNBdEJvdW5kYXJ5TGVmdDogIC0+IEBzZXRPck1vdmVDdXJzb3JzQXRCb3VuZGFyeSAnbGVmdCdcbiAgICBtb3ZlQ3Vyc29yc0F0Qm91bmRhcnlSaWdodDogLT4gQHNldE9yTW92ZUN1cnNvcnNBdEJvdW5kYXJ5ICdyaWdodCdcbiAgICAgICAgXG4gICAgc2V0T3JNb3ZlQ3Vyc29yc0F0Qm91bmRhcnk6IChrZXkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpID4gMSBhbmQgQG51bUN1cnNvcnMoKSA9PSAxXG4gICAgICAgICAgICBAc2V0Q3Vyc29yc0F0U2VsZWN0aW9uQm91bmRhcnkga2V5XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBtb3ZlQ3Vyc29yc1RvTGluZUJvdW5kYXJ5IGtleVxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBtb3ZlTWFpbkN1cnNvcjogKGtleSwgaW5mbykgLT5cbiAgICAgICAgXG4gICAgICAgIGtsb2cgJ21vdmVNYWluQ3Vyc29yJyBrZXksIGluZm9cbiAgICAgICAgXG4gICAgICAgIGRpciA9IGtleSBcbiAgICAgICAgaHJ6ID0ga2V5IGluIFsnbGVmdCcgJ3JpZ2h0J11cbiAgICAgICAgb3B0ID0gXy5jbG9uZSBpbmZvXG4gICAgICAgIG9wdC5lcmFzZSA/PSBpbmZvLm1vZD8uaW5kZXhPZignc2hpZnQnKSA+PSAwIG9yIGhyelxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBbZHgsIGR5XSA9IHN3aXRjaCBkaXJcbiAgICAgICAgICAgIHdoZW4gJ3VwJyAgICB0aGVuIFswLC0xXVxuICAgICAgICAgICAgd2hlbiAnZG93bicgIHRoZW4gWzAsKzFdXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBbLTEsMF1cbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIFsrMSwwXVxuICAgICAgICBuZXdDdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICBvbGRNYWluID0gQG1haW5DdXJzb3IoKVxuICAgICAgICBuZXdNYWluID0gW29sZE1haW5bMF0rZHgsIG9sZE1haW5bMV0rZHldXG4gICAgICAgIF8ucmVtb3ZlIG5ld0N1cnNvcnMsIChjKSAtPiBcbiAgICAgICAgICAgIGlmIG9wdD8uZXJhc2VcbiAgICAgICAgICAgICAgICBpc1NhbWVQb3MoYywgb2xkTWFpbikgb3IgaXNTYW1lUG9zKGMsIG5ld01haW4pXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaXNTYW1lUG9zKGMsIG5ld01haW4pXG4gICAgICAgIG5ld0N1cnNvcnMucHVzaCBuZXdNYWluXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46bmV3TWFpblxuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgXG4gICAgbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeUxlZnQ6ICAtPiBAbW92ZUN1cnNvcnNUb1dvcmRCb3VuZGFyeSAnbGVmdCdcbiAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5UmlnaHQ6IC0+IEBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5ICdyaWdodCdcbiAgICBcbiAgICBtb3ZlQ3Vyc29yc1RvV29yZEJvdW5kYXJ5OiAobGVmdE9yUmlnaHQsIGluZm8gPSBleHRlbmQ6ZmFsc2UpIC0+XG4gICAgICAgIGV4dGVuZCA9IGluZm8uZXh0ZW5kID8gMCA8PSBpbmZvLm1vZC5pbmRleE9mICdzaGlmdCdcbiAgICAgICAgZiA9IHN3aXRjaCBsZWZ0T3JSaWdodFxuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gQGVuZE9mV29yZEF0UG9zXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAc3RhcnRPZldvcmRBdFBvc1xuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgZiwgZXh0ZW5kOmV4dGVuZCwga2VlcExpbmU6dHJ1ZVxuICAgICAgICB0cnVlXG5cbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG1vdmVDdXJzb3JzVG9MaW5lQm91bmRhcnk6IChrZXksIGluZm8gPSBleHRlbmQ6ZmFsc2UpIC0+XG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBleHRlbmQgPSBpbmZvLmV4dGVuZCA/IDAgPD0gaW5mby5tb2QuaW5kZXhPZiAnc2hpZnQnXG4gICAgICAgIGZ1bmMgPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdyaWdodCcgJ2UnICdlbmQnIHRoZW4gKGMpID0+IFtAZG8ubGluZShjWzFdKS5sZW5ndGgsIGNbMV1dXG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAnYScgJ2hvbWUnICB0aGVuIChjKSA9PiBcbiAgICAgICAgICAgICAgICBpZiBAZG8ubGluZShjWzFdKS5zbGljZSgwLGNbMF0pLnRyaW0oKS5sZW5ndGggPT0gMFxuICAgICAgICAgICAgICAgICAgICBbMCwgY1sxXV1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGQgPSBAZG8ubGluZShjWzFdKS5sZW5ndGggLSBAZG8ubGluZShjWzFdKS50cmltTGVmdCgpLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBbZCwgY1sxXV1cbiAgICAgICAgQG1vdmVBbGxDdXJzb3JzIGZ1bmMsIGV4dGVuZDpleHRlbmQsIGtlZXBMaW5lOnRydWVcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICBtb3ZlQ3Vyc29yczogKGtleSwgaW5mbyA9IGV4dGVuZDpmYWxzZSkgLT5cbiAgICAgICAgXG4gICAgICAgIGV4dGVuZCA9IGluZm8uZXh0ZW5kID8gJ3NoaWZ0JyA9PSBpbmZvLm1vZFxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAbW92ZUN1cnNvcnNMZWZ0ICBleHRlbmRcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuIEBtb3ZlQ3Vyc29yc1JpZ2h0IGV4dGVuZFxuICAgICAgICAgICAgd2hlbiAndXAnICAgIHRoZW4gQG1vdmVDdXJzb3JzVXAgICAgZXh0ZW5kXG4gICAgICAgICAgICB3aGVuICdkb3duJyAgdGhlbiBAbW92ZUN1cnNvcnNEb3duICBleHRlbmRcbiAgICAgICAgXG4gICAgc2V0Q3Vyc29yc0F0U2VsZWN0aW9uQm91bmRhcnk6IChsZWZ0T3JSaWdodD0ncmlnaHQnKSAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgaSA9IGxlZnRPclJpZ2h0ID09ICdyaWdodCcgYW5kIDEgb3IgMFxuICAgICAgICBuZXdDdXJzb3JzID0gW11cbiAgICAgICAgbWFpbiA9ICdsYXN0J1xuICAgICAgICBmb3IgcyBpbiBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgICAgICBwID0gcmFuZ2VJbmRleFBvcyBzLGlcbiAgICAgICAgICAgIG5ld0N1cnNvcnMucHVzaCBwXG4gICAgICAgICAgICBpZiBAaXNDdXJzb3JJblJhbmdlIHNcbiAgICAgICAgICAgICAgICBtYWluID0gbmV3Q3Vyc29ycy5pbmRleE9mIHBcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjptYWluXG4gICAgICAgIEBkby5lbmQoKSAgICAgICBcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIG1vdmVBbGxDdXJzb3JzOiAoZnVuYywgb3B0ID0gZXh0ZW5kOmZhbHNlLCBrZWVwTGluZTp0cnVlKSAtPiBcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBAc3RhcnRTZWxlY3Rpb24gb3B0XG4gICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIG9sZE1haW4gPSBAZG8ubWFpbkN1cnNvcigpXG4gICAgICAgIG1haW5MaW5lID0gb2xkTWFpblsxXVxuICAgICAgICBcbiAgICAgICAgaWYgbmV3Q3Vyc29ycy5sZW5ndGggPiAxXG4gICAgICAgICAgICBmb3IgYyBpbiBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgbmV3UG9zID0gZnVuYyBjIFxuICAgICAgICAgICAgICAgIGlmIG5ld1Bvc1sxXSA9PSBjWzFdIG9yIG5vdCBvcHQua2VlcExpbmVcbiAgICAgICAgICAgICAgICAgICAgbWFpbkxpbmUgPSBuZXdQb3NbMV0gaWYgaXNTYW1lUG9zIG9sZE1haW4sIGNcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yU2V0IGMsIG5ld1Bvc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjdXJzb3JTZXQgbmV3Q3Vyc29yc1swXSwgZnVuYyBuZXdDdXJzb3JzWzBdXG4gICAgICAgICAgICBtYWluTGluZSA9IG5ld0N1cnNvcnNbMF1bMV1cbiAgICAgICAgICAgIFxuICAgICAgICBtYWluID0gc3dpdGNoIG9wdC5tYWluXG4gICAgICAgICAgICB3aGVuICd0b3AnICAgdGhlbiAnZmlyc3QnXG4gICAgICAgICAgICB3aGVuICdib3QnICAgdGhlbiAnbGFzdCdcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnICB0aGVuICdjbG9zZXN0J1xuICAgICAgICAgICAgd2hlbiAncmlnaHQnIHRoZW4gJ2Nsb3Nlc3QnXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0LmNsYW1wXG4gICAgICAgICAgICBmb3IgY2kgaW4gWzAuLi5uZXdDdXJzb3JzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBuZXdDdXJzb3JzW2NpXSA9IEBjbGFtcFBvcyBuZXdDdXJzb3JzW2NpXVxuICAgICAgICAgICAgXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnMsIG1haW46bWFpblxuICAgICAgICBAZW5kU2VsZWN0aW9uIG9wdFxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgXG4gICAgbW92ZUN1cnNvcnNVcDogKGUsIG49MSkgLT4gXG4gICAgICAgIFxuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgKChuKS0+KGMpLT5bY1swXSxjWzFdLW5dKShuKSwgZXh0ZW5kOmUsIG1haW46ICd0b3AnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBtb3ZlQ3Vyc29yc1JpZ2h0OiAoZSwgbj0xKSAtPlxuICAgICAgICBcbiAgICAgICAgbW92ZVJpZ2h0ID0gKG4pIC0+IChjKSAtPiBbY1swXStuLCBjWzFdXVxuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgbW92ZVJpZ2h0KG4pLCBleHRlbmQ6ZSwga2VlcExpbmU6dHJ1ZSwgY2xhbXA6dHJ1ZSwgbWFpbjogJ3JpZ2h0J1xuICAgIFxuICAgIG1vdmVDdXJzb3JzTGVmdDogKGUsIG49MSkgLT5cbiAgICAgICAgXG4gICAgICAgIG1vdmVMZWZ0ID0gKG4pIC0+IChjKSAtPiBbTWF0aC5tYXgoMCxjWzBdLW4pLCBjWzFdXVxuICAgICAgICBAbW92ZUFsbEN1cnNvcnMgbW92ZUxlZnQobiksIGV4dGVuZDplLCBrZWVwTGluZTp0cnVlLCBtYWluOiAnbGVmdCdcbiAgICAgICAgXG4gICAgbW92ZUN1cnNvcnNEb3duOiAoZSwgbj0xKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgZSBhbmQgQG51bVNlbGVjdGlvbnMoKSA9PSAwICMgc2VsZWN0aW5nIGxpbmVzIGRvd25cbiAgICAgICAgICAgIGlmIDAgPT0gXy5tYXggKGNbMF0gZm9yIGMgaW4gQGN1cnNvcnMoKSkgIyBhbGwgY3Vyc29ycyBpbiBmaXJzdCBjb2x1bW5cbiAgICAgICAgICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICAgICAgICAgIEBkby5zZWxlY3QgQHJhbmdlc0ZvckN1cnNvckxpbmVzKCkgIyBzZWxlY3QgbGluZXMgd2l0aG91dCBtb3ZpbmcgY3Vyc29yc1xuICAgICAgICAgICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICBlbHNlIGlmIGUgYW5kIEBzdGlja3lTZWxlY3Rpb24gYW5kIEBudW1DdXJzb3JzKCkgPT0gMVxuICAgICAgICAgICAgaWYgQG1haW5DdXJzb3IoKVswXSA9PSAwIGFuZCBub3QgQGlzU2VsZWN0ZWRMaW5lQXRJbmRleCBAbWFpbkN1cnNvcigpWzFdXG4gICAgICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgICAgICBuZXdTZWxlY3Rpb25zID0gQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMucHVzaCBAcmFuZ2VGb3JMaW5lQXRJbmRleCBAbWFpbkN1cnNvcigpWzFdXG4gICAgICAgICAgICAgICAgQGRvLnNlbGVjdCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgQG1vdmVBbGxDdXJzb3JzICgobiktPihjKS0+W2NbMF0sY1sxXStuXSkobiksIGV4dGVuZDplLCBtYWluOiAnYm90J1xuICAgICAgICBcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/movecursors.coffee