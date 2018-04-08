import Point from './utils/point';
import Matrix from './utils/matrix';
import TranslateTransform from './transforms/translate-transform';
import RotateTransform from './transforms/rotate-transform';
import ScaleTransform from './transforms/scale-transform';
import TransformGroup from './transforms/transform-group';

/**
 * The transform stack builds the base object responsible for transforming a DOM element. It takes an
 * element as constructor parameter and binds itself to this element. The transform stack allows push
 * and pop of transforms. A transform is immediately applied on the element and poping will immediately
 * unapply the transform from the element.
 * 
 * @class Transformer
 */
export default class Transformer {

    /**
     * @private
     * @const {string}
     */
    static get version() {
        return '{{PKG_VERSION}}';
    };

    /**
     * Creates an instance of Transformer. It takes a DOM element as contstructor parameter to which
     * this transform stack will bind itself. The transform stack will receive the elements current 
     * transform as matrix, which will be used to apply transforms.
     * 
     * @param {any} element A DOM element to which transforms will be applied. 
     * 
     * @memberOf Transformer
     */
    constructor(element, callback, debug = false) {

        // Element needs to be in DOM to get its clientWidth and clientHeight.
        if (!element.parentElement) {
            throw new Error(`Element has no parent element. Is the element in the DOM?`);
        }

        // Check if callback is set and if it is a function.
        if (callback && typeof callback !== "function") {
            throw new Error(`callback needs to be a function`);
        }

        this.element = element;
        this.element.transformer = this;
        this.callback = callback;
        this.updateInProgress = false;

        let matrix = this.getTransformMatrix();

        this._scaleTransform = ScaleTransform.from(matrix);
        this._rotateTransform = RotateTransform.from(matrix);
        this._translateTransform = TranslateTransform.from(matrix);

        const transformGroup = new TransformGroup();
        transformGroup.add(this._rotateTransform);
        transformGroup.add(this._scaleTransform);
        transformGroup.add(this._translateTransform);

        this._transforms = transformGroup;

        if (debug) {

            let visualTransformOrigin = this.element.querySelector(':scope > .transform-origin-point');

            if (!visualTransformOrigin) {
                // Create visual transform origin
                visualTransformOrigin = document.createElement("transient");
                visualTransformOrigin.setAttribute("class", "transform-origin-point");

                // append debug element as first child of element
                element.insertBefore(visualTransformOrigin, element.firstElementChild);
            }
        }
    }

    /**
     * Get transform matrix from element transform.
     * 
     * @returns Element transform matrix.
     * 
     * @memberOf Transformer
     */
    getTransformMatrix() {
        return Matrix.from(this.element);
    }

    /**
     * Refresh transfroms from element transform.
     * 
     * @memberOf Transformer
     */
    refreshTransforms() {
        const matrix = this.getTransformMatrix();
        this._translateTransform.update(matrix);
        this._rotateTransform.update(matrix);
        this._scaleTransform.update(matrix);
    }

    /**
     * Reapplies all transforms again. This function should be used when any of the transforms in the transform
     * chain changed.
     * 
     * @memberOf TransformStack
     */
    reapplyTransforms(updateElementsTransform = true) {
        let matrix = Matrix.identity(3);

        if (this.element.renderTransform) {
            this.element.renderTransform.apply(matrix);
        }
        this._transforms.apply(matrix);

        this.elementMatrix = matrix;

        if (updateElementsTransform) {
            // Update element transform.
            return this.updateElement();
        } else {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }
    }

    /**
     * Merge render transform to main transform and reset
     * render transform on success.
     * 
     * @memberOf Transformer
     */
    complete() {
        if (this.element.renderTransform) {
            this.refreshTransforms();
            this.element.renderTransform.reset();
        }
    }

    /**
     * Updates the element's transform matrix.
     * 
     * @returns A promise resolved when element updated successfully.
     * 
     * @memberOf TransformStack
     */
    updateElement() {

        return new Promise((resolve, reject) => {

            if (this.updateInProgress) {
                // reject(`update already in progress`);
                // resolve(this.elementMatrix);
                return;
            }

            window.requestAnimationFrame(() => {

                const updateElementTransform = () => {
                    let elementTransform = this.elementMatrix.toCss();
                    this.setCssTransform(elementTransform);
                };

                if (typeof this.callback === 'function') {
                    if (this.callback.call(this, this.elementMatrix)) {
                        updateElementTransform();
                    }
                } else {
                    updateElementTransform();
                }

                this.updateInProgress = false;

                resolve(this.elementMatrix);
            });

            this.updateInProgress = true;
        });
    }

