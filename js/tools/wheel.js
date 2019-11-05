// koffee 1.4.0

/*
000   000  000   000  00000000  00000000  000    
000 0 000  000   000  000       000       000    
000000000  000000000  0000000   0000000   000    
000   000  000   000  000       000       000    
00     00  000   000  00000000  00000000  0000000
 */
var Wheel, clamp, keyinfo, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, keyinfo = ref.keyinfo, clamp = ref.clamp;

Wheel = (function() {
    function Wheel() {
        this.onAnimation = bind(this.onAnimation, this);
        this.onMouseDown = bind(this.onMouseDown, this);
        this.onWheel = bind(this.onWheel, this);
        this.accum = 0;
        document.addEventListener('mousedown', this.onMouseDown, true);
        post.on('stopWheel', (function(_this) {
            return function() {
                return _this.accum = 0;
            };
        })(this));
    }

    Wheel.prototype.onWheel = function(event) {
        var combo, delta, key, mod, ref1, scrollFactor;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo;
        scrollFactor = function() {
            var f;
            f = 1;
            f *= 1 + 3 * event.shiftKey;
            return f *= 1 + 7 * event.altKey;
        };
        delta = event.deltaY * scrollFactor();
        if ((this.accum < 0 && delta > 0) || (this.accum > 0 && delta < 0)) {
            return this.accum = 0;
        } else {
            if (this.accum === 0) {
                window.requestAnimationFrame(this.onAnimation);
            }
            this.accum += delta;
            return post.emit('scrollBy', this.accum / 10);
        }
    };

    Wheel.prototype.onMouseDown = function(event) {
        return this.accum = 0;
    };

    Wheel.prototype.onAnimation = function(now) {
        var delta;
        this.accum = clamp(-100000, 100000, this.accum * 0.99);
        delta = this.accum / 10;
        post.emit('scrollBy', delta);
        if (Math.abs(this.accum) < 10) {
            return this.accum = 0;
        } else {
            return window.requestAnimationFrame(this.onAnimation);
        }
    };

    return Wheel;

})();

