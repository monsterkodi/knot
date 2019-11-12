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
            l: 'color-ls',
            ls: 'color-ls',
            la: 'l -a',
            ll: 'l -l',
            lla: 'l -la',
            lso: 'c:/msys64/usr/bin/ls.EXE',
            sl: 'ls',
            al: 'la',
            all: 'lla',
            e: 'electron .',
            ed: 'e -D',
            ps: 'wmic PROCESS GET Name,ProcessId,ParentProcessId'
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7OztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxJQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUVKOzs7SUFFQyxlQUFBO1FBRUMsSUFBQyxDQUFBLEtBQUQsR0FDSTtZQUFBLENBQUEsRUFBUSxPQUFSO1lBQ0EsQ0FBQSxFQUFRLE9BRFI7WUFFQSxDQUFBLEVBQVEsT0FGUjtZQUdBLENBQUEsRUFBUSxTQUhSO1lBSUEsQ0FBQSxFQUFRLHVCQUpSO1lBS0EsR0FBQSxFQUFRLE9BTFI7WUFNQSxFQUFBLEVBQVEsTUFOUjtZQU9BLEdBQUEsRUFBUSxxQkFQUjtZQVFBLEVBQUEsRUFBUSw2REFSUjtZQVNBLEVBQUEsRUFBUSxnRUFUUjtZQVVBLEVBQUEsRUFBUSxnRkFWUjtZQVdBLEVBQUEsRUFBUSxrRUFYUjtZQVlBLEVBQUEsRUFBUSxzRUFaUjtZQWFBLEVBQUEsRUFBUSxvRUFiUjtZQWNBLEVBQUEsRUFBUSxNQWRSO1lBZUEsRUFBQSxFQUFRLE1BZlI7WUFnQkEsRUFBQSxFQUFRLE1BaEJSO1lBaUJBLEVBQUEsRUFBUSxNQWpCUjtZQWtCQSxFQUFBLEVBQVEsTUFsQlI7WUFtQkEsRUFBQSxFQUFRLE1BbkJSO1lBb0JBLEVBQUEsRUFBUSxNQXBCUjtZQXFCQSxFQUFBLEVBQVEsTUFyQlI7WUFzQkEsRUFBQSxFQUFRLE1BdEJSO1lBdUJBLEVBQUEsRUFBUSxNQXZCUjtZQXdCQSxFQUFBLEVBQVEsTUF4QlI7WUF5QkEsQ0FBQSxFQUFRLFVBekJSO1lBMEJBLEVBQUEsRUFBUSxVQTFCUjtZQTJCQSxFQUFBLEVBQVEsTUEzQlI7WUE0QkEsRUFBQSxFQUFRLE1BNUJSO1lBNkJBLEdBQUEs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QUF3QixDQUFELEdBQUcsR0FBSCxHQUFNLENBQTdCO0FBREosYUFESjs7ZUFHQTtJQUxNOztvQkFPVixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtRQUFBLEdBQUEsR0FBTSxHQUFJLFNBQUksQ0FBQyxJQUFULENBQUE7UUFDTixJQUFnQixLQUFBLENBQU0sR0FBTixDQUFoQjtZQUFBLEdBQUEsR0FBTSxPQUFOOztlQUNBLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsTUFBbEIsRUFBMEIsR0FBMUI7SUFKTTs7b0JBTVYsT0FBQSxHQUFTLFNBQUMsR0FBRDtBQUVMLFlBQUE7UUFBQSxHQUFBLEdBQU0sR0FBSSxTQUFJLENBQUMsSUFBVCxDQUFBO1FBQ04sSUFBZ0IsS0FBQSxDQUFNLEdBQU4sQ0FBaEI7WUFBQSxHQUFBLEdBQU0sT0FBTjs7QUFDQSxnQkFBTyxHQUFQO0FBQUEsaUJBQ1MsT0FEVDtnQkFDc0IsT0FBTyxDQUFDLEtBQVIsQ0FBQTtBQUFiO0FBRFQ7QUFFUyx1QkFBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFkLENBQWtCLEdBQWxCO0FBRmhCO2VBR0E7SUFQSzs7OztHQXhGTzs7QUFpR3BCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiMjI1xuXG57IHNsYXNoLCBlbXB0eSB9ID0gcmVxdWlyZSAna3hrJ1xuXG5DbW1kICAgID0gcmVxdWlyZSAnLi9jbW1kJ1xuSGlzdG9yeSA9IHJlcXVpcmUgJy4vaGlzdG9yeSdcblxuY2xhc3MgQWxpYXMgZXh0ZW5kcyBDbW1kXG4gICAgXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgICAgIEBhbGlhcyA9IFxuICAgICAgICAgICAgYTogICAgICAnYWxpYXMnXG4gICAgICAgICAgICBiOiAgICAgICdicmFpbidcbiAgICAgICAgICAgIGM6ICAgICAgJ2NsZWFyJ1xuICAgICAgICAgICAgaDogICAgICAnaGlzdG9yeSdcbiAgICAgICAgICAgIGs6ICAgICAgJ34vcy9rb25yYWQvYmluL2tvbnJhZCdcbiAgICAgICAgICAgIGNsczogICAgJ2NsZWFyJ1xuICAgICAgICAgICAgY2w6ICAgICAnYyYmbCdcbiAgICAgICAgICAgIGNkbDogICAgJ2NkICQkICYmIGNsZWFyICYmIGwnXG4gICAgICAgICAgICBubDogICAgICducG0gbHMgLS1kZXB0aCAwIDI+JjEgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5nOiAgICAgJ25wbSBscyAtLWRlcHRoIDAgLWcgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmk6ICAgICAnbnBtIGluc3RhbGwgLS1sb2dsZXZlbCBzaWxlbnQgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uICYmIG5sJ1xuICAgICAgICAgICAgbmE6ICAgICAnbnBtIGluc3RhbGwgLS1zYXZlICQkIDI+JjEgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5kOiAgICAgJ25wbSBpbnN0YWxsIC0tc2F2ZS1kZXYgJCQgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbnI6ICAgICAnbnBtIHVuaW5zdGFsbCAtLXNhdmUgJCQgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAga3M6ICAgICAnayAtcydcbiAgICAgICAgICAgIGtkOiAgICAgJ2sgLWQnXG4gICAgICAgICAgICBrYzogICAgICdrIC1jJ1xuICAgICAgICAgICAga2I6ICAgICAnayAtYidcbiAgICAgICAgICAgIGtmOiAgICAgJ2sgLWYnXG4gICAgICAgICAgICBrdDogICAgICdrIC10J1xuICAgICAgICAgICAga3U6ICAgICAnayAtdSdcbiAgICAgICAgICAgIGtpOiAgICAgJ2sgLWknXG4gICAgICAgICAgICBrcDogICAgICdrIC1wJ1xuICAgICAgICAgICAga206ICAgICAnayAtbSdcbiAgICAgICAgICAgIGtSOiAgICAgJ2sgLVInXG4gICAgICAgICAgICBsOiAgICAgICdjb2xvci1scydcbiAgICAgICAgICAgIGxzOiAgICAgJ2NvbG9yLWxzJ1xuICAgICAgICAgICAgbGE6ICAgICAnbCAtYSdcbiAgICAgICAgICAgIGxsOiAgICAgJ2wgLWwnXG4gICAgICAgICAgICBsbGE6ICAgICdsIC1sYSdcbiAgICAgICAgICAgIGxzbzogICAgJ2M6L21zeXM2NC91c3IvYmluL2xzLkVYRSdcbiAgICAgICAgICAgIHNsOiAgICAgJ2xzJ1xuICAgICAgICAgICAgYWw6ICAgICAnbGEnXG4gICAgICAgICAgICBhbGw6ICAgICdsbGEnXG4gICAgICAgICAgICBlOiAgICAgICdlbGVjdHJvbiAuJ1xuICAgICAgICAgICAgZWQ6ICAgICAnZSAtRCdcbiAgICAgICAgICAgIHBzOiAgICAgJ3dtaWMgUFJPQ0VTUyBHRVQgTmFtZSxQcm9jZXNzSWQsUGFyZW50UHJvY2Vzc0lkJ1xuICAgICAgICBzdXBlclxuXG4gICAgc3Vic3RpdHV0ZTogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBhIGluIE9iamVjdC5rZXlzIEBhbGlhc1xuICAgICAgICAgICAgaWYgY21kLnN0YXJ0c1dpdGggYSArICcgJ1xuICAgICAgICAgICAgICAgIGFsaWFzID0gQGFsaWFzW2FdXG4gICAgICAgICAgICAgICAgaWYgYWxpYXMuaW5kZXhPZignJCQnKSA+PSAwXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGlhcy5yZXBsYWNlICckJCcgY21kW2EubGVuZ3RoKzEuLl0udHJpbSgpXG4gICAgICAgIGNtZFxuICAgICAgICBcbiAgICBvbkNvbW1hbmQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYSBpbiBPYmplY3Qua2V5cyBAYWxpYXNcbiAgICAgICAgICAgIGlmIGNtZCA9PSBhIG9yIGNtZC5zdGFydHNXaXRoIGEgKyAnICdcbiAgICAgICAgICAgICAgICByZXR1cm4gQHNoZWxsLmVucXVldWUgY21kOkBhbGlhc1thXSArIGNtZFthLmxlbmd0aC4uXSwgZnJvbnQ6dHJ1ZSwgYWxpYXM6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgY21kID09ICdoaXN0b3J5JyBvciBjbWQuc3RhcnRzV2l0aCAnaGlzdG9yeSAnIHRoZW4gcmV0dXJuIEBoaXN0Q21kICBjbWRcbiAgICAgICAgaWYgY21kID09ICdicmFpbicgICBvciBjbWQuc3RhcnRzV2l0aCAnYnJhaW4gJyAgIHRoZW4gcmV0dXJuIEBicmFpbkNtZCBjbWRcbiAgICAgICAgaWYgY21kID09ICdhbGlhcycgICBvciBjbWQuc3RhcnRzV2l0aCAnYWxpYXMgJyAgIHRoZW4gcmV0dXJuIEBhbGlhc0NtZCBjbWRcbiAgICAgICAgaWYgY21kID09ICdwYXRoJyAgICBvciBjbWQuc3RhcnRzV2l0aCAncGF0aCAnICAgIHRoZW4gcmV0dXJuIEBwYXRoc0NtZCBjbWRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNtZFxuICAgICAgICAgICAgd2hlbiAnY2xlYXInICAgdGhlbiByZXR1cm4gQHRlcm0uY2xlYXIoKVxuICAgICAgICAgICAgd2hlbiAnY3dkJyAgICAgdGhlbiByZXR1cm4gQGVkaXRvci5hcHBlbmRPdXRwdXQgc2xhc2gucGF0aCBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICB3aGVuICdibGluaycgICB0aGVuIHJldHVybiBAZWRpdG9yLnRvZ2dsZUJsaW5rKClcblxuICAgIHBhdGhzQ21kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnID0gY21kWzYuLl0udHJpbSgpXG4gICAgICAgIGFyZyA9ICdsaXN0JyBpZiBlbXB0eSBhcmdcbiAgICAgICAgQHNoZWxsLnBhdGhzLmNtZCBAZWRpdG9yLCBhcmdcbiAgICAgICAgICAgIFxuICAgIGFsaWFzQ21kOiAoY21kKSAtPiAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIGNtZCA9PSAnYWxpYXMnXG4gICAgICAgICAgICBmb3Igayx2IG9mIEBhbGlhc1xuICAgICAgICAgICAgICAgIEBlZGl0b3IuYXBwZW5kT3V0cHV0IFwiI3trfSAje3Z9XCJcbiAgICAgICAgdHJ1ZVxuXG4gICAgYnJhaW5DbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBhcmcgPSBjbWRbNi4uXS50cmltKClcbiAgICAgICAgYXJnID0gJ2xpc3QnIGlmIGVtcHR5IGFyZ1xuICAgICAgICB3aW5kb3cuYnJhaW4uY21kIEBlZGl0b3IsIGFyZ1xuICAgICAgICBcbiAgICBoaXN0Q21kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnID0gY21kWzguLl0udHJpbSgpXG4gICAgICAgIGFyZyA9ICdsaXN0JyBpZiBlbXB0eSBhcmdcbiAgICAgICAgc3dpdGNoIGFyZ1xuICAgICAgICAgICAgd2hlbiAnY2xlYXInIHRoZW4gSGlzdG9yeS5jbGVhcigpXG4gICAgICAgICAgICBlbHNlIHJldHVybiBAdGVybS5oaXN0b3J5LmNtZCBhcmdcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQWxpYXNcbiJdfQ==
//# sourceURL=../coffee/alias.coffee