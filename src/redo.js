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
	}
}

function redoDeleteNode(data){
	console.log("redo-ing node deletion");
	let node = data.elements;
	let node_d3 = node instanceof d3.selection ?  node : d3.select(node);
  	let node_id = node_d3.attr("id");

  	d3.selectAll(`[source_id=${node_id}]`)
    	.classed("deleted", true);

  	d3.selectAll(`[target_id=${node_id}]`)
    	.classed("deleted", true);

  	d3.selectAll(".selection_area[children_ids~=" + node_id + "]")
    	.each(function(){
    	let group = d3.select(this);
      	group.attr("children_ids", group.attr("children_ids").split(' ').filter(id => id !== node_id).join(' ') );
    	});
    node_d3.classed("deleted", true);
}