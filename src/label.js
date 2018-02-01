var temp_label_div = null;

/**
 * Check whether label existed for the selected entity
 * Return its text if existed and remove current SVG text
 *
 * @arguments: node, entity to check
 * @return {String} [Text in existed label]
 */
function checkLabelExisted(node) {
  let text = null;
  let num_labels = d3.select(node)
                     .selectAll(".label")
                     .size();
  console.log("num_labels", num_labels);
  if (num_labels > 0){
    text = d3.select(node)
             .select(".label")
             .text();
    
    d3.select(node)
      .select(".label")
      .remove();
  }

  return text;
}

function addLabel(text, node){

  console.log("adding labels");

  // Adding an editable div outside
  let container = document.getElementById("d3_container");
  let labelText = checkLabelExisted(node);
  let label = document.createElement("div");

  labelText = labelText ? labelText : text;
  label.appendChild(document.createTextNode(labelText));
  label.style.position = "absolute";
  label.setAttribute("z-index", "1");
  label.setAttribute("contenteditable", "true");
  label.setAttribute("id", editId);

  temp_label_div = label;

  let cx = 0, cy = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let name = d3.select(node).attr("class").split(" ")[0];

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

  label.onkeypress = (e) => {
    console.log(e.key)
    console.log(e.shiftKey)
    switch(e.key){
      case "Enter":
        if (e.shiftKey) {
          document.execCommand('insertHTML', false, '<br>');
        }
        else {
          var txt = label.textContent;
          console.log("txt", txt);
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
                  .attr("text-anchor", "middle")
                  .attr("x", cx+"px")
                  .attr("y", cy+"px")
                  .attr("font-family", "Helvetica")
                  .text(txt)
                  .classed("label", true)
                  .attr("id", d3.select(node).attr("id")+"_text")
          // Remove the outside editable div
          label.remove();
          temp_label_div = null;
        }
        break;
      default:
        if (name === "node") {
          scaleNode(label, node, cx, cy)
        }
      break;
    }
  }

  container.appendChild(label);
  let labelSize = document.getElementById(editId).getBoundingClientRect(); 
  console.log(labelSize);
  let labelLeft = cx - labelSize.width / 2;
  let labelTop = cy - labelSize.height / 2;
  label.style.left = labelLeft + "px";
  label.style.top = labelTop + "px";
}

function scaleNode(label, node, cx, cy) {
  let labelSize = document.getElementById(editId).getBoundingClientRect(); 
  let labelLeft = cx - labelSize.width / 2;
  let labelTop = cy - labelSize.height / 2;
  label.style.left = labelLeft + "px";
  label.style.top = labelTop + "px";

  let nodeRep = node.children[0];

  if (d3.select(nodeRep).attr("r") <= MAX_RADIUS) {
    if (labelSize.width > d3.select(nodeRep).attr("r") * 2 - 12) {
      d3.select(nodeRep)
        .attr("r", labelSize.width / 2 + 6);
    }
  } 
  else {
    d3.select(label)
      .attr("max", d3.select(nodeRep).attr("r") * 2 - 12);
  }
}