import '../assets/style.css';
import './style.css';

document.addEventListener("DOMContentLoaded", function (event) {

    // get all objects in the document
    const objects = document.querySelectorAll(".object");

    // make all objects interactive
    Array.prototype.forEach.call(objects, (obj) => {
        Transformer.bind(obj, null, true).then((transformer) => {

            // Create custom render transform for element.
            // !!! Changing any of this code or re-order will effect rendering of element after manipulation.
            const renderTransform = new Transformer.TransformGroup();
            const scaleTransform = obj.scaleTransform = new Transformer.ScaleTransform();
            const rotateTransform = obj.rotateTransform = new Transformer.RotateTransform();
            const translateTransform = obj.translateTransform = new Transformer.TranslateTransform();
            renderTransform.add(scaleTransform);
            renderTransform.add(rotateTransform);
            renderTransform.add(translateTransform);
            obj.renderTransform = renderTransform;

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

            // The center point, which is returned by hammer.js, is in screen coordinates. The following function
            // will transform these screen coordinates to canvas coordinates and with respect to an element's transform
            // and if necessary according to an element's transform hierarchy.
            const adjustCenterPoint = (point) => {
                let p = new Transformer.Point(point.x, point.y);
                return obj.transformer.fromGlobalToLocal(p);
            };

            // Temporary variables
            let mouseDown = false;
            let mouseWheelManipulated = false;
            let mousePoint = {
                x: 0,
                y: 0
            };

            let prevPoint = {
                x: 0,
                y: 0
            };
            let prevScale = 1.0;
            let angleOffset = 0;
            let prevAngle = 0;

            obj.addEventListener("mousedown", (event) => {
                if (!isValidEvent(event)) return;
                event.stopPropagation();

                prevPoint.x = 0;
                prevPoint.y = 0;
                mousePoint.x = event.clientX;
                mousePoint.y = event.clientY;

                // allow for dragging object
                mouseDown = true;
            });

            // This is a workaround to complete last transform started by a mousewheel interaction.
            obj.addEventListener("mousemove", (event) => {
                event.stopPropagation();

                if (mouseDown) {
                    let deltaX = event.clientX - mousePoint.x;
                    let deltaY = event.clientY - mousePoint.y;

                    let deltaPoint = new Transformer.Point(deltaX, deltaY);
                    deltaPoint = transformer.fromGlobalToLocalDelta(deltaPoint);

                    const newX = (translateTransform.x - prevPoint.x) + deltaPoint.x;
                    const newY = (translateTransform.y - prevPoint.y) + deltaPoint.y;

                    translateTransform.set(newX, newY);
                    transformer.reapplyTransforms();

                    // update previous point for next panmove
                    prevPoint.x = deltaPoint.x;
                    prevPoint.y = deltaPoint.y;
                }

                if (!mouseDown && mouseWheelManipulated) {
                    transformer.complete();
                    mouseWheelManipulated = false;
                }
            });

            window.addEventListener("mouseup", (event) => {
                if (!isValidEvent(event)) return;
                event.stopPropagation();

                if (event.isFinal) {
                    transformer.complete();
                }

                mouseDown = false;
            }, true);

            // Also allow object manipulation using mousewheel interaction. Hold down the ctrl key to
            // scale an element and hold down the alt/option key to rotate an element.
            obj.addEventListener("mousewheel", (event) => {
                event.preventDefault();
                event.stopPropagation();

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
                    const deltaAngle = -(manipulationFactor - 1) * 50;
                    const angle = (rotateTransform.angle - deltaAngle) % 360;

                    rotateTransform.set(angle);
                    rotateTransform.centerPoint.x = centerPoint.x;
                    rotateTransform.centerPoint.y = centerPoint.y;
                    transformer.reapplyTransforms();
                    return;
                }

                const newScale = scaleTransform.x * manipulationFactor;

                scaleTransform.set(newScale, newScale);
                scaleTransform.centerPoint.x = centerPoint.x;
                scaleTransform.centerPoint.y = centerPoint.y;
                transformer.reapplyTransforms();
            }, false);
        });
    });
});