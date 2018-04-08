import Transformer from '../transformer';

const bind = (element, callback, debug) => {

    // check for Promise support
    if (!("Promise" in window)) {
        throw new Error(`transformer.js requires Promise`);
    }

    return new Promise((resolve, reject) => {

        // return immediately if element already has transformer object
        if (element.transformer) {
            return resolve(element.transformer);
        }

        // create transformer in next tick to make sure that all styles have been applied to
        // the receiving element, e.g., wait till width and height of the element are set
        // correctly
        setTimeout(() => {
            const transformer = new Transformer(element, callback, debug);

            transformer.reapplyTransforms().then(() => {
                resolve(transformer);
            });
        }, 0);
    });
};

export { bind };