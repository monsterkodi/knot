// koffee 1.4.0

/*
000   000  000   0000000  000000000   0000000   00000000   000   000
000   000  000  000          000     000   000  000   000   000 000 
000000000  000  0000000      000     000   000  0000000      00000  
000   000  000       000     000     000   000  000   000     000   
000   000  000  0000000      000      0000000   000   000     000
 */
var History, empty, klog, kstr, matchr, post, prefs, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

ref = require('kxk'), post = ref.post, matchr = ref.matchr, prefs = ref.prefs, empty = ref.empty, klog = ref.klog, kstr = ref.kstr;

History = (function() {
    History.list = [];

    History.init = function() {
        History.list = prefs.get('history', []);
        return post.on('cmd', History.onCmd);
    };

    History.onCmd = function(cmd) {
        var i, j, ref1;
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
            for (i = j = ref1 = History.list.length - 2; ref1 <= 0 ? j <= 0 : j >= 0; i = ref1 <= 0 ? ++j : --j) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0RBQUE7SUFBQTs7O0FBUUEsTUFBNkMsT0FBQSxDQUFRLEtBQVIsQ0FBN0MsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0IsaUJBQWhCLEVBQXVCLGlCQUF2QixFQUE4QixlQUE5QixFQUFvQzs7QUFFOUI7SUFRRixPQUFDLENBQUEsSUFBRCxHQUFROztJQUVSLE9BQUMsQ0FBQSxJQUFELEdBQU8sU0FBQTtRQUVILE9BQUMsQ0FBQSxJQUFELEdBQVEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxTQUFWLEVBQW9CLEVBQXBCO2VBQ1IsSUFBSSxDQUFDLEVBQUwsQ0FBUSxLQUFSLEVBQWMsT0FBQyxDQUFBLEtBQWY7SUFIRzs7SUFLUCxPQUFDLENBQUEsS0FBRCxHQUFRLFNBQUMsR0FBRDtBQUVKLFlBQUE7UUFBQSxJQUFVLEdBQUEsS0FBUSxHQUFSLElBQUEsR0FBQSxLQUFXLFNBQVgsSUFBQSxHQUFBLEtBQW9CLEdBQXBCLElBQUEsR0FBQSxLQUF1QixPQUFqQztBQUFBLG1CQUFBOztRQUNBLElBQVUsR0FBSSxDQUFBLENBQUEsQ0FBSixLQUFVLEdBQXBCO0FBQUEsbUJBQUE7O1FBQ0EsSUFBVSxHQUFBLEtBQU8sT0FBQyxDQUFBLElBQUssVUFBRSxDQUFBLENBQUEsQ0FBekI7QUFBQSxtQkFBQTs7UUFFQSxJQUFHLE9BQUMsQ0FBQSxJQUFJLENBQUMsTUFBVDtBQUNJLGlCQUFTLDhGQUFUO2dCQUNJLElBQUcsT0FBQyxDQUFBLElBQUssQ0FBQSxDQUFBLENBQU4sS0FBWSxHQUFmO29CQUNJLE9BQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLENBQWIsRUFBZ0IsQ0FBaEI7b0JBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxnQkFBVixFQUEyQixDQUEzQjtBQUNBLDBCQUhKOztBQURKLGFBREo7O1FBT0EsT0FB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QUFDLElBQWQsQ0FBakI7QUFDSSxtQkFESjs7UUFFQSxJQUFHLElBQUMsQ0FBQSxLQUFELEdBQU8sQ0FBUCxJQUFZLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBNUI7WUFDSSxJQUFDLENBQUEsS0FBRCxHQUFTLENBQUM7WUFDVixJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsRUFBckI7QUFDQSxtQkFISjs7ZUFJQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUMsQ0FBUDtJQVJFOztzQkFVTixJQUFBLEdBQU0sU0FBQyxDQUFEO0FBRUYsWUFBQTtRQUFBLEVBQUEsR0FBSyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ2xCLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQyxJQUFDLENBQUEsS0FBRCxHQUFPLEVBQVAsR0FBVSxDQUFYLENBQUEsR0FBZ0I7ZUFDekIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLE9BQU8sQ0FBQyxJQUFLLENBQUEsSUFBQyxDQUFBLEtBQUQsQ0FBbEM7SUFKRTs7Ozs7O0FBTVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAgMDAwIFxuMDAwMDAwMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMDAwICBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuIyMjXG5cbnsgcG9zdCwgbWF0Y2hyLCBwcmVmcywgZW1wdHksIGtsb2csIGtzdHIgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgSGlzdG9yeVxuXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAgICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICBcbiAgICBAbGlzdCA9IFtdXG4gICAgXG4gICAgQGluaXQ6ID0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdCA9IHByZWZzLmdldCAnaGlzdG9yeScgW11cbiAgICAgICAgcG9zdC5vbiAnY21kJyBAb25DbWRcbiAgICAgICAgXG4gICAgQG9uQ21kOiAoY21kKSA9PiAjIGNtZCBkaWQgc3VjY2VlZFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIGNtZCBpbiBbJ2gnJ2hpc3RvcnknJ2MnJ2NsZWFyJ11cbiAgICAgICAgcmV0dXJuIGlmIGNtZFswXSA9PSAnISdcbiAgICAgICAgcmV0dXJuIGlmIGNtZCA9PSBAbGlzdFstMV1cbiAgICAgICAgXG4gICAgICAgIGlmIEBsaXN0Lmxlbmd0aCBcbiAgICAgICAgICAgIGZvciBpIGluIFtAbGlzdC5sZW5ndGgtMi4uMF1cbiAgICAgICAgICAgICAgICBpZiBAbGlzdFtpXSA9PSBjbWRcbiAgICAgICAgICAgICAgICAgICAgQGxpc3Quc3BsaWNlIGksIDFcbiAgICAgICAgICAgICAgICAgICAgcG9zdC5lbWl0ICdoaXN0b3J5IHNwbGljZScgaVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICBcbiAgICAgICAgQGxpc3QucHVzaCBjbWRcbiAgICAgICAgcHJlZnMuc2V0ICdoaXN0b3J5JyBAbGlzdFxuICAgICAgICBcbiAgICBAc3Vic3RpdHV0ZTogKGNtZCkgLT5cbiAgICAgICAgaWYgY21kID09ICchJ1xuICAgICAgICAgICAgcmV0dXJuIEBsaXN0Wy0xXVxuICAgICAgICBmb3Igcm5nIGluIG1hdGNoci5yYW5nZXMoLyEtP1xcZCsvLCBjbWQpLnJldmVyc2UoKVxuICAgICAgICAgICAgaW5kZXggPSBwYXJzZUludCBybmcubWF0Y2hbMS4uXVxuICAgICAgICAgICAgaW5kZXggKz0gQGxpc3QubGVuZ3RoIGlmIGluZGV4IDwgMFxuICAgICAgICAgICAgaWYgaHN0ID0gQGxpc3RbaW5kZXhdXG4gICAgICAgICAgICAgICAgY21kID0gY21kLnNwbGljZSBybmcuc3RhcnQsIHJuZy5tYXRjaC5sZW5ndGgsIGhzdFxuICAgICAgICBjbWRcbiAgICAgICAgXG4gICAgQGNsZWFyOiA9PlxuICAgICAgICBcbiAgICAgICAgQGxpc3QgPSBbXVxuICAgICAgICBwcmVmcy5zZXQgJ2hpc3RvcnknIEBsaXN0XG4gICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwICAgICAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgQDogKEB0ZXJtKSAtPlxuICAgICAgICBcbiAgICAgICAgcG9zdC5vbiAnaGlzdG9yeSBzcGxpY2UnIEBvblNwbGljZVxuICAgICAgICBAZWRpdG9yID0gQHRlcm0uZWRpdG9yXG4gICAgICAgIEBpbmRleCA9IC0xXG4gICAgICAgXG4gICAgc2hlbGxDbWQ6IChjbWQpIC0+ICMgY21kIHdpbGwgZXhldXRlIGluIHNoZWxsXG4gICAgICAgIFxuICAgICAgICBpZiBAaW5kZXggPj0gMFxuICAgICAgICAgICAgaWYgY21kICE9IEhpc3RvcnkubGlzdFtAaW5kZXhdXG4gICAgICAgICAgICAgICAgQGluZGV4ID0gLTFcbiAgICAgICAgXG4gICAgY21kOiAoYXJnKSAtPiAjIGhpc3RvcnkgY29tbWFuZFxuICAgIFxuICAgICAgICBbYXJnLCByZXN0Li4uXSA9IGFyZy5zcGxpdCAnICdcbiAgICBcbiAgICAgICAgc3dpdGNoIGFyZ1xuICAgICAgICAgICAgd2hlbiAnbGlzdCcgdGhlbiBAbGlzdCgpXG4gICAgICAgIHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICBvblNwbGljZTogKGluZGV4KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQGluZGV4ID4gMCBhbmQgQGluZGV4ID49IGluZGV4XG4gICAgICAgICAgICBAaW5kZXgtLVxuXG4gICAgbGlzdDogLT4gXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLmFwcGVuZE91dHB1dCAoXCIje2tzdHIucnBhZCBpLCAzfSAje0hpc3RvcnkubGlzdFtpXX1cIiBmb3IgaSBpbiBbMC4uLkhpc3RvcnkubGlzdC5sZW5ndGhdKS5qb2luICdcXG4nXG4gICAgICAgICAgICBcbiAgICBwcmV2OiAtPlxuXG4gICAgICAgIGlmIEBpbmRleCA9PSAwIG9yIGVtcHR5IEhpc3RvcnkubGlzdFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGlmIEBpbmRleCA8IDBcbiAgICAgICAgICAgIEBzaG93IDBcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAc2hvdyAtMVxuICAgICAgICBcbiAgICBuZXh0OiAtPiBcblxuICAgICAgICBpZiBAaW5kZXggPCAwIG9yIGVtcHR5IEhpc3RvcnkubGlzdFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGlmIEBpbmRleCsxID49IEhpc3RvcnkubGlzdC5sZW5ndGhcbiAgICAgICAgICAgIEBpbmRleCA9IC0xIFxuICAgICAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgJydcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAc2hvdyArMVxuICAgICAgICBcbiAgICBzaG93OiAoZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGxsID0gSGlzdG9yeS5saXN0Lmxlbmd0aFxuICAgICAgICBAaW5kZXggPSAoQGluZGV4K2xsK2QpICUgbGxcbiAgICAgICAgQGVkaXRvci5zZXRJbnB1dFRleHQgSGlzdG9yeS5saXN0W0BpbmRleF1cbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEhpc3RvcnlcbiJdfQ==
//# sourceURL=../coffee/history.coffee