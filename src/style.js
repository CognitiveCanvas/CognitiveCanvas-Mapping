var pink = "rgba(255, 130, 159, 0.2)";
var green = "rgba(61, 255, 152, 0.2)";
var yellow = "rgba(255, 246, 89, 0.2)";

var greenBorder = "#2E8429";
var yellowBorder = "#FBA80E";
var pinkBorder = "#C82570";

var current_font_size = 15;

var FONT_NORMAL = 100;
var FONT_BOLD = 700;

function setColor(color) {
  logColorChanges("fill", color);
  d3.selectAll(".selected .node-rep")
    .style("fill", color);
  d3.selectAll(".selected .link-rep")
    .style("stroke", color);
}

function setBorderColor(color) {
  logColorChanges("border", color);
  d3.selectAll(".selected .node-rep")
    .style("stroke", color);
}

function increaseLabelFontSize() {
  logFontChanges(current_font_size, current_font_size + 2);
  current_font_size = current_font_size + 2;
  d3.selectAll(".selected .label")
    .style("font-size", current_font_size);
}


function decreaseLabelFontSize() {
  logFontChanges(current_font_size, current_font_size - 2);
  current_font_size = current_font_size - 2;
  d3.selectAll(".selected .label")
    .style("font-size", current_font_size);
}


function toggleLabelFontItalics() {
  current_style = d3.select(".selected .label")
    .style("font-style");
  //console.log(current_style)
  let italicized;
  if (current_style != 'italic') {
    italicized = true;
    d3.selectAll(".selected .label")
        .style("font-style", "italic");
  } else {
    italicized = false;
    d3.selectAll(".selected .label")
      .style("font-style", "normal");
  }
  logLabelToggle("italicized", italicized);
}


function toggleLabelFontBold() {
  current_style = d3.select(".selected .label")
    .style("font-weight");
  //console.log(current_style)
  let bolded;
  if (current_style == "700") {
    bolded = true;
    d3.selectAll(".selected .label")
      .style("font-weight", FONT_NORMAL);
  } else {
    bolded = false;
    d3.selectAll(".selected .label")
      .style("font-weight", FONT_BOLD);
  }
  logLabelToggle("bolded", bolded);
}

function setLabelColor(color) {
  logColorChanges("label", color);
  current_style = d3.selectAll(".selected .label")
    .style("fill", color);
}