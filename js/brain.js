// koffee 1.4.0

/*
0000000    00000000    0000000   000  000   000
000   000  000   000  000   000  000  0000  000
0000000    0000000    000000000  000  000 0 000
000   000  000   000  000   000  000  000  0000
0000000    000   000  000   000  000  000   000
 */
var Brain, kerror, klog, kstr, post, prefs, ref, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, kerror = ref.kerror, prefs = ref.prefs, valid = ref.valid, klog = ref.klog, kstr = ref.kstr;

Brain = (function() {
    function Brain() {
        this.clear = bind(this.clear, this);
        this.onCmd = bind(this.onCmd, this);
        this.splitRegExp = /\s+/g;
        this.args = prefs.get('brain▸args', {});
        this.cmds = prefs.get('brain▸cmds', {});
        this.dirs = prefs.get('brain▸dirs', {});
        post.on('cmd', this.onCmd);
    }

    Brain.prototype.onCmd = function(info) {
        this.addCmd(info);
        return this.addArg(info);
    };

    Brain.prototype.addCmd = function(arg1) {
        var base, cmd, cwd, info, ref1, ref2, ref3, ref4, ref5, ref6;
        cmd = (ref1 = arg1.cmd) != null ? ref1 : null, cwd = (ref2 = arg1.cwd) != null ? ref2 : null;
        if (cmd.slice(-1)[0] === '/') {
            cmd = cmd.slice(0, +(cmd.length - 2) + 1 || 9e9);
        }
        if ((cmd != null ? cmd.length : void 0) < 2) {
            return;
        }
        info = (ref3 = this.cmds[cmd]) != null ? ref3 : {};
        info.count = ((ref4 = info.count) != null ? ref4 : 0) + 1;
        if (info.dirs != null) {
            info.dirs;
        } else {
            info.dirs = {};
        }
        info.dirs[cwd] = ((ref5 = info.dirs[cwd]) != null ? ref5 : 0) + 1;
        this.cmds[cmd] = info;
        if ((base = this.dirs)[cwd] != null) {
            base[cwd];
        } else {
            base[cwd] = {};
        }
        this.dirs[cwd][cmd] = ((ref6 = this.dirs[cwd][cmd]) != null ? ref6 : 0) + 1;
        prefs.set('brain▸cmds', this.cmds);
        return prefs.set('brain▸dirs', this.dirs);
    };

    Brain.prototype.addArg = function(arg1) {
        var arg, argi, argl, cmd, i, info, key, len, ref1, ref2, ref3, ref4, ref5;
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
            argi = (ref4 = info.args[arg]) != null ? ref4 : {};
            argi.count = ((ref5 = argi.count) != null ? ref5 : 0) + 1;
            info.args[arg] = argi;
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
            case 'cmds':
            case 'args':
            case 'dirs':
                return this.list(editor, cmd);
        }
    };

    Brain.prototype.clear = function() {
        this.args = {};
        return this.cmds = {};
    };

    Brain.prototype.list = function(editor, key) {
        if (!key) {
            this.list(editor, 'args');
            this.list(editor, 'cmds');
            this.list(editor, 'dirs');
            return;
        }
        if (editor != null) {
            editor.appendOutput("\n------- " + key);
        }
        return editor != null ? editor.appendOutput(kstr(this[key])) : void 0;
    };

    return Brain;

})();

