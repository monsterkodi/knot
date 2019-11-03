// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEseUhBQUE7SUFBQTs7OztBQVFBLE1BQXVELE9BQUEsQ0FBUSxLQUFSLENBQXZELEVBQUUsZUFBRixFQUFRLHVCQUFSLEVBQWtCLGlCQUFsQixFQUF5QixpQkFBekIsRUFBZ0MsZUFBaEMsRUFBc0MsYUFBdEMsRUFBMkMsYUFBM0MsRUFBZ0Q7O0FBRTlDLGdCQUFrQixPQUFBLENBQVEsVUFBUjs7QUFFcEIsSUFBQSxHQUFPOztBQUVQLElBQUksQ0FBQyxFQUFMLENBQVEsV0FBUixFQUFvQixTQUFBO1dBQUcsSUFBSSxDQUFDLFlBQUwsQ0FBQTtBQUFILENBQXBCOztBQVFBLElBQUEsR0FBYyxTQUFBO1dBQUcsYUFBYSxDQUFDLGFBQWQsQ0FBQSxDQUE2QixDQUFDLElBQTlCLENBQW1DLFNBQUMsQ0FBRCxFQUFHLENBQUg7ZUFBUyxDQUFDLENBQUMsRUFBRixHQUFPLENBQUMsQ0FBQztJQUFsQixDQUFuQztBQUFIOztBQUNkLFNBQUEsR0FBYyxTQUFBO1dBQUcsYUFBYSxDQUFDLGdCQUFkLENBQUE7QUFBSDs7QUFDZCxXQUFBLEdBQWMsU0FBQTtBQUFHLFFBQUE7QUFBQztBQUFBO1NBQUEsc0NBQUE7O3lCQUF1QixDQUFDLENBQUUsU0FBSCxDQUFBLFdBQUEsSUFBbUIsY0FBSSxDQUFDLENBQUUsV0FBSCxDQUFBO3lCQUE5Qzs7QUFBQTs7QUFBSjs7QUFFZCxTQUFBLEdBQWMsU0FBQyxLQUFEO0FBRVYsUUFBQTtJQUFBLEdBQUEsR0FBTSxRQUFBLENBQVMsS0FBVDtBQUNOO0FBQUEsU0FBQSxzQ0FBQTs7UUFDSSxJQUFZLENBQUMsQ0FBQyxFQUFGLEtBQVEsR0FBcEI7QUFBQSxtQkFBTyxFQUFQOztBQURKO0FBSFU7O0FBWVI7OztJQUVXLGNBQUE7OztRQUVULHNDQUNJO1lBQUEsR0FBQSxFQUFZLFNBQVo7WUFDQSxHQUFBLEVBQVksT0FBQSxDQUFRLGlCQUFSLENBRFo7WUFFQSxRQUFBLEVBQVksUUFGWjtZQUdBLEtBQUEsRUFBWSxZQUhaO1lBSUEsSUFBQSxFQUFZLGdCQUpaO1lBS0EsSUFBQSxFQUFZLGlCQUxaO1lBTUEsS0FBQSxFQUFZLGtCQU5aO1lBT0EsY0FBQSxFQUFnQixHQVBoQjtZQVFBLFVBQUEsRUFBWSxLQVJaO1lBU0EsUUFBQSxFQUFZLEdBVFo7WUFVQSxNQUFBLEVBQVksU0FBQTt1QkFBRyxJQUFJLENBQUMsTUFBTCxDQUFBO1lBQUgsQ0FWWjtTQURKO1FBYUEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxNQUFMLEdBQWMsSUFBQyxDQUFBO1FBQ2YsSUFBQyxDQUFBLGlCQUFELENBQUE7SUFoQlM7O21CQXdCYixNQUFBLEdBQVEsU0FBQTtRQUVKLElBQXFCLENBQUksSUFBSSxDQUFDLE9BQTlCO1lBQUEsSUFBQyxDQUFBLGNBQUQsQ0FBQSxFQUFBOztRQUVBLElBQUcsQ0FBSSxJQUFBLENBQUEsQ0FBTSxDQUFDLE1BQWQ7bUJBQ0ksSUFBQyxDQUFBLFlBQUQsQ0FBQSxFQURKOztJQUpJOzttQkFhUixpQkFBQSxHQUFtQixTQUFBO0FBRWYsWUFBQTtRQUFBLFFBQUEsR0FBVyxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxRQUFaLEVBQXNCLEtBQXRCO1FBQ1gsSUFBRyxLQUFLLENBQUMsU0FBTixDQUFnQixRQUFoQixDQUFIO21CQUNJLEVBQUUsQ0FBQyxRQUFILENBQVksUUFBWixFQUFzQixLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxRQUFaLEVBQXNCLEtBQXRCLENBQXRCLEVBQW9EO2dCQUFBLFNBQUEsRUFBVyxJQUFYO2FBQXBELEVBREo7O0lBSGU7O21CQU1uQixjQUFBLEdBQWdCLFNBQUE7QUFFWixZQUFBO1FBQUEsRUFBRSxDQUFDLGFBQUgsQ0FBaUIsSUFBQyxDQUFBLFFBQWxCO1FBQ0EsVUFBQSxHQUFhLFFBQUEsQ0FBUyxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxRQUFaLEVBQXNCLEtBQXRCLENBQVQsRUFBdUM7WUFBQSxRQUFBLEVBQVMsTUFBVDtTQUF2QztRQUNiLElBQUcsQ0FBSSxLQUFBLENBQU0sVUFBTixDQUFQO0FBQ0k7aUJBQUEsNENBQUE7O2dCQUNJLEdBQUEsR0FBTSxJQUFDLENBQUEsWUFBRCxDQUFBO2dCQUNOLFFBQUEsR0FBVyxLQUFLLENBQUMsSUFBTixDQUFXLElBQUMsQ0FBQSxRQUFaLEVBQXNCLEtBQXRCLEVBQStCLEdBQUcsQ0FBQyxFQUFMLEdBQVEsT0FBdEM7NkJBQ1gsRUFBRSxDQUFDLFFBQUgsQ0FBWSxJQUFaLEVBQWtCLFFBQWxCO0FBSEo7MkJBREo7O0lBSlk7O21CQWdCaEIsSUFBQSxHQUFNLFNBQUE7QUFFRixZQUFBO1FBQUEsTUFBQSxHQUFTLElBQUEsQ0FBQSxDQUFNLENBQUM7UUFFaEIsSUFBRyxNQUFIO1lBQ0ksSUFBSSxDQUFDLE1BQUwsQ0FBWSxXQUFaO1lBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXFCLENBQUEsU0FBQSxLQUFBO3VCQUFBLFNBQUE7b0JBQ2pCLE1BQUEsSUFBVTtvQkFDVixJQUFHLE1BQUEsS0FBVSxDQUFiOytCQUNJLEtBQUMsQ0FBQSxPQUFELENBQUEsRUFESjs7Z0JBRmlCO1lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjttQkFJQSxRQU5KOztJQUpFOzs7O0dBN0RTOztBQXlFbkIsSUFBQSxHQUFPLElBQUksSUFBSixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgZmlsZWxpc3QsIHNsYXNoLCBlbXB0eSwgYXJncywgYXBwLCB3aW4sIGZzIH0gPSByZXF1aXJlICdreGsnXG5cbnsgQnJvd3NlcldpbmRvdyB9ID0gcmVxdWlyZSAnZWxlY3Ryb24nXG5cbm1haW4gPSB1bmRlZmluZWRcblxucG9zdC5vbiAnbmV3V2luZG93JyAtPiBtYWluLmNyZWF0ZVdpbmRvdygpXG5cbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4jIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDBcbiMgMDAgICAgIDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG53aW5zICAgICAgICA9IC0+IEJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpLnNvcnQgKGEsYikgLT4gYS5pZCAtIGIuaWRcbmFjdGl2ZVdpbiAgID0gLT4gQnJvd3NlcldpbmRvdy5nZXRGb2N1c2VkV2luZG93KClcbnZpc2libGVXaW5zID0gLT4gKHcgZm9yIHcgaW4gd2lucygpIHdoZW4gdz8uaXNWaXNpYmxlKCkgYW5kIG5vdCB3Py5pc01pbmltaXplZCgpKVxuXG53aW5XaXRoSUQgICA9ICh3aW5JRCkgLT5cblxuICAgIHdpZCA9IHBhcnNlSW50IHdpbklEXG4gICAgZm9yIHcgaW4gd2lucygpXG4gICAgICAgIHJldHVybiB3IGlmIHcuaWQgPT0gd2lkXG5cbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuXG5jbGFzcyBNYWluIGV4dGVuZHMgYXBwXG5cbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBkaXI6ICAgICAgICBfX2Rpcm5hbWVcbiAgICAgICAgICAgIHBrZzogICAgICAgIHJlcXVpcmUgJy4uL3BhY2thZ2UuanNvbidcbiAgICAgICAgICAgIHNob3J0Y3V0OiAgICdBbHQrRjEnXG4gICAgICAgICAgICBpbmRleDogICAgICAnaW5kZXguaHRtbCdcbiAgICAgICAgICAgIGljb246ICAgICAgICcuLi9pbWcvYXBwLmljbydcbiAgICAgICAgICAgIHRyYXk6ICAgICAgICcuLi9pbWcvbWVudS5wbmcnXG4gICAgICAgICAgICBhYm91dDogICAgICAnLi4vaW1nL2Fib3V0LnBuZydcbiAgICAgICAgICAgIHByZWZzU2VwZXJhdG9yOiAn4pa4J1xuICAgICAgICAgICAgYWJvdXREZWJ1ZzogZmFsc2UgIFxuICAgICAgICAgICAgbWluV2lkdGg6ICAgNTAwIFxuICAgICAgICAgICAgb25TaG93OiAgICAgLT4gbWFpbi5vblNob3coKVxuICAgICAgICAgICAgXG4gICAgICAgIEBvcHQub25RdWl0ID0gQHF1aXRcbiAgICAgICAgQG1vdmVXaW5kb3dTdGFzaGVzKClcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgIFxuICAgIG9uU2hvdzogPT5cbiAgICAgICAgIFxuICAgICAgICBAcmVzdG9yZVdpbmRvd3MoKSBpZiBub3QgYXJncy5ub3N0YXRlXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgd2lucygpLmxlbmd0aFxuICAgICAgICAgICAgQGNyZWF0ZVdpbmRvdygpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgXG4gICAgbW92ZVdpbmRvd1N0YXNoZXM6IC0+XG4gICAgICAgIFxuICAgICAgICBzdGFzaERpciA9IHNsYXNoLmpvaW4gQHVzZXJEYXRhLCAnd2luJ1xuICAgICAgICBpZiBzbGFzaC5kaXJFeGlzdHMgc3Rhc2hEaXJcbiAgICAgICAgICAgIGZzLm1vdmVTeW5jIHN0YXNoRGlyLCBzbGFzaC5qb2luKEB1c2VyRGF0YSwgJ29sZCcpLCBvdmVyd3JpdGU6IHRydWVcbiAgICBcbiAgICByZXN0b3JlV2luZG93czogLT5cbiAgICBcbiAgICAgICAgZnMuZW5zdXJlRGlyU3luYyBAdXNlckRhdGFcbiAgICAgICAgc3Rhc2hGaWxlcyA9IGZpbGVsaXN0IHNsYXNoLmpvaW4oQHVzZXJEYXRhLCAnb2xkJyksIG1hdGNoRXh0Oidub29uJ1xuICAgICAgICBpZiBub3QgZW1wdHkgc3Rhc2hGaWxlc1xuICAgICAgICAgICAgZm9yIGZpbGUgaW4gc3Rhc2hGaWxlc1xuICAgICAgICAgICAgICAgIHdpbiA9IEBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgICAgIG5ld1N0YXNoID0gc2xhc2guam9pbiBAdXNlckRhdGEsICd3aW4nIFwiI3t3aW4uaWR9Lm5vb25cIlxuICAgICAgICAgICAgICAgIGZzLmNvcHlTeW5jIGZpbGUsIG5ld1N0YXNoXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAwMCAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwIDAwICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBxdWl0OiA9PlxuXG4gICAgICAgIHRvU2F2ZSA9IHdpbnMoKS5sZW5ndGhcblxuICAgICAgICBpZiB0b1NhdmVcbiAgICAgICAgICAgIHBvc3QudG9XaW5zICdzYXZlU3Rhc2gnXG4gICAgICAgICAgICBwb3N0Lm9uICdzdGFzaFNhdmVkJyA9PlxuICAgICAgICAgICAgICAgIHRvU2F2ZSAtPSAxXG4gICAgICAgICAgICAgICAgaWYgdG9TYXZlID09IDBcbiAgICAgICAgICAgICAgICAgICAgQGV4aXRBcHAoKVxuICAgICAgICAgICAgJ2RlbGF5J1xuICAgICAgICAgICAgICAgIFxubWFpbiA9IG5ldyBNYWluKClcbiJdfQ==
//# sourceURL=../coffee/main.coffee