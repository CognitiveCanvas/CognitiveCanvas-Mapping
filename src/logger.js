var temp_buffer = [];
var prev_position = {};
var prev_label = "";

function log(level, content){
	var current_log = {
		"level": level, 
		"content": content,
		"timestamp": new Date().toUTCString()
	}
	// console.log(current_log);
	temp_buffer.push(current_log);
}

function postLogs(){
	if (temp_buffer.length > 0){
		$.ajax({
			contentType: "application/json",
			data: JSON.stringify(temp_buffer), 
			dataType: "json", 
			success: (data)=>{console.log(data)}, 
			error: ()=>{console.log("error")}, 
			processData: false, 
			type: "POST", 
			url: "http://169.228.188.233:8081/api/log"
		})
		temp_buffer = []
	}
}

/*
 * Logs changes for each node when color is changed
 */
function logColorChanges(type, color){
  let selectedNodes = document.querySelectorAll(".node.selected");
  // let selectedNodeShapes = document.querySelectorAll(".selected .node-rep");
  let selectedEdges = document.querySelectorAll(".link.selected");
  // let selectedEdgeShapes = document.querySelectorAll(".selected .link-rep");
  let prev_color = "prev_" + type + "_color";
  let curr_color = "curr_" + type + "_color";
  for (var nodeIndex in selectedNodes) {
    log("node", {
      "id": selectedNodes[nodeIndex].getAttribute("id"),
      // "label": labelFinder(selectedNodes[i].getAttribute("id")),
      [prev_color]: selectedNodes[nodeIndex].children[0].style.cssText,
      [curr_color]: color
    })
  }

  for (var edgeIndex in selectedEdges) {
    log("edge", {
      "id": selectedEdges[edgeIndex].getAttribute("id"),
      // "label": labelFinder(selectedEdges[j].getAttribute("id")),
      [prev_color]: selectedEdges[edgeIndex].children[0].style.cssText,
      [curr_color]: color
      // "source_id": selectedEdges[j].getAttribute("source_id"),
      // "target_id": selectedEdges[j].getAttribute("target_id")
    })
  }
}

/*
 * Logs creation of a node/edge
 */
function logCreation(element) {
  let levelName = element.getAttribute("class").split(" ")[0];
  let content;
  if (levelName === "node") {
    if (element.getAttribute("class").split(" ").length === 3) {
      levelName += " pin";
    }
    content = {
      "id": element.getAttribute("id"),
      "color": element.children[0].style.cssText,
      "shape": element.children[0].tagName,
      "size": element.children[0].r.animVal.value,
      "label_text": "Node Name",
      "label_size": "15px",
      "label_color": "green",
      "label_font": "Helvetica",
      "image_content": "", //TODO
      "location": element.getAttribute("transform").replace('translate','')
    };
  } else {
    content = {
      "id": element.getAttribute("id"),
      "label_text": "Link Name",
      "color": "lightgrey",
      "source_id": element.getAttribute("source_id"),
      "target_id": element.getAttribute("target_id")
    };
  }
  log(levelName, content);
}

/*
 * Logs label changes
 */
function logLabel(element) {
  let levelName = element.getAttribute("class").split(" ")[0];
  if (levelName === "node") {
    if (element.getAttribute("class").split(" ").length === 3) {
      levelName += " pin";
    }
  } 
  let content = {
    "id": element.getAttribute("id"),
    "prev_label_text": prev_label,
    "curr_label_text": element.children[1].children[0].innerHTML
  };
  prev_label = "";
  log(levelName, content);
}

function setPrevLabel(label) {
  prev_label = label;
}

/*
 * Logs font size changes
 */
function logFontChanges(prev_size, curr_size){
  let selectedNodes = document.querySelectorAll(".node.selected");
  let selectedEdges = document.querySelectorAll(".link.selected");

  for (var nodeIndex in selectedNodes) {
    log("node", {
      "id": selectedNodes[nodeIndex].getAttribute("id"),
      "prev_font_size": prev_size,
      "curr_font_size": curr_size
    });
  }

  for (var edgeIndex in selectedEdges) {
    log("edge", {
      "id": selectedEdges[edgeIndex].getAttribute("id"),
      "prev_font_size": prev_size,
      "curr_font_size": curr_size
    });
  }
}

/*
 * Logs toggle for bold/italics
 */
function logLabelToggle(type, setting){
  let selectedNodes = document.querySelectorAll(".node.selected");
  let selectedEdges = document.querySelectorAll(".link.selected");

  for (var nodeIndex in selectedNodes) {
    log("node", {
      "id": selectedNodes[nodeIndex].getAttribute("id"),
      [type]: setting
    })
  }

  for (var edgeIndex in selectedEdges) {
    log("edge", {
      "id": selectedEdges[edgeIndex].getAttribute("id"),
      [type]: setting
    })
  }
}

/*
 * Logs element movement/translate
 */
function logTranslate(element) {
  if (prev_position.length === 0) {
    return;
  }
  let node_type = "node";
  for (var key in prev_position) {
    let child = document.getElementById(key);
    if (child.tagName === 'image') {
      node_type += " pin";
      log("image", {
        "id": key,
        "prev_position": prev_position[key],
        "curr_position": '(' + child.getAttribute("x") + ',' + child.getAttribute("y") + ')'
      });
    } else {
      log(node_type, {
        "id": key,
        "prev_position": prev_position[key],
        "curr_position": child.getAttribute("transform").replace('translate','')
      });
    }
  }
  prev_position = {};
}

/*
 * Helper method to save previous position of each translated element
 */
function translateSavePrevPosition(element) {
  if (!element) {
    return;
  }
  if (element.tagName === 'image') { // save picture movement
    prev_position[element.getAttribute("id")] = '(' + element.getAttribute("x") + ',' + element.getAttribute("y") + ')';
    if (element.getAttribute("children_ids")) {
      saveChildPrevPosition(element);
    }
  } else {
    if (element.getAttribute("children_ids")) {
      saveChildPrevPosition(element);
    } else {
      prev_position[element.getAttribute("id")] = element.getAttribute("transform").replace('translate','');
    }
  }
}

/*
 * Helper method to save prev position of element's children_ids attr
 */
function saveChildPrevPosition(element) {
  let children = element.getAttribute("children_ids").split(" ");
  for (var childKey in children) {
    prev_position[children[childKey]] = document.getElementById(children[childKey]).getAttribute("transform").replace('translate','');
  }
}

/*
 * Logs image upload
 */
function logImage(width, height, src, id) {
  log("image", {
    "location": "(0,0)",
    "width": width,
    "height": height,
    "src": src,
    "id": id
  });
}