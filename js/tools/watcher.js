// koffee 1.4.0

/*
000   000   0000000   000000000   0000000  000   000  00000000  00000000 
000 0 000  000   000     000     000       000   000  000       000   000
000000000  000000000     000     000       000000000  0000000   0000000  
000   000  000   000     000     000       000   000  000       000   000
00     00  000   000     000      0000000  000   000  00000000  000   000
 */
var Watcher, fs, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, slash = ref.slash, fs = ref.fs;

Watcher = (function() {
    Watcher.id = 0;

    function Watcher(file) {
        this.file = file;
        this.onRename = bind(this.onRename, this);
        this.onChange = bind(this.onChange, this);
        this.onExists = bind(this.onExists, this);
        this.id = Watcher.id++;
        slash.exists(this.file, this.onExists);
    }

    Watcher.prototype.onExists = function(stat) {
        if (!stat) {
            return;
        }
        if (!this.id) {
            return;
        }
        this.mtime = stat.mtimeMs;
        this.w = fs.watch(this.file);
        this.w.on('change', (function(_this) {
            return function(changeType, p) {
                if (changeType === 'change') {
                    return slash.exists(_this.file, _this.onChange);
                } else {
                    return slash.exists(_this.file, _this.onRename);
                }
            };
        })(this));
        return this.w.on('unlink', (function(_this) {
            return function(p) {};
        })(this));
    };

    Watcher.prototype.onChange = function(stat) {
        if (stat.mtimeMs !== this.mtime) {
            this.mtime = stat.mtimeMs;
            return post.emit('reloadFile', this.file);
        }
    };

    Watcher.prototype.onRename = function(stat) {
        if (!stat) {
            this.stop();
            return post.emit('removeFile', this.file);
        }
    };

    Watcher.prototype.stop = function() {
        var ref1;
        if ((ref1 = this.w) != null) {
            ref1.close();
        }
        delete this.w;
        return this.id = 0;
    };

    return Watcher;

})();

