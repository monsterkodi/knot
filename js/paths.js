// koffee 1.4.0

/*
00000000    0000000   000000000  000   000   0000000  
000   000  000   000     000     000   000  000       
00000000   000000000     000     000000000  0000000   
000        000   000     000     000   000       000  
000        000   000     000     000   000  0000000
 */
var Paths, _, os, ref, slash;

ref = require('kxk'), slash = ref.slash, os = ref.os, _ = ref._;

Paths = (function() {
    function Paths(shell) {
        this.shell = shell;
        this.sep = ';';
        if (os.platform() !== 'win32') {
            this.sep = ':';
        }
    }

    Paths.prototype.init = function() {
        var a, binDir, exeDir, f, i, j, len, len1, pth, ref1, ref2;
        pth = process.env.PATH.split(this.sep).map(function(s) {
            return slash.path(s);
        });
        ref1 = ['/usr/bin', '/usr/local/bin', 'node_modules/.bin', 'bin', '.'];
        for (i = 0, len = ref1.length; i < len; i++) {
            a = ref1[i];
            pth.unshift(a);
        }
        if (slash.isDir('~/s')) {
            ref2 = slash.list('~/s');
            for (j = 0, len1 = ref2.length; j < len1; j++) {
                f = ref2[j];
                if (f.type === 'dir') {
                    exeDir = slash.join(f.file, f.name + "-" + process.platform + "-" + process.arch);
                    if (slash.isDir(exeDir)) {
                        pth.push(exeDir);
                        continue;
                    }
                    binDir = slash.join(f.file, 'bin');
                    if (slash.isDir(binDir)) {
                        pth.push(binDir);
                    }
                }
            }
        }
        pth = pth.map(function(s) {
            return slash.unslash(s);
        });
        pth = _.uniq(pth);
        return process.env.PATH = pth.join(this.sep);
    };

    Paths.prototype.list = function(editor) {
        var i, len, pth, ref1, results;
        ref1 = process.env.PATH.split(this.sep);
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            pth = ref1[i];
            results.push(editor.appendOutput(slash.path(pth)));
        }
        return results;
    };

    Paths.prototype.cmd = function(editor, cmd) {
        switch (cmd) {
            case 'list':
                return this.list(editor);
        }
    };

    return Paths;

})();

