// koffee 1.12.0

/*
0000000    00000000    0000000   000  000   000
000   000  000   000  000   000  000  0000  000
0000000    0000000    000000000  000  000 0 000
000   000  000   000  000   000  000  000  0000
0000000    000   000  000   000  000  000   000
 */
var Brain, kstr, post, prefs, ref, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, prefs = ref.prefs, valid = ref.valid, kstr = ref.kstr;

Brain = (function() {
    function Brain() {
        this.clear = bind(this.clear, this);
        this.onCmd = bind(this.onCmd, this);
        this.splitRegExp = /\s+/g;
        this.args = prefs.get('brain▸args', {});
        this.dirs = prefs.get('brain▸dirs', {});
        this.cd = prefs.get('brain▸cd', {});
        post.on('cmd', this.onCmd);
    }

    Brain.prototype.onCmd = function(info) {
        var c, i, j, len, len1, ref1, ref2, ref3;
        if (info.chdir) {
            this.addCd(info);
            return;
        }
        ref1 = ['ls', 'lso', 'dir', 'pwd', 'cwd'];
        for (i = 0, len = ref1.length; i < len; i++) {
            c = ref1[i];
            if (info.cmd === c) {
                return;
            }
            if (info.cmd.startsWith(c + ' ')) {
                return;
            }
        }
        ref2 = ['color-ls'];
        for (j = 0, len1 = ref2.length; j < len1; j++) {
            c = ref2[j];
            if (info.alias === c) {
                return;
            }
            if ((ref3 = info.alias) != null ? ref3.startsWith(c + ' ') : void 0) {
                return;
            }
        }
        this.addCmd(info);
        return this.addArg(info);
    };

    Brain.prototype.addCd = function(arg1) {
        var base, chdir, cwd, ref1, ref2, ref3;
        chdir = (ref1 = arg1.chdir) != null ? ref1 : null, cwd = (ref2 = arg1.cwd) != null ? ref2 : null;
        if ((chdir != null ? chdir.length : void 0) < 2) {
            return;
        }
        if (chdir === cwd) {
            return;
        }
        if ((base = this.cd)[cwd] != null) {
            base[cwd];
        } else {
            base[cwd] = {};
        }
        this.cd[cwd][chdir] = ((ref3 = this.cd[cwd][chdir]) != null ? ref3 : 0) + 1;
        return prefs.set('brain▸cd', this.cd);
    };

    Brain.prototype.addCmd = function(arg1) {
        var base, cmd, cwd, ref1, ref2, ref3;
        cmd = (ref1 = arg1.cmd) != null ? ref1 : null, cwd = (ref2 = arg1.cwd) != null ? ref2 : null;
        if (cmd.slice(-1)[0] === '/') {
            cmd = cmd.slice(0, +(cmd.length - 2) + 1 || 9e9);
        }
        if ((cmd != null ? cmd.length : void 0) < 2) {
            return;
        }
        if ((base = this.dirs)[cwd] != null) {
            base[cwd];
        } else {
            base[cwd] = {};
        }
        this.dirs[cwd][cmd] = ((ref3 = this.dirs[cwd][cmd]) != null ? ref3 : 0) + 1;
        return prefs.set('brain▸dirs', this.dirs);
    };

    Brain.prototype.addArg = function(arg1) {
        var arg, argl, cmd, i, info, key, len, ref1, ref2, ref3, ref4;
        cmd = (ref1 = arg1.cmd) != null ? ref1 : null;
        argl = cmd.split(this.splitRegExp);
        key = argl[0];
        argl.shift();
        info = (ref2 = this.args[key]) != null ? ref2 : {};
        info.count = ((ref3 = info.count) != null ? ref3 : 0) + 1;
        if (info.args != null) {
            info.args;
        } else {
            info.args = {};
        }
        for (i = 0, len = argl.length; i < len; i++) {
            arg = argl[i];
            info.args[arg] = ((ref4 = info.args[arg]) != null ? ref4 : 0) + 1;
        }
        this.args[key] = info;
        if (valid(this.args)) {
            return prefs.set('brain▸args', this.args);
        }
    };

    Brain.prototype.cmd = function(editor, cmd) {
        switch (cmd) {
            case 'list':
                return this.list(editor);
            case 'clear':
                return this.clear();
            case 'args':
            case 'dirs':
            case 'cd':
                return this.list(editor, cmd);
        }
    };

    Brain.prototype.clear = function() {
        this.args = {};
        this.dirs = {};
        this.cd = {};
        return true;
    };

    Brain.prototype.list = function(editor, key) {
        if (!key) {
            this.list(editor, 'args');
            this.list(editor, 'dirs');
            this.list(editor, 'cd');
        } else {
            if (editor != null) {
                editor.appendOutput("\n------- " + key);
            }
            if (editor != null) {
                editor.appendOutput(kstr(this[key]));
            }
        }
        return true;
    };

    return Brain;

})();

