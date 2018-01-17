var temp_div = null;
/*
 * Adds an editable label outside the svg 
 * that gets deleted once enter key is pressed
 *
 * Copies the text into svg g tag 
 * as a non-editable text element. 
 */

/*
var temp_div = null 

    var addLabel = function(text, target){
        var cx = (d3.select(target).attr("cx"))
        var cy = (d3.select(target).attr("cy"))
        //console.log(cx)
        var svg = d3.select("#canvas") 
        var g = svg.selectAll("g") 
        var y = parseInt(cy)+15 

        d3.select(target.parentNode).append("text")
                .attr("x", cx)
                .attr("y", y)
                .text(text)
                .classed("blackText", true)
                .attr("id", d3.select(target.parentNode).attr("id")+"_text")

        // Add an outside sibling div that is editable
        temp_div = d3.select("body").append("div") 
        console.log(temp_div)
        temp_div.attr("contenteditable", "true") 
        temp_div.attr("position", "absolute") 
        temp_div.attr("z-index", 10) 
        temp_div.attr("idx", d3.select(target.parentNode).attr("id")+"_text")
        temp_div.style({
            "left":cx+"px",
            "top": cy+"px",
            "position": "absolute"
        }) 
        temp_div.text(text) 
        temp_div.on("keydown", ()=>{removeTemp()}) 
        d3.select("body").append(temp_div) 
    }
    var editing = true 


    function removeTemp (){
        if (d3.event.keyCode == 13){
            var temp_text = temp_div.text() 
            var inside_text_id = temp_div.attr("idx") 
            temp_div.remove() 
            d3.select("#"+inside_text_id).text(temp_text) 
        }
    }
*/


function addLabels(text, target){
  console.log('adding label')
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
  		var new_label = document.createElement("text");
  		new_label.innerHTML = text;

  		d3.select(target.parentNode).append("text")
                .attr("x", "-10px")
                .attr("y", "-10px")
                .text(text)
                .classed("blackText", true)
                .attr("id", d3.select(target.parentNode).attr("id")+"_text")
  		target.parentNode.appendChild(new_label);
  		label.remove();
  	}
  }
  container.appendChild(label)
  
}
