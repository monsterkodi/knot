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
            nl: 'npm ls --depth 0 | colorcat -sP ~/s/konrad/cc/npm.noon',
            ng: 'npm ls --depth 0 -g | colorcat -sP ~/s/konrad/cc/npm.noon',
            ni: 'npm install && nl',
            na: 'npm install --save $$ | colorcat -sP ~/s/konrad/cc/npm.noon',
            nd: 'npm install --save-dev $$ | colorcat -sP ~/s/konrad/cc/npm.noon',
            nr: 'npm uninstall --save $$ | colorcat -sP ~/s/konrad/cc/npm.noon',
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
        switch (cmd) {
            case 'clear':
                return this.term.clear();
            case 'cwd':
                return this.editor.appendOutput(slash.path(process.cwd()));
            case 'blink':
                return this.editor.toggleBlink();
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7OztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxJQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUVKOzs7SUFFQyxlQUFBO1FBRUMsSUFBQyxDQUFBLEtBQUQsR0FDSTtZQUFBLENBQUEsRUFBUSxPQUFSO1lBQ0EsQ0FBQSxFQUFRLE9BRFI7WUFFQSxDQUFBLEVBQVEsT0FGUjtZQUdBLENBQUEsRUFBUSxTQUhSO1lBSUEsQ0FBQSxFQUFRLHVCQUpSO1lBS0EsR0FBQSxFQUFRLE9BTFI7WUFNQSxFQUFBLEVBQVEsTUFOUjtZQU9BLEdBQUEsRUFBUSxxQkFQUjtZQVFBLEVBQUEsRUFBUSx3REFSUjtZQVNBLEVBQUEsRUFBUSwyREFUUjtZQVVBLEVBQUEsRUFBUSxtQkFWUjtZQVdBLEVBQUEsRUFBUSw2REFYUjtZQVlBLEVBQUEsRUFBUSxpRUFaUjtZQWFBLEVBQUEsRUFBUSwrREFiUjtZQWNBLEVBQUEsRUFBUSxNQWRSO1lBZUEsRUFBQSxFQUFRLE1BZlI7WUFnQkEsRUFBQSxFQUFRLE1BaEJSO1lBaUJBLEVBQUEsRUFBUSxNQWpCUjtZQWtCQSxFQUFBLEVBQVEsTUFsQlI7WUFtQkEsRUFBQSxFQUFRLE1BbkJSO1lBb0JBLEVBQUEsRUFBUSxNQXBCUjtZQXFCQSxFQUFBLEVBQVEsTUFyQlI7WUFzQkEsRUFBQSxFQUFRLE1BdEJSO1lBdUJBLEVBQUEsRUFBUSxNQXZCUjtZQXdCQSxFQUFBLEVBQVEsTUF4QlI7WUF5QkEsQ0FBQSxFQUFRLFVBekJSO1lBMEJBLEVBQUEsRUFBUSxVQTFCUjtZQTJCQSxFQUFBLEVBQVEsTUEzQlI7WUE0QkEsRUFBQSxFQUFRLE1BNUJSO1lBNkJBLEdBQUEs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QyxJQUFULENBQUE7UUFDTixJQUFnQixLQUFBLENBQU0sR0FBTixDQUFoQjtZQUFBLEdBQUEsR0FBTSxPQUFOOztBQUNBLGdCQUFPLEdBQVA7QUFBQSxpQkFDUyxPQURUO2dCQUNzQixPQUFPLENBQUMsS0FBUixDQUFBO0FBQWI7QUFEVDtBQUVTLHVCQUFPLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQWQsQ0FBa0IsR0FBbEI7QUFGaEI7ZUFHQTtJQVBLOzs7O0dBakZPOztBQTBGcEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIFxuMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4wMDAgICAwMDAgIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwIFxuIyMjXG5cbnsgc2xhc2gsIGVtcHR5IH0gPSByZXF1aXJlICdreGsnXG5cbkNtbWQgICAgPSByZXF1aXJlICcuL2NtbWQnXG5IaXN0b3J5ID0gcmVxdWlyZSAnLi9oaXN0b3J5J1xuXG5jbGFzcyBBbGlhcyBleHRlbmRzIENtbWRcbiAgICBcbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgQGFsaWFzID0gXG4gICAgICAgICAgICBhOiAgICAgICdhbGlhcydcbiAgICAgICAgICAgIGI6ICAgICAgJ2JyYWluJ1xuICAgICAgICAgICAgYzogICAgICAnY2xlYXInXG4gICAgICAgICAgICBoOiAgICAgICdoaXN0b3J5J1xuICAgICAgICAgICAgazogICAgICAnfi9zL2tvbnJhZC9iaW4va29ucmFkJ1xuICAgICAgICAgICAgY2xzOiAgICAnY2xlYXInXG4gICAgICAgICAgICBjbDogICAgICdjJiZsJ1xuICAgICAgICAgICAgY2RsOiAgICAnY2QgJCQgJiYgY2xlYXIgJiYgbCdcbiAgICAgICAgICAgIG5sOiAgICAgJ25wbSBscyAtLWRlcHRoIDAgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5nOiAgICAgJ25wbSBscyAtLWRlcHRoIDAgLWcgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5pOiAgICAgJ25wbSBpbnN0YWxsICYmIG5sJ1xuICAgICAgICAgICAgbmE6ICAgICAnbnBtIGluc3RhbGwgLS1zYXZlICQkIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZDogICAgICducG0gaW5zdGFsbCAtLXNhdmUtZGV2ICQkIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBucjogICAgICducG0gdW5pbnN0YWxsIC0tc2F2ZSAkJCB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAga3M6ICAgICAnayAtcydcbiAgICAgICAgICAgIGtkOiAgICAgJ2sgLWQnXG4gICAgICAgICAgICBrYzogICAgICdrIC1jJ1xuICAgICAgICAgICAga2I6ICAgICAnayAtYidcbiAgICAgICAgICAgIGtmOiAgICAgJ2sgLWYnXG4gICAgICAgICAgICBrdDogICAgICdrIC10J1xuICAgICAgICAgICAga3U6ICAgICAnayAtdSdcbiAgICAgICAgICAgIGtpOiAgICAgJ2sgLWknXG4gICAgICAgICAgICBrcDogICAgICdrIC1wJ1xuICAgICAgICAgICAga206ICAgICAnayAtbSdcbiAgICAgICAgICAgIGtSOiAgICAgJ2sgLVInXG4gICAgICAgICAgICBsOiAgICAgICdjb2xvci1scydcbiAgICAgICAgICAgIGxzOiAgICAgJ2NvbG9yLWxzJ1xuICAgICAgICAgICAgbGE6ICAgICAnbCAtYSdcbiAgICAgICAgICAgIGxsOiAgICAgJ2wgLWwnXG4gICAgICAgICAgICBsbGE6ICAgICdsIC1sYSdcbiAgICAgICAgICAgIGxzbzogICAgJ2M6L21zeXM2NC91c3IvYmluL2xzLkVYRSdcbiAgICAgICAgICAgIHNsOiAgICAgJ2xzJ1xuICAgICAgICAgICAgYWw6ICAgICAnbGEnXG4gICAgICAgICAgICBhbGw6ICAgICdsbGEnXG4gICAgICAgICAgICBlOiAgICAgICdlbGVjdHJvbiAuJ1xuICAgICAgICAgICAgZWQ6ICAgICAnZSAtRCdcbiAgICAgICAgICAgIHBzOiAgICAgJ3dtaWMgUFJPQ0VTUyBHRVQgTmFtZSxQcm9jZXNzSWQsUGFyZW50UHJvY2Vzc0lkJ1xuICAgICAgICBzdXBlclxuXG4gICAgc3Vic3RpdHV0ZTogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBhIGluIE9iamVjdC5rZXlzIEBhbGlhc1xuICAgICAgICAgICAgaWYgY21kLnN0YXJ0c1dpdGggYSArICcgJ1xuICAgICAgICAgICAgICAgIGFsaWFzID0gQGFsaWFzW2FdXG4gICAgICAgICAgICAgICAgaWYgYWxpYXMuaW5kZXhPZignJCQnKSA+PSAwXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGlhcy5yZXBsYWNlICckJCcgY21kW2EubGVuZ3RoKzEuLl0udHJpbSgpXG4gICAgICAgIGNtZFxuICAgICAgICBcbiAgICBvbkNvbW1hbmQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYSBpbiBPYmplY3Qua2V5cyBAYWxpYXNcbiAgICAgICAgICAgIGlmIGNtZCA9PSBhIG9yIGNtZC5zdGFydHNXaXRoIGEgKyAnICdcbiAgICAgICAgICAgICAgICByZXR1cm4gQHNoZWxsLmVucXVldWUgY21kOkBhbGlhc1thXSArIGNtZFthLmxlbmd0aC4uXSwgZnJvbnQ6dHJ1ZSwgYWxpYXM6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgY21kID09ICdoaXN0b3J5JyBvciBjbWQuc3RhcnRzV2l0aCAnaGlzdG9yeSAnIHRoZW4gcmV0dXJuIEBoaXN0Q21kICBjbWRcbiAgICAgICAgaWYgY21kID09ICdicmFpbicgICBvciBjbWQuc3RhcnRzV2l0aCAnYnJhaW4gJyAgIHRoZW4gcmV0dXJuIEBicmFpbkNtZCBjbWRcbiAgICAgICAgaWYgY21kID09ICdhbGlhcycgICBvciBjbWQuc3RhcnRzV2l0aCAnYWxpYXMgJyAgIHRoZW4gcmV0dXJuIEBhbGlhc0NtZCBjbWRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNtZFxuICAgICAgICAgICAgd2hlbiAnY2xlYXInICAgdGhlbiByZXR1cm4gQHRlcm0uY2xlYXIoKVxuICAgICAgICAgICAgd2hlbiAnY3dkJyAgICAgdGhlbiByZXR1cm4gQGVkaXRvci5hcHBlbmRPdXRwdXQgc2xhc2gucGF0aCBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICB3aGVuICdibGluaycgICB0aGVuIHJldHVybiBAZWRpdG9yLnRvZ2dsZUJsaW5rKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgYWxpYXNDbWQ6IChjbWQpIC0+ICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgY21kID09ICdhbGlhcydcbiAgICAgICAgICAgIGZvciBrLHYgb2YgQGFsaWFzXG4gICAgICAgICAgICAgICAgQGVkaXRvci5hcHBlbmRPdXRwdXQgXCIje2t9ICN7dn1cIlxuICAgICAgICB0cnVlXG5cbiAgICBicmFpbkNtZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGFyZyA9IGNtZFs2Li5dLnRyaW0oKVxuICAgICAgICBhcmcgPSAnbGlzdCcgaWYgZW1wdHkgYXJnXG4gICAgICAgIHdpbmRvdy5icmFpbi5jbWQgQGVkaXRvciwgYXJnXG4gICAgICAgIFxuICAgIGhpc3RDbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBhcmcgPSBjbWRbOC4uXS50cmltKClcbiAgICAgICAgYXJnID0gJ2xpc3QnIGlmIGVtcHR5IGFyZ1xuICAgICAgICBzd2l0Y2ggYXJnXG4gICAgICAgICAgICB3aGVuICdjbGVhcicgdGhlbiBIaXN0b3J5LmNsZWFyKClcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuIEB0ZXJtLmhpc3RvcnkuY21kIGFyZ1xuICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBbGlhc1xuIl19
//# sourceURL=../coffee/alias.coffee