// koffee 1.4.0

/*
000000000   0000000   0000000     0000000
   000     000   000  000   000  000     
   000     000000000  0000000    0000000 
   000     000   000  000   000       000
   000     000   000  0000000    0000000
 */
var $, Tab, Tabs, Term, _, drag, elem, empty, kpos, popup, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), $ = ref.$, _ = ref._, drag = ref.drag, elem = ref.elem, empty = ref.empty, kpos = ref.kpos, popup = ref.popup, post = ref.post, slash = ref.slash, stopEvent = ref.stopEvent;

Tab = require('./tab');

Term = require('./term');

Tabs = (function() {
    function Tabs(titlebar) {
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.closeTabs = bind(this.closeTabs, this);
        this.onDragStop = bind(this.onDragStop, this);
        this.onDragMove = bind(this.onDragMove, this);
        this.onDragStart = bind(this.onDragStart, this);
        this.onClick = bind(this.onClick, this);
        this.restore = bind(this.restore, this);
        this.stash = bind(this.stash, this);
        this.tabs = [];
        this.div = elem({
            "class": 'tabs'
        });
        titlebar.insertBefore(this.div, $('.minimize'));
        this.div.addEventListener('click', this.onClick);
        this.div.addEventListener('contextmenu', this.onContextMenu);
        post.on('stash', this.stash);
        post.on('restore', this.restore);
        this.drag = new drag({
            target: this.div,
            onStart: this.onDragStart,
            onMove: this.onDragMove,
            onStop: this.onDragStop
        });
    }

    Tabs.prototype.stash = function() {
        var paths, ref1, tab;
        paths = (function() {
            var i, len, ref1, results;
            ref1 = this.tabs;
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                tab = ref1[i];
                results.push(tab.text);
            }
            return results;
        }).call(this);
        return window.stash.set('tabs', {
            paths: paths,
            active: Math.min((ref1 = this.activeTab()) != null ? ref1.index() : void 0, paths.length - 1)
        });
    };

    Tabs.prototype.restore = function() {
        var active, paths, ref1;
        active = window.stash.get('tabs:active', 0);
        paths = window.stash.get('tabs:paths');
        if (empty(paths)) {
            this.addTab(slash.tilde(process.cwd()));
            return;
        }
        while (paths.length) {
            this.addTab(paths.shift());
        }
        return (ref1 = this.tabs[active]) != null ? ref1.activate() : void 0;
    };

    Tabs.prototype.onClick = function(event) {
        var tab;
        if (tab = this.tab(event.target)) {
            if (event.target.classList.contains('dot')) {
                this.closeTab(tab);
            } else {
                tab.activate();
            }
        }
        return true;
    };

    Tabs.prototype.onDragStart = function(d, e) {
        var br;
        this.dragTab = this.tab(e.target);
        if (!this.dragTab) {
            return 'skip';
        }
        if (event.button !== 1) {
            return 'skip';
        }
        this.dragDiv = this.dragTab.div.cloneNode(true);
        this.dragTab.div.style.opacity = '0';
        br = this.dragTab.div.getBoundingClientRect();
        this.dragDiv.style.position = 'absolute';
        this.dragDiv.style.top = br.top + "px";
        this.dragDiv.style.left = br.left + "px";
        this.dragDiv.style.width = (br.width - 12) + "px";
        this.dragDiv.style.height = (br.height - 3) + "px";
        this.dragDiv.style.flex = 'unset';
        this.dragDiv.style.pointerEvents = 'none';
        return document.body.appendChild(this.dragDiv);
    };

    Tabs.prototype.onDragMove = function(d, e) {
        var tab;
        this.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px)";
        if (tab = this.tabAtX(d.pos.x)) {
            if (tab.index() !== this.dragTab.index()) {
                return this.swap(tab, this.dragTab);
            }
        }
    };

    Tabs.prototype.onDragStop = function(d, e) {
        this.dragTab.div.style.opacity = '';
        return this.dragDiv.remove();
    };

    Tabs.prototype.tab = function(id) {
        if (_.isNumber(id)) {
            return this.tabs[id];
        }
        if (_.isElement(id)) {
            return _.find(this.tabs, function(t) {
                return t.div.contains(id);
            });
        }
        if (_.isString(id)) {
            return _.find(this.tabs, function(t) {
                return t.info.text === id;
            });
        }
    };

    Tabs.prototype.activeTab = function() {
        return _.find(this.tabs, function(t) {
            return t.isActive();
        });
    };

    Tabs.prototype.numTabs = function() {
        return this.tabs.length;
    };

    Tabs.prototype.tabAtX = function(x) {
        return _.find(this.tabs, function(t) {
            var br;
            br = t.div.getBoundingClientRect();
            return (br.left <= x && x <= br.left + br.width);
        });
    };

    Tabs.prototype.resized = function() {
        var i, len, ref1, results, tab;
        ref1 = this.tabs;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            tab = ref1[i];
            results.push(tab.term.resized());
        }
        return results;
    };

    Tabs.prototype.addTab = function(text) {
        var tab;
        tab = new Tab(this, new Term);
        tab.term.tab = tab;
        if (text) {
            tab.update(text);
        }
        this.tabs.push(tab);
        tab.activate();
        post.emit('menuAction', 'Clear');
        return tab;
    };

    Tabs.prototype.closeTab = function(tab) {
        var ref1;
        if (tab == null) {
            tab = this.activeTab();
        }
        if (tab == null) {
            return;
        }
        if (this.tabs.length > 1) {
            if (tab === this.activeTab()) {
                if ((ref1 = tab.nextOrPrev()) != null) {
                    ref1.activate();
                }
            }
        }
        tab.close();
        _.pull(this.tabs, tab);
        if (empty(this.tabs)) {
            post.emit('menuAction', 'Close');
        }
        return this;
    };

    Tabs.prototype.closeOtherTabs = function() {
        var keep;
        if (!this.activeTab()) {
            return;
        }
        keep = _.pullAt(this.tabs, this.activeTab().index());
        while (this.numTabs()) {
            this.tabs.pop().close();
        }
        return this.tabs = keep;
    };

    Tabs.prototype.closeTabs = function() {
        var results;
        results = [];
        while (this.numTabs()) {
            results.push(this.tabs.pop().close());
        }
        return results;
    };

    Tabs.prototype.navigate = function(key) {
        var index;
        index = this.activeTab().index();
        index += (function() {
            switch (key) {
                case 'left':
                    return -1;
                case 'right':
                    return +1;
            }
        })();
        index = (this.numTabs() + index) % this.numTabs();
        return this.tabs[index].activate();
    };

    Tabs.prototype.swap = function(ta, tb) {
        var ref1;
        if ((ta == null) || (tb == null)) {
            return;
        }
        if (ta.index() > tb.index()) {
            ref1 = [tb, ta], ta = ref1[0], tb = ref1[1];
        }
        this.tabs[ta.index()] = tb;
        this.tabs[tb.index() + 1] = ta;
        return this.div.insertBefore(tb.div, ta.div);
    };

    Tabs.prototype.move = function(key) {
        var tab;
        tab = this.activeTab();
        switch (key) {
            case 'left':
                return this.swap(tab, tab.prev());
            case 'right':
                return this.swap(tab, tab.next());
        }
    };

    Tabs.prototype.onContextMenu = function(event) {
        return stopEvent(event, this.showContextMenu(kpos(event)));
    };

    Tabs.prototype.showContextMenu = function(absPos) {
        var opt, tab;
        if (tab = this.tab(event.target)) {
            tab.activate();
        }
        if (absPos == null) {
            absPos = kpos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Close Other Tabs',
                    combo: 'ctrl+shift+w'
                }
            ]
        };
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    return Tabs;

})();

