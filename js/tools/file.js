// koffee 1.4.0

/*
00000000  000  000      00000000
000       000  000      000     
000000    000  000      0000000 
000       000  000      000     
000       000  0000000  00000000
 */
var File, fs, kerror, klog, ref, slash, valid;

ref = require('kxk'), slash = ref.slash, valid = ref.valid, klog = ref.klog, fs = ref.fs, kerror = ref.kerror;

File = (function() {
    function File() {}

    File.isImage = function(file) {
        var ref1;
        return (ref1 = slash.ext(file)) === 'gif' || ref1 === 'png' || ref1 === 'jpg' || ref1 === 'jpeg' || ref1 === 'svg' || ref1 === 'bmp' || ref1 === 'ico';
    };

    File.isText = function(file) {
        return slash.isText(file);
    };

    File.span = function(text) {
        var base, clss, ext, span;
        base = slash.base(text);
        ext = slash.ext(text).toLowerCase();
        clss = valid(ext) && ' ' + ext || '';
        if (base.startsWith('.')) {
            clss += ' dotfile';
        }
        span = ("<span class='text" + clss + "'>") + base + "</span>";
        if (valid(ext)) {
            span += ("<span class='ext punct" + clss + "'>.</span>") + ("<span class='ext text" + clss + "'>") + ext + "</span>";
        }
        return span;
    };

    File.crumbSpan = function(file) {
        var i, j, ref1, s, spans, split;
        if (file === '/' || file === '') {
            return "<span>/</span>";
        }
        spans = [];
        split = slash.split(file);
        for (i = j = 0, ref1 = split.length - 1; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            s = split[i];
            spans.push("<div class='inline path' id='" + (split.slice(0, +i + 1 || 9e9).join('/')) + "'>" + s + "</div>");
        }
        spans.push("<div class='inline' id='" + file + "'>" + split.slice(-1)[0] + "</div>");
        return spans.join("<span class='punct'>/</span>");
    };

    return File;

})();