module.exports = Brain;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhaW4uanMiLCJzb3VyY2VSb290IjoiLi4vY29mZmVlIiwic291cmNlcyI6WyJicmFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0NBQUE7SUFBQTs7QUFRQSxNQUErQixPQUFBLENBQVEsS0FBUixDQUEvQixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlLGlCQUFmLEVBQXNCOztBQUVoQjtJQUVDLGVBQUE7OztRQUVDLElBQUMsQ0FBQSxXQUFELEdBQWU7UUFFZixJQUFDLENBQUEsSUFBRCxHQUFRLEtBQUssQ0FBQyxHQUFOLENBQVUsWUFBVixFQUF1QixFQUF2QjtRQUNSLElBQUMsQ0FBQSxJQUFELEdBQVEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxZQUFWLEVBQXVCLEVBQXZCO1FBQ1IsSUFBQyxDQUFBLEVBQUQsR0FBUSxLQUFLLENBQUMsR0FBTixDQUFVLFVBQVYsRUFBcUIsRUFBckI7UUFFUixJQUFJLENBQUMsRUFBTCxDQUFRLEtBQVIsRUFBYyxJQUFDLENBQUEsS0FBZjtJQVJEOztvQkFnQkgsS0FBQSxHQUFPLFNBQUMsSUFBRDtBQUlILFlBQUE7UUFBQSxJQUFHLElBQUksQ0FBQyxLQUFSO1lBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFQO0FBQ0EsbUJBRko7O0FBSUE7QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQVUsSUFBSSxDQUFDLEdBQUwsS0FBWSxDQUF0QjtBQUFBLHVCQUFBOztZQUNBLElBQVUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFULENBQW9CLENBQUEsR0FBRSxHQUF0QixDQUFWO0FBQUEsdUJBQUE7O0FBRko7QUFJQTtBQUFBLGFBQUEsd0NBQUE7O1lBQ0ksSUFBVSxJQUFJLENBQUMsS0FBTCxLQUFjLENBQXhCO0FBQUEsdUJBQUE7O1lBQ0Esc0NBQW9CLENBQUUsVUFBWixDQUF1QixDQUFBLEdBQUUsR0FBekIsVUFBVjtBQUFBLHVCQUFBOztBQUZKO1FBSUEsSUFBQyxDQUFB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RSxZQUFSLENBQXFCLFlBQUEsR0FBYSxHQUFsQzs7O2dCQUNBLE1BQU0sQ0FBRSxZQUFSLENBQXFCLElBQUEsQ0FBSyxJQUFFLENBQUEsR0FBQSxDQUFQLENBQXJCO2FBTko7O2VBT0E7SUFURTs7Ozs7O0FBV1YsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwgcHJlZnMsIHZhbGlkLCBrc3RyIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEJyYWluXG5cbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgQHNwbGl0UmVnRXhwID0gL1xccysvZ1xuICAgICAgICBcbiAgICAgICAgQGFyZ3MgPSBwcmVmcy5nZXQgJ2JyYWlu4pa4YXJncycge31cbiAgICAgICAgQGRpcnMgPSBwcmVmcy5nZXQgJ2JyYWlu4pa4ZGlycycge31cbiAgICAgICAgQGNkICAgPSBwcmVmcy5nZXQgJ2JyYWlu4pa4Y2QnIHt9XG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdjbWQnIEBvbkNtZFxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIG9uQ21kOiAoaW5mbykgPT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBpbmZvXG4gICAgICAgIFxuICAgICAgICBpZiBpbmZvLmNoZGlyXG4gICAgICAgICAgICBAYWRkQ2QgaW5mb1xuICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gWydscycgJ2xzbycgJ2RpcicgJ3B3ZCcgJ2N3ZCddXG4gICAgICAgICAgICByZXR1cm4gaWYgaW5mby5jbWQgPT0gY1xuICAgICAgICAgICAgcmV0dXJuIGlmIGluZm8uY21kLnN0YXJ0c1dpdGggYysnICdcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgYyBpbiBbJ2NvbG9yLWxzJ11cbiAgICAgICAgICAgIHJldHVybiBpZiBpbmZvLmFsaWFzID09IGNcbiAgICAgICAgICAgIHJldHVybiBpZiBpbmZvLmFsaWFzPy5zdGFydHNXaXRoIGMrJyAnXG4gICAgICAgIFxuICAgICAgICBAYWRkQ21kIGluZm9cbiAgICAgICAgQGFkZEFyZyBpbmZvXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYWRkQ2Q6IChjaGRpcjosIGN3ZDopIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgY2hkaXI/Lmxlbmd0aCA8IDJcbiAgICAgICAgcmV0dXJuIGlmIGNoZGlyID09IGN3ZFxuICAgICAgICBcbiAgICAgICAgQGNkW2N3ZF0gPz0ge31cbiAgICAgICAgQGNkW2N3ZF1bY2hkaXJdID0gKEBjZFtjd2RdW2NoZGlyXSA/IDApICsgMVxuXG4gICAgICAgIHByZWZzLnNldCAnYnJhaW7ilrhjZCcgQGNkXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYWRkQ21kOiAoY21kOiwgY3dkOikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNtZFstMV0gPT0gJy8nIHRoZW4gY21kID0gY21kWy4uY21kLmxlbmd0aC0yXVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGNtZD8ubGVuZ3RoIDwgMlxuICAgICAgICBcbiAgICAgICAgQGRpcnNbY3dkXSA/PSB7fVxuICAgICAgICBAZGlyc1tjd2RdW2NtZF0gPSAoQGRpcnNbY3dkXVtjbWRdID8gMCkgKyAxXG5cbiAgICAgICAgcHJlZnMuc2V0ICdicmFpbuKWuGRpcnMnIEBkaXJzXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgIDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBhZGRBcmc6IChjbWQ6KSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnbCA9IGNtZC5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAga2V5ID0gYXJnbFswXVxuICAgICAgICBhcmdsLnNoaWZ0KClcblxuICAgICAgICBpbmZvICAgICAgID0gQGFyZ3Nba2V5XSA/IHt9XG4gICAgICAgIGluZm8uY291bnQgPSAoaW5mby5jb3VudCA/IDApICsgMVxuICAgICAgICBpbmZvLmFyZ3MgPz0ge31cbiAgICAgICAgXG4gICAgICAgIGZvciBhcmcgaW4gYXJnbFxuICAgICAgICAgICAgaW5mby5hcmdzW2FyZ10gPSAoaW5mby5hcmdzW2FyZ10gPyAwKSArIDFcbiAgICAgICAgICAgICMgYXJnaSA9IGluZm8uYXJnc1thcmddID8ge31cbiAgICAgICAgICAgICMgYXJnaS5jb3VudCA9IChhcmdpLmNvdW50ID8gMCkgKyAxXG4gICAgICAgICAgICAjIGluZm8uYXJnc1thcmddID0gYXJnaVxuICAgICAgICAgICAgXG4gICAgICAgIEBhcmdzW2tleV0gPSBpbmZvXG4gICAgICAgXG4gICAgICAgIHByZWZzLnNldCAnYnJhaW7ilrhhcmdzJyBAYXJncyBpZiB2YWxpZCBAYXJnc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGNtZDogKGVkaXRvciwgY21kKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjbWRcbiAgICAgICAgICAgIHdoZW4gJ2xpc3QnICB0aGVuIEBsaXN0IGVkaXRvclxuICAgICAgICAgICAgd2hlbiAnY2xlYXInIHRoZW4gQGNsZWFyKClcbiAgICAgICAgICAgIHdoZW4gJ2FyZ3MnICdkaXJzJyAnY2QnIHRoZW4gQGxpc3QgZWRpdG9yLCBjbWRcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNsZWFyOiA9PiBcbiAgICAgICAgXG4gICAgICAgIEBhcmdzID0ge31cbiAgICAgICAgQGRpcnMgPSB7fVxuICAgICAgICBAY2QgICA9IHt9XG4gICAgICAgIHRydWVcbiAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBsaXN0OiAoZWRpdG9yLCBrZXkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qga2V5XG4gICAgICAgICAgICBAbGlzdCBlZGl0b3IsICdhcmdzJ1xuICAgICAgICAgICAgQGxpc3QgZWRpdG9yLCAnZGlycydcbiAgICAgICAgICAgIEBsaXN0IGVkaXRvciwgJ2NkJ1xuICAgICAgICBlbHNlICAgICAgICBcbiAgICAgICAgICAgIGVkaXRvcj8uYXBwZW5kT3V0cHV0IFwiXFxuLS0tLS0tLSAje2tleX1cIlxuICAgICAgICAgICAgZWRpdG9yPy5hcHBlbmRPdXRwdXQga3N0ciBAW2tleV1cbiAgICAgICAgdHJ1ZVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJyYWluXG4iXX0=
//# sourceURL=../coffee/brain.coffee