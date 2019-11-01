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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hkaXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtEQUFBO0lBQUE7OztBQVFBLE1BQXVDLE9BQUEsQ0FBUSxLQUFSLENBQXZDLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsaUJBQWYsRUFBc0IsbUJBQXRCLEVBQThCOztBQUU5QixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0FBRUQ7OztJQUVDLGVBQUE7UUFFQyx3Q0FBQSxTQUFBO1FBQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVztJQUhaOztvQkFLSCxTQUFBLEdBQVcsU0FBQyxHQUFEO0FBRVAsWUFBQTtRQUFBLElBQUcsR0FBQSxLQUFRLElBQVIsSUFBQSxHQUFBLEtBQWEsR0FBaEI7WUFDSSxHQUFBLEdBQU0sT0FEVjtTQUFBLE1BRUssSUFBRyxHQUFBLEtBQVEsTUFBUixJQUFBLEdBQUEsS0FBZSxJQUFsQjtZQUNELEdBQUEsR0FBTSxRQURMO1NBQUEsTUFFQSxJQUFHLEdBQUEsS0FBUSxLQUFSLElBQUEsR0FBQSxLQUFjLEdBQWpCO1lBQ0QsR0FBQSxHQUFNLE9BREw7U0FBQSxNQUVBLElBQUcsR0FBQSxLQUFRLE1BQVIsSUFBQSxHQUFBLEtBQWUsS0FBZixJQUFBLEdBQUEsS0FBcUIsR0FBeEI7WUFDRCxHQUFBLEdBQU0sS0FBQSxHQUFNLElBQUMsQ0FBQSxRQURaOztRQUdMLElBQUcsR0FBRyxDQUFDLFVBQUosQ0FBZSxLQUFmLENBQUg7WUFDSSxHQUFBLEdBQU0sS0FBSyxDQUFDLE9BQU4sQ0FBYyxHQUFHLENBQUMsS0FBSixDQUFVLENBQVYsQ0FBWSxDQUFDLElBQWIsQ0FBQSxDQUFkO0FBQ047Z0JBQ0ksR0FBQSxHQUFNLE9BQU8sQ0FBQyxHQUFSLENBQUE7Z0JBRU4sT0FBTyxDQUFDLEtBQVIsQ0FBYyxHQUFkO2dCQUNBLEtBQUssQ0FBQyxHQUFOLENBQVUsS0FBVixFQUFnQixHQUFoQjtnQkFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFWLENBQWlCLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWixDQUFqQjtnQkFDQSxJQUFrQixHQUFBLEtBQU8sR0FBekI7b0JBQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFYOztBQUNBLHVCQUFPLEtBUFg7YUFBQSxhQUFBO2dCQVFNO3VCQUNGLE1BQUEsQ0FBTyxFQUFBLEdBQUcsR0FBVixFQVRKO2FBRko7O0lBWE87O29CQXdCWCxVQUFBLEdBQVksU0FBQyxHQUFEO1FBRVIsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLEtBQUssQ0FBQyxJQUFOLENBQVcsT0FBTyxDQUFDLEdBQVIsQ0FBQSxDQUFYLEVBQTBCLEdBQTFCLENBQVosQ0FBSDttQkFDSSxJQUFDLENBQUEsU0FBRCxDQUFXLEtBQUEsR0FBUSxHQUFuQixFQURKOztJQUZROzs7O0dBL0JJOztBQW9DcEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIFxuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBzbGFzaCwgcG9zdCwgcHJlZnMsIGtlcnJvciwga2xvZyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5DbW1kID0gcmVxdWlyZSAnLi9jbW1kJ1xuXG5jbGFzcyBDaGRpciBleHRlbmRzIENtbWRcbiAgICBcbiAgICBAOiAtPiBcbiAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgIEBsYXN0RGlyID0gJ34nXG5cbiAgICBvbkNvbW1hbmQ6IChjbWQpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNtZCBpbiBbJ2NkJyAnfiddXG4gICAgICAgICAgICBjbWQgPSAnY2QgfidcbiAgICAgICAgZWxzZSBpZiBjbWQgaW4gWydjZC4uJyAnLi4nXVxuICAgICAgICAgICAgY21kID0gJ2NkIC4uJ1xuICAgICAgICBlbHNlIGlmIGNtZCBpbiBbJ2NkLicgJy4nXVxuICAgICAgICAgICAgY21kID0gJ2NkIC4nXG4gICAgICAgIGVsc2UgaWYgY21kIGluIFsnY2QgLScgJ2NkLScgJy0nXVxuICAgICAgICAgICAgY21kID0gXCJjZCAje0BsYXN0RGlyfVwiXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgY21kLnN0YXJ0c1dpdGggJ2NkICdcbiAgICAgICAgICAgIGRpciA9IHNsYXNoLnJlc29sdmUgY21kLnNsaWNlKDMpLnRyaW0oKVxuICAgICAgICAgICAgdHJ5IFxuICAgICAgICAgICAgICAgIGN3ZCA9IHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgICAgICAjIGtsb2cgJ2NoZGlyJyBkaXJcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmNoZGlyIGRpclxuICAgICAgICAgICAgICAgIHByZWZzLnNldCAnY3dkJyBkaXJcbiAgICAgICAgICAgICAgICBAdGVybS50YWIudXBkYXRlIHNsYXNoLnRpbGRlIGRpclxuICAgICAgICAgICAgICAgIEBsYXN0RGlyID0gY3dkIGlmIGN3ZCAhPSBkaXJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAga2Vycm9yIFwiI3tlcnJ9XCJcbiAgICAgICAgICAgICAgICBcbiAgICBvbkZhbGxiYWNrOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIgc2xhc2guam9pbiBwcm9jZXNzLmN3ZCgpLCBjbWRcbiAgICAgICAgICAgIEBvbkNvbW1hbmQgJ2NkICcgKyBjbWRcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IENoZGlyXG4iXX0=
//# sourceURL=../coffee/chdir.coffee