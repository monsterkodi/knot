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
            k: 'konrad',
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
            l: 'color-ls',
            ls: 'color-ls',
            la: 'l -a',
            ll: 'l -l',
            lla: 'l -la',
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
                    front: true
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7OztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxJQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUVKOzs7SUFFQyxlQUFBO1FBRUMsSUFBQyxDQUFBLEtBQUQsR0FDSTtZQUFBLENBQUEsRUFBUSxPQUFSO1lBQ0EsQ0FBQSxFQUFRLE9BRFI7WUFFQSxDQUFBLEVBQVEsT0FGUjtZQUdBLENBQUEsRUFBUSxTQUhSO1lBSUEsQ0FBQSxFQUFRLFFBSlI7WUFLQSxHQUFBLEVBQVEsT0FMUjtZQU1BLEVBQUEsRUFBUSxNQU5SO1lBT0EsR0FBQSxFQUFRLHFCQVBSO1lBUUEsRUFBQSxFQUFRLDhFQVJSO1lBU0EsRUFBQSxFQUFRLGlGQVRSO1lBVUEsRUFBQSxFQUFRLG1CQVZSO1lBV0EsRUFBQSxFQUFRLG1GQVhSO1lBWUEsRUFBQSxFQUFRLHVGQVpSO1lBYUEsRUFBQSxFQUFRLHFGQWJSO1lBY0EsRUFBQSxFQUFRLE1BZFI7WUFlQSxFQUFBLEVBQVEsTUFmUjtZQWdCQSxFQUFBLEVBQVEsTUFoQlI7WUFpQkEsRUFBQSxFQUFRLE1BakJSO1lBa0JBLEVBQUEsRUFBUSxNQWxCUjtZQW1CQSxFQUFBLEVBQVEsTUFuQlI7WUFvQkEsRUFBQSxFQUFRLE1BcEJSO1lBcUJBLEVBQUEsRUFBUSxNQXJCUjtZQXNCQSxFQUFBLEVBQVEsTUF0QlI7WUF1QkEsRUFBQSxFQUFRLE1BdkJSO1lBd0JBLEVBQUEsRUFBUSxNQXhCUjtZQXlCQSxDQUFBLEVBQVEsVUF6QlI7WUEwQkEsRUFBQSxFQUFRLFVBMUJSO1lBMkJBLEVBQUEsRUFBUSxNQTNCUjtZQTRCQSxFQUFBLEVBQVEsTUE1QlI7WUE2QkEsR0FBQSxF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LEtBQVIsQ0FBQTtBQUFiO0FBRFQ7QUFFUyx1QkFBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFkLENBQWtCLEdBQWxCO0FBRmhCO2VBR0E7SUFQSzs7OztHQTdFTzs7QUFzRnBCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiMjI1xuXG57IHNsYXNoLCBlbXB0eSB9ID0gcmVxdWlyZSAna3hrJ1xuXG5DbW1kICAgID0gcmVxdWlyZSAnLi9jbW1kJ1xuSGlzdG9yeSA9IHJlcXVpcmUgJy4vaGlzdG9yeSdcblxuY2xhc3MgQWxpYXMgZXh0ZW5kcyBDbW1kXG4gICAgXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgICAgIEBhbGlhcyA9IFxuICAgICAgICAgICAgYTogICAgICAnYWxpYXMnXG4gICAgICAgICAgICBiOiAgICAgICdicmFpbidcbiAgICAgICAgICAgIGM6ICAgICAgJ2NsZWFyJ1xuICAgICAgICAgICAgaDogICAgICAnaGlzdG9yeSdcbiAgICAgICAgICAgIGs6ICAgICAgJ2tvbnJhZCdcbiAgICAgICAgICAgIGNsczogICAgJ2NsZWFyJ1xuICAgICAgICAgICAgY2w6ICAgICAnYyYmbCdcbiAgICAgICAgICAgIGNkbDogICAgJ2NkICQkICYmIGNsZWFyICYmIGwnXG4gICAgICAgICAgICBubDogICAgICducG0gbHMgLS1kZXB0aCAwIHwgbm9kZSB+L3MvY29sb3JjYXQvYmluL2NvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmc6ICAgICAnbnBtIGxzIC0tZGVwdGggMCAtZyB8IG5vZGUgfi9zL2NvbG9yY2F0L2Jpbi9jb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5pOiAgICAgJ25wbSBpbnN0YWxsICYmIG5sJ1xuICAgICAgICAgICAgbmE6ICAgICAnbnBtIGluc3RhbGwgLS1zYXZlICQkIHwgbm9kZSB+L3MvY29sb3JjYXQvYmluL2NvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmQ6ICAgICAnbnBtIGluc3RhbGwgLS1zYXZlLWRldiAkJCB8IG5vZGUgfi9zL2NvbG9yY2F0L2Jpbi9jb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5yOiAgICAgJ25wbSB1bmluc3RhbGwgLS1zYXZlICQkIHwgbm9kZSB+L3MvY29sb3JjYXQvYmluL2NvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAga3M6ICAgICAnayAtcydcbiAgICAgICAgICAgIGtkOiAgICAgJ2sgLWQnXG4gICAgICAgICAgICBrYzogICAgICdrIC1jJ1xuICAgICAgICAgICAga2I6ICAgICAnayAtYidcbiAgICAgICAgICAgIGtmOiAgICAgJ2sgLWYnXG4gICAgICAgICAgICBrdDogICAgICdrIC10J1xuICAgICAgICAgICAga3U6ICAgICAnayAtdSdcbiAgICAgICAgICAgIGtpOiAgICAgJ2sgLWknXG4gICAgICAgICAgICBrcDogICAgICdrIC1wJ1xuICAgICAgICAgICAga206ICAgICAnayAtbSdcbiAgICAgICAgICAgIGtSOiAgICAgJ2sgLVInXG4gICAgICAgICAgICBsOiAgICAgICdjb2xvci1scydcbiAgICAgICAgICAgIGxzOiAgICAgJ2NvbG9yLWxzJ1xuICAgICAgICAgICAgbGE6ICAgICAnbCAtYSdcbiAgICAgICAgICAgIGxsOiAgICAgJ2wgLWwnXG4gICAgICAgICAgICBsbGE6ICAgICdsIC1sYSdcbiAgICAgICAgICAgIGU6ICAgICAgJ2VsZWN0cm9uIC4nXG4gICAgICAgICAgICBlZDogICAgICdlIC1EJ1xuICAgICAgICAgICAgcHM6ICAgICAnd21pYyBQUk9DRVNTIEdFVCBOYW1lLFByb2Nlc3NJZCxQYXJlbnRQcm9jZXNzSWQnXG4gICAgICAgIHN1cGVyXG5cbiAgICBzdWJzdGl0dXRlOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGEgaW4gT2JqZWN0LmtleXMgQGFsaWFzXG4gICAgICAgICAgICBpZiBjbWQuc3RhcnRzV2l0aCBhICsgJyAnXG4gICAgICAgICAgICAgICAgYWxpYXMgPSBAYWxpYXNbYV1cbiAgICAgICAgICAgICAgICBpZiBhbGlhcy5pbmRleE9mKCckJCcpID49IDBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsaWFzLnJlcGxhY2UgJyQkJyBjbWRbYS5sZW5ndGgrMS4uXS50cmltKClcbiAgICAgICAgY21kXG4gICAgICAgIFxuICAgIG9uQ29tbWFuZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBhIGluIE9iamVjdC5rZXlzIEBhbGlhc1xuICAgICAgICAgICAgaWYgY21kID09IGEgb3IgY21kLnN0YXJ0c1dpdGggYSArICcgJ1xuICAgICAgICAgICAgICAgIHJldHVybiBAc2hlbGwuZW5xdWV1ZSBjbWQ6QGFsaWFzW2FdICsgY21kW2EubGVuZ3RoLi5dLCBmcm9udDp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBjbWQgPT0gJ2hpc3RvcnknIG9yIGNtZC5zdGFydHNXaXRoICdoaXN0b3J5ICcgdGhlbiByZXR1cm4gQGhpc3RDbWQgIGNtZFxuICAgICAgICBpZiBjbWQgPT0gJ2JyYWluJyAgIG9yIGNtZC5zdGFydHNXaXRoICdicmFpbiAnICAgdGhlbiByZXR1cm4gQGJyYWluQ21kIGNtZFxuICAgICAgICBpZiBjbWQgPT0gJ2FsaWFzJyAgIG9yIGNtZC5zdGFydHNXaXRoICdhbGlhcyAnICAgdGhlbiByZXR1cm4gQGFsaWFzQ21kIGNtZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggY21kXG4gICAgICAgICAgICB3aGVuICdjbGVhcicgICB0aGVuIHJldHVybiBAdGVybS5jbGVhcigpXG4gICAgICAgICAgICB3aGVuICdjd2QnICAgICB0aGVuIHJldHVybiBAZWRpdG9yLmFwcGVuZE91dHB1dCBzbGFzaC5wYXRoIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIHdoZW4gJ2JsaW5rJyAgIHRoZW4gcmV0dXJuIEBlZGl0b3IudG9nZ2xlQmxpbmsoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBhbGlhc0NtZDogKGNtZCkgLT4gICAgXG4gICAgICAgIFxuICAgICAgICBpZiBjbWQgPT0gJ2FsaWFzJ1xuICAgICAgICAgICAgZm9yIGssdiBvZiBAYWxpYXNcbiAgICAgICAgICAgICAgICBAZWRpdG9yLmFwcGVuZE91dHB1dCBcIiN7a30gI3t2fVwiXG4gICAgICAgIHRydWVcblxuICAgIGJyYWluQ21kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnID0gY21kWzYuLl0udHJpbSgpXG4gICAgICAgIGFyZyA9ICdsaXN0JyBpZiBlbXB0eSBhcmdcbiAgICAgICAgd2luZG93LmJyYWluLmNtZCBAZWRpdG9yLCBhcmdcbiAgICAgICAgXG4gICAgaGlzdENtZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGFyZyA9IGNtZFs4Li5dLnRyaW0oKVxuICAgICAgICBhcmcgPSAnbGlzdCcgaWYgZW1wdHkgYXJnXG4gICAgICAgIHN3aXRjaCBhcmdcbiAgICAgICAgICAgIHdoZW4gJ2NsZWFyJyB0aGVuIEhpc3RvcnkuY2xlYXIoKVxuICAgICAgICAgICAgZWxzZSByZXR1cm4gQHRlcm0uaGlzdG9yeS5jbWQgYXJnXG4gICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEFsaWFzXG4iXX0=
//# sourceURL=../coffee/alias.coffee