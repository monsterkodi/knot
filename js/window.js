// koffee 1.14.0

/*
000   000  000  000   000  0000000     0000000   000   000  
000 0 000  000  0000  000  000   000  000   000  000 0 000  
000000000  000  000 0 000  000   000  000   000  000000000  
000   000  000  000  0000  000   000  000   000  000   000  
00     00  000  000   000  0000000     0000000   00     00
 */
var $, Brain, History, Tabs, Wheel, _, childp, clamp, defaultFontSize, electron, empty, getFontSize, kerror, keyinfo, klog, koSend, onContext, onMove, onWheel, open, openFile, os, post, prefs, ref, reloadWin, resetFontSize, saveStash, setEditor, setFontSize, slash, stash, stopEvent, tabs, term, udp, w, win;

ref = require('kxk'), $ = ref.$, _ = ref._, childp = ref.childp, clamp = ref.clamp, empty = ref.empty, kerror = ref.kerror, keyinfo = ref.keyinfo, klog = ref.klog, open = ref.open, os = ref.os, post = ref.post, prefs = ref.prefs, slash = ref.slash, stash = ref.stash, stopEvent = ref.stopEvent, udp = ref.udp, win = ref.win;

Tabs = require('./tabs');

Brain = require('./brain');

Wheel = require('./tools/wheel');

History = require('./history');

electron = require('electron');

w = new win({
    dir: __dirname,
    pkg: require('../package.json'),
    menu: '../coffee/menu.noon',
    icon: '../img/menu@2x.png',
    prefsSeperator: '▸',
    context: function(items) {
        return onContext(items);
    }
});

window.stash = new stash("win/" + window.winID);

saveStash = function() {
    post.emit('stash');
    window.stash.save();
    return post.toMain('stashSaved');
};

window.tabs = tabs = new Tabs($("#titlebar"));

window.brain = new Brain;

window.wheel = new Wheel;

History.init();

term = function() {
    var ref1;
    return ((ref1 = tabs.activeTab()) != null ? ref1 : tabs.tabs[0]).term;
};

onMove = function() {
    return window.stash.set('bounds', window.win.getBounds());
};

window.onload = function() {};

reloadWin = function() {
    saveStash();
    return clearListeners();
};

koSend = null;

openFile = function(f) {
    var atom, bat, file, line, ref1;
    ref1 = slash.splitFileLine(f), file = ref1[0], line = ref1[1];
    switch (prefs.get('editor', 'Visual Studio')) {
        case 'VS Code':
            return open("vscode://file/" + slash.resolve(f));
        case 'Visual Studio':
            file = slash.unslash(slash.resolve(file));
            bat = slash.unslash(slash.resolve(slash.join(__dirname, '../bin/openFile/openVS.bat')));
            return childp.exec("\"" + bat + "\" \"" + file + "\" " + line + " 0", {
                cwd: slash.dir(bat)
            }, function(err) {
                if (!empty(err)) {
                    return kerror('vb', err);
                }
            });
        case 'Atom':
            file = slash.unslash(slash.resolve(file));
            atom = slash.unslash(slash.untilde('~/AppData/Local/atom/bin/atom'));
            return childp.exec("\"" + atom + "\" \"" + file + ":" + line + "\"", {
                cwd: slash.dir(file)
            }, function(err) {
                if (!empty(err)) {
                    return kerror('atom', err);
                }
            });
        default:
            if (!koSend) {
                koSend = new udp({
                    port: 9779
                });
            }
            return koSend.send(slash.resolve(f));
    }
};

post.on('openFile', openFile);

post.on('saveStash', function() {
    return saveStash();
});

defaultFontSize = 18;

getFontSize = function() {
    return prefs.get('fontSize', defaultFontSize);
};

setFontSize = function(s) {
    if (!_.isFinite(s)) {
        s = getFontSize();
    }
    s = parseInt(clamp(8, 88, s));
    prefs.set('fontSize', s);
    return post.emit('fontSize', s);
};

window.setFontSize = setFontSize;

resetFontSize = function() {
    return setFontSize(defaultFontSize);
};

onWheel = function(event) {
    var combo, key, mod, ref1, s;
    ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo;
    if (mod === (os.platform() === 'darwin' && 'command' || 'ctrl')) {
        post.emit('stopWheel');
        s = getFontSize();
        if (event.deltaY < 0) {
            setFontSize(s + 1);
        } else {
            setFontSize(s - 1);
        }
    } else {
        window.wheel.onWheel(event);
    }
    return stopEvent(event);
};

post.on('scrollBy', function(delta) {
    return term().scrollBy(delta);
});

