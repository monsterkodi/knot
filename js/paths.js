// koffee 1.12.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aHMuanMiLCJzb3VyY2VSb290IjoiLi4vY29mZmVlIiwic291cmNlcyI6WyJwYXRocy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBbUIsT0FBQSxDQUFRLEtBQVIsQ0FBbkIsRUFBRSxpQkFBRixFQUFTLFdBQVQsRUFBYTs7QUFFUDtJQUVDLGVBQUMsS0FBRDtRQUFDLElBQUMsQ0FBQSxRQUFEO1FBRUEsSUFBQyxDQUFBLEdBQUQsR0FBTztRQUVQLElBQUcsRUFBRSxDQUFDLFFBQUgsQ0FBQSxDQUFBLEtBQWlCLE9BQXBCO1lBQ0ksSUFBQyxDQUFBLEdBQUQsR0FBTyxJQURYOztJQUpEOztvQkFhSCxJQUFBLEdBQU0sU0FBQTtBQUVGLFlBQUE7UUFBQSxHQUFBLEdBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBakIsQ0FBdUIsSUFBQyxDQUFBLEdBQXhCLENBQTRCLENBQUMsR0FBN0IsQ0FBaUMsU0FBQyxDQUFEO21CQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBWDtRQUFQLENBQWpDO0FBRU47QUFBQSxhQUFBLHNDQUFBOztZQUNJLEdBQUcsQ0FBQyxPQUFKLENBQVksQ0FBWjtBQURKO1FBR0EsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLEtBQVosQ0FBSDtBQUNJO0FBQUEsaUJBQUEsd0NBQUE7O2dCQUNJLElBQUcsQ0FBQyxDQUFDLElBQUYsS0FBVSxLQUFiO29CQUNJLE1BQUEsR0FBUyxLQUFLLENBQUMsSUFBTixDQUFXLENBQUMsQ0FBQyxJQUFiLEVBQXNCLENBQUMsQ0FBQyxJQUFILEdBQVEsR0FBUixHQUFXLE9BQU8sQ0FBQyxRQUFuQixHQUE0QixHQUE1QixHQUErQixPQUFPLENBQUMsSUFBNUQ7b0JBQ1QsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLE1BQVosQ0FBSDt3QkFDSSxHQUFHLENBQUMsSUFBSixDQUFTLE1BQVQ7QUFDQSxpQ0FGSjs7b0JBR0EsTUFBQSxHQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsQ0FBQyxDQUFDLElBQWIsRUFBbUIsS0FBbkI7b0JBQ1QsSUFBRyxLQUFLLENBQUMsS0FBTixDQUFZLE1BQVosQ0FBSDt3QkFDSSxHQUFHLENBQUMsSUFBSixDQUFTLE1BQVQsRUFESjtxQkFOSjs7QUFESixhQURKOztRQVdBLEdBQUEsR0FBTSxHQUFHLENBQUMsR0FBSixDQUFRLFNBQUMsQ0FBRDttQkFBTyxLQUFLLENBQUMsT0FBTixDQUFjLENBQWQ7UUFBUCxDQUFSO1FBQ04sR0FBQSxHQUFNLENBQUMsQ0FBQyxJQUFGLENBQU8sR0FBUDtlQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBWixHQUFtQixHQUFHLENBQUMsSUFBSixDQUFTLElBQUMsQ0FBQSxHQUFWO0lBcEJqQjs7b0JBc0JOLElBQUEsR0FBTSxTQUFDLE1BQUQ7QUFFRixZQUFBO0FBQUE7QUFBQTthQUFBLHNDQUFBOzt5QkFDSSxNQUFNLENBQUMsWUFBUCxDQUFvQixHQUFwQjtBQURKOztJQUZFOztvQkFLTixHQUFBLEdBQUssU0FBQyxNQUFELEVBQVMsR0FBVDtBQUVELGdCQUFPLEdBQVA7QUFBQSxpQkFDUyxNQURUO3VCQUNxQixJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU47QUFEckI7SUFGQzs7Ozs7O0FBS1QsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4wMDAwMDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbjAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4jIyNcblxueyBzbGFzaCwgb3MsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgUGF0aHNcblxuICAgIEA6IChAc2hlbGwpIC0+XG4gICAgICAgIFxuICAgICAgICBAc2VwID0gJzsnXG4gICAgICAgIFxuICAgICAgICBpZiBvcy5wbGF0Zm9ybSgpICE9ICd3aW4zMicgXG4gICAgICAgICAgICBAc2VwID0gJzonICAgICAgICBcbiAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBpbml0OiAtPlxuICAgICAgICBcbiAgICAgICAgcHRoID0gcHJvY2Vzcy5lbnYuUEFUSC5zcGxpdChAc2VwKS5tYXAgKHMpIC0+IHNsYXNoLnBhdGggc1xuXG4gICAgICAgIGZvciBhIGluIFsnL3Vzci9iaW4nICcvdXNyL2xvY2FsL2JpbicgJ25vZGVfbW9kdWxlcy8uYmluJyAnYmluJyAnLiddXG4gICAgICAgICAgICBwdGgudW5zaGlmdCBhXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIHNsYXNoLmlzRGlyICd+L3MnXG4gICAgICAgICAgICBmb3IgZiBpbiBzbGFzaC5saXN0ICd+L3MnXG4gICAgICAgICAgICAgICAgaWYgZi50eXBlID09ICdkaXInXG4gICAgICAgICAgICAgICAgICAgIGV4ZURpciA9IHNsYXNoLmpvaW4gZi5maWxlLCBcIiN7Zi5uYW1lfS0je3Byb2Nlc3MucGxhdGZvcm19LSN7cHJvY2Vzcy5hcmNofVwiXG4gICAgICAgICAgICAgICAgICAgIGlmIHNsYXNoLmlzRGlyIGV4ZURpclxuICAgICAgICAgICAgICAgICAgICAgICAgcHRoLnB1c2ggZXhlRGlyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgICAgICBiaW5EaXIgPSBzbGFzaC5qb2luIGYuZmlsZSwgJ2JpbidcbiAgICAgICAgICAgICAgICAgICAgaWYgc2xhc2guaXNEaXIgYmluRGlyXG4gICAgICAgICAgICAgICAgICAgICAgICBwdGgucHVzaCBiaW5EaXJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcHRoID0gcHRoLm1hcCAocykgLT4gc2xhc2gudW50aWxkZSBzXG4gICAgICAgIHB0aCA9IF8udW5pcSBwdGhcbiAgICAgICAgcHJvY2Vzcy5lbnYuUEFUSCA9IHB0aC5qb2luIEBzZXBcbiAgICAgICAgXG4gICAgbGlzdDogKGVkaXRvcikgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBwdGggaW4gcHJvY2Vzcy5lbnYuUEFUSC5zcGxpdCBAc2VwXG4gICAgICAgICAgICBlZGl0b3IuYXBwZW5kT3V0cHV0IHB0aFxuICAgICAgICBcbiAgICBjbWQ6IChlZGl0b3IsIGNtZCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggY21kXG4gICAgICAgICAgICB3aGVuICdsaXN0JyB0aGVuIEBsaXN0IGVkaXRvclxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gUGF0aHNcbiJdfQ==
//# sourceURL=../coffee/paths.coffee