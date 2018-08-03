/* Handling Messages that have been post on the Webstrate */
window.onmessage = function(e) {
  
  //console.log("Handling Message");
  
  if (e.data.id == "search") {
    console.log("Message Type: Search");
    sendRelatedEleToContainer(e.data.query);
  } 
  else if (e.data.id == "trace") {
    console.log("Message Type: Trace");
    let tracee = document.getElementById(e.data.query)
    if (tracee) {
      centerViewOnElement(tracee);
      selectNode(tracee, true);
    } 
    else
    {
      console.log("204: Cannot find the element to trace")
    }
      
  } 
  else {
    // 400: Message does not have id in Header
    //console.log("400: Message type is not recognized")
    //console.log(e.data)
  }
  
}

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
  let nodeList = getAllNodeObjects().filter(function(node) {
    return node.label.indexOf(label) > -1;
  });
  // TODO: change below to getAllEdgeObjects
  let edgeList = getAllNodeObjects().filter(function(link) {
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

// Use The id of the Element to find the label of the element!
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