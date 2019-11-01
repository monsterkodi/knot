// koffee 1.4.0

/*
 0000000  000   000  00000000  000      000    
000       000   000  000       000      000    
0000000   000000000  0000000   000      000    
     000  000   000  000       000      000    
0000000   000   000  00000000  0000000  0000000
 */
var Alias, Chdir, History, Shell, _, args, childp, empty, history, klog, post, psTree, ref, slash, wxw,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), post = ref.post, history = ref.history, childp = ref.childp, slash = ref.slash, empty = ref.empty, args = ref.args, klog = ref.klog, _ = ref._;

History = require('./history');

Alias = require('./alias');

Chdir = require('./chdir');

psTree = require('ps-tree');

wxw = require('wxw');

Shell = (function() {
    function Shell(term) {
        this.term = term;
        this.onStdErr = bind(this.onStdErr, this);
        this.onStdOut = bind(this.onStdOut, this);
        this.dequeue = bind(this.dequeue, this);
        this.onDone = bind(this.onDone, this);
        this.onExit = bind(this.onExit, this);
        this.shellCmd = bind(this.shellCmd, this);
        this.executeCmd = bind(this.executeCmd, this);
        this.execute = bind(this.execute, this);
        this.cd = bind(this.cd, this);
        this.editor = this.term.editor;
        this.alias = new Alias(this);
        this.chdir = new Chdir(this);
        this.queue = [];
        this.inputQueue = [];
    }

    Shell.prototype.cd = function(dir) {
        if (!slash.samePath(dir, process.cwd())) {
            this.executeCmd('cd ' + dir);
            return this.editor.focus();
        }
    };

    Shell.prototype.substitute = function(cmd) {
        cmd = this.alias.substitute(cmd);
        cmd = cmd.replace(/\~/g, slash.home());
        return cmd;
    };

    Shell.prototype.execute = function(arg1) {
        var fallback, hsub, ref1, ref2;
        this.cmd = (ref1 = arg1.cmd) != null ? ref1 : null, fallback = (ref2 = arg1.fallback) != null ? ref2 : null;
        if (this.cmd != null) {
            this.cmd;
        } else {
            this.cmd = this.editor.lastLine();
        }
        this.cmd = this.cmd.trim();
        if (this.child) {
            this.inputQueue.push(this.cmd);
            this.editor.setInputText('');
            return;
        }
        this.errorText = '';
        if (this.cmd !== (hsub = History.substitute(this.cmd))) {
            this.cmd = hsub;
            this.editor.setInputText(this.cmd);
        }
        this.editor.appendText('');
        this.editor.singleCursorAtEnd();
        if (empty(this.cmd)) {
            return;
        }
        this.term.history.shellCmd(this.cmd);
        this.last = {
            cmd: this.cmd,
            cwd: process.cwd(),
            meta: this.term.insertCmdMeta(this.editor.numLines() - 2, this.cmd)
        };
        if (fallback) {
            this.last.fallback = fallback;
        }
        return this.executeCmd(this.substitute(this.cmd));
    };

    Shell.prototype.executeCmd = function(cmd1) {
        var split;
        this.cmd = cmd1;
        split = this.cmd.split('&&');
        if (split.length > 1) {
            this.cmd = split[0].trim();
            this.queue = this.queue.concat(split.slice(1));
        } else {
            this.cmd = this.cmd.trim();
        }
        if (empty(this.cmd)) {
            this.dequeue();
            return true;
        }
        if (this.alias.onCommand(this.cmd)) {
            this.dequeue();
            return true;
        }
        if (this.chdir.onCommand(this.cmd)) {
            this.dequeue();
            return true;
        }
        return this.shellCmd(this.cmd);
    };

    Shell.prototype.shellCmd = function(cmd1) {
        var cmd, currentCommand, firstChild, i, j, opt, pipe, previousChild, ref1, split;
        this.cmd = cmd1;
        split = this.cmd.split('|');
        if (split.length > 1) {
            pipe = function(child, stdout, stderr) {
                child.stdin.on('error', function(err) {
                    return stderr.write('stdin error' + err + '\n');
                });
                child.stderr.on('data', function(data) {
                    if (!/^execvp\(\)/.test(data)) {
                        return stderr.write(data);
                    }
                });
                child.stdout.pipe(stdout);
                return child.on('error', function(err) {
                    process.stderr.write('Failed to execute ' + err + '\n');
                    return firstChild.kill();
                });
            };
            currentCommand = split[0];
            args = currentCommand.split(' ');
            cmd = args.shift();
            opt = {
                encoding: 'utf8',
                shell: true
            };
            firstChild = previousChild = this.child = childp.spawn(cmd, args, opt);
            for (i = j = 1, ref1 = split.length; 1 <= ref1 ? j < ref1 : j > ref1; i = 1 <= ref1 ? ++j : --j) {
                currentCommand = split[i].trim();
                args = currentCommand.split(' ');
                cmd = args.shift();
                this.child = childp.spawn(cmd, args, opt);
                pipe(previousChild, this.child.stdin, process.stderr);
                previousChild = this.child;
            }
            this.child.stdout.on('data', this.onStdOut);
            this.child.stderr.on('data', this.onStdErr);
            this.child.on('close', (function(_this) {
                return function(code) {
                    firstChild.kill();
                    return _this.onExit(code);
                };
            })(this));
        } else {
            this.child = childp.exec(this.cmd, {
                shell: true
            });
            this.child.stdout.on('data', this.onStdOut);
            this.child.stderr.on('data', this.onStdErr);
            this.child.on('close', this.onExit);
        }
        return true;
    };

    Shell.prototype.handleCancel = function() {
        if (!this.child) {
            return 'unhandled';
        }
        psTree(this.child.pid, (function(_this) {
            return function(err, children) {
                var arg, j, len, results;
                args = children.map(function(p) {
                    return p.PID;
                });
                args.unshift(_this.child.pid);
                args.reverse();
                _this.child.kill();
                results = [];
                for (j = 0, len = args.length; j < len; j++) {
                    arg = args[j];
                    results.push(klog(arg, wxw('terminate', arg)));
                }
                return results;
            };
        })(this));
        return true;
    };

    Shell.prototype.onExit = function(code) {
        var killed;
        killed = this.child.killed;
        delete this.child;
        if (code === 0 || killed || this.fallback()) {
            return setImmediate(this.onDone);
        } else {
            this.term.failMeta(this.last.meta);
            if (!/is not recognized/.test(this.errorText)) {
                this.editor.appendOutput('\n' + this.errorText);
            }
            return this.dequeue('fail');
        }
    };

    Shell.prototype.fallback = function() {
        if (this.last.fallback) {
            klog('fallback', this.last.fallback);
            this.enqueue({
                cmd: this.last.fallback,
                update: true
            });
            delete this.last.fallback;
            return true;
        }
        return this.chdir.onFallback(this.cmd);
    };

    Shell.prototype.onDone = function(lastCode) {
        var info;
        if (lastCode !== 'fail' && (this.last.meta != null)) {
            info = _.clone(this.last);
            delete info.meta;
            post.emit('cmd', info);
            this.term.succMeta(this.last.meta);
        }
        if (empty(this.queue) && empty(this.inputQueue)) {
            return this.term.pwd();
        } else {
            return this.dequeue();
        }
    };

    Shell.prototype.enqueue = function(arg1) {
        var cmd, front, ref1, ref2, ref3, update;
        cmd = (ref1 = arg1.cmd) != null ? ref1 : '', front = (ref2 = arg1.front) != null ? ref2 : false, update = (ref3 = arg1.update) != null ? ref3 : false;
        if (update) {
            this.last.cmd = cmd;
            if (this.last.meta) {
                this.editor.replaceTextInLine(this.last.meta[0], cmd);
                this.editor.meta.update(this.last.meta);
            }
        }
        cmd = cmd.replace(/\~/g, slash.home());
        if (front) {
            this.queue.unshift(cmd);
        } else {
            this.queue.push(cmd);
        }
        return cmd;
    };

    Shell.prototype.dequeue = function(lastCode) {
        var cmd;
        if (this.queue.length) {
            return this.executeCmd(this.queue.shift());
        } else if (this.inputQueue.length) {
            cmd = this.inputQueue.shift();
            this.editor.setInputText(cmd);
            return this.execute(cmd);
        } else {
            return this.onDone(lastCode);
        }
    };

    Shell.prototype.onStdOut = function(data) {
        if (data.replace == null) {
            data = data.toString('utf8');
        }
        if (data.slice(-1)[0] === '\n') {
            data = data.slice(0, +(data.length - 2) + 1 || 9e9);
        }
        this.editor.appendOutput(data);
        return this.editor.singleCursorAtEnd();
    };

    Shell.prototype.onStdErr = function(data) {
        return this.errorText += data;
    };

    return Shell;

})();

