// koffee 1.12.0

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvdG9vbHMiLCJzb3VyY2VzIjpbIndhdGNoZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDZCQUFBO0lBQUE7O0FBUUEsTUFBc0IsT0FBQSxDQUFRLEtBQVIsQ0FBdEIsRUFBRSxlQUFGLEVBQVEsaUJBQVIsRUFBZTs7QUFFVDtJQUVGLE9BQUMsQ0FBQSxFQUFELEdBQUs7O0lBRUYsaUJBQUMsSUFBRDtRQUFDLElBQUMsQ0FBQSxPQUFEOzs7O1FBRUEsSUFBQyxDQUFBLEVBQUQsR0FBTSxPQUFPLENBQUMsRUFBUjtRQUNOLEtBQUssQ0FBQyxNQUFOLENBQWEsSUFBQyxDQUFBLElBQWQsRUFBb0IsSUFBQyxDQUFBLFFBQXJCO0lBSEQ7O3NCQUtILFFBQUEsR0FBVSxTQUFDLElBQUQ7UUFFTixJQUFVLENBQUksSUFBZDtBQUFBLG1CQUFBOztRQUNBLElBQVUsQ0FBSSxJQUFDLENBQUEsRUFBZjtBQUFBLG1CQUFBOztRQUNBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxDQUFDO1FBRWQsSUFBQyxDQUFBLENBQUQsR0FBSyxFQUFFLENBQUMsS0FBSCxDQUFTLElBQUMsQ0FBQSxJQUFWO1FBQ0wsSUFBQyxDQUFBLENBQUMsQ0FBQyxFQUFILENBQU0sUUFBTixFQUFlLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUMsVUFBRCxFQUFhLENBQWI7Z0JBRVgsSUFBRyxVQUFBLEtBQWMsUUFBakI7MkJBQ0ksS0FBSyxDQUFDLE1BQU4sQ0FBYSxLQUFDLENBQUEsSUFBZCxFQUFvQixLQUFDLENBQUEsUUFBckIsRUFESjtpQkFBQSxNQUFBOzJCQUdJLEtBQUssQ0FBQyxNQUFOLENBQWEsS0FBQyxDQUFBLElBQWQsRUFBb0IsS0FBQyxDQUFBLFFBQXJCLEVBSEo7O1lBRlc7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7ZUFPQSxJQUFDLENBQUEsQ0FBQyxDQUFDLEVBQUgsQ0FBTSxRQUFOLEVBQWUsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxDQUFELEdBQUE7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWY7SUFkTTs7c0JBZ0JWLFFBQUEsR0FBVSxTQUFDLElBQUQ7UUFFTixJQUFHLElBQUksQ0FBQyxPQUFMLEtBQWdCLElBQUMsQ0FBQSxLQUFwQjtZQUNJLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBSSxDQUFDO21CQUNkLElBQUksQ0FBQyxJQUFMLENBQVUsWUFBVixFQUF1QixJQUFDLENBQUEsSUFBeEIsRUFGSjs7SUFGTTs7c0JBTVYsUUFBQSxHQUFVLFNBQUMsSUFBRDtRQUVOLElBQUcsQ0FBSSxJQUFQO1lBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBQTttQkFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBdUIsSUFBQyxDQUFBLElBQXhCLEVBRko7O0lBRk07O3NCQU1WLElBQUEsR0FBTSxTQUFBO0FBRUYsWUFBQTs7Z0JBQUUsQ0FBRSxLQUFKLENBQUE7O1FBQ0EsT0FBTyxJQUFDLENBQUE7ZUFDUixJQUFDLENBQUEsRUFBRCxHQUFNO0lBSko7Ozs7OztBQU1WLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBzbGFzaCwgZnMgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgV2F0Y2hlclxuXG4gICAgQGlkOiAwXG4gICAgXG4gICAgQDogKEBmaWxlKSAtPlxuXG4gICAgICAgIEBpZCA9IFdhdGNoZXIuaWQrK1xuICAgICAgICBzbGFzaC5leGlzdHMgQGZpbGUsIEBvbkV4aXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICBvbkV4aXN0czogKHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHN0YXRcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAaWRcbiAgICAgICAgQG10aW1lID0gc3RhdC5tdGltZU1zXG4gICAgICAgIFxuICAgICAgICBAdyA9IGZzLndhdGNoIEBmaWxlXG4gICAgICAgIEB3Lm9uICdjaGFuZ2UnIChjaGFuZ2VUeXBlLCBwKSA9PlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjaGFuZ2VUeXBlID09ICdjaGFuZ2UnXG4gICAgICAgICAgICAgICAgc2xhc2guZXhpc3RzIEBmaWxlLCBAb25DaGFuZ2VcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBzbGFzaC5leGlzdHMgQGZpbGUsIEBvblJlbmFtZVxuICAgICAgICAgICAgXG4gICAgICAgIEB3Lm9uICd1bmxpbmsnIChwKSA9PiBcbiAgICAgICAgXG4gICAgb25DaGFuZ2U6IChzdGF0KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgc3RhdC5tdGltZU1zICE9IEBtdGltZVxuICAgICAgICAgICAgQG10aW1lID0gc3RhdC5tdGltZU1zXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3JlbG9hZEZpbGUnIEBmaWxlXG5cbiAgICBvblJlbmFtZTogKHN0YXQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc3RhdFxuICAgICAgICAgICAgQHN0b3AoKVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdyZW1vdmVGaWxlJyBAZmlsZVxuICAgICAgICAgICAgXG4gICAgc3RvcDogLT5cbiAgICAgICAgXG4gICAgICAgIEB3Py5jbG9zZSgpXG4gICAgICAgIGRlbGV0ZSBAd1xuICAgICAgICBAaWQgPSAwXG5cbm1vZHVsZS5leHBvcnRzID0gV2F0Y2hlclxuIl19
//# sourceURL=../../coffee/tools/watcher.coffee