/* Handling Messages that have been post on the Webstrate */
window.onmessage = function(e) {
  
//  console.log("Handling Message");
  
  if (e.data.id == "search") {
    console.log("Message Type: Search");
    sendRelatedEleToContainer(e.data.query);
  } 
  else if (e.data.id == "trace") {
    console.log("Message Type: Trace");
    traceElementForContainer(e.data.query)   
  } 
  else if (e.data.id == "edited") {
    console.log("Message Type: Edited");
    markElementAsNoteEdited(e.data.query)
  }
  else if (e.data.id == "reload_note_list") {
    console.log("Message Type: Reload Note List!");
    getElementsWithEditedNote()
  }
  else {
    // 400: Message does not have id in Header
    //console.log("400: Message type is not recognized")
    //console.log(e.data)
  }
  
}

// Dummy promise for sending 
var promise1 = new Promise(function(resolve, reject) {
  setTimeout(resolve, 10000, 'foo');
});

promise1.then(function(value) {
  console.log("Sending edited elements to container!");
  getElementsWithEditedNote()
});


// Message Passing to the Container Code. Package include the id & label
function sendSearchMsgToContainer() {
  if (window.parent) {
    //console.log(window.parent);
    let selected = d3.select(".selected");
    if (!selected.empty()) {
      let nodeID = selected.attr("id");
      let labelText = labelFinder(nodeID);
      let package = {
        id: "selected_element",
        uid: nodeID,
        label: labelText
      };
      window.parent.postMessage(package, "*");
    }
  }
}

// Related Node/Edge Passing to the Container.
function sendRelatedEleToContainer(label) {
  let nodeList = getAllObjects(["node"]).filter(function(node) {
    return node.label.indexOf(label) > -1;
  });
  // TODO: change below to getAllEdgeObjects
  let edgeList = getAllObjects(["link"]).filter(function(link) {
    return link.label.indexOf(label) > -1;
  });
  
  let status;
  if (nodeList.length == 0 && edgeList.length == 0) {
    status = 204
  } else {
    status = 200
  }
  
  let relatedEle = {
    id: "related_element",
    response_status: status,
    query: label,
    nodes: nodeList,
    edges: edgeList
  }
  
  if (window.parent) {
    window.parent.postMessage(relatedEle, "*")
  }
}

// Trace the related elements based on label received from container
function traceElementForContainer(id) {
  let tracee = document.getElementById(id)
  if (tracee) {
    centerViewOnElement(tracee);
    selectNode(tracee, true);
  } 
  else
  {
    console.log("204: Cannot find the element to trace")
  }   
}

// Mark elements' note as edited based on label received from container
function markElementAsNoteEdited(id) {
  let editee = document.getElementById(id)
  editee.setAttribute("note_edited", true)
}

// Send all the elements that has notes that are edited to container to load
function getElementsWithEditedNote() {
  let elementList = getAllObjects(["node", "link"]);
  //console.log(elementList)
  let editedElementList = elementList.filter(function(element) {
    return element.note == "true";
  });
  //console.log(editedElementList)
  
  let package = {
    id: "edited_elements",
    elements: editedElementList
  } 

  if (window.parent) {
    window.parent.postMessage(package, "*")
  }
}


// Helper Function to use The id of the Element to find its label
/**
* Applied to both node labels and node inputs
**/
function labelFinder(nodeID) {
  let labelElement = document.getElementById(nodeID+"_text");
  let labelText;
  if (labelElement) {
    if (labelElement.getElementsByTagName("tspan")[0]) {
      labelText = labelElement.getElementsByTagName("tspan")[0].innerHTML;
      //console.log("In View Mode, get label: " + labelText);
    } else {
      labelText = labelElement.innerHTML;
      //console.log("In Edit Mode, get label: " + labelText);
    }
    return labelText;
  }
  else {
    console.log("label NOT FOUND")
    return "";
  }
}