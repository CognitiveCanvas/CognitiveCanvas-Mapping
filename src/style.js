var pink = "rgba(255, 130, 159, 0.2)";
var green = "rgba(61, 255, 152, 0.2)";
var yellow = "rgba(255, 246, 89, 0.2)";

var greenBorder = "#2E8429";
var yellowBorder = "#FBA80E";
var pinkBorder = "#C82570";

var current_font_size = 15;

var FONT_NORMAL = 100;
var FONT_BOLD = 700;

/**
 * Sets a style of a selection of nodes and logs it in the action logging and undo buffers
 * @param {Number | String} value - the value to set the attribute to
 * @param {String} childElementClass - the class of an element within the selected one to change the attribute on
 * @param {HTMLCollection} nodes - If null, will grab selected nodes
 */
function setStyle(styleAttr, value, elements=null, childElementClass=null){
	if(!elements) elements = document.getElementsByClassName("selected");
	let oldStyleValues = [];
	
	for (let i = 0; i < elements.length; i++){
		let element = childElementClass ? elements[i].getElementsByClassName(childElementClass)[0] : elements[i];
		oldStyleValues.push(element.style[styleAttr]);
		element.style[styleAttr] = value;
	};

	let data = {
		"style_type": "change_" + styleAttr,
		"style_name": styleAttr,
		"old_value" : oldStyleValues,
		"new_value" : value,
		"elements"  : elements,
	};
	action_done("style", data);
	logStyleChange(data);
}

function setColor(color) {
	let nodes = d3.selectAll(".selected .node-rep");
	let edges = d3.selectAll(".selected .link-rep");

	let data = {
		"style_type": "change_color", 
		"old_color" : nodes.style("fill"),
		"new_color" : color, 
		"nodes"     : nodes,
		"edges"     : edges
	};
	action_done ("style", data);
	logColorChanges("fill", color);

	nodes.style("fill", color);
	edges.style("stroke", color);

}

function setNodeColor(color){
	let nodes = d3.selectAll(".selected .node-rep");
	let data = {
		"style_type": "change_color", 
		"old_color" : nodes.style("fill"),
		"new_color" : color, 
		"nodes"     : nodes,
		"edges"     : []
	};
	action_done ("style", data);
	logColorChanges("fill", color);
	nodes.style("fill", color)
}

/**
 * Sets the opacity of selected nodes' fills
 * @param {Number} opacity - the new node opacity from 0 to 100
 * @param {HTMLCollection} nodes - If null, will grab selected nodes
 */
function setNodeOpacity(opacity, nodes=null){
	setStyle("opacity", Number(opacity)/100, nodes, "node-rep");
}

function setLinkColor(color){
	let links = d3.selectAll(".selected .link-rep");
	let data = {
		"style_type": "change_color", 
		"old_color" : links.style("fill"),
		"new_color" : color, 
		"nodes"     : [],
		"edges"     : links
	};
	action_done ("style", data);
	logColorChanges("fill", color);
	links.style("stroke", color);
}

function setLinkThickness(thickness){
	let links = d3.selectAll(".selected .link-rep");
	
	let data = {
		"style_type": "change_edge_thickness",
		"old_size"  : links.style("stroke-width"),
		"new_size"  : thickness, 
		"elements"  : links
	}
	action_done("style", data);

	links.style("stroke-width", thickness);
}

function setBorderColor(color) {
	let nodes = d3.selectAll(".selected .node-rep");
	let data = {
		"style_type": "change_border_color", 
		"old_color" : nodes.style("stroke"),
		"new_color" : color, 
		"elements"  : nodes
	};
	action_done("style", data);
	nodes.style("stroke", color);
}

function increaseLabelFontSize(){
	current_font_size = current_font_size + 2;
	d3.selectAll(".selected .label")
	  .style("font-size", current_font_size);

	let data = {
		"style_type" : "label_font_size", 
		"old_size"   : d3.selectAll(".selected .label").style("font-size"),
		"new_size"   : ""+current_font_size,
		"elements"   : d3.selectAll(".selected .label")
	}
	action_done("style", data)
}


