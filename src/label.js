var temp_label_div = null;

function addLabel(text, node){

  console.log("adding labels");
  var num_labels = d3.select(node).selectAll(".label").size();
  // If a label already exists
  if (num_labels > 0){
    // Update the text 
    text = d3.select(node).select(".label").text();
    // Delete the inside node
    d3.select(node).select(".label").remove();
  }

  // Adding an editable div outside
  var container = document.getElementById("d3_container");
  var label = document.createElement("div");
  d3.select(label).classed("label-input", true);
  var textNode = label.appendChild(document.createElement("input"));
  textNode.value = text;
  temp_label_div = label;
  // Get the canvas translations

  var cx = 0;
  var cy = 0;
  var x1 = 0;
  var x2 = 0;
  var y1 = 0;
  var y2 = 0;
  var name = d3.select(node).attr("class").split(" ")[0];

  switch(name){
    case "node":
      translation = getNodePosition(node);
      cx = translation[0];
      cy = translation[1];
      break;

    case "link":
      let line = d3.select(node).select(".link-rep");
      x1 = line.attr("x1");
      x2 = line.attr("x2");
      y1 = line.attr("y1");
      y2 = line.attr("y2");
      cx = parseFloat(parseFloat(parseFloat(x1) + parseFloat(x2)) / 2.0);
      cy = parseFloat(parseFloat(parseFloat(y1) + parseFloat(y2)) / 2.0);
      break;

    default:
      break;
  }
  label.style.left = cx + "px";
  label.style.top = cy + "px";
  
  label.onkeypress = (e) => {
    //console.log(e.key)
    switch(e.key){
      case "Enter":
      case "Tab":
        var txt = textNode.value;
        cx = 0;
        cy = 0;
        switch(name){
          case "node":
            break; 
          case "link":
            let line = d3.select(node).select(".link-rep");
            x1 = line.attr("x1");
            x2 = line.attr("x2");
            y1 = line.attr("y1");
            y2 = line.attr("y2");
            cx = (parseFloat(x1) + parseFloat(x2)) / 2.0 ;
            cy = (parseFloat(y1) + parseFloat(y2)) / 2.0 ;
            break;
          default:
            break;
        }
        // Add the text inside svg with the new text
        d3.select(node).append("text")
                .attr("x", cx+"px")
                .attr("y", cy+"px")
                .text(txt)
                .classed("label", true)
                .attr("id", d3.select(node).attr("id")+"_text")
        // Remove the outside editable div
        label.remove();
        temp_label_div = null;
        break;
      default:
    }
  }
  container.appendChild(label);
  textNode.select();
}