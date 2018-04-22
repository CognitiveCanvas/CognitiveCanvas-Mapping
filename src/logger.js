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
        image_content: "",
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
