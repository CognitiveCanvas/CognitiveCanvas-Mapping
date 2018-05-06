var temp_buffer = [];
var prev_position = {};
var prev_label = "";
const DEFAULT_INTERACTION = "Single Tap";

function log(level, interaction, content){
	var current_log = {
		"level": level, 
    "interaction": interaction,
		"content": content,
		"timestamp": new Date().toUTCString()
	}
  console.log(current_log);
	// temp_buffer.push(current_log);
}

function postLogs(){
	if (temp_buffer.length > 0){
		$.ajax({
			contentType: "application/json",
			data: JSON.stringify(temp_buffer), 
			dataType: "json", 
			success: (data)=>{console.log(data)}, 
			error: ()=>{console.log("Error with postLogs in logger.js")}, 
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
  for (var i = 0; i < selectedNodes.length; i++) {
    log("node", DEFAULT_INTERACTION, {
      "id": selectedNodes[i].getAttribute("id"),
      // "label": labelFinder(selectedNodes[i].getAttribute("id")),
      [prev_color]: selectedNodes[i].children[0].style.cssText,
      [curr_color]: color
    })
  }

  for (var i = 0; i < selectedEdges.length; i++) {
    log("edge", DEFAULT_INTERACTION, {
      "id": selectedEdges[i].getAttribute("id"),
      // "label": labelFinder(selectedEdges[j].getAttribute("id")),
      [prev_color]: selectedEdges[i].children[0].style.cssText,
      [curr_color]: color
      // "source_id": selectedEdges[j].getAttribute("source_id"),
      // "target_id": selectedEdges[j].getAttribute("target_id")
    })
  }
}

/*
 * Logs creation of a node/edge
 */
function logCreation(interaction, element) {
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
      // "image_content": "", //TODO
      "location": getNodePosition(element)
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
  log(levelName, interaction, content);
}

/*
 * Logs deletion of a node
 */
function logDeletion(interaction, element) {
  let levelName = element.getAttribute("class").split(" ")[0];
  log(levelName, interaction, {
    "id": element.getAttribute("id"),
    "deleted": true
  });
}

/*
 * Logs label changes
 */
function logLabel(interaction, element) {
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
  log(levelName, interaction, content);
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

  for (var i = 0; i < selectedNodes.length; i++) {
    log("node", DEFAULT_INTERACTION, {
      "id": selectedNodes[i].getAttribute("id"),
      "prev_font_size": prev_size,
      "curr_font_size": curr_size
    });
  }

  for (var i = 0; i < selectedEdges.length; i++) {
    log("edge", DEFAULT_INTERACTION, {
      "id": selectedEdges[i].getAttribute("id"),
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

  for (var i = 0; i < selectedNodes.length; i++) {
    log("node", DEFAULT_INTERACTION, {
      "id": selectedNodes[i].getAttribute("id"),
      [type]: setting
    })
  }

  for (var i = 0; i < selectedEdges.length; i++) {
    log("edge", DEFAULT_INTERACTION, {
      "id": selectedEdges[i].getAttribute("id"),
      [type]: setting
    })
  }
}

/*
 * Logs image upload
 */
function logImage(width, height, src, id) {
  log("image", DEFAULT_INTERACTION, {
    "location": "(0,0)",
    "width": width,
    "height": height,
    "src": src,
    "id": id
  });
}

/*
 * Logs element movement/translate
 */
function logTranslate(interaction, element) {
  if (prev_position.length === 0) {
    return;
  }
  let node_type = "node";
  for (var key in prev_position) {
    let child = document.getElementById(key);
    if (child.tagName === 'image') {
      node_type += " pin";
      log("image", interaction, {
        "id": key,
        "prev_position": prev_position[key],
        "curr_position": getNodePosition(child)
      });
    } else {
      log(node_type, interaction, {
        "id": key,
        "prev_position": prev_position[key],
        "curr_position": getNodePosition(child)
      });
    }
  }
  prev_position = {};
}

/*
 * Logs stroke paths
 */
function logDrawing(interaction, path) {
  path.setAttribute("id", this.getID());
  log("drawing", interaction, {
    "id": path.getAttribute("id"),
    "path": path.getAttribute("d"),
    "color": path.getAttribute("fill"),
  });
}

/*
 * Logs drawing erasures
 */
function logErasure(interaction, path) {
  log("drawing", interaction, {
    "id": path.getAttribute("id"),
    "deleted": true
  });
}

/*
 * Helper method to save previous position of each translated element
 */
function translateSavePrevPosition(element) {
  if (!element) {
    return;
  }
  if (element.tagName === 'image') { // save picture movement
    prev_position[element.getAttribute("id")] = getNodePosition(element);
    if (element.getAttribute("children_ids")) {
      saveChildPrevPosition(element);
    }
  } else {
    if (element.getAttribute("children_ids")) {
      saveChildPrevPosition(element);
    } else {
        prev_position[element.getAttribute("id")] = getNodePosition(element);
    }
  }
}

/*
 * Helper method to save prev position of element's children_ids attr
 */
function saveChildPrevPosition(element) {
  let children = element.getAttribute("children_ids").split(" ");
  for (var childKey in children) {
    prev_position[children[childKey]] = getNodePosition(document.getElementById(children[childKey]));
  }
}