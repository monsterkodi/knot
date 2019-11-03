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
        post.on('cmd', this.onCmd);
    }

    Brain.prototype.onCmd = function(info) {
        var c, i, len, ref1;
        if (info.chdir) {
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
        this.addCmd(info);
        return this.addArg(info);
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
            case 'args':
            case 'dirs':
                return this.list(editor, cmd);
        }
    };

    Brain.prototype.clear = function() {
        this.args = {};
        this.dirs = {};
        return true;
    };

    Brain.prototype.list = function(editor, key) {
        if (!key) {
            this.list(editor, 'args');
            this.list(editor, 'dirs');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhaW4uanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG9DQUFBO0lBQUE7O0FBUUEsTUFBK0IsT0FBQSxDQUFRLEtBQVIsQ0FBL0IsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZSxpQkFBZixFQUFzQjs7QUFFaEI7SUFFQyxlQUFBOzs7UUFFQyxJQUFDLENBQUEsV0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLElBQUQsR0FBUSxLQUFLLENBQUMsR0FBTixDQUFVLFlBQVYsRUFBdUIsRUFBdkI7UUFDUixJQUFDLENBQUEsSUFBRCxHQUFRLEtBQUssQ0FBQyxHQUFOLENBQVUsWUFBVixFQUF1QixFQUF2QjtRQUVSLElBQUksQ0FBQyxFQUFMLENBQVEsS0FBUixFQUFjLElBQUMsQ0FBQSxLQUFmO0lBUEQ7O29CQVNILEtBQUEsR0FBTyxTQUFDLElBQUQ7QUFFSCxZQUFBO1FBQUEsSUFBVSxJQUFJLENBQUMsS0FBZjtBQUFBLG1CQUFBOztBQUVBO0FBQUEsYUFBQSxzQ0FBQTs7WUFDSSxJQUFVLElBQUksQ0FBQyxHQUFMLEtBQVksQ0FBdEI7QUFBQSx1QkFBQTs7WUFDQSxJQUFVLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVCxDQUFvQixDQUFBLEdBQUUsR0FBdEIsQ0FBVjtBQUFBLHVCQUFBOztBQUZKO1FBSUEsSUFBQyxDQUFBLE1BQUQsQ0FBUSxJQUFSO2VBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBUSxJQUFSO0lBVEc7O29CQVdQLE1BQUEsR0FBUSxTQUFDLElBQUQ7QUFFSixZQUFBO1FBRksseUNBQUUsTUFBSSx5Q0FBRTtRQUViLElBQUcsR0FBSSxVQUFFLENBQUEsQ0FBQSxDQUFOLEtBQVcsR0FBZDtZQUF1QixHQUFBLEdBQU0sR0FBSSx3Q0FBakM7O1FBRUEsbUJBQVUsR0FBRyxDQUFFLGdCQUFMLEdBQWMsQ0FBeEI7QUFBQSxtQkFBQTs7O2dCQUVNLENBQUEsR0FBQTs7Z0JBQUEsQ0FBQSxHQUFBLElBQVE7O1FBQ2QsSUFBQyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQUssQ0FBQSxHQUFBLENBQVgsR0FBa0IsK0NBQW1CLENBQW5CLENBQUEsR0FBd0I7ZUFFMUMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxZQUFWLEVBQXVCLElBQUMsQ0FBQSxJQUF4QjtJQVRJOztvQkFXUixNQUFBLEdBQVEsU0FBQyxJQUFEO0FBRUosWUFBQTtRQUZLLHlDQUFFO1FBRVAsSUFBQSxHQUFPLEdBQUcsQ0FBQyxLQUFKLENBQVUsSUFBQyxDQUFBLFdBQVg7UUFDUCxHQUFBLEdBQU0sSUFBSyxDQUFBLENBQUE7UUFDWCxJQUFJLENBQUMsS0FBTCxDQUFBO1FBRUEsSUFBQSw0Q0FBMEI7UUFDMUIsSUFBSSxDQUFDLEtBQUwsR0FBYSxzQ0FBYyxDQUFkLENBQUEsR0FBbUI7O1lBQ2hDLElBQUksQ0FBQzs7WUFBTCxJQUFJLENBQUMsT0FBUTs7QUFFYixhQUFBLHNDQUFBOztZQUNJLElBQUEsNENBQXdCO1lBQ3hCLElBQUksQ0FBQyxLQUFMLEdBQWEsc0NBQWMsQ0FBZCxDQUFBLEdBQW1CO1lBQ2hDLElBQUksQ0FBQyxJQUFLLENBQUEsR0FBQSxDQUFWLEdBQWlCO0FBSHJCO1FBS0EsSUFBQyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQU4sR0FBYTtRQUViLElBQWdDLEtBQUEsQ0FBTSxJQUFDLENBQUEsSUFBUCxDQUFoQzttQkFBQSxLQUFLLENBQUMsR0FBTixDQUFVLFlBQVYsRUFBdUIsSUFBQyxDQUFBLElBQXhCLEVBQUE7O0lBakJJOztvQkFtQlIsR0FBQSxHQUFLLFNBQUMsTUFBRCxFQUFTLEdBQVQ7QUFFRCxnQkFBTyxHQUFQO0FBQUEsaUJBQ1MsTUFEVDt1QkFDc0IsSUFBQyxDQUFBLElBQUQsQ0FBTSxNQUFOO0FBRHRCLGlCQUVTLE9BRlQ7dUJBRXNCLElBQUMsQ0FBQSxLQUFELENBQUE7QUFGdEIsaUJBR1MsTUFIVDtBQUFBLGlCQUdnQixNQUhoQjt1QkFHNEIsSUFBQyxDQUFBLElBQUQsQ0FBTSxNQUFOLEVBQWMsR0FBZDtBQUg1QjtJQUZDOztvQkFPTCxLQUFBLEdBQU8sU0FBQTtRQUVILElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsSUFBRCxHQUFRO2VBQ1I7SUFKRzs7b0JBTVAsSUFBQSxHQUFNLFNBQUMsTUFBRCxFQUFTLEdBQVQ7UUFFRixJQUFHLENBQUksR0FBUDtZQUNJLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTixFQUFjLE1BQWQ7WUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU4sRUFBYyxNQUFkLEVBRko7U0FBQSxNQUFBOztnQkFJSSxNQUFNLENBQUUsWUFBUixDQUFxQixZQUFBLEdBQWEsR0FBbEM7OztnQkFDQSxNQUFNLENBQUUsWUFBUixDQUFxQixJQUFBLENBQUssSUFBRSxDQUFBLEdBQUEsQ0FBUCxDQUFyQjthQUxKOztlQU1BO0lBUkU7Ozs7OztBQVVWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbjAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHByZWZzLCB2YWxpZCwga3N0ciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBCcmFpblxuXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgICAgIEBzcGxpdFJlZ0V4cCA9IC9cXHMrL2dcbiAgICAgICAgXG4gICAgICAgIEBhcmdzID0gcHJlZnMuZ2V0ICdicmFpbuKWuGFyZ3MnIHt9XG4gICAgICAgIEBkaXJzID0gcHJlZnMuZ2V0ICdicmFpbuKWuGRpcnMnIHt9XG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdjbWQnIEBvbkNtZFxuICAgICAgICAgICAgXG4gICAgb25DbWQ6IChpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGluZm8uY2hkaXJcbiAgICAgICAgXG4gICAgICAgIGZvciBjIGluIFsnbHMnICdsc28nICdkaXInICdwd2QnICdjd2QnXVxuICAgICAgICAgICAgcmV0dXJuIGlmIGluZm8uY21kID09IGNcbiAgICAgICAgICAgIHJldHVybiBpZiBpbmZvLmNtZC5zdGFydHNXaXRoIGMrJyAnXG4gICAgICAgIFxuICAgICAgICBAYWRkQ21kIGluZm9cbiAgICAgICAgQGFkZEFyZyBpbmZvXG4gICAgICAgICAgICBcbiAgICBhZGRDbWQ6IChjbWQ6LCBjd2Q6KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY21kWy0xXSA9PSAnLycgdGhlbiBjbWQgPSBjbWRbLi5jbWQubGVuZ3RoLTJdXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgY21kPy5sZW5ndGggPCAyXG4gICAgICAgIFxuICAgICAgICBAZGlyc1tjd2RdID89IHt9XG4gICAgICAgIEBkaXJzW2N3ZF1bY21kXSA9IChAZGlyc1tjd2RdW2NtZF0gPyAwKSArIDFcblxuICAgICAgICBwcmVmcy5zZXQgJ2JyYWlu4pa4ZGlycycgQGRpcnNcbiAgICAgICAgXG4gICAgYWRkQXJnOiAoY21kOikgLT5cbiAgICAgICAgXG4gICAgICAgIGFyZ2wgPSBjbWQuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIGtleSA9IGFyZ2xbMF1cbiAgICAgICAgYXJnbC5zaGlmdCgpXG5cbiAgICAgICAgaW5mbyAgICAgICA9IEBhcmdzW2tleV0gPyB7fVxuICAgICAgICBpbmZvLmNvdW50ID0gKGluZm8uY291bnQgPyAwKSArIDFcbiAgICAgICAgaW5mby5hcmdzID89IHt9XG4gICAgICAgIFxuICAgICAgICBmb3IgYXJnIGluIGFyZ2xcbiAgICAgICAgICAgIGFyZ2kgPSBpbmZvLmFyZ3NbYXJnXSA/IHt9XG4gICAgICAgICAgICBhcmdpLmNvdW50ID0gKGFyZ2kuY291bnQgPyAwKSArIDFcbiAgICAgICAgICAgIGluZm8uYXJnc1thcmddID0gYXJnaVxuICAgICAgICAgICAgXG4gICAgICAgIEBhcmdzW2tleV0gPSBpbmZvXG4gICAgICAgXG4gICAgICAgIHByZWZzLnNldCAnYnJhaW7ilrhhcmdzJyBAYXJncyBpZiB2YWxpZCBAYXJnc1xuICAgICAgICBcbiAgICBjbWQ6IChlZGl0b3IsIGNtZCkgLT5cbiAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggY21kXG4gICAgICAgICAgICB3aGVuICdsaXN0JyAgdGhlbiBAbGlzdCBlZGl0b3JcbiAgICAgICAgICAgIHdoZW4gJ2NsZWFyJyB0aGVuIEBjbGVhcigpXG4gICAgICAgICAgICB3aGVuICdhcmdzJyAnZGlycycgdGhlbiBAbGlzdCBlZGl0b3IsIGNtZFxuICAgICAgICBcbiAgICBjbGVhcjogPT4gXG4gICAgICAgIFxuICAgICAgICBAYXJncyA9IHt9XG4gICAgICAgIEBkaXJzID0ge31cbiAgICAgICAgdHJ1ZVxuICAgICAgICBcbiAgICBsaXN0OiAoZWRpdG9yLCBrZXkpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qga2V5XG4gICAgICAgICAgICBAbGlzdCBlZGl0b3IsICdhcmdzJ1xuICAgICAgICAgICAgQGxpc3QgZWRpdG9yLCAnZGlycydcbiAgICAgICAgZWxzZSAgICAgICAgXG4gICAgICAgICAgICBlZGl0b3I/LmFwcGVuZE91dHB1dCBcIlxcbi0tLS0tLS0gI3trZXl9XCJcbiAgICAgICAgICAgIGVkaXRvcj8uYXBwZW5kT3V0cHV0IGtzdHIgQFtrZXldXG4gICAgICAgIHRydWVcblxubW9kdWxlLmV4cG9ydHMgPSBCcmFpblxuIl19
//# sourceURL=../coffee/brain.coffee