var temp_buffer = [];

function log(level, content){
	var current_log = {
		"level": level, 
		"content": content,
		"timestamp": Date.now()
	}
//  console.log(current_log);

	temp_buffer.push(current_log)
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
