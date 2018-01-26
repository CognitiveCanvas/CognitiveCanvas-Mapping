/*
 * This function is used to initialize customize
 * HTML element.
 *
 * - parentNode: tag name of the parent node this
 *               new element should be append to
 * - elementName: tag name of the new element 
 * - checkExisting: true if we need to check whether it has an 
 *                  element with same tag in the dom already
 */
function initHTMLElement(parentNode, tagName, checkExisting) {
  let element = checkExisting
                  ? document.getElementsByTagName(tagName)[0]
                  : document.createElement(tagName);   

  if (checkExisting) {
    if (element) {
      return element; 
    }
    else {
      element = document.createElement(tagName); 
    }
  }

  document.getElementsByTagName(parentNode)[0]
          .appendChild(element);

  return element;
}

/*
 * Initialize data element which holds all data
 */
function initDataElement() {
  initHTMLElement("body", DATA_COLLECTION, true)
}

/*
 * This function is used to set attribute of a particular 
 * element in the DOM.
 *
 * - element: html element that attribute going to change
 * - attr: attribute name of element
 * - data: the data want to change for the attr
 * - variable: local variable need to update the value, leave NULL 
 *             if no variable need to be updated
 */
function setElementAttribute(element, attr, data) {
  if (!element) 
    console.error("element does not exist when set attribute: " + attr);
  element.setAttribute(attr, data);
}