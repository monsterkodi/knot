// koffee 1.4.0

/*
000   000  00000000   0000000  000   000  000000000  000      0000000     0000000   00000000   
000   000  000   000     000   0000  000     000     000      000   000  000   000  000   000  
000000000  0000000      000    000 0 000     000     000      0000000    000000000  0000000    
000   000  000   000   000     000  0000     000     000      000   000  000   000  000   000  
000   000  000   000  0000000  000   000     000     0000000  0000000    000   000  000   000
 */
var Hrzntlbar, Scroller, clamp, drag, elem, klog, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), clamp = ref.clamp, elem = ref.elem, drag = ref.drag, klog = ref.klog;

Scroller = require('../tools/scroller');

Hrzntlbar = (function() {
    function Hrzntlbar(editor) {
        this.editor = editor;
        this.update = bind(this.update, this);
        this.onDrag = bind(this.onDrag, this);
        klog('hrzntlbar');
        this.editor.on('linesShown', this.update);
        this.editor.on('linesAppended', this.update);
        this.elem = elem({
            "class": 'scrollbar bottom'
        });
        this.editor.view.appendChild(this.elem);
        this.handle = elem({
            "class": 'scrollhandle bottom'
        });
        this.elem.appendChild(this.handle);
        this.scrollX = 0;
        this.drag = new drag({
            target: this.elem,
            onMove: this.onDrag,
            cursor: 'ew-resize'
        });
    }

    Hrzntlbar.prototype.del = function() {};

    Hrzntlbar.prototype.onDrag = function(drag) {
        var delta;
        delta = (drag.delta.x / this.editor.layersWidth) * this.editor.numColumns() * this.editor.size.charWidth;
        this.editor.scroll.horizontal(delta);
        return this.update();
    };

    Hrzntlbar.prototype.update = function() {
        var bw, cf, cs, longColor, scrollLeft, scrollWidth, shortColor;
        bw = this.editor.numColumns() * this.editor.size.charWidth;
        if (bw <= this.editor.layersWidth) {
            this.elem.style.display = 'none';
            this.handle.style.left = "0";
            this.handle.style.height = "0";
            return this.handle.style.width = "0";
        } else {
            this.elem.style.display = 'initial';
            scrollLeft = this.editor.layersWidth * this.editor.layerScroll.scrollLeft / bw;
            scrollWidth = this.editor.layersWidth * this.editor.layersWidth / bw;
            this.handle.style.left = scrollLeft + "px";
            this.handle.style.width = scrollWidth + "px";
            this.handle.style.height = "2px";
            cf = 1 - clamp(0, 1, (scrollWidth - 10) / 200);
            longColor = Scroller.colorForClass('scroller long');
            shortColor = Scroller.colorForClass('scroller short');
            cs = Scroller.fadeColor(longColor, shortColor, cf);
            return this.handle.style.backgroundColor = cs;
        }
    };

    return Hrzntlbar;

})();