module.exports = Wheel;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2hlZWwuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGdDQUFBO0lBQUE7O0FBUUEsTUFBMkIsT0FBQSxDQUFRLEtBQVIsQ0FBM0IsRUFBRSxlQUFGLEVBQVEscUJBQVIsRUFBaUI7O0FBRVg7SUFFQyxlQUFBOzs7O1FBRUMsSUFBQyxDQUFBLEtBQUQsR0FBUztRQUVULFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixXQUExQixFQUFzQyxJQUFDLENBQUEsV0FBdkMsRUFBb0QsSUFBcEQ7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFdBQVIsRUFBb0IsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQTt1QkFBRyxLQUFDLENBQUEsS0FBRCxHQUFTO1lBQVo7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXBCO0lBTEQ7O29CQU9ILE9BQUEsR0FBUyxTQUFDLEtBQUQ7QUFFTCxZQUFBO1FBQUEsT0FBc0IsT0FBTyxDQUFDLFFBQVIsQ0FBaUIsS0FBakIsQ0FBdEIsRUFBRSxjQUFGLEVBQU8sY0FBUCxFQUFZO1FBRVosWUFBQSxHQUFlLFNBQUE7QUFDWCxnQkFBQTtZQUFBLENBQUEsR0FBSztZQUNMLENBQUEsSUFBSyxDQUFBLEdBQUksQ0FBQSxHQUFJLEtBQUssQ0FBQzttQkFDbkIsQ0FBQSxJQUFLLENBQUEsR0FBSSxDQUFBLEdBQUksS0FBSyxDQUFDO1FBSFI7UUFLZixLQUFBLEdBQVEsS0FBSyxDQUFDLE1BQU4sR0FBZSxZQUFBLENBQUE7UUFFdkIsSUFBRyxDQUFDLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBVCxJQUFlLEtBQUEsR0FBUSxDQUF4QixDQUFBLElBQThCLENBQUMsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFULElBQWUsS0FBQSxHQUFRLENBQXhCLENBQWpDO21CQUNJLElBQUMsQ0FBQSxLQUFELEdBQVMsRUFEYjtTQUFBLE1BQUE7WUFHSSxJQUFHLElBQUMsQ0FBQSxLQUFELEtBQVUsQ0FBYjtnQkFDSSxNQUFNLENBQUMscUJBQVAsQ0FBNkIsSUFBQyxDQUFBLFdBQTlCLEVBREo7O1lBRUEsSUFBQyxDQUFBLEtBQUQsSUFBVTttQkFDVixJQUFJLENBQUMsSUFBTCxDQUFVLFVBQVYsRUFBcUIsSUFBQyxDQUFBLEtBQUQsR0FBTyxFQUE1QixFQU5KOztJQVhLOztvQkFtQlQsV0FBQSxHQUFhLFNBQUMsS0FBRDtlQUVULElBQUMsQ0FBQSxLQUFELEdBQVM7SUFGQTs7b0JBSWIsV0FBQSxHQUFhLFNBQUMsR0FBRDtBQUVULFlBQUE7UUFBQSxJQUFDLENBQUEsS0FBRCxHQUFTLEtBQUEsQ0FBTSxDQUFDLE1BQVAsRUFBZSxNQUFmLEVBQXVCLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBaEM7UUFFVCxLQUFBLEdBQVEsSUFBQyxDQUFBLEtBQUQsR0FBTztRQUNmLElBQUksQ0FBQyxJQUFMLENBQVUsVUFBVixFQUFxQixLQUFyQjtRQUVBLElBQUcsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsS0FBVixDQUFBLEdBQW1CLEVBQXRCO21CQUNJLElBQUMsQ0FBQSxLQUFELEdBQVMsRUFEYjtTQUFBLE1BQUE7bUJBR0ksTUFBTSxDQUFDLHFCQUFQLENBQTZCLElBQUMsQ0FBQSxXQUE5QixFQUhKOztJQVBTOzs7Ozs7QUFZakIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICBcbjAwICAgICAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcbiMjI1xuXG57IHBvc3QsIGtleWluZm8sIGNsYW1wIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIFdoZWVsXG5cbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgQGFjY3VtID0gMFxuICAgICAgICBcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25Nb3VzZURvd24sIHRydWVcbiAgICAgICAgcG9zdC5vbiAnc3RvcFdoZWVsJyA9PiBAYWNjdW0gPSAwXG4gICAgICAgIFxuICAgIG9uV2hlZWw6IChldmVudCkgPT5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8gfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcbiAgICBcbiAgICAgICAgc2Nyb2xsRmFjdG9yID0gLT5cbiAgICAgICAgICAgIGYgID0gMVxuICAgICAgICAgICAgZiAqPSAxICsgMyAqIGV2ZW50LnNoaWZ0S2V5XG4gICAgICAgICAgICBmICo9IDEgKyA3ICogZXZlbnQuYWx0S2V5XG4gICAgICAgIFxuICAgICAgICBkZWx0YSA9IGV2ZW50LmRlbHRhWSAqIHNjcm9sbEZhY3RvcigpXG4gICAgICAgIFxuICAgICAgICBpZiAoQGFjY3VtIDwgMCBhbmQgZGVsdGEgPiAwKSBvciAoQGFjY3VtID4gMCBhbmQgZGVsdGEgPCAwKVxuICAgICAgICAgICAgQGFjY3VtID0gMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBAYWNjdW0gPT0gMFxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgQG9uQW5pbWF0aW9uXG4gICAgICAgICAgICBAYWNjdW0gKz0gZGVsdGFcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnc2Nyb2xsQnknIEBhY2N1bS8xMFxuICAgICAgXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBhY2N1bSA9IDBcbiAgICAgICAgICAgIFxuICAgIG9uQW5pbWF0aW9uOiAobm93KSA9PlxuICAgICAgICBcbiAgICAgICAgQGFjY3VtID0gY2xhbXAgLTEwMDAwMCwgMTAwMDAwLCBAYWNjdW0gKiAwLjk5XG4gICAgICAgICAgICBcbiAgICAgICAgZGVsdGEgPSBAYWNjdW0vMTBcbiAgICAgICAgcG9zdC5lbWl0ICdzY3JvbGxCeScgZGVsdGEgXG5cbiAgICAgICAgaWYgTWF0aC5hYnMoQGFjY3VtKSA8IDEwIFxuICAgICAgICAgICAgQGFjY3VtID0gMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIEBvbkFuaW1hdGlvblxuICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFdoZWVsXG4iXX0=
//# sourceURL=../../coffee/tools/wheel.coffee