window.document.addEventListener('wheel', onWheel, true);

setEditor = function(editor) {
    prefs.set('editor', editor);
    return klog("editor: " + (prefs.get('editor')));
};

post.on('menuAction', function(action) {
    switch (action) {
        case 'Close Tab':
            return tabs.closeTab();
        case 'Close Other Tabs':
            return tabs.closeOtherTabs();
        case 'Previous Tab':
            return tabs.navigate('left');
        case 'Next Tab':
            return tabs.navigate('right');
        case 'New Window':
            return post.toMain('newWindow');
        case 'New Tab':
            return tabs.addTab();
        case 'Increase':
            return setFontSize(getFontSize() + 1);
        case 'Decrease':
            return setFontSize(getFontSize() - 1);
        case 'Reset':
            return resetFontSize();
        case 'Clear':
            term().clear();
            return term().pwd();
        case 'Copy':
            return term().editor.copy();
        case 'Paste':
            return term().editor.paste();
        case 'Visual Studio':
        case 'VS Code':
        case 'Atom':
        case 'ko':
            return setEditor(action);
    }
});

onContext = function(items) {
    return [
        {
            text: 'Clear',
            combo: 'command+k',
            accel: 'alt+ctrl+k'
        }, {
            text: ''
        }
    ].concat(items);
};

process.chdir(slash.untilde(prefs.get('cwd', '~')));