module.exports = Hrzntlbar;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHJ6bnRsYmFyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpREFBQTtJQUFBOztBQVFBLE1BQThCLE9BQUEsQ0FBUSxLQUFSLENBQTlCLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQjs7QUFFckIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxtQkFBUjs7QUFFTDtJQUVDLG1CQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7O1FBRUEsSUFBQSxDQUFLLFdBQUw7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxZQUFYLEVBQTJCLElBQUMsQ0FBQSxNQUE1QjtRQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsRUFBUixDQUFXLGVBQVgsRUFBMkIsSUFBQyxDQUFBLE1BQTVCO1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtCQUFQO1NBQUw7UUFDUixJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFiLENBQXlCLElBQUMsQ0FBQSxJQUExQjtRQUVBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxxQkFBUDtTQUFMO1FBQ1YsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxNQUFuQjtRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVk7UUFFWixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksSUFBSixDQUNKO1lBQUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxJQUFWO1lBQ0EsTUFBQSxFQUFTLElBQUMsQ0FBQSxNQURWO1lBRUEsTUFBQSxFQUFTLFdBRlQ7U0FESTtJQWZUOzt3QkFvQkgsR0FBQSxHQUFLLFNBQUEsR0FBQTs7d0JBUUwsTUFBQSxHQUFRLFNBQUMsSUFBRDtBQUVKLFlBQUE7UUFBQSxLQUFBLEdBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQVgsR0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQXhCLENBQUEsR0FBdUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBdkMsR0FBOEQsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDbkYsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBZixDQUEwQixLQUExQjtlQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7SUFKSTs7d0JBWVIsTUFBQSxHQUFRLFNBQUE7QUFFSixZQUFBO1FBQUEsRUFBQSxHQUFLLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLENBQUEsR0FBdUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFFekMsSUFBRyxFQUFBLElBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFqQjtZQUVJLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVosR0FBd0I7WUFDeEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBZCxHQUF3QjtZQUN4QixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFkLEdBQXdCO21CQUN4QixJQUFDLENBQUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFkLEdBQXdCLElBTDVCO1NBQUEsTUFBQTtZQVFJLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVosR0FBd0I7WUFDeEIsVUFBQSxHQUFlLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBUixHQUFzQixJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUExQyxHQUF1RDtZQUN0RSxXQUFBLEdBQWUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFSLEdBQXNCLElBQUMsQ0FBQSxNQUFNLENBQUMsV0FBOUIsR0FBNEM7WUFFM0QsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBZCxHQUEwQixVQUFELEdBQVk7WUFDckMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBZCxHQUEwQixXQUFELEdBQWE7WUFDdEMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBZCxHQUF1QjtZQUV2QixFQUFBLEdBQUssQ0FBQSxHQUFJLEtBQUEsQ0FBTSxDQUFOLEVBQVMsQ0FBVCxFQUFZLENBQUMsV0FBQSxHQUFZLEVBQWIsQ0FBQSxHQUFpQixHQUE3QjtZQUVULFNBQUEsR0FBYSxRQUFRLENBQUMsYUFBVCxDQUF1QixlQUF2QjtZQUNiLFVBQUEsR0FBYSxRQUFRLENBQUMsYUFBVCxDQUF1QixnQkFBdkI7WUFFYixFQUFBLEdBQUssUUFBUSxDQUFDLFNBQVQsQ0FBbUIsU0FBbkIsRUFBOEIsVUFBOUIsRUFBMEMsRUFBMUM7bUJBQ0wsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZCxHQUFnQyxHQXRCcEM7O0lBSkk7Ozs7OztBQTRCWixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAgICAwMDAgICAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBjbGFtcCwgZWxlbSwgZHJhZywga2xvZyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5TY3JvbGxlciA9IHJlcXVpcmUgJy4uL3Rvb2xzL3Njcm9sbGVyJ1xuXG5jbGFzcyBIcnpudGxiYXJcblxuICAgIEA6IChAZWRpdG9yKSAtPlxuICAgICAgICBcbiAgICAgICAga2xvZyAnaHJ6bnRsYmFyJ1xuXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVzU2hvd24nICAgIEB1cGRhdGVcbiAgICAgICAgQGVkaXRvci5vbiAnbGluZXNBcHBlbmRlZCcgQHVwZGF0ZVxuXG4gICAgICAgIEBlbGVtID0gZWxlbSBjbGFzczogJ3Njcm9sbGJhciBib3R0b20nXG4gICAgICAgIEBlZGl0b3Iudmlldy5hcHBlbmRDaGlsZCBAZWxlbVxuXG4gICAgICAgIEBoYW5kbGUgPSBlbGVtIGNsYXNzOiAnc2Nyb2xsaGFuZGxlIGJvdHRvbSdcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGhhbmRsZVxuXG4gICAgICAgIEBzY3JvbGxYICA9IDBcblxuICAgICAgICBAZHJhZyA9IG5ldyBkcmFnXG4gICAgICAgICAgICB0YXJnZXQ6ICBAZWxlbVxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ1xuICAgICAgICAgICAgY3Vyc29yOiAgJ2V3LXJlc2l6ZSdcblxuICAgIGRlbDogLT5cblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBvbkRyYWc6IChkcmFnKSA9PlxuXG4gICAgICAgIGRlbHRhID0gKGRyYWcuZGVsdGEueCAvIEBlZGl0b3IubGF5ZXJzV2lkdGgpICogQGVkaXRvci5udW1Db2x1bW5zKCkgKiBAZWRpdG9yLnNpemUuY2hhcldpZHRoXG4gICAgICAgIEBlZGl0b3Iuc2Nyb2xsLmhvcml6b250YWwgZGVsdGFcbiAgICAgICAgQHVwZGF0ZSgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdXBkYXRlOiA9PlxuXG4gICAgICAgIGJ3ID0gQGVkaXRvci5udW1Db2x1bW5zKCkgKiBAZWRpdG9yLnNpemUuY2hhcldpZHRoXG4gICAgICAgIFxuICAgICAgICBpZiBidyA8PSBAZWRpdG9yLmxheWVyc1dpZHRoXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBlbGVtLnN0eWxlLmRpc3BsYXkgICA9ICdub25lJ1xuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS5sZWZ0ICAgID0gXCIwXCJcbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUuaGVpZ2h0ICA9IFwiMFwiXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLndpZHRoICAgPSBcIjBcIlxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBlbGVtLnN0eWxlLmRpc3BsYXkgICA9ICdpbml0aWFsJ1xuICAgICAgICAgICAgc2Nyb2xsTGVmdCAgID0gQGVkaXRvci5sYXllcnNXaWR0aCAqIEBlZGl0b3IubGF5ZXJTY3JvbGwuc2Nyb2xsTGVmdCAvIGJ3XG4gICAgICAgICAgICBzY3JvbGxXaWR0aCAgPSBAZWRpdG9yLmxheWVyc1dpZHRoICogQGVkaXRvci5sYXllcnNXaWR0aCAvIGJ3XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUubGVmdCAgID0gXCIje3Njcm9sbExlZnR9cHhcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS53aWR0aCAgPSBcIiN7c2Nyb2xsV2lkdGh9cHhcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS5oZWlnaHQgPSBcIjJweFwiXG5cbiAgICAgICAgICAgIGNmID0gMSAtIGNsYW1wIDAsIDEsIChzY3JvbGxXaWR0aC0xMCkvMjAwXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxvbmdDb2xvciAgPSBTY3JvbGxlci5jb2xvckZvckNsYXNzICdzY3JvbGxlciBsb25nJ1xuICAgICAgICAgICAgc2hvcnRDb2xvciA9IFNjcm9sbGVyLmNvbG9yRm9yQ2xhc3MgJ3Njcm9sbGVyIHNob3J0J1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjcyA9IFNjcm9sbGVyLmZhZGVDb2xvciBsb25nQ29sb3IsIHNob3J0Q29sb3IsIGNmXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNzXG5cbm1vZHVsZS5leHBvcnRzID0gSHJ6bnRsYmFyXG4iXX0=
//# sourceURL=../../coffee/editor/hrzntlbar.coffee