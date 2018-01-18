var temp_div = null;

function addLabels(text, target){
  console.log('adding label');
  var num_labels = d3.select(target.parentNode).selectAll(".label").size();
  // If a label already exists
  if (num_labels > 0){
    // Update the text 
    text = d3.select(target.parentNode).select(".label").text();
    // Delete the inside node
    d3.select(target.parentNode).select(".label").remove();
  }

  // Adding an editable div outside
  var container = document.getElementById("d3_container");
  var label = document.createElement("div");
  label.appendChild(document.createTextNode(text));
  label.style.position = "absolute";
  label.setAttribute("z-index", "1");
  var translation = target.parentNode.getAttribute("transform");
  translation = translation.substring(9).replace("(", "").replace(")","").split(",");
  var cx = translation[0]-10;
  var cy = translation[1]-10;
  label.style.left = cx + "px";
  label.style.top = cy + "px";
  label.setAttribute("contenteditable", "true");

  label.onkeypress = function(e){
  	if(e.key == 'Enter'){
  		var txt = label.textContent;
  		//var new_label = document.createElement("text");
  		//new_label.innerHTML = text;

  		d3.select(target.parentNode).append("text")
                .attr("x", "-10px")
                .attr("y", "-10px")
                .text(txt)
                .classed("label", true)
                .classed("blackText", true)
                .attr("id", d3.select(target.parentNode).attr("id")+"_text")
  		//target.parentNode.appendChild(new_label);
  		label.remove();
  	}
  }
  container.appendChild(label)
  
}

