// koffee 1.4.0

/*
 0000000  000   000  0000000    000  00000000   
000       000   000  000   000  000  000   000  
000       000000000  000   000  000  0000000    
000       000   000  000   000  000  000   000  
 0000000  000   000  0000000    000  000   000
 */
var Chdir, Cmmd, kerror, klog, post, prefs, ref, slash,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), slash = ref.slash, post = ref.post, prefs = ref.prefs, kerror = ref.kerror, klog = ref.klog;

Cmmd = require('./cmmd');

Chdir = (function(superClass) {
    extend(Chdir, superClass);

    function Chdir() {
        Chdir.__super__.constructor.apply(this, arguments);
        this.lastDir = '~';
    }

    Chdir.prototype.onCommand = function(cmd) {
        var cwd, dir, err;
        if (cmd === 'cd') {
            cmd = 'cd ~';
        } else if (cmd === 'cd..') {
            cmd = 'cd ..';
        } else if (cmd === 'cd.') {
            cmd = 'cd .';
        } else if (cmd === 'cd -' || cmd === 'cd-' || cmd === '-') {
            cmd = "cd " + this.lastDir;
        }
        if (!cmd.startsWith('cd ')) {
            cmd = 'cd ' + cmd;
        }
        dir = slash.resolve(cmd.slice(3).trim());
        if (!slash.isDir(dir)) {
            return false;
        }
        try {
            cwd = process.cwd();
            process.chdir(dir);
            prefs.set('cwd', dir);
            this.term.tab.update(slash.tilde(dir));
            if (cwd !== dir) {
                this.lastDir = cwd;
            }
            this.shell.last.chdir = true;
            return true;
        } catch (error) {
            err = error;
            return kerror("" + err);
        }
    };

    Chdir.prototype.onFallback = function(cmd) {
        if (slash.isDir(slash.join(process.cwd(), cmd))) {
            return this.onCommand('cd ' + cmd);
        }
    };

    return Chdir;

})(Cmmd);

