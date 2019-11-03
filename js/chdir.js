// koffee 1.4.0

/*
 0000000  000   000  0000000    000  00000000   
000       000   000  000   000  000  000   000  
000       000000000  000   000  000  0000000    
000       000   000  000   000  000  000   000  
 0000000  000   000  0000000    000  000   000
 */
var Chdir, Cmmd, kerror, klog, post, prefs, ref, slash, strip,
    indexOf = [].indexOf,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), slash = ref.slash, post = ref.post, prefs = ref.prefs, kerror = ref.kerror, klog = ref.klog;

Cmmd = require('./cmmd');

strip = function(s, cs) {
    var ref1, ref2;
    while (ref1 = s[0], indexOf.call(cs, ref1) >= 0) {
        s = s.slice(1);
    }
    while (ref2 = s.slice(-1)[0], indexOf.call(cs, ref2) >= 0) {
        s = s.slice(0, +(s.length - 2) + 1 || 9e9);
    }
    return s;
};

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
        dir = slash.join(cwd, strip(cmd.slice(3), ' "'));
        klog("dir |" + dir + "|");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hkaXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHlEQUFBO0lBQUE7Ozs7QUFRQSxNQUF1QyxPQUFBLENBQVEsS0FBUixDQUF2QyxFQUFFLGlCQUFGLEVBQVMsZUFBVCxFQUFlLGlCQUFmLEVBQXNCLG1CQUF0QixFQUE4Qjs7QUFFOUIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztBQUVQLEtBQUEsR0FBUSxTQUFDLENBQUQsRUFBSSxFQUFKO0FBRUosUUFBQTtBQUFXLGtCQUFNLENBQUUsQ0FBQSxDQUFBLENBQUYsRUFBQSxhQUFRLEVBQVIsRUFBQSxJQUFBLE1BQU47UUFBWCxDQUFBLEdBQUksQ0FBRTtJQUFLO0FBQ1Usa0JBQU0sQ0FBRSxVQUFFLENBQUEsQ0FBQSxDQUFKLEVBQUEsYUFBUyxFQUFULEVBQUEsSUFBQSxNQUFOO1FBQXJCLENBQUEsR0FBSSxDQUFFO0lBQWU7V0FDckI7QUFKSTs7QUFNRjs7O0lBRUMsZUFBQTtRQUVDLHdDQUFBLFNBQUE7UUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXO0lBSFo7O29CQUtILFNBQUEsR0FBVyxTQUFDLEdBQUQ7QUFFUCxZQUFBO1FBQUEsSUFBRyxHQUFBLEtBQVEsSUFBWDtZQUNJLEdBQUEsR0FBTSxPQURWO1NBQUEsTUFFSyxJQUFHLEdBQUEsS0FBUSxNQUFYO1lBQ0QsR0FBQSxHQUFNLFFBREw7U0FBQSxNQUVBLElBQUcsR0FBQSxLQUFRLEtBQVg7WUFDRCxHQUFBLEdBQU0sT0FETDtTQUFBLE1BRUEsSUFBRyxHQUFBLEtBQVEsTUFBUixJQUFBLEdBQUEsS0FBZSxLQUFmLElBQUEsR0FBQSxLQUFxQixHQUF4QjtZQUNELEdBQUEsR0FBTSxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBRFo7O1FBR0wsSUFBRyxDQUFJLEdBQUcsQ0FBQyxVQUFKLENBQWUsS0FBZixDQUFQO1lBQ0ksR0FBQSxHQUFNLEtBQUEsR0FBUSxJQURsQjs7UUFHQSxHQUFBLEdBQU0sT0FBTyxDQUFDLEdBQVIsQ0FBQTtRQUNOLEdBQUEsR0FBTSxLQUFLLENBQUMsSUFBTixDQUFXLEdBQVgsRUFBZ0IsS0FBQSxDQUFNLEdBQUcsQ0FBQyxLQUFKLENBQVUsQ0FBVixDQUFOLEVBQW9CLElBQXBCLENBQWhCO1FBQ04sSUFBQSxDQUFLLE9BQUEsR0FBUSxHQUFSLEdBQVksR0FBakI7UUFDQSxJQUFnQixDQUFJLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWixDQUFwQjtBQUFBLG1CQUFPLE1BQVA7O0FBRUE7WUFFSSxPQUFPLENBQUMsS0FBUixDQUFjLEdBQWQ7WUFDQSxLQUFLLENBQUMsR0FBTixDQUFVLEtBQVYsRUFBZ0IsR0FBaEI7WUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFWLENBQWlCLEtBQUssQ0FBQyxLQUFOLENBQVksR0FBWixDQUFqQjtZQUNBLElBQWtCLEdBQUEsS0FBTyxHQUF6QjtnQkFBQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQVg7O1lBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBWixHQUFvQjtBQUNwQixtQkFBTyxLQVBYO1NBQUEsYUFBQTtZQVFNO21CQUNGLE1BQUEsQ0FBTyxFQUFBLEdBQUcsR0FBVixFQVRKOztJQW5CTzs7b0JBOEJYLFVBQUEsR0FBWSxTQUFDLEdBQUQ7UUFFUixJQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksS0FBSyxDQUFDLElBQU4sQ0FBVyxPQUFPLENBQUMsR0FBUixDQUFBLENBQVgsRUFBMEIsR0FBMUIsQ0FBWixDQUFIO21CQUNJLElBQUMsQ0FBQSxTQUFELENBQVcsS0FBQSxHQUFRLEdBQW5CLEVBREo7O0lBRlE7Ozs7R0FyQ0k7O0FBMENwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IHNsYXNoLCBwb3N0LCBwcmVmcywga2Vycm9yLCBrbG9nIH0gPSByZXF1aXJlICdreGsnXG5cbkNtbWQgPSByZXF1aXJlICcuL2NtbWQnXG5cbnN0cmlwID0gKHMsIGNzKSAtPlxuICAgIFxuICAgIHMgPSBzWzEuLl0gd2hpbGUgc1swXSBpbiBjc1xuICAgIHMgPSBzWzAuLnMubGVuZ3RoLTJdIHdoaWxlIHNbLTFdIGluIGNzXG4gICAgc1xuXG5jbGFzcyBDaGRpciBleHRlbmRzIENtbWRcbiAgICBcbiAgICBAOiAtPiBcbiAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgIEBsYXN0RGlyID0gJ34nXG5cbiAgICBvbkNvbW1hbmQ6IChjbWQpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGNtZCBpbiBbJ2NkJ11cbiAgICAgICAgICAgIGNtZCA9ICdjZCB+J1xuICAgICAgICBlbHNlIGlmIGNtZCBpbiBbJ2NkLi4nXVxuICAgICAgICAgICAgY21kID0gJ2NkIC4uJ1xuICAgICAgICBlbHNlIGlmIGNtZCBpbiBbJ2NkLiddXG4gICAgICAgICAgICBjbWQgPSAnY2QgLidcbiAgICAgICAgZWxzZSBpZiBjbWQgaW4gWydjZCAtJyAnY2QtJyAnLSddXG4gICAgICAgICAgICBjbWQgPSBcImNkICN7QGxhc3REaXJ9XCJcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgY21kLnN0YXJ0c1dpdGggJ2NkICdcbiAgICAgICAgICAgIGNtZCA9ICdjZCAnICsgY21kXG5cbiAgICAgICAgY3dkID0gcHJvY2Vzcy5jd2QoKVxuICAgICAgICBkaXIgPSBzbGFzaC5qb2luIGN3ZCwgc3RyaXAgY21kLnNsaWNlKDMpLCAnIFwiJ1xuICAgICAgICBrbG9nIFwiZGlyIHwje2Rpcn18XCJcbiAgICAgICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBzbGFzaC5pc0RpciBkaXJcbiAgICAgICAgXG4gICAgICAgIHRyeSBcbiAgICAgICAgICAgICMga2xvZyAnY2hkaXInIGRpclxuICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBkaXJcbiAgICAgICAgICAgIHByZWZzLnNldCAnY3dkJyBkaXJcbiAgICAgICAgICAgIEB0ZXJtLnRhYi51cGRhdGUgc2xhc2gudGlsZGUgZGlyXG4gICAgICAgICAgICBAbGFzdERpciA9IGN3ZCBpZiBjd2QgIT0gZGlyXG4gICAgICAgICAgICBAc2hlbGwubGFzdC5jaGRpciA9IHRydWUgIyBwcmV2ZW50cyBicmFpbiBoYW5kbGluZ1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBrZXJyb3IgXCIje2Vycn1cIlxuICAgICAgICAgICAgICAgIFxuICAgIG9uRmFsbGJhY2s6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBzbGFzaC5pc0RpciBzbGFzaC5qb2luIHByb2Nlc3MuY3dkKCksIGNtZFxuICAgICAgICAgICAgQG9uQ29tbWFuZCAnY2QgJyArIGNtZFxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQ2hkaXJcbiJdfQ==
//# sourceURL=../coffee/chdir.coffee