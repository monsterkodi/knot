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
        if (cmd === 'cd' || cmd === '~') {
            cmd = 'cd ~';
        } else if (cmd === 'cd..' || cmd === '..') {
            cmd = 'cd ..';
        } else if (cmd === 'cd.' || cmd === '.') {
            cmd = 'cd .';
        } else if (cmd === 'cd -' || cmd === 'cd-' || cmd === '-') {
            cmd = "cd " + this.lastDir;
        }
        if (cmd.startsWith('cd ')) {
            dir = slash.resolve(cmd.slice(3).trim());
            try {
                cwd = process.cwd();
                klog('chdir', dir);
                process.chdir(dir);
                prefs.set('cwd', dir);
                this.term.tab.update(slash.tilde(dir));
                if (cwd !== dir) {
                    this.lastDir = cwd;
                }
                return true;
            } catch (error) {
                err = error;
                return kerror("" + err);
            }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hkaXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtEQUFBO0lBQUE7OztBQVFBLE1BQXVDLE9BQUEsQ0FBUSxLQUFSLENBQXZDLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsaUJBQWYsRUFBc0IsbUJBQXRCLEVBQThCOztBQUU5QixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0FBRUQ7OztJQUVDLGVBQUE7UUFFQyx3Q0FBQSxTQUFBO1FBQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVztJQUhaOztvQkFLSCxTQUFBLEdBQVcsU0FBQyxHQUFEO0FBRVAsWUFBQTtRQUFBLElBQUcsR0FBQSxLQUFRLElBQVIsSUFBQSxHQUFBLEtBQWEsR0FBaEI7WUFDSSxHQUFBLEdBQU0sT0FEVjtTQUFBLE1BRUssSUFBRyxHQUFBLEtBQVEsTUFBUixJQUFBLEdBQUEsS0FBZSxJQUFsQjtZQUNELEdBQUEsR0FBTSxRQURMO1NBQUEsTUFFQSxJQUFHLEdBQUEsS0FBUSxLQUFSLElBQUEsR0FBQSxLQUFjLEdBQWpCO1lBQ0QsR0FBQSxHQUFNLE9BREw7U0FBQSxNQUVBLElBQUcsR0FBQSxLQUFRLE1BQVIsSUFBQSxHQUFBLEtBQWUsS0FBZixJQUFBLEdBQUEsS0FBcUIsR0FBeEI7WUFDRCxHQUFBLEdBQU0sS0FBQSxHQUFNLElBQUMsQ0FBQSxRQURaOztRQUdMLElBQUcsR0FBRyxDQUFDLFVBQUosQ0FBZSxLQUFmLENBQUg7WUFDSSxHQUFBLEdBQU0sS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFHLENBQUMsS0FBSixDQUFVLENBQVYsQ0FBWSxDQUFDLElBQWIsQ0FBQSxDQUFkO0FBQ047Z0JBQ0ksR0FBQSxHQUFNLE9BQU8sQ0FBQyxHQUFSLENBQUE7Z0JBQ04sSUFBQSxDQUFLLE9BQUwsRUFBYSxHQUFiO2dCQUNBLE9BQU8sQ0FBQyxLQUFSLENBQWMsR0FBZDtnQkFDQSxLQUFLLENBQUMsR0FBTixDQUFVLEtBQVYsRUFBZ0IsR0FBaEI7Z0JBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBVixDQUFpQixLQUFLLENBQUMsS0FBTixDQUFZLEdBQVosQ0FBakI7Z0JBQ0EsSUFBa0IsR0FBQSxLQUFPLEdBQXpCO29CQUFBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBWDs7QUFDQSx1QkFBTyxLQVBYO2FBQUEsYUFBQTtnQkFRTTt1QkFDRixNQUFBLENBQU8sRUFBQSxHQUFHLEdBQVYsRUFUSjthQUZKOztJQVhPOztvQkF3QlgsVUFBQSxHQUFZLFNBQUMsR0FBRDtRQUVSLElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxLQUFLLENBQUMsSUFBTixDQUFXLE9BQU8sQ0FBQyxHQUFSLENBQUEsQ0FBWCxFQUEwQixHQUExQixDQUFaLENBQUg7bUJBQ0ksSUFBQyxDQUFBLFNBQUQsQ0FBVyxLQUFBLEdBQVEsR0FBbkIsRUFESjs7SUFGUTs7OztHQS9CSTs7QUFvQ3BCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwMDAwMDAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAgICAwMDAgIFxuIyMjXG5cbnsgc2xhc2gsIHBvc3QsIHByZWZzLCBrZXJyb3IsIGtsb2cgfSA9IHJlcXVpcmUgJ2t4aydcblxuQ21tZCA9IHJlcXVpcmUgJy4vY21tZCdcblxuY2xhc3MgQ2hkaXIgZXh0ZW5kcyBDbW1kXG4gICAgXG4gICAgQDogLT4gXG4gICAgICAgIFxuICAgICAgICBzdXBlclxuICAgICAgICBAbGFzdERpciA9ICd+J1xuXG4gICAgb25Db21tYW5kOiAoY21kKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBjbWQgaW4gWydjZCcgJ34nXVxuICAgICAgICAgICAgY21kID0gJ2NkIH4nXG4gICAgICAgIGVsc2UgaWYgY21kIGluIFsnY2QuLicgJy4uJ11cbiAgICAgICAgICAgIGNtZCA9ICdjZCAuLidcbiAgICAgICAgZWxzZSBpZiBjbWQgaW4gWydjZC4nICcuJ11cbiAgICAgICAgICAgIGNtZCA9ICdjZCAuJ1xuICAgICAgICBlbHNlIGlmIGNtZCBpbiBbJ2NkIC0nICdjZC0nICctJ11cbiAgICAgICAgICAgIGNtZCA9IFwiY2QgI3tAbGFzdERpcn1cIlxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGNtZC5zdGFydHNXaXRoICdjZCAnXG4gICAgICAgICAgICBkaXIgPSBzbGFzaC5yZXNvbHZlIGNtZC5zbGljZSgzKS50cmltKClcbiAgICAgICAgICAgIHRyeSBcbiAgICAgICAgICAgICAgICBjd2QgPSBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICAgICAga2xvZyAnY2hkaXInIGRpclxuICAgICAgICAgICAgICAgIHByb2Nlc3MuY2hkaXIgZGlyXG4gICAgICAgICAgICAgICAgcHJlZnMuc2V0ICdjd2QnIGRpclxuICAgICAgICAgICAgICAgIEB0ZXJtLnRhYi51cGRhdGUgc2xhc2gudGlsZGUgZGlyXG4gICAgICAgICAgICAgICAgQGxhc3REaXIgPSBjd2QgaWYgY3dkICE9IGRpclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgICAgICBrZXJyb3IgXCIje2Vycn1cIlxuICAgICAgICAgICAgICAgIFxuICAgIG9uRmFsbGJhY2s6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciBzbGFzaC5qb2luIHByb2Nlc3MuY3dkKCksIGNtZFxuICAgICAgICAgICAgQG9uQ29tbWFuZCAnY2QgJyArIGNtZFxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQ2hkaXJcbiJdfQ==
//# sourceURL=../coffee/chdir.coffee