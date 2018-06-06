var redo_buffer = [];
const REDO_BUFFER_LEN = 30;

// Called when an action is undone
function undo_action(type, data){
	if (redo_buffer.length < REDO_BUFFER_LEN){
		redo_buffer.push({ "type": type, "data":data } );	
	}
	else{
		// Removes the front of the buffer queue
		redo_buffer.shift();
		// Appends to the end of the quque
		redo_buffer.push({type : data});
	}
}

function redo(){
	// Do nothing if the stack is empty
	if (redo_buffer.length == 0)
		return;

	let last_action = redo_buffer.pop();
	action_done (last_action.type, last_action.data)
	switch (last_action.type){
		case "style": 
			redoStyle(last_action.data);
			break;
		case "deleteNode":
			redoDeleteNode(last_action.data);
			break;
		case "insertNode":
			redoInsertNode(last_action.data);
			break;
		case "dragNode":
		    // TODO: not yet implemented
			redoDragNode();
			break;
		case "addEdge":
			redoAddEdge(last_action.data);
			break;
		case "removeEdge":
			redoRemoveEdge(last_action.data);
			break;
		case "changeLabel":
			// TODO: not yet implemented
			redoChangeLabel();
			break;
		default:
			console.log("undefined action type encountered ", last_action.type);
	}
}

function redoStyle(data){
	console.log("redo-ing style");
	switch (data.style_type){
		case "change_color":
			data.nodes.style("fill", ""+data.new_color);
			data.edges.style("stroke", ""+data.new_color);
			break;
		case "change_border_color":
			data.elements.style("stroke", ""+data.new_color);
			break;
		case "label_font_size":
			data.elements.style("font-size", ""+data.new_size);
			break;
		case "label_font_italics":
			data.elements.style("font-style", ""+data.new_style);
			break;
		case "label_font_bold":
			data.elements.style("font-weight", ""+data.new_style);
			break;
		case "label_font_color":
			data.elements.style("fill", ""+data.new_color)
			break;
		case "change_edge_thickness":
			data.elements.style("stroke-width", ""+data.new_size);
			break;
	}
}

function redoDeleteNode(data){
	console.log("redo-ing node deletion");
	let node = data.node;
	let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  	let node_id = node_d3.attr("id");

  	d3.selectAll(`[source_id=${node_id}]`)
    	.classed("deleted", true);

  	d3.selectAll(`[target_id=${node_id}]`)
    	.classed("deleted", true);

    removeNodeFromGroup(node);
  	
    node_d3.classed("deleted", true);
    wrapInTransient(node_d3.node());
}

function redoInsertNode(data){
	console.log("redo-ing node insertion");
	let node = data.node;
	let groups = data.groups;
  	let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  	let node_id = node_d3.attr("id");

  	d3.selectAll(`[source_id=${node_id}]`)
    	.classed("deleted", false);

  	d3.selectAll(`[target_id=${node_id}]`)
    	.classed("deleted", false);

  	insertNodeToGroup(node, groups);
  	node_d3.classed("deleted", false);
  	removeFromTransient(node_d3);
}

function redoAddEdge(data){
	console.log("redo-ing edge insertion");
	let id = data.edge.id;
	link = d3.select("#"+id);
  	link.classed("deleted", false);
  	removeFromTransient(link);
}

function redoRemoveEdge(data){
	console.log("redo-ing edge removal", data);
	let id = data.edge.id;
	link = d3.select("#"+id);
  	link.classed("deleted", true);
  	wrapInTransient(link.node());
}