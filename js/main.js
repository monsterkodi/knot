// koffee 1.4.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var BrowserWindow, Main, activeWin, app, args, empty, filelist, fs, main, post, prefs, ref, slash, visibleWins, win, winWithID, wins,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, filelist = ref.filelist, prefs = ref.prefs, slash = ref.slash, empty = ref.empty, args = ref.args, app = ref.app, win = ref.win, fs = ref.fs;

BrowserWindow = require('electron').BrowserWindow;

main = void 0;

post.on('newWindow', function() {
    return main.createWindow();
});

wins = function() {
    return BrowserWindow.getAllWindows().sort(function(a, b) {
        return a.id - b.id;
    });
};

activeWin = function() {
    return BrowserWindow.getFocusedWindow();
};

visibleWins = function() {
    var i, len, ref1, results, w;
    ref1 = wins();
    results = [];
    for (i = 0, len = ref1.length; i < len; i++) {
        w = ref1[i];
        if ((w != null ? w.isVisible() : void 0) && !(w != null ? w.isMinimized() : void 0)) {
            results.push(w);
        }
    }
    return results;
};

winWithID = function(winID) {
    var i, len, ref1, w, wid;
    wid = parseInt(winID);
    ref1 = wins();
    for (i = 0, len = ref1.length; i < len; i++) {
        w = ref1[i];
        if (w.id === wid) {
            return w;
        }
    }
};

Main = (function(superClass) {
    extend(Main, superClass);

    function Main() {
        this.quit = bind(this.quit, this);
        this.onShow = bind(this.onShow, this);
        Main.__super__.constructor.call(this, {
            dir: __dirname,
            pkg: require('../package.json'),
            shortcut: 'Alt+F1',
            index: 'index.html',
            icon: '../img/app.ico',
            tray: '../img/menu.png',
            about: '../img/about.png',
            prefsSeperator: '▸',
            aboutDebug: false,
            minWidth: 500,
            onShow: function() {
                return main.onShow();
            }
        });
        this.opt.onQuit = this.quit;
        this.moveWindowStashes();
    }

    Main.prototype.onShow = function() {
        if (!args.nostate) {
            this.restoreWindows();
        }
        if (!wins().length) {
            return this.createWindow();
        }
    };

    Main.prototype.moveWindowStashes = function() {
        var stashDir;
        stashDir = slash.join(this.userData, 'win');
        if (slash.dirExists(stashDir)) {
            return fs.moveSync(stashDir, slash.join(this.userData, 'old'), {
                overwrite: true
            });
        }
    };

    Main.prototype.restoreWindows = function() {
        var file, i, len, newStash, results, stashFiles;
        fs.ensureDirSync(this.userData);
        stashFiles = filelist(slash.join(this.userData, 'old'), {
            matchExt: 'noon'
        });
        if (!empty(stashFiles)) {
            results = [];
            for (i = 0, len = stashFiles.length; i < len; i++) {
                file = stashFiles[i];
                win = this.createWindow();
                newStash = slash.join(this.userData, 'win', win.id + ".noon");
                results.push(fs.copySync(file, newStash));
            }
            return results;
        }
    };

    Main.prototype.quit = function() {
        var toSave;
        toSave = wins().length;
        if (toSave) {
            post.toWins('saveStash');
            post.on('stashSaved', (function(_this) {
                return function() {
                    toSave -= 1;
                    if (toSave === 0) {
                        return _this.exitApp();
                    }
                };
            })(this));
            return 'delay';
        }
    };

    return Main;

})(app);

