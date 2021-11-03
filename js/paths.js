// koffee 1.14.0

/*
00000000    0000000   000000000  000   000   0000000  
000   000  000   000     000     000   000  000       
00000000   000000000     000     000000000  0000000   
000        000   000     000     000   000       000  
000        000   000     000     000   000  0000000
 */
var Paths, _, os, ref, slash;

ref = require('kxk'), _ = ref._, os = ref.os, slash = ref.slash;

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
        ref1 = ['/usr/bin', '/opt/homebrew/bin', '/opt/homebrew/sbin', '/usr/local/bin', 'node_modules/.bin', 'bin', '.'];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aHMuanMiLCJzb3VyY2VSb290IjoiLi4vY29mZmVlIiwic291cmNlcyI6WyJwYXRocy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBbUIsT0FBQSxDQUFRLEtBQVIsQ0FBbkIsRUFBRSxTQUFGLEVBQUssV0FBTCxFQUFTOztBQUVIO0lBRUMsZUFBQyxLQUFEO1FBQUMsSUFBQyxDQUFBLFFBQUQ7UUFFQSxJQUFDLENBQUEsR0FBRCxHQUFPO1FBRVAsSUFBRyxFQUFFLENBQUMsUUFBSCxDQUFBLENBQUEsS0FBaUIsT0FBcEI7WUFDSSxJQUFDLENBQUEsR0FBRCxHQUFPLElBRFg7O0lBSkQ7O29CQWFILElBQUEsR0FBTSxTQUFBO0FBRUYsWUFBQTtRQUFBLEdBQUEsR0FBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFqQixDQUF1QixJQUFDLENBQUEsR0FBeEIsQ0FBNEIsQ0FBQyxHQUE3QixDQUFpQyxTQUFDLENBQUQ7bUJBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFYO1FBQVAsQ0FBakM7QUFFTjtBQUFBLGFBQUEsc0NBQUE7O1lBQ0ksR0FBRyxDQUFDLE9BQUosQ0FBWSxDQUFaO0FBREo7UUFHQSxJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksS0FBWixDQUFIO0FBQ0k7QUFBQSxpQkFBQSx3Q0FBQTs7Z0JBQ0ksSUFBRyxDQUFDLENBQUMsSUFBRixLQUFVLEtBQWI7b0JBQ0ksTUFBQSxHQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBQyxDQUFDLElBQWIsRUFBc0IsQ0FBQyxDQUFDLElBQUgsR0FBUSxHQUFSLEdBQVcsT0FBTyxDQUFDLFFBQW5CLEdBQTRCLEdBQTVCLEdBQStCLE9BQU8sQ0FBQyxJQUE1RDtvQkFDVCxJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksTUFBWixDQUFIO3dCQUNJLEdBQUcsQ0FBQyxJQUFKLENBQVMsTUFBVDtBQUNBLGlDQUZKOztvQkFHQSxNQUFBLEdBQVMsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFDLENBQUMsSUFBYixFQUFtQixLQUFuQjtvQkFDVCxJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksTUFBWixDQUFIO3dCQUNJLEdBQUcsQ0FBQyxJQUFKLENBQVMsTUFBVCxFQURKO3FCQU5KOztBQURKLGFBREo7O1FBV0EsR0FBQSxHQUFNLEdBQUcsQ0FBQyxHQUFKLENBQVEsU0FBQyxDQUFEO21CQUFPLEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBZDtRQUFQLENBQVI7UUFDTixHQUFBLEdBQU0sQ0FBQyxDQUFDLElBQUYsQ0FBTyxHQUFQO2VBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFaLEdBQW1CLEdBQUcsQ0FBQyxJQUFKLENBQVMsSUFBQyxDQUFBLEdBQVY7SUFwQmpCOztvQkFzQk4sSUFBQSxHQUFNLFNBQUMsTUFBRDtBQUVGLFlBQUE7QUFBQTtBQUFBO2FBQUEsc0NBQUE7O3lCQUNJLE1BQU0sQ0FBQyxZQUFQLENBQW9CLEdBQXBCO0FBREo7O0lBRkU7O29CQUtOLEdBQUEsR0FBSyxTQUFDLE1BQUQsRUFBUyxHQUFUO0FBRUQsZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE1BRFQ7dUJBQ3FCLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTjtBQURyQjtJQUZDOzs7Ozs7QUFLVCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbjAwMDAwMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiMjI1xuXG57IF8sIG9zLCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBQYXRoc1xuXG4gICAgQDogKEBzaGVsbCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBzZXAgPSAnOydcbiAgICAgICAgXG4gICAgICAgIGlmIG9zLnBsYXRmb3JtKCkgIT0gJ3dpbjMyJyBcbiAgICAgICAgICAgIEBzZXAgPSAnOicgICAgICAgIFxuICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIGluaXQ6IC0+XG4gICAgICAgIFxuICAgICAgICBwdGggPSBwcm9jZXNzLmVudi5QQVRILnNwbGl0KEBzZXApLm1hcCAocykgLT4gc2xhc2gucGF0aCBzXG5cbiAgICAgICAgZm9yIGEgaW4gWycvdXNyL2JpbicgJy9vcHQvaG9tZWJyZXcvYmluJyAnL29wdC9ob21lYnJldy9zYmluJyAnL3Vzci9sb2NhbC9iaW4nICdub2RlX21vZHVsZXMvLmJpbicgJ2JpbicgJy4nXVxuICAgICAgICAgICAgcHRoLnVuc2hpZnQgYVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciAnfi9zJ1xuICAgICAgICAgICAgZm9yIGYgaW4gc2xhc2gubGlzdCAnfi9zJ1xuICAgICAgICAgICAgICAgIGlmIGYudHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBleGVEaXIgPSBzbGFzaC5qb2luIGYuZmlsZSwgXCIje2YubmFtZX0tI3twcm9jZXNzLnBsYXRmb3JtfS0je3Byb2Nlc3MuYXJjaH1cIlxuICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBleGVEaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB0aC5wdXNoIGV4ZURpclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgYmluRGlyID0gc2xhc2guam9pbiBmLmZpbGUsICdiaW4nXG4gICAgICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyIGJpbkRpclxuICAgICAgICAgICAgICAgICAgICAgICAgcHRoLnB1c2ggYmluRGlyXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHB0aCA9IHB0aC5tYXAgKHMpIC0+IHNsYXNoLnVudGlsZGUgc1xuICAgICAgICBwdGggPSBfLnVuaXEgcHRoXG4gICAgICAgIHByb2Nlc3MuZW52LlBBVEggPSBwdGguam9pbiBAc2VwXG4gICAgICAgIFxuICAgIGxpc3Q6IChlZGl0b3IpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgcHRoIGluIHByb2Nlc3MuZW52LlBBVEguc3BsaXQgQHNlcFxuICAgICAgICAgICAgZWRpdG9yLmFwcGVuZE91dHB1dCBwdGhcbiAgICAgICAgXG4gICAgY21kOiAoZWRpdG9yLCBjbWQpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNtZFxuICAgICAgICAgICAgd2hlbiAnbGlzdCcgdGhlbiBAbGlzdCBlZGl0b3JcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGhzXG4iXX0=
//# sourceURL=../coffee/paths.coffee