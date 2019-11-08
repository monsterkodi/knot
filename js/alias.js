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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHVDQUFBO0lBQUE7OztBQVFBLE1BQW1CLE9BQUEsQ0FBUSxLQUFSLENBQW5CLEVBQUUsaUJBQUYsRUFBUzs7QUFFVCxJQUFBLEdBQVUsT0FBQSxDQUFRLFFBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxXQUFSOztBQUVKOzs7SUFFQyxlQUFBO1FBRUMsSUFBQyxDQUFBLEtBQUQsR0FDSTtZQUFBLENBQUEsRUFBUSxPQUFSO1lBQ0EsQ0FBQSxFQUFRLE9BRFI7WUFFQSxDQUFBLEVBQVEsT0FGUjtZQUdBLENBQUEsRUFBUSxTQUhSO1lBSUEsQ0FBQSxFQUFRLDJCQUpSO1lBS0EsR0FBQSxFQUFRLE9BTFI7WUFNQSxFQUFBLEVBQVEsTUFOUjtZQU9BLEdBQUEsRUFBUSxxQkFQUjtZQVFBLEVBQUEsRUFBUSw4RUFSUjtZQVNBLEVBQUEsRUFBUSxpRkFUUjtZQVVBLEVBQUEsRUFBUSxtQkFWUjtZQVdBLEVBQUEsRUFBUSxtRkFYUjtZQVlBLEVBQUEsRUFBUSx1RkFaUjtZQWFBLEVBQUEsRUFBUSxxRkFiUjtZQWNBLEVBQUEsRUFBUSxNQWRSO1lBZUEsRUFBQSxFQUFRLE1BZlI7WUFnQkEsRUFBQSxFQUFRLE1BaEJSO1lBaUJBLEVBQUEsRUFBUSxNQWpCUjtZQWtCQSxFQUFBLEVBQVEsTUFsQlI7WUFtQkEsRUFBQSxFQUFRLE1BbkJSO1lBb0JBLEVBQUEsRUFBUSxNQXBCUjtZQXFCQSxFQUFBLEVBQVEsTUFyQlI7WUFzQkEsRUFBQSxFQUFRLE1BdEJSO1lBdUJBLEVBQUEsRUFBUSxNQXZCUjtZQXdCQSxFQUFBLEVBQVEsTUF4QlI7WUF5QkEsQ0FBQSxFQUFRLFVBekJSO1lBMEJBLEVBQUEsRUFBUSxVQTFCUjtZQTJCQSxFQUFBLEVBQVEsTUEzQlI7WUE0QkEsRUFBQSxFQUFRLE1BNUJSO1lBNkJBLEdBQUEs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QU8sQ0FBQyxLQUFSLENBQUE7QUFBYjtBQURUO0FBRVMsdUJBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBZCxDQUFrQixHQUFsQjtBQUZoQjtlQUdBO0lBUEs7Ozs7R0FqRk87O0FBMEZwQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgXG4wMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwIFxuMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgXG4jIyNcblxueyBzbGFzaCwgZW1wdHkgfSA9IHJlcXVpcmUgJ2t4aydcblxuQ21tZCAgICA9IHJlcXVpcmUgJy4vY21tZCdcbkhpc3RvcnkgPSByZXF1aXJlICcuL2hpc3RvcnknXG5cbmNsYXNzIEFsaWFzIGV4dGVuZHMgQ21tZFxuICAgIFxuICAgIEA6IC0+XG4gICAgICAgIFxuICAgICAgICBAYWxpYXMgPSBcbiAgICAgICAgICAgIGE6ICAgICAgJ2FsaWFzJ1xuICAgICAgICAgICAgYjogICAgICAnYnJhaW4nXG4gICAgICAgICAgICBjOiAgICAgICdjbGVhcidcbiAgICAgICAgICAgIGg6ICAgICAgJ2hpc3RvcnknXG4gICAgICAgICAgICBrOiAgICAgICdub2RlIH4vcy9rb25yYWQvanMva29ucmFkJ1xuICAgICAgICAgICAgY2xzOiAgICAnY2xlYXInXG4gICAgICAgICAgICBjbDogICAgICdjJiZsJ1xuICAgICAgICAgICAgY2RsOiAgICAnY2QgJCQgJiYgY2xlYXIgJiYgbCdcbiAgICAgICAgICAgIG5sOiAgICAgJ25wbSBscyAtLWRlcHRoIDAgfCBub2RlIH4vcy9jb2xvcmNhdC9iaW4vY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZzogICAgICducG0gbHMgLS1kZXB0aCAwIC1nIHwgbm9kZSB+L3MvY29sb3JjYXQvYmluL2NvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbmk6ICAgICAnbnBtIGluc3RhbGwgJiYgbmwnXG4gICAgICAgICAgICBuYTogICAgICducG0gaW5zdGFsbCAtLXNhdmUgJCQgfCBub2RlIH4vcy9jb2xvcmNhdC9iaW4vY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBuZDogICAgICducG0gaW5zdGFsbCAtLXNhdmUtZGV2ICQkIHwgbm9kZSB+L3MvY29sb3JjYXQvYmluL2NvbG9yY2F0IC1zUCB+L3Mva29ucmFkL2NjL25wbS5ub29uJ1xuICAgICAgICAgICAgbnI6ICAgICAnbnBtIHVuaW5zdGFsbCAtLXNhdmUgJCQgfCBub2RlIH4vcy9jb2xvcmNhdC9iaW4vY29sb3JjYXQgLXNQIH4vcy9rb25yYWQvY2MvbnBtLm5vb24nXG4gICAgICAgICAgICBrczogICAgICdrIC1zJ1xuICAgICAgICAgICAga2Q6ICAgICAnayAtZCdcbiAgICAgICAgICAgIGtjOiAgICAgJ2sgLWMnXG4gICAgICAgICAgICBrYjogICAgICdrIC1iJ1xuICAgICAgICAgICAga2Y6ICAgICAnayAtZidcbiAgICAgICAgICAgIGt0OiAgICAgJ2sgLXQnXG4gICAgICAgICAgICBrdTogICAgICdrIC11J1xuICAgICAgICAgICAga2k6ICAgICAnayAtaSdcbiAgICAgICAgICAgIGtwOiAgICAgJ2sgLXAnXG4gICAgICAgICAgICBrbTogICAgICdrIC1tJ1xuICAgICAgICAgICAga1I6ICAgICAnayAtUidcbiAgICAgICAgICAgIGw6ICAgICAgJ2NvbG9yLWxzJ1xuICAgICAgICAgICAgbHM6ICAgICAnY29sb3ItbHMnXG4gICAgICAgICAgICBsYTogICAgICdsIC1hJ1xuICAgICAgICAgICAgbGw6ICAgICAnbCAtbCdcbiAgICAgICAgICAgIGxsYTogICAgJ2wgLWxhJ1xuICAgICAgICAgICAgbHNvOiAgICAnYzovbXN5czY0L3Vzci9iaW4vbHMuRVhFJ1xuICAgICAgICAgICAgc2w6ICAgICAnbHMnXG4gICAgICAgICAgICBhbDogICAgICdsYSdcbiAgICAgICAgICAgIGFsbDogICAgJ2xsYSdcbiAgICAgICAgICAgIGU6ICAgICAgJ2VsZWN0cm9uIC4nXG4gICAgICAgICAgICBlZDogICAgICdlIC1EJ1xuICAgICAgICAgICAgcHM6ICAgICAnd21pYyBQUk9DRVNTIEdFVCBOYW1lLFByb2Nlc3NJZCxQYXJlbnRQcm9jZXNzSWQnXG4gICAgICAgIHN1cGVyXG5cbiAgICBzdWJzdGl0dXRlOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGEgaW4gT2JqZWN0LmtleXMgQGFsaWFzXG4gICAgICAgICAgICBpZiBjbWQuc3RhcnRzV2l0aCBhICsgJyAnXG4gICAgICAgICAgICAgICAgYWxpYXMgPSBAYWxpYXNbYV1cbiAgICAgICAgICAgICAgICBpZiBhbGlhcy5pbmRleE9mKCckJCcpID49IDBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsaWFzLnJlcGxhY2UgJyQkJyBjbWRbYS5sZW5ndGgrMS4uXS50cmltKClcbiAgICAgICAgY21kXG4gICAgICAgIFxuICAgIG9uQ29tbWFuZDogKGNtZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGZvciBhIGluIE9iamVjdC5rZXlzIEBhbGlhc1xuICAgICAgICAgICAgaWYgY21kID09IGEgb3IgY21kLnN0YXJ0c1dpdGggYSArICcgJ1xuICAgICAgICAgICAgICAgIHJldHVybiBAc2hlbGwuZW5xdWV1ZSBjbWQ6QGFsaWFzW2FdICsgY21kW2EubGVuZ3RoLi5dLCBmcm9udDp0cnVlLCBhbGlhczp0cnVlXG4gICAgICAgIFxuICAgICAgICBpZiBjbWQgPT0gJ2hpc3RvcnknIG9yIGNtZC5zdGFydHNXaXRoICdoaXN0b3J5ICcgdGhlbiByZXR1cm4gQGhpc3RDbWQgIGNtZFxuICAgICAgICBpZiBjbWQgPT0gJ2JyYWluJyAgIG9yIGNtZC5zdGFydHNXaXRoICdicmFpbiAnICAgdGhlbiByZXR1cm4gQGJyYWluQ21kIGNtZFxuICAgICAgICAjIGlmIGNtZCA9PSAnYWxpYXMnICAgb3IgY21kLnN0YXJ0c1dpdGggJ2FsaWFzICcgICB0aGVuIHJldHVybiBAYWxpYXNDbWQgY21kXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBjbWRcbiAgICAgICAgICAgIHdoZW4gJ2NsZWFyJyAgIHRoZW4gcmV0dXJuIEB0ZXJtLmNsZWFyKClcbiAgICAgICAgICAgIHdoZW4gJ2N3ZCcgICAgIHRoZW4gcmV0dXJuIEBlZGl0b3IuYXBwZW5kT3V0cHV0IHNsYXNoLnBhdGggcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgd2hlbiAnYmxpbmsnICAgdGhlbiByZXR1cm4gQGVkaXRvci50b2dnbGVCbGluaygpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIGFsaWFzQ21kOiAoY21kKSAtPiAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIGNtZCA9PSAnYWxpYXMnXG4gICAgICAgICAgICBmb3Igayx2IG9mIEBhbGlhc1xuICAgICAgICAgICAgICAgIEBlZGl0b3IuYXBwZW5kT3V0cHV0IFwiI3trfSAje3Z9XCJcbiAgICAgICAgdHJ1ZVxuXG4gICAgYnJhaW5DbWQ6IChjbWQpIC0+XG4gICAgICAgIFxuICAgICAgICBhcmcgPSBjbWRbNi4uXS50cmltKClcbiAgICAgICAgYXJnID0gJ2xpc3QnIGlmIGVtcHR5IGFyZ1xuICAgICAgICB3aW5kb3cuYnJhaW4uY21kIEBlZGl0b3IsIGFyZ1xuICAgICAgICBcbiAgICBoaXN0Q21kOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgYXJnID0gY21kWzguLl0udHJpbSgpXG4gICAgICAgIGFyZyA9ICdsaXN0JyBpZiBlbXB0eSBhcmdcbiAgICAgICAgc3dpdGNoIGFyZ1xuICAgICAgICAgICAgd2hlbiAnY2xlYXInIHRoZW4gSGlzdG9yeS5jbGVhcigpXG4gICAgICAgICAgICBlbHNlIHJldHVybiBAdGVybS5oaXN0b3J5LmNtZCBhcmdcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQWxpYXNcbiJdfQ==
//# sourceURL=../coffee/alias.coffee