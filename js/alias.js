// koffee 1.12.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLi4vY29mZmVlIiwic291cmNlcyI6WyJhbGlhcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsdUNBQUE7SUFBQTs7O0FBUUEsTUFBbUIsT0FBQSxDQUFRLEtBQVIsQ0FBbkIsRUFBRSxpQkFBRixFQUFTOztBQUVULElBQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7QUFDVixPQUFBLEdBQVUsT0FBQSxDQUFRLFdBQVI7O0FBRUo7OztJQUVDLGVBQUE7UUFFQyxJQUFDLENBQUEsS0FBRCxHQUNJO1lBQUEsQ0FBQSxFQUFRLE9BQVI7WUFDQSxDQUFBLEVBQVEsT0FEUjtZQUVBLENBQUEsRUFBUSxPQUZSO1lBR0EsQ0FBQSxFQUFRLFNBSFI7WUFJQSxDQUFBLEVBQVEsdUJBSlI7WUFLQSxHQUFBLEVBQVEsT0FMUjtZQU1BLEVBQUEsRUFBUSxNQU5SO1lBT0EsR0FBQSxFQUFRLHFCQVBSO1lBUUEsRUFBQSxFQUFRLDZEQVJSO1lBU0EsRUFBQSxFQUFRLGdFQVRSO1lBVUEsRUFBQSxFQUFRLGdGQVZSO1lBV0EsRUFBQSxFQUFRLGtFQVhSO1lBWUEsRUFBQSxFQUFRLHNFQVpSO1lBYUEsRUFBQSxFQUFRLG9FQWJSO1lBY0EsRUFBQSxFQUFRLE1BZFI7WUFlQSxFQUFBLEVBQVEsTUFmUjtZQWdCQSxFQUFBLEVBQVEsTUFoQlI7WUFpQkEsRUFBQSxFQUFRLE1BakJSO1lBa0JBLEVBQUEsRUFBUSxNQWxCUjtZQW1CQSxFQUFBLEVBQVEsTUFuQlI7WUFvQkEsRUFBQSxFQUFRLE1BcEJSO1lBcUJBLEVBQUEsRUFBUSxNQXJCUjtZQXNCQSxFQUFBLEVBQVEsTUF0QlI7WUF1QkEsRUFBQSxFQUFRLE1BdkJSO1lBd0JBLEVBQUEsRUFBUSxNQXhCUjtZQXlCQSxDQUFBLEVBQVEsYUF6QlI7WUEwQkEsRUFBQSxFQUFRLGFBMUJSO1lBMkJBLEVBQUEsRUFBUSxNQTNCUjtZQTRCQSxFQUFBLEVB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QUVOLFlBQUE7UUFBQSxJQUFHLEdBQUEsS0FBTyxPQUFWO0FBQ0k7QUFBQSxpQkFBQSxTQUFBOztnQkFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBd0IsQ0FBRCxHQUFHLEdBQUgsR0FBTSxDQUE3QjtBQURKLGFBREo7O2VBR0E7SUFMTTs7b0JBT1YsUUFBQSxHQUFVLFNBQUMsR0FBRDtBQUVOLFlBQUE7UUFBQSxHQUFBLEdBQU0sR0FBSSxTQUFJLENBQUMsSUFBVCxDQUFBO1FBQ04sSUFBZ0IsS0FBQSxDQUFNLEdBQU4sQ0FBaEI7WUFBQSxHQUFBLEdBQU0sT0FBTjs7ZUFDQSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLE1BQWxCLEVBQTBCLEdBQTFCO0lBSk07O29CQU1WLE9BQUEsR0FBUyxTQUFDLEdBQUQ7QUFFTCxZQUFBO1FBQUEsR0FBQSxHQUFNLEdBQUksU0FBSSxDQUFDLElBQVQsQ0FBQTtRQUNOLElBQWdCLEtBQUEsQ0FBTSxHQUFOLENBQWhCO1lBQUEsR0FBQSxHQUFNLE9BQU47O0FBQ0EsZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE9BRFQ7Z0JBQ3NCLE9BQU8sQ0FBQyxLQUFSLENBQUE7QUFBYjtBQURUO0FBRVMsdUJBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBZCxDQUFrQixHQUFsQjtBQUZoQjtlQUdBO0lBUEs7Ozs7R0EzRk87O0FBb0dwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgXG4jIyNcblxueyBzbGFzaCwgZW1wdHkgfSA9IHJlcXVpcmUgJ2t4aydcblxuQ21tZCAgICA9IHJlcXVpcmUgJy4vY21tZCdcbkhpc3RvcnkgPSByZXF1aXJlICcuL2hpc3RvcnknXG5cbmNsYXNzIEFsaWFzIGV4dGVuZHMgQ21tZFxuICAgIFxuICAgIEA6IC0+XG4gICAgICAgIFxuICAgICAgICBAYWxpYXMgPSBcbiAgICAgICAgICAgIGE6ICAgICAgJ2FsaWFzJ1xuICAgICAgICAgICAgYjogICAgICAnYnJhaW4nXG4gICAgICAgICAgICBjOiAgICAgICdjbGVhcidcbiAgICAgICAgICAgIGg6ICAgICAgJ2hpc3RvcnknXG4gICAgICAgICAgICBrOiAgICAgICd+L3Mva29ucmFkL2Jpbi9rb25yYWQnXG4gICAgICAgICAgICBjbHM6ICAgICdjbGVhcidcbiAgICAgICAgICAgIGNsOiAgICAgJ2MmJmwnXG4gICAgICAgICAgICBjZGw6ICAgICdjZCAkJCAmJiBjbGVhciAmJiBsJ1xuICAgICAgICAgICAgbmw6ICAgICAnbnBtIGxzIC0tZGVwdGggMCAyPiYxIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZzogICAgICducG0gbHMgLS1kZXB0aCAwIC1nIDI+JjEgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5pOiAgICAgJ25wbSBpbnN0YWxsIC0tbG9nbGV2ZWwgc2lsZW50IDI+JjEgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbiAmJiBubCdcbiAgICAgICAgICAgIG5hOiAgICAgJ25wbSBpbnN0YWxsIC0tc2F2ZSAkJCAyPiYxIHwgY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZDogICAgICducG0gaW5zdGFsbCAtLXNhdmUtZGV2ICQkIDI+JjEgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIG5yOiAgICAgJ25wbSB1bmluc3RhbGwgLS1zYXZlICQkIDI+JjEgfCBjb2xvcmNhdCAtc1Agfi9zL2tvbnJhZC9jYy9ucG0ubm9vbidcbiAgICAgICAgICAgIGtzOiAgICAgJ2sgLXMnXG4gICAgICAgICAgICBrZDogICAgICdrIC1kJ1xuICAgICAgICAgICAga2M6ICAgICAnayAtYydcbiAgICAgICAgICAgIGtiOiAgICAgJ2sgLWInXG4gICAgICAgICAgICBrZjogICAgICdrIC1mJ1xuICAgICAgICAgICAga3Q6ICAgICAnayAtdCdcbiAgICAgICAgICAgIGt1OiAgICAgJ2sgLXUnXG4gICAgICAgICAgICBraTogICAgICdrIC1pJ1xuICAgICAgICAgICAga3A6ICAgICAnayAtcCdcbiAgICAgICAgICAgIGttOiAgICAgJ2sgLW0nXG4gICAgICAgICAgICBrUjogICAgICdrIC1SJ1xuICAgICAgICAgICAgbDogICAgICAnY29sb3ItbHMgLW4nXG4gICAgICAgICAgICBsczogICAgICdjb2xvci1scyAtbidcbiAgICAgICAgICAgIGxhOiAgICAgJ2wgLWEnXG4gICAgICAgICAgICBsbDogICAgICdsIC1sJ1xuICAgICAgICAgICAgbGxhOiAgICAnbCAtbGEnXG4gICAgICAgICAgICBsc286ICAgICdjOi9tc3lzNjQvdXNyL2Jpbi9scy5FWEUnXG4gICAgICAgICAgICBzbDogICAgICdscydcbiAgICAgICAgICAgIGFsOiAgICAgJ2xhJ1xuICAgICAgICAgICAgYWxsOiAgICAnbGxhJ1xuICAgICAgICAgICAgcHVsbDogICAnZ2l0IHB1bGwnXG4gICAgICAgICAgICByZXZlcnQ6ICdnaXQgY2hlY2tvdXQgLS0gLidcbiAgICAgICAgICAgIGU6ICAgICAgJ2VsZWN0cm9uIC4nXG4gICAgICAgICAgICBlZDogICAgICdlIC1EJ1xuICAgICAgICAgICAgcHM6ICAgICAnd21pYyBQUk9DRVNTIEdFVCBOYW1lLFByb2Nlc3NJZCxQYXJlbnRQcm9jZXNzSWQnXG4gICAgICAgICAgICBnaW1wOiAgICdcIkM6L1Byb2dyYW0gRmlsZXMvR0lNUCAyL2Jpbi9naW1wLTIuMTAuZXhlXCInXG4gICAgICAgIHN1cGVyXG5cbiAgICBzdWJzdGl0dXRlOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGEgaW4gT2JqZWN0LmtleXMgQGFsaWFzXG4gICAgICAgICAgICBpZiBjbWQuc3RhcnRzV2l0aCBhICsgJyAnXG4gICAgICAgICAgICAgICAgYWxpYXMgPSBAYWxpYXNbYV1cbiAgICAgICAgICAgICAgICBpZiBhbGlhcy5pbmRleE9mKCckJCcpID49IDBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsaWFzLnJlcGxhY2UgJyQkJyBjbWRbYS5sZW5ndGgrMS4uXS50cmltKClcbiAgICAgICAgY21kXG4gICAgICAgIFxuICAgIG9uQ29tbWFuZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBhIGluIE9iamVjdC5rZXlzIEBhbGlhc1xuICAgICAgICAgICAgaWYgY21kID09IGEgb3IgY21kLnN0YXJ0c1dpdGggYSArICcgJ1xuICAgICAgICAgICAgICAgIHJldHVybiBAc2hlbGwuZW5xdWV1ZSBjbWQ6QGFsaWFzW2FdICsgY21kW2EubGVuZ3RoLi5dLCBmcm9udDp0cnVlLCBhbGlhczp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBjbWQgPT0gJ2hpc3RvcnknIG9yIGNtZC5zdGFydHNXaXRoICdoaXN0b3J5ICcgdGhlbiByZXR1cm4gQGhpc3RDbWQgIGNtZFxuICAgICAgICBpZiBjbWQgPT0gJ2JyYWluJyAgIG9yIGNtZC5zdGFydHNXaXRoICdicmFpbiAnICAgdGhlbiByZXR1cm4gQGJyYWluQ21kIGNtZFxuICAgICAgICBpZiBjbWQgPT0gJ2FsaWFzJyAgIG9yIGNtZC5zdGFydHNXaXRoICdhbGlhcyAnICAgdGhlbiByZXR1cm4gQGFsaWFzQ21kIGNtZFxuICAgICAgICBpZiBjbWQgPT0gJ3BhdGgnICAgIG9yIGNtZC5zdGFydHNXaXRoICdwYXRoICcgICAgdGhlbiByZXR1cm4gQHBhdGhzQ21kIGNtZFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggY21kXG4gICAgICAgICAgICB3aGVuICdjbGVhcicgICB0aGVuIHJldHVybiBAdGVybS5jbGVhcigpXG4gICAgICAgICAgICB3aGVuICdjd2QnICAgICB0aGVuIHJldHVybiBAZWRpdG9yLmFwcGVuZE91dHB1dCBzbGFzaC5wYXRoIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIHdoZW4gJ2JsaW5rJyAgIHRoZW4gcmV0dXJuIEBlZGl0b3IudG9nZ2xlQmxpbmsoKVxuXG4gICAgcGF0aHNDbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBhcmcgPSBjbWRbNi4uXS50cmltKClcbiAgICAgICAgYXJnID0gJ2xpc3QnIGlmIGVtcHR5IGFyZ1xuICAgICAgICBAc2hlbGwucGF0aHMuY21kIEBlZGl0b3IsIGFyZ1xuICAgICAgICAgICAgXG4gICAgYWxpYXNDbWQ6IChjbWQpIC0+ICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgY21kID09ICdhbGlhcydcbiAgICAgICAgICAgIGZvciBrLHYgb2YgQGFsaWFzXG4gICAgICAgICAgICAgICAgQGVkaXRvci5hcHBlbmRPdXRwdXQgXCIje2t9ICN7dn1cIlxuICAgICAgICB0cnVlXG5cbiAgICBicmFpbkNtZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGFyZyA9IGNtZFs2Li5dLnRyaW0oKVxuICAgICAgICBhcmcgPSAnbGlzdCcgaWYgZW1wdHkgYXJnXG4gICAgICAgIHdpbmRvdy5icmFpbi5jbWQgQGVkaXRvciwgYXJnXG4gICAgICAgIFxuICAgIGhpc3RDbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBhcmcgPSBjbWRbOC4uXS50cmltKClcbiAgICAgICAgYXJnID0gJ2xpc3QnIGlmIGVtcHR5IGFyZ1xuICAgICAgICBzd2l0Y2ggYXJnXG4gICAgICAgICAgICB3aGVuICdjbGVhcicgdGhlbiBIaXN0b3J5LmNsZWFyKClcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuIEB0ZXJtLmhpc3RvcnkuY21kIGFyZ1xuICAgICAgICB0cnVlXG4gICAgICAgICAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBBbGlhc1xuIl19
//# sourceURL=../coffee/alias.coffee