module.exports = Brain;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhaW4uanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtEQUFBO0lBQUE7O0FBUUEsTUFBNkMsT0FBQSxDQUFRLEtBQVIsQ0FBN0MsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0IsaUJBQWhCLEVBQXVCLGlCQUF2QixFQUE4QixlQUE5QixFQUFvQzs7QUFFOUI7SUFFQyxlQUFBOzs7UUFFQyxJQUFDLENBQUEsV0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLElBQUQsR0FBUSxLQUFLLENBQUMsR0FBTixDQUFVLFlBQVYsRUFBdUIsRUFBdkI7UUFDUixJQUFDLENBQUEsSUFBRCxHQUFRLEtBQUssQ0FBQyxHQUFOLENBQVUsWUFBVixFQUF1QixFQUF2QjtRQUNSLElBQUMsQ0FBQSxJQUFELEdBQVEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxZQUFWLEVBQXVCLEVBQXZCO1FBRVIsSUFBSSxDQUFDLEVBQUwsQ0FBUSxLQUFSLEVBQWMsSUFBQyxDQUFBLEtBQWY7SUFSRDs7b0JBVUgsS0FBQSxHQUFPLFNBQUMsSUFBRDtRQUVILElBQUMsQ0FBQSxNQUFELENBQVEsSUFBUjtlQUNBLElBQUMsQ0FBQSxNQUFELENBQVEsSUFBUjtJQUhHOztvQkFLUCxNQUFBLEdBQVEsU0FBQyxJQUFEO0FBRUosWUFBQTtRQUZLLHlDQUFFLE1BQUkseUNBQUU7UUFFYixJQUFHLEdBQUksVUFBRSxDQUFBLENBQUEsQ0FBTixLQUFXLEdBQWQ7WUFBdUIsR0FBQSxHQUFNLEdBQUksd0NBQWpDOztRQUVBLG1CQUFVLEdBQUcsQ0FBRSxnQkFBTCxHQUFjLENBQXhCO0FBQUEsbUJBQUE7O1FBRUEsSUFBQSw0Q0FBMEI7UUFDMUIsSUFBSSxDQUFDLEtBQUwsR0FBYSxzQ0FBYyxDQUFkLENBQUEsR0FBbUI7O1lBQ2hDLElBQUksQ0FBQzs7WUFBTCxJQUFJLENBQUMsT0FBUTs7UUFDYixJQUFJLENBQUMsSUFBSyxDQUFBLEdBQUEsQ0FBVixHQUFpQiwwQ0FBa0IsQ0FBbEIsQ0FBQSxHQUF1QjtRQUN4QyxJQUFDLENBQUEsSUFBSyxDQUFBLEdBQUEsQ0FBTixHQUFhOztnQkFFUCxDQUFBLEdBQUE7O2dCQUFBLENBQUEsR0FBQSxJQUFROztRQUNkLElBQUMsQ0FBQSxJQUFLLENBQUEsR0FBQSxDQUFLLENBQUEsR0FBQSxDQUFYLEdBQWtCLCtDQUFtQixDQUFuQixDQUFBLEdBQXdCO1FBRTFDLEtBQUssQ0FBQyxHQUFOLENBQVUsWUFBVixFQUF1QixJQUFDLENBQUEsSUFBeEI7ZUFDQSxLQUFLLENBQUMsR0FBTixDQUFVLFlBQVYsRUFBdUIsSUFBQyxDQUFBLElBQXhCO0lBaEJJOztvQkFrQlIsTUFBQSxHQUFRLFNBQUMsSUFBRDtBQUVKLFlBQUE7UUFGSyx5Q0FBRTtRQUVQLElBQUEsR0FBTyxHQUFHLENBQUMsS0FBSixDQUFVLElBQUMsQ0FBQSxXQUFYO1FBQ1AsR0FBQSxHQUFNLElBQUssQ0FBQSxDQUFBO1FBQ1gsSUFBSSxDQUFDLEtBQUwsQ0FBQTtRQUVBLElBQUEsNENBQTBCO1FBQzFCLElBQUksQ0FBQyxLQUFMLEdBQWEsc0NBQWMsQ0FBZCxDQUFBLEdBQW1COztZQUNoQyxJQUFJLENBQUM7O1lBQUwsSUFBSSxDQUFDLE9BQVE7O0FBRWIsYUFBQSxzQ0FBQTs7WUFDSSxJQUFBLDRDQUF3QjtZQUN4QixJQUFJLENBQUMsS0FBTCxHQUFhLHNDQUFjLENBQWQsQ0FBQSxHQUFtQjtZQUNoQyxJQUFJLENBQUMsSUFBSyxDQUFBLEdBQUEsQ0FBVixHQUFpQjtBQUhyQjtRQUtBLElBQUMsQ0FBQSxJQUFLLENBQUEsR0FBQSxDQUFOLEdBQWE7UUFFYixJQUFnQyxLQUFBLENBQU0sSUFBQyxDQUFBLElBQVAsQ0FBaEM7bUJBQUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxZQUFWLEVBQXVCLElBQUMsQ0FBQSxJQUF4QixFQUFBOztJQWpCSTs7b0JBbUJSLEdBQUEsR0FBSyxTQUFDLE1BQUQsRUFBUyxHQUFUO0FBRUQsZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE1BRFQ7dUJBQ3NCLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTjtBQUR0QixpQkFFUyxPQUZUO3VCQUVzQixJQUFDLENBQUEsS0FBRCxDQUFBO0FBRnRCLGlCQUdTLE1BSFQ7QUFBQSxpQkFHZ0IsTUFIaEI7QUFBQSxpQkFHdUIsTUFIdkI7dUJBR21DLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTixFQUFjLEdBQWQ7QUFIbkM7SUFGQzs7b0JBT0wsS0FBQSxHQUFPLFNBQUE7UUFFSCxJQUFDLENBQUEsSUFBRCxHQUFRO2VBQ1IsSUFBQyxDQUFBLElBQUQsR0FBUTtJQUhMOztvQkFLUCxJQUFBLEdBQU0sU0FBQyxNQUFELEVBQVMsR0FBVDtRQUVGLElBQUcsQ0FBSSxHQUFQO1lBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBTSxNQUFOLEVBQWMsTUFBZDtZQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTixFQUFjLE1BQWQ7WUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU4sRUFBYyxNQUFkO0FBQ0EsbUJBSko7OztZQU1BLE1BQU0sQ0FBRSxZQUFSLENBQXFCLFlBQUEsR0FBYSxHQUFsQzs7Z0NBQ0EsTUFBTSxDQUFFLFlBQVIsQ0FBcUIsSUFBQSxDQUFLLElBQUUsQ0FBQSxHQUFBLENBQVAsQ0FBckI7SUFURTs7Ozs7O0FBV1YsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4wMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgcG9zdCwga2Vycm9yLCBwcmVmcywgdmFsaWQsIGtsb2csIGtzdHIgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgQnJhaW5cblxuICAgIEA6IC0+XG4gICAgICAgIFxuICAgICAgICBAc3BsaXRSZWdFeHAgPSAvXFxzKy9nXG4gICAgICAgIFxuICAgICAgICBAYXJncyA9IHByZWZzLmdldCAnYnJhaW7ilrhhcmdzJyB7fVxuICAgICAgICBAY21kcyA9IHByZWZzLmdldCAnYnJhaW7ilrhjbWRzJyB7fVxuICAgICAgICBAZGlycyA9IHByZWZzLmdldCAnYnJhaW7ilrhkaXJzJyB7fVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnY21kJyBAb25DbWRcbiAgICAgICAgICAgIFxuICAgIG9uQ21kOiAoaW5mbykgPT5cbiAgICAgICAgICAgICBcbiAgICAgICAgQGFkZENtZCBpbmZvXG4gICAgICAgIEBhZGRBcmcgaW5mb1xuICAgICAgICAgICAgXG4gICAgYWRkQ21kOiAoY21kOiwgY3dkOikgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIGNtZFstMV0gPT0gJy8nIHRoZW4gY21kID0gY21kWy4uY21kLmxlbmd0aC0yXVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGNtZD8ubGVuZ3RoIDwgMlxuICAgICAgICBcbiAgICAgICAgaW5mbyAgICAgICA9IEBjbWRzW2NtZF0gPyB7fVxuICAgICAgICBpbmZvLmNvdW50ID0gKGluZm8uY291bnQgPyAwKSArIDFcbiAgICAgICAgaW5mby5kaXJzID89IHt9XG4gICAgICAgIGluZm8uZGlyc1tjd2RdID0gKGluZm8uZGlyc1tjd2RdID8gMCkgKyAxXG4gICAgICAgIEBjbWRzW2NtZF0gPSBpbmZvXG4gICAgICAgIFxuICAgICAgICBAZGlyc1tjd2RdID89IHt9XG4gICAgICAgIEBkaXJzW2N3ZF1bY21kXSA9IChAZGlyc1tjd2RdW2NtZF0gPyAwKSArIDFcblxuICAgICAgICBwcmVmcy5zZXQgJ2JyYWlu4pa4Y21kcycgQGNtZHNcbiAgICAgICAgcHJlZnMuc2V0ICdicmFpbuKWuGRpcnMnIEBkaXJzXG4gICAgICAgIFxuICAgIGFkZEFyZzogKGNtZDopIC0+XG4gICAgICAgIFxuICAgICAgICBhcmdsID0gY21kLnNwbGl0IEBzcGxpdFJlZ0V4cFxuICAgICAgICBrZXkgPSBhcmdsWzBdXG4gICAgICAgIGFyZ2wuc2hpZnQoKVxuXG4gICAgICAgIGluZm8gICAgICAgPSBAYXJnc1trZXldID8ge31cbiAgICAgICAgaW5mby5jb3VudCA9IChpbmZvLmNvdW50ID8gMCkgKyAxXG4gICAgICAgIGluZm8uYXJncyA/PSB7fVxuICAgICAgICBcbiAgICAgICAgZm9yIGFyZyBpbiBhcmdsXG4gICAgICAgICAgICBhcmdpID0gaW5mby5hcmdzW2FyZ10gPyB7fVxuICAgICAgICAgICAgYXJnaS5jb3VudCA9IChhcmdpLmNvdW50ID8gMCkgKyAxXG4gICAgICAgICAgICBpbmZvLmFyZ3NbYXJnXSA9IGFyZ2lcbiAgICAgICAgICAgIFxuICAgICAgICBAYXJnc1trZXldID0gaW5mb1xuICAgICAgIFxuICAgICAgICBwcmVmcy5zZXQgJ2JyYWlu4pa4YXJncycgQGFyZ3MgaWYgdmFsaWQgQGFyZ3NcbiAgICAgICAgXG4gICAgY21kOiAoZWRpdG9yLCBjbWQpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNtZFxuICAgICAgICAgICAgd2hlbiAnbGlzdCcgIHRoZW4gQGxpc3QgZWRpdG9yXG4gICAgICAgICAgICB3aGVuICdjbGVhcicgdGhlbiBAY2xlYXIoKVxuICAgICAgICAgICAgd2hlbiAnY21kcycgJ2FyZ3MnICdkaXJzJyB0aGVuIEBsaXN0IGVkaXRvciwgY21kXG4gICAgICAgIFxuICAgIGNsZWFyOiA9PiBcbiAgICAgICAgXG4gICAgICAgIEBhcmdzID0ge31cbiAgICAgICAgQGNtZHMgPSB7fVxuICAgICAgICBcbiAgICBsaXN0OiAoZWRpdG9yLCBrZXkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qga2V5XG4gICAgICAgICAgICBAbGlzdCBlZGl0b3IsICdhcmdzJ1xuICAgICAgICAgICAgQGxpc3QgZWRpdG9yLCAnY21kcydcbiAgICAgICAgICAgIEBsaXN0IGVkaXRvciwgJ2RpcnMnXG4gICAgICAgICAgICByZXR1cm4gICAgXG4gICAgICAgIFxuICAgICAgICBlZGl0b3I/LmFwcGVuZE91dHB1dCBcIlxcbi0tLS0tLS0gI3trZXl9XCJcbiAgICAgICAgZWRpdG9yPy5hcHBlbmRPdXRwdXQga3N0ciBAW2tleV1cblxubW9kdWxlLmV4cG9ydHMgPSBCcmFpblxuIl19
//# sourceURL=../coffee/brain.coffee