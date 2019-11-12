// koffee 1.4.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhaW4uanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG9DQUFBO0lBQUE7O0FBUUEsTUFBK0IsT0FBQSxDQUFRLEtBQVIsQ0FBL0IsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxpQkFBZixFQUFzQjs7QUFFaEI7SUFFQyxlQUFBOzs7UUFFQyxJQUFDLENBQUEsV0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLElBQUQsR0FBUSxLQUFLLENBQUMsR0FBTixDQUFVLFlBQVYsRUFBdUIsRUFBdkI7UUFDUixJQUFDLENBQUEsSUFBRCxHQUFRLEtBQUssQ0FBQyxHQUFOLENBQVUsWUFBVixFQUF1QixFQUF2QjtRQUNSLElBQUMsQ0FBQSxFQUFELEdBQVEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxVQUFWLEVBQXFCLEVBQXJCO1FBRVIsSUFBSSxDQUFDLEVBQUwsQ0FBUSxLQUFSLEVBQWMsSUFBQyxDQUFBLEtBQWY7SUFSRDs7b0JBZ0JILEtBQUEsR0FBTyxTQUFDLElBQUQ7QUFJSCxZQUFBO1FBQUEsSUFBRyxJQUFJLENBQUMsS0FBUjtZQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sSUFBUDtBQUNBLG1CQUZKOztBQUlBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFVLElBQUksQ0FBQyxHQUFMLEtBQVksQ0FBdEI7QUFBQSx1QkFBQTs7WUFDQSxJQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVCxDQUFvQixDQUFBLEdBQUUsR0FBdEIsQ0FBVjtBQUFBLHVCQUFBOztBQUZKO0FBSUE7QUFBQSxhQUFBLHdDQUFBOztZQUNJLElBQVUsSUFBSSxDQUFDLEtBQUwsS0FBYyxDQUF4QjtBQUFBLHVCQUFBOztZQUNBLHNDQUFvQixDQUFFLFVBQVosQ0FBdUIsQ0FBQSxHQUFFLEdBQXpCLFVBQVY7QUFBQSx1QkFBQTs7QUFGSjtRQUlBLElBQUMsQ0FBQSxNQUFELENBQVEsSUFBUjtlQUNB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QWEsR0FBbEM7OztnQkFDQSxNQUFNLENBQUUsWUFBUixDQUFxQixJQUFBLENBQUssSUFBRSxDQUFBLEdBQUEsQ0FBUCxDQUFyQjthQU5KOztlQU9BO0lBVEU7Ozs7OztBQVdWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbjAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHByZWZzLCB2YWxpZCwga3N0ciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBCcmFpblxuXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgICAgIEBzcGxpdFJlZ0V4cCA9IC9cXHMrL2dcbiAgICAgICAgXG4gICAgICAgIEBhcmdzID0gcHJlZnMuZ2V0ICdicmFpbuKWuGFyZ3MnIHt9XG4gICAgICAgIEBkaXJzID0gcHJlZnMuZ2V0ICdicmFpbuKWuGRpcnMnIHt9XG4gICAgICAgIEBjZCAgID0gcHJlZnMuZ2V0ICdicmFpbuKWuGNkJyB7fVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnY21kJyBAb25DbWRcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBvbkNtZDogKGluZm8pID0+XG4gICAgICAgIFxuICAgICAgICAjIGtsb2cgaW5mb1xuICAgICAgICBcbiAgICAgICAgaWYgaW5mby5jaGRpclxuICAgICAgICAgICAgQGFkZENkIGluZm9cbiAgICAgICAgICAgIHJldHVybiBcbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIFsnbHMnICdsc28nICdkaXInICdwd2QnICdjd2QnXVxuICAgICAgICAgICAgcmV0dXJuIGlmIGluZm8uY21kID09IGNcbiAgICAgICAgICAgIHJldHVybiBpZiBpbmZvLmNtZC5zdGFydHNXaXRoIGMrJyAnXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGMgaW4gWydjb2xvci1scyddXG4gICAgICAgICAgICByZXR1cm4gaWYgaW5mby5hbGlhcyA9PSBjXG4gICAgICAgICAgICByZXR1cm4gaWYgaW5mby5hbGlhcz8uc3RhcnRzV2l0aCBjKycgJ1xuICAgICAgICBcbiAgICAgICAgQGFkZENtZCBpbmZvXG4gICAgICAgIEBhZGRBcmcgaW5mb1xuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGFkZENkOiAoY2hkaXI6LCBjd2Q6KSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGNoZGlyPy5sZW5ndGggPCAyXG4gICAgICAgIHJldHVybiBpZiBjaGRpciA9PSBjd2RcbiAgICAgICAgXG4gICAgICAgIEBjZFtjd2RdID89IHt9XG4gICAgICAgIEBjZFtjd2RdW2NoZGlyXSA9IChAY2RbY3dkXVtjaGRpcl0gPyAwKSArIDFcblxuICAgICAgICBwcmVmcy5zZXQgJ2JyYWlu4pa4Y2QnIEBjZFxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGFkZENtZDogKGNtZDosIGN3ZDopIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjbWRbLTFdID09ICcvJyB0aGVuIGNtZCA9IGNtZFsuLmNtZC5sZW5ndGgtMl1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBjbWQ/Lmxlbmd0aCA8IDJcbiAgICAgICAgXG4gICAgICAgIEBkaXJzW2N3ZF0gPz0ge31cbiAgICAgICAgQGRpcnNbY3dkXVtjbWRdID0gKEBkaXJzW2N3ZF1bY21kXSA/IDApICsgMVxuXG4gICAgICAgIHByZWZzLnNldCAnYnJhaW7ilrhkaXJzJyBAZGlyc1xuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgYWRkQXJnOiAoY21kOikgLT5cbiAgICAgICAgXG4gICAgICAgIGFyZ2wgPSBjbWQuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIGtleSA9IGFyZ2xbMF1cbiAgICAgICAgYXJnbC5zaGlmdCgpXG5cbiAgICAgICAgaW5mbyAgICAgICA9IEBhcmdzW2tleV0gPyB7fVxuICAgICAgICBpbmZvLmNvdW50ID0gKGluZm8uY291bnQgPyAwKSArIDFcbiAgICAgICAgaW5mby5hcmdzID89IHt9XG4gICAgICAgIFxuICAgICAgICBmb3IgYXJnIGluIGFyZ2xcbiAgICAgICAgICAgIGluZm8uYXJnc1thcmddID0gKGluZm8uYXJnc1thcmddID8gMCkgKyAxXG4gICAgICAgICAgICAjIGFyZ2kgPSBpbmZvLmFyZ3NbYXJnXSA/IHt9XG4gICAgICAgICAgICAjIGFyZ2kuY291bnQgPSAoYXJnaS5jb3VudCA/IDApICsgMVxuICAgICAgICAgICAgIyBpbmZvLmFyZ3NbYXJnXSA9IGFyZ2lcbiAgICAgICAgICAgIFxuICAgICAgICBAYXJnc1trZXldID0gaW5mb1xuICAgICAgIFxuICAgICAgICBwcmVmcy5zZXQgJ2JyYWlu4pa4YXJncycgQGFyZ3MgaWYgdmFsaWQgQGFyZ3NcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBjbWQ6IChlZGl0b3IsIGNtZCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggY21kXG4gICAgICAgICAgICB3aGVuICdsaXN0JyAgdGhlbiBAbGlzdCBlZGl0b3JcbiAgICAgICAgICAgIHdoZW4gJ2NsZWFyJyB0aGVuIEBjbGVhcigpXG4gICAgICAgICAgICB3aGVuICdhcmdzJyAnZGlycycgJ2NkJyB0aGVuIEBsaXN0IGVkaXRvciwgY21kXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjbGVhcjogPT4gXG4gICAgICAgIFxuICAgICAgICBAYXJncyA9IHt9XG4gICAgICAgIEBkaXJzID0ge31cbiAgICAgICAgQGNkICAgPSB7fVxuICAgICAgICB0cnVlXG4gICAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgbGlzdDogKGVkaXRvciwga2V5KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGtleVxuICAgICAgICAgICAgQGxpc3QgZWRpdG9yLCAnYXJncydcbiAgICAgICAgICAgIEBsaXN0IGVkaXRvciwgJ2RpcnMnXG4gICAgICAgICAgICBAbGlzdCBlZGl0b3IsICdjZCdcbiAgICAgICAgZWxzZSAgICAgICAgXG4gICAgICAgICAgICBlZGl0b3I/LmFwcGVuZE91dHB1dCBcIlxcbi0tLS0tLS0gI3trZXl9XCJcbiAgICAgICAgICAgIGVkaXRvcj8uYXBwZW5kT3V0cHV0IGtzdHIgQFtrZXldXG4gICAgICAgIHRydWVcblxubW9kdWxlLmV4cG9ydHMgPSBCcmFpblxuIl19
//# sourceURL=../coffee/brain.coffee