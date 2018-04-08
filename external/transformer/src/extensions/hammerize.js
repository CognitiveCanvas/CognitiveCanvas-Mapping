import Point from '../utils/point';
import TranslateTransform from '../transforms/translate-transform';
import RotateTransform from '../transforms/rotate-transform';
import ScaleTransform from '../transforms/scale-transform';
import TransformGroup from '../transforms/transform-group';

import { bind } from './bind';

import Hammer from 'hammerjs';

const hammerize = (obj, options) => {

    return new Promise((resolve, reject) => {

        const Hammer = window.Hammer;

        options = Object.assign({
            pan: true,
            rotate: true,
            pinch: true,
            callback: undefined,
            enabled: true, // boolean or function that returns boolean
            debug: false
        }, options);

        bind(obj, options.callback, options.debug).then((transformer) => {

            // // Alternatively, the transformer API binds the transformer object to the element.
            // const transformer = obj.transformer;

            const hammerManager = new Hammer.Manager(obj);

            // override destroy function to also destroy hammer manager
            const _destroy = transformer.destroy;
            transformer.destroy = function () {
                hammerManager.destroy();
                _destroy.call(this);
            };

            // Details on hammer.js can be found here: http://hammerjs.github.io
            hammerManager.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
            hammerManager.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(hammerManager.get('pan'));
            hammerManager.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([hammerManager.get('pan'), hammerManager.get('rotate')]);

            // Create custom render transform for element.
            // !!! Changing any of this code or re-order will effect rendering of element after manipulation.
            const renderTransform = new TransformGroup();
            const scaleTransform = obj.scaleTransform = new ScaleTransform();
            const rotateTransform = obj.rotateTransform = new RotateTransform();
            const translateTransform = obj.translateTransform = new TranslateTransform();
            renderTransform.add(scaleTransform);
            renderTransform.add(rotateTransform);
            renderTransform.add(translateTransform);
            obj.renderTransform = renderTransform;

            /**
             * Returns true if interactions should be allowed, otherwise false.
             */
            const isEnabled = () => {
                if (typeof options.enabled === 'function') {
                    return options.enabled.call(transformer);
                }
                return options.enabled;
            };

            /**
             * Check if event is a valid event.
             *
             * @param {any} event
             * @returns
             */
            const isValidEvent = (event) => {
                let parent = event.target;
                do {
                    if (parent.transformer) {
                        return parent === obj;
                    }
                }
                while ((parent = parent.parentElement) !== null);

                return false;
            };

            // Consume event, so it does not get further propagated.
            const consumeEvent = (event) => {
                event.srcEvent.stopPropagation();
            };

            // The center point, which is returned by hammer.js, is in screen coordinates. The following function
            // will transform these screen coordinates to canvas coordinates and with respect to an element's transform
            // and if necessary according to an element's transform hierarchy.
            const adjustCenterPoint = (point) => {
                let p = new Point(point.x, point.y);
                return obj.transformer.fromGlobalToLocal(p);
            };

            // Temporary variables.
            let prevPoint = {
                x: 0,
                y: 0
            };
            let prevScale = 1.0;
            let angleOffset = 0;
            let prevAngle = 0;

            hammerManager.on("hammer.input", (event) => {
                if (!isEnabled()) return;
                if (!isValidEvent(event)) return;
                consumeEvent(event);

                if (event.isFinal) {
                    transformer.complete();
                }
            });

            // pan handler
            hammerManager.on('panstart panmove', (event) => {
                if (!isEnabled()) return;

                if (!options.pan) return;

                if (event.type === "panstart") {
                    prevPoint.x = 0;
                    prevPoint.y = 0;
                    return;
                }

                let deltaPoint = new Point(event.deltaX, event.deltaY);
                deltaPoint = transformer.fromGlobalToLocalDelta(deltaPoint);

                const newX = (translateTransform.x - prevPoint.x) + deltaPoint.x;
                const newY = (translateTransform.y - prevPoint.y) + deltaPoint.y;

                translateTransform.set(newX, newY);
                transformer.reapplyTransforms();

                // update previous point for next panmove
                prevPoint.x = deltaPoint.x;
                prevPoint.y = deltaPoint.y;
            });

            // rotate handler
            hammerManager.on("rotatestart rotatemove", (event) => {
                if (!isEnabled()) return;

                if (!options.rotate) return;

                if (event.type === "rotatestart") {
                    angleOffset = event.rotation;
                    prevAngle = 0;

                    let centerPoint = adjustCenterPoint(event.center);
                    rotateTransform.centerPoint.x = centerPoint.x;
                    rotateTransform.centerPoint.y = centerPoint.y;

                    return;
                }

                // correct angle offset
                event.rotation -= angleOffset;

                const deltaAngle = (rotateTransform.angle - prevAngle) + event.rotation;

                prevAngle = event.rotation;

                rotateTransform.set(deltaAngle);
                transformer.reapplyTransforms();
            });

            // scale handler
            hammerManager.on("pinchstart pinchmove", (event) => {
                if (!isEnabled()) return;

                if (!options.pinch) return;

                if (event.type === "pinchstart") {
                    prevScale = event.scale;

                    let centerPoint = adjustCenterPoint(event.center);
                    scaleTransform.centerPoint.x = centerPoint.x;
                    scaleTransform.centerPoint.y = centerPoint.y;

                    return;
                }

                const scaleX = (scaleTransform.x / prevScale) * event.scale;
                const scaleY = (scaleTransform.y / prevScale) * event.scale;

                prevScale = event.scale;

                scaleTransform.set(scaleX, scaleY);
                transformer.reapplyTransforms();
            });

            let mouseWheelManipulated = false;

            // This is a workaround to complete last transform started by a mousewheel interaction.
            obj.addEventListener("mousemove", () => {

                if (mouseWheelManipulated) {
                    transformer.complete();
                    mouseWheelManipulated = false;
                }
            });

            // Also allow object manipulation using mousewheel interaction. Hold down the ctrl key to
            // scale an element and hold down the alt/option key to rotate an element.
            obj.addEventListener("mousewheel", (event) => {
                if (!isEnabled()) return;

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                mouseWheelManipulated = true;

                // Normalize wheel to +1 or -1.
                const wheel = event.wheelDelta / 120;

                // Manipulation factor.
                const manipulationFactor = Math.exp(wheel * 0.02);

                // Adjust translate transform to fit zoom point.
                let centerPoint = {
                    x: event.clientX,
                    y: event.clientY
                };
                centerPoint = adjustCenterPoint(centerPoint);

                if (event.ctrlKey) {
                    if (!options.rotate) return;

                    const deltaAngle = -(manipulationFactor - 1) * 50;
                    const angle = (rotateTransform.angle - deltaAngle) % 360;

                    rotateTransform.set(angle);
                    rotateTransform.centerPoint.x = centerPoint.x;
                    rotateTransform.centerPoint.y = centerPoint.y;
                    transformer.reapplyTransforms();

                    return;
                }

                if (!options.pinch) return;

                const newScale = scaleTransform.x * manipulationFactor;

                scaleTransform.set(newScale, newScale);
                scaleTransform.centerPoint.x = centerPoint.x;
                scaleTransform.centerPoint.y = centerPoint.y;
                transformer.reapplyTransforms();
            }, false);

            // return modified transformer
            resolve(transformer);
        });
    });
};

export { hammerize };