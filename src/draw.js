function redraw() {
  console.log("here");
  let nodeElements = d3.select(canvas)
                       .selectAll(".node")
                       .data(nodes);
  //update existing nodes
  
  //Append new
  nodeElements.enter()
       .append("g")
       .attr("class", "node")
       .attr("id", n => n.id)
       .attr("transform", n => "translate("+ n.x+","+ n.y+")")
       .append("circle")
       .attr("class", "node-rep")
       .style("fill", n => n.color)
       .style("z-index", 1)
       .attr("r", n => n.radius)
       .attr("cx", 0)
       .attr("cy", 0)
       .attr("id", n => n.id)
       .attr("xmlns", "http://www.w3.org/2000/svg");

  //Remove deleted
  nodeElements.exit()
       .remove();
}