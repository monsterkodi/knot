// koffee 1.4.0
var b, bgch, fgch, g, i, i1, j, j1, k, l, logo, m, n, o, out, p, q, r, s, t, u, v, w, x, y, z;

console.log('\x1b[0m Reset / Normal \x1b[0m');

console.log('\x1b[1m Bold or increased intensity \x1b[0m');

console.log('\x1b[2m Faint (decreased intensity) \x1b[0m');

console.log('\x1b[3m Italic \x1b[0m');

console.log('\x1b[4m Underline \x1b[0m');

console.log('\x1b[7m reverse \x1b[27mvideo\x1b[0m');

console.log('\x1b[9m Crossed-out \x1b[0m');

console.log(' Basic Foreground Colors:');

console.log('\t\x1b[30m Black foreground\x1b[0m');

console.log('\t\x1b[31m Red foreground\x1b[0m');

console.log('\t\x1b[32m Green foreground\x1b[0m');

console.log('\t\x1b[33m Yellow foreground\x1b[0m');

console.log('\t\x1b[34m Blue foreground\x1b[0m');

console.log('\t\x1b[35m Magenta foreground\x1b[0m');

console.log('\t\x1b[36m Cyan foreground\x1b[0m');

console.log('\t\x1b[37m White foreground\x1b[0m');

console.log('\t\x1b[39m Default foreground color \x1b[0m');

console.log(' Basic Background Colors:');

console.log('\t\x1b[40m Black background\x1b[0m');

console.log('\t\x1b[41m Red background\x1b[0m');

console.log('\t\x1b[42m Green background\x1b[0m');

console.log('\t\x1b[43m Yellow background\x1b[0m');

console.log('\t\x1b[44m Blue background\x1b[0m');

console.log('\t\x1b[45m Magenta background\x1b[0m');

console.log('\t\x1b[46m Cyan background\x1b[0m');

console.log('\t\x1b[47m White background\x1b[0m');

console.log('\t\x1b[49m Default background color \x1b[0m');

console.log(' Bright Foreground Colors:');

console.log('\t\x1b[90m Bright Black foreground\x1b[0m');

console.log('\t\x1b[91m Bright Red foreground\x1b[0m');

console.log('\t\x1b[92m Bright Green foreground\x1b[0m');

console.log('\t\x1b[93m Bright Yellow foreground\x1b[0m');

console.log('\t\x1b[94m Bright Blue foreground\x1b[0m');

console.log('\t\x1b[95m Bright Magenta foreground\x1b[0m');

console.log('\t\x1b[96m Bright Cyan foreground\x1b[0m');

console.log('\t\x1b[97m Bright White foreground\x1b[0m');

console.log(' Bright Background Colors:');

console.log('\t\x1b[100m Bright Black background\x1b[0m');

console.log('\t\x1b[101m Bright Red background\x1b[0m');

console.log('\t\x1b[102m Bright Green background\x1b[0m');

console.log('\t\x1b[103m Bright Yellow background\x1b[0m');

console.log('\t\x1b[104m Bright Blue background\x1b[0m');

console.log('\t\x1b[105m Bright Magenta background\x1b[0m');

console.log('\t\x1b[106m Bright Cyan background\x1b[0m');

console.log('\t\x1b[107m Bright White background\x1b[0m');

console.log('\nComplex Colors (8-bit)\n');

console.log('Foreground');

fgch = "█";

bgch = " ";

out = " ";

logo = function() {
    console.log(out);
    return out = '';
};

for (i = j = 0; j < 16; i = ++j) {
    out += "\x1b[38;5;" + i + "m" + fgch + "\x1b[0m";
}

logo();

for (i = k = 16; k < 232; i = ++k) {
    out += "\x1b[38;5;" + i + "m" + fgch + "\x1b[0m";
    if (((i - 15) % 36) === 0) {
        logo();
    }
}

logo();

for (i = l = 232; l < 256; i = ++l) {
    out += "\x1b[38;5;" + i + "m" + fgch + "\x1b[0m";
}

logo();

console.log('Background');

for (i = m = 0; m < 16; i = ++m) {
    out += "\x1b[48;5;" + i + "m" + bgch + "\x1b[0m";
}

logo();

for (i = n = 16; n < 232; i = ++n) {
    out += "\x1b[48;5;" + i + "m" + bgch + "\x1b[0m";
    if (((i - 15) % 36) === 0) {
        logo();
    }
}

