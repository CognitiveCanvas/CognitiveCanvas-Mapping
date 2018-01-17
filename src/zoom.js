var panning = 1;

var svg = d3.select(".canvas");
  	.call(d3.behavior.zoom()
  	.on("zoom", function () {
      	svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
      	panning = panning+1;
  	})
    .on("zoomstart", function() {
      panning=0;
    }))