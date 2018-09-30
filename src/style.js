var current_font_size = 15;

/**
 * Sets a style of a selection of nodes and logs it in the action logging and undo buffers
 * @param {Number | String} value - the value to set the attribute to
 * @param {String} classNames - styles are only changed on elements with one of these classNames or with children with these classNames
 * @param {HTMLCollection} nodes - If null, will grab selected nodes
 */
function setStyle(styleAttr, value, elements=null, classNames=null){

	if(!elements) elements = document.getElementsByClassName("selected");
	
	if (classNames){
		elements = filterElementsAndChildrenByClasses(elements, classNames);
	}

	let oldStyleValues = [];
	for (let i = 0; i < elements.length; i++){
		element = elements[i];
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

/**
 * Takes a list of elements, and returns a list with only those with a matching class.
 * If the element does not have one of the classes, it's children are searched for the class
 * @param  {HTMLCollection} elements   Elements to filter and search through
 * @param  {[String]} classNames	   An array of class names to search for
 * @return {HTMLCollection}    A list of elements with one of the passed in classes
 */
function filterElementsAndChildrenByClasses(elements, classNames){
	if (typeof classNames === "string") classNames = [classNames];
	let filteredElements = [];
	//Loop through the elements.  If it has one of the classes, return it, otherwise search it's children for the classes
	for( let i = 0; i < elements.length; i++){
		classNames.forEach( (className)=>{
			if (elements[i].classList.contains(className)){
				filteredElements.push(elements[i]);
			} else{
				let selection = elements[i].getElementsByClassName(className);
				if(selection.length > 0){
					filteredElements.push(selection[0]);
				}
			}
		});
	}
	return filteredElements;
}

export function setColor(color) {
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

export function setNodeColor(color){
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
export function setNodeOpacity(opacity, nodes=null){
	setStyle("opacity", Number(opacity)/100, nodes, "node-rep");
}

export function setBorderType(borderType, elements=null){
	let dashLength = DASH_ARRAY_VALUES[borderType];
	setStyle("stroke-dasharray", dashLength, elements, ["node-rep", "link-rep"]);
}

export function setLinkColor(color){
	let links = d3.selectAll(".selected.link .link-rep");
	let linkEnds = d3.selectAll(".selected.link .link-end");
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
	linkEnds.style("fill", color);
}

export function setLinkThickness(thickness){
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

export function setBorderColor(color) {
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

export function toggleLabelFontItalics(){
	logLabelToggle("italicized", italicized, 7);
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


export function toggleLabelFontBold(value=null){
	current_style = d3.select(".selected .label")
	  .style("font-weight");
	let new_style = "";

	let makeBold = value !== null ? Boolean(value) : current_style == Number(FONT_BOLD);

	if (!makeBold){
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
	action_done("style", data);
	logLabelToggle("bolded", bolded, 6);
}

export function setLabelColor(color){
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
}

export function setLabelSize(fontSize){
	let labels = document.querySelectorAll(".selected .label"); 
	logFontChanges(labels[0].style.fontSize || 16, fontSize);
	for(let i = 0; i < labels.length; i++){
		labels[i].style.fontSize = fontSize + "px";
	}
}

export function setLabelFont(font, elements=null){
	setStyle("fontFamily", "'" + font +  "', sans-serif", elements, ["label"]);
}