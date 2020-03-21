// koffee 1.12.0

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
            return post.emit('scrollBy', this.accum / 20);
        }
    };

    Wheel.prototype.onMouseDown = function(event) {
        return this.accum = 0;
    };

    Wheel.prototype.onAnimation = function(now) {
        var delta;
        this.accum = clamp(-100000, 100000, this.accum * 0.99);
        delta = this.accum / 20;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2hlZWwuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL3Rvb2xzIiwic291cmNlcyI6WyJ3aGVlbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsZ0NBQUE7SUFBQTs7QUFRQSxNQUEyQixPQUFBLENBQVEsS0FBUixDQUEzQixFQUFFLGVBQUYsRUFBUSxxQkFBUixFQUFpQjs7QUFFWDtJQUVDLGVBQUE7Ozs7UUFFQyxJQUFDLENBQUEsS0FBRCxHQUFTO1FBRVQsUUFBUSxDQUFDLGdCQUFULENBQTBCLFdBQTFCLEVBQXNDLElBQUMsQ0FBQSxXQUF2QyxFQUFvRCxJQUFwRDtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsV0FBUixFQUFvQixDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFBO3VCQUFHLEtBQUMsQ0FBQSxLQUFELEdBQVM7WUFBWjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEI7SUFMRDs7b0JBT0gsT0FBQSxHQUFTLFNBQUMsS0FBRDtBQUVMLFlBQUE7UUFBQSxPQUFzQixPQUFPLENBQUMsUUFBUixDQUFpQixLQUFqQixDQUF0QixFQUFFLGNBQUYsRUFBTyxjQUFQLEVBQVk7UUFFWixZQUFBLEdBQWUsU0FBQTtBQUNYLGdCQUFBO1lBQUEsQ0FBQSxHQUFLO1lBQ0wsQ0FBQSxJQUFLLENBQUEsR0FBSSxDQUFBLEdBQUksS0FBSyxDQUFDO21CQUNuQixDQUFBLElBQUssQ0FBQSxHQUFJLENBQUEsR0FBSSxLQUFLLENBQUM7UUFIUjtRQUtmLEtBQUEsR0FBUSxLQUFLLENBQUMsTUFBTixHQUFlLFlBQUEsQ0FBQTtRQUV2QixJQUFHLENBQUMsSUFBQyxDQUFBLEtBQUQsR0FBUyxDQUFULElBQWUsS0FBQSxHQUFRLENBQXhCLENBQUEsSUFBOEIsQ0FBQyxJQUFDLENBQUEsS0FBRCxHQUFTLENBQVQsSUFBZSxLQUFBLEdBQVEsQ0FBeEIsQ0FBakM7bUJBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUyxFQURiO1NBQUEsTUFBQTtZQUdJLElBQUcsSUFBQyxDQUFBLEtBQUQsS0FBVSxDQUFiO2dCQUNJLE1BQU0sQ0FBQyxxQkFBUCxDQUE2QixJQUFDLENBQUEsV0FBOUIsRUFESjs7WUFFQSxJQUFDLENBQUEsS0FBRCxJQUFVO21CQUNWLElBQUksQ0FBQyxJQUFMLENBQVUsVUFBVixFQUFxQixJQUFDLENBQUEsS0FBRCxHQUFPLEVBQTVCLEVBTko7O0lBWEs7O29CQW1CVCxXQUFBLEdBQWEsU0FBQyxLQUFEO2VBRVQsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUZBOztvQkFJYixXQUFBLEdBQWEsU0FBQyxHQUFEO0FBRVQsWUFBQTtRQUFBLElBQUMsQ0FBQSxLQUFELEdBQVMsS0FBQSxDQUFNLENBQUMsTUFBUCxFQUFlLE1BQWYsRUFBdUIsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFoQztRQUVULEtBQUEsR0FBUSxJQUFDLENBQUEsS0FBRCxHQUFPO1FBQ2YsSUFBSSxDQUFDLElBQUwsQ0FBVSxVQUFWLEVBQXFCLEtBQXJCO1FBRUEsSUFBRyxJQUFJLENBQUMsR0FBTCxDQUFTLElBQUMsQ0FBQSxLQUFWLENBQUEsR0FBbUIsRUFBdEI7bUJBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUyxFQURiO1NBQUEsTUFBQTttQkFHSSxNQUFNLENBQUMscUJBQVAsQ0FBNkIsSUFBQyxDQUFBLFdBQTlCLEVBSEo7O0lBUFM7Ozs7OztBQVlqQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgIFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgIFxuMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuIyMjXG5cbnsgcG9zdCwga2V5aW5mbywgY2xhbXAgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgV2hlZWxcblxuICAgIEA6IC0+XG4gICAgICAgIFxuICAgICAgICBAYWNjdW0gPSAwXG4gICAgICAgIFxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93biwgdHJ1ZVxuICAgICAgICBwb3N0Lm9uICdzdG9wV2hlZWwnID0+IEBhY2N1bSA9IDBcbiAgICAgICAgXG4gICAgb25XaGVlbDogKGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibyB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuICAgIFxuICAgICAgICBzY3JvbGxGYWN0b3IgPSAtPlxuICAgICAgICAgICAgZiAgPSAxXG4gICAgICAgICAgICBmICo9IDEgKyAzICogZXZlbnQuc2hpZnRLZXlcbiAgICAgICAgICAgIGYgKj0gMSArIDcgKiBldmVudC5hbHRLZXlcbiAgICAgICAgXG4gICAgICAgIGRlbHRhID0gZXZlbnQuZGVsdGFZICogc2Nyb2xsRmFjdG9yKClcbiAgICAgICAgXG4gICAgICAgIGlmIChAYWNjdW0gPCAwIGFuZCBkZWx0YSA+IDApIG9yIChAYWNjdW0gPiAwIGFuZCBkZWx0YSA8IDApXG4gICAgICAgICAgICBAYWNjdW0gPSAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEBhY2N1bSA9PSAwXG4gICAgICAgICAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSBAb25BbmltYXRpb25cbiAgICAgICAgICAgIEBhY2N1bSArPSBkZWx0YVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdzY3JvbGxCeScgQGFjY3VtLzIwXG4gICAgICBcbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgQGFjY3VtID0gMFxuICAgICAgICAgICAgXG4gICAgb25BbmltYXRpb246IChub3cpID0+XG4gICAgICAgIFxuICAgICAgICBAYWNjdW0gPSBjbGFtcCAtMTAwMDAwLCAxMDAwMDAsIEBhY2N1bSAqIDAuOTlcbiAgICAgICAgICAgIFxuICAgICAgICBkZWx0YSA9IEBhY2N1bS8yMFxuICAgICAgICBwb3N0LmVtaXQgJ3Njcm9sbEJ5JyBkZWx0YSBcblxuICAgICAgICBpZiBNYXRoLmFicyhAYWNjdW0pIDwgMTAgXG4gICAgICAgICAgICBAYWNjdW0gPSAwXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgQG9uQW5pbWF0aW9uXG4gICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gV2hlZWxcbiJdfQ==
//# sourceURL=../../coffee/tools/wheel.coffee