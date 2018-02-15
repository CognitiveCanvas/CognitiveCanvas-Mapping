var svg_container = d3.select("#d3_container")
var cog_canvas = document.getElementById("d3_container");
var canvas_d3 = d3.select(canvas);
var zoom_offset = 0;

var zoom_object = d3.behavior.zoom();
zoom_object.scaleExtent([0.1,5]);
zoom_object.on("zoom", zoom_pan);
zoom_object.on("zoomstart", zoomstarted)

canvas_d3.call(zoom_object)
canvas_d3.on("dblclick.zoom", null);



function screenToCanvasPosition(x, y){
	canvas_pos = getNodePosition(canvas);
	k = getNodeScale(canvas)
	console.log(k)
	x_0 = parseFloat(-1*canvas_pos[0]*k[0]) + parseFloat(x);
	y_0 = parseFloat(-1*canvas_pos[1]*k[1]) + parseFloat(y);
	return [x_0, y_0];
}

function canvasToScreenPosition(x, y){
	canvas_pos = getNodePosition(canvas);
	k = getNodeScale(canvas)
	console.log(k)
	x_0 = parseFloat(canvas_pos[0]*k[0]) + parseFloat(x);
	y_0 = parseFloat(canvas_pos[1]*k[1]) + parseFloat(y);
	return [x_0, y_0];
}

function zoomstarted(){
	zoom_offset = getNodePosition(canvas);
}

function zoom_pan(){
	if (panMode){
		var k = d3.event.scale;
		var tran = d3.event.translate;
		tran[0] = parseFloat(tran[0]*0.5)+zoom_offset[0];
		tran[1] = parseFloat(tran[1]*0.5)+zoom_offset[1];
 		canvas.setAttribute("transform", "translate("+tran+") scale("+k+")")
	}
		
	
	
	// var nodeList = svg_container.selectAll(".node")[0]
	// for(var i = 0; i < nodeList.length; i++){
	// 	oldTranslation = getNodePosition(nodeList[i]);
	// 	k = d3.event.scale;
	// 	ix = parseFloat(d3.event.translate[0]);
	// 	iy = parseFloat(d3.event.translate[1]);
	// 	jx = parseFloat(oldTranslation[0]);
	// 	jy = parseFloat(oldTranslation[1]);
	// 	transform = [0,0];
	// 	transform[0] = parseFloat(parseFloat(ix*k*0.0025) + parseFloat(jx));
	// 	transform[1] = parseFloat(parseFloat(iy*k*0.0025) + parseFloat(jy));
		
	// 	console.log(d3.event.translate)
	// 	var current_node = d3.select(nodeList[i]);
	// 	//current_node.attr("transform", "translate("+d3.event.translate+")scale("+k+")");
	// }
}
