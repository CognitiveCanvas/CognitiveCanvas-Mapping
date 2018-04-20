var temp_buffer = [];

function log(level, content){
	var current_log = {
		"level": level, 
		"content": content,
		"timestamp": new Date().toUTCString()
	}
	temp_buffer.push(current_log);
}

function logFromLabel(element) {
    let levelName = element.getAttribute("class").split(" ")[0];
    let content;
    if (levelName === "node") {
      content = {
      	id: element.getAttribute("id"),
        color: element.getAttribute("circle"),
        shape: "",
        size: "",
        text_content: "",
        text_size: "",
        text_color: "",
        text_font: "",
        image_content: "",
        adjacency_list: "",
        location: element.getAttribute("transform").replace('translate','')
      };
    } else {
      content = {
      	label: "",
      	color: "",
      	source_node_id: "",
      	target_node_id: ""
      };
    }
    console.log(content);
    console.log(element);
    // log(levelName, content);
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
