// koffee 1.14.0

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

ref = require('kxk'), empty = ref.empty, slash = ref.slash;

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
            lso: '/bin/ls',
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLi4vY29mZmVlIiwic291cmNlcyI6WyJhbGlhcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsdUNBQUE7SUFBQTs7O0FBUUEsTUFBbUIsT0FBQSxDQUFRLEtBQVIsQ0FBbkIsRUFBRSxpQkFBRixFQUFTOztBQUVULElBQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7QUFDVixPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBRUo7OztJQUVDLGVBQUE7UUFFQyxJQUFDLENBQUEsS0FBRCxHQUNJO1lBQUEsQ0FBQSxFQUFRLE9BQVI7WUFDQSxDQUFBLEVBQVEsT0FEUjtZQUVBLENBQUEsRUFBUSxPQUZSO1lBR0EsQ0FBQSxFQUFRLFNBSFI7WUFJQSxDQUFBLEVBQVEsdUJBSlI7WUFLQSxHQUFBLEVBQVEsT0FMUjtZQU1BLEVBQUEsRUFBUSxNQU5SO1lBT0EsR0FBQSxFQUFRLHFCQVBSO1lBUUEsRUFBQSxFQUFRLDZEQVJSO1lBU0EsRUFBQSxFQUFRLGdFQVRSO1lBVUEsRUFBQSxFQUFRLGdGQVZSO1lBV0EsRUFBQSxFQUFRLGtFQVhSO1lBWUEsRUFBQSxFQUFRLHNFQVpSO1lBYUEsRUFBQSxFQUFRLG9FQWJSO1lBY0EsRUFBQSxFQUFRLE1BZFI7WUFlQSxFQUFBLEVBQVEsTUFmUjtZQWdCQSxFQUFBLEVBQVEsTUFoQlI7WUFpQkEsRUFBQSxFQUFRLE1BakJSO1lBa0JBLEVBQUEsRUFBUSxNQWxCUjtZQW1CQSxFQUFBLEVBQVEsTUFuQlI7WUFvQkEsRUFBQSxFQUFRLE1BcEJSO1lBcUJBLEVBQUEsRUFBUSxNQXJCUjtZQXNCQSxFQUFBLEVBQVEsTUF0QlI7WUF1QkEsRUFBQSxFQUFRLE1BdkJSO1lBd0JBLEVBQUEsRUFBUSxNQXhCUjtZQXlCQSxDQUFBLEVBQVEsYUF6QlI7WUEwQkEsRUFBQSxFQUFRLGFBMUJSO1lBMkJBLEVBQUEsRUFBUSxNQTNCUjtZQTRCQSxFQUFBLEVB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RU4sWUFBQTtRQUFBLElBQUcsR0FBQSxLQUFPLE9BQVY7QUFDSTtBQUFBLGlCQUFBLFNBQUE7O2dCQUNJLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUF3QixDQUFELEdBQUcsR0FBSCxHQUFNLENBQTdCO0FBREosYUFESjs7ZUFHQTtJQUxNOztvQkFPVixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtRQUFBLEdBQUEsR0FBTSxHQUFJLFNBQUksQ0FBQyxJQUFULENBQUE7UUFDTixJQUFnQixLQUFBLENBQU0sR0FBTixDQUFoQjtZQUFBLEdBQUEsR0FBTSxPQUFOOztlQUNBLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsTUFBbEIsRUFBMEIsR0FBMUI7SUFKTTs7b0JBTVYsT0FBQSxHQUFTLFNBQUMsR0FBRDtBQUVMLFlBQUE7UUFBQSxHQUFBLEdBQU0sR0FBSSxTQUFJLENBQUMsSUFBVCxDQUFBO1FBQ04sSUFBZ0IsS0FBQSxDQUFNLEdBQU4sQ0FBaEI7WUFBQSxHQUFBLEdBQU0sT0FBTjs7QUFDQSxnQkFBTyxHQUFQO0FBQUEsaUJBQ1MsT0FEVDtnQkFDc0IsT0FBTyxDQUFDLEtBQVIsQ0FBQTtBQUFiO0FBRFQ7QUFFUyx1QkFBTyxJQUFDLENBQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFkLENBQWtCLEdBQWxCO0FBRmhCO2VBR0E7SUFQSzs7OztHQTNGTzs7QUFvR3BCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMFxuMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICBcbjAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMFxuMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCBcbiMjI1xuXG57IGVtcHR5LCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5DbW1kICAgID0gcmVxdWlyZSAnLi9jbW1kJ1xuSGlzdG9yeSA9IHJlcXVpcmUgJy4vaGlzdG9yeSdcblxuY2xhc3MgQWxpYXMgZXh0ZW5kcyBDbW1kXG4gICAgXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgICAgIEBhbGlhcyA9IFxuICAgICAgICAgICAgYTogICAgICAnYWxpYXMnXG4gICAgICAgICAgICBiOiAgICAgICdicmFpbidcbiAgICAgICAgICAgIGM6ICAgICAgJ2NsZWFyJ1xuICAgICAgICAgICAgaDogICAgICAnaGlzdG9yeSdcbiAgICAgICAgICAgIGs6ICAgICAgJ34vcy9rb25yYWQvYmluL2tvbnJhZCdcbiAgICAgICAgICAgIGNsczogICAgJ2NsZWFyJ1xuICAgICAgICAgICAgY2w6ICAgICAnYyYmbCdcbiAgICAgICAgICAgIGNkbDogICAgJ2NkICQkICYmIGNsZWFyICYmIGwnXG4gICAgICAgICAgICBubDogICAgICducG0gbHMgLS1kZXB0aCAwIDI+JjEgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5nOiAgICAgJ25wbSBscyAtLWRlcHRoIDAgLWcgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmk6ICAgICAnbnBtIGluc3RhbGwgLS1sb2dsZXZlbCBzaWxlbnQgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uICYmIG5sJ1xuICAgICAgICAgICAgbmE6ICAgICAnbnBtIGluc3RhbGwgLS1zYXZlICQkIDI+JjEgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5kOiAgICAgJ25wbSBpbnN0YWxsIC0tc2F2ZS1kZXYgJCQgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbnI6ICAgICAnbnBtIHVuaW5zdGFsbCAtLXNhdmUgJCQgMj4mMSB8IGNvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAga3M6ICAgICAnayAtcydcbiAgICAgICAgICAgIGtkOiAgICAgJ2sgLWQnXG4gICAgICAgICAgICBrYzogICAgICdrIC1jJ1xuICAgICAgICAgICAga2I6ICAgICAnayAtYidcbiAgICAgICAgICAgIGtmOiAgICAgJ2sgLWYnXG4gICAgICAgICAgICBrdDogICAgICdrIC10J1xuICAgICAgICAgICAga3U6ICAgICAnayAtdSdcbiAgICAgICAgICAgIGtpOiAgICAgJ2sgLWknXG4gICAgICAgICAgICBrcDogICAgICdrIC1wJ1xuICAgICAgICAgICAga206ICAgICAnayAtbSdcbiAgICAgICAgICAgIGtSOiAgICAgJ2sgLVInXG4gICAgICAgICAgICBsOiAgICAgICdjb2xvci1scyAtbidcbiAgICAgICAgICAgIGxzOiAgICAgJ2NvbG9yLWxzIC1uJ1xuICAgICAgICAgICAgbGE6ICAgICAnbCAtYSdcbiAgICAgICAgICAgIGxsOiAgICAgJ2wgLWwnXG4gICAgICAgICAgICBsbGE6ICAgICdsIC1sYSdcbiAgICAgICAgICAgIGxzbzogICAgJy9iaW4vbHMnXG4gICAgICAgICAgICBzbDogICAgICdscydcbiAgICAgICAgICAgIGFsOiAgICAgJ2xhJ1xuICAgICAgICAgICAgYWxsOiAgICAnbGxhJ1xuICAgICAgICAgICAgcHVsbDogICAnZ2l0IHB1bGwnXG4gICAgICAgICAgICByZXZlcnQ6ICdnaXQgY2hlY2tvdXQgLS0gLidcbiAgICAgICAgICAgIGU6ICAgICAgJ2VsZWN0cm9uIC4nXG4gICAgICAgICAgICBlZDogICAgICdlIC1EJ1xuICAgICAgICAgICAgcHM6ICAgICAnd21pYyBQUk9DRVNTIEdFVCBOYW1lLFByb2Nlc3NJZCxQYXJlbnRQcm9jZXNzSWQnXG4gICAgICAgICAgICBnaW1wOiAgICdcIkM6L1Byb2dyYW0gRmlsZXMvR0lNUCAyL2Jpbi9naW1wLTIuMTAuZXhlXCInXG4gICAgICAgIHN1cGVyXG5cbiAgICBzdWJzdGl0dXRlOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGEgaW4gT2JqZWN0LmtleXMgQGFsaWFzXG4gICAgICAgICAgICBpZiBjbWQuc3RhcnRzV2l0aCBhICsgJyAnXG4gICAgICAgICAgICAgICAgYWxpYXMgPSBAYWxpYXNbYV1cbiAgICAgICAgICAgICAgICBpZiBhbGlhcy5pbmRleE9mKCckJCcpID49IDBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsaWFzLnJlcGxhY2UgJyQkJyBjbWRbYS5sZW5ndGgrMS4uXS50cmltKClcbiAgICAgICAgY21kXG4gICAgICAgIFxuICAgIG9uQ29tbWFuZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBhIGluIE9iamVjdC5rZXlzIEBhbGlhc1xuICAgICAgICAgICAgaWYgY21kID09IGEgb3IgY21kLnN0YXJ0c1dpdGggYSArICcgJ1xuICAgICAgICAgICAgICAgIHJldHVybiBAc2hlbGwuZW5xdWV1ZSBjbWQ6QGFsaWFzW2FdICsgY21kW2EubGVuZ3RoLi5dLCBmcm9udDp0cnVlLCBhbGlhczp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBjbWQgPT0gJ2hpc3RvcnknIG9yIGNtZC5zdGFydHNXaXRoICdoaXN0b3J5ICcgdGhlbiByZXR1cm4gQGhpc3RDbWQgIGNtZFxuICAgICAgICBpZiBjbWQgPT0gJ2JyYWluJyAgIG9yIGNtZC5zdGFydHNXaXRoICdicmFpbiAnICAgdGhlbiByZXR1cm4gQGJyYWluQ21kIGNtZFxuICAgICAgICBpZiBjbWQgPT0gJ2FsaWFzJyAgIG9yIGNtZC5zdGFydHNXaXRoICdhbGlhcyAnICAgdGhlbiByZXR1cm4gQGFsaWFzQ21kIGNtZFxuICAgICAgICBpZiBjbWQgPT0gJ3BhdGgnICAgIG9yIGNtZC5zdGFydHNXaXRoICdwYXRoICcgICAgdGhlbiByZXR1cm4gQHBhdGhzQ21kIGNtZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggY21kXG4gICAgICAgICAgICB3aGVuICdjbGVhcicgICB0aGVuIHJldHVybiBAdGVybS5jbGVhcigpXG4gICAgICAgICAgICB3aGVuICdjd2QnICAgICB0aGVuIHJldHVybiBAZWRpdG9yLmFwcGVuZE91dHB1dCBzbGFzaC5wYXRoIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIHdoZW4gJ2JsaW5rJyAgIHRoZW4gcmV0dXJuIEBlZGl0b3IudG9nZ2xlQmxpbmsoKVxuXG4gICAgcGF0aHNDbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBhcmcgPSBjbWRbNi4uXS50cmltKClcbiAgICAgICAgYXJnID0gJ2xpc3QnIGlmIGVtcHR5IGFyZ1xuICAgICAgICBAc2hlbGwucGF0aHMuY21kIEBlZGl0b3IsIGFyZ1xuICAgICAgICAgICAgXG4gICAgYWxpYXNDbWQ6IChjbWQpIC0+ICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgY21kID09ICdhbGlhcydcbiAgICAgICAgICAgIGZvciBrLHYgb2YgQGFsaWFzXG4gICAgICAgICAgICAgICAgQGVkaXRvci5hcHBlbmRPdXRwdXQgXCIje2t9ICN7dn1cIlxuICAgICAgICB0cnVlXG5cbiAgICBicmFpbkNtZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGFyZyA9IGNtZFs2Li5dLnRyaW0oKVxuICAgICAgICBhcmcgPSAnbGlzdCcgaWYgZW1wdHkgYXJnXG4gICAgICAgIHdpbmRvdy5icmFpbi5jbWQgQGVkaXRvciwgYXJnXG4gICAgICAgIFxuICAgIGhpc3RDbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBhcmcgPSBjbWRbOC4uXS50cmltKClcbiAgICAgICAgYXJnID0gJ2xpc3QnIGlmIGVtcHR5IGFyZ1xuICAgICAgICBzd2l0Y2ggYXJnXG4gICAgICAgICAgICB3aGVuICdjbGVhcicgdGhlbiBIaXN0b3J5LmNsZWFyKClcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuIEB0ZXJtLmhpc3RvcnkuY21kIGFyZ1xuICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBbGlhc1xuIl19
//# sourceURL=../coffee/alias.coffee