module.exports = Chdir;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hkaXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtEQUFBO0lBQUE7OztBQVFBLE1BQXVDLE9BQUEsQ0FBUSxLQUFSLENBQXZDLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsaUJBQWYsRUFBc0IsbUJBQXRCLEVBQThCOztBQUU5QixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0FBRUQ7OztJQUVDLGVBQUE7UUFFQyx3Q0FBQSxTQUFBO1FBQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVztJQUhaOztvQkFLSCxTQUFBLEdBQVcsU0FBQyxHQUFEO0FBRVAsWUFBQTtRQUFBLElBQUcsR0FBQSxLQUFRLElBQVg7WUFDSSxHQUFBLEdBQU0sT0FEVjtTQUFBLE1BRUssSUFBRyxHQUFBLEtBQVEsTUFBWDtZQUNELEdBQUEsR0FBTSxRQURMO1NBQUEsTUFFQSxJQUFHLEdBQUEsS0FBUSxLQUFYO1lBQ0QsR0FBQSxHQUFNLE9BREw7U0FBQSxNQUVBLElBQUcsR0FBQSxLQUFRLE1BQVIsSUFBQSxHQUFBLEtBQWUsS0FBZixJQUFBLEdBQUEsS0FBcUIsR0FBeEI7WUFDRCxHQUFBLEdBQU0sS0FBQSxHQUFNLElBQUMsQ0FBQSxRQURaOztRQUdMLElBQUcsQ0FBSSxHQUFHLENBQUMsVUFBSixDQUFlLEtBQWYsQ0FBUDtZQUNJLEdBQUEsR0FBTSxLQUFBLEdBQVEsSUFEbEI7O1FBR0EsR0FBQSxHQUFNLEtBQUssQ0FBQyxPQUFOLENBQWMsR0FBRyxDQUFDLEtBQUosQ0FBVSxDQUFWLENBQVksQ0FBQyxJQUFiLENBQUEsQ0FBZDtRQUVOLElBQWdCLENBQUksS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaLENBQXBCO0FBQUEsbUJBQU8sTUFBUDs7QUFFQTtZQUNJLEdBQUEsR0FBTSxPQUFPLENBQUMsR0FBUixDQUFBO1lBRU4sT0FBTyxDQUFDLEtBQVIsQ0FBYyxHQUFkO1lBQ0EsS0FBSyxDQUFDLEdBQU4sQ0FBVSxLQUFWLEVBQWdCLEdBQWhCO1lBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBVixDQUFpQixLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBakI7WUFDQSxJQUFrQixHQUFBLEtBQU8sR0FBekI7Z0JBQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFYOztZQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQVosR0FBb0I7QUFDcEIsbUJBQU8sS0FSWDtTQUFBLGFBQUE7WUFTTTttQkFDRixNQUFBLENBQU8sRUFBQSxHQUFHLEdBQVYsRUFWSjs7SUFsQk87O29CQThCWCxVQUFBLEdBQVksU0FBQyxHQUFEO1FBRVIsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLEtBQUssQ0FBQyxJQUFOLENBQVcsT0FBTyxDQUFDLEdBQVIsQ0FBQSxDQUFYLEVBQTBCLEdBQTFCLENBQVosQ0FBSDttQkFDSSxJQUFDLENBQUEsU0FBRCxDQUFXLEtBQUEsR0FBUSxHQUFuQixFQURKOztJQUZROzs7O0dBckNJOztBQTBDcEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBzbGFzaCwgcG9zdCwgcHJlZnMsIGtlcnJvciwga2xvZyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5DbW1kID0gcmVxdWlyZSAnLi9jbW1kJ1xuXG5jbGFzcyBDaGRpciBleHRlbmRzIENtbWRcbiAgICBcbiAgICBAOiAtPiBcbiAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgIEBsYXN0RGlyID0gJ34nXG5cbiAgICBvbkNvbW1hbmQ6IChjbWQpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNtZCBpbiBbJ2NkJ11cbiAgICAgICAgICAgIGNtZCA9ICdjZCB+J1xuICAgICAgICBlbHNlIGlmIGNtZCBpbiBbJ2NkLi4nXVxuICAgICAgICAgICAgY21kID0gJ2NkIC4uJ1xuICAgICAgICBlbHNlIGlmIGNtZCBpbiBbJ2NkLiddXG4gICAgICAgICAgICBjbWQgPSAnY2QgLidcbiAgICAgICAgZWxzZSBpZiBjbWQgaW4gWydjZCAtJyAnY2QtJyAnLSddXG4gICAgICAgICAgICBjbWQgPSBcImNkICN7QGxhc3REaXJ9XCJcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgY21kLnN0YXJ0c1dpdGggJ2NkICdcbiAgICAgICAgICAgIGNtZCA9ICdjZCAnICsgY21kXG4gICAgICAgIFxuICAgICAgICBkaXIgPSBzbGFzaC5yZXNvbHZlIGNtZC5zbGljZSgzKS50cmltKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgIFxuICAgICAgICB0cnkgXG4gICAgICAgICAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICAjIGtsb2cgJ2NoZGlyJyBkaXJcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIgZGlyXG4gICAgICAgICAgICBwcmVmcy5zZXQgJ2N3ZCcgZGlyXG4gICAgICAgICAgICBAdGVybS50YWIudXBkYXRlIHNsYXNoLnRpbGRlIGRpclxuICAgICAgICAgICAgQGxhc3REaXIgPSBjd2QgaWYgY3dkICE9IGRpclxuICAgICAgICAgICAgQHNoZWxsLmxhc3QuY2hkaXIgPSB0cnVlICMgcHJldmVudHMgYnJhaW4gaGFuZGxpbmdcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAga2Vycm9yIFwiI3tlcnJ9XCJcbiAgICAgICAgICAgICAgICBcbiAgICBvbkZhbGxiYWNrOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIgc2xhc2guam9pbiBwcm9jZXNzLmN3ZCgpLCBjbWRcbiAgICAgICAgICAgIEBvbkNvbW1hbmQgJ2NkICcgKyBjbWRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENoZGlyXG4iXX0=
//# sourceURL=../coffee/chdir.coffee