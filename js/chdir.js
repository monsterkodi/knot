// koffee 1.12.0

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
        var cwd, dir, err, ref1, tld;
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
            tld = slash.tilde(dir);
            prefs.set('cwd', tld);
            this.term.tab.update(tld);
            if (cwd !== tld) {
                this.lastDir = tld;
            }
            if ((ref1 = this.shell.last) != null) {
                ref1.chdir = tld;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hkaXIuanMiLCJzb3VyY2VSb290IjoiLi4vY29mZmVlIiwic291cmNlcyI6WyJjaGRpci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNENBQUE7SUFBQTs7O0FBUUEsTUFBaUMsT0FBQSxDQUFRLEtBQVIsQ0FBakMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCOztBQUV0QixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0FBRUQ7OztJQUVDLGVBQUE7UUFFQyx3Q0FBQSxTQUFBO1FBQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVztJQUhaOztvQkFLSCxTQUFBLEdBQVcsU0FBQyxHQUFEO0FBRVAsWUFBQTtRQUFBLElBQUcsR0FBQSxLQUFRLElBQVg7WUFDSSxHQUFBLEdBQU0sT0FEVjtTQUFBLE1BRUssSUFBRyxHQUFBLEtBQVEsTUFBWDtZQUNELEdBQUEsR0FBTSxRQURMO1NBQUEsTUFFQSxJQUFHLEdBQUEsS0FBUSxLQUFYO1lBQ0QsR0FBQSxHQUFNLE9BREw7U0FBQSxNQUVBLElBQUcsR0FBQSxLQUFRLE1BQVIsSUFBQSxHQUFBLEtBQWUsS0FBZixJQUFBLEdBQUEsS0FBcUIsR0FBeEI7WUFDRCxHQUFBLEdBQU0sS0FBQSxHQUFNLElBQUMsQ0FBQSxRQURaOztRQUdMLElBQUcsQ0FBSSxHQUFHLENBQUMsVUFBSixDQUFlLEtBQWYsQ0FBUDtZQUNJLEdBQUEsR0FBTSxLQUFBLEdBQVEsSUFEbEI7O1FBR0EsR0FBQSxHQUFNLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFHLENBQUMsS0FBSixDQUFVLENBQVYsQ0FBWCxFQUF5QixJQUF6QixDQUFkO1FBQ04sSUFBZ0IsQ0FBSSxLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBcEI7QUFBQSxtQkFBTyxNQUFQOztBQUVBO1lBQ0ksR0FBQSxHQUFNLE9BQU8sQ0FBQyxHQUFSLENBQUE7WUFDTixPQUFPLENBQUMsS0FBUixDQUFjLEdBQWQ7WUFDQSxHQUFBLEdBQU0sS0FBSyxDQUFDLEtBQU4sQ0FBWSxHQUFaO1lBQ04sS0FBSyxDQUFDLEdBQU4sQ0FBVSxLQUFWLEVBQWdCLEdBQWhCO1lBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBVixDQUFpQixHQUFqQjtZQUNBLElBQWtCLEdBQUEsS0FBTyxHQUF6QjtnQkFBQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQVg7OztvQkFDVyxDQUFFLEtBQWIsR0FBcUI7O0FBQ3JCLG1CQUFPLEtBUlg7U0FBQSxhQUFBO1lBU007bUJBQ0YsTUFBQSxDQUFPLEVBQUEsR0FBRyxHQUFWLEVBVko7O0lBakJPOztvQkE2QlgsVUFBQSxHQUFZLFNBQUMsR0FBRDtRQUVSLElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxLQUFLLENBQUMsSUFBTixDQUFXLE9BQU8sQ0FBQyxHQUFSLENBQUEsQ0FBWCxFQUEwQixHQUExQixDQUFaLENBQUg7bUJBQ0ksSUFBQyxDQUFBLFNBQUQsQ0FBVyxLQUFBLEdBQVEsR0FBbkIsRUFESjs7SUFGUTs7OztHQXBDSTs7QUF5Q3BCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgc2xhc2gsIHByZWZzLCBrc3RyLCBrZXJyb3IgfSA9IHJlcXVpcmUgJ2t4aydcblxuQ21tZCA9IHJlcXVpcmUgJy4vY21tZCdcblxuY2xhc3MgQ2hkaXIgZXh0ZW5kcyBDbW1kXG4gICAgXG4gICAgQDogLT4gXG4gICAgICAgIFxuICAgICAgICBzdXBlclxuICAgICAgICBAbGFzdERpciA9ICd+J1xuXG4gICAgb25Db21tYW5kOiAoY21kKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjbWQgaW4gWydjZCddXG4gICAgICAgICAgICBjbWQgPSAnY2QgfidcbiAgICAgICAgZWxzZSBpZiBjbWQgaW4gWydjZC4uJ11cbiAgICAgICAgICAgIGNtZCA9ICdjZCAuLidcbiAgICAgICAgZWxzZSBpZiBjbWQgaW4gWydjZC4nXVxuICAgICAgICAgICAgY21kID0gJ2NkIC4nXG4gICAgICAgIGVsc2UgaWYgY21kIGluIFsnY2QgLScgJ2NkLScgJy0nXVxuICAgICAgICAgICAgY21kID0gXCJjZCAje0BsYXN0RGlyfVwiXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IGNtZC5zdGFydHNXaXRoICdjZCAnXG4gICAgICAgICAgICBjbWQgPSAnY2QgJyArIGNtZFxuXG4gICAgICAgIGRpciA9IHNsYXNoLnJlc29sdmUga3N0ci5zdHJpcCBjbWQuc2xpY2UoMyksICcgXCInXG4gICAgICAgIHJldHVybiBmYWxzZSBpZiBub3Qgc2xhc2guaXNEaXIgZGlyXG4gICAgICAgIFxuICAgICAgICB0cnkgXG4gICAgICAgICAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICBwcm9jZXNzLmNoZGlyIGRpclxuICAgICAgICAgICAgdGxkID0gc2xhc2gudGlsZGUgZGlyXG4gICAgICAgICAgICBwcmVmcy5zZXQgJ2N3ZCcgdGxkXG4gICAgICAgICAgICBAdGVybS50YWIudXBkYXRlIHRsZFxuICAgICAgICAgICAgQGxhc3REaXIgPSB0bGQgaWYgY3dkICE9IHRsZFxuICAgICAgICAgICAgQHNoZWxsLmxhc3Q/LmNoZGlyID0gdGxkICMgc3BlY2lhbCBicmFpbiBoYW5kbGluZ1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBrZXJyb3IgXCIje2Vycn1cIlxuICAgICAgICAgICAgICAgIFxuICAgIG9uRmFsbGJhY2s6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciBzbGFzaC5qb2luIHByb2Nlc3MuY3dkKCksIGNtZFxuICAgICAgICAgICAgQG9uQ29tbWFuZCAnY2QgJyArIGNtZFxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQ2hkaXJcbiJdfQ==
//# sourceURL=../coffee/chdir.coffee