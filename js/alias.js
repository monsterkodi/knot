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
            k: 'node ~/s/konrad/js/konrad',
            cls: 'clear',
            cl: 'c&&l',
            cdl: 'cd $$ && clear && l',
            nl: 'npm ls --depth 0 | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
            ng: 'npm ls --depth 0 -g | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
            ni: 'npm install && nl',
            na: 'npm install --save $$ | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
            nd: 'npm install --save-dev $$ | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
            nr: 'npm uninstall --save $$ | node ~/s/colorcat/bin/colorcat -sP ~/s/konrad/cc/npm.noon',
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
            l: 'node ~/s/colorls/js/color-ls.js',
            ls: 'node ~/s/colorls/js/color-ls.js',
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7OztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxJQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUVKOzs7SUFFQyxlQUFBO1FBRUMsSUFBQyxDQUFBLEtBQUQsR0FDSTtZQUFBLENBQUEsRUFBUSxPQUFSO1lBQ0EsQ0FBQSxFQUFRLE9BRFI7WUFFQSxDQUFBLEVBQVEsT0FGUjtZQUdBLENBQUEsRUFBUSxTQUhSO1lBSUEsQ0FBQSxFQUFRLDJCQUpSO1lBS0EsR0FBQSxFQUFRLE9BTFI7WUFNQSxFQUFBLEVBQVEsTUFOUjtZQU9BLEdBQUEsRUFBUSxxQkFQUjtZQVFBLEVBQUEsRUFBUSw4RUFSUjtZQVNBLEVBQUEsRUFBUSxpRkFUUjtZQVVBLEVBQUEsRUFBUSxtQkFWUjtZQVdBLEVBQUEsRUFBUSxtRkFYUjtZQVlBLEVBQUEsRUFBUSx1RkFaUjtZQWFBLEVBQUEsRUFBUSxxRkFiUjtZQWNBLEVBQUEsRUFBUSxNQWRSO1lBZUEsRUFBQSxFQUFRLE1BZlI7WUFnQkEsRUFBQSxFQUFRLE1BaEJSO1lBaUJBLEVBQUEsRUFBUSxNQWpCUjtZQWtCQSxFQUFBLEVBQVEsTUFsQlI7WUFtQkEsRUFBQSxFQUFRLE1BbkJSO1lBb0JBLEVBQUEsRUFBUSxNQXBCUjtZQXFCQSxFQUFBLEVBQVEsTUFyQlI7WUFzQkEsRUFBQSxFQUFRLE1BdEJSO1lBdUJBLEVBQUEsRUFBUSxNQXZCUjtZQXdCQSxFQUFBLEVBQVEsTUF4QlI7WUF5QkEsQ0FBQSxFQUFRLGlDQXpCUjtZQTBCQSxFQUFBLEVBQVEsaUNBMUJSO1lBMkJBLEVBQUEsRUFBUSxNQTNCUjtZQTRCQSxFQUFBLEVBQVEsTUE1QlI7WUE2QkEsR0FB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QUFDLElBQVQsQ0FBQTtRQUNOLElBQWdCLEtBQUEsQ0FBTSxHQUFOLENBQWhCO1lBQUEsR0FBQSxHQUFNLE9BQU47O0FBQ0EsZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE9BRFQ7Z0JBQ3NCLE9BQU8sQ0FBQyxLQUFSLENBQUE7QUFBYjtBQURUO0FBRVMsdUJBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBZCxDQUFrQixHQUFsQjtBQUZoQjtlQUdBO0lBUEs7Ozs7R0FqRk87O0FBMEZwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgXG4jIyNcblxueyBzbGFzaCwgZW1wdHkgfSA9IHJlcXVpcmUgJ2t4aydcblxuQ21tZCAgICA9IHJlcXVpcmUgJy4vY21tZCdcbkhpc3RvcnkgPSByZXF1aXJlICcuL2hpc3RvcnknXG5cbmNsYXNzIEFsaWFzIGV4dGVuZHMgQ21tZFxuICAgIFxuICAgIEA6IC0+XG4gICAgICAgIFxuICAgICAgICBAYWxpYXMgPSBcbiAgICAgICAgICAgIGE6ICAgICAgJ2FsaWFzJ1xuICAgICAgICAgICAgYjogICAgICAnYnJhaW4nXG4gICAgICAgICAgICBjOiAgICAgICdjbGVhcidcbiAgICAgICAgICAgIGg6ICAgICAgJ2hpc3RvcnknXG4gICAgICAgICAgICBrOiAgICAgICdub2RlIH4vcy9rb25yYWQvanMva29ucmFkJ1xuICAgICAgICAgICAgY2xzOiAgICAnY2xlYXInXG4gICAgICAgICAgICBjbDogICAgICdjJiZsJ1xuICAgICAgICAgICAgY2RsOiAgICAnY2QgJCQgJiYgY2xlYXIgJiYgbCdcbiAgICAgICAgICAgIG5sOiAgICAgJ25wbSBscyAtLWRlcHRoIDAgfCBub2RlIH4vcy9jb2xvcmNhdC9iaW4vY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZzogICAgICducG0gbHMgLS1kZXB0aCAwIC1nIHwgbm9kZSB+L3MvY29sb3JjYXQvYmluL2NvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmk6ICAgICAnbnBtIGluc3RhbGwgJiYgbmwnXG4gICAgICAgICAgICBuYTogICAgICducG0gaW5zdGFsbCAtLXNhdmUgJCQgfCBub2RlIH4vcy9jb2xvcmNhdC9iaW4vY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZDogICAgICducG0gaW5zdGFsbCAtLXNhdmUtZGV2ICQkIHwgbm9kZSB+L3MvY29sb3JjYXQvYmluL2NvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbnI6ICAgICAnbnBtIHVuaW5zdGFsbCAtLXNhdmUgJCQgfCBub2RlIH4vcy9jb2xvcmNhdC9iaW4vY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBrczogICAgICdrIC1zJ1xuICAgICAgICAgICAga2Q6ICAgICAnayAtZCdcbiAgICAgICAgICAgIGtjOiAgICAgJ2sgLWMnXG4gICAgICAgICAgICBrYjogICAgICdrIC1iJ1xuICAgICAgICAgICAga2Y6ICAgICAnayAtZidcbiAgICAgICAgICAgIGt0OiAgICAgJ2sgLXQnXG4gICAgICAgICAgICBrdTogICAgICdrIC11J1xuICAgICAgICAgICAga2k6ICAgICAnayAtaSdcbiAgICAgICAgICAgIGtwOiAgICAgJ2sgLXAnXG4gICAgICAgICAgICBrbTogICAgICdrIC1tJ1xuICAgICAgICAgICAga1I6ICAgICAnayAtUidcbiAgICAgICAgICAgIGw6ICAgICAgJ25vZGUgfi9zL2NvbG9ybHMvanMvY29sb3ItbHMuanMnXG4gICAgICAgICAgICBsczogICAgICdub2RlIH4vcy9jb2xvcmxzL2pzL2NvbG9yLWxzLmpzJ1xuICAgICAgICAgICAgbGE6ICAgICAnbCAtYSdcbiAgICAgICAgICAgIGxsOiAgICAgJ2wgLWwnXG4gICAgICAgICAgICBsbGE6ICAgICdsIC1sYSdcbiAgICAgICAgICAgIGxzbzogICAgJ2M6L21zeXM2NC91c3IvYmluL2xzLkVYRSdcbiAgICAgICAgICAgIHNsOiAgICAgJ2xzJ1xuICAgICAgICAgICAgYWw6ICAgICAnbGEnXG4gICAgICAgICAgICBhbGw6ICAgICdsbGEnXG4gICAgICAgICAgICBlOiAgICAgICdlbGVjdHJvbiAuJ1xuICAgICAgICAgICAgZWQ6ICAgICAnZSAtRCdcbiAgICAgICAgICAgIHBzOiAgICAgJ3dtaWMgUFJPQ0VTUyBHRVQgTmFtZSxQcm9jZXNzSWQsUGFyZW50UHJvY2Vzc0lkJ1xuICAgICAgICBzdXBlclxuXG4gICAgc3Vic3RpdHV0ZTogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBhIGluIE9iamVjdC5rZXlzIEBhbGlhc1xuICAgICAgICAgICAgaWYgY21kLnN0YXJ0c1dpdGggYSArICcgJ1xuICAgICAgICAgICAgICAgIGFsaWFzID0gQGFsaWFzW2FdXG4gICAgICAgICAgICAgICAgaWYgYWxpYXMuaW5kZXhPZignJCQnKSA+PSAwXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGlhcy5yZXBsYWNlICckJCcgY21kW2EubGVuZ3RoKzEuLl0udHJpbSgpXG4gICAgICAgIGNtZFxuICAgICAgICBcbiAgICBvbkNvbW1hbmQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYSBpbiBPYmplY3Qua2V5cyBAYWxpYXNcbiAgICAgICAgICAgIGlmIGNtZCA9PSBhIG9yIGNtZC5zdGFydHNXaXRoIGEgKyAnICdcbiAgICAgICAgICAgICAgICByZXR1cm4gQHNoZWxsLmVucXVldWUgY21kOkBhbGlhc1thXSArIGNtZFthLmxlbmd0aC4uXSwgZnJvbnQ6dHJ1ZSwgYWxpYXM6dHJ1ZVxuICAgICAgICBcbiAgICAgICAgaWYgY21kID09ICdoaXN0b3J5JyBvciBjbWQuc3RhcnRzV2l0aCAnaGlzdG9yeSAnIHRoZW4gcmV0dXJuIEBoaXN0Q21kICBjbWRcbiAgICAgICAgaWYgY21kID09ICdicmFpbicgICBvciBjbWQuc3RhcnRzV2l0aCAnYnJhaW4gJyAgIHRoZW4gcmV0dXJuIEBicmFpbkNtZCBjbWRcbiAgICAgICAgaWYgY21kID09ICdhbGlhcycgICBvciBjbWQuc3RhcnRzV2l0aCAnYWxpYXMgJyAgIHRoZW4gcmV0dXJuIEBhbGlhc0NtZCBjbWRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIGNtZFxuICAgICAgICAgICAgd2hlbiAnY2xlYXInICAgdGhlbiByZXR1cm4gQHRlcm0uY2xlYXIoKVxuICAgICAgICAgICAgd2hlbiAnY3dkJyAgICAgdGhlbiByZXR1cm4gQGVkaXRvci5hcHBlbmRPdXRwdXQgc2xhc2gucGF0aCBwcm9jZXNzLmN3ZCgpXG4gICAgICAgICAgICB3aGVuICdibGluaycgICB0aGVuIHJldHVybiBAZWRpdG9yLnRvZ2dsZUJsaW5rKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgYWxpYXNDbWQ6IChjbWQpIC0+ICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgY21kID09ICdhbGlhcydcbiAgICAgICAgICAgIGZvciBrLHYgb2YgQGFsaWFzXG4gICAgICAgICAgICAgICAgQGVkaXRvci5hcHBlbmRPdXRwdXQgXCIje2t9ICN7dn1cIlxuICAgICAgICB0cnVlXG5cbiAgICBicmFpbkNtZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGFyZyA9IGNtZFs2Li5dLnRyaW0oKVxuICAgICAgICBhcmcgPSAnbGlzdCcgaWYgZW1wdHkgYXJnXG4gICAgICAgIHdpbmRvdy5icmFpbi5jbWQgQGVkaXRvciwgYXJnXG4gICAgICAgIFxuICAgIGhpc3RDbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBhcmcgPSBjbWRbOC4uXS50cmltKClcbiAgICAgICAgYXJnID0gJ2xpc3QnIGlmIGVtcHR5IGFyZ1xuICAgICAgICBzd2l0Y2ggYXJnXG4gICAgICAgICAgICB3aGVuICdjbGVhcicgdGhlbiBIaXN0b3J5LmNsZWFyKClcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuIEB0ZXJtLmhpc3RvcnkuY21kIGFyZ1xuICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBbGlhc1xuIl19
//# sourceURL=../coffee/alias.coffee