module.exports = Shell;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hlbGwuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtHQUFBO0lBQUE7O0FBUUEsTUFBeUQsT0FBQSxDQUFRLEtBQVIsQ0FBekQsRUFBRSxlQUFGLEVBQVEscUJBQVIsRUFBaUIsbUJBQWpCLEVBQXlCLGlCQUF6QixFQUFnQyxpQkFBaEMsRUFBdUMsZUFBdkMsRUFBNkMsZUFBN0MsRUFBbUQ7O0FBRW5ELE9BQUEsR0FBVSxPQUFBLENBQVEsV0FBUjs7QUFDVixLQUFBLEdBQVUsT0FBQSxDQUFRLFNBQVI7O0FBQ1YsS0FBQSxHQUFVLE9BQUEsQ0FBUSxTQUFSOztBQUNWLE1BQUEsR0FBVSxPQUFBLENBQVEsU0FBUjs7QUFDVixHQUFBLEdBQVUsT0FBQSxDQUFRLEtBQVI7O0FBRUo7SUFFQyxlQUFDLElBQUQ7UUFBQyxJQUFDLENBQUEsT0FBRDs7Ozs7Ozs7OztRQUVBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQyxDQUFBLElBQUksQ0FBQztRQUNoQixJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksS0FBSixDQUFVLElBQVY7UUFDVCxJQUFDLENBQUEsS0FBRCxHQUFTLElBQUksS0FBSixDQUFVLElBQVY7UUFDVCxJQUFDLENBQUEsS0FBRCxHQUFTO1FBQ1QsSUFBQyxDQUFBLFVBQUQsR0FBYztJQU5mOztvQkFRSCxFQUFBLEdBQUksU0FBQyxHQUFEO1FBRUEsSUFBRyxDQUFJLEtBQUssQ0FBQyxRQUFOLENBQWUsR0FBZixFQUFvQixPQUFPLENBQUMsR0FBUixDQUFBLENBQXBCLENBQVA7WUFDSSxJQUFDLENBQUEsVUFBRCxDQUFZLEtBQUEsR0FBUSxHQUFwQjttQkFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsQ0FBQSxFQUZKOztJQUZBOztvQkFNSixVQUFBLEdBQVksU0FBQyxHQUFEO1FBRVIsR0FBQSxHQUFNLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBUCxD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O0lBSkE7O29CQWlCVCxRQUFBLEdBQVUsU0FBQyxJQUFEO1FBRU4sSUFBTyxvQkFBUDtZQUNJLElBQUEsR0FBTyxJQUFJLENBQUMsUUFBTCxDQUFjLE1BQWQsRUFEWDs7UUFFQSxJQUFHLElBQUssVUFBRSxDQUFBLENBQUEsQ0FBUCxLQUFZLElBQWY7WUFDSSxJQUFBLEdBQU8sSUFBSyx5Q0FEaEI7O1FBR0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLElBQXJCO2VBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUFBO0lBUk07O29CQVVWLFFBQUEsR0FBVSxTQUFDLElBQUQ7ZUFFTixJQUFDLENBQUEsU0FBRCxJQUFjO0lBRlI7Ozs7OztBQUlkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICBcbjAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgXG4gICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgIFxuMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDBcbiMjI1xuXG57IHBvc3QsIGhpc3RvcnksIGNoaWxkcCwgc2xhc2gsIGVtcHR5LCBhcmdzLCBrbG9nLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbkhpc3RvcnkgPSByZXF1aXJlICcuL2hpc3RvcnknXG5BbGlhcyAgID0gcmVxdWlyZSAnLi9hbGlhcydcbkNoZGlyICAgPSByZXF1aXJlICcuL2NoZGlyJ1xucHNUcmVlICA9IHJlcXVpcmUgJ3BzLXRyZWUnXG53eHcgICAgID0gcmVxdWlyZSAnd3h3J1xuXG5jbGFzcyBTaGVsbFxuXG4gICAgQDogKEB0ZXJtKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVkaXRvciA9IEB0ZXJtLmVkaXRvclxuICAgICAgICBAYWxpYXMgPSBuZXcgQWxpYXMgQFxuICAgICAgICBAY2hkaXIgPSBuZXcgQ2hkaXIgQFxuICAgICAgICBAcXVldWUgPSBbXVxuICAgICAgICBAaW5wdXRRdWV1ZSA9IFtdXG4gICAgICAgIFxuICAgIGNkOiAoZGlyKSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHNsYXNoLnNhbWVQYXRoIGRpciwgcHJvY2Vzcy5jd2QoKVxuICAgICAgICAgICAgQGV4ZWN1dGVDbWQgJ2NkICcgKyBkaXJcbiAgICAgICAgICAgIEBlZGl0b3IuZm9jdXMoKVxuICAgICAgICBcbiAgICBzdWJzdGl0dXRlOiAoY21kKSAtPlxuICAgICAgICBcbiAgICAgICAgY21kID0gQGFsaWFzLnN1YnN0aXR1dGUgY21kXG4gICAgICAgIGNtZCA9IGNtZC5yZXBsYWNlIC9cXH4vZywgc2xhc2guaG9tZSgpXG4gICAgICAgIGNtZFxuICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgZXhlY3V0ZTogKEBjbWQ6LCBmYWxsYmFjazopID0+XG4gICAgXG4gICAgICAgIEBjbWQgPz0gQGVkaXRvci5sYXN0TGluZSgpXG4gICAgICAgIEBjbWQgPSBAY21kLnRyaW0oKVxuICAgICAgICBcbiAgICAgICAgaWYgQGNoaWxkXG4gICAgICAgICAgICBAaW5wdXRRdWV1ZS5wdXNoIEBjbWRcbiAgICAgICAgICAgIEBlZGl0b3Iuc2V0SW5wdXRUZXh0ICcnXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBlcnJvclRleHQgPSAnJ1xuICAgICAgICBcbiAgICAgICAgaWYgQGNtZCAhPSBoc3ViID0gSGlzdG9yeS5zdWJzdGl0dXRlIEBjbWRcbiAgICAgICAgICAgIEBjbWQgPSBoc3ViXG4gICAgICAgICAgICBAZWRpdG9yLnNldElucHV0VGV4dCBAY21kXG4gICAgICAgIFxuICAgICAgICBAZWRpdG9yLmFwcGVuZFRleHQgJydcbiAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdEVuZCgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgQGNtZCB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQHRlcm0uaGlzdG9yeS5zaGVsbENtZCBAY21kICMgbWlnaHQgcmVzZXQgaGlzdG9yeSBwb2ludGVyIHRvIGxhc3RcblxuICAgICAgICBAbGFzdCA9XG4gICAgICAgICAgICBjbWQ6ICAgICAgQGNtZFxuICAgICAgICAgICAgY3dkOiAgICAgIHByb2Nlc3MuY3dkKClcbiAgICAgICAgICAgIG1ldGE6ICAgICBAdGVybS5pbnNlcnRDbWRNZXRhIEBlZGl0b3IubnVtTGluZXMoKS0yIEBjbWRcbiAgICAgICAgICAgIFxuICAgICAgICBAbGFzdC5mYWxsYmFjayA9IGZhbGxiYWNrIGlmIGZhbGxiYWNrXG4gICAgICAgIFxuICAgICAgICBAZXhlY3V0ZUNtZCBAc3Vic3RpdHV0ZSBAY21kXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgIDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgICAgMDAwICAgICAgICAgICAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIGV4ZWN1dGVDbWQ6IChAY21kKSA9PlxuICAgICAgICBcbiAgICAgICAgc3BsaXQgPSBAY21kLnNwbGl0ICcmJidcbiAgICAgICAgaWYgc3BsaXQubGVuZ3RoID4gMVxuICAgICAgICAgICAgQGNtZCA9IHNwbGl0WzBdLnRyaW0oKVxuICAgICAgICAgICAgQHF1ZXVlID0gQHF1ZXVlLmNvbmNhdCBzcGxpdFsxLi5dXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjbWQgPSBAY21kLnRyaW0oKVxuICAgICAgICBcbiAgICAgICAgaWYgZW1wdHkgQGNtZFxuICAgICAgICAgICAgQGRlcXVldWUoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgXG4gICAgICAgIGlmIEBhbGlhcy5vbkNvbW1hbmQgQGNtZFxuICAgICAgICAgICAgQGRlcXVldWUoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgICBpZiBAY2hkaXIub25Db21tYW5kIEBjbWRcbiAgICAgICAgICAgIEBkZXF1ZXVlKClcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgIyBrbG9nICdzaGVsbENtZCcgQGNtZCAgICBcbiAgICAgICAgQHNoZWxsQ21kIEBjbWRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAwMDAwMDAwICAwMCAgICAgMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgc2hlbGxDbWQ6IChAY21kKSA9PlxuICAgICAgICAgICAgXG4gICAgICAgIHNwbGl0ID0gQGNtZC5zcGxpdCAnfCdcbiAgICAgICAgXG4gICAgICAgIGlmIHNwbGl0Lmxlbmd0aCA+IDFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgIyAwMDAwMDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAgICAgICAgICMgMDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICAgICAgICAgIyAwMDAgICAgICAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgICAgICAgICAjIDAwMCAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAwICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcGlwZSA9IChjaGlsZCwgc3Rkb3V0LCBzdGRlcnIpIC0+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2hpbGQuc3RkaW4ub24gJ2Vycm9yJyAoZXJyKSAtPiBzdGRlcnIud3JpdGUgJ3N0ZGluIGVycm9yJyArIGVyciArICdcXG4nXG4gICAgICAgICAgICAgICAgY2hpbGQuc3RkZXJyLm9uICdkYXRhJyAoZGF0YSkgLT4gaWYgbm90IC9eZXhlY3ZwXFwoXFwpLy50ZXN0IGRhdGEgdGhlbiBzdGRlcnIud3JpdGUgZGF0YVxuICAgICAgICAgICAgICAgIGNoaWxkLnN0ZG91dC5waXBlIHN0ZG91dFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2hpbGQub24gJ2Vycm9yJyAoZXJyKSAtPlxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLnN0ZGVyci53cml0ZSAnRmFpbGVkIHRvIGV4ZWN1dGUgJyArIGVyciArICdcXG4nXG4gICAgICAgICAgICAgICAgICAgIGZpcnN0Q2hpbGQua2lsbCgpXG5cbiAgICAgICAgICAgIGN1cnJlbnRDb21tYW5kID0gc3BsaXRbMF1cbiAgICAgICAgICAgIGFyZ3MgPSBjdXJyZW50Q29tbWFuZC5zcGxpdCAnICdcbiAgICAgICAgICAgIGNtZCA9IGFyZ3Muc2hpZnQoKVxuICAgICAgICAgICAgb3B0ID0gZW5jb2Rpbmc6J3V0ZjgnIHNoZWxsOnRydWVcbiAgICAgICAgICAgIGZpcnN0Q2hpbGQgPSBwcmV2aW91c0NoaWxkID0gQGNoaWxkID0gY2hpbGRwLnNwYXduIGNtZCwgYXJncywgb3B0XG4gICAgICAgIFxuICAgICAgICAgICAgZm9yIGkgaW4gWzEuLi5zcGxpdC5sZW5ndGhdXG4gICAgICAgICAgICAgICAgY3VycmVudENvbW1hbmQgPSBzcGxpdFtpXS50cmltKClcbiAgICAgICAgICAgICAgICBhcmdzID0gY3VycmVudENvbW1hbmQuc3BsaXQgJyAnXG4gICAgICAgICAgICAgICAgY21kID0gYXJncy5zaGlmdCgpXG4gICAgICAgICAgICAgICAgQGNoaWxkID0gY2hpbGRwLnNwYXduIGNtZCwgYXJncywgb3B0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcGlwZSBwcmV2aW91c0NoaWxkLCBAY2hpbGQuc3RkaW4sIHByb2Nlc3Muc3RkZXJyXG4gICAgICAgIFxuICAgICAgICAgICAgICAgIHByZXZpb3VzQ2hpbGQgPSBAY2hpbGRcbiAgICAgICAgXG4gICAgICAgICAgICBAY2hpbGQuc3Rkb3V0Lm9uICdkYXRhJyBAb25TdGRPdXRcbiAgICAgICAgICAgIEBjaGlsZC5zdGRlcnIub24gJ2RhdGEnIEBvblN0ZEVyclxuICAgICAgICBcbiAgICAgICAgICAgIEBjaGlsZC5vbiAnY2xvc2UnIChjb2RlKSA9PlxuICAgICAgICAgICAgICAgIGZpcnN0Q2hpbGQua2lsbCgpXG4gICAgICAgICAgICAgICAgQG9uRXhpdCBjb2RlXG4gICAgICAgIGVsc2VcbiAgICAgICAgXG4gICAgICAgICAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgICAgICAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgICAgICAgICAjIDAwMDAwMDAgICAgIDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgXG4gICAgICAgICAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgXG4gICAgICAgICAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBjaGlsZCA9IGNoaWxkcC5leGVjIEBjbWQsIHNoZWxsOnRydWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGNoaWxkLnN0ZG91dC5vbiAnZGF0YScgIEBvblN0ZE91dFxuICAgICAgICAgICAgQGNoaWxkLnN0ZGVyci5vbiAnZGF0YScgIEBvblN0ZEVyclxuICAgICAgICAgICAgQGNoaWxkLm9uICAgICAgICAnY2xvc2UnIEBvbkV4aXRcbiAgICAgICAgICAgIFxuICAgICAgICB0cnVlXG4gICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgIFxuICAgIFxuICAgIGhhbmRsZUNhbmNlbDogLT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiAndW5oYW5kbGVkJyBpZiBub3QgQGNoaWxkXG4gICAgICAgIFxuICAgICAgICBwc1RyZWUgQGNoaWxkLnBpZCwgKGVyciwgY2hpbGRyZW4pID0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFyZ3MgPSBjaGlsZHJlbi5tYXAgKHApIC0+IHAuUElEXG4gICAgICAgICAgICBhcmdzLnVuc2hpZnQgQGNoaWxkLnBpZFxuICAgICAgICAgICAgYXJncy5yZXZlcnNlKClcbiAgICAgICAgICAgIEBjaGlsZC5raWxsKClcbiAgICAgICAgICAgIGZvciBhcmcgaW4gYXJnc1xuICAgICAgICAgICAgICAgIGtsb2cgYXJnLCB3eHcgJ3Rlcm1pbmF0ZScgYXJnXG4gICAgICAgIHRydWVcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgICAgIFxuICAgIG9uRXhpdDogKGNvZGUpID0+XG5cbiAgICAgICAga2lsbGVkID0gQGNoaWxkLmtpbGxlZFxuICAgICAgICAjIGtsb2cgJ29uRXhpdCcgQGNoaWxkLnBpZCwga2lsbGVkIGFuZCAna2lsbGVkJyBvciBjb2RlXG4gICAgICAgIGRlbGV0ZSBAY2hpbGRcbiAgICAgICAgaWYgY29kZSA9PSAwIG9yIGtpbGxlZCBvciBAZmFsbGJhY2soKVxuICAgICAgICAgICAgc2V0SW1tZWRpYXRlIEBvbkRvbmVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRlcm0uZmFpbE1ldGEgQGxhc3QubWV0YVxuICAgICAgICAgICAgaWYgbm90IC9pcyBub3QgcmVjb2duaXplZC8udGVzdCBAZXJyb3JUZXh0XG4gICAgICAgICAgICAgICAgQGVkaXRvci5hcHBlbmRPdXRwdXQgJ1xcbicrQGVycm9yVGV4dFxuICAgICAgICAgICAgQGRlcXVldWUgJ2ZhaWwnXG4gICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgZmFsbGJhY2s6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbGFzdC5mYWxsYmFja1xuICAgICAgICAgICAga2xvZyAnZmFsbGJhY2snIEBsYXN0LmZhbGxiYWNrXG4gICAgICAgICAgICBAZW5xdWV1ZSBjbWQ6QGxhc3QuZmFsbGJhY2ssIHVwZGF0ZTp0cnVlXG4gICAgICAgICAgICBkZWxldGUgQGxhc3QuZmFsbGJhY2tcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIFxuICAgICAgICBAY2hkaXIub25GYWxsYmFjayBAY21kXG4gICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBvbkRvbmU6IChsYXN0Q29kZSkgPT5cblxuICAgICAgICBpZiBsYXN0Q29kZSAhPSAnZmFpbCcgYW5kIEBsYXN0Lm1ldGE/XG4gICAgICAgICAgICBpbmZvID0gXy5jbG9uZSBAbGFzdFxuICAgICAgICAgICAgZGVsZXRlIGluZm8ubWV0YVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdjbWQnIGluZm8gIyBpbnNlcnQgaW50byBnbG9iYWwgaGlzdG9yeSBhbmQgYnJhaW5cbiAgICAgICAgICAgIEB0ZXJtLnN1Y2NNZXRhIEBsYXN0Lm1ldGFcbiAgICAgICAgaWYgZW1wdHkoQHF1ZXVlKSBhbmQgZW1wdHkoQGlucHV0UXVldWUpXG4gICAgICAgICAgICBAdGVybS5wd2QoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZGVxdWV1ZSgpXG4gICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgMDAgMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwIDAwMDAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMCAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgZW5xdWV1ZTogKGNtZDonJyBmcm9udDpmYWxzZSB1cGRhdGU6ZmFsc2UpIC0+IFxuICAgIFxuICAgICAgICBpZiB1cGRhdGVcbiAgICAgICAgICAgIEBsYXN0LmNtZCA9IGNtZFxuICAgICAgICAgICAgaWYgQGxhc3QubWV0YVxuICAgICAgICAgICAgICAgIEBlZGl0b3IucmVwbGFjZVRleHRJbkxpbmUgQGxhc3QubWV0YVswXSwgY21kXG4gICAgICAgICAgICAgICAgQGVkaXRvci5tZXRhLnVwZGF0ZSBAbGFzdC5tZXRhXG4gICAgICAgICAgICBcbiAgICAgICAgY21kID0gY21kLnJlcGxhY2UgL1xcfi9nLCBzbGFzaC5ob21lKClcbiAgICAgICAgXG4gICAgICAgIGlmIGZyb250XG4gICAgICAgICAgICBAcXVldWUudW5zaGlmdCBjbWRcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHF1ZXVlLnB1c2ggY21kXG4gICAgICAgIGNtZFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAwIDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgMDAwMDAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGRlcXVldWU6IChsYXN0Q29kZSkgPT5cbiBcbiAgICAgICAgaWYgQHF1ZXVlLmxlbmd0aFxuICAgICAgICAgICAgQGV4ZWN1dGVDbWQgQHF1ZXVlLnNoaWZ0KClcbiAgICAgICAgZWxzZSBpZiBAaW5wdXRRdWV1ZS5sZW5ndGhcbiAgICAgICAgICAgIGNtZCA9IEBpbnB1dFF1ZXVlLnNoaWZ0KClcbiAgICAgICAgICAgIEBlZGl0b3Iuc2V0SW5wdXRUZXh0IGNtZFxuICAgICAgICAgICAgQGV4ZWN1dGUgY21kXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBvbkRvbmUgbGFzdENvZGVcbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBvblN0ZE91dDogKGRhdGEpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgZGF0YS5yZXBsYWNlP1xuICAgICAgICAgICAgZGF0YSA9IGRhdGEudG9TdHJpbmcgJ3V0ZjgnXG4gICAgICAgIGlmIGRhdGFbLTFdID09ICdcXG4nXG4gICAgICAgICAgICBkYXRhID0gZGF0YVswLi5kYXRhLmxlbmd0aC0yXVxuICAgICAgICAgICAgXG4gICAgICAgIEBlZGl0b3IuYXBwZW5kT3V0cHV0IGRhdGFcbiAgICAgICAgQGVkaXRvci5zaW5nbGVDdXJzb3JBdEVuZCgpXG5cbiAgICBvblN0ZEVycjogKGRhdGEpID0+XG5cbiAgICAgICAgQGVycm9yVGV4dCArPSBkYXRhXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBTaGVsbFxuIl19
//# sourceURL=../coffee/shell.coffee