module.exports = Paths;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aHMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUyxXQUFULEVBQWE7O0FBRVA7SUFFQyxlQUFDLEtBQUQ7UUFBQyxJQUFDLENBQUEsUUFBRDtRQUVBLElBQUMsQ0FBQSxHQUFELEdBQU87UUFFUCxJQUFHLEVBQUUsQ0FBQyxRQUFILENBQUEsQ0FBQSxLQUFpQixPQUFwQjtZQUNJLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFEWDs7SUFKRDs7b0JBYUgsSUFBQSxHQUFNLFNBQUE7QUFFRixZQUFBO1FBQUEsR0FBQSxHQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQWpCLENBQXVCLElBQUMsQ0FBQSxHQUF4QixDQUE0QixDQUFDLEdBQTdCLENBQWlDLFNBQUMsQ0FBRDttQkFBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQVg7UUFBUCxDQUFqQztBQUVOO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxHQUFHLENBQUMsT0FBSixDQUFZLENBQVo7QUFESjtRQUdBLElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxLQUFaLENBQUg7QUFDSTtBQUFBLGlCQUFBLHdDQUFBOztnQkFDSSxJQUFHLENBQUMsQ0FBQyxJQUFGLEtBQVUsS0FBYjtvQkFDSSxNQUFBLEdBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLENBQUMsSUFBYixFQUFzQixDQUFDLENBQUMsSUFBSCxHQUFRLEdBQVIsR0FBVyxPQUFPLENBQUMsUUFBbkIsR0FBNEIsR0FBNUIsR0FBK0IsT0FBTyxDQUFDLElBQTVEO29CQUNULElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxNQUFaLENBQUg7d0JBQ0ksR0FBRyxDQUFDLElBQUosQ0FBUyxNQUFUO0FBQ0EsaUNBRko7O29CQUdBLE1BQUEsR0FBUyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsQ0FBQyxJQUFiLEVBQW1CLEtBQW5CO29CQUNULElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxNQUFaLENBQUg7d0JBQ0ksR0FBRyxDQUFDLElBQUosQ0FBUyxNQUFULEVBREo7cUJBTko7O0FBREosYUFESjs7UUFXQSxHQUFBLEdBQU0sR0FBRyxDQUFDLEdBQUosQ0FBUSxTQUFDLENBQUQ7bUJBQU8sS0FBSyxDQUFDLE9BQU4sQ0FBYyxDQUFkO1FBQVAsQ0FBUjtRQUNOLEdBQUEsR0FBTSxDQUFDLENBQUMsSUFBRixDQUFPLEdBQVA7ZUFDTixPQUFPLENBQUMsR0FBRyxDQUFDLElBQVosR0FBbUIsR0FBRyxDQUFDLElBQUosQ0FBUyxJQUFDLENBQUEsR0FBVjtJQXBCakI7O29CQXNCTixJQUFBLEdBQU0sU0FBQyxNQUFEO0FBRUYsWUFBQTtBQUFBO0FBQUE7YUFBQSxzQ0FBQTs7eUJBQ0ksTUFBTSxDQUFDLFlBQVAsQ0FBb0IsS0FBSyxDQUFDLElBQU4sQ0FBVyxHQUFYLENBQXBCO0FBREo7O0lBRkU7O29CQUtOLEdBQUEsR0FBSyxTQUFDLE1BQUQsRUFBUyxHQUFUO0FBRUQsZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE1BRFQ7dUJBQ3FCLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTjtBQURyQjtJQUZDOzs7Ozs7QUFLVCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbjAwMDAwMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiMjI1xuXG57IHNsYXNoLCBvcywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBQYXRoc1xuXG4gICAgQDogKEBzaGVsbCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZXAgPSAnOydcbiAgICAgICAgXG4gICAgICAgIGlmIG9zLnBsYXRmb3JtKCkgIT0gJ3dpbjMyJyBcbiAgICAgICAgICAgIEBzZXAgPSAnOicgICAgICAgIFxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGluaXQ6IC0+XG4gICAgICAgIFxuICAgICAgICBwdGggPSBwcm9jZXNzLmVudi5QQVRILnNwbGl0KEBzZXApLm1hcCAocykgLT4gc2xhc2gucGF0aCBzXG5cbiAgICAgICAgZm9yIGEgaW4gWycvdXNyL2JpbicgJy91c3IvbG9jYWwvYmluJyAnbm9kZV9tb2R1bGVzLy5iaW4nICdiaW4nICcuJ11cbiAgICAgICAgICAgIHB0aC51bnNoaWZ0IGFcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgc2xhc2guaXNEaXIgJ34vcydcbiAgICAgICAgICAgIGZvciBmIGluIHNsYXNoLmxpc3QgJ34vcydcbiAgICAgICAgICAgICAgICBpZiBmLnR5cGUgPT0gJ2RpcidcbiAgICAgICAgICAgICAgICAgICAgZXhlRGlyID0gc2xhc2guam9pbiBmLmZpbGUsIFwiI3tmLm5hbWV9LSN7cHJvY2Vzcy5wbGF0Zm9ybX0tI3twcm9jZXNzLmFyY2h9XCJcbiAgICAgICAgICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgZXhlRGlyXG4gICAgICAgICAgICAgICAgICAgICAgICBwdGgucHVzaCBleGVEaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgIGJpbkRpciA9IHNsYXNoLmpvaW4gZi5maWxlLCAnYmluJ1xuICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBiaW5EaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB0aC5wdXNoIGJpbkRpclxuICAgICAgICAgICAgICAgIFxuICAgICAgICBwdGggPSBwdGgubWFwIChzKSAtPiBzbGFzaC51bnNsYXNoIHNcbiAgICAgICAgcHRoID0gXy51bmlxIHB0aFxuICAgICAgICBwcm9jZXNzLmVudi5QQVRIID0gcHRoLmpvaW4gQHNlcFxuICAgICAgICBcbiAgICBsaXN0OiAoZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIHB0aCBpbiBwcm9jZXNzLmVudi5QQVRILnNwbGl0IEBzZXBcbiAgICAgICAgICAgIGVkaXRvci5hcHBlbmRPdXRwdXQgc2xhc2gucGF0aCBwdGhcbiAgICAgICAgXG4gICAgY21kOiAoZWRpdG9yLCBjbWQpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNtZFxuICAgICAgICAgICAgd2hlbiAnbGlzdCcgdGhlbiBAbGlzdCBlZGl0b3JcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGhzXG4iXX0=
//# sourceURL=../coffee/paths.coffee