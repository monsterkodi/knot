// koffee 1.6.0

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
            return slash.untilde(s);
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
            results.push(editor.appendOutput(pth));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aHMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBOztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUyxXQUFULEVBQWE7O0FBRVA7SUFFQyxlQUFDLEtBQUQ7UUFBQyxJQUFDLENBQUEsUUFBRDtRQUVBLElBQUMsQ0FBQSxHQUFELEdBQU87UUFFUCxJQUFHLEVBQUUsQ0FBQyxRQUFILENBQUEsQ0FBQSxLQUFpQixPQUFwQjtZQUNJLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFEWDs7SUFKRDs7b0JBYUgsSUFBQSxHQUFNLFNBQUE7QUFFRixZQUFBO1FBQUEsR0FBQSxHQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQWpCLENBQXVCLElBQUMsQ0FBQSxHQUF4QixDQUE0QixDQUFDLEdBQTdCLENBQWlDLFNBQUMsQ0FBRDttQkFBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQVg7UUFBUCxDQUFqQztBQUVOO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxHQUFHLENBQUMsT0FBSixDQUFZLENBQVo7QUFESjtRQUdBLElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxLQUFaLENBQUg7QUFDSTtBQUFBLGlCQUFBLHdDQUFBOztnQkFDSSxJQUFHLENBQUMsQ0FBQyxJQUFGLEtBQVUsS0FBYjtvQkFDSSxNQUFBLEdBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLENBQUMsSUFBYixFQUFzQixDQUFDLENBQUMsSUFBSCxHQUFRLEdBQVIsR0FBVyxPQUFPLENBQUMsUUFBbkIsR0FBNEIsR0FBNUIsR0FBK0IsT0FBTyxDQUFDLElBQTVEO29CQUNULElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxNQUFaLENBQUg7d0JBQ0ksR0FBRyxDQUFDLElBQUosQ0FBUyxNQUFUO0FBQ0EsaUNBRko7O29CQUdBLE1BQUEsR0FBUyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsQ0FBQyxJQUFiLEVBQW1CLEtBQW5CO29CQUNULElBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxNQUFaLENBQUg7d0JBQ0ksR0FBRyxDQUFDLElBQUosQ0FBUyxNQUFULEVBREo7cUJBTko7O0FBREosYUFESjs7UUFXQSxHQUFBLEdBQU0sR0FBRyxDQUFDLEdBQUosQ0FBUSxTQUFDLENBQUQ7bUJBQU8sS0FBSyxDQUFDLE9BQU4sQ0FBYyxDQUFkO1FBQVAsQ0FBUjtRQUNOLEdBQUEsR0FBTSxDQUFDLENBQUMsSUFBRixDQUFPLEdBQVA7ZUFDTixPQUFPLENBQUMsR0FBRyxDQUFDLElBQVosR0FBbUIsR0FBRyxDQUFDLElBQUosQ0FBUyxJQUFDLENBQUEsR0FBVjtJQXBCakI7O29CQXNCTixJQUFBLEdBQU0sU0FBQyxNQUFEO0FBRUYsWUFBQTtBQUFBO0FBQUE7YUFBQSxzQ0FBQTs7eUJBQ0ksTUFBTSxDQUFDLFlBQVAsQ0FBb0IsR0FBcEI7QUFESjs7SUFGRTs7b0JBS04sR0FBQSxHQUFLLFNBQUMsTUFBRCxFQUFTLEdBQVQ7QUFFRCxnQkFBTyxHQUFQO0FBQUEsaUJBQ1MsTUFEVDt1QkFDcUIsSUFBQyxDQUFBLElBQUQsQ0FBTSxNQUFOO0FBRHJCO0lBRkM7Ozs7OztBQUtULE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuMDAwMDAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgMDAwICBcbjAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuIyMjXG5cbnsgc2xhc2gsIG9zLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFBhdGhzXG5cbiAgICBAOiAoQHNoZWxsKSAtPlxuICAgICAgICBcbiAgICAgICAgQHNlcCA9ICc7J1xuICAgICAgICBcbiAgICAgICAgaWYgb3MucGxhdGZvcm0oKSAhPSAnd2luMzInIFxuICAgICAgICAgICAgQHNlcCA9ICc6JyAgICAgICAgXG4gICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgaW5pdDogLT5cbiAgICAgICAgXG4gICAgICAgIHB0aCA9IHByb2Nlc3MuZW52LlBBVEguc3BsaXQoQHNlcCkubWFwIChzKSAtPiBzbGFzaC5wYXRoIHNcblxuICAgICAgICBmb3IgYSBpbiBbJy91c3IvYmluJyAnL3Vzci9sb2NhbC9iaW4nICdub2RlX21vZHVsZXMvLmJpbicgJ2JpbicgJy4nXVxuICAgICAgICAgICAgcHRoLnVuc2hpZnQgYVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciAnfi9zJ1xuICAgICAgICAgICAgZm9yIGYgaW4gc2xhc2gubGlzdCAnfi9zJ1xuICAgICAgICAgICAgICAgIGlmIGYudHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBleGVEaXIgPSBzbGFzaC5qb2luIGYuZmlsZSwgXCIje2YubmFtZX0tI3twcm9jZXNzLnBsYXRmb3JtfS0je3Byb2Nlc3MuYXJjaH1cIlxuICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBleGVEaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB0aC5wdXNoIGV4ZURpclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgYmluRGlyID0gc2xhc2guam9pbiBmLmZpbGUsICdiaW4nXG4gICAgICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyIGJpbkRpclxuICAgICAgICAgICAgICAgICAgICAgICAgcHRoLnB1c2ggYmluRGlyXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHB0aCA9IHB0aC5tYXAgKHMpIC0+IHNsYXNoLnVudGlsZGUgc1xuICAgICAgICBwdGggPSBfLnVuaXEgcHRoXG4gICAgICAgIHByb2Nlc3MuZW52LlBBVEggPSBwdGguam9pbiBAc2VwXG4gICAgICAgIFxuICAgIGxpc3Q6IChlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgcHRoIGluIHByb2Nlc3MuZW52LlBBVEguc3BsaXQgQHNlcFxuICAgICAgICAgICAgZWRpdG9yLmFwcGVuZE91dHB1dCBwdGhcbiAgICAgICAgXG4gICAgY21kOiAoZWRpdG9yLCBjbWQpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNtZFxuICAgICAgICAgICAgd2hlbiAnbGlzdCcgdGhlbiBAbGlzdCBlZGl0b3JcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGhzXG4iXX0=
//# sourceURL=../coffee/paths.coffee