module.exports = Tabs;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFicy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsa0ZBQUE7SUFBQTs7QUFRQSxNQUFtRSxPQUFBLENBQVEsS0FBUixDQUFuRSxFQUFFLFNBQUYsRUFBSyxTQUFMLEVBQVEsZUFBUixFQUFjLGVBQWQsRUFBb0IsaUJBQXBCLEVBQTJCLGVBQTNCLEVBQWlDLGlCQUFqQyxFQUF3QyxlQUF4QyxFQUE4QyxpQkFBOUMsRUFBcUQ7O0FBRXJELEdBQUEsR0FBTyxPQUFBLENBQVEsT0FBUjs7QUFDUCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0FBRUQ7SUFFQyxjQUFDLFFBQUQ7Ozs7Ozs7Ozs7UUFFQyxJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLEdBQUQsR0FBTyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLE1BQU47U0FBTDtRQUVQLFFBQVEsQ0FBQyxZQUFULENBQXNCLElBQUMsQ0FBQSxHQUF2QixFQUE0QixDQUFBLENBQUUsV0FBRixDQUE1QjtRQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsT0FBdEIsRUFBb0MsSUFBQyxDQUFBLE9BQXJDO1FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixhQUF0QixFQUFvQyxJQUFDLENBQUEsYUFBckM7UUFFQSxJQUFJLENBQUMsRUFBTCxDQUFRLE9BQVIsRUFBa0IsSUFBQyxDQUFBLEtBQW5CO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxTQUFSLEVBQWtCLElBQUMsQ0FBQSxPQUFuQjtRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSSxJQUFKLENBQ0o7WUFBQSxNQUFBLEVBQVMsSUFBQyxDQUFBLEdBQVY7WUFDQSxPQUFBLEVBQVMsSUFBQyxDQUFBLFdBRFY7WUFFQSxNQUFBLEVBQVMsSUFBQyxDQUFBLFVBRlY7WUFHQSxNQUFBLEVBQVMsSUFBQyxDQUFBLFVBSFY7U0FESTtJQWJUOzttQkF5QkgsS0FBQSxHQUFPLFNBQUE7QUFFSCxZQUFBO1FBQUEsS0FBQTs7QUFBVTtBQUFBO2lCQUFBLHNDQUFBOzs2QkFBQSxHQUFHLENBQUM7QUFBSjs7O2VBRVYsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLE1BQWpCLEVBQ0k7WUFBQSxLQUFBLEVBQVEsS0FBUjtZQUNBLE1BQUEsRUFBUSxJQUFJLENBQUMsR0FBTCx5Q0FBcUIsQ0FBRSxLQUFkLENBQUEsVUFBVCxFQUFnQyxLQUFLLENBQUMsTUFBTixHQUFhLENBQTdDLENBRFI7U0FESjtJQUpHOzttQkFRUCxPQUFBLEdBQVMsU0FBQTtBQUVMLFlBQUE7UUFBQSxNQUFBLEdBQVMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLENBQWlCLGFBQWpCLEVBQStCLENBQS9CO1FBQ1QsS0FBQSxHQUFTLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBYixDQUFpQixZQUFqQjtRQUVULElBQUcsS0FBQSxDQUFNLEtBQU4sQ0FBSDtZQUNJLElBQUMsQ0FBQSxNQUFELENBQVEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxPQUFPLENBQUMsR0FBUixDQUFBLENBQVosQ0FBUjtBQUNBLG1CQUZKOztBQUlBLGVBQU0sS0FBSyxDQUFDLE1BQVo7WUFDSSxJQUFDLENBQUEsTUFBRCxDQUFRLEtBQUssQ0FBQyxLQUFOLENBQUEsQ0FBUjtRQURKO3dEQUdhLENBQUUsUUFBZixDQUFBO0lBWks7O21CQW9CVCxPQUFBLEdBQVMsU0FBQyxLQUFEO0FBRUwsWUFBQTtRQUFBLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxHQUFELENBQUssS0FBSyxDQUFDLE1BQVgsQ0FBVDtZQUNJLElBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBdkIsQ0FBZ0MsS0FBaEMsQ0FBSDtnQkFDSSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVYsRUFESjthQUFBLE1BQUE7Z0JBR0ksR0FBRyxDQUFDLFFBQUosQ0FBQSxFQUhKO2FBREo7O2VBS0E7SUFQSzs7bUJBZVQsV0FBQSxHQUFhLFNBQUMsQ0FBRCxFQUFJLENBQUo7QUFNVCxZQUFBO1FBQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFDLENBQUEsR0FBRCxDQUFLLENBQUMsQ0FBQyxNQUFQO1FBRVgsSUFBaUIsQ0FBSSxJQUFDLENBQUEsT0FBdEI7QUFBQSxtQkFBTyxPQUFQOztRQUNBLElBQWlCLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQWpDO0FBQUEsbUJBQU8sT0FBUDs7UUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUMsQ0FBQSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQWIsQ0FBdUIsSUFBdkI7UUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBbkIsR0FBNkI7UUFDN0IsRUFBQSxHQUFLLElBQUMsQ0FBQSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFiLENBQUE7UUFDTCxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFmLEdBQTBCO1FBQzFCLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQWYsR0FBeUIsRUFBRSxDQUFDLEdBQUosR0FBUTtRQUNoQyxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFmLEdBQXlCLEVBQUUsQ0FBQyxJQUFKLEdBQVM7UUFDakMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBZixHQUF5QixDQUFDLEVBQUUsQ0FBQyxLQUFILEdBQVMsRUFBVixDQUFBLEdBQWE7UUFDdEMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBZixHQUEwQixDQUFDLEVBQUUsQ0FBQyxNQUFILEdBQVUsQ0FBWCxDQUFBLEdBQWE7UUFDdkMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBZixHQUFzQjtRQUN0QixJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxhQUFmLEdBQStCO2VBQy9CLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBZCxDQUEwQixJQUFDLENBQUEsT0FBM0I7SUFyQlM7O21CQXVCYixVQUFBLEdBQVksU0FBQyxDQUFELEVBQUcsQ0FBSDtBQUVSLFlBQUE7UUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFmLEdBQTJCLGFBQUEsR0FBYyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQXpCLEdBQTJCO1FBQ3RELElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxNQUFELENBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFkLENBQVQ7WUFDSSxJQUFHLEdBQUcsQ0FBQyxLQUFKLENBQUEsQ0FBQSxLQUFlLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFBLENBQWxCO3VCQUNJLElBQUMsQ0FBQSxJQUFELENBQU0sR0FBTixFQUFXLElBQUMsQ0FBQSxPQUFaLEVBREo7YUFESjs7SUFIUTs7bUJBT1osVUFBQSxHQUFZLFNBQUMsQ0FBRCxFQUFHLENBQUg7UUFFUixJQUFDLENBQUEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBbkIsR0FBNkI7ZUFDN0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQUE7SUFIUTs7bUJBV1osR0FBQSxHQUFLLFNBQUMsRUFBRDtRQUVELElBQUcsQ0FBQyxDQUFDLFFBQUYsQ0FBWSxFQUFaLENBQUg7QUFBdUIsbUJBQU8sSUFBQyxDQUFBLElBQUssQ0FBQSxFQUFBLEVBQXBDOztRQUNBLElBQUcsQ0FBQyxDQUFDLFNBQUYsQ0FBWSxFQUFaLENBQUg7QUFBdUIsbUJBQU8sQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsSUFBUixFQUFjLFNBQUMsQ0FBRDt1QkFBTyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQU4sQ0FBZSxFQUFmO1lBQVAsQ0FBZCxFQUE5Qjs7UUFDQSxJQUFHLENBQUMsQ0FBQyxRQUFGLENBQVksRUFBWixDQUFIO0FBQXVCLG1CQUFPLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBQyxDQUFBLElBQVIsRUFBYyxTQUFDLENBQUQ7dUJBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFQLEtBQWU7WUFBdEIsQ0FBZCxFQUE5Qjs7SUFKQzs7bUJBTUwsU0FBQSxHQUFXLFNBQUE7ZUFBRyxDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxJQUFSLEVBQWMsU0FBQyxDQUFEO21CQUFPLENBQUMsQ0FBQyxRQUFGLENBQUE7UUFBUCxDQUFkO0lBQUg7O21CQUNYLE9BQUEsR0FBVyxTQUFBO2VBQUcsSUFBQyxDQUFBLElBQUksQ0FBQztJQUFUOzttQkFFWCxNQUFBLEdBQVEsU0FBQyxDQUFEO2VBRUosQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFDLENBQUEsSUFBUixFQUFjLFNBQUMsQ0FBRDtBQUNWLGdCQUFBO1lBQUEsRUFBQSxHQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMscUJBQU4sQ0FBQTttQkFDTCxDQUFBLEVBQUUsQ0FBQyxJQUFILElBQVcsQ0FBWCxJQUFXLENBQVgsSUFBZ0IsRUFBRSxDQUFDLElBQUgsR0FBVSxFQUFFLENBQUMsS0FBN0I7UUFGVSxDQUFkO0lBRkk7O21CQU1SLE9BQUEsR0FBUyxTQUFBO0FBQUcsWUFBQTtBQUFBO0FBQUE7YUFBQSxzQ0FBQTs7eUJBQXNCLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBVCxDQUFBO0FBQXRCOztJQUFIOzttQkFRVCxNQUFBLEdBQVEsU0FBQyxJQUFEO0FBRUosWUFBQTtRQUFBLEdBQUEsR0FBTSxJQUFJLEdBQUosQ0FBUSxJQUFSLEVBQVcsSUFBSSxJQUFmO1FBQ04sR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFULEdBQWU7UUFFZixJQUFHLElBQUg7WUFBYSxHQUFHLENBQUMsTUFBSixDQUFXLElBQVgsRUFBYjs7UUFFQSxJQUFDLENBQUEsSUFBSSxDQUFDLElBQU4sQ0FBVyxHQUFYO1FBQ0EsR0FBRyxDQUFDLFFBQUosQ0FBQTtRQUNBLElBQUksQ0FBQyxJQUFMLENBQVUsWUFBVixFQUF1QixPQUF2QjtlQUNBO0lBVkk7O21CQWtCUixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTs7WUFGTyxNQUFNLElBQUMsQ0FBQSxTQUFELENBQUE7O1FBRWIsSUFBYyxXQUFkO0FBQUEsbUJBQUE7O1FBRUEsSUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sR0FBZSxDQUFsQjtZQUNJLElBQUcsR0FBQSxLQUFPLElBQUMsQ0FBQSxTQUFELENBQUEsQ0FBVjs7d0JBQ29CLENBQUUsUUFBbEIsQ0FBQTtpQkFESjthQURKOztRQUlBLEdBQUcsQ0FBQyxLQUFKLENBQUE7UUFFQSxDQUFDLENBQUMsSUFBRixDQUFPLElBQUMsQ0FBQSxJQUFSLEVBQWMsR0FBZDtRQUVBLElBQUcsS0FBQSxDQUFNLElBQUMsQ0FBQSxJQUFQLENBQUg7WUFDSSxJQUFJLENBQUMsSUFBTCxDQUFVLFlBQVYsRUFBdUIsT0FBdkIsRUFESjs7ZUFHQTtJQWZNOzttQkFpQlYsY0FBQSxHQUFnQixTQUFBO0FBRVosWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsU0FBRCxDQUFBLENBQWQ7QUFBQSxtQkFBQTs7UUFDQSxJQUFBLEdBQU8sQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFDLENBQUEsSUFBVixFQUFnQixJQUFDLENBQUEsU0FBRCxDQUFBLENBQVksQ0FBQyxLQUFiLENBQUEsQ0FBaEI7QUFDUCxlQUFNLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBTjtZQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFBLENBQVcsQ0FBQyxLQUFaLENBQUE7UUFESjtlQUVBLElBQUMsQ0FBQSxJQUFELEdBQVE7SUFOSTs7bUJBUWhCLFNBQUEsR0FBVyxTQUFBO0FBRVAsWUFBQTtBQUFBO2VBQU0sSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFOO3lCQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsR0FBTixDQUFBLENBQVcsQ0FBQyxLQUFaLENBQUE7UUFESixDQUFBOztJQUZPOzttQkFXWCxRQUFBLEdBQVUsU0FBQyxHQUFEO0FBRU4sWUFBQTtRQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsU0FBRCxDQUFBLENBQVksQ0FBQyxLQUFiLENBQUE7UUFDUixLQUFBO0FBQVMsb0JBQU8sR0FBUDtBQUFBLHFCQUNBLE1BREE7MkJBQ1ksQ0FBQztBQURiLHFCQUVBLE9BRkE7MkJBRWEsQ0FBQztBQUZkOztRQUdULEtBQUEsR0FBUSxDQUFDLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBQSxHQUFhLEtBQWQsQ0FBQSxHQUF1QixJQUFDLENBQUEsT0FBRCxDQUFBO2VBQy9CLElBQUMsQ0FBQSxJQUFLLENBQUEsS0FBQSxDQUFNLENBQUMsUUFBYixDQUFBO0lBUE07O21CQVNWLElBQUEsR0FBTSxTQUFDLEVBQUQsRUFBSyxFQUFMO0FBRUYsWUFBQTtRQUFBLElBQWMsWUFBSixJQUFlLFlBQXpCO0FBQUEsbUJBQUE7O1FBQ0EsSUFBdUIsRUFBRSxDQUFDLEtBQUgsQ0FBQSxDQUFBLEdBQWEsRUFBRSxDQUFDLEtBQUgsQ0FBQSxDQUFwQztZQUFBLE9BQVcsQ0FBQyxFQUFELEVBQUssRUFBTCxDQUFYLEVBQUMsWUFBRCxFQUFLLGFBQUw7O1FBQ0EsSUFBQyxDQUFBLElBQUssQ0FBQSxFQUFFLENBQUMsS0FBSCxDQUFBLENBQUEsQ0FBTixHQUFzQjtRQUN0QixJQUFDLENBQUEsSUFBSyxDQUFBLEVBQUUsQ0FBQyxLQUFILENBQUEsQ0FBQSxHQUFXLENBQVgsQ0FBTixHQUFzQjtlQUN0QixJQUFDLENBQUEsR0FBRyxDQUFDLFlBQUwsQ0FBa0IsRUFBRSxDQUFDLEdBQXJCLEVBQTBCLEVBQUUsQ0FBQyxHQUE3QjtJQU5FOzttQkFRTixJQUFBLEdBQU0sU0FBQyxHQUFEO0FBRUYsWUFBQTtRQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsU0FBRCxDQUFBO0FBQ04sZ0JBQU8sR0FBUDtBQUFBLGlCQUNTLE1BRFQ7dUJBQ3NCLElBQUMsQ0FBQSxJQUFELENBQU0sR0FBTixFQUFXLEdBQUcsQ0FBQyxJQUFKLENBQUEsQ0FBWDtBQUR0QixpQkFFUyxPQUZUO3VCQUVzQixJQUFDLENBQUEsSUFBRCxDQUFNLEdBQU4sRUFBVyxHQUFHLENBQUMsSUFBSixDQUFBLENBQVg7QUFGdEI7SUFIRTs7bUJBYU4sYUFBQSxHQUFlLFNBQUMsS0FBRDtlQUFXLFNBQUEsQ0FBVSxLQUFWLEVBQWlCLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQUEsQ0FBSyxLQUFMLENBQWpCLENBQWpCO0lBQVg7O21CQUVmLGVBQUEsR0FBaUIsU0FBQyxNQUFEO0FBRWIsWUFBQTtRQUFBLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxHQUFELENBQUssS0FBSyxDQUFDLE1BQVgsQ0FBVDtZQUNJLEdBQUcsQ0FBQyxRQUFKLENBQUEsRUFESjs7UUFHQSxJQUFPLGNBQVA7WUFDSSxNQUFBLEdBQVMsSUFBQSxDQUFLLElBQUMsQ0FBQSxJQUFJLENBQUMscUJBQU4sQ0FBQSxDQUE2QixDQUFDLElBQW5DLEVBQXlDLElBQUMsQ0FBQSxJQUFJLENBQUMscUJBQU4sQ0FBQSxDQUE2QixDQUFDLEdBQXZFLEVBRGI7O1FBR0EsR0FBQSxHQUFNO1lBQUEsS0FBQSxFQUFPO2dCQUNUO29CQUFBLElBQUEsRUFBUSxrQkFBUjtvQkFDQSxLQUFBLEVBQVEsY0FEUjtpQkFEUzthQUFQOztRQVFOLEdBQUcsQ0FBQyxDQUFKLEdBQVEsTUFBTSxDQUFDO1FBQ2YsR0FBRyxDQUFDLENBQUosR0FBUSxNQUFNLENBQUM7ZUFDZixLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7SUFsQmE7Ozs7OztBQW9CckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgIFxuICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCBcbiAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwIFxuIyMjXG5cbnsgJCwgXywgZHJhZywgZWxlbSwgZW1wdHksIGtwb3MsIHBvcHVwLCBwb3N0LCBzbGFzaCwgc3RvcEV2ZW50IH0gPSByZXF1aXJlICdreGsnXG5cblRhYiAgPSByZXF1aXJlICcuL3RhYidcblRlcm0gPSByZXF1aXJlICcuL3Rlcm0nXG5cbmNsYXNzIFRhYnNcbiAgICBcbiAgICBAOiAodGl0bGViYXIpIC0+XG4gICAgICAgIFxuICAgICAgICBAdGFicyA9IFtdXG4gICAgICAgIEBkaXYgPSBlbGVtIGNsYXNzOid0YWJzJ1xuICAgICAgICBcbiAgICAgICAgdGl0bGViYXIuaW5zZXJ0QmVmb3JlIEBkaXYsICQgJy5taW5pbWl6ZSdcbiAgICAgICAgXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snICAgICAgIEBvbkNsaWNrXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnY29udGV4dG1lbnUnIEBvbkNvbnRleHRNZW51XG4gICAgICAgIFxuICAgICAgICBwb3N0Lm9uICdzdGFzaCcgICBAc3Rhc2hcbiAgICAgICAgcG9zdC5vbiAncmVzdG9yZScgQHJlc3RvcmVcbiAgICAgICAgXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBkaXZcbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvbkRyYWdTdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ01vdmVcbiAgICAgICAgICAgIG9uU3RvcDogIEBvbkRyYWdTdG9wXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuXG4gICAgc3Rhc2g6ID0+IFxuXG4gICAgICAgIHBhdGhzID0gKCB0YWIudGV4dCBmb3IgdGFiIGluIEB0YWJzIClcbiAgICAgICAgXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ3RhYnMnLCBcbiAgICAgICAgICAgIHBhdGhzOiAgcGF0aHNcbiAgICAgICAgICAgIGFjdGl2ZTogTWF0aC5taW4gQGFjdGl2ZVRhYigpPy5pbmRleCgpLCBwYXRocy5sZW5ndGgtMVxuICAgIFxuICAgIHJlc3RvcmU6ID0+XG4gICAgICAgIFxuICAgICAgICBhY3RpdmUgPSB3aW5kb3cuc3Rhc2guZ2V0ICd0YWJzOmFjdGl2ZScgMFxuICAgICAgICBwYXRocyAgPSB3aW5kb3cuc3Rhc2guZ2V0ICd0YWJzOnBhdGhzJ1xuICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgcGF0aHMgIyBoYXBwZW5zIHdoZW4gZmlyc3Qgd2luZG93IG9wZW5zXG4gICAgICAgICAgICBAYWRkVGFiIHNsYXNoLnRpbGRlIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgd2hpbGUgcGF0aHMubGVuZ3RoXG4gICAgICAgICAgICBAYWRkVGFiIHBhdGhzLnNoaWZ0KClcbiAgICAgICAgXG4gICAgICAgIEB0YWJzW2FjdGl2ZV0/LmFjdGl2YXRlKClcbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvbkNsaWNrOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiB0YWIgPSBAdGFiIGV2ZW50LnRhcmdldFxuICAgICAgICAgICAgaWYgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyAnZG90J1xuICAgICAgICAgICAgICAgIEBjbG9zZVRhYiB0YWJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0YWIuYWN0aXZhdGUoKVxuICAgICAgICB0cnVlXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIG9uRHJhZ1N0YXJ0OiAoZCwgZSkgPT4gXG4gICAgICAgIFxuICAgICAgICAjIGlmIGUuYnV0dG9uID09IDJcbiAgICAgICAgICAgICMgQGNsb3NlVGFiIEB0YWIgZS50YXJnZXRcbiAgICAgICAgICAgICMgcmV0dXJuICdza2lwJ1xuICAgICAgICAgICAgXG4gICAgICAgIEBkcmFnVGFiID0gQHRhYiBlLnRhcmdldFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuICdza2lwJyBpZiBub3QgQGRyYWdUYWJcbiAgICAgICAgcmV0dXJuICdza2lwJyBpZiBldmVudC5idXR0b24gIT0gMVxuICAgICAgICBcbiAgICAgICAgQGRyYWdEaXYgPSBAZHJhZ1RhYi5kaXYuY2xvbmVOb2RlIHRydWVcbiAgICAgICAgQGRyYWdUYWIuZGl2LnN0eWxlLm9wYWNpdHkgPSAnMCdcbiAgICAgICAgYnIgPSBAZHJhZ1RhYi5kaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLnRvcCAgPSBcIiN7YnIudG9wfXB4XCJcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUubGVmdCA9IFwiI3tici5sZWZ0fXB4XCJcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUud2lkdGggPSBcIiN7YnIud2lkdGgtMTJ9cHhcIlxuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5oZWlnaHQgPSBcIiN7YnIuaGVpZ2h0LTN9cHhcIlxuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5mbGV4ID0gJ3Vuc2V0J1xuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGRyYWdEaXZcblxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG4gICAgICAgIFxuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoI3tkLmRlbHRhU3VtLnh9cHgpXCJcbiAgICAgICAgaWYgdGFiID0gQHRhYkF0WCBkLnBvcy54XG4gICAgICAgICAgICBpZiB0YWIuaW5kZXgoKSAhPSBAZHJhZ1RhYi5pbmRleCgpXG4gICAgICAgICAgICAgICAgQHN3YXAgdGFiLCBAZHJhZ1RhYlxuICAgICAgICBcbiAgICBvbkRyYWdTdG9wOiAoZCxlKSA9PlxuICAgICAgICBcbiAgICAgICAgQGRyYWdUYWIuZGl2LnN0eWxlLm9wYWNpdHkgPSAnJ1xuICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIHRhYjogKGlkKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgXy5pc051bWJlciAgaWQgdGhlbiByZXR1cm4gQHRhYnNbaWRdXG4gICAgICAgIGlmIF8uaXNFbGVtZW50IGlkIHRoZW4gcmV0dXJuIF8uZmluZCBAdGFicywgKHQpIC0+IHQuZGl2LmNvbnRhaW5zIGlkXG4gICAgICAgIGlmIF8uaXNTdHJpbmcgIGlkIHRoZW4gcmV0dXJuIF8uZmluZCBAdGFicywgKHQpIC0+IHQuaW5mby50ZXh0ID09IGlkXG5cbiAgICBhY3RpdmVUYWI6IC0+IF8uZmluZCBAdGFicywgKHQpIC0+IHQuaXNBY3RpdmUoKVxuICAgIG51bVRhYnM6ICAgLT4gQHRhYnMubGVuZ3RoXG4gICAgXG4gICAgdGFiQXRYOiAoeCkgLT4gXG4gICAgICAgIFxuICAgICAgICBfLmZpbmQgQHRhYnMsICh0KSAtPiBcbiAgICAgICAgICAgIGJyID0gdC5kaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIGJyLmxlZnQgPD0geCA8PSBici5sZWZ0ICsgYnIud2lkdGhcblxuICAgIHJlc2l6ZWQ6IC0+IGZvciB0YWIgaW4gQHRhYnMgdGhlbiB0YWIudGVybS5yZXNpemVkKClcbiAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICBcbiAgICBcbiAgICBhZGRUYWI6ICh0ZXh0KSAtPlxuICAgICAgICBcbiAgICAgICAgdGFiID0gbmV3IFRhYiBALCBuZXcgVGVybVxuICAgICAgICB0YWIudGVybS50YWIgPSB0YWJcbiAgICAgICAgXG4gICAgICAgIGlmIHRleHQgdGhlbiB0YWIudXBkYXRlIHRleHRcbiAgICAgICAgICAgIFxuICAgICAgICBAdGFicy5wdXNoIHRhYlxuICAgICAgICB0YWIuYWN0aXZhdGUoKVxuICAgICAgICBwb3N0LmVtaXQgJ21lbnVBY3Rpb24nICdDbGVhcidcbiAgICAgICAgdGFiXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgY2xvc2VUYWI6ICh0YWIgPSBAYWN0aXZlVGFiKCkpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IHRhYj9cbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgQHRhYnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgaWYgdGFiID09IEBhY3RpdmVUYWIoKVxuICAgICAgICAgICAgICAgIHRhYi5uZXh0T3JQcmV2KCk/LmFjdGl2YXRlKClcbiAgICAgICAgICAgIFxuICAgICAgICB0YWIuY2xvc2UoKVxuICAgICAgICBcbiAgICAgICAgXy5wdWxsIEB0YWJzLCB0YWJcbiAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IEB0YWJzICMgY2xvc2UgdGhlIHdpbmRvdyB3aGVuIGxhc3QgdGFiIHdhcyBjbG9zZWRcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbWVudUFjdGlvbicgJ0Nsb3NlJyBcbiAgICAgICAgXG4gICAgICAgIEBcbiAgXG4gICAgY2xvc2VPdGhlclRhYnM6IC0+IFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAYWN0aXZlVGFiKClcbiAgICAgICAga2VlcCA9IF8ucHVsbEF0IEB0YWJzLCBAYWN0aXZlVGFiKCkuaW5kZXgoKVxuICAgICAgICB3aGlsZSBAbnVtVGFicygpXG4gICAgICAgICAgICBAdGFicy5wb3AoKS5jbG9zZSgpXG4gICAgICAgIEB0YWJzID0ga2VlcFxuICAgIFxuICAgIGNsb3NlVGFiczogPT5cbiAgICAgICAgXG4gICAgICAgIHdoaWxlIEBudW1UYWJzKClcbiAgICAgICAgICAgIEB0YWJzLnBvcCgpLmNsb3NlKClcbiAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG5hdmlnYXRlOiAoa2V5KSAtPlxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSBAYWN0aXZlVGFiKCkuaW5kZXgoKVxuICAgICAgICBpbmRleCArPSBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyB0aGVuIC0xXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiArMVxuICAgICAgICBpbmRleCA9IChAbnVtVGFicygpICsgaW5kZXgpICUgQG51bVRhYnMoKVxuICAgICAgICBAdGFic1tpbmRleF0uYWN0aXZhdGUoKVxuXG4gICAgc3dhcDogKHRhLCB0YikgLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgdGE/IG9yIG5vdCB0Yj9cbiAgICAgICAgW3RhLCB0Yl0gPSBbdGIsIHRhXSBpZiB0YS5pbmRleCgpID4gdGIuaW5kZXgoKVxuICAgICAgICBAdGFic1t0YS5pbmRleCgpXSAgID0gdGJcbiAgICAgICAgQHRhYnNbdGIuaW5kZXgoKSsxXSA9IHRhXG4gICAgICAgIEBkaXYuaW5zZXJ0QmVmb3JlIHRiLmRpdiwgdGEuZGl2XG4gICAgXG4gICAgbW92ZTogKGtleSkgLT5cbiAgICAgICAgXG4gICAgICAgIHRhYiA9IEBhY3RpdmVUYWIoKVxuICAgICAgICBzd2l0Y2gga2V5XG4gICAgICAgICAgICB3aGVuICdsZWZ0JyAgdGhlbiBAc3dhcCB0YWIsIHRhYi5wcmV2KCkgXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAc3dhcCB0YWIsIHRhYi5uZXh0KClcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uQ29udGV4dE1lbnU6IChldmVudCkgPT4gc3RvcEV2ZW50IGV2ZW50LCBAc2hvd0NvbnRleHRNZW51IGtwb3MgZXZlbnRcbiAgICAgICAgICAgICAgXG4gICAgc2hvd0NvbnRleHRNZW51OiAoYWJzUG9zKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgdGFiID0gQHRhYiBldmVudC50YXJnZXRcbiAgICAgICAgICAgIHRhYi5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBpdGVtczogWyBcbiAgICAgICAgICAgIHRleHQ6ICAgJ0Nsb3NlIE90aGVyIFRhYnMnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK3NoaWZ0K3cnIFxuICAgICAgICAjICxcbiAgICAgICAgICAgICMgdGV4dDogICAnTmV3IFdpbmRvdydcbiAgICAgICAgICAgICMgY29tYm86ICAnY3RybCtzaGlmdCtuJyBcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgb3B0LnggPSBhYnNQb3MueFxuICAgICAgICBvcHQueSA9IGFic1Bvcy55XG4gICAgICAgIHBvcHVwLm1lbnUgb3B0ICAgICAgICBcbiAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBUYWJzXG4iXX0=
//# sourceURL=../coffee/tabs.coffee