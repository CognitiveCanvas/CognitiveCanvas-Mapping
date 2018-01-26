var temp_div = null;

function addLabel(text, target){

  console.log("adding labels");
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

  var cx = 0;
  var cy = 0;
  var x1 = 0;
  var x2 = 0;
  var y1 = 0;
  var y2 = 0;
  var name = d3.select(target.parentNode).attr("class").split(" ")[0];

  switch(name){
    case "node":
      translation = getNodePosition(target.parentNode);
      cx = translation[0] - 10;
      cy = translation[1] - 10;
      break;

    case "link":
      x1 = target.getAttribute("x1");
      x2 = target.getAttribute("x2");
      y1 = target.getAttribute("y1");
      y2 = target.getAttribute("y2");
      cx = parseFloat(parseFloat(parseFloat(x1) + parseFloat(x2)) / 2.0);
      cy = parseFloat(parseFloat(parseFloat(y1) + parseFloat(y2)) / 2.0);
      break;

    default:
      break;
  }
  label.style.left = cx + "px";
  label.style.top = cy + "px";
  label.setAttribute("contenteditable", "true");
  label.onkeypress = (e) => {
    //console.log(e.key)
    switch(e.key){
      case "Enter":
        var txt = label.textContent;
        cx = -10;
        cy = -10;
        switch(name){
          case "node":
            cx = -10;
            cy = -10;
            break;
          case "link":
            x1 = target.getAttribute("x1");
            x2 = target.getAttribute("x2");
            y1 = target.getAttribute("y1");
            y2 = target.getAttribute("y2");
            cx = parseFloat(parseFloat(parseFloat(x1) + parseFloat(x2)) / 2.0 - 10);
            cy = parseFloat(parseFloat(parseFloat(y1) + parseFloat(y2)) / 2.0 - 10);
            break;
          default:
        }
        // Add the text inside svg with the new text
        d3.select(target.parentNode).append("text")
                .attr("x", cx+"px")
                .attr("y", cy+"px")
                .text(txt)
                .classed("label", true)
                .attr("id", d3.select(target.parentNode).attr("id")+"_text")
        // Remove the outside editable div
        label.remove();
        break;
      default:
    }
  }
  container.appendChild(label);

}