    /**
     * Sets the element's transform also compensating for various vendor prefixes.
     * 
     * @param {any} cssTansform The CSS transform.
     * 
     * @memberOf TransformStack
     */
    setCssTransform(cssTransform) {

        // Make sure the element is positioned absolute and its origin is at point (0, 0, 0).
        this.element.style.position = "absolute";
        this.element.style.transformOrigin = "0 0 0";

        if (this.element instanceof SVGElement) {
            cssTransform === "none" ? this.element.removeAttribute("transform") : this.element.setAttribute("transform", cssTransform);
        } else if (this.element.nodeType === 1) {
            this.element.style.webkitTransform = cssTransform;
            this.element.style.mozTransform = cssTransform;
            this.element.style.msTransform = cssTransform;
            this.element.style.oTransform = cssTransform;
            this.element.style.transform = cssTransform;
        }
    }

    /**
     * tbd.
     * 
     * @returns
     * 
     * @memberOf Transformer
     */
    getTransformHierarchy() {
        const allTransformers = [];

        // Also collect transforms of parents.
        let parent = this.element;
        do {
            if (parent.transformer) {
                allTransformers.push({
                    transformer: parent.transformer,
                    renderTransform: parent.renderTransform
                });
            }
        }
        while ((parent = parent.parentElement) !== null);

        // Reverse transform order to start with root transform.
        allTransformers.reverse();

        return allTransformers;
    }

    /**
     * tbd.
     * 
     * @returns
     *
     * @memberOf Transformer
     */
    getAncesterElementWithoutTransformer() {
        let parent = this.element;
        do {
            if (!parent.transformer) {
                return parent;
            }
        }
        while ((parent = parent.parentElement) !== null);

        return window.document.body;
    }

    /**
     * tbd.
     * 
     * @param {any} m
     * 
     * @memberOf Transformer
     */
    applyToLocalTransform(m, type = null) {
        this._transforms.apply(m, type);

        if (this.element.renderTransform) {
            this.element.renderTransform.apply(m, type);
        }
    }

    /**
     * tbd.
     * 
     * @param {any} m
     * 
     * @memberOf Transformer
     */
    applyToGlobalTransform(m, type = null) {
        const allTransformers = this.getTransformHierarchy();

        allTransformers.forEach(({
          transformer,
            renderTransform
        }) => {

            // Undo main transforms.
            if (transformer) {
                transformer._transforms.unapply(m, type);
            }

            // Undo render transforms.
            if (renderTransform) {
                renderTransform.unapply(m, type);
            }
        });
    }

    /**
     * tbd.
     * 
     * @param {any} m
     * 
     * @memberOf Transformer
     */
    unapplyFromGlobalTransform(m, type = null) {
        const allTransformers = this.getTransformHierarchy();

        allTransformers.forEach(({
          transformer,
            renderTransform
        }) => {

            // Apply render transforms.
            if (renderTransform) {
                renderTransform.apply(m, type);
            }

            // Apply main transforms.
            if (transformer) {
                transformer._transforms.apply(m, type);
            }
        });
    }

    /**
     * Converts a point from global coordinates to local coordinates.
     * 
     * @param {Point} point The point with global x- and y-coordinates.
     * @returns The point with local x- and y-coordinates.
     * 
     * @memberOf TransformStack
     */
    fromGlobalToLocal(point) {

        if (!(point instanceof Point)) {
            throw new Error(`point needs to be of instance ${Point.name}`);
        }

        // adjust x and y according to ancestor element offset
        let ancestor = this.getAncesterElementWithoutTransformer();
        let {
          left,
            top
        } = ancestor.getBoundingClientRect();
        let x = left ? point.x - left : point.x;
        let y = top ? point.y - top : point.y;

        let m = Matrix.identity(3);
        m.translate(x, y);

        this.applyToGlobalTransform(m);

        return new Point(m.tx, m.ty);
    }