main = new Main();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0lBQUE7SUFBQTs7OztBQVFBLE1BQThELE9BQUEsQ0FBUSxLQUFSLENBQTlELEVBQUUsZUFBRixFQUFRLHVCQUFSLEVBQWtCLGlCQUFsQixFQUF5QixpQkFBekIsRUFBZ0MsaUJBQWhDLEVBQXVDLGVBQXZDLEVBQTZDLGFBQTdDLEVBQWtELGFBQWxELEVBQXVEOztBQUVyRCxnQkFBa0IsT0FBQSxDQUFRLFVBQVI7O0FBRXBCLElBQUEsR0FBTzs7QUFFUCxJQUFJLENBQUMsRUFBTCxDQUFRLFdBQVIsRUFBb0IsU0FBQTtXQUFHLElBQUksQ0FBQyxZQUFMLENBQUE7QUFBSCxDQUFwQjs7QUFRQSxJQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxhQUFkLENBQUEsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxTQUFDLENBQUQsRUFBRyxDQUFIO2VBQVMsQ0FBQyxDQUFDLEVBQUYsR0FBTyxDQUFDLENBQUM7SUFBbEIsQ0FBbkM7QUFBSDs7QUFDZCxTQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxnQkFBZCxDQUFBO0FBQUg7O0FBQ2QsV0FBQSxHQUFjLFNBQUE7QUFBRyxRQUFBO0FBQUM7QUFBQTtTQUFBLHNDQUFBOzt5QkFBdUIsQ0FBQyxDQUFFLFNBQUgsQ0FBQSxXQUFBLElBQW1CLGNBQUksQ0FBQyxDQUFFLFdBQUgsQ0FBQTt5QkFBOUM7O0FBQUE7O0FBQUo7O0FBRWQsU0FBQSxHQUFjLFNBQUMsS0FBRDtBQUVWLFFBQUE7SUFBQSxHQUFBLEdBQU0sUUFBQSxDQUFTLEtBQVQ7QUFDTjtBQUFBLFNBQUEsc0NBQUE7O1FBQ0ksSUFBWSxDQUFDLENBQUMsRUFBRixLQUFRLEdBQXBCO0FBQUEsbUJBQU8sRUFBUDs7QUFESjtBQUhVOztBQVlSOzs7SUFFVyxjQUFBOzs7UUFFVCxzQ0FDSTtZQUFBLEdBQUEsRUFBWSxTQUFaO1lBQ0EsR0FBQSxFQUFZLE9BQUEsQ0FBUSxpQkFBUixDQURaO1lBRUEsUUFBQSxFQUFZLFFBRlo7WUFHQSxLQUFBLEVBQVksWUFIWjtZQUlBLElBQUEsRUFBWSxnQkFKWjtZQUtBLElBQUEsRUFBWSxpQkFMWjtZQU1BLEtBQUEsRUFBWSxrQkFOWjtZQU9BLGNBQUEsRUFBZ0IsR0FQaEI7WUFRQSxVQUFBLEVBQVksS0FSWjtZQVNBLFFBQUEsRUFBWSxHQVRaO1lBVUEsTUFBQSxFQUFZLFNBQUE7dUJBQUcsSUFBSSxDQUFDLE1BQUwsQ0FBQTtZQUFILENBVlo7U0FESjtRQWFBLElBQUMsQ0FBQSxHQUFHLENBQUMsTUFBTCxHQUFjLElBQUMsQ0FBQTtRQUNmLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBaEJTOzttQkF3QmIsTUFBQSxHQUFRLFNBQUE7UUFFSixJQUFxQixDQUFJLElBQUksQ0FBQyxPQUE5QjtZQUFBLElBQUMsQ0FBQSxjQUFELENBQUEsRUFBQTs7UUFFQSxJQUFHLENBQUksSUFBQSxDQUFBLENBQU0sQ0FBQyxNQUFkO21CQUNJLElBQUMsQ0FBQSxZQUFELENBQUEsRUFESjs7SUFKSTs7bUJBYVIsaUJBQUEsR0FBbUIsU0FBQTtBQUVmLFlBQUE7UUFBQSxRQUFBLEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QjtRQUNYLElBQUcsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsUUFBaEIsQ0FBSDttQkFDSSxFQUFFLENBQUMsUUFBSCxDQUFZLFFBQVosRUFBc0IsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QixDQUF0QixFQUFvRDtnQkFBQSxTQUFBLEVBQVcsSUFBWDthQUFwRCxFQURKOztJQUhlOzttQkFNbkIsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLEVBQUUsQ0FBQyxhQUFILENBQWlCLElBQUMsQ0FBQSxRQUFsQjtRQUNBLFVBQUEsR0FBYSxRQUFBLENBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QixDQUFULEVBQXVDO1lBQUEsUUFBQSxFQUFTLE1BQVQ7U0FBdkM7UUFDYixJQUFHLENBQUksS0FBQSxDQUFNLFVBQU4sQ0FBUDtBQUNJO2lCQUFBLDRDQUFBOztnQkFDSSxHQUFBLEdBQU0sSUFBQyxDQUFBLFlBQUQsQ0FBQTtnQkFDTixRQUFBLEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QixFQUErQixHQUFHLENBQUMsRUFBTCxHQUFRLE9BQXRDOzZCQUNYLEVBQUUsQ0FBQyxRQUFILENBQVksSUFBWixFQUFrQixRQUFsQjtBQUhKOzJCQURKOztJQUpZOzttQkFnQmhCLElBQUEsR0FBTSxTQUFBO0FBRUYsWUFBQTtRQUFBLE1BQUEsR0FBUyxJQUFBLENBQUEsQ0FBTSxDQUFDO1FBRWhCLElBQUcsTUFBSDtZQUNJLElBQUksQ0FBQyxNQUFMLENBQVksV0FBWjtZQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFxQixDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFBO29CQUNqQixNQUFBLElBQVU7b0JBQ1YsSUFBRyxNQUFBLEtBQVUsQ0FBYjsrQkFDSSxLQUFDLENBQUEsT0FBRCxDQUFBLEVBREo7O2dCQUZpQjtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckI7bUJBSUEsUUFOSjs7SUFKRTs7OztHQTdEUzs7QUF5RW5CLElBQUEsR0FBTyxJQUFJLElBQUosQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIGZpbGVsaXN0LCBwcmVmcywgc2xhc2gsIGVtcHR5LCBhcmdzLCBhcHAsIHdpbiwgZnMgfSA9IHJlcXVpcmUgJ2t4aydcblxueyBCcm93c2VyV2luZG93IH0gPSByZXF1aXJlICdlbGVjdHJvbidcblxubWFpbiA9IHVuZGVmaW5lZFxuXG5wb3N0Lm9uICduZXdXaW5kb3cnIC0+IG1haW4uY3JlYXRlV2luZG93KClcblxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMFxuIyAwMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwXG5cbndpbnMgICAgICAgID0gLT4gQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCkuc29ydCAoYSxiKSAtPiBhLmlkIC0gYi5pZFxuYWN0aXZlV2luICAgPSAtPiBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKVxudmlzaWJsZVdpbnMgPSAtPiAodyBmb3IgdyBpbiB3aW5zKCkgd2hlbiB3Py5pc1Zpc2libGUoKSBhbmQgbm90IHc/LmlzTWluaW1pemVkKCkpXG5cbndpbldpdGhJRCAgID0gKHdpbklEKSAtPlxuXG4gICAgd2lkID0gcGFyc2VJbnQgd2luSURcbiAgICBmb3IgdyBpbiB3aW5zKClcbiAgICAgICAgcmV0dXJuIHcgaWYgdy5pZCA9PSB3aWRcblxuIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG5cbmNsYXNzIE1haW4gZXh0ZW5kcyBhcHBcblxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIGRpcjogICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgcGtnOiAgICAgICAgcmVxdWlyZSAnLi4vcGFja2FnZS5qc29uJ1xuICAgICAgICAgICAgc2hvcnRjdXQ6ICAgJ0FsdCtGMSdcbiAgICAgICAgICAgIGluZGV4OiAgICAgICdpbmRleC5odG1sJ1xuICAgICAgICAgICAgaWNvbjogICAgICAgJy4uL2ltZy9hcHAuaWNvJ1xuICAgICAgICAgICAgdHJheTogICAgICAgJy4uL2ltZy9tZW51LnBuZydcbiAgICAgICAgICAgIGFib3V0OiAgICAgICcuLi9pbWcvYWJvdXQucG5nJ1xuICAgICAgICAgICAgcHJlZnNTZXBlcmF0b3I6ICfilrgnXG4gICAgICAgICAgICBhYm91dERlYnVnOiBmYWxzZSAgXG4gICAgICAgICAgICBtaW5XaWR0aDogICA1MDAgXG4gICAgICAgICAgICBvblNob3c6ICAgICAtPiBtYWluLm9uU2hvdygpXG4gICAgICAgICAgICBcbiAgICAgICAgQG9wdC5vblF1aXQgPSBAcXVpdFxuICAgICAgICBAbW92ZVdpbmRvd1N0YXNoZXMoKVxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICAgXG4gICAgb25TaG93OiA9PlxuICAgICAgICAgXG4gICAgICAgIEByZXN0b3JlV2luZG93cygpIGlmIG5vdCBhcmdzLm5vc3RhdGVcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCB3aW5zKCkubGVuZ3RoXG4gICAgICAgICAgICBAY3JlYXRlV2luZG93KClcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiAgICBcbiAgICBtb3ZlV2luZG93U3Rhc2hlczogLT5cbiAgICAgICAgXG4gICAgICAgIHN0YXNoRGlyID0gc2xhc2guam9pbiBAdXNlckRhdGEsICd3aW4nXG4gICAgICAgIGlmIHNsYXNoLmRpckV4aXN0cyBzdGFzaERpclxuICAgICAgICAgICAgZnMubW92ZVN5bmMgc3Rhc2hEaXIsIHNsYXNoLmpvaW4oQHVzZXJEYXRhLCAnb2xkJyksIG92ZXJ3cml0ZTogdHJ1ZVxuICAgIFxuICAgIHJlc3RvcmVXaW5kb3dzOiAtPlxuICAgIFxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jIEB1c2VyRGF0YVxuICAgICAgICBzdGFzaEZpbGVzID0gZmlsZWxpc3Qgc2xhc2guam9pbihAdXNlckRhdGEsICdvbGQnKSwgbWF0Y2hFeHQ6J25vb24nXG4gICAgICAgIGlmIG5vdCBlbXB0eSBzdGFzaEZpbGVzXG4gICAgICAgICAgICBmb3IgZmlsZSBpbiBzdGFzaEZpbGVzXG4gICAgICAgICAgICAgICAgd2luID0gQGNyZWF0ZVdpbmRvdygpXG4gICAgICAgICAgICAgICAgbmV3U3Rhc2ggPSBzbGFzaC5qb2luIEB1c2VyRGF0YSwgJ3dpbicgXCIje3dpbi5pZH0ubm9vblwiXG4gICAgICAgICAgICAgICAgZnMuY29weVN5bmMgZmlsZSwgbmV3U3Rhc2hcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAwIDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAgMDAgICAwMDAwMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHF1aXQ6ID0+XG5cbiAgICAgICAgdG9TYXZlID0gd2lucygpLmxlbmd0aFxuXG4gICAgICAgIGlmIHRvU2F2ZVxuICAgICAgICAgICAgcG9zdC50b1dpbnMgJ3NhdmVTdGFzaCdcbiAgICAgICAgICAgIHBvc3Qub24gJ3N0YXNoU2F2ZWQnID0+XG4gICAgICAgICAgICAgICAgdG9TYXZlIC09IDFcbiAgICAgICAgICAgICAgICBpZiB0b1NhdmUgPT0gMFxuICAgICAgICAgICAgICAgICAgICBAZXhpdEFwcCgpXG4gICAgICAgICAgICAnZGVsYXknXG4gICAgICAgICAgICAgICAgXG5tYWluID0gbmV3IE1haW4oKVxuIl19
//# sourceURL=../coffee/main.coffee