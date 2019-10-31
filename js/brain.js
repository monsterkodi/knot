// koffee 1.4.0

/*
0000000    00000000    0000000   000  000   000
000   000  000   000  000   000  000  0000  000
0000000    0000000    000000000  000  000 0 000
000   000  000   000  000   000  000  000  0000
0000000    000   000  000   000  000  000   000
 */
var $, Brain, _, kerror, klog, kstr, post, prefs, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, kerror = ref.kerror, prefs = ref.prefs, kstr = ref.kstr, klog = ref.klog, $ = ref.$, _ = ref._;

Brain = (function() {
    function Brain() {
        this.onCmd = bind(this.onCmd, this);
        this.clear = bind(this.clear, this);
        var c;
        this.especial = ((function() {
            var j, len, ref1, results;
            ref1 = "_-@#";
            results = [];
            for (j = 0, len = ref1.length; j < len; j++) {
                c = ref1[j];
                results.push("\\" + c);
            }
            return results;
        })()).join('');
        this.splitRegExp = new RegExp("[^\\w\\d" + this.especial + "]+", 'g');
        this.headerRegExp = new RegExp("^[0" + this.especial + "]+$");
        this.notSpecialRegExp = new RegExp("[^" + this.especial + "]");
        this.defaultWords = {
            history: {
                count: 999
            },
            cd: {
                count: 999
            },
            alias: {
                count: 666
            },
            clear: {
                count: 0
            },
            help: {
                count: 0
            }
        };
        this.words = prefs.get('brain▸words', _.cloneDeep(this.defaultWords));
        this.cmds = prefs.get('brain▸cmds', {});
        post.on('cmd', this.onCmd);
    }

    Brain.prototype.clear = function() {
        this.words = _.cloneDeep(this.defaultWords);
        return this.cmds = [];
    };

    Brain.prototype.onCmd = function(cmd, cwd) {
        var i, j, k, len, len1, w, words;
        if ((cmd != null ? cmd.split : void 0) == null) {
            return kerror("Brain.onCmd -- no split? " + cmd);
        }
        this.addCmd(cmd);
        words = cmd.split(this.splitRegExp);
        words = words.filter((function(_this) {
            return function(w) {
                if (_this.headerRegExp.test(w)) {
                    return false;
                }
                return true;
            };
        })(this));
        for (j = 0, len = words.length; j < len; j++) {
            w = words[j];
            i = w.search(this.notSpecialRegExp);
            if (i > 0 && w[0] !== "#") {
                w = w.slice(i);
                if (!/^[\-]?[\d]+$/.test(w)) {
                    words.push(w);
                }
            }
        }
        for (k = 0, len1 = words.length; k < len1; k++) {
            w = words[k];
            this.addWord(w);
        }
        prefs.set('brain▸words', this.words);
        return prefs.set('brain▸cmds', this.cmds);
    };

    Brain.prototype.addCmd = function(cmd) {
        var info, ref1, ref2;
        if ((cmd != null ? cmd.length : void 0) < 2) {
            return;
        }
        info = (ref1 = this.cmds[cmd]) != null ? ref1 : {};
        info.count = ((ref2 = info.count) != null ? ref2 : 0) + 1;
        return this.cmds[cmd] = info;
    };

    Brain.prototype.addWord = function(word) {
        var info, ref1, ref2;
        if ((word != null ? word.length : void 0) < 2) {
            return;
        }
        info = (ref1 = this.words[word]) != null ? ref1 : {};
        info.count = ((ref2 = info.count) != null ? ref2 : 0) + 1;
        return this.words[word] = info;
    };

    Brain.prototype.dump = function(editor) {
        var s;
        s = '\nwords\n';
        Object.keys(this.words).sort().map((function(_this) {
            return function(w) {
                return s += "     " + (kstr.rpad(w, 20)) + " " + _this.words[w].count + "\n";
            };
        })(this));
        s += '\ncmds\n';
        Object.keys(this.cmds).sort().map((function(_this) {
            return function(w) {
                return s += "     " + (kstr.rpad(w, 20)) + " " + _this.cmds[w].count + "\n";
            };
        })(this));
        return editor != null ? editor.appendOutput(s) : void 0;
    };

    return Brain;

})();

