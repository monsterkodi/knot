// koffee 1.12.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var BrowserWindow, Main, activeWin, app, args, empty, filelist, fs, main, post, ref, slash, visibleWins, win, winWithID, wins,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), post = ref.post, filelist = ref.filelist, slash = ref.slash, empty = ref.empty, args = ref.args, app = ref.app, win = ref.win, fs = ref.fs;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuLi9jb2ZmZWUiLCJzb3VyY2VzIjpbIm1haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHlIQUFBO0lBQUE7Ozs7QUFRQSxNQUF1RCxPQUFBLENBQVEsS0FBUixDQUF2RCxFQUFFLGVBQUYsRUFBUSx1QkFBUixFQUFrQixpQkFBbEIsRUFBeUIsaUJBQXpCLEVBQWdDLGVBQWhDLEVBQXNDLGFBQXRDLEVBQTJDLGFBQTNDLEVBQWdEOztBQUU5QyxnQkFBa0IsT0FBQSxDQUFRLFVBQVI7O0FBRXBCLElBQUEsR0FBTzs7QUFFUCxJQUFJLENBQUMsRUFBTCxDQUFRLFdBQVIsRUFBb0IsU0FBQTtXQUFHLElBQUksQ0FBQyxZQUFMLENBQUE7QUFBSCxDQUFwQjs7QUFRQSxJQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxhQUFkLENBQUEsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxTQUFDLENBQUQsRUFBRyxDQUFIO2VBQVMsQ0FBQyxDQUFDLEVBQUYsR0FBTyxDQUFDLENBQUM7SUFBbEIsQ0FBbkM7QUFBSDs7QUFDZCxTQUFBLEdBQWMsU0FBQTtXQUFHLGFBQWEsQ0FBQyxnQkFBZCxDQUFBO0FBQUg7O0FBQ2QsV0FBQSxHQUFjLFNBQUE7QUFBRyxRQUFBO0FBQUM7QUFBQTtTQUFBLHNDQUFBOzt5QkFBdUIsQ0FBQyxDQUFFLFNBQUgsQ0FBQSxXQUFBLElBQW1CLGNBQUksQ0FBQyxDQUFFLFdBQUgsQ0FBQTt5QkFBOUM7O0FBQUE7O0FBQUo7O0FBRWQsU0FBQSxHQUFjLFNBQUMsS0FBRDtBQUVWLFFBQUE7SUFBQSxHQUFBLEdBQU0sUUFBQSxDQUFTLEtBQVQ7QUFDTjtBQUFBLFNBQUEsc0NBQUE7O1FBQ0ksSUFBWSxDQUFDLENBQUMsRUFBRixLQUFRLEdBQXBCO0FBQUEsbUJBQU8sRUFBUDs7QUFESjtBQUhVOztBQVlSOzs7SUFFVyxjQUFBOzs7UUFFVCxzQ0FDSTtZQUFBLEdBQUEsRUFBWSxTQUFaO1lBQ0EsR0FBQSxFQUFZLE9BQUEsQ0FBUSxpQkFBUixDQURaO1lBRUEsUUFBQSxFQUFZLFFBRlo7WUFHQSxLQUFBLEVBQVksWUFIWjtZQUlBLElBQUEsRUFBWSxnQkFKWjtZQUtBLElBQUEsRUFBWSxpQkFMWjtZQU1BLEtBQUEsRUFBWSxrQkFOWjtZQU9BLGNBQUEsRUFBZ0IsR0FQaEI7WUFRQSxVQUFBLEVBQVksS0FSWjtZQVNBLFFBQUEsRUFBWSxHQVRaO1lBVUEsTUFBQSxFQUFZLFNBQUE7dUJBQUcsSUFBSSxDQUFDLE1BQUwsQ0FBQTtZQUFILENBVlo7U0FESjtRQWFBLElBQUMsQ0FBQSxHQUFHLENBQUMsTUFBTCxHQUFjLElBQUMsQ0FBQTtRQUNmLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBaEJTOzttQkF3QmIsTUFBQSxHQUFRLFNBQUE7UUFFSixJQUFxQixDQUFJLElBQUksQ0FBQyxPQUE5QjtZQUFBLElBQUMsQ0FBQSxjQUFELENBQUEsRUFBQTs7UUFFQSxJQUFHLENBQUksSUFBQSxDQUFBLENBQU0sQ0FBQyxNQUFkO21CQUNJLElBQUMsQ0FBQSxZQUFELENBQUEsRUFESjs7SUFKSTs7bUJBYVIsaUJBQUEsR0FBbUIsU0FBQTtBQUVmLFlBQUE7UUFBQSxRQUFBLEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QjtRQUNYLElBQUcsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsUUFBaEIsQ0FBSDttQkFDSSxFQUFFLENBQUMsUUFBSCxDQUFZLFFBQVosRUFBc0IsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QixDQUF0QixFQUFvRDtnQkFBQSxTQUFBLEVBQVcsSUFBWDthQUFwRCxFQURKOztJQUhlOzttQkFNbkIsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLEVBQUUsQ0FBQyxhQUFILENBQWlCLElBQUMsQ0FBQSxRQUFsQjtRQUNBLFVBQUEsR0FBYSxRQUFBLENBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QixDQUFULEVBQXVDO1lBQUEsUUFBQSxFQUFTLE1BQVQ7U0FBdkM7UUFDYixJQUFHLENBQUksS0FBQSxDQUFNLFVBQU4sQ0FBUDtBQUNJO2lCQUFBLDRDQUFBOztnQkFDSSxHQUFBLEdBQU0sSUFBQyxDQUFBLFlBQUQsQ0FBQTtnQkFDTixRQUFBLEdBQVcsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFDLENBQUEsUUFBWixFQUFzQixLQUF0QixFQUErQixHQUFHLENBQUMsRUFBTCxHQUFRLE9BQXRDOzZCQUNYLEVBQUUsQ0FBQyxRQUFILENBQVksSUFBWixFQUFrQixRQUFsQjtBQUhKOzJCQURKOztJQUpZOzttQkFnQmhCLElBQUEsR0FBTSxTQUFBO0FBRUYsWUFBQTtRQUFBLE1BQUEsR0FBUyxJQUFBLENBQUEsQ0FBTSxDQUFDO1FBRWhCLElBQUcsTUFBSDtZQUNJLElBQUksQ0FBQyxNQUFMLENBQVksV0FBWjtZQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFxQixDQUFBLFNBQUEsS0FBQTt1QkFBQSxTQUFBO29CQUNqQixNQUFBLElBQVU7b0JBQ1YsSUFBRyxNQUFBLEtBQVUsQ0FBYjsrQkFDSSxLQUFDLENBQUEsT0FBRCxDQUFBLEVBREo7O2dCQUZpQjtZQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckI7bUJBSUEsUUFOSjs7SUFKRTs7OztHQTdEUzs7QUF5RW5CLElBQUEsR0FBTyxJQUFJLElBQUosQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIGZpbGVsaXN0LCBzbGFzaCwgZW1wdHksIGFyZ3MsIGFwcCwgd2luLCBmcyB9ID0gcmVxdWlyZSAna3hrJ1xuXG57IEJyb3dzZXJXaW5kb3cgfSA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5tYWluID0gdW5kZWZpbmVkXG5cbnBvc3Qub24gJ25ld1dpbmRvdycgLT4gbWFpbi5jcmVhdGVXaW5kb3coKVxuXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgICAgICAgMDAwXG4jIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2lucyAgICAgICAgPSAtPiBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKS5zb3J0IChhLGIpIC0+IGEuaWQgLSBiLmlkXG5hY3RpdmVXaW4gICA9IC0+IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpXG52aXNpYmxlV2lucyA9IC0+ICh3IGZvciB3IGluIHdpbnMoKSB3aGVuIHc/LmlzVmlzaWJsZSgpIGFuZCBub3Qgdz8uaXNNaW5pbWl6ZWQoKSlcblxud2luV2l0aElEICAgPSAod2luSUQpIC0+XG5cbiAgICB3aWQgPSBwYXJzZUludCB3aW5JRFxuICAgIGZvciB3IGluIHdpbnMoKVxuICAgICAgICByZXR1cm4gdyBpZiB3LmlkID09IHdpZFxuXG4jIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbiMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4jIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcblxuY2xhc3MgTWFpbiBleHRlbmRzIGFwcFxuXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBwa2c6ICAgICAgICByZXF1aXJlICcuLi9wYWNrYWdlLmpzb24nXG4gICAgICAgICAgICBzaG9ydGN1dDogICAnQWx0K0YxJ1xuICAgICAgICAgICAgaW5kZXg6ICAgICAgJ2luZGV4Lmh0bWwnXG4gICAgICAgICAgICBpY29uOiAgICAgICAnLi4vaW1nL2FwcC5pY28nXG4gICAgICAgICAgICB0cmF5OiAgICAgICAnLi4vaW1nL21lbnUucG5nJ1xuICAgICAgICAgICAgYWJvdXQ6ICAgICAgJy4uL2ltZy9hYm91dC5wbmcnXG4gICAgICAgICAgICBwcmVmc1NlcGVyYXRvcjogJ+KWuCdcbiAgICAgICAgICAgIGFib3V0RGVidWc6IGZhbHNlICBcbiAgICAgICAgICAgIG1pbldpZHRoOiAgIDUwMCBcbiAgICAgICAgICAgIG9uU2hvdzogICAgIC0+IG1haW4ub25TaG93KClcbiAgICAgICAgICAgIFxuICAgICAgICBAb3B0Lm9uUXVpdCA9IEBxdWl0XG4gICAgICAgIEBtb3ZlV2luZG93U3Rhc2hlcygpXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgICBcbiAgICBvblNob3c6ID0+XG4gICAgICAgICBcbiAgICAgICAgQHJlc3RvcmVXaW5kb3dzKCkgaWYgbm90IGFyZ3Mubm9zdGF0ZVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHdpbnMoKS5sZW5ndGhcbiAgICAgICAgICAgIEBjcmVhdGVXaW5kb3coKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMFxuICAgIFxuICAgIG1vdmVXaW5kb3dTdGFzaGVzOiAtPlxuICAgICAgICBcbiAgICAgICAgc3Rhc2hEaXIgPSBzbGFzaC5qb2luIEB1c2VyRGF0YSwgJ3dpbidcbiAgICAgICAgaWYgc2xhc2guZGlyRXhpc3RzIHN0YXNoRGlyXG4gICAgICAgICAgICBmcy5tb3ZlU3luYyBzdGFzaERpciwgc2xhc2guam9pbihAdXNlckRhdGEsICdvbGQnKSwgb3ZlcndyaXRlOiB0cnVlXG4gICAgXG4gICAgcmVzdG9yZVdpbmRvd3M6IC0+XG4gICAgXG4gICAgICAgIGZzLmVuc3VyZURpclN5bmMgQHVzZXJEYXRhXG4gICAgICAgIHN0YXNoRmlsZXMgPSBmaWxlbGlzdCBzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBtYXRjaEV4dDonbm9vbidcbiAgICAgICAgaWYgbm90IGVtcHR5IHN0YXNoRmlsZXNcbiAgICAgICAgICAgIGZvciBmaWxlIGluIHN0YXNoRmlsZXNcbiAgICAgICAgICAgICAgICB3aW4gPSBAY3JlYXRlV2luZG93KClcbiAgICAgICAgICAgICAgICBuZXdTdGFzaCA9IHNsYXNoLmpvaW4gQHVzZXJEYXRhLCAnd2luJyBcIiN7d2luLmlkfS5ub29uXCJcbiAgICAgICAgICAgICAgICBmcy5jb3B5U3luYyBmaWxlLCBuZXdTdGFzaFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMDAgMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwIDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMCAwMCAgIDAwMDAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgcXVpdDogPT5cblxuICAgICAgICB0b1NhdmUgPSB3aW5zKCkubGVuZ3RoXG5cbiAgICAgICAgaWYgdG9TYXZlXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnc2F2ZVN0YXNoJ1xuICAgICAgICAgICAgcG9zdC5vbiAnc3Rhc2hTYXZlZCcgPT5cbiAgICAgICAgICAgICAgICB0b1NhdmUgLT0gMVxuICAgICAgICAgICAgICAgIGlmIHRvU2F2ZSA9PSAwXG4gICAgICAgICAgICAgICAgICAgIEBleGl0QXBwKClcbiAgICAgICAgICAgICdkZWxheSdcbiAgICAgICAgICAgICAgICBcbm1haW4gPSBuZXcgTWFpbigpXG4iXX0=
//# sourceURL=../coffee/main.coffee