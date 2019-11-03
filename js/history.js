// koffee 1.4.0

/*
000   000  000   0000000  000000000   0000000   00000000   000   000
000   000  000  000          000     000   000  000   000   000 000 
000000000  000  0000000      000     000   000  0000000      00000  
000   000  000       000     000     000   000  000   000     000   
000   000  000  0000000      000      0000000   000   000     000
 */
var History, empty, kstr, matchr, post, prefs, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

ref = require('kxk'), post = ref.post, matchr = ref.matchr, prefs = ref.prefs, empty = ref.empty, kstr = ref.kstr;

History = (function() {
    History.list = [];

    History.init = function() {
        History.list = prefs.get('history', []);
        return post.on('cmd', History.onCmd);
    };

    History.onCmd = function(arg1) {
        var cmd, i, j, ref1, ref2;
        cmd = (ref1 = arg1.cmd) != null ? ref1 : null;
        if (cmd === 'h' || cmd === 'history' || cmd === 'c' || cmd === 'clear') {
            return;
        }
        if (cmd[0] === '!') {
            return;
        }
        if (cmd === History.list.slice(-1)[0]) {
            return;
        }
        if (History.list.length) {
            for (i = j = ref2 = History.list.length - 2; ref2 <= 0 ? j <= 0 : j >= 0; i = ref2 <= 0 ? ++j : --j) {
                if (History.list[i] === cmd) {
                    History.list.splice(i, 1);
                    post.emit('history splice', i);
                    break;
                }
            }
        }
        History.list.push(cmd);
        return prefs.set('history', History.list);
    };

    History.substitute = function(cmd) {
        var hst, index, j, len, ref1, rng;
        if (cmd === '!') {
            return this.list.slice(-1)[0];
        }
        ref1 = matchr.ranges(/!-?\d+/, cmd).reverse();
        for (j = 0, len = ref1.length; j < len; j++) {
            rng = ref1[j];
            index = parseInt(rng.match.slice(1));
            if (index < 0) {
                index += this.list.length;
            }
            if (hst = this.list[index]) {
                cmd = cmd.splice(rng.start, rng.match.length, hst);
            }
        }
        return cmd;
    };

    History.clear = function() {
        History.list = [];
        return prefs.set('history', History.list);
    };

    function History(term) {
        this.term = term;
        this.onSplice = bind(this.onSplice, this);
        post.on('history splice', this.onSplice);
        this.editor = this.term.editor;
        this.index = -1;
    }

    History.prototype.shellCmd = function(cmd) {
        if (this.index >= 0) {
            if (cmd !== History.list[this.index]) {
                return this.index = -1;
            }
        }
    };

    History.prototype.cmd = function(arg) {
        var ref1, rest;
        ref1 = arg.split(' '), arg = ref1[0], rest = 2 <= ref1.length ? slice.call(ref1, 1) : [];
        switch (arg) {
            case 'list':
                this.list();
        }
        return true;
    };

    History.prototype.onSplice = function(index) {
        if (this.index > 0 && this.index >= index) {
            return this.index--;
        }
    };

    History.prototype.list = function() {
        var i;
        return this.editor.appendOutput(((function() {
            var j, ref1, results;
            results = [];
            for (i = j = 0, ref1 = History.list.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
                results.push((kstr.rpad(i, 3)) + " " + History.list[i]);
            }
            return results;
        })()).join('\n'));
    };

    History.prototype.prev = function() {
        if (this.index === 0 || empty(History.list)) {
            return;
        }
        if (this.index < 0) {
            this.show(0);
            return;
        }
        return this.show(-1);
    };

    History.prototype.next = function() {
        if (this.index < 0 || empty(History.list)) {
            return;
        }
        if (this.index + 1 >= History.list.length) {
            this.index = -1;
            this.editor.setInputText('');
            return;
        }
        return this.show(+1);
    };

    History.prototype.show = function(d) {
        var ll;
        ll = History.list.length;
        this.index = (this.index + ll + d) % ll;
        return this.editor.setInputText(History.list[this.index]);
    };

    return History;

})();

