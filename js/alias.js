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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7OztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxJQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUVKOzs7SUFFQyxlQUFBO1FBRUMsSUFBQyxDQUFBLEtBQUQsR0FDSTtZQUFBLENBQUEsRUFBUSxPQUFSO1lBQ0EsQ0FBQSxFQUFRLE9BRFI7WUFFQSxDQUFBLEVBQVEsT0FGUjtZQUdBLENBQUEsRUFBUSxTQUhSO1lBSUEsQ0FBQSxFQUFRLHVCQUpSO1lBS0EsR0FBQSxFQUFRLE9BTFI7WUFNQSxFQUFBLEVBQVEsTUFOUjtZQU9BLEdBQUEsRUFBUSxxQkFQUjtZQVFBLEVBQUEsRUFBUSx3REFSUjtZQVNBLEVBQUEsRUFBUSwyREFUUjtZQVVBLEVBQUEsRUFBUSxtQkFWUjtZQVdBLEVBQUEsRUFBUSw2REFYUjtZQVlBLEVBQUEsRUFBUSxpRUFaUjtZQWFBLEVBQUEsRUFBUSwrREFiUjtZQWNBLEVBQUEsRUFBUSxNQWRSO1lBZUEsRUFBQSxFQUFRLE1BZlI7WUFnQkEsRUFBQSxFQUFRLE1BaEJSO1lBaUJBLEVBQUEsRUFBUSxNQWpCUjtZQWtCQSxFQUFBLEVBQVEsTUFsQlI7WUFtQkEsRUFBQSxFQUFRLE1BbkJSO1lBb0JBLEVBQUEsRUFBUSxNQXBCUjtZQXFCQSxFQUFBLEVBQVEsTUFyQlI7WUFzQkEsRUFBQSxFQUFRLE1BdEJSO1lBdUJBLEVBQUEsRUFBUSxNQXZCUjtZQXdCQSxFQUFBLEVBQVEsTUF4QlI7WUF5QkEsQ0FBQSxFQUFRLFVBekJSO1lBMEJBLEVBQUEsRUFBUSxVQTFCUjtZQTJCQSxFQUFBLEVBQVEsTUEzQlI7WUE0QkEsRUFBQSxFQUFRLE1BNUJSO1lBNkJBLEdBQUEs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QUF3QixDQUFELEdBQUcsR0FBSCxHQUFNLENBQTdCO0FBREosYUFESjs7ZUFHQTtJQUxNOztvQkFPVixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtRQUFBLEdBQUEsR0FBTSxHQUFJLFNBQUksQ0FBQyxJQUFULENBQUE7UUFDTixJQUFnQixLQUFBLENBQU0sR0FBTixDQUFoQjtZQUFBLEdBQUEsR0FBTSxPQUFOOztlQUNBLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsTUFBbEIsRUFBMEIsR0FBMUI7SUFKTTs7b0JBTVYsT0FBQSxHQUFTLFNBQUMsR0FBRDtBQUVMLFlBQUE7UUFBQSxHQUFBLEdBQU0sR0FBSSxTQUFJLENBQUMsSUFBVCxDQUFBO1FBQ04sSUFBZ0IsS0FBQSxDQUFNLEdBQU4sQ0FBaEI7WUFBQSxHQUFBLEdBQU0sT0FBTjs7QUFDQSxnQkFBTyxHQUFQO0FBQUEsaUJBQ1MsT0FEVDtnQkFDc0IsT0FBTyxDQUFDLEtBQVIsQ0FBQTtBQUFiO0FBRFQ7QUFFUyx1QkFBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFkLENBQWtCLEdBQWxCO0FBRmhCO2VBR0E7SUFQSzs7OztHQXhGTzs7QUFpR3BCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiMjI1xuXG57IHNsYXNoLCBlbXB0eSB9ID0gcmVxdWlyZSAna3hrJ1xuXG5DbW1kICAgID0gcmVxdWlyZSAnLi9jbW1kJ1xuSGlzdG9yeSA9IHJlcXVpcmUgJy4vaGlzdG9yeSdcblxuY2xhc3MgQWxpYXMgZXh0ZW5kcyBDbW1kXG4gICAgXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgICAgIEBhbGlhcyA9IFxuICAgICAgICAgICAgYTogICAgICAnYWxpYXMnXG4gICAgICAgICAgICBiOiAgICAgICdicmFpbidcbiAgICAgICAgICAgIGM6ICAgICAgJ2NsZWFyJ1xuICAgICAgICAgICAgaDogICAgICAnaGlzdG9yeSdcbiAgICAgICAgICAgIGs6ICAgICAgJ34vcy9rb25yYWQvYmluL2tvbnJhZCdcbiAgICAgICAgICAgIGNsczogICAgJ2NsZWFyJ1xuICAgICAgICAgICAgY2w6ICAgICAnYyYmbCdcbiAgICAgICAgICAgIGNkbDogICAgJ2NkICQkICYmIGNsZWFyICYmIGwnXG4gICAgICAgICAgICBubDogICAgICducG0gbHMgLS1kZXB0aCAwIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZzogICAgICducG0gbHMgLS1kZXB0aCAwIC1nIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuaTogICAgICducG0gaW5zdGFsbCAmJiBubCdcbiAgICAgICAgICAgIG5hOiAgICAgJ25wbSBpbnN0YWxsIC0tc2F2ZSAkJCB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmQ6ICAgICAnbnBtIGluc3RhbGwgLS1zYXZlLWRldiAkJCB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbnI6ICAgICAnbnBtIHVuaW5zdGFsbCAtLXNhdmUgJCQgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIGtzOiAgICAgJ2sgLXMnXG4gICAgICAgICAgICBrZDogICAgICdrIC1kJ1xuICAgICAgICAgICAga2M6ICAgICAnayAtYydcbiAgICAgICAgICAgIGtiOiAgICAgJ2sgLWInXG4gICAgICAgICAgICBrZjogICAgICdrIC1mJ1xuICAgICAgICAgICAga3Q6ICAgICAnayAtdCdcbiAgICAgICAgICAgIGt1OiAgICAgJ2sgLXUnXG4gICAgICAgICAgICBraTogICAgICdrIC1pJ1xuICAgICAgICAgICAga3A6ICAgICAnayAtcCdcbiAgICAgICAgICAgIGttOiAgICAgJ2sgLW0nXG4gICAgICAgICAgICBrUjogICAgICdrIC1SJ1xuICAgICAgICAgICAgbDogICAgICAnY29sb3ItbHMnXG4gICAgICAgICAgICBsczogICAgICdjb2xvci1scydcbiAgICAgICAgICAgIGxhOiAgICAgJ2wgLWEnXG4gICAgICAgICAgICBsbDogICAgICdsIC1sJ1xuICAgICAgICAgICAgbGxhOiAgICAnbCAtbGEnXG4gICAgICAgICAgICBsc286ICAgICdjOi9tc3lzNjQvdXNyL2Jpbi9scy5FWEUnXG4gICAgICAgICAgICBzbDogICAgICdscydcbiAgICAgICAgICAgIGFsOiAgICAgJ2xhJ1xuICAgICAgICAgICAgYWxsOiAgICAnbGxhJ1xuICAgICAgICAgICAgZTogICAgICAnZWxlY3Ryb24gLidcbiAgICAgICAgICAgIGVkOiAgICAgJ2UgLUQnXG4gICAgICAgICAgICBwczogICAgICd3bWljIFBST0NFU1MgR0VUIE5hbWUsUHJvY2Vzc0lkLFBhcmVudFByb2Nlc3NJZCdcbiAgICAgICAgc3VwZXJcblxuICAgIHN1YnN0aXR1dGU6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBmb3IgYSBpbiBPYmplY3Qua2V5cyBAYWxpYXNcbiAgICAgICAgICAgIGlmIGNtZC5zdGFydHNXaXRoIGEgKyAnICdcbiAgICAgICAgICAgICAgICBhbGlhcyA9IEBhbGlhc1thXVxuICAgICAgICAgICAgICAgIGlmIGFsaWFzLmluZGV4T2YoJyQkJykgPj0gMFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWxpYXMucmVwbGFjZSAnJCQnIGNtZFthLmxlbmd0aCsxLi5dLnRyaW0oKVxuICAgICAgICBjbWRcbiAgICAgICAgXG4gICAgb25Db21tYW5kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGEgaW4gT2JqZWN0LmtleXMgQGFsaWFzXG4gICAgICAgICAgICBpZiBjbWQgPT0gYSBvciBjbWQuc3RhcnRzV2l0aCBhICsgJyAnXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBzaGVsbC5lbnF1ZXVlIGNtZDpAYWxpYXNbYV0gKyBjbWRbYS5sZW5ndGguLl0sIGZyb250OnRydWUsIGFsaWFzOnRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIGNtZCA9PSAnaGlzdG9yeScgb3IgY21kLnN0YXJ0c1dpdGggJ2hpc3RvcnkgJyB0aGVuIHJldHVybiBAaGlzdENtZCAgY21kXG4gICAgICAgIGlmIGNtZCA9PSAnYnJhaW4nICAgb3IgY21kLnN0YXJ0c1dpdGggJ2JyYWluICcgICB0aGVuIHJldHVybiBAYnJhaW5DbWQgY21kXG4gICAgICAgIGlmIGNtZCA9PSAnYWxpYXMnICAgb3IgY21kLnN0YXJ0c1dpdGggJ2FsaWFzICcgICB0aGVuIHJldHVybiBAYWxpYXNDbWQgY21kXG4gICAgICAgIGlmIGNtZCA9PSAncGF0aCcgICAgb3IgY21kLnN0YXJ0c1dpdGggJ3BhdGggJyAgICB0aGVuIHJldHVybiBAcGF0aHNDbWQgY21kXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjbWRcbiAgICAgICAgICAgIHdoZW4gJ2NsZWFyJyAgIHRoZW4gcmV0dXJuIEB0ZXJtLmNsZWFyKClcbiAgICAgICAgICAgIHdoZW4gJ2N3ZCcgICAgIHRoZW4gcmV0dXJuIEBlZGl0b3IuYXBwZW5kT3V0cHV0IHNsYXNoLnBhdGggcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgd2hlbiAnYmxpbmsnICAgdGhlbiByZXR1cm4gQGVkaXRvci50b2dnbGVCbGluaygpXG5cbiAgICBwYXRoc0NtZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGFyZyA9IGNtZFs2Li5dLnRyaW0oKVxuICAgICAgICBhcmcgPSAnbGlzdCcgaWYgZW1wdHkgYXJnXG4gICAgICAgIEBzaGVsbC5wYXRocy5jbWQgQGVkaXRvciwgYXJnXG4gICAgICAgICAgICBcbiAgICBhbGlhc0NtZDogKGNtZCkgLT4gICAgXG4gICAgICAgIFxuICAgICAgICBpZiBjbWQgPT0gJ2FsaWFzJ1xuICAgICAgICAgICAgZm9yIGssdiBvZiBAYWxpYXNcbiAgICAgICAgICAgICAgICBAZWRpdG9yLmFwcGVuZE91dHB1dCBcIiN7a30gI3t2fVwiXG4gICAgICAgIHRydWVcblxuICAgIGJyYWluQ21kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnID0gY21kWzYuLl0udHJpbSgpXG4gICAgICAgIGFyZyA9ICdsaXN0JyBpZiBlbXB0eSBhcmdcbiAgICAgICAgd2luZG93LmJyYWluLmNtZCBAZWRpdG9yLCBhcmdcbiAgICAgICAgXG4gICAgaGlzdENtZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGFyZyA9IGNtZFs4Li5dLnRyaW0oKVxuICAgICAgICBhcmcgPSAnbGlzdCcgaWYgZW1wdHkgYXJnXG4gICAgICAgIHN3aXRjaCBhcmdcbiAgICAgICAgICAgIHdoZW4gJ2NsZWFyJyB0aGVuIEhpc3RvcnkuY2xlYXIoKVxuICAgICAgICAgICAgZWxzZSByZXR1cm4gQHRlcm0uaGlzdG9yeS5jbWQgYXJnXG4gICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEFsaWFzXG4iXX0=
//# sourceURL=../coffee/alias.coffee