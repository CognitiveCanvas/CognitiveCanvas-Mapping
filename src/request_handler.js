import {nodeToObject} from './nodes.js';
import {linkToObject} from './links.js';
import {groupToObject} from './selections.js';

/* Handling Messages that have been post on the Webstrate */
window.onmessage = function(e) {
  
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
    console.log("Message Type: Reload Note List");
    getElementsWithEditedNote()
  }
  else if (e.data.id == "undo") {
    console.log("Message Type: Undo");
    undo()
    getElementsWithEditedNote()
  }
  else if (e.data.id == "redo") {
    console.log("Message Type: Redo");
    redo()
    getElementsWithEditedNote()
  }
  else {
    if (e.data.id) {
      // 400: Message has an id that cannot be recognized
      console.log("400: Message type is not recognized: ", e.data.id)
    }
  }
  
}


// Message Passing to the Container Code. data_package include the id & label
export function sendSearchMsgToContainer() {
  if (window.parent) {
    //console.log(window.parent);
    let selected = d3.select(".selected");
    if (!selected.empty()) {
      let nodeID = selected.attr("id");
      let labelText = labelFinder(nodeID);
      let data_package = {
        id: "selected_element",
        uid: nodeID,
        label: labelText
      };
      window.parent.postMessage(data_package, "*");
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

/**
 * [getAllNodeObjects description]
 * @param [String] - an array of strings containing the map elements to collect
 *                   Example: ["node", "link", "group"]
 * @return [Object] Objects representing all the selected map elements
 */
export function getAllObjects(types=["node", "link", "group"]){
  var allNodes = []
  document.querySelectorAll("."+types.join(",.") ).forEach( (node)=>{
    if (node.classList.contains("node")){
      allNodes.push(nodeToObject(node));
    }
    else if (node.classList.contains("link")){
      allNodes.push(linkToObject(node));
    }
    else if (node.classList.contains("group")){
      allNodes.push(groupToObject(node));
    }
  });
  return allNodes;
}

// Mark elements' note as edited based on label received from container
function markElementAsNoteEdited(id) {
  let editee = document.getElementById(id)
  editee.setAttribute("note_edited", true)
  getElementsWithEditedNote()
}

// Send all the elements that has notes that are edited to container to load
export function getElementsWithEditedNote() {
  let elementList = getAllObjects(["node", "link"]);
  let editedElementList = elementList.filter(function(element) {
    return element.note == "true" && element.deleted == false;
  });
  
  let data_package = {
    id: "edited_elements",
    elements: editedElementList
  } 
  
  //console.log("edited_elements", data_package)

  if (window.parent) {
    window.parent.postMessage(data_package, "*")
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
    } else {
      labelText = labelElement.innerHTML;
    }
    return labelText;
  }
  else {
    console.log("label NOT FOUND")
    return "";
  }
}