    /**
     * Converts a point from local coordinates to global coordinates.
     * 
     * @param {any} point The point with local x- and y-coordinates.
     * @returns The point with global x- and y-coordinates.
     * 
     * @memberOf TransformStack
     */
    fromLocalToGlobal(point) {

        if (!(point instanceof Point)) {
            throw new Error(`point needs to be of instance ${Point.name}`);
        }

        let m = Matrix.identity(3);
        m.translate(point.x, point.y);

        this.unapplyFromGlobalTransform(m);

        // adjust x and y according to ancestor element offset
        let ancestor = this.getAncesterElementWithoutTransformer();
        let {
          left,
            top
        } = ancestor.getBoundingClientRect();
        let x = left ? m.tx + left : m.tx;
        let y = top ? m.ty + top : m.ty;

        return new Point(x, y);
    }

    /**
     * Converts a delta point from global coordinates to local coordinates.
     * 
     * @param {any} point The delta point with global x- and y-coordinates.
     * @returns The delta point with local x- and y-coordinates.
     * 
     * @memberOf TransformStack
     * 
     * @see TransformStack#fromGlobalToLocal
     */
    fromGlobalToLocalDelta(deltaPoint) {

        if (!(deltaPoint instanceof Point)) {
            throw new Error(`delta point needs to be of instance ${Point.name}`);
        }

        const allTransforms = this.getTransformHierarchy();

        let m = Matrix.identity(3);
        m.translate(deltaPoint.x, deltaPoint.y);

        allTransforms.forEach(({
          transformer,
            renderTransform
        }) => {

            // Undo main transforms.
            if (transformer) {
                transformer._transforms.unapply(m, ScaleTransform);
                transformer._transforms.unapply(m, RotateTransform);
            }
        });

        return new Point(m.tx, m.ty);
    }

    /**
     * tbd.
     * 
     * @readonly
     * 
     * @memberOf Transformer
     */
    get localRotation() {
        let m = Matrix.identity(3);
        this.applyToLocalTransform(m, RotateTransform);
        return m.angle;
    }

    /**
     * tbd.
     * 
     * @readonly
     * 
     * @memberOf Transformer
     */
    get globalRotation() {
        let m = Matrix.identity(3);
        this.applyToGlobalTransform(m, RotateTransform);
        return m.angle;
    }

    /**
     * tbd.
     * 
     * @readonly
     * 
     * @memberOf Transformer
     */
    get localScale() {
        let m = Matrix.identity(3);
        this.applyToLocalTransform(m, ScaleTransform);
        return new Point(m.scaleX, m.scaleY);
    }

    /**
     * tbd.
     * 
     * @readonly
     * 
     * @memberOf Transformer
     */
    get globalScale() {
        let m = Matrix.identity(3);
        this.applyToGlobalTransform(m, ScaleTransform);
        return new Point(m.scaleX, m.scaleY);
    }

    /**
     * tbd.
     * 
     * @readonly
     * 
     * @memberOf Transformer
     */
    get globalScaleTest() {
        let m = Matrix.identity(3);
        m.scale(1, 1);

        const allTransformers = [];

        // Also collect transforms of parents.
        let parent = this.element;
        do {
            if (parent.transformer) {
                allTransformers.push({
                    transformer: parent.transformer,
                    renderTransform: parent.renderTransform
                });
            }
        }
        while ((parent = parent.parentElement) !== null);

        // Apply all transforms in reverse order.
        allTransformers.reverse().forEach(({
          transformer,
            renderTransform
        }) => {

            // Undo main transforms.
            if (transformer) {
                transformer._transforms.apply(m, ScaleTransform);
            }

            // Undo render transforms.
            if (renderTransform) {
                renderTransform.apply(m, ScaleTransform);
            }
        });

        const scaleX = m.a;
        const scaleY = m.d;

        return new Point(scaleX, scaleY);
    }

    /**
     * tbd.
     * 
     * @memberOf Transformer
     */
    destroy() {
        delete this._scaleTransform;
        delete this._rotateTransform;
        delete this._translateTransform;
        delete this._transforms;
    }
}