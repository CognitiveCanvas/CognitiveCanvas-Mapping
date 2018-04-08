import '../assets/style.css';
import './style.css';

document.addEventListener("DOMContentLoaded", function (event) {

    // get all objects in the document
    const objects = document.querySelectorAll(".object");

    // make all objects interactive
    Array.prototype.forEach.call(objects, (obj) => {
        Transformer.hammerize(obj, {
            debug: true
        }).then((transformer) => {
            console.log('transformer for', transformer, obj);
        });
    });
});