module.exports = Watcher;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsNkJBQUE7SUFBQTs7QUFRQSxNQUFzQixPQUFBLENBQVEsS0FBUixDQUF0QixFQUFFLGVBQUYsRUFBUSxpQkFBUixFQUFlOztBQUVUO0lBRUYsT0FBQyxDQUFBLEVBQUQsR0FBSzs7SUFFRixpQkFBQyxJQUFEO1FBQUMsSUFBQyxDQUFBLE9BQUQ7Ozs7UUFFQSxJQUFDLENBQUEsRUFBRCxHQUFNLE9BQU8sQ0FBQyxFQUFSO1FBQ04sS0FBSyxDQUFDLE1BQU4sQ0FBYSxJQUFDLENBQUEsSUFBZCxFQUFvQixJQUFDLENBQUEsUUFBckI7SUFIRDs7c0JBS0gsUUFBQSxHQUFVLFNBQUMsSUFBRDtRQUVOLElBQVUsQ0FBSSxJQUFkO0FBQUEsbUJBQUE7O1FBQ0EsSUFBVSxDQUFJLElBQUMsQ0FBQSxFQUFmO0FBQUEsbUJBQUE7O1FBQ0EsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJLENBQUM7UUFFZCxJQUFDLENBQUEsQ0FBRCxHQUFLLEVBQUUsQ0FBQyxLQUFILENBQVMsSUFBQyxDQUFBLElBQVY7UUFDTCxJQUFDLENBQUEsQ0FBQyxDQUFDLEVBQUgsQ0FBTSxRQUFOLEVBQWUsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxVQUFELEVBQWEsQ0FBYjtnQkFFWCxJQUFHLFVBQUEsS0FBYyxRQUFqQjsyQkFDSSxLQUFLLENBQUMsTUFBTixDQUFhLEtBQUMsQ0FBQSxJQUFkLEVBQW9CLEtBQUMsQ0FBQSxRQUFyQixFQURKO2lCQUFBLE1BQUE7MkJBR0ksS0FBSyxDQUFDLE1BQU4sQ0FBYSxLQUFDLENBQUEsSUFBZCxFQUFvQixLQUFDLENBQUEsUUFBckIsRUFISjs7WUFGVztRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZjtlQU9BLElBQUMsQ0FBQSxDQUFDLENBQUMsRUFBSCxDQUFNLFFBQU4sRUFBZSxDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFDLENBQUQsR0FBQTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZjtJQWRNOztzQkFnQlYsUUFBQSxHQUFVLFNBQUMsSUFBRDtRQUVOLElBQUcsSUFBSSxDQUFDLE9BQUwsS0FBZ0IsSUFBQyxDQUFBLEtBQXBCO1lBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJLENBQUM7bUJBQ2QsSUFBSSxDQUFDLElBQUwsQ0FBVSxZQUFWLEVBQXVCLElBQUMsQ0FBQSxJQUF4QixFQUZKOztJQUZNOztzQkFNVixRQUFBLEdBQVUsU0FBQyxJQUFEO1FBRU4sSUFBRyxDQUFJLElBQVA7WUFDSSxJQUFDLENBQUEsSUFBRCxDQUFBO21CQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsWUFBVixFQUF1QixJQUFDLENBQUEsSUFBeEIsRUFGSjs7SUFGTTs7c0JBTVYsSUFBQSxHQUFNLFNBQUE7QUFFRixZQUFBOztnQkFBRSxDQUFFLEtBQUosQ0FBQTs7UUFDQSxPQUFPLElBQUMsQ0FBQTtlQUNSLElBQUMsQ0FBQSxFQUFELEdBQU07SUFKSjs7Ozs7O0FBTVYsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwICAgICAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IHBvc3QsIHNsYXNoLCBmcyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBXYXRjaGVyXG5cbiAgICBAaWQ6IDBcbiAgICBcbiAgICBAOiAoQGZpbGUpIC0+XG5cbiAgICAgICAgQGlkID0gV2F0Y2hlci5pZCsrXG4gICAgICAgIHNsYXNoLmV4aXN0cyBAZmlsZSwgQG9uRXhpc3RzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG9uRXhpc3RzOiAoc3RhdCkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3Qgc3RhdFxuICAgICAgICByZXR1cm4gaWYgbm90IEBpZFxuICAgICAgICBAbXRpbWUgPSBzdGF0Lm10aW1lTXNcbiAgICAgICAgXG4gICAgICAgIEB3ID0gZnMud2F0Y2ggQGZpbGVcbiAgICAgICAgQHcub24gJ2NoYW5nZScgKGNoYW5nZVR5cGUsIHApID0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNoYW5nZVR5cGUgPT0gJ2NoYW5nZSdcbiAgICAgICAgICAgICAgICBzbGFzaC5leGlzdHMgQGZpbGUsIEBvbkNoYW5nZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHNsYXNoLmV4aXN0cyBAZmlsZSwgQG9uUmVuYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgQHcub24gJ3VubGluaycgKHApID0+IFxuICAgICAgICBcbiAgICBvbkNoYW5nZTogKHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBzdGF0Lm10aW1lTXMgIT0gQG10aW1lXG4gICAgICAgICAgICBAbXRpbWUgPSBzdGF0Lm10aW1lTXNcbiAgICAgICAgICAgIHBvc3QuZW1pdCAncmVsb2FkRmlsZScgQGZpbGVcblxuICAgIG9uUmVuYW1lOiAoc3RhdCkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBzdGF0XG4gICAgICAgICAgICBAc3RvcCgpXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3JlbW92ZUZpbGUnIEBmaWxlXG4gICAgICAgICAgICBcbiAgICBzdG9wOiAtPlxuICAgICAgICBcbiAgICAgICAgQHc/LmNsb3NlKClcbiAgICAgICAgZGVsZXRlIEB3XG4gICAgICAgIEBpZCA9IDBcblxubW9kdWxlLmV4cG9ydHMgPSBXYXRjaGVyXG4iXX0=
//# sourceURL=../../coffee/tools/watcher.coffee