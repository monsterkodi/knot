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
        History.maxHist = 100;
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
        while (History.list.length > History.maxHist) {
            History.list.shift();
        }
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
        return this.index = -1;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsOENBQUE7SUFBQTs7O0FBUUEsTUFBdUMsT0FBQSxDQUFRLEtBQVIsQ0FBdkMsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0IsaUJBQWhCLEVBQXVCLGlCQUF2QixFQUE4Qjs7QUFFeEI7SUFRRixPQUFDLENBQUEsSUFBRCxHQUFROztJQUVSLE9BQUMsQ0FBQSxJQUFELEdBQU8sU0FBQTtRQUVILE9BQUMsQ0FBQSxPQUFELEdBQVc7UUFDWCxPQUFDLENBQUEsSUFBRCxHQUFRLEtBQUssQ0FBQyxHQUFOLENBQVUsU0FBVixFQUFvQixFQUFwQjtlQUNSLElBQUksQ0FBQyxFQUFMLENBQVEsS0FBUixFQUFjLE9BQUMsQ0FBQSxLQUFmO0lBSkc7O0lBTVAsT0FBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLElBQUQ7QUFFSixZQUFBO1FBRksseUNBQUU7UUFFUCxJQUFVLEdBQUEsS0FBUSxHQUFSLElBQUEsR0FBQSxLQUFXLFNBQVgsSUFBQSxHQUFBLEtBQW9CLEdBQXBCLElBQUEsR0FBQSxLQUF1QixPQUFqQztBQUFBLG1CQUFBOztRQUNBLElBQVUsR0FBSSxDQUFBLENBQUEsQ0FBSixLQUFVLEdBQXBCO0FBQUEsbUJBQUE7O1FBQ0EsSUFBVSxHQUFBLEtBQU8sT0FBQyxDQUFBLElBQUssVUFBRSxDQUFBLENBQUEsQ0FBekI7QUFBQSxtQkFBQTs7UUFFQSxJQUFHLE9BQUMsQ0FBQSxJQUFJLENBQUMsTUFBVDtBQUNJLGlCQUFTLDhGQUFUO2dCQUNJLElBQUcsT0FBQyxDQUFBLElBQUssQ0FBQSxDQUFBLENBQU4sS0FBWSxHQUFmO29CQUNJLE9BQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFhLENBQWIsRUFBZ0IsQ0FBaEI7b0JBQ0EsSUFBSSxDQUFDLElBQUwsQ0FBVSxnQkFBVixFQUEyQixDQUEzQjtBQUNBLDBC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QSxDQUFNLE9BQU8sQ0FBQyxJQUFkLENBQWpCO0FBQ0ksbUJBREo7O1FBRUEsSUFBRyxJQUFDLENBQUEsS0FBRCxHQUFPLENBQVAsSUFBWSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQTVCO1lBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFDO1lBQ1YsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLEVBQXJCO0FBQ0EsbUJBSEo7O2VBSUEsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFDLENBQVA7SUFSRTs7c0JBVU4sSUFBQSxHQUFNLFNBQUMsQ0FBRDtBQUVGLFlBQUE7UUFBQSxFQUFBLEdBQUssT0FBTyxDQUFDLElBQUksQ0FBQztRQUNsQixJQUFDLENBQUEsS0FBRCxHQUFTLENBQUMsSUFBQyxDQUFBLEtBQUQsR0FBTyxFQUFQLEdBQVUsQ0FBWCxDQUFBLEdBQWdCO2VBQ3pCLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFxQixPQUFPLENBQUMsSUFBSyxDQUFBLElBQUMsQ0FBQSxLQUFELENBQWxDO0lBSkU7Ozs7OztBQU1WLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMCBcbjAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuMDAwICAgMDAwICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICBcbiMjI1xuXG57IHBvc3QsIG1hdGNociwgcHJlZnMsIGVtcHR5LCBrc3RyIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEhpc3RvcnlcblxuICAgICMgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgQGxpc3QgPSBbXVxuICAgIFxuICAgIEBpbml0OiA9PlxuICAgICAgICBcbiAgICAgICAgQG1heEhpc3QgPSAxMDBcbiAgICAgICAgQGxpc3QgPSBwcmVmcy5nZXQgJ2hpc3RvcnknIFtdXG4gICAgICAgIHBvc3Qub24gJ2NtZCcgQG9uQ21kXG4gICAgICAgIFxuICAgIEBvbkNtZDogKGNtZDopID0+ICMgY21kIGRpZCBzdWNjZWVkXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgY21kIGluIFsnaCcnaGlzdG9yeScnYycnY2xlYXInXVxuICAgICAgICByZXR1cm4gaWYgY21kWzBdID09ICchJ1xuICAgICAgICByZXR1cm4gaWYgY21kID09IEBsaXN0Wy0xXVxuICAgICAgICBcbiAgICAgICAgaWYgQGxpc3QubGVuZ3RoIFxuICAgICAgICAgICAgZm9yIGkgaW4gW0BsaXN0Lmxlbmd0aC0yLi4wXVxuICAgICAgICAgICAgICAgIGlmIEBsaXN0W2ldID09IGNtZFxuICAgICAgICAgICAgICAgICAgICBAbGlzdC5zcGxpY2UgaSwgMVxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2hpc3Rvcnkgc3BsaWNlJyBpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIFxuICAgICAgICBAbGlzdC5wdXNoIGNtZFxuICAgICAgICB3aGlsZSBAbGlzdC5sZW5ndGggPiBAbWF4SGlzdFxuICAgICAgICAgICAgQGxpc3Quc2hpZnQoKVxuICAgICAgICBwcmVmcy5zZXQgJ2hpc3RvcnknIEBsaXN0XG4gICAgICAgIFxuICAgIEBzdWJzdGl0dXRlOiAoY21kKSAtPlxuICAgICAgICBpZiBjbWQgPT0gJyEnXG4gICAgICAgICAgICByZXR1cm4gQGxpc3RbLTFdXG4gICAgICAgIGZvciBybmcgaW4gbWF0Y2hyLnJhbmdlcygvIS0/XFxkKy8sIGNtZCkucmV2ZXJzZSgpXG4gICAgICAgICAgICBpbmRleCA9IHBhcnNlSW50IHJuZy5tYXRjaFsxLi5dXG4gICAgICAgICAgICBpbmRleCArPSBAbGlzdC5sZW5ndGggaWYgaW5kZXggPCAwXG4gICAgICAgICAgICBpZiBoc3QgPSBAbGlzdFtpbmRleF1cbiAgICAgICAgICAgICAgICBjbWQgPSBjbWQuc3BsaWNlIHJuZy5zdGFydCwgcm5nLm1hdGNoLmxlbmd0aCwgaHN0XG4gICAgICAgIGNtZFxuICAgICAgICBcbiAgICBAY2xlYXI6ID0+XG4gICAgICAgIFxuICAgICAgICBAbGlzdCA9IFtdXG4gICAgICAgIHByZWZzLnNldCAnaGlzdG9yeScgQGxpc3RcbiAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAOiAoQHRlcm0pIC0+XG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdoaXN0b3J5IHNwbGljZScgQG9uU3BsaWNlXG4gICAgICAgIEBlZGl0b3IgPSBAdGVybS5lZGl0b3JcbiAgICAgICAgQGluZGV4ID0gLTFcbiAgICAgICBcbiAgICBzaGVsbENtZDogKGNtZCkgLT4gIyBjbWQgd2lsbCBleGVjdXRlIGluIHNoZWxsXG4gICAgICAgIFxuICAgICAgICBAaW5kZXggPSAtMVxuICAgICAgICBcbiAgICBjbWQ6IChhcmcpIC0+ICMgaGlzdG9yeSBjb21tYW5kXG4gICAgXG4gICAgICAgIFthcmcsIHJlc3QuLi5dID0gYXJnLnNwbGl0ICcgJ1xuICAgIFxuICAgICAgICBzd2l0Y2ggYXJnXG4gICAgICAgICAgICB3aGVuICdsaXN0JyB0aGVuIEBsaXN0KClcbiAgICAgICAgdHJ1ZVxuICAgICAgICAgICAgICAgIFxuICAgIG9uU3BsaWNlOiAoaW5kZXgpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBAaW5kZXggPiAwIGFuZCBAaW5kZXggPj0gaW5kZXhcbiAgICAgICAgICAgIEBpbmRleC0tXG5cbiAgICBsaXN0OiAtPiBcbiAgICAgICAgXG4gICAgICAgIEBlZGl0b3IuYXBwZW5kT3V0cHV0IChcIiN7a3N0ci5ycGFkIGksIDN9ICN7SGlzdG9yeS5saXN0W2ldfVwiIGZvciBpIGluIFswLi4uSGlzdG9yeS5saXN0Lmxlbmd0aF0pLmpvaW4gJ1xcbidcbiAgICAgICAgICAgIFxuICAgIHByZXY6IC0+XG5cbiAgICAgICAgaWYgQGluZGV4ID09IDAgb3IgZW1wdHkgSGlzdG9yeS5saXN0XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgaWYgQGluZGV4IDwgMFxuICAgICAgICAgICAgQHNob3cgMFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBzaG93IC0xXG4gICAgICAgIFxuICAgIG5leHQ6IC0+IFxuXG4gICAgICAgIGlmIEBpbmRleCA8IDAgb3IgZW1wdHkgSGlzdG9yeS5saXN0XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgaWYgQGluZGV4KzEgPj0gSGlzdG9yeS5saXN0Lmxlbmd0aFxuICAgICAgICAgICAgQGluZGV4ID0gLTEgXG4gICAgICAgICAgICBAZWRpdG9yLnNldElucHV0VGV4dCAnJ1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBzaG93ICsxXG4gICAgICAgIFxuICAgIHNob3c6IChkKSAtPlxuICAgICAgICBcbiAgICAgICAgbGwgPSBIaXN0b3J5Lmxpc3QubGVuZ3RoXG4gICAgICAgIEBpbmRleCA9IChAaW5kZXgrbGwrZCkgJSBsbFxuICAgICAgICBAZWRpdG9yLnNldElucHV0VGV4dCBIaXN0b3J5Lmxpc3RbQGluZGV4XVxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gSGlzdG9yeVxuIl19
//# sourceURL=../coffee/history.coffee