var temp_buffer = [];

function log(level, content){
	var current_log = {
		"level": level, 
		"content": content,
		"timestamp": new Date().toUTCString()
	}
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
function logColorChanges(color){
  let selectedNodes = document.querySelectorAll(".node.selected");
  let selectedNodeShapes = document.querySelectorAll(".selected .node-rep");
  let selectedEdges = document.querySelectorAll(".link.selected");
  let selectedEdgeShapes = document.querySelectorAll(".selected .link-rep");

  for (let i = 0; i < selectedNodes.length; i++) {
    log("node", {
      "id": selectedNodes[i].getAttribute("id"),
      "label": labelFinder(selectedNodes[i].getAttribute("id")),
      "color": color
    })
  }

  for (let j = 0; j < selectedEdges.length; j++) {
    log("edge", {
      "id": selectedEdges[j].getAttribute("id"),
      "label": labelFinder(selectedEdges[j].getAttribute("id")),
      "color": color,
      "source_id": selectedEdges[j].getAttribute("source_id"),
      "target_id": selectedEdges[j].getAttribute("target_id")
    })
  }
}

/*
 * Logs creation of a node/edge after label is created
 */
function logFromLabel(element) {
  let levelName = element.getAttribute("class").split(" ")[0];
  let content;
  if (levelName === "node") {
    if (element.getAttribute("class").split(" ").length === 3) {
      levelName += " pin"
    }
    content = {
      id: element.getAttribute("id"),
      color: element.children[0].style.cssText,
      shape: element.children[0].tagName,
      size: element.children[0].r.animVal.value,
      label_text: element.children[1].children[0].innerHTML,
      label_size: "17px",
      label_color: "green",
      label_font: element.children[1].getAttribute("font-family"),
      image_content: "", //TODO
      location: element.getAttribute("transform").replace('translate','')
    };
  } else {
    content = {
      label_text: element.children[1].children[0].innerHTML,
      color: "lightgrey",
      source_node_id: element.getAttribute("source_id"),
      target_node_id: element.getAttribute("target_id")
    };
  }
  log(levelName, content);
}