for (i = o = 232; o < 256; i = ++o) {
    out += "\x1b[48;5;" + i + "m" + bgch + "\x1b[0m";
}

logo();

console.log('\n24-bit\n');

for (r = p = 0; p < 128; r = p += 16) {
    for (g = q = 0; q < 256; g = q += 32) {
        for (b = s = 0; s < 256; b = s += 16) {
            out += "\x1b[38;2;" + r + ";" + g + ";" + b + "m" + fgch + "\x1b[0m";
        }
    }
    logo();
}

for (r = t = 128; t < 256; r = t += 16) {
    for (g = u = 0; u < 256; g = u += 32) {
        for (b = v = 0; v < 256; b = v += 16) {
            out += "\x1b[38;2;" + r + ";" + g + ";" + b + "m" + fgch + "\x1b[0m";
        }
    }
    logo();
}

logo();

g = 0;

for (r = w = 0; w < 256; r = w += 8) {
    for (b = x = 0; x < 256; b = x += 2) {
        out += "\x1b[48;2;" + r + ";" + g + ";" + b + "m" + bgch + "\x1b[0m";
    }
    logo();
}

b = 0;

for (r = y = 0; y < 256; r = y += 12) {
    for (g = z = 0; z < 256; g = z += 2) {
        out += "\x1b[48;2;" + r + ";" + g + ";" + b + "m" + bgch + "\x1b[0m";
    }
    logo();
}

r = 0;

