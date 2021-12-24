// koffee 1.19.0
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5zaS10ZXN0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbImFuc2ktdGVzdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLElBQUE7O0FBQUEsT0FBQSxDQUNBLEdBREEsQ0FDSSxnQ0FESjs7QUFDb0MsT0FBQSxDQUNwQyxHQURvQyxDQUNoQyw2Q0FEZ0M7O0FBQ2EsT0FBQSxDQUNqRCxHQURpRCxDQUM3Qyw2Q0FENkM7O0FBQ0EsT0FBQSxDQUNqRCxHQURpRCxDQUM3Qyx3QkFENkM7O0FBQ3JCLE9BQUEsQ0FDNUIsR0FENEIsQ0FDeEIsMkJBRHdCOztBQUNHLE9BQUEsQ0FDL0IsR0FEK0IsQ0FDM0Isc0NBRDJCOztBQUNXLE9BQUEsQ0FDMUMsR0FEMEMsQ0FDdEMsNkJBRHNDOztBQUNULE9BQUEsQ0FFakMsR0FGaUMsQ0FFN0IsMkJBRjZCOztBQUVGLE9BQUEsQ0FDL0IsR0FEK0IsQ0FDM0Isb0NBRDJCOztBQUNTLE9BQUEsQ0FDeEMsR0FEd0MsQ0FDcEMsa0NBRG9DOztBQUNGLE9BQUEsQ0FDdEMsR0FEc0MsQ0FDbEMsb0NBRGtDOztBQUNFLE9BQUEsQ0FDeEMsR0FEd0MsQ0FDcEMscUNBRG9DOztBQUNDLE9BQUEsQ0FDekMsR0FEeUMsQ0FDckMsbUNBRHFDOztBQUNGLE9BQUEsQ0FDdkMsR0FEdUMsQ0FDbkMsc0NBRG1DOztBQUNHLE9BQUEsQ0FDMUMsR0FEMEMsQ0FDdEMsbUNBRHNDOztBQUNILE9BQUEsQ0FDdkMsR0FEdUMsQ0FDbkMsb0NBRG1DOztBQUNDLE9BQUEsQ0FDeEMsR0FEd0MsQ0FDcEMsNkNBRG9DOztBQUNTLE9BQUEsQ0FFakQsR0FGaUQsQ0FFN0MsMkJBRjZDOztBQUVsQixPQUFBLENBQy9CLEdBRCtCLENBQzNCLG9DQUQyQjs7QUFDUyxPQUFBLENBQ3hDLEdBRHdDLENBQ3BDLGtDQURvQzs7QUFDRixPQUFBLENBQ3RDLEdBRHNDLENBQ2xDLG9DQURrQzs7QUFDRSxPQUFBLENBQ3hDLEdBRHdDLENBQ3BD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QXVCLENBQXZCLEdBQXlCLEdBQXpCLEdBQTRCLElBQTVCLEdBQWlDO0FBRDVDO0lBRUEsSUFBQSxDQUFBO0FBSEoiLCJzb3VyY2VzQ29udGVudCI6WyJcbmxvZyAnXFx4MWJbMG0gUmVzZXQgLyBOb3JtYWwgXFx4MWJbMG0nXG5sb2cgJ1xceDFiWzFtIEJvbGQgb3IgaW5jcmVhc2VkIGludGVuc2l0eSBcXHgxYlswbSdcbmxvZyAnXFx4MWJbMm0gRmFpbnQgKGRlY3JlYXNlZCBpbnRlbnNpdHkpIFxceDFiWzBtJ1xubG9nICdcXHgxYlszbSBJdGFsaWMgXFx4MWJbMG0nXG5sb2cgJ1xceDFiWzRtIFVuZGVybGluZSBcXHgxYlswbSdcbmxvZyAnXFx4MWJbN20gcmV2ZXJzZSBcXHgxYlsyN212aWRlb1xceDFiWzBtJ1xubG9nICdcXHgxYls5bSBDcm9zc2VkLW91dCBcXHgxYlswbSdcblxubG9nICcgQmFzaWMgRm9yZWdyb3VuZCBDb2xvcnM6J1xubG9nICdcXHRcXHgxYlszMG0gQmxhY2sgZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYlszMW0gUmVkIGZvcmVncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMzJtIEdyZWVuIGZvcmVncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMzNtIFllbGxvdyBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzM0bSBCbHVlIGZvcmVncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMzVtIE1hZ2VudGEgZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYlszNm0gQ3lhbiBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzM3bSBXaGl0ZSBmb3JlZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzM5bSBEZWZhdWx0IGZvcmVncm91bmQgY29sb3IgXFx4MWJbMG0nXG5cbmxvZyAnIEJhc2ljIEJhY2tncm91bmQgQ29sb3JzOidcbmxvZyAnXFx0XFx4MWJbNDBtIEJsYWNrIGJhY2tncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbNDFtIFJlZCBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzQybSBHcmVlbiBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzQzbSBZZWxsb3cgYmFja2dyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls0NG0gQmx1ZSBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzQ1bSBNYWdlbnRhIGJhY2tncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbNDZtIEN5YW4gYmFja2dyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls0N20gV2hpdGUgYmFja2dyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls0OW0gRGVmYXVsdCBiYWNrZ3JvdW5kIGNvbG9yIFxceDFiWzBtJ1xuXG5sb2cgJyBCcmlnaHQgRm9yZWdyb3VuZCBDb2xvcnM6J1xubG9nICdcXHRcXHgxYls5MG0gQnJpZ2h0IEJsYWNrIGZvcmVncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbOTFtIEJyaWdodCBSZWQgZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls5Mm0gQnJpZ2h0IEdyZWVuIGZvcmVncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbOTNtIEJyaWdodCBZZWxsb3cgZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls5NG0gQnJpZ2h0IEJsdWUgZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls5NW0gQnJpZ2h0IE1hZ2VudGEgZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls5Nm0gQnJpZ2h0IEN5YW4gZm9yZWdyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYls5N20gQnJpZ2h0IFdoaXRlIGZvcmVncm91bmRcXHgxYlswbSdcblxubG9nICcgQnJpZ2h0IEJhY2tncm91bmQgQ29sb3JzOidcbmxvZyAnXFx0XFx4MWJbMTAwbSBCcmlnaHQgQmxhY2sgYmFja2dyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYlsxMDFtIEJyaWdodCBSZWQgYmFja2dyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYlsxMDJtIEJyaWdodCBHcmVlbiBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzEwM20gQnJpZ2h0IFllbGxvdyBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzEwNG0gQnJpZ2h0IEJsdWUgYmFja2dyb3VuZFxceDFiWzBtJ1xubG9nICdcXHRcXHgxYlsxMDVtIEJyaWdodCBNYWdlbnRhIGJhY2tncm91bmRcXHgxYlswbSdcbmxvZyAnXFx0XFx4MWJbMTA2bSBCcmlnaHQgQ3lhbiBiYWNrZ3JvdW5kXFx4MWJbMG0nXG5sb2cgJ1xcdFxceDFiWzEwN20gQnJpZ2h0IFdoaXRlIGJhY2tncm91bmRcXHgxYlswbSdcblxubG9nICdcXG5Db21wbGV4IENvbG9ycyAoOC1iaXQpXFxuJ1xubG9nICdGb3JlZ3JvdW5kJ1xuXG5mZ2NoID0gXCLilohcIlxuYmdjaCA9IFwiIFwiXG5cbm91dCA9IFwiIFwiIFxuXG5sb2dvID0gLT4gbG9nIG91dDsgb3V0ID0gJydcblxuZm9yIGkgaW4gWzAuLi4xNl1cbiAgICBvdXQgKz0gXCJcXHgxYlszODs1OyN7aX1tI3tmZ2NofVxceDFiWzBtXCJcbmxvZ28oKVxuXG5mb3IgaSBpbiBbMTYuLi4yMzJdXG4gICAgb3V0ICs9IFwiXFx4MWJbMzg7NTsje2l9bSN7ZmdjaH1cXHgxYlswbVwiXG4gICAgaWYgKChpIC0gMTUpICUgMzYpID09IDBcbiAgICAgICAgbG9nbygpXG5sb2dvKClcblxuZm9yIGkgaW4gWzIzMi4uLjI1Nl1cbiAgICBvdXQgKz0gXCJcXHgxYlszODs1OyN7aX1tI3tmZ2NofVxceDFiWzBtXCJcbmxvZ28oKVxuXG5sb2cgJ0JhY2tncm91bmQnXG5cbmZvciBpIGluIFswLi4uMTZdXG4gICAgb3V0ICs9IFwiXFx4MWJbNDg7NTsje2l9bSN7YmdjaH1cXHgxYlswbVwiXG5sb2dvKClcblxuZm9yIGkgaW4gWzE2Li4uMjMyXVxuICAgIG91dCArPSBcIlxceDFiWzQ4OzU7I3tpfW0je2JnY2h9XFx4MWJbMG1cIlxuICAgIGlmICgoaSAtIDE1KSAlIDM2KSA9PSAwXG4gICAgICAgIGxvZ28oKVxuXG5mb3IgaSBpbiBbMjMyLi4uMjU2XVxuICAgIG91dCArPSBcIlxceDFiWzQ4OzU7I3tpfW0je2JnY2h9XFx4MWJbMG1cIlxubG9nbygpXG5cbmxvZyAnXFxuMjQtYml0XFxuJ1xuXG5mb3IgciBpbiBbMC4uLjEyOF0gYnkgMTZcbiAgICBmb3IgZyBpbiBbMC4uLjI1Nl0gYnkgMzJcbiAgICAgICAgZm9yIGIgaW4gWzAuLi4yNTZdIGJ5IDE2XG4gICAgICAgICAgICBvdXQgKz0gXCJcXHgxYlszODsyOyN7cn07I3tnfTsje2J9bSN7ZmdjaH1cXHgxYlswbVwiXG4gICAgbG9nbygpXG5mb3IgciBpbiBbMTI4Li4uMjU2XSBieSAxNlxuICAgIGZvciBnIGluIFswLi4uMjU2XSBieSAzMlxuICAgICAgICBmb3IgYiBpbiBbMC4uLjI1Nl0gYnkgMTZcbiAgICAgICAgICAgIG91dCArPSBcIlxceDFiWzM4OzI7I3tyfTsje2d9OyN7Yn1tI3tmZ2NofVxceDFiWzBtXCJcbiAgICBsb2dvKClcbmxvZ28oKVxuXG5nID0gMFxuZm9yIHIgaW4gWzAuLi4yNTZdIGJ5IDhcbiAgICBmb3IgYiBpbiBbMC4uLjI1Nl0gYnkgMlxuICAgICAgICBvdXQgKz0gXCJcXHgxYls0ODsyOyN7cn07I3tnfTsje2J9bSN7YmdjaH1cXHgxYlswbVwiXG4gICAgbG9nbygpXG5cbmIgPSAwXG5mb3IgciBpbiBbMC4uLjI1Nl0gYnkgMTJcbiAgICBmb3IgZyBpbiBbMC4uLjI1Nl0gYnkgMlxuICAgICAgICBvdXQgKz0gXCJcXHgxYls0ODsyOyN7cn07I3tnfTsje2J9bSN7YmdjaH1cXHgxYlswbVwiXG4gICAgbG9nbygpXG5cbnIgPSAwXG5mb3IgZyBpbiBbMC4uLjI1Nl0gYnkgMTJcbiAgICBmb3IgYiBpbiBbMC4uLjI1Nl0gYnkgMlxuICAgICAgICBvdXQgKz0gXCJcXHgxYls0ODsyOyN7cn07I3tnfTsje2J9bSN7YmdjaH1cXHgxYlswbVwiXG4gICAgbG9nbygpXG4gICAgIl19
//# sourceURL=ansi-test.coffee