module.exports = Brain;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhaW4uanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGlEQUFBO0lBQUE7O0FBUUEsTUFBNEMsT0FBQSxDQUFRLEtBQVIsQ0FBNUMsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0IsaUJBQWhCLEVBQXVCLGVBQXZCLEVBQTZCLGVBQTdCLEVBQW1DLFNBQW5DLEVBQXNDOztBQUVoQztJQUVDLGVBQUE7OztBQUVDLFlBQUE7UUFBQSxJQUFDLENBQUEsUUFBRCxHQUFxQjs7QUFBQztBQUFBO2lCQUFBLHNDQUFBOzs2QkFBQSxJQUFBLEdBQUs7QUFBTDs7WUFBRCxDQUF3QixDQUFDLElBQXpCLENBQThCLEVBQTlCO1FBQ3JCLElBQUMsQ0FBQSxXQUFELEdBQXFCLElBQUksTUFBSixDQUFXLFVBQUEsR0FBVyxJQUFDLENBQUEsUUFBWixHQUFxQixJQUFoQyxFQUFvQyxHQUFwQztRQUNyQixJQUFDLENBQUEsWUFBRCxHQUFxQixJQUFJLE1BQUosQ0FBVyxLQUFBLEdBQU0sSUFBQyxDQUFBLFFBQVAsR0FBZ0IsS0FBM0I7UUFDckIsSUFBQyxDQUFBLGdCQUFELEdBQXFCLElBQUksTUFBSixDQUFXLElBQUEsR0FBSyxJQUFDLENBQUEsUUFBTixHQUFlLEdBQTFCO1FBRXJCLElBQUMsQ0FBQSxZQUFELEdBQ0k7WUFBQSxPQUFBLEVBQVE7Z0JBQUEsS0FBQSxFQUFNLEdBQU47YUFBUjtZQUNBLEVBQUEsRUFBRztnQkFBQSxLQUFBLEVBQU0sR0FBTjthQURIO1lBRUEsS0FBQSxFQUFNO2dCQUFBLEtBQUEsRUFBTSxHQUFOO2FBRk47WUFHQSxLQUFBLEVBQU07Z0JBQUEsS0FBQSxFQUFNLENBQU47YUFITjtZQUlBLElBQUEsRUFBSztnQkFBQSxLQUFBLEVBQU0sQ0FBTjthQUpMOztRQU1KLElBQUMsQ0FBQSxLQUFELEdBQVMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxhQUFWLEVBQXdC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LENBQUEsSUFBQSxDQUEvQjtRQUNBLENBQUEsSUFBSztRQUNMLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBQyxDQUFBLElBQWIsQ0FBa0IsQ0FBQyxJQUFuQixDQUFBLENBQXlCLENBQUMsR0FBMUIsQ0FBOEIsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxDQUFEO3VCQUFPLENBQUEsSUFBRyxPQUFBLEdBQU8sQ0FBQyxJQUFJLENBQUMsSUFBTCxDQUFVLENBQVYsRUFBYSxFQUFiLENBQUQsQ0FBUCxHQUF3QixHQUF4QixHQUEyQixLQUFDLENBQUEsSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLEtBQXBDLEdBQTBDO1lBQXBEO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE5QjtnQ0FFQSxNQUFNLENBQUUsWUFBUixDQUFxQixDQUFyQjtJQVBFOzs7Ozs7QUFTVixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBrZXJyb3IsIHByZWZzLCBrc3RyLCBrbG9nLCAkLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEJyYWluXG5cbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgQGVzcGVjaWFsICAgICAgICAgID0gKFwiXFxcXFwiK2MgZm9yIGMgaW4gXCJfLUAjXCIpLmpvaW4gJydcbiAgICAgICAgQHNwbGl0UmVnRXhwICAgICAgID0gbmV3IFJlZ0V4cCBcIlteXFxcXHdcXFxcZCN7QGVzcGVjaWFsfV0rXCIgJ2cnICAgXG4gICAgICAgIEBoZWFkZXJSZWdFeHAgICAgICA9IG5ldyBSZWdFeHAgXCJeWzAje0Blc3BlY2lhbH1dKyRcIlxuICAgICAgICBAbm90U3BlY2lhbFJlZ0V4cCAgPSBuZXcgUmVnRXhwIFwiW14je0Blc3BlY2lhbH1dXCJcbiAgICAgICAgXG4gICAgICAgIEBkZWZhdWx0V29yZHMgPSBcbiAgICAgICAgICAgIGhpc3Rvcnk6Y291bnQ6OTk5XG4gICAgICAgICAgICBjZDpjb3VudDo5OTlcbiAgICAgICAgICAgIGFsaWFzOmNvdW50OjY2NlxuICAgICAgICAgICAgY2xlYXI6Y291bnQ6MFxuICAgICAgICAgICAgaGVscDpjb3VudDowXG4gICAgICAgICAgICBcbiAgICAgICAgQHdvcmRzID0gcHJlZnMuZ2V0ICdicmFpbuKWuHdvcmRzJyBfLmNsb25lRGVlcCBAZGVmYXVsdFdvcmRzXG4gICAgICAgIEBjbWRzICA9IHByZWZzLmdldCAnYnJhaW7ilrhjbWRzJyB7fVxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnY21kJyBAb25DbWRcbiAgICBcbiAgICBjbGVhcjogPT4gXG4gICAgICAgIFxuICAgICAgICBAd29yZHMgPSBfLmNsb25lRGVlcCBAZGVmYXVsdFdvcmRzXG4gICAgICAgIEBjbWRzICA9IFtdXG4gICAgICAgIFxuICAgIG9uQ21kOiAoY21kLCBjd2QpID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBjbWQ/LnNwbGl0PyB0aGVuIHJldHVybiBrZXJyb3IgXCJCcmFpbi5vbkNtZCAtLSBubyBzcGxpdD8gI3tjbWR9XCJcbiAgICAgICAgICAgIFxuICAgICAgICBAYWRkQ21kIGNtZFxuICAgICAgICBcbiAgICAgICAgd29yZHMgPSBjbWQuc3BsaXQgQHNwbGl0UmVnRXhwXG4gICAgICAgIFxuICAgICAgICB3b3JkcyA9IHdvcmRzLmZpbHRlciAodykgPT4gXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgaWYgQGhlYWRlclJlZ0V4cC50ZXN0IHdcbiAgICAgICAgICAgIHRydWVcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgdyBpbiB3b3JkcyAjIGFwcGVuZCB3b3JkcyB3aXRob3V0IGxlYWRpbmcgc3BlY2lhbCBjaGFyYWN0ZXJcbiAgICAgICAgICAgIGkgPSB3LnNlYXJjaCBAbm90U3BlY2lhbFJlZ0V4cFxuICAgICAgICAgICAgaWYgaSA+IDAgYW5kIHdbMF0gIT0gXCIjXCJcbiAgICAgICAgICAgICAgICB3ID0gdy5zbGljZSBpXG4gICAgICAgICAgICAgICAgd29yZHMucHVzaCB3IGlmIG5vdCAvXltcXC1dP1tcXGRdKyQvLnRlc3Qgd1xuICAgIFxuICAgICAgICBmb3IgdyBpbiB3b3Jkc1xuICAgICAgICAgICAgQGFkZFdvcmQgd1xuICAgICAgICBcbiAgICAgICAgcHJlZnMuc2V0ICdicmFpbuKWuHdvcmRzJyBAd29yZHNcbiAgICAgICAgcHJlZnMuc2V0ICdicmFpbuKWuGNtZHMnICBAY21kc1xuICAgIFxuICAgIGFkZENtZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBjbWQ/Lmxlbmd0aCA8IDJcbiAgICAgICAgaW5mbyAgICAgICA9IEBjbWRzW2NtZF0gPyB7fVxuICAgICAgICBpbmZvLmNvdW50ID0gKGluZm8uY291bnQgPyAwKSArIDFcbiAgICAgICAgQGNtZHNbY21kXSA9IGluZm9cbiAgICAgICAgICAgIFxuICAgIGFkZFdvcmQ6ICh3b3JkKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIHdvcmQ/Lmxlbmd0aCA8IDJcbiAgICAgICAgaW5mbyAgICAgICAgID0gQHdvcmRzW3dvcmRdID8ge31cbiAgICAgICAgaW5mby5jb3VudCAgID0gKGluZm8uY291bnQgPyAwKSArIDFcbiAgICAgICAgQHdvcmRzW3dvcmRdID0gaW5mb1xuICAgICAgICBcbiAgICBkdW1wOiAoZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAgcyAgPSAnXFxud29yZHNcXG4nXG4gICAgICAgIE9iamVjdC5rZXlzKEB3b3Jkcykuc29ydCgpLm1hcCAodykgPT4gcys9XCIgICAgICN7a3N0ci5ycGFkIHcsIDIwfSAje0B3b3Jkc1t3XS5jb3VudH1cXG5cIlxuICAgICAgICBzICs9ICdcXG5jbWRzXFxuJ1xuICAgICAgICBPYmplY3Qua2V5cyhAY21kcykuc29ydCgpLm1hcCAodykgPT4gcys9XCIgICAgICN7a3N0ci5ycGFkIHcsIDIwfSAje0BjbWRzW3ddLmNvdW50fVxcblwiXG5cbiAgICAgICAgZWRpdG9yPy5hcHBlbmRPdXRwdXQgc1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJyYWluXG4iXX0=
//# sourceURL=../coffee/brain.coffee