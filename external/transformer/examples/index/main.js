import '../assets/style.css';
import './style.css';

const makeInteractive = (obj) => {

    // Bind a transformer instance to the canvas element. It will return a Promise, which
    // resolves with the transformer instance when successful. The transformer instance
    // has transformOrigin, translateTransform, rotateTransform, and scaleTransform properties
    // After changing any of the transforms, it requires to call reapplyTransforms.
    /**
     * Bind element to transformer API. Once the binding is complete, then create a hammer manager to receive
     * pan, rotate, and scale events. The transformer then manipulates the elements CSS transform style after
     * applying individual transform.
     */
    Transformer.bind(obj).then((transformer) => {

        // // Alternatively, the transformer API binds the transformer object to the element.
        // const transformer = obj.transformer;

        const hammerManager = new Hammer.Manager(obj);

        // Details on hammer.js can be found here: http://hammerjs.github.io
        hammerManager.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
        hammerManager.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(hammerManager.get('pan'));
        hammerManager.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([hammerManager.get('pan'), hammerManager.get('rotate')]);

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

        // The center point, which is returned by hammer.js, is in screen coordinates. The following function
        // will transform these screen coordinates to canvas coordinates and with respect to an element's transform
        // and if necessary according to an element's transform hierarchy.
        const adjustCenterPoint = point => {
            let p = new Transformer.Point(point.x, point.y);
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

        // Register pan handler.
        hammerManager.on('panstart panmove panend', event => {
            if (event.type === "panstart") {

                if (event.maxPointers === 1) {
                    prevPoint = {
                        x: 0,
                        y: 0
                    };
                }
                return;
            }

            // if (event.type.indexOf("end") > -1) {
            if (event.type === "panend" && event.isFinal) {
                prevPoint = {
                    x: 0,
                    y: 0
                };
                transformer.complete();
                return;
            }

            let deltaPoint = new Transformer.Point(event.deltaX, event.deltaY);
            deltaPoint = transformer.fromGlobalToLocalDelta(deltaPoint);

            const newX = (translateTransform.x - prevPoint.x) + deltaPoint.x;
            const newY = (translateTransform.y - prevPoint.y) + deltaPoint.y;

            translateTransform.set(newX, newY);
            transformer.reapplyTransforms();

            prevPoint = {
                x: deltaPoint.x,
                y: deltaPoint.y
            };
        });

        // Register rotate handler.
        hammerManager.on("rotatestart rotatemove", event => {
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

        // Register scale handler.
        hammerManager.on("pinchstart pinchmove", event => {
            if (event.type === "pinchstart") {
                prevScale = event.scale;

                let centerPoint = adjustCenterPoint(event.center);
                scaleTransform.centerPoint.x = centerPoint.x;
                scaleTransform.centerPoint.y = centerPoint.y;

                return;
            }

            const oldScale = scaleTransform.x;
            const scaleX = (scaleTransform.x / prevScale) * event.scale;
            const scaleY = (scaleTransform.y / prevScale) * event.scale;

            prevScale = event.scale;

            scaleTransform.set(scaleX, scaleY);
            transformer.reapplyTransforms();
        });

        let mouseWheelManipulated = false;

        // This is a workaround to complete last transform started by a mousewheel interaction.
        obj.addEventListener("mousemove", event => {

            if (mouseWheelManipulated) {
                transformer.complete();
                mouseWheelManipulated = false;
            }
        });

        // Also allow object manipulation using mousewheel interaction. Hold down the ctrl key to
        // scale an element and hold down the alt/option key to rotate an element.
        obj.addEventListener("mousewheel", event => {

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
};

document.addEventListener("DOMContentLoaded", function (event) {
    console.log("DOM fully loaded and parsed");

    // get all objects in the document
    const objects = document.querySelectorAll(".object");

    // make all objects interactive
    Array.prototype.forEach.call(objects, makeInteractive);
});