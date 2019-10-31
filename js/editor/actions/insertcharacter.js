// koffee 1.4.0
var _, clamp, empty, ref, reversed, text,
    indexOf = [].indexOf;

ref = require('kxk'), empty = ref.empty, clamp = ref.clamp, text = ref.text, reversed = ref.reversed, _ = ref._;

module.exports = {
    insertCharacter: function(ch) {
        var cc, cline, i, j, len, len1, nc, newCursors, ref1, sline;
        if (ch === '\n') {
            return this.newline();
        }
        this["do"].start();
        if (indexOf.call(this.surroundCharacters, ch) >= 0) {
            if (this.insertSurroundCharacter(ch)) {
                this["do"].end();
                return;
            }
        }
        this.deleteSelection();
        newCursors = this.restoreInputCursor();
        for (i = 0, len = newCursors.length; i < len; i++) {
            cc = newCursors[i];
            cline = this["do"].line(cc[1]);
            sline = this.twiggleSubstitute({
                line: cline,
                cursor: cc,
                char: ch
            });
            if (sline) {
                this["do"].change(cc[1], sline);
            } else {
                this["do"].change(cc[1], cline.splice(cc[0], 0, ch));
                ref1 = positionsAtLineIndexInPositions(cc[1], newCursors);
                for (j = 0, len1 = ref1.length; j < len1; j++) {
                    nc = ref1[j];
                    if (nc[0] >= cc[0]) {
                        nc[0] += 1;
                    }
                }
            }
        }
        this["do"].setCursors(newCursors);
        this["do"].end();
        return this.emitInsert();
    },
    twiggleSubstitute: function(arg) {
        var char, cursor, line, ref1, ref2, ref3, substitute;
        line = (ref1 = arg.line) != null ? ref1 : null, cursor = (ref2 = arg.cursor) != null ? ref2 : null, char = (ref3 = arg.char) != null ? ref3 : null;
        if (cursor[0] && line[cursor[0] - 1] === '~') {
            substitute = (function() {
                switch (char) {
                    case '>':
                        return '▸';
                    case '<':
                        return '◂';
                    case '^':
                        return '▴';
                    case 'v':
                        return '▾';
                    case 'd':
                        return '◆';
                    case 'c':
                        return '●';
                    case 'o':
                        return '○';
                    case 's':
                        return '▪';
                    case 'S':
                        return '■';
                }
            })();
            if (substitute) {
                return line.splice(cursor[0] - 1, 1, substitute);
            }
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zZXJ0Y2hhcmFjdGVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsSUFBQSxvQ0FBQTtJQUFBOztBQUFBLE1BQXNDLE9BQUEsQ0FBUSxLQUFSLENBQXRDLEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixlQUFoQixFQUFzQix1QkFBdEIsRUFBZ0M7O0FBRWhDLE1BQU0sQ0FBQyxPQUFQLEdBRUk7SUFBQSxlQUFBLEVBQWlCLFNBQUMsRUFBRDtBQUViLFlBQUE7UUFBQSxJQUFxQixFQUFBLEtBQU0sSUFBM0I7QUFBQSxtQkFBTyxJQUFDLENBQUEsT0FBRCxDQUFBLEVBQVA7O1FBRUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUVBLElBQUcsYUFBTSxJQUFDLENBQUEsa0JBQVAsRUFBQSxFQUFBLE1BQUg7WUFDSSxJQUFHLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixFQUF6QixDQUFIO2dCQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7QUFDQSx1QkFGSjthQURKOztRQUtBLElBQUMsQ0FBQSxlQUFELENBQUE7UUFFQSxVQUFBLEdBQWEsSUFBQyxDQUFBLGtCQUFELENBQUE7QUFFYixhQUFBLDRDQUFBOztZQUNJLEtBQUEsR0FBUSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLEVBQUcsQ0FBQSxDQUFBLENBQVo7WUFDUixLQUFBLEdBQVEsSUFBQyxDQUFBLGlCQUFELENBQW1CO2dCQUFBLElBQUEsRUFBSyxLQUFMO2dCQUFZLE1BQUEsRUFBTyxFQUFuQjtnQkFBdUIsSUFBQSxFQUFLLEVBQTVCO2FBQW5CO1lBQ1IsSUFBRyxLQUFIO2dCQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsRUFBRyxDQUFBLENBQUEsQ0FBZCxFQUFrQixLQUFsQixFQURKO2FBQUEsTUFBQTtnQkFHSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLEVBQUcsQ0FBQSxDQUFBLENBQWQsRUFBa0IsS0FBSyxDQUFDLE1BQU4sQ0FBYSxFQUFHLENBQUEsQ0FBQSxDQUFoQixFQUFvQixDQUFwQixFQUF1QixFQUF2QixDQUFsQjtBQUNBO0FBQUEscUJBQUEsd0NBQUE7O29CQUNJLElBQUcsRUFBRyxDQUFBLENBQUEsQ0FBSCxJQUFTLEVBQUcsQ0FBQSxDQUFBLENBQWY7d0JBQ0ksRUFBRyxDQUFBLENBQUEsQ0FBSCxJQUFTLEVBRGI7O0FBREosaUJBSko7O0FBSEo7UUFXQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWY7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO2VBQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBQTtJQTVCYSxDQUFqQjtJQThCQSxpQkFBQSxFQUFtQixTQUFDLEdBQUQ7QUFFZixZQUFBO1FBRmdCLDBDQUFHLE1BQUcsOENBQUssTUFBRywwQ0FBRztRQUVqQyxJQUFHLE1BQU8sQ0FBQSxDQUFBLENBQVAsSUFBYyxJQUFLLENBQUEsTUFBTyxDQUFBLENBQUEsQ0FBUCxHQUFVLENBQVYsQ0FBTCxLQUFxQixHQUF0QztZQUNJLFVBQUE7QUFBYSx3QkFBTyxJQUFQO0FBQUEseUJBQ0osR0FESTsrQkFDSztBQURMLHlCQUVKLEdBRkk7K0JBRUs7QUFGTCx5QkFHSixHQUhJOytCQUdLO0FBSEwseUJBSUosR0FKSTsrQkFJSztBQUpMLHlCQUtKLEdBTEk7K0JBS0s7QUFMTCx5QkFNSixHQU5JOytCQU1LO0FBTkwseUJBT0osR0FQSTsrQkFPSztBQVBMLHlCQVFKLEdBUkk7K0JBUUs7QUFSTCx5QkFTSixHQVRJOytCQVNLO0FBVEw7O1lBVWIsSUFBRyxVQUFIO0FBQ0ksdUJBQU8sSUFBSSxDQUFDLE1BQUwsQ0FBWSxNQUFPLENBQUEsQ0FBQSxDQUFQLEdBQVUsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsVUFBNUIsRUFEWDthQVhKOztJQUZlLENBOUJuQiIsInNvdXJjZXNDb250ZW50IjpbIlxuIyAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuXG57IGVtcHR5LCBjbGFtcCwgdGV4dCwgcmV2ZXJzZWQsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubW9kdWxlLmV4cG9ydHMgPVxuICAgIFxuICAgIGluc2VydENoYXJhY3RlcjogKGNoKSAtPlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBuZXdsaW5lKCkgaWYgY2ggPT0gJ1xcbidcbiAgICAgICAgXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICBpZiBjaCBpbiBAc3Vycm91bmRDaGFyYWN0ZXJzXG4gICAgICAgICAgICBpZiBAaW5zZXJ0U3Vycm91bmRDaGFyYWN0ZXIgY2hcbiAgICAgICAgICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgQGRlbGV0ZVNlbGVjdGlvbigpXG5cbiAgICAgICAgbmV3Q3Vyc29ycyA9IEByZXN0b3JlSW5wdXRDdXJzb3IoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGNjIGluIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIGNsaW5lID0gQGRvLmxpbmUoY2NbMV0pXG4gICAgICAgICAgICBzbGluZSA9IEB0d2lnZ2xlU3Vic3RpdHV0ZSBsaW5lOmNsaW5lLCBjdXJzb3I6Y2MsIGNoYXI6Y2hcbiAgICAgICAgICAgIGlmIHNsaW5lXG4gICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBjY1sxXSwgc2xpbmVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGNjWzFdLCBjbGluZS5zcGxpY2UgY2NbMF0sIDAsIGNoXG4gICAgICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0F0TGluZUluZGV4SW5Qb3NpdGlvbnMgY2NbMV0sIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgaWYgbmNbMF0gPj0gY2NbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5jWzBdICs9IDFcbiAgICAgICAgXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIEBlbWl0SW5zZXJ0KClcbiAgICAgICAgXG4gICAgdHdpZ2dsZVN1YnN0aXR1dGU6IChsaW5lOixjdXJzb3I6LGNoYXI6KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgY3Vyc29yWzBdIGFuZCBsaW5lW2N1cnNvclswXS0xXSA9PSAnfidcbiAgICAgICAgICAgIHN1YnN0aXR1dGUgPSBzd2l0Y2ggY2hhclxuICAgICAgICAgICAgICAgIHdoZW4gJz4nIHRoZW4gJ+KWuCdcbiAgICAgICAgICAgICAgICB3aGVuICc8JyB0aGVuICfil4InXG4gICAgICAgICAgICAgICAgd2hlbiAnXicgdGhlbiAn4pa0J1xuICAgICAgICAgICAgICAgIHdoZW4gJ3YnIHRoZW4gJ+KWvidcbiAgICAgICAgICAgICAgICB3aGVuICdkJyB0aGVuICfil4YnXG4gICAgICAgICAgICAgICAgd2hlbiAnYycgdGhlbiAn4pePJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ28nIHRoZW4gJ+KXiydcbiAgICAgICAgICAgICAgICB3aGVuICdzJyB0aGVuICfilqonXG4gICAgICAgICAgICAgICAgd2hlbiAnUycgdGhlbiAn4pagJ1xuICAgICAgICAgICAgaWYgc3Vic3RpdHV0ZVxuICAgICAgICAgICAgICAgIHJldHVybiBsaW5lLnNwbGljZSBjdXJzb3JbMF0tMSwgMSwgc3Vic3RpdHV0ZVxuICAgICAgICBcbiAgICAgICAgIl19
//# sourceURL=../../../coffee/editor/actions/insertcharacter.coffee