post.emit('restore');

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4uL2NvZmZlZSIsInNvdXJjZXMiOlsid2luZG93LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFrSCxPQUFBLENBQVEsS0FBUixDQUFsSCxFQUFFLFNBQUYsRUFBSyxTQUFMLEVBQVEsbUJBQVIsRUFBZ0IsaUJBQWhCLEVBQXVCLGlCQUF2QixFQUE4QixtQkFBOUIsRUFBc0MscUJBQXRDLEVBQStDLGVBQS9DLEVBQXFELGVBQXJELEVBQTJELFdBQTNELEVBQStELGVBQS9ELEVBQXFFLGlCQUFyRSxFQUE0RSxpQkFBNUUsRUFBbUYsaUJBQW5GLEVBQTBGLHlCQUExRixFQUFxRyxhQUFyRyxFQUEwRzs7QUFFMUcsSUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSOztBQUNYLEtBQUEsR0FBVyxPQUFBLENBQVEsU0FBUjs7QUFDWCxLQUFBLEdBQVcsT0FBQSxDQUFRLGVBQVI7O0FBQ1gsT0FBQSxHQUFXLE9BQUEsQ0FBUSxXQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7QUFFWCxDQUFBLEdBQUksSUFBSSxHQUFKLENBQ0E7SUFBQSxHQUFBLEVBQVEsU0FBUjtJQUNBLEdBQUEsRUFBUSxPQUFBLENBQVEsaUJBQVIsQ0FEUjtJQUVBLElBQUEsRUFBUSxxQkFGUjtJQUdBLElBQUEsRUFBUSxvQkFIUjtJQUlBLGNBQUEsRUFBZ0IsR0FKaEI7SUFNQSxPQUFBLEVBQVMsU0FBQyxLQUFEO2VBQVcsU0FBQSxDQUFVLEtBQVY7SUFBWCxDQU5UO0NBREE7O0FBZUosTUFBTSxDQUFDLEtBQVAsR0FBZSxJQUFJLEtBQUosQ0FBVSxNQUFBLEdBQU8sTUFBTSxDQUFDLEtBQXhCOztBQUVmLFNBQUEsR0FBWSxTQUFBO0lBRVIsSUFBSSxDQUFDLElBQUwsQ0FBVSxPQUFWO0lBQ0EsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFiLENBQUE7V0FDQSxJQUFJLENBQUMs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V1MsTUFYVDttQkFXaUMsSUFBQSxDQUFBLENBQU0sQ0FBQyxNQUFNLENBQUMsSUFBZCxDQUFBO0FBWGpDLGFBWVMsT0FaVDttQkFZaUMsSUFBQSxDQUFBLENBQU0sQ0FBQyxNQUFNLENBQUMsS0FBZCxDQUFBO0FBWmpDLGFBYVMsZUFiVDtBQUFBLGFBYXlCLFNBYnpCO0FBQUEsYUFhbUMsTUFibkM7QUFBQSxhQWEwQyxJQWIxQzttQkFjUSxTQUFBLENBQVUsTUFBVjtBQWRSO0FBRmlCLENBQXJCOztBQXdCQSxTQUFBLEdBQVksU0FBQyxLQUFEO1dBQ1I7UUFDSztZQUFBLElBQUEsRUFBSyxPQUFMO1lBQWEsS0FBQSxFQUFNLFdBQW5CO1lBQStCLEtBQUEsRUFBTSxZQUFyQztTQURMLEVBR0s7WUFBQSxJQUFBLEVBQU0sRUFBTjtTQUhMO0tBSUMsQ0FBQyxNQUpGLENBSVMsS0FKVDtBQURROztBQWFaLE9BQU8sQ0FBQyxLQUFSLENBQWMsS0FBSyxDQUFDLE9BQU4sQ0FBYyxLQUFLLENBQUMsR0FBTixDQUFVLEtBQVYsRUFBZ0IsR0FBaEIsQ0FBZCxDQUFkOztBQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBViIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4wMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbjAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiMjI1xuXG57ICQsIF8sIGNoaWxkcCwgY2xhbXAsIGVtcHR5LCBrZXJyb3IsIGtleWluZm8sIGtsb2csIG9wZW4sIG9zLCBwb3N0LCBwcmVmcywgc2xhc2gsIHN0YXNoLCBzdG9wRXZlbnQsIHVkcCwgd2luIH0gPSByZXF1aXJlICdreGsnXG5cblRhYnMgICAgID0gcmVxdWlyZSAnLi90YWJzJ1xuQnJhaW4gICAgPSByZXF1aXJlICcuL2JyYWluJ1xuV2hlZWwgICAgPSByZXF1aXJlICcuL3Rvb2xzL3doZWVsJ1xuSGlzdG9yeSAgPSByZXF1aXJlICcuL2hpc3RvcnknXG5lbGVjdHJvbiA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuICAgICAgICAgXG53ID0gbmV3IHdpblxuICAgIGRpcjogICAgX19kaXJuYW1lXG4gICAgcGtnOiAgICByZXF1aXJlICcuLi9wYWNrYWdlLmpzb24nXG4gICAgbWVudTogICAnLi4vY29mZmVlL21lbnUubm9vbidcbiAgICBpY29uOiAgICcuLi9pbWcvbWVudUAyeC5wbmcnXG4gICAgcHJlZnNTZXBlcmF0b3I6ICfilrgnXG4gICAgIyBvbkxvYWQ6IC0+IHdpbmRvdy50ZXJtLm9uUmVzaXplKClcbiAgICBjb250ZXh0OiAoaXRlbXMpIC0+IG9uQ29udGV4dCBpdGVtc1xuXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAwMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDBcblxud2luZG93LnN0YXNoID0gbmV3IHN0YXNoIFwid2luLyN7d2luZG93LndpbklEfVwiXG5cbnNhdmVTdGFzaCA9IC0+XG5cbiAgICBwb3N0LmVtaXQgJ3N0YXNoJ1xuICAgIHdpbmRvdy5zdGFzaC5zYXZlKClcbiAgICBwb3N0LnRvTWFpbiAnc3Rhc2hTYXZlZCdcblxud2luZG93LnRhYnMgPSB0YWJzID0gbmV3IFRhYnMgJCBcIiN0aXRsZWJhclwiXG53aW5kb3cuYnJhaW4gPSBuZXcgQnJhaW5cbndpbmRvdy53aGVlbCA9IG5ldyBXaGVlbCBcblxuSGlzdG9yeS5pbml0KClcblxudGVybSA9IC0+ICh0YWJzLmFjdGl2ZVRhYigpID8gdGFicy50YWJzWzBdKS50ZXJtXG5cbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAwMDBcbiMgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuXG5vbk1vdmUgID0gLT4gd2luZG93LnN0YXNoLnNldCAnYm91bmRzJyB3aW5kb3cud2luLmdldEJvdW5kcygpXG5cbiMgd2luZG93Lndpbi5vbiAncmVzaXplJyAtPiB0YWJzLnJlc2l6ZWQoKVxuXG4jICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDBcblxud2luZG93Lm9ubG9hZCA9IC0+XG5cbiAgICAjIHdpbmRvdy53aW4ub24gJ21vdmUnICBvbk1vdmVcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG5yZWxvYWRXaW4gPSAtPlxuXG4gICAgc2F2ZVN0YXNoKClcbiAgICBjbGVhckxpc3RlbmVycygpXG5cbiMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwIDAgMDAwICBcbiMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIFxuIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG5cbmtvU2VuZCA9IG51bGxcblxub3BlbkZpbGUgPSAoZikgLT5cbiAgXG4gICAgW2ZpbGUsIGxpbmVdID0gc2xhc2guc3BsaXRGaWxlTGluZSBmXG4gICAgXG4gICAgc3dpdGNoIHByZWZzLmdldCAnZWRpdG9yJyAnVmlzdWFsIFN0dWRpbydcbiAgICAgICAgd2hlbiAnVlMgQ29kZSdcbiAgICAgICAgICAgIG9wZW4gXCJ2c2NvZGU6Ly9maWxlL1wiICsgc2xhc2gucmVzb2x2ZSBmXG4gICAgICAgIHdoZW4gJ1Zpc3VhbCBTdHVkaW8nXG4gICAgICAgICAgICBmaWxlID0gc2xhc2gudW5zbGFzaCBzbGFzaC5yZXNvbHZlIGZpbGVcbiAgICAgICAgICAgIGJhdCA9IHNsYXNoLnVuc2xhc2ggc2xhc2gucmVzb2x2ZSBzbGFzaC5qb2luIF9fZGlybmFtZSwgJy4uL2Jpbi9vcGVuRmlsZS9vcGVuVlMuYmF0J1xuICAgICAgICAgICAgY2hpbGRwLmV4ZWMgXCJcXFwiI3tiYXR9XFxcIiBcXFwiI3tmaWxlfVxcXCIgI3tsaW5lfSAwXCIgeyBjd2Q6c2xhc2guZGlyKGJhdCkgfSwgKGVycikgLT4gXG4gICAgICAgICAgICAgICAga2Vycm9yICd2YicgZXJyIGlmIG5vdCBlbXB0eSBlcnJcbiAgICAgICAgd2hlbiAnQXRvbSdcbiAgICAgICAgICAgIGZpbGUgPSBzbGFzaC51bnNsYXNoIHNsYXNoLnJlc29sdmUgZmlsZVxuICAgICAgICAgICAgYXRvbSA9IHNsYXNoLnVuc2xhc2ggc2xhc2gudW50aWxkZSAnfi9BcHBEYXRhL0xvY2FsL2F0b20vYmluL2F0b20nXG4gICAgICAgICAgICBjaGlsZHAuZXhlYyBcIlxcXCIje2F0b219XFxcIiBcXFwiI3tmaWxlfToje2xpbmV9XFxcIlwiIHsgY3dkOnNsYXNoLmRpcihmaWxlKSB9LCAoZXJyKSAtPiBcbiAgICAgICAgICAgICAgICBrZXJyb3IgJ2F0b20nIGVyciBpZiBub3QgZW1wdHkgZXJyXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIG5vdCBrb1NlbmQgdGhlbiBrb1NlbmQgPSBuZXcgdWRwIHBvcnQ6OTc3OVxuICAgICAgICAgICAga29TZW5kLnNlbmQgc2xhc2gucmVzb2x2ZSBmXG4gICAgXG5wb3N0Lm9uICdvcGVuRmlsZScgb3BlbkZpbGVcbnBvc3Qub24gJ3NhdmVTdGFzaCcgLT4gc2F2ZVN0YXNoKClcblxuIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG4jIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuXG5kZWZhdWx0Rm9udFNpemUgPSAxOFxuXG5nZXRGb250U2l6ZSA9IC0+IHByZWZzLmdldCAnZm9udFNpemUnIGRlZmF1bHRGb250U2l6ZVxuXG5zZXRGb250U2l6ZSA9IChzKSAtPlxuICAgICAgICAgICAgICAgIFxuICAgIHMgPSBnZXRGb250U2l6ZSgpIGlmIG5vdCBfLmlzRmluaXRlIHNcbiAgICBzID0gcGFyc2VJbnQgY2xhbXAgOCwgODgsIHNcblxuICAgIHByZWZzLnNldCAnZm9udFNpemUnIHNcbiAgICBwb3N0LmVtaXQgJ2ZvbnRTaXplJyBzXG5cbndpbmRvdy5zZXRGb250U2l6ZSA9IHNldEZvbnRTaXplXG4gICAgXG5yZXNldEZvbnRTaXplID0gLT4gc2V0Rm9udFNpemUgZGVmYXVsdEZvbnRTaXplXG4gICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgXG4jIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICBcbiMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgXG5cbm9uV2hlZWwgPSAoZXZlbnQpIC0+XG4gICAgXG4gICAgeyBtb2QsIGtleSwgY29tYm8gfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgIGlmIG1vZCA9PSAob3MucGxhdGZvcm0oKSA9PSAnZGFyd2luJyBhbmQgJ2NvbW1hbmQnIG9yICdjdHJsJylcbiAgICAgICAgXG4gICAgICAgIHBvc3QuZW1pdCAnc3RvcFdoZWVsJ1xuICAgICAgICBcbiAgICAgICAgcyA9IGdldEZvbnRTaXplKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZXZlbnQuZGVsdGFZIDwgMFxuICAgICAgICAgICAgc2V0Rm9udFNpemUgcysxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNldEZvbnRTaXplIHMtMVxuICAgICAgICBcbiAgICBlbHNlXG4gICAgICAgIHdpbmRvdy53aGVlbC5vbldoZWVsIGV2ZW50XG4gICAgICAgIFxuICAgIHN0b3BFdmVudCBldmVudFxuICAgIFxucG9zdC5vbiAnc2Nyb2xsQnknIChkZWx0YSkgLT4gdGVybSgpLnNjcm9sbEJ5IGRlbHRhXG5cbndpbmRvdy5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyICd3aGVlbCcgb25XaGVlbCwgdHJ1ZSBcbiAgICBcbiMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuXG5zZXRFZGl0b3IgPSAoZWRpdG9yKSAtPlxuICAgIFxuICAgIHByZWZzLnNldCAnZWRpdG9yJyBlZGl0b3JcbiAgICBrbG9nIFwiZWRpdG9yOiAje3ByZWZzLmdldCAnZWRpdG9yJ31cIlxuXG5wb3N0Lm9uICdtZW51QWN0aW9uJyAoYWN0aW9uKSAtPlxuICAgIFxuICAgIHN3aXRjaCBhY3Rpb25cbiAgICAgICAgd2hlbiAnQ2xvc2UgVGFiJyAgICAgICAgdGhlbiB0YWJzLmNsb3NlVGFiKClcbiAgICAgICAgd2hlbiAnQ2xvc2UgT3RoZXIgVGFicycgdGhlbiB0YWJzLmNsb3NlT3RoZXJUYWJzKClcbiAgICAgICAgd2hlbiAnUHJldmlvdXMgVGFiJyAgICAgdGhlbiB0YWJzLm5hdmlnYXRlICdsZWZ0J1xuICAgICAgICB3aGVuICdOZXh0IFRhYicgICAgICAgICB0aGVuIHRhYnMubmF2aWdhdGUgJ3JpZ2h0J1xuICAgICAgICB3aGVuICdOZXcgV2luZG93JyAgICAgICB0aGVuIHBvc3QudG9NYWluICduZXdXaW5kb3cnXG4gICAgICAgIHdoZW4gJ05ldyBUYWInICAgICAgICAgIHRoZW4gdGFicy5hZGRUYWIoKVxuICAgICAgICB3aGVuICdJbmNyZWFzZScgICAgICAgICB0aGVuIHNldEZvbnRTaXplIGdldEZvbnRTaXplKCkrMVxuICAgICAgICB3aGVuICdEZWNyZWFzZScgICAgICAgICB0aGVuIHNldEZvbnRTaXplIGdldEZvbnRTaXplKCktMVxuICAgICAgICB3aGVuICdSZXNldCcgICAgICAgICAgICB0aGVuIHJlc2V0Rm9udFNpemUoKVxuICAgICAgICB3aGVuICdDbGVhcicgICAgICAgICAgICB0aGVuIHRlcm0oKS5jbGVhcigpOyB0ZXJtKCkucHdkKClcbiAgICAgICAgd2hlbiAnQ29weScgICAgICAgICAgICAgdGhlbiB0ZXJtKCkuZWRpdG9yLmNvcHkoKVxuICAgICAgICB3aGVuICdQYXN0ZScgICAgICAgICAgICB0aGVuIHRlcm0oKS5lZGl0b3IucGFzdGUoKVxuICAgICAgICB3aGVuICdWaXN1YWwgU3R1ZGlvJyAnVlMgQ29kZScgJ0F0b20nICdrbydcbiAgICAgICAgICAgIHNldEVkaXRvciBhY3Rpb25cblxuIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICBcbiMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG5vbkNvbnRleHQgPSAoaXRlbXMpIC0+XG4gICAgWyAgICBcbiAgICAgICAgIHRleHQ6J0NsZWFyJyBjb21ibzonY29tbWFuZCtrJyBhY2NlbDonYWx0K2N0cmwraydcbiAgICAsXG4gICAgICAgICB0ZXh0OiAnJ1xuICAgIF0uY29uY2F0IGl0ZW1zXG4gICAgICAgICAgICBcbiMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwICAgIFxuIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgXG4jIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgICAgXG5cbnByb2Nlc3MuY2hkaXIgc2xhc2gudW50aWxkZSBwcmVmcy5nZXQgJ2N3ZCcgJ34nXG5wb3N0LmVtaXQgJ3Jlc3RvcmUnXG4iXX0=
//# sourceURL=../coffee/window.coffee