module.exports = History;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsOENBQUE7SUFBQTs7O0FBUUEsTUFBdUMsT0FBQSxDQUFRLEtBQVIsQ0FBdkMsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0IsaUJBQWhCLEVBQXVCLGlCQUF2QixFQUE4Qjs7QUFFeEI7SUFRRixPQUFDLENBQUEsSUFBRCxHQUFROztJQUVSLE9BQUMsQ0FBQSxJQUFELEdBQU8sU0FBQTtRQUVILE9BQUMsQ0FBQSxJQUFELEdBQVEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxTQUFWLEVBQW9CLEVBQXBCO2VBQ1IsSUFBSSxDQUFDLEVBQUwsQ0FBUSxLQUFSLEVBQWMsT0FBQyxDQUFBLEtBQWY7SUFIRzs7SUFLUCxPQUFDLENBQUEsS0FBRCxHQUFRLFNBQUMsSUFBRDtBQUVKLFlBQUE7UUFGSyx5Q0FBRTtRQUVQLElBQVUsR0FBQSxLQUFRLEdBQVIsSUFBQSxHQUFBLEtBQVcsU0FBWCxJQUFBLEdBQUEsS0FBb0IsR0FBcEIsSUFBQSxHQUFBLEtBQXVCLE9BQWpDO0FBQUEsbUJBQUE7O1FBQ0EsSUFBVSxHQUFJLENBQUEsQ0FBQSxDQUFKLEtBQVUsR0FBcEI7QUFBQSxtQkFBQTs7UUFDQSxJQUFVLEdBQUEsS0FBTyxPQUFDLENBQUEsSUFBSyxVQUFFLENBQUEsQ0FBQSxDQUF6QjtBQUFBLG1CQUFBOztRQUVBLElBQUcsT0FBQyxDQUFBLElBQUksQ0FBQyxNQUFUO0FBQ0ksaUJBQVMsOEZBQVQ7Z0JBQ0ksSUFBRyxPQUFDLENBQUEsSUFBSyxDQUFBLENBQUEsQ0FBTixLQUFZLEdBQWY7b0JBQ0ksT0FBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsQ0FBYixFQUFnQixDQUFoQjtvQkFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLGdCQUFWLEVBQTJCLENBQTNCO0FBQ0EsMEJBSEo7O0FBREosYUFESjs7UUFPQSxPQUFD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QUMsSUFBZCxDQUFqQjtBQUNJLG1CQURKOztRQUVBLElBQUcsSUFBQyxDQUFBLEtBQUQsR0FBTyxDQUFQLElBQVksT0FBTyxDQUFDLElBQUksQ0FBQyxNQUE1QjtZQUNJLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQztZQUNWLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFxQixFQUFyQjtBQUNBLG1CQUhKOztlQUlBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQyxDQUFQO0lBUkU7O3NCQVVOLElBQUEsR0FBTSxTQUFDLENBQUQ7QUFFRixZQUFBO1FBQUEsRUFBQSxHQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDbEIsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFDLElBQUMsQ0FBQSxLQUFELEdBQU8sRUFBUCxHQUFVLENBQVgsQ0FBQSxHQUFnQjtlQUN6QixJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsT0FBTyxDQUFDLElBQUssQ0FBQSxJQUFDLENBQUEsS0FBRCxDQUFsQztJQUpFOzs7Ozs7QUFNVixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgXG4wMDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4jIyNcblxueyBwb3N0LCBtYXRjaHIsIHByZWZzLCBlbXB0eSwga3N0ciB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBIaXN0b3J5XG5cbiAgICAjIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgIFxuICAgIEBsaXN0ID0gW11cbiAgICBcbiAgICBAaW5pdDogPT5cbiAgICAgICAgXG4gICAgICAgIEBsaXN0ID0gcHJlZnMuZ2V0ICdoaXN0b3J5JyBbXVxuICAgICAgICBwb3N0Lm9uICdjbWQnIEBvbkNtZFxuICAgICAgICBcbiAgICBAb25DbWQ6IChjbWQ6KSA9PiAjIGNtZCBkaWQgc3VjY2VlZFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGNtZCBpbiBbJ2gnJ2hpc3RvcnknJ2MnJ2NsZWFyJ11cbiAgICAgICAgcmV0dXJuIGlmIGNtZFswXSA9PSAnISdcbiAgICAgICAgcmV0dXJuIGlmIGNtZCA9PSBAbGlzdFstMV1cbiAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0Lmxlbmd0aCBcbiAgICAgICAgICAgIGZvciBpIGluIFtAbGlzdC5sZW5ndGgtMi4uMF1cbiAgICAgICAgICAgICAgICBpZiBAbGlzdFtpXSA9PSBjbWRcbiAgICAgICAgICAgICAgICAgICAgQGxpc3Quc3BsaWNlIGksIDFcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdoaXN0b3J5IHNwbGljZScgaVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBcbiAgICAgICAgQGxpc3QucHVzaCBjbWRcbiAgICAgICAgcHJlZnMuc2V0ICdoaXN0b3J5JyBAbGlzdFxuICAgICAgICBcbiAgICBAc3Vic3RpdHV0ZTogKGNtZCkgLT5cbiAgICAgICAgaWYgY21kID09ICchJ1xuICAgICAgICAgICAgcmV0dXJuIEBsaXN0Wy0xXVxuICAgICAgICBmb3Igcm5nIGluIG1hdGNoci5yYW5nZXMoLyEtP1xcZCsvLCBjbWQpLnJldmVyc2UoKVxuICAgICAgICAgICAgaW5kZXggPSBwYXJzZUludCBybmcubWF0Y2hbMS4uXVxuICAgICAgICAgICAgaW5kZXggKz0gQGxpc3QubGVuZ3RoIGlmIGluZGV4IDwgMFxuICAgICAgICAgICAgaWYgaHN0ID0gQGxpc3RbaW5kZXhdXG4gICAgICAgICAgICAgICAgY21kID0gY21kLnNwbGljZSBybmcuc3RhcnQsIHJuZy5tYXRjaC5sZW5ndGgsIGhzdFxuICAgICAgICBjbWRcbiAgICAgICAgXG4gICAgQGNsZWFyOiA9PlxuICAgICAgICBcbiAgICAgICAgQGxpc3QgPSBbXVxuICAgICAgICBwcmVmcy5zZXQgJ2hpc3RvcnknIEBsaXN0XG4gICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQDogKEB0ZXJtKSAtPlxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnaGlzdG9yeSBzcGxpY2UnIEBvblNwbGljZVxuICAgICAgICBAZWRpdG9yID0gQHRlcm0uZWRpdG9yXG4gICAgICAgIEBpbmRleCA9IC0xXG4gICAgICAgXG4gICAgc2hlbGxDbWQ6IChjbWQpIC0+ICMgY21kIHdpbGwgZXhldXRlIGluIHNoZWxsXG4gICAgICAgIFxuICAgICAgICBpZiBAaW5kZXggPj0gMFxuICAgICAgICAgICAgaWYgY21kICE9IEhpc3RvcnkubGlzdFtAaW5kZXhdXG4gICAgICAgICAgICAgICAgQGluZGV4ID0gLTFcbiAgICAgICAgXG4gICAgY21kOiAoYXJnKSAtPiAjIGhpc3RvcnkgY29tbWFuZFxuICAgIFxuICAgICAgICBbYXJnLCByZXN0Li4uXSA9IGFyZy5zcGxpdCAnICdcbiAgICBcbiAgICAgICAgc3dpdGNoIGFyZ1xuICAgICAgICAgICAgd2hlbiAnbGlzdCcgdGhlbiBAbGlzdCgpXG4gICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICBvblNwbGljZTogKGluZGV4KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGluZGV4ID4gMCBhbmQgQGluZGV4ID49IGluZGV4XG4gICAgICAgICAgICBAaW5kZXgtLVxuXG4gICAgbGlzdDogLT4gXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLmFwcGVuZE91dHB1dCAoXCIje2tzdHIucnBhZCBpLCAzfSAje0hpc3RvcnkubGlzdFtpXX1cIiBmb3IgaSBpbiBbMC4uLkhpc3RvcnkubGlzdC5sZW5ndGhdKS5qb2luICdcXG4nXG4gICAgICAgICAgICBcbiAgICBwcmV2OiAtPlxuXG4gICAgICAgIGlmIEBpbmRleCA9PSAwIG9yIGVtcHR5IEhpc3RvcnkubGlzdFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGlmIEBpbmRleCA8IDBcbiAgICAgICAgICAgIEBzaG93IDBcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAc2hvdyAtMVxuICAgICAgICBcbiAgICBuZXh0OiAtPiBcblxuICAgICAgICBpZiBAaW5kZXggPCAwIG9yIGVtcHR5IEhpc3RvcnkubGlzdFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGlmIEBpbmRleCsxID49IEhpc3RvcnkubGlzdC5sZW5ndGhcbiAgICAgICAgICAgIEBpbmRleCA9IC0xIFxuICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgJydcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAc2hvdyArMVxuICAgICAgICBcbiAgICBzaG93OiAoZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGxsID0gSGlzdG9yeS5saXN0Lmxlbmd0aFxuICAgICAgICBAaW5kZXggPSAoQGluZGV4K2xsK2QpICUgbGxcbiAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgSGlzdG9yeS5saXN0W0BpbmRleF1cbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEhpc3RvcnlcbiJdfQ==
//# sourceURL=../coffee/history.coffee