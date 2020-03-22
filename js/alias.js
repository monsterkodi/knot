// koffee 1.4.0

/*
 0000000   000      000   0000000    0000000
000   000  000      000  000   000  000     
000000000  000      000  000000000  0000000 
000   000  000      000  000   000       000
000   000  0000000  000  000   000  0000000
 */
var Alias, Cmmd, History, empty, ref, slash,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), slash = ref.slash, empty = ref.empty;

Cmmd = require('./cmmd');

History = require('./history');

Alias = (function(superClass) {
    extend(Alias, superClass);

    function Alias() {
        this.alias = {
            a: 'alias',
            b: 'brain',
            c: 'clear',
            h: 'history',
            k: '~/s/konrad/bin/konrad',
            cls: 'clear',
            cl: 'c&&l',
            cdl: 'cd $$ && clear && l',
            nl: 'npm ls --depth 0 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon',
            ng: 'npm ls --depth 0 -g 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon',
            ni: 'npm install --loglevel silent 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon && nl',
            na: 'npm install --save $$ 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon',
            nd: 'npm install --save-dev $$ 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon',
            nr: 'npm uninstall --save $$ 2>&1 | colorcat -sP ~/s/konrad/cc/npm.noon',
            ks: 'k -s',
            kd: 'k -d',
            kc: 'k -c',
            kb: 'k -b',
            kf: 'k -f',
            kt: 'k -t',
            ku: 'k -u',
            ki: 'k -i',
            kp: 'k -p',
            km: 'k -m',
            kR: 'k -R',
            l: 'color-ls -n',
            ls: 'color-ls -n',
            la: 'l -a',
            ll: 'l -l',
            lla: 'l -la',
            lso: 'c:/msys64/usr/bin/ls.EXE',
            sl: 'ls',
            al: 'la',
            all: 'lla',
            pull: 'git pull',
            revert: 'git checkout -- .',
            e: 'electron .',
            ed: 'e -D',
            ps: 'wmic PROCESS GET Name,ProcessId,ParentProcessId',
            gimp: '"C:/Program Files/GIMP 2/bin/gimp-2.10.exe"'
        };
        Alias.__super__.constructor.apply(this, arguments);
    }

    Alias.prototype.substitute = function(cmd) {
        var a, alias, i, len, ref1;
        ref1 = Object.keys(this.alias);
        for (i = 0, len = ref1.length; i < len; i++) {
            a = ref1[i];
            if (cmd.startsWith(a + ' ')) {
                alias = this.alias[a];
                if (alias.indexOf('$$') >= 0) {
                    return alias.replace('$$', cmd.slice(a.length + 1).trim());
                }
            }
        }
        return cmd;
    };

    Alias.prototype.onCommand = function(cmd) {
        var a, i, len, ref1;
        ref1 = Object.keys(this.alias);
        for (i = 0, len = ref1.length; i < len; i++) {
            a = ref1[i];
            if (cmd === a || cmd.startsWith(a + ' ')) {
                return this.shell.enqueue({
                    cmd: this.alias[a] + cmd.slice(a.length),
                    front: true,
                    alias: true
                });
            }
        }
        if (cmd === 'history' || cmd.startsWith('history ')) {
            return this.histCmd(cmd);
        }
        if (cmd === 'brain' || cmd.startsWith('brain ')) {
            return this.brainCmd(cmd);
        }
        if (cmd === 'alias' || cmd.startsWith('alias ')) {
            return this.aliasCmd(cmd);
        }
        if (cmd === 'path' || cmd.startsWith('path ')) {
            return this.pathsCmd(cmd);
        }
        switch (cmd) {
            case 'clear':
                return this.term.clear();
            case 'cwd':
                return this.editor.appendOutput(slash.path(process.cwd()));
            case 'blink':
                return this.editor.toggleBlink();
        }
    };

    Alias.prototype.pathsCmd = function(cmd) {
        var arg;
        arg = cmd.slice(6).trim();
        if (empty(arg)) {
            arg = 'list';
        }
        return this.shell.paths.cmd(this.editor, arg);
    };

    Alias.prototype.aliasCmd = function(cmd) {
        var k, ref1, v;
        if (cmd === 'alias') {
            ref1 = this.alias;
            for (k in ref1) {
                v = ref1[k];
                this.editor.appendOutput(k + " " + v);
            }
        }
        return true;
    };

    Alias.prototype.brainCmd = function(cmd) {
        var arg;
        arg = cmd.slice(6).trim();
        if (empty(arg)) {
            arg = 'list';
        }
        return window.brain.cmd(this.editor, arg);
    };

    Alias.prototype.histCmd = function(cmd) {
        var arg;
        arg = cmd.slice(8).trim();
        if (empty(arg)) {
            arg = 'list';
        }
        switch (arg) {
            case 'clear':
                History.clear();
                break;
            default:
                return this.term.history.cmd(arg);
        }
        return true;
    };

    return Alias;

})(Cmmd);

