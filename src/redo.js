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
	if(redo_buffer.length == 0)
		return;
}