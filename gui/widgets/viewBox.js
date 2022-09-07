/**
 */


/**
 */
$(class $ViewBoxWidget extends Cls$Widget {
    constructor(...views) {
        super('div', 'FMWK-viewbox-widget');
        this._views = [];
        views.forEach(view => this.push(view));
    }
  
    pop() {
        if (this._views.length) {
            let oldView = this._views.pop();
            let newView = this.view();
  
            if (newView) {
                oldView.replace(newView);
            }
        }
  
        return this;
    }
  
    push(arg) {
        if (arg instanceof Cls$ViewWidget) {
            let view = this.view();
            this._views.push(arg);
  
            if (view) {
                view.replace(arg);
            }
            else {
                this.append(arg);
            }
        }
  
        return this;
    }
  
    view() {
        if (this._views.length) {
            return this._views[this._views.length - 1];
        }
        else {
            return null;
        }
    }
});
