// koffee 1.4.0

/*
 0000000  000   000  0000000    000  00000000   
000       000   000  000   000  000  000   000  
000       000000000  000   000  000  0000000    
000       000   000  000   000  000  000   000  
 0000000  000   000  0000000    000  000   000
 */
var Chdir, Cmmd, kerror, kstr, prefs, ref, slash,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), slash = ref.slash, prefs = ref.prefs, kstr = ref.kstr, kerror = ref.kerror;

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
        cwd = process.cwd();
        dir = slash.join(cwd, kstr.strip(cmd.slice(3), ' "'));
        if (!slash.isDir(dir)) {
            return false;
        }
        try {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hkaXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDRDQUFBO0lBQUE7OztBQVFBLE1BQWlDLE9BQUEsQ0FBUSxLQUFSLENBQWpDLEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixlQUFoQixFQUFzQjs7QUFFdEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztBQUVEOzs7SUFFQyxlQUFBO1FBRUMsd0NBQUEsU0FBQTtRQUNBLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFIWjs7b0JBS0gsU0FBQSxHQUFXLFNBQUMsR0FBRDtBQUVQLFlBQUE7UUFBQSxJQUFHLEdBQUEsS0FBUSxJQUFYO1lBQ0ksR0FBQSxHQUFNLE9BRFY7U0FBQSxNQUVLLElBQUcsR0FBQSxLQUFRLE1BQVg7WUFDRCxHQUFBLEdBQU0sUUFETDtTQUFBLE1BRUEsSUFBRyxHQUFBLEtBQVEsS0FBWDtZQUNELEdBQUEsR0FBTSxPQURMO1NBQUEsTUFFQSxJQUFHLEdBQUEsS0FBUSxNQUFSLElBQUEsR0FBQSxLQUFlLEtBQWYsSUFBQSxHQUFBLEtBQXFCLEdBQXhCO1lBQ0QsR0FBQSxHQUFNLEtBQUEsR0FBTSxJQUFDLENBQUEsUUFEWjs7UUFHTCxJQUFHLENBQUksR0FBRyxDQUFDLFVBQUosQ0FBZSxLQUFmLENBQVA7WUFDSSxHQUFBLEdBQU0sS0FBQSxHQUFRLElBRGxCOztRQUdBLEdBQUEsR0FBTSxPQUFPLENBQUMsR0FBUixDQUFBO1FBQ04sR0FBQSxHQUFNLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWCxFQUFnQixJQUFJLENBQUMsS0FBTCxDQUFXLEdBQUcsQ0FBQyxLQUFKLENBQVUsQ0FBVixDQUFYLEVBQXlCLElBQXpCLENBQWhCO1FBRU4sSUFBZ0IsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBcEI7QUFBQSxtQkFBTyxNQUFQOztBQUVBO1lBQ0ksT0FBTyxDQUFDLEtBQVIsQ0FBYyxHQUFkO1lBQ0EsS0FBSyxDQUFDLEdBQU4sQ0FBVSxLQUFWLEVBQWdCLEdBQWhCO1lBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBVixDQUFpQixLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBakI7WUFDQSxJQUFrQixHQUFBLEtBQU8sR0FBekI7Z0JBQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFYOztZQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQVosR0FBb0I7QUFDcEIsbUJBQU8sS0FOWDtTQUFBLGFBQUE7WUFPTTttQkFDRixNQUFBLENBQU8sRUFBQSxHQUFHLEdBQVYsRUFSSjs7SUFuQk87O29CQTZCWCxVQUFBLEdBQVksU0FBQyxHQUFEO1FBRVIsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLEtBQUssQ0FBQyxJQUFOLENBQVcsT0FBTyxDQUFDLEdBQVIsQ0FBQSxDQUFYLEVBQTBCLEdBQTFCLENBQVosQ0FBSDttQkFDSSxJQUFDLENBQUEsU0FBRCxDQUFXLEtBQUEsR0FBUSxHQUFuQixFQURKOztJQUZROzs7O0dBcENJOztBQXlDcEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBzbGFzaCwgcHJlZnMsIGtzdHIsIGtlcnJvciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5DbW1kID0gcmVxdWlyZSAnLi9jbW1kJ1xuXG5jbGFzcyBDaGRpciBleHRlbmRzIENtbWRcbiAgICBcbiAgICBAOiAtPiBcbiAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgIEBsYXN0RGlyID0gJ34nXG5cbiAgICBvbkNvbW1hbmQ6IChjbWQpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNtZCBpbiBbJ2NkJ11cbiAgICAgICAgICAgIGNtZCA9ICdjZCB+J1xuICAgICAgICBlbHNlIGlmIGNtZCBpbiBbJ2NkLi4nXVxuICAgICAgICAgICAgY21kID0gJ2NkIC4uJ1xuICAgICAgICBlbHNlIGlmIGNtZCBpbiBbJ2NkLiddXG4gICAgICAgICAgICBjbWQgPSAnY2QgLidcbiAgICAgICAgZWxzZSBpZiBjbWQgaW4gWydjZCAtJyAnY2QtJyAnLSddXG4gICAgICAgICAgICBjbWQgPSBcImNkICN7QGxhc3REaXJ9XCJcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgY21kLnN0YXJ0c1dpdGggJ2NkICdcbiAgICAgICAgICAgIGNtZCA9ICdjZCAnICsgY21kXG5cbiAgICAgICAgY3dkID0gcHJvY2Vzcy5jd2QoKVxuICAgICAgICBkaXIgPSBzbGFzaC5qb2luIGN3ZCwga3N0ci5zdHJpcCBjbWQuc2xpY2UoMyksICcgXCInXG5cbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgXG4gICAgICAgIHRyeSBcbiAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIgZGlyXG4gICAgICAgICAgICBwcmVmcy5zZXQgJ2N3ZCcgZGlyXG4gICAgICAgICAgICBAdGVybS50YWIudXBkYXRlIHNsYXNoLnRpbGRlIGRpclxuICAgICAgICAgICAgQGxhc3REaXIgPSBjd2QgaWYgY3dkICE9IGRpclxuICAgICAgICAgICAgQHNoZWxsLmxhc3QuY2hkaXIgPSB0cnVlICMgcHJldmVudHMgYnJhaW4gaGFuZGxpbmdcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAga2Vycm9yIFwiI3tlcnJ9XCJcbiAgICAgICAgICAgICAgICBcbiAgICBvbkZhbGxiYWNrOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIgc2xhc2guam9pbiBwcm9jZXNzLmN3ZCgpLCBjbWRcbiAgICAgICAgICAgIEBvbkNvbW1hbmQgJ2NkICcgKyBjbWRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENoZGlyXG4iXX0=
//# sourceURL=../coffee/chdir.coffee