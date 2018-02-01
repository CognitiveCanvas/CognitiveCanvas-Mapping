/*
 * mbostock/6123708
 */
var zoom = d3.behavior.zoom()
	.scaleExtent([1,10])
	.on("zoom", zoomed)

var svg = d3.select("#d3_container")
svg.call(zoom)

var container = d3.select(".node")

function zoomed(){
	// Get old scale and translation
	// TODO
	nodeList = d3.selectAll(".node")[0];

	for (var i = 0; i < nodeList.length; i++){
		oldTranslation = getNodePosition(nodeList[i]);
		// newTranslation = oldTranslation
		// newTranslation[0] = d3.event.translate[0];
		// newTranslation[1] = d3.event.translate[1];
		scaleFactor = d3.event.scale
		var current_node = d3.select(nodeList[i]);
		current_node.attr("transform", "translate("+oldTranslation+")scale("+scaleFactor+")")
	}
	
	//container.attr
}