for (g = i1 = 0; i1 < 256; g = i1 += 12) {
    for (b = j1 = 0; j1 < 256; b = j1 += 2) {
        out += "\x1b[48;2;" + r + ";" + g + ";" + b + "m" + bgch + "\x1b[0m";
    }
    logo();
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5zaS10ZXN0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsSUFBQTs7QUFBQSxPQUFBLENBQ0EsR0FEQSxDQUNJLGdDQURKOztBQUNvQyxPQUFBLENBQ3BDLEdBRG9DLENBQ2hDLDZDQURnQzs7QUFDYSxPQUFBLENBQ2pELEdBRGlELENBQzdDLDZDQUQ2Qzs7QUFDQSxPQUFBLENBQ2pELEdBRGlELENBQzdDLHdCQUQ2Qzs7QUFDckIsT0FBQSxDQUM1QixHQUQ0QixDQUN4QiwyQkFEd0I7O0FBQ0csT0FBQSxDQUMvQixHQUQrQixDQUMzQixzQ0FEMkI7O0FBQ1csT0FBQSxDQUMxQyxHQUQwQyxDQUN0Qyw2QkFEc0M7O0FBQ1QsT0FBQSxDQUVqQyxHQUZpQyxDQUU3QiwyQkFGNkI7O0FBRUYsT0FBQSxDQUMvQixHQUQrQixDQUMzQixvQ0FEMkI7O0FBQ1MsT0FBQSxDQUN4QyxHQUR3QyxDQUNwQyxrQ0FEb0M7O0FBQ0YsT0FBQSxDQUN0QyxHQURzQyxDQUNsQyxvQ0FEa0M7O0FBQ0UsT0FBQSxDQUN4QyxHQUR3QyxDQUNwQyxxQ0FEb0M7O0FBQ0MsT0FBQSxDQUN6QyxHQUR5QyxDQUNyQyxtQ0FEcUM7O0FBQ0YsT0FBQSxDQUN2QyxHQUR1QyxDQUNuQyxzQ0FEbUM7O0FBQ0csT0FBQSxDQUMxQyxHQUQwQyxDQUN0QyxtQ0FEc0M7O0FBQ0gsT0FBQSxDQUN2QyxHQUR1QyxDQUNuQyxvQ0FEbUM7O0FBQ0MsT0FBQSxDQUN4QyxHQUR3QyxDQUNwQyw2Q0FEb0M7O0FBQ1MsT0FBQSxDQUVqRCxHQUZpRCxDQUU3QywyQkFGNkM7O0FBRWxCLE9BQUEsQ0FDL0IsR0FEK0IsQ0FDM0Isb0NBRDJCOztBQUNTLE9BQUEsQ0FDeEMsR0FEd0MsQ0FDcEMsa0NBRG9DOztBQUNGLE9BQUEsQ0FDdEMsR0FEc0MsQ0FDbEMsb0NBRGtDOztBQUNFLE9BQUEsQ0FDeEMsR0FEd0MsQ0FDcEMscUNBRG9DOztBQUNDLE9B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R0FBekIsR0FBNEIsSUFBNUIsR0FBaUM7QUFENUM7SUFFQSxJQUFBLENBQUE7QUFISiIsInNvdXJjZXNDb250ZW50IjpbIlxubG9nICdcXHgxYlswbSBSZXNldCAvIE5vcm1hbCBcXHgxYlswbSdcbmxvZyAnXFx4MWJbMW0gQm9sZCBvciBpbmNyZWFzZWQgaW50ZW5zaXR5IFxceDFiWzBtJ1xubG9nICdcXHgxYlsybSBGYWludCAoZGVjcmVhc2VkIGludGVuc2l0eSkgXFx4MWJbMG0nXG5sb2cgJ1xceDFiWzNtIEl0YWxpYyBcXHgxYlswbSdcbmxvZyAnXFx4MWJbNG0gVW5kZXJsaW5lIFxceDFiWzBtJ1xubG9nICdcXHgxYls3bSByZXZlcnNlIFxceDFiWzI3bXZpZGVvXFx4MWJbMG0nXG5sb2cgJ1xceDFiWzltIENyb3NzZWQtb3V0IFxceDFiWzBtJ1xuXG5sb2cgJyBCYXNpYyBGb3JlZ3JvdW5kIENvbG9yczonXG5sb2cgJ1xcdFxceDFiWzMwbSBCbGFjayBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzMxbSBSZWQgZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYlszMm0gR3JlZW4gZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYlszM20gWWVsbG93IGZvcmVncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMzRtIEJsdWUgZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYlszNW0gTWFnZW50YSBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzM2bSBDeWFuIGZvcmVncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMzdtIFdoaXRlIGZvcmVncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMzltIERlZmF1bHQgZm9yZWdyb3VuZCBjb2xvciBcXHgxYlswbSdcblxubG9nICcgQmFzaWMgQmFja2dyb3VuZCBDb2xvcnM6J1xubG9nICdcXHRcXHgxYls0MG0gQmxhY2sgYmFja2dyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls0MW0gUmVkIGJhY2tncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbNDJtIEdyZWVuIGJhY2tncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbNDNtIFllbGxvdyBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzQ0bSBCbHVlIGJhY2tncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbNDVtIE1hZ2VudGEgYmFja2dyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls0Nm0gQ3lhbiBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzQ3bSBXaGl0ZSBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzQ5bSBEZWZhdWx0IGJhY2tncm91bmQgY29sb3IgXFx4MWJbMG0nXG5cbmxvZyAnIEJyaWdodCBGb3JlZ3JvdW5kIENvbG9yczonXG5sb2cgJ1xcdFxceDFiWzkwbSBCcmlnaHQgQmxhY2sgZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls5MW0gQnJpZ2h0IFJlZCBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzkybSBCcmlnaHQgR3JlZW4gZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls5M20gQnJpZ2h0IFllbGxvdyBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzk0bSBCcmlnaHQgQmx1ZSBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzk1bSBCcmlnaHQgTWFnZW50YSBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzk2bSBCcmlnaHQgQ3lhbiBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzk3bSBCcmlnaHQgV2hpdGUgZm9yZWdyb3VuZFxceDFiWzBtJ1xuXG5sb2cgJyBCcmlnaHQgQmFja2dyb3VuZCBDb2xvcnM6J1xubG9nICdcXHRcXHgxYlsxMDBtIEJyaWdodCBCbGFjayBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzEwMW0gQnJpZ2h0IFJlZCBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzEwMm0gQnJpZ2h0IEdyZWVuIGJhY2tncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMTAzbSBCcmlnaHQgWWVsbG93IGJhY2tncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMTA0bSBCcmlnaHQgQmx1ZSBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzEwNW0gQnJpZ2h0IE1hZ2VudGEgYmFja2dyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYlsxMDZtIEJyaWdodCBDeWFuIGJhY2tncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMTA3bSBCcmlnaHQgV2hpdGUgYmFja2dyb3VuZFxceDFiWzBtJ1xuXG5sb2cgJ1xcbkNvbXBsZXggQ29sb3JzICg4LWJpdClcXG4nXG5sb2cgJ0ZvcmVncm91bmQnXG5cbmZnY2ggPSBcIuKWiFwiXG5iZ2NoID0gXCIgXCJcblxub3V0ID0gXCIgXCIgXG5cbmxvZ28gPSAtPiBsb2cgb3V0OyBvdXQgPSAnJ1xuXG5mb3IgaSBpbiBbMC4uLjE2XVxuICAgIG91dCArPSBcIlxceDFiWzM4OzU7I3tpfW0je2ZnY2h9XFx4MWJbMG1cIlxubG9nbygpXG5cbmZvciBpIGluIFsxNi4uLjIzMl1cbiAgICBvdXQgKz0gXCJcXHgxYlszODs1OyN7aX1tI3tmZ2NofVxceDFiWzBtXCJcbiAgICBpZiAoKGkgLSAxNSkgJSAzNikgPT0gMFxuICAgICAgICBsb2dvKClcbmxvZ28oKVxuXG5mb3IgaSBpbiBbMjMyLi4uMjU2XVxuICAgIG91dCArPSBcIlxceDFiWzM4OzU7I3tpfW0je2ZnY2h9XFx4MWJbMG1cIlxubG9nbygpXG5cbmxvZyAnQmFja2dyb3VuZCdcblxuZm9yIGkgaW4gWzAuLi4xNl1cbiAgICBvdXQgKz0gXCJcXHgxYls0ODs1OyN7aX1tI3tiZ2NofVxceDFiWzBtXCJcbmxvZ28oKVxuXG5mb3IgaSBpbiBbMTYuLi4yMzJdXG4gICAgb3V0ICs9IFwiXFx4MWJbNDg7NTsje2l9bSN7YmdjaH1cXHgxYlswbVwiXG4gICAgaWYgKChpIC0gMTUpICUgMzYpID09IDBcbiAgICAgICAgbG9nbygpXG5cbmZvciBpIGluIFsyMzIuLi4yNTZdXG4gICAgb3V0ICs9IFwiXFx4MWJbNDg7NTsje2l9bSN7YmdjaH1cXHgxYlswbVwiXG5sb2dvKClcblxubG9nICdcXG4yNC1iaXRcXG4nXG5cbmZvciByIGluIFswLi4uMTI4XSBieSAxNlxuICAgIGZvciBnIGluIFswLi4uMjU2XSBieSAzMlxuICAgICAgICBmb3IgYiBpbiBbMC4uLjI1Nl0gYnkgMTZcbiAgICAgICAgICAgIG91dCArPSBcIlxceDFiWzM4OzI7I3tyfTsje2d9OyN7Yn1tI3tmZ2NofVxceDFiWzBtXCJcbiAgICBsb2dvKClcbmZvciByIGluIFsxMjguLi4yNTZdIGJ5IDE2XG4gICAgZm9yIGcgaW4gWzAuLi4yNTZdIGJ5IDMyXG4gICAgICAgIGZvciBiIGluIFswLi4uMjU2XSBieSAxNlxuICAgICAgICAgICAgb3V0ICs9IFwiXFx4MWJbMzg7Mjsje3J9OyN7Z307I3tifW0je2ZnY2h9XFx4MWJbMG1cIlxuICAgIGxvZ28oKVxubG9nbygpXG5cbmcgPSAwXG5mb3IgciBpbiBbMC4uLjI1Nl0gYnkgOFxuICAgIGZvciBiIGluIFswLi4uMjU2XSBieSAyXG4gICAgICAgIG91dCArPSBcIlxceDFiWzQ4OzI7I3tyfTsje2d9OyN7Yn1tI3tiZ2NofVxceDFiWzBtXCJcbiAgICBsb2dvKClcblxuYiA9IDBcbmZvciByIGluIFswLi4uMjU2XSBieSAxMlxuICAgIGZvciBnIGluIFswLi4uMjU2XSBieSAyXG4gICAgICAgIG91dCArPSBcIlxceDFiWzQ4OzI7I3tyfTsje2d9OyN7Yn1tI3tiZ2NofVxceDFiWzBtXCJcbiAgICBsb2dvKClcblxuciA9IDBcbmZvciBnIGluIFswLi4uMjU2XSBieSAxMlxuICAgIGZvciBiIGluIFswLi4uMjU2XSBieSAyXG4gICAgICAgIG91dCArPSBcIlxceDFiWzQ4OzI7I3tyfTsje2d9OyN7Yn1tI3tiZ2NofVxceDFiWzBtXCJcbiAgICBsb2dvKClcbiAgICAiXX0=
//# sourceURL=ansi-test.coffee