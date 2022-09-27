/**
 */


/**
 */
$(class $Widget extends Cls$DocElement {
    constructor(tagName, styleClassName, ...elements) {
        super(tagName);
        this.appendClass('FMWK-widget');
        this.appendClass(styleClassName);
        this._node.$widget = this;
        elements.forEach(element => this.append(element));
    }
});
