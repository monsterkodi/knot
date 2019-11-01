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
        if (info.chdir) {
            return;
        }
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
        this.cmds = {};
        this.dirs = {};
        return true;
    };

    Brain.prototype.list = function(editor, key) {
        if (!key) {
            this.list(editor, 'args');
            this.list(editor, 'cmds');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhaW4uanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtEQUFBO0lBQUE7O0FBUUEsTUFBNkMsT0FBQSxDQUFRLEtBQVIsQ0FBN0MsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0IsaUJBQWhCLEVBQXVCLGlCQUF2QixFQUE4QixlQUE5QixFQUFvQzs7QUFFOUI7SUFFQyxlQUFBOzs7UUFFQyxJQUFDLENBQUEsV0FBRCxHQUFlO1FBRWYsSUFBQyxDQUFBLElBQUQsR0FBUSxLQUFLLENBQUMsR0FBTixDQUFVLFlBQVYsRUFBdUIsRUFBdkI7UUFDUixJQUFDLENBQUEsSUFBRCxHQUFRLEtBQUssQ0FBQyxHQUFOLENBQVUsWUFBVixFQUF1QixFQUF2QjtRQUNSLElBQUMsQ0FBQSxJQUFELEdBQVEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxZQUFWLEVBQXVCLEVBQXZCO1FBRVIsSUFBSSxDQUFDLEVBQUwsQ0FBUSxLQUFSLEVBQWMsSUFBQyxDQUFBLEtBQWY7SUFSRDs7b0JBVUgsS0FBQSxHQUFPLFNBQUMsSUFBRDtRQUVILElBQVUsSUFBSSxDQUFDLEtBQWY7QUFBQSxtQkFBQTs7UUFFQSxJQUFDLENBQUEsTUFBRCxDQUFRLElBQVI7ZUFDQSxJQUFDLENBQUEsTUFBRCxDQUFRLElBQVI7SUFMRzs7b0JBT1AsTUFBQSxHQUFRLFNBQUMsSUFBRDtBQUVKLFlBQUE7UUFGSyx5Q0FBRSxNQUFJLHlDQUFFO1FBRWIsSUFBRyxHQUFJLFVBQUUsQ0FBQSxDQUFBLENBQU4sS0FBVyxHQUFkO1lBQXVCLEdBQUEsR0FBTSxHQUFJLHdDQUFqQzs7UUFFQSxtQkFBVSxHQUFHLENBQUUsZ0JBQUwsR0FBYyxDQUF4QjtBQUFBLG1CQUFBOztRQUVBLElBQUEsNENBQTBCO1FBQzFCLElBQUksQ0FBQyxLQUFMLEdBQWEsc0NBQWMsQ0FBZCxDQUFBLEdBQW1COztZQUNoQyxJQUFJLENBQUM7O1lBQUwsSUFBSSxDQUFDLE9BQVE7O1FBQ2IsSUFBSSxDQUFDLElBQUssQ0FBQSxHQUFBLENBQVYsR0FBaUIsMENBQWtCLENBQWxCLENBQUEsR0FBdUI7UUFDeEMsSUFBQyxDQUFBLElBQUssQ0FBQSxHQUFBLENBQU4sR0FBYTs7Z0JBRVAsQ0FBQSxHQUFBOztnQkFBQSxDQUFBLEdBQUEsSUFBUTs7UUFDZCxJQUFDLENBQUEsSUFBSyxDQUFBLEdBQUEsQ0FBSyxDQUFBLEdBQUEsQ0FBWCxHQUFrQiwrQ0FBbUIsQ0FBbkIsQ0FBQSxHQUF3QjtRQUUxQyxLQUFLLENBQUMsR0FBTixDQUFVLFlBQVYsRUFBdUIsSUFBQyxDQUFBLElBQXhCO2VBQ0EsS0FBSyxDQUFDLEdBQU4sQ0FBVSxZQUFWLEVBQXVCLElBQUMsQ0FBQSxJQUF4QjtJQWhCSTs7b0JBa0JSLE1BQUEsR0FBUSxTQUFDLElBQUQ7QUFFSixZQUFBO1FBRksseUNBQUU7UUFFUCxJQUFBLEdBQU8sR0FBRyxDQUFDLEtBQUosQ0FBVSxJQUFDLENBQUEsV0FBWDtRQUNQLEdBQUEsR0FBTSxJQUFLLENBQUEsQ0FBQTtRQUNYLElBQUksQ0FBQyxLQUFMLENBQUE7UUFFQSxJQUFBLDRDQUEwQjtRQUMxQixJQUFJLENBQUMsS0FBTCxHQUFhLHNDQUFjLENBQWQsQ0FBQSxHQUFtQjs7WUFDaEMsSUFBSSxDQUFDOztZQUFMLElBQUksQ0FBQyxPQUFROztBQUViLGFBQUEsc0NBQUE7O1lBQ0ksSUFBQSw0Q0FBd0I7WUFDeEIsSUFBSSxDQUFDLEtBQUwsR0FBYSxzQ0FBYyxDQUFkLENBQUEsR0FBbUI7WUFDaEMsSUFBSSxDQUFDLElBQUssQ0FBQSxHQUFBLENBQVYsR0FBaUI7QUFIckI7UUFLQSxJQUFDLENBQUEsSUFBSyxDQUFBLEdBQUEsQ0FBTixHQUFhO1FBRWIsSUFBZ0MsS0FBQSxDQUFNLElBQUMsQ0FBQSxJQUFQLENBQWhDO21CQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsWUFBVixFQUF1QixJQUFDLENBQUEsSUFBeEIsRUFBQTs7SUFqQkk7O29CQW1CUixHQUFBLEdBQUssU0FBQyxNQUFELEVBQVMsR0FBVDtBQUVELGdCQUFPLEdBQVA7QUFBQSxpQkFDUyxNQURUO3VCQUNzQixJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU47QUFEdEIsaUJBRVMsT0FGVDt1QkFFc0IsSUFBQyxDQUFBLEtBQUQsQ0FBQTtBQUZ0QixpQkFHUyxNQUhUO0FBQUEsaUJBR2dCLE1BSGhCO0FBQUEsaUJBR3VCLE1BSHZCO3VCQUdtQyxJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU4sRUFBYyxHQUFkO0FBSG5DO0lBRkM7O29CQU9MLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLElBQUQsR0FBUTtRQUNSLElBQUMsQ0FBQSxJQUFELEdBQVE7UUFDUixJQUFDLENBQUEsSUFBRCxHQUFRO2VBQ1I7SUFMRzs7b0JBT1AsSUFBQSxHQUFNLFNBQUMsTUFBRCxFQUFTLEdBQVQ7UUFFRixJQUFHLENBQUksR0FBUDtZQUNJLElBQUMsQ0FBQSxJQUFELENBQU0sTUFBTixFQUFjLE1BQWQ7WUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLE1BQU4sRUFBYyxNQUFkO1lBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxNQUFOLEVBQWMsTUFBZCxFQUhKO1NBQUEsTUFBQTs7Z0JBS0ksTUFBTSxDQUFFLFlBQVIsQ0FBcUIsWUFBQSxHQUFhLEdBQWxDOzs7Z0JBQ0EsTUFBTSxDQUFFLFlBQVIsQ0FBcUIsSUFBQSxDQUFLLElBQUUsQ0FBQSxHQUFBLENBQVAsQ0FBckI7YUFOSjs7ZUFPQTtJQVRFOzs7Ozs7QUFXVixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBrZXJyb3IsIHByZWZzLCB2YWxpZCwga2xvZywga3N0ciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBCcmFpblxuXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgICAgIEBzcGxpdFJlZ0V4cCA9IC9cXHMrL2dcbiAgICAgICAgXG4gICAgICAgIEBhcmdzID0gcHJlZnMuZ2V0ICdicmFpbuKWuGFyZ3MnIHt9XG4gICAgICAgIEBjbWRzID0gcHJlZnMuZ2V0ICdicmFpbuKWuGNtZHMnIHt9XG4gICAgICAgIEBkaXJzID0gcHJlZnMuZ2V0ICdicmFpbuKWuGRpcnMnIHt9XG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdjbWQnIEBvbkNtZFxuICAgICAgICAgICAgXG4gICAgb25DbWQ6IChpbmZvKSA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGluZm8uY2hkaXJcbiAgICAgICAgXG4gICAgICAgIEBhZGRDbWQgaW5mb1xuICAgICAgICBAYWRkQXJnIGluZm9cbiAgICAgICAgICAgIFxuICAgIGFkZENtZDogKGNtZDosIGN3ZDopIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBjbWRbLTFdID09ICcvJyB0aGVuIGNtZCA9IGNtZFsuLmNtZC5sZW5ndGgtMl1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBjbWQ/Lmxlbmd0aCA8IDJcbiAgICAgICAgXG4gICAgICAgIGluZm8gICAgICAgPSBAY21kc1tjbWRdID8ge31cbiAgICAgICAgaW5mby5jb3VudCA9IChpbmZvLmNvdW50ID8gMCkgKyAxXG4gICAgICAgIGluZm8uZGlycyA/PSB7fVxuICAgICAgICBpbmZvLmRpcnNbY3dkXSA9IChpbmZvLmRpcnNbY3dkXSA/IDApICsgMVxuICAgICAgICBAY21kc1tjbWRdID0gaW5mb1xuICAgICAgICBcbiAgICAgICAgQGRpcnNbY3dkXSA/PSB7fVxuICAgICAgICBAZGlyc1tjd2RdW2NtZF0gPSAoQGRpcnNbY3dkXVtjbWRdID8gMCkgKyAxXG5cbiAgICAgICAgcHJlZnMuc2V0ICdicmFpbuKWuGNtZHMnIEBjbWRzXG4gICAgICAgIHByZWZzLnNldCAnYnJhaW7ilrhkaXJzJyBAZGlyc1xuICAgICAgICBcbiAgICBhZGRBcmc6IChjbWQ6KSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnbCA9IGNtZC5zcGxpdCBAc3BsaXRSZWdFeHBcbiAgICAgICAga2V5ID0gYXJnbFswXVxuICAgICAgICBhcmdsLnNoaWZ0KClcblxuICAgICAgICBpbmZvICAgICAgID0gQGFyZ3Nba2V5XSA/IHt9XG4gICAgICAgIGluZm8uY291bnQgPSAoaW5mby5jb3VudCA/IDApICsgMVxuICAgICAgICBpbmZvLmFyZ3MgPz0ge31cbiAgICAgICAgXG4gICAgICAgIGZvciBhcmcgaW4gYXJnbFxuICAgICAgICAgICAgYXJnaSA9IGluZm8uYXJnc1thcmddID8ge31cbiAgICAgICAgICAgIGFyZ2kuY291bnQgPSAoYXJnaS5jb3VudCA/IDApICsgMVxuICAgICAgICAgICAgaW5mby5hcmdzW2FyZ10gPSBhcmdpXG4gICAgICAgICAgICBcbiAgICAgICAgQGFyZ3Nba2V5XSA9IGluZm9cbiAgICAgICBcbiAgICAgICAgcHJlZnMuc2V0ICdicmFpbuKWuGFyZ3MnIEBhcmdzIGlmIHZhbGlkIEBhcmdzXG4gICAgICAgIFxuICAgIGNtZDogKGVkaXRvciwgY21kKSAtPlxuICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjbWRcbiAgICAgICAgICAgIHdoZW4gJ2xpc3QnICB0aGVuIEBsaXN0IGVkaXRvclxuICAgICAgICAgICAgd2hlbiAnY2xlYXInIHRoZW4gQGNsZWFyKClcbiAgICAgICAgICAgIHdoZW4gJ2NtZHMnICdhcmdzJyAnZGlycycgdGhlbiBAbGlzdCBlZGl0b3IsIGNtZFxuICAgICAgICBcbiAgICBjbGVhcjogPT4gXG4gICAgICAgIFxuICAgICAgICBAYXJncyA9IHt9XG4gICAgICAgIEBjbWRzID0ge31cbiAgICAgICAgQGRpcnMgPSB7fVxuICAgICAgICB0cnVlXG4gICAgICAgIFxuICAgIGxpc3Q6IChlZGl0b3IsIGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBrZXlcbiAgICAgICAgICAgIEBsaXN0IGVkaXRvciwgJ2FyZ3MnXG4gICAgICAgICAgICBAbGlzdCBlZGl0b3IsICdjbWRzJ1xuICAgICAgICAgICAgQGxpc3QgZWRpdG9yLCAnZGlycydcbiAgICAgICAgZWxzZSAgICAgICAgXG4gICAgICAgICAgICBlZGl0b3I/LmFwcGVuZE91dHB1dCBcIlxcbi0tLS0tLS0gI3trZXl9XCJcbiAgICAgICAgICAgIGVkaXRvcj8uYXBwZW5kT3V0cHV0IGtzdHIgQFtrZXldXG4gICAgICAgIHRydWVcblxubW9kdWxlLmV4cG9ydHMgPSBCcmFpblxuIl19
//# sourceURL=../coffee/brain.coffee