function decreaseLabelFontSize(){
	current_font_size = current_font_size - 2;
	d3.selectAll(".selected .label")
	  .style("font-size", current_font_size);
	let data = {
		"style_type" : "label_font_size", 
		"old_size"   : d3.selectAll(".selected .label").style("font-size"),
		"new_size"   : ""+current_font_size,
		"elements"   : d3.selectAll(".selected .label")
	}
	action_done("style", data)
}


function toggleLabelFontItalics(){
	current_style = d3.select(".selected .label")
	  .style("font-style");
	let new_style = "";
	if (current_style != 'italic'){
		new_style = "italic"
		d3.selectAll(".selected .label")
	  		.style("font-style", "italic");
	} else {
		new_style = "normal"
		d3.selectAll(".selected .label")
	  		.style("font-style", "normal");
	}

	let data = {
		"style_type" : "label_font_italics", 
		"old_style"   : current_style,
		"new_style"   : ""+new_style,
		"elements"   : d3.selectAll(".selected .label")
	}
	action_done("style", data)
}


function toggleLabelFontBold(){
	current_style = d3.select(".selected .label")
	  .style("font-weight");
	let new_style = "";
	if (current_style == "700"){
		new_style = FONT_NORMAL;
		d3.selectAll(".selected .label")
	  		.style("font-weight", FONT_NORMAL); 	
	} else {
		new_style = FONT_BOLD;
		d3.selectAll(".selected .label")
	  		.style("font-weight", FONT_BOLD);
	}

	let data = {
		"style_type" : "label_font_bold", 
		"old_style"   : current_style,
		"new_style"   : ""+new_style,
		"elements"   : d3.selectAll(".selected .label")
	}
	action_done("style", data)
}

function setLabelColor(color){
	current_style = d3.selectAll(".selected .label")
		.style("fill", color);
	let data = {
		"style_type": "label_font_color", 
		"old_color" : d3.selectAll(".selected .label").style("fill"),
		"new_color" : color, 
		"elements"  : d3.selectAll(".selected .label")
	}
	action_done ("style", data)

  logColorChanges("border", color);
  d3.selectAll(".selected .node-rep")
    .style("stroke", color);
}

function increaseLabelFontSize() {
  logFontChanges(current_font_size, current_font_size + 2);
  current_font_size = current_font_size + 2;
  d3.selectAll(".selected .label")
    .style("font-size", current_font_size);
}


function decreaseLabelFontSize() {
  logFontChanges(current_font_size, current_font_size - 2);
  current_font_size = current_font_size - 2;
  d3.selectAll(".selected .label")
    .style("font-size", current_font_size);
}


function toggleLabelFontItalics() {
  current_style = d3.select(".selected .label")
    .style("font-style");
  //console.log(current_style)
  let italicized;
  if (current_style != 'italic') {
    italicized = true;
    d3.selectAll(".selected .label")
        .style("font-style", "italic");
  } else {
    italicized = false;
    d3.selectAll(".selected .label")
      .style("font-style", "normal");
  }
  logLabelToggle("italicized", italicized, 7);
}


function toggleLabelFontBold() {
  current_style = d3.select(".selected .label")
    .style("font-weight");
  //console.log(current_style)
  let bolded;
  if (current_style == "700") {
    bolded = true;
    d3.selectAll(".selected .label")
      .style("font-weight", FONT_NORMAL);
  } else {
    bolded = false;
    d3.selectAll(".selected .label")
      .style("font-weight", FONT_BOLD);
  }
  logLabelToggle("bolded", bolded, 6);
}

function setLabelColor(color) {
  logColorChanges("label", color);
  current_style = d3.selectAll(".selected .label")
    .style("fill", color);
}