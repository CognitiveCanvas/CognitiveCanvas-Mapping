var temp_buffer = [];

function log(level, content){
	var current_log = {
		"level": level, 
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
  for (let i = 0; i < selectedNodes.length; i++) {
    log("node", {
      "id": selectedNodes[i].getAttribute("id"),
      // "label": labelFinder(selectedNodes[i].getAttribute("id")),
      [prev_color]: selectedNodes[i].children[0].style.cssText,
      [curr_color]: color
    })
  }

  for (let j = 0; j < selectedEdges.length; j++) {
    log("edge", {
      "id": selectedEdges[j].getAttribute("id"),
      // "label": labelFinder(selectedEdges[j].getAttribute("id")),
      [prev_color]: selectedNodes[i].children[0].style.cssText,
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
function logLabel(oldLabel, element) {
  let levelName = element.getAttribute("class").split(" ")[0];
  if (levelName === "node") {
    if (element.getAttribute("class").split(" ").length === 3) {
      levelName += " pin";
    }
  } 
  let content = {
    "id": element.getAttribute("id"),
    "prev_label_text": oldLabel,
    "curr_label_text": element.children[1].children[0].innerHTML
  };
  log(levelName, content);
}

/*
 * Logs font size changes
 */
function logFontChanges(prev_size, curr_size){
  let selectedNodes = document.querySelectorAll(".node.selected");
  let selectedEdges = document.querySelectorAll(".link.selected");

  for (let i = 0; i < selectedNodes.length; i++) {
    log("node", {
      "id": selectedNodes[i].getAttribute("id"),
      "prev_font_size": prev_size,
      "curr_font_size": curr_size
    })
  }

  for (let j = 0; j < selectedEdges.length; j++) {
    log("edge", {
      "id": selectedEdges[j].getAttribute("id"),
      "prev_font_size": prev_size,
      "curr_font_size": curr_size
    })
  }
}

/*
 * Logs toggle for bold/italics
 */
function logLabelToggle(type, setting){
  let selectedNodes = document.querySelectorAll(".node.selected");
  let selectedEdges = document.querySelectorAll(".link.selected");

  for (let i = 0; i < selectedNodes.length; i++) {
    log("node", {
      "id": selectedNodes[i].getAttribute("id"),
      [type]: setting
    })
  }

  for (let j = 0; j < selectedEdges.length; j++) {
    log("edge", {
      "id": selectedEdges[j].getAttribute("id"),
      [type]: setting
    })
  }
}