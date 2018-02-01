var pink = "rgba(255, 130, 159, 0.2)";
var green = "rgba(61, 255, 152, 0.2)";
var yellow = "rgba(255, 246, 89, 0.2)";

var greenBorder = "#2E8429";
var yellowBorder = "#FBA80E";
var pinkBorder = "#C82570";

function setColor(color) {
	d3.select(styleNode)
	  .style("fill", color);
	console.log("success");
}

function setBorderColor(color) {
	d3.select(styleNode)
	  .style("stroke", color);
}