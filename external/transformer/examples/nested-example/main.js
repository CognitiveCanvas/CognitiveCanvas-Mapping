import '../assets/style.css';
import './style.css';

document.addEventListener("DOMContentLoaded", function (event) {
    console.log("DOM fully loaded and parsed");

    // get all objects in the document
    const objects = document.querySelectorAll(".object");

    // make all objects interactive
    Array.prototype.forEach.call(objects, (obj) => {
        Transformer.hammerize(obj, {
            // pinch: false
            debug: true
        });
    });
});