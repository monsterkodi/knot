// koffee 1.4.0

/*
00000000    0000000   000000000  000   000   0000000  
000   000  000   000     000     000   000  000       
00000000   000000000     000     000000000  0000000   
000        000   000     000     000   000       000  
000        000   000     000     000   000  0000000
 */
var Paths, klog, os, ref, slash,
    indexOf = [].indexOf;

ref = require('kxk'), slash = ref.slash, os = ref.os, klog = ref.klog;

Paths = (function() {
    function Paths(shell) {
        this.shell = shell;
        this.sep = ';';
        if (os.platform() !== 'win32') {
            this.sep = ':';
        }
    }

    Paths.prototype.init = function() {
        var a, binDir, exeDir, f, i, j, k, len, len1, len2, pth, ref1, ref2, ref3, results;
        pth = process.env.PATH.split(this.sep).map(function(s) {
            return slash.path(s);
        });
        ref1 = ['/usr/bin', '/usr/local/bin', 'node_modules/.bin', 'bin', '.'];
        for (i = 0, len = ref1.length; i < len; i++) {
            a = ref1[i];
            if (indexOf.call(pth, a) < 0) {
                pth.unshift(a);
            }
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
                    binDir = slash.join(f.file, "bin");
                    if (slash.isDir(binDir)) {
                        pth.push(binDir);
                    }
                }
            }
        }
        process.env.PATH = pth.map(function(s) {
            return slash.unslash(s);
        }).join(this.sep);
        ref3 = process.env.PATH.split(this.sep);
        results = [];
        for (k = 0, len2 = ref3.length; k < len2; k++) {
            pth = ref3[k];
            results.push(klog(slash.path(pth)));
        }
        return results;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aHMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDJCQUFBO0lBQUE7O0FBUUEsTUFBc0IsT0FBQSxDQUFRLEtBQVIsQ0FBdEIsRUFBRSxpQkFBRixFQUFTLFdBQVQsRUFBYTs7QUFFUDtJQUVDLGVBQUMsS0FBRDtRQUFDLElBQUMsQ0FBQSxRQUFEO1FBRUEsSUFBQyxDQUFBLEdBQUQsR0FBTztRQUVQLElBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQSxDQUFBLEtBQWlCLE9BQXBCO1lBQ0ksSUFBQyxDQUFBLEdBQUQsR0FBTyxJQURYOztJQUpEOztvQkFhSCxJQUFBLEdBQU0sU0FBQTtBQUlGLFlBQUE7UUFBQSxHQUFBLEdBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBakIsQ0FBdUIsSUFBQyxDQUFBLEdBQXhCLENBQTRCLENBQUMsR0FBN0IsQ0FBaUMsU0FBQyxDQUFEO21CQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBWDtRQUFQLENBQWpDO0FBRU47QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQUcsYUFBUyxHQUFULEVBQUEsQ0FBQSxLQUFIO2dCQUVJLEdBQUcsQ0FBQyxPQUFKLENBQVksQ0FBWixFQUZKOztBQURKO1FBS0EsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLEtBQVosQ0FBSDtBQUNJO0FBQUEsaUJBQUEsd0NBQUE7O2dCQUNJLElBQUcsQ0FBQyxDQUFDLElBQUYsS0FBVSxLQUFiO29CQUNJLE1BQUEsR0FBUyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsQ0FBQyxJQUFiLEVBQXNCLENBQUMsQ0FBQyxJQUFILEdBQVEsR0FBUixHQUFXLE9BQU8sQ0FBQyxRQUFuQixHQUE0QixHQUE1QixHQUErQixPQUFPLENBQUMsSUFBNUQ7b0JBQ1QsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLE1BQVosQ0FBSDt3QkFFSSxHQUFHLENBQUMsSUFBSixDQUFTLE1BQVQ7QUFDQSxpQ0FISjs7b0JBSUEsTUFBQSxHQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBQyxDQUFDLElBQWIsRUFBbUIsS0FBbkI7b0JBQ1QsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLE1BQVosQ0FBSDt3QkFFSSxHQUFHLENBQUMsSUFBSixDQUFTLE1BQVQsRUFGSjtxQkFQSjs7QUFESixhQURKOztRQWFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBWixHQUFtQixHQUFHLENBQUMsR0FBSixDQUFRLFNBQUMsQ0FBRDttQkFBTyxLQUFLLENBQUMsT0FBTixDQUFjLENBQWQ7UUFBUCxDQUFSLENBQStCLENBQUMsSUFBaEMsQ0FBcUMsSUFBQyxDQUFBLEdBQXRDO0FBRW5CO0FBQUE7YUFBQSx3Q0FBQTs7eUJBQ0ksSUFBQSxDQUFLLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWCxDQUFMO0FBREo7O0lBMUJFOztvQkE2Qk4sSUFBQSxHQUFNLFNBQUMsTUFBRDtBQUVGLFlBQUE7QUFBQTtBQUFBO2FBQUEsc0NBQUE7O3lCQUNJLE1BQU0sQ0FBQyxZQUFQLENBQW9CLEtBQUssQ0FBQyxJQUFOLENBQVcsR0FBWCxDQUFwQjtBQURKOztJQUZFOztvQkFLTixHQUFBLEdBQUssU0FBQyxNQUFELEVBQVMsR0FBVDtBQUVELGdCQUFPLEdBQVA7QUFBQSxpQkFDUyxNQURUO3VCQUNxQixJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU47QUFEckI7SUFGQzs7Ozs7O0FBS1QsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4wMDAwMDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbjAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4jIyNcblxueyBzbGFzaCwgb3MsIGtsb2cgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgUGF0aHNcblxuICAgIEA6IChAc2hlbGwpIC0+XG4gICAgICAgIFxuICAgICAgICBAc2VwID0gJzsnXG4gICAgICAgIFxuICAgICAgICBpZiBvcy5wbGF0Zm9ybSgpICE9ICd3aW4zMicgXG4gICAgICAgICAgICBAc2VwID0gJzonICAgICAgICBcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBpbml0OiAtPlxuICAgICAgICBcbiAgICAgICAgIyBrbG9nICdTSEVMTCcgcHJvY2Vzcy5lbnYuU0hFTExcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHB0aCA9IHByb2Nlc3MuZW52LlBBVEguc3BsaXQoQHNlcCkubWFwIChzKSAtPiBzbGFzaC5wYXRoIHNcblxuICAgICAgICBmb3IgYSBpbiBbJy91c3IvYmluJyAnL3Vzci9sb2NhbC9iaW4nICdub2RlX21vZHVsZXMvLmJpbicgJ2JpbicgJy4nXVxuICAgICAgICAgICAgaWYgYSBub3QgaW4gcHRoXG4gICAgICAgICAgICAgICAgIyBrbG9nIFwiYWRkIHRvIFBBVEggI3thfVwiXG4gICAgICAgICAgICAgICAgcHRoLnVuc2hpZnQgYVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciAnfi9zJ1xuICAgICAgICAgICAgZm9yIGYgaW4gc2xhc2gubGlzdCAnfi9zJ1xuICAgICAgICAgICAgICAgIGlmIGYudHlwZSA9PSAnZGlyJ1xuICAgICAgICAgICAgICAgICAgICBleGVEaXIgPSBzbGFzaC5qb2luIGYuZmlsZSwgXCIje2YubmFtZX0tI3twcm9jZXNzLnBsYXRmb3JtfS0je3Byb2Nlc3MuYXJjaH1cIlxuICAgICAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc0RpciBleGVEaXJcbiAgICAgICAgICAgICAgICAgICAgICAgICMga2xvZyBcImFkZCBleGUgZGlyXCIgZXhlRGlyXG4gICAgICAgICAgICAgICAgICAgICAgICBwdGgucHVzaCBleGVEaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgIGJpbkRpciA9IHNsYXNoLmpvaW4gZi5maWxlLCBcImJpblwiXG4gICAgICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyIGJpbkRpclxuICAgICAgICAgICAgICAgICAgICAgICAgIyBrbG9nIFwiYWRkIGJpbiBkaXJcIiBiaW5EaXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB0aC5wdXNoIGJpbkRpclxuICAgICAgICAgICAgICAgIFxuICAgICAgICBwcm9jZXNzLmVudi5QQVRIID0gcHRoLm1hcCgocykgLT4gc2xhc2gudW5zbGFzaCBzKS5qb2luIEBzZXBcbiAgICAgICAgXG4gICAgICAgIGZvciBwdGggaW4gcHJvY2Vzcy5lbnYuUEFUSC5zcGxpdCBAc2VwXG4gICAgICAgICAgICBrbG9nIHNsYXNoLnBhdGggcHRoXG5cbiAgICBsaXN0OiAoZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIHB0aCBpbiBwcm9jZXNzLmVudi5QQVRILnNwbGl0IEBzZXBcbiAgICAgICAgICAgIGVkaXRvci5hcHBlbmRPdXRwdXQgc2xhc2gucGF0aCBwdGhcbiAgICAgICAgXG4gICAgY21kOiAoZWRpdG9yLCBjbWQpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNtZFxuICAgICAgICAgICAgd2hlbiAnbGlzdCcgdGhlbiBAbGlzdCBlZGl0b3JcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGhzXG4iXX0=
//# sourceURL=../coffee/paths.coffee