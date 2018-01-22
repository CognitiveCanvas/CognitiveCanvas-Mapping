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
  var name = d3.select(target.parentNode).attr("class").split(" ")[0];
  if (name == "node"){
    var translation = target.parentNode.getAttribute("transform");
    translation = translation.substring(9).replace("(", "").replace(")","").split(",");
    var cx = translation[0]-10;
    var cy = translation[1]-10;
  }else{
    var x1 = target.getAttribute("x1");
    var x2 = target.getAttribute("x2");
    var y1 = target.getAttribute("y1");
    var y2 = target.getAttribute("y2");
    var cx = parseFloat(parseFloat(parseFloat(x1) + parseFloat(x2)) / 2.0);
    var cy = parseFloat(parseFloat(parseFloat(y1) + parseFloat(y2)) / 2.0);
  }

  
  label.style.left = cx + "px";
  label.style.top = cy + "px";
  label.setAttribute("contenteditable", "true");

  label.onkeypress = function(e){
  	if(e.key == 'Enter'){
  		var txt = label.textContent;
      var cx = -10;
      var cy = -10;
      var name = d3.select(target.parentNode).attr("class").split(" ")[0];
      if (name == "link"){
        var x1 = target.getAttribute("x1");
        var x2 = target.getAttribute("x2");
        var y1 = target.getAttribute("y1");
        var y2 = target.getAttribute("y2");
        cx = parseFloat(parseFloat(parseFloat(x1) + parseFloat(x2)) / 2.0 - 10);
        cy = parseFloat(parseFloat(parseFloat(y1) + parseFloat(y2)) / 2.0 - 10);
      }
  		d3.select(target.parentNode).append("text")
                .attr("x", cx+"px")
                .attr("y", cy+"px")
                .text(txt)
                .classed("label", true)
                .classed("blackText", true)
                .attr("id", d3.select(target.parentNode).attr("id")+"_text")
  		
  		label.remove();
  	}
  }
  container.appendChild(label)
  
}