module.exports = File;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBcUMsT0FBQSxDQUFRLEtBQVIsQ0FBckMsRUFBRSxpQkFBRixFQUFTLGlCQUFULEVBQWdCLGVBQWhCLEVBQXNCLFdBQXRCLEVBQTBCOztBQUVwQjs7O0lBRUYsSUFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLElBQUQ7QUFBVSxZQUFBO3VCQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixFQUFBLEtBQW9CLEtBQXBCLElBQUEsSUFBQSxLQUEwQixLQUExQixJQUFBLElBQUEsS0FBZ0MsS0FBaEMsSUFBQSxJQUFBLEtBQXNDLE1BQXRDLElBQUEsSUFBQSxLQUE2QyxLQUE3QyxJQUFBLElBQUEsS0FBbUQsS0FBbkQsSUFBQSxJQUFBLEtBQXlEO0lBQW5FOztJQUNWLElBQUMsQ0FBQSxNQUFELEdBQVUsU0FBQyxJQUFEO2VBQVUsS0FBSyxDQUFDLE1BQU4sQ0FBYSxJQUFiO0lBQVY7O0lBUVYsSUFBQyxDQUFBLElBQUQsR0FBTyxTQUFDLElBQUQ7QUFFSCxZQUFBO1FBQUEsSUFBQSxHQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWDtRQUNQLEdBQUEsR0FBTyxLQUFLLENBQUMsR0FBTixDQUFVLElBQVYsQ0FBZSxDQUFDLFdBQWhCLENBQUE7UUFDUCxJQUFBLEdBQU8sS0FBQSxDQUFNLEdBQU4sQ0FBQSxJQUFlLEdBQUEsR0FBSSxHQUFuQixJQUEwQjtRQUVqQyxJQUFHLElBQUksQ0FBQyxVQUFMLENBQWdCLEdBQWhCLENBQUg7WUFBNEIsSUFBQSxJQUFRLFdBQXBDOztRQUVBLElBQUEsR0FBTyxDQUFBLG1CQUFBLEdBQW9CLElBQXBCLEdBQXlCLElBQXpCLENBQUEsR0FBNkIsSUFBN0IsR0FBa0M7UUFFekMsSUFBRyxLQUFBLENBQU0sR0FBTixDQUFIO1lBQ0ksSUFBQSxJQUFRLENBQUEsd0JBQUEsR0FBeUIsSUFBekIsR0FBOEIsWUFBOUIsQ0FBQSxHQUE0QyxDQUFBLHVCQUFBLEdBQXdCLElBQXhCLEdBQTZCLElBQTdCLENBQTVDLEdBQTZFLEdBQTdFLEdBQWlGLFVBRDdGOztlQUVBO0lBWkc7O0lBY1AsSUFBQyxDQUFBLFNBQUQsR0FBWSxTQUFDLElBQUQ7QUFFUixZQUFBO1FBQUEsSUFBMkIsSUFBQSxLQUFTLEdBQVQsSUFBQSxJQUFBLEtBQWEsRUFBeEM7QUFBQSxtQkFBTyxpQkFBUDs7UUFFQSxLQUFBLEdBQVE7UUFDUixLQUFBLEdBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaO0FBRVIsYUFBUyw4RkFBVDtZQUNJLENBQUEsR0FBSSxLQUFNLENBQUEsQ0FBQTtZQUNWLEtBQUssQ0FBQyxJQUFOLENBQVcsK0JBQUEsR0FBK0IsQ0FBQyxLQUFNLHdCQUFLLENBQUMsSUFBWixDQUFpQixHQUFqQixDQUFELENBQS9CLEdBQXFELElBQXJELEdBQXlELENBQXpELEdBQTJELFFBQXRFO0FBRko7UUFHQSxLQUFLLENBQUMsSUFBTixDQUFXLDBCQUFBLEdBQTJCLElBQTNCLEdBQWdDLElBQWhDLEdBQW9DLEtBQU0sVUFBRSxDQUFBLENBQUEsQ0FBNUMsR0FBOEMsUUFBekQ7ZUFDQSxLQUFLLENBQUMsSUFBTixDQUFXLDhCQUFYO0lBWFE7Ozs7OztBQWFoQixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4wMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwXG4jIyNcblxueyBzbGFzaCwgdmFsaWQsIGtsb2csIGZzLCBrZXJyb3IgfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgRmlsZVxuICAgIFxuICAgIEBpc0ltYWdlOiAoZmlsZSkgLT4gc2xhc2guZXh0KGZpbGUpIGluIFsnZ2lmJyAncG5nJyAnanBnJyAnanBlZycgJ3N2ZycgJ2JtcCcgJ2ljbyddXG4gICAgQGlzVGV4dDogIChmaWxlKSAtPiBzbGFzaC5pc1RleHQgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBAc3BhbjogKHRleHQpIC0+XG4gICAgICAgIFxuICAgICAgICBiYXNlID0gc2xhc2guYmFzZSB0ZXh0XG4gICAgICAgIGV4dCAgPSBzbGFzaC5leHQodGV4dCkudG9Mb3dlckNhc2UoKVxuICAgICAgICBjbHNzID0gdmFsaWQoZXh0KSBhbmQgJyAnK2V4dCBvciAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgYmFzZS5zdGFydHNXaXRoICcuJyB0aGVuIGNsc3MgKz0gJyBkb3RmaWxlJ1xuICAgICAgICBcbiAgICAgICAgc3BhbiA9IFwiPHNwYW4gY2xhc3M9J3RleHQje2Nsc3N9Jz5cIitiYXNlK1wiPC9zcGFuPlwiXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBleHRcbiAgICAgICAgICAgIHNwYW4gKz0gXCI8c3BhbiBjbGFzcz0nZXh0IHB1bmN0I3tjbHNzfSc+Ljwvc3Bhbj5cIiArIFwiPHNwYW4gY2xhc3M9J2V4dCB0ZXh0I3tjbHNzfSc+XCIrZXh0K1wiPC9zcGFuPlwiXG4gICAgICAgIHNwYW5cbiAgICAgICAgXG4gICAgQGNydW1iU3BhbjogKGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gXCI8c3Bhbj4vPC9zcGFuPlwiIGlmIGZpbGUgaW4gWycvJyAnJ11cbiAgICAgICAgXG4gICAgICAgIHNwYW5zID0gW11cbiAgICAgICAgc3BsaXQgPSBzbGFzaC5zcGxpdCBmaWxlXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLnNwbGl0Lmxlbmd0aC0xXVxuICAgICAgICAgICAgcyA9IHNwbGl0W2ldXG4gICAgICAgICAgICBzcGFucy5wdXNoIFwiPGRpdiBjbGFzcz0naW5saW5lIHBhdGgnIGlkPScje3NwbGl0WzAuLmldLmpvaW4gJy8nfSc+I3tzfTwvZGl2PlwiXG4gICAgICAgIHNwYW5zLnB1c2ggXCI8ZGl2IGNsYXNzPSdpbmxpbmUnIGlkPScje2ZpbGV9Jz4je3NwbGl0Wy0xXX08L2Rpdj5cIlxuICAgICAgICBzcGFucy5qb2luIFwiPHNwYW4gY2xhc3M9J3B1bmN0Jz4vPC9zcGFuPlwiXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGaWxlXG4iXX0=
//# sourceURL=../../coffee/tools/file.coffee