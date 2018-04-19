var temp_buffer = [];

function log(level, content){
	var current_log = {
		"level": level, 
		"content": content,
		"timestamp": Date.now()
	}

	temp_buffer.push(current_log)
}


function postLogs(){
	if (temp_buffer.length > 0){
		$.ajax({
			contentType: "application/json",
			data: temp_buffer, 
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