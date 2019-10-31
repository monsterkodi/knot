// koffee 1.4.0

/*
000   000  000   000  00000000  00000000  000    
000 0 000  000   000  000       000       000    
000000000  000000000  0000000   0000000   000    
000   000  000   000  000       000       000    
00     00  000   000  00000000  00000000  0000000
 */
var Wheel, absMax, clamp, keyinfo, klog, post, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), keyinfo = ref.keyinfo, klog = ref.klog, post = ref.post, absMax = ref.absMax, clamp = ref.clamp;

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
            return post.emit('scrollBy', this.accum / 5);
        }
    };

    Wheel.prototype.onMouseDown = function(event) {
        return this.accum = 0;
    };

    Wheel.prototype.onAnimation = function(now) {
        var delta;
        this.accum = clamp(-100000, 100000, this.accum * 0.991);
        delta = this.accum / 5;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2hlZWwuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLDhDQUFBO0lBQUE7O0FBUUEsTUFBeUMsT0FBQSxDQUFRLEtBQVIsQ0FBekMsRUFBRSxxQkFBRixFQUFXLGVBQVgsRUFBaUIsZUFBakIsRUFBdUIsbUJBQXZCLEVBQStCOztBQUV6QjtJQUVDLGVBQUE7Ozs7UUFFQyxJQUFDLENBQUEsS0FBRCxHQUFTO1FBRVQsUUFBUSxDQUFDLGdCQUFULENBQTBCLFdBQTFCLEVBQXNDLElBQUMsQ0FBQSxXQUF2QyxFQUFvRCxJQUFwRDtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsV0FBUixFQUFvQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFBO3VCQUFHLEtBQUMsQ0FBQSxLQUFELEdBQVM7WUFBWjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEI7SUFMRDs7b0JBT0gsT0FBQSxHQUFTLFNBQUMsS0FBRDtBQUVMLFlBQUE7UUFBQSxPQUFzQixPQUFPLENBQUMsUUFBUixDQUFpQixLQUFqQixDQUF0QixFQUFFLGNBQUYsRUFBTyxjQUFQLEVBQVk7UUFFWixZQUFBLEdBQWUsU0FBQTtBQUNYLGdCQUFBO1lBQUEsQ0FBQSxHQUFLO1lBQ0wsQ0FBQSxJQUFLLENBQUEsR0FBSSxDQUFBLEdBQUksS0FBSyxDQUFDO21CQUNuQixDQUFBLElBQUssQ0FBQSxHQUFJLENBQUEsR0FBSSxLQUFLLENBQUM7UUFIUjtRQUtmLEtBQUEsR0FBUSxLQUFLLENBQUMsTUFBTixHQUFlLFlBQUEsQ0FBQTtRQUV2QixJQUFHLENBQUMsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFULElBQWUsS0FBQSxHQUFRLENBQXhCLENBQUEsSUFBOEIsQ0FBQyxJQUFDLENBQUEsS0FBRCxHQUFTLENBQVQsSUFBZSxLQUFBLEdBQVEsQ0FBeEIsQ0FBakM7bUJBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUyxFQURiO1NBQUEsTUFBQTtZQUdJLElBQUcsSUFBQyxDQUFBLEtBQUQsS0FBVSxDQUFiO2dCQUNJLE1BQU0sQ0FBQyxxQkFBUCxDQUE2QixJQUFDLENBQUEsV0FBOUIsRUFESjs7WUFFQSxJQUFDLENBQUEsS0FBRCxJQUFVO21CQUNWLElBQUksQ0FBQyxJQUFMLENBQVUsVUFBVixFQUFxQixJQUFDLENBQUEsS0FBRCxHQUFPLENBQTVCLEVBTko7O0lBWEs7O29CQW1CVCxXQUFBLEdBQWEsU0FBQyxLQUFEO2VBRVQsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUZBOztvQkFJYixXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsS0FBQSxDQUFNLENBQUMsTUFBUCxFQUFlLE1BQWYsRUFBdUIsSUFBQyxDQUFBLEtBQUQsR0FBUyxLQUFoQztRQUVULEtBQUEsR0FBUSxJQUFDLENBQUEsS0FBRCxHQUFPO1FBQ2YsSUFBSSxDQUFDLElBQUwsQ0FBVSxVQUFWLEVBQXFCLEtBQXJCO1FBRUEsSUFBRyxJQUFJLENBQUMsR0FBTCxDQUFTLElBQUMsQ0FBQSxLQUFWLENBQUEsR0FBbUIsRUFBdEI7bUJBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUyxFQURiO1NBQUEsTUFBQTttQkFHSSxNQUFNLENBQUMscUJBQVAsQ0FBNkIsSUFBQyxDQUFBLFdBQTlCLEVBSEo7O0lBUFM7Ozs7OztBQVlqQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgIFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuIyMjXG5cbnsga2V5aW5mbywga2xvZywgcG9zdCwgYWJzTWF4LCBjbGFtcCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBXaGVlbFxuXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgICAgIEBhY2N1bSA9IDBcbiAgICAgICAgXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duLCB0cnVlXG4gICAgICAgIHBvc3Qub24gJ3N0b3BXaGVlbCcgPT4gQGFjY3VtID0gMFxuICAgICAgICBcbiAgICBvbldoZWVsOiAoZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG4gICAgXG4gICAgICAgIHNjcm9sbEZhY3RvciA9IC0+XG4gICAgICAgICAgICBmICA9IDFcbiAgICAgICAgICAgIGYgKj0gMSArIDMgKiBldmVudC5zaGlmdEtleVxuICAgICAgICAgICAgZiAqPSAxICsgNyAqIGV2ZW50LmFsdEtleVxuICAgICAgICBcbiAgICAgICAgZGVsdGEgPSBldmVudC5kZWx0YVkgKiBzY3JvbGxGYWN0b3IoKVxuICAgICAgICBcbiAgICAgICAgaWYgKEBhY2N1bSA8IDAgYW5kIGRlbHRhID4gMCkgb3IgKEBhY2N1bSA+IDAgYW5kIGRlbHRhIDwgMClcbiAgICAgICAgICAgIEBhY2N1bSA9IDBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgQGFjY3VtID09IDBcbiAgICAgICAgICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIEBvbkFuaW1hdGlvblxuICAgICAgICAgICAgQGFjY3VtICs9IGRlbHRhXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3Njcm9sbEJ5JyBAYWNjdW0vNVxuICAgICAgXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBhY2N1bSA9IDBcbiAgICAgICAgICAgIFxuICAgIG9uQW5pbWF0aW9uOiAobm93KSA9PlxuICAgICAgICBcbiAgICAgICAgQGFjY3VtID0gY2xhbXAgLTEwMDAwMCwgMTAwMDAwLCBAYWNjdW0gKiAwLjk5MVxuICAgICAgICAgICAgXG4gICAgICAgIGRlbHRhID0gQGFjY3VtLzVcbiAgICAgICAgcG9zdC5lbWl0ICdzY3JvbGxCeScgZGVsdGEgXG5cbiAgICAgICAgaWYgTWF0aC5hYnMoQGFjY3VtKSA8IDEwIFxuICAgICAgICAgICAgQGFjY3VtID0gMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIEBvbkFuaW1hdGlvblxuICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFdoZWVsXG4iXX0=
//# sourceURL=../../coffee/tools/wheel.coffee