module.exports = Alias;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7OztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxJQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUVKOzs7SUFFQyxlQUFBO1FBRUMsSUFBQyxDQUFBLEtBQUQsR0FDSTtZQUFBLENBQUEsRUFBUSxPQUFSO1lBQ0EsQ0FBQSxFQUFRLE9BRFI7WUFFQSxDQUFBLEVBQVEsT0FGUjtZQUdBLENBQUEsRUFBUSxTQUhSO1lBSUEsQ0FBQSxFQUFRLHVCQUpSO1lBS0EsR0FBQSxFQUFRLE9BTFI7WUFNQSxFQUFBLEVBQVEsTUFOUjtZQU9BLEdBQUEsRUFBUSxxQkFQUjtZQVFBLEVBQUEsRUFBUSw2REFSUjtZQVNBLEVBQUEsRUFBUSxnRUFUUjtZQVVBLEVBQUEsRUFBUSxnRkFWUjtZQVdBLEVBQUEsRUFBUSxrRUFYUjtZQVlBLEVBQUEsRUFBUSxzRUFaUjtZQWFBLEVBQUEsRUFBUSxvRUFiUjtZQWNBLEVBQUEsRUFBUSxNQWRSO1lBZUEsRUFBQSxFQUFRLE1BZlI7WUFnQkEsRUFBQSxFQUFRLE1BaEJSO1lBaUJBLEVBQUEsRUFBUSxNQWpCUjtZQWtCQSxFQUFBLEVBQVEsTUFsQlI7WUFtQkEsRUFBQSxFQUFRLE1BbkJSO1lBb0JBLEVBQUEsRUFBUSxNQXBCUjtZQXFCQSxFQUFBLEVBQVEsTUFyQlI7WUFzQkEsRUFBQSxFQUFRLE1BdEJSO1lBdUJBLEVBQUEsRUFBUSxNQXZCUjtZQXdCQSxFQUFBLEVBQVEsTUF4QlI7WUF5QkEsQ0FBQSxFQUFRLGFBekJSO1lBMEJBLEVBQUEsRUFBUSxhQTFCUjtZQTJCQSxFQUFBLEVBQVEsTUEzQlI7WUE0QkEsRUFBQSxFQUFRLE1BNUJSO1lBNkJBLEdBQUEs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QUFBLEtBQU8sT0FBVjtBQUNJO0FBQUEsaUJBQUEsU0FBQTs7Z0JBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXdCLENBQUQsR0FBRyxHQUFILEdBQU0sQ0FBN0I7QUFESixhQURKOztlQUdBO0lBTE07O29CQU9WLFFBQUEsR0FBVSxTQUFDLEdBQUQ7QUFFTixZQUFBO1FBQUEsR0FBQSxHQUFNLEdBQUksU0FBSSxDQUFDLElBQVQsQ0FBQTtRQUNOLElBQWdCLEtBQUEsQ0FBTSxHQUFOLENBQWhCO1lBQUEsR0FBQSxHQUFNLE9BQU47O2VBQ0EsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxNQUFsQixFQUEwQixHQUExQjtJQUpNOztvQkFNVixPQUFBLEdBQVMsU0FBQyxHQUFEO0FBRUwsWUFBQTtRQUFBLEdBQUEsR0FBTSxHQUFJLFNBQUksQ0FBQyxJQUFULENBQUE7UUFDTixJQUFnQixLQUFBLENBQU0sR0FBTixDQUFoQjtZQUFBLEdBQUEsR0FBTSxPQUFOOztBQUNBLGdCQUFPLEdBQVA7QUFBQSxpQkFDUyxPQURUO2dCQUNzQixPQUFPLENBQUMsS0FBUixDQUFBO0FBQWI7QUFEVDtBQUVTLHVCQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQWQsQ0FBa0IsR0FBbEI7QUFGaEI7ZUFHQTtJQVBLOzs7O0dBM0ZPOztBQW9HcEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIFxuMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4wMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwIFxuIyMjXG5cbnsgc2xhc2gsIGVtcHR5IH0gPSByZXF1aXJlICdreGsnXG5cbkNtbWQgICAgPSByZXF1aXJlICcuL2NtbWQnXG5IaXN0b3J5ID0gcmVxdWlyZSAnLi9oaXN0b3J5J1xuXG5jbGFzcyBBbGlhcyBleHRlbmRzIENtbWRcbiAgICBcbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgQGFsaWFzID0gXG4gICAgICAgICAgICBhOiAgICAgICdhbGlhcydcbiAgICAgICAgICAgIGI6ICAgICAgJ2JyYWluJ1xuICAgICAgICAgICAgYzogICAgICAnY2xlYXInXG4gICAgICAgICAgICBoOiAgICAgICdoaXN0b3J5J1xuICAgICAgICAgICAgazogICAgICAnfi9zL2tvbnJhZC9iaW4va29ucmFkJ1xuICAgICAgICAgICAgY2xzOiAgICAnY2xlYXInXG4gICAgICAgICAgICBjbDogICAgICdjJiZsJ1xuICAgICAgICAgICAgY2RsOiAgICAnY2QgJCQgJiYgY2xlYXIgJiYgbCdcbiAgICAgICAgICAgIG5sOiAgICAgJ25wbSBscyAtLWRlcHRoIDAgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmc6ICAgICAnbnBtIGxzIC0tZGVwdGggMCAtZyAyPiYxIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuaTogICAgICducG0gaW5zdGFsbCAtLWxvZ2xldmVsIHNpbGVudCAyPiYxIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24gJiYgbmwnXG4gICAgICAgICAgICBuYTogICAgICducG0gaW5zdGFsbCAtLXNhdmUgJCQgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmQ6ICAgICAnbnBtIGluc3RhbGwgLS1zYXZlLWRldiAkJCAyPiYxIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBucjogICAgICducG0gdW5pbnN0YWxsIC0tc2F2ZSAkJCAyPiYxIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBrczogICAgICdrIC1zJ1xuICAgICAgICAgICAga2Q6ICAgICAnayAtZCdcbiAgICAgICAgICAgIGtjOiAgICAgJ2sgLWMnXG4gICAgICAgICAgICBrYjogICAgICdrIC1iJ1xuICAgICAgICAgICAga2Y6ICAgICAnayAtZidcbiAgICAgICAgICAgIGt0OiAgICAgJ2sgLXQnXG4gICAgICAgICAgICBrdTogICAgICdrIC11J1xuICAgICAgICAgICAga2k6ICAgICAnayAtaSdcbiAgICAgICAgICAgIGtwOiAgICAgJ2sgLXAnXG4gICAgICAgICAgICBrbTogICAgICdrIC1tJ1xuICAgICAgICAgICAga1I6ICAgICAnayAtUidcbiAgICAgICAgICAgIGw6ICAgICAgJ2NvbG9yLWxzIC1uJ1xuICAgICAgICAgICAgbHM6ICAgICAnY29sb3ItbHMgLW4nXG4gICAgICAgICAgICBsYTogICAgICdsIC1hJ1xuICAgICAgICAgICAgbGw6ICAgICAnbCAtbCdcbiAgICAgICAgICAgIGxsYTogICAgJ2wgLWxhJ1xuICAgICAgICAgICAgbHNvOiAgICAnYzovbXN5czY0L3Vzci9iaW4vbHMuRVhFJ1xuICAgICAgICAgICAgc2w6ICAgICAnbHMnXG4gICAgICAgICAgICBhbDogICAgICdsYSdcbiAgICAgICAgICAgIGFsbDogICAgJ2xsYSdcbiAgICAgICAgICAgIHB1bGw6ICAgJ2dpdCBwdWxsJ1xuICAgICAgICAgICAgcmV2ZXJ0OiAnZ2l0IGNoZWNrb3V0IC0tIC4nXG4gICAgICAgICAgICBlOiAgICAgICdlbGVjdHJvbiAuJ1xuICAgICAgICAgICAgZWQ6ICAgICAnZSAtRCdcbiAgICAgICAgICAgIHBzOiAgICAgJ3dtaWMgUFJPQ0VTUyBHRVQgTmFtZSxQcm9jZXNzSWQsUGFyZW50UHJvY2Vzc0lkJ1xuICAgICAgICAgICAgZ2ltcDogICAnXCJDOi9Qcm9ncmFtIEZpbGVzL0dJTVAgMi9iaW4vZ2ltcC0yLjEwLmV4ZVwiJ1xuICAgICAgICBzdXBlclxuXG4gICAgc3Vic3RpdHV0ZTogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBhIGluIE9iamVjdC5rZXlzIEBhbGlhc1xuICAgICAgICAgICAgaWYgY21kLnN0YXJ0c1dpdGggYSArICcgJ1xuICAgICAgICAgICAgICAgIGFsaWFzID0gQGFsaWFzW2FdXG4gICAgICAgICAgICAgICAgaWYgYWxpYXMuaW5kZXhPZignJCQnKSA+PSAwXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGlhcy5yZXBsYWNlICckJCcgY21kW2EubGVuZ3RoKzEuLl0udHJpbSgpXG4gICAgICAgIGNtZFxuICAgICAgICBcbiAgICBvbkNvbW1hbmQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYSBpbiBPYmplY3Qua2V5cyBAYWxpYXNcbiAgICAgICAgICAgIGlmIGNtZCA9PSBhIG9yIGNtZC5zdGFydHNXaXRoIGEgKyAnICdcbiAgICAgICAgICAgICAgICByZXR1cm4gQHNoZWxsLmVucXVldWUgY21kOkBhbGlhc1thXSArIGNtZFthLmxlbmd0aC4uXSwgZnJvbnQ6dHJ1ZSwgYWxpYXM6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgY21kID09ICdoaXN0b3J5JyBvciBjbWQuc3RhcnRzV2l0aCAnaGlzdG9yeSAnIHRoZW4gcmV0dXJuIEBoaXN0Q21kICBjbWRcbiAgICAgICAgaWYgY21kID09ICdicmFpbicgICBvciBjbWQuc3RhcnRzV2l0aCAnYnJhaW4gJyAgIHRoZW4gcmV0dXJuIEBicmFpbkNtZCBjbWRcbiAgICAgICAgaWYgY21kID09ICdhbGlhcycgICBvciBjbWQuc3RhcnRzV2l0aCAnYWxpYXMgJyAgIHRoZW4gcmV0dXJuIEBhbGlhc0NtZCBjbWRcbiAgICAgICAgaWYgY21kID09ICdwYXRoJyAgICBvciBjbWQuc3RhcnRzV2l0aCAncGF0aCAnICAgIHRoZW4gcmV0dXJuIEBwYXRoc0NtZCBjbWRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNtZFxuICAgICAgICAgICAgd2hlbiAnY2xlYXInICAgdGhlbiByZXR1cm4gQHRlcm0uY2xlYXIoKVxuICAgICAgICAgICAgd2hlbiAnY3dkJyAgICAgdGhlbiByZXR1cm4gQGVkaXRvci5hcHBlbmRPdXRwdXQgc2xhc2gucGF0aCBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICB3aGVuICdibGluaycgICB0aGVuIHJldHVybiBAZWRpdG9yLnRvZ2dsZUJsaW5rKClcblxuICAgIHBhdGhzQ21kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnID0gY21kWzYuLl0udHJpbSgpXG4gICAgICAgIGFyZyA9ICdsaXN0JyBpZiBlbXB0eSBhcmdcbiAgICAgICAgQHNoZWxsLnBhdGhzLmNtZCBAZWRpdG9yLCBhcmdcbiAgICAgICAgICAgIFxuICAgIGFsaWFzQ21kOiAoY21kKSAtPiAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIGNtZCA9PSAnYWxpYXMnXG4gICAgICAgICAgICBmb3Igayx2IG9mIEBhbGlhc1xuICAgICAgICAgICAgICAgIEBlZGl0b3IuYXBwZW5kT3V0cHV0IFwiI3trfSAje3Z9XCJcbiAgICAgICAgdHJ1ZVxuXG4gICAgYnJhaW5DbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBhcmcgPSBjbWRbNi4uXS50cmltKClcbiAgICAgICAgYXJnID0gJ2xpc3QnIGlmIGVtcHR5IGFyZ1xuICAgICAgICB3aW5kb3cuYnJhaW4uY21kIEBlZGl0b3IsIGFyZ1xuICAgICAgICBcbiAgICBoaXN0Q21kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnID0gY21kWzguLl0udHJpbSgpXG4gICAgICAgIGFyZyA9ICdsaXN0JyBpZiBlbXB0eSBhcmdcbiAgICAgICAgc3dpdGNoIGFyZ1xuICAgICAgICAgICAgd2hlbiAnY2xlYXInIHRoZW4gSGlzdG9yeS5jbGVhcigpXG4gICAgICAgICAgICBlbHNlIHJldHVybiBAdGVybS5oaXN0b3J5LmNtZCBhcmdcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQWxpYXNcbiJdfQ==
//# sourceURL=../coffee/alias.coffee