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
        var cwd, dir, err, ref1;
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
        dir = slash.resolve(kstr.strip(cmd.slice(3), ' "'));
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
            if ((ref1 = this.shell.last) != null) {
                ref1.chdir = true;
            }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hkaXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDRDQUFBO0lBQUE7OztBQVFBLE1BQWlDLE9BQUEsQ0FBUSxLQUFSLENBQWpDLEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixlQUFoQixFQUFzQjs7QUFFdEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztBQUVEOzs7SUFFQyxlQUFBO1FBRUMsd0NBQUEsU0FBQTtRQUNBLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFIWjs7b0JBS0gsU0FBQSxHQUFXLFNBQUMsR0FBRDtBQUVQLFlBQUE7UUFBQSxJQUFHLEdBQUEsS0FBUSxJQUFYO1lBQ0ksR0FBQSxHQUFNLE9BRFY7U0FBQSxNQUVLLElBQUcsR0FBQSxLQUFRLE1BQVg7WUFDRCxHQUFBLEdBQU0sUUFETDtTQUFBLE1BRUEsSUFBRyxHQUFBLEtBQVEsS0FBWDtZQUNELEdBQUEsR0FBTSxPQURMO1NBQUEsTUFFQSxJQUFHLEdBQUEsS0FBUSxNQUFSLElBQUEsR0FBQSxLQUFlLEtBQWYsSUFBQSxHQUFBLEtBQXFCLEdBQXhCO1lBQ0QsR0FBQSxHQUFNLEtBQUEsR0FBTSxJQUFDLENBQUEsUUFEWjs7UUFHTCxJQUFHLENBQUksR0FBRyxDQUFDLFVBQUosQ0FBZSxLQUFmLENBQVA7WUFDSSxHQUFBLEdBQU0sS0FBQSxHQUFRLElBRGxCOztRQUdBLEdBQUEsR0FBTSxLQUFLLENBQUMsT0FBTixDQUFjLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBRyxDQUFDLEtBQUosQ0FBVSxDQUFWLENBQVgsRUFBeUIsSUFBekIsQ0FBZDtRQUNOLElBQWdCLENBQUksS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaLENBQXBCO0FBQUEsbUJBQU8sTUFBUDs7QUFFQTtZQUNJLEdBQUEsR0FBTSxPQUFPLENBQUMsR0FBUixDQUFBO1lBQ04sT0FBTyxDQUFDLEtBQVIsQ0FBYyxHQUFkO1lBQ0EsS0FBSyxDQUFDLEdBQU4sQ0FBVSxLQUFWLEVBQWdCLEdBQWhCO1lBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBVixDQUFpQixLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBakI7WUFDQSxJQUFrQixHQUFBLEtBQU8sR0FBekI7Z0JBQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFYOzs7b0JBQ1csQ0FBRSxLQUFiLEdBQXFCOztBQUNyQixtQkFBTyxLQVBYO1NBQUEsYUFBQTtZQVFNO21CQUNGLE1BQUEsQ0FBTyxFQUFBLEdBQUcsR0FBVixFQVRKOztJQWpCTzs7b0JBNEJYLFVBQUEsR0FBWSxTQUFDLEdBQUQ7UUFFUixJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksS0FBSyxDQUFDLElBQU4sQ0FBVyxPQUFPLENBQUMsR0FBUixDQUFBLENBQVgsRUFBMEIsR0FBMUIsQ0FBWixDQUFIO21CQUNJLElBQUMsQ0FBQSxTQUFELENBQVcsS0FBQSxHQUFRLEdBQW5CLEVBREo7O0lBRlE7Ozs7R0FuQ0k7O0FBd0NwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IHNsYXNoLCBwcmVmcywga3N0ciwga2Vycm9yIH0gPSByZXF1aXJlICdreGsnXG5cbkNtbWQgPSByZXF1aXJlICcuL2NtbWQnXG5cbmNsYXNzIENoZGlyIGV4dGVuZHMgQ21tZFxuICAgIFxuICAgIEA6IC0+IFxuICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgQGxhc3REaXIgPSAnfidcblxuICAgIG9uQ29tbWFuZDogKGNtZCkgLT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY21kIGluIFsnY2QnXVxuICAgICAgICAgICAgY21kID0gJ2NkIH4nXG4gICAgICAgIGVsc2UgaWYgY21kIGluIFsnY2QuLiddXG4gICAgICAgICAgICBjbWQgPSAnY2QgLi4nXG4gICAgICAgIGVsc2UgaWYgY21kIGluIFsnY2QuJ11cbiAgICAgICAgICAgIGNtZCA9ICdjZCAuJ1xuICAgICAgICBlbHNlIGlmIGNtZCBpbiBbJ2NkIC0nICdjZC0nICctJ11cbiAgICAgICAgICAgIGNtZCA9IFwiY2QgI3tAbGFzdERpcn1cIlxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBjbWQuc3RhcnRzV2l0aCAnY2QgJ1xuICAgICAgICAgICAgY21kID0gJ2NkICcgKyBjbWRcblxuICAgICAgICBkaXIgPSBzbGFzaC5yZXNvbHZlIGtzdHIuc3RyaXAgY21kLnNsaWNlKDMpLCAnIFwiJ1xuICAgICAgICByZXR1cm4gZmFsc2UgaWYgbm90IHNsYXNoLmlzRGlyIGRpclxuICAgICAgICBcbiAgICAgICAgdHJ5IFxuICAgICAgICAgICAgY3dkID0gcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBkaXJcbiAgICAgICAgICAgIHByZWZzLnNldCAnY3dkJyBkaXJcbiAgICAgICAgICAgIEB0ZXJtLnRhYi51cGRhdGUgc2xhc2gudGlsZGUgZGlyXG4gICAgICAgICAgICBAbGFzdERpciA9IGN3ZCBpZiBjd2QgIT0gZGlyXG4gICAgICAgICAgICBAc2hlbGwubGFzdD8uY2hkaXIgPSB0cnVlICMgcHJldmVudHMgYnJhaW4gaGFuZGxpbmdcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAga2Vycm9yIFwiI3tlcnJ9XCJcbiAgICAgICAgICAgICAgICBcbiAgICBvbkZhbGxiYWNrOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIgc2xhc2guam9pbiBwcm9jZXNzLmN3ZCgpLCBjbWRcbiAgICAgICAgICAgIEBvbkNvbW1hbmQgJ2NkICcgKyBjbWRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENoZGlyXG4iXX0=
//# sourceURL=../coffee/chdir.coffee