var clientId, webstrateId;

var canvas = document.getElementById("canvas");

// constants for data.js
var DATA_COLLECTION = "data-collection";
var DEFAULT_STYLE = "default-style-data";
var SPATIAL_LAYOUT = "spatial-layout-data";
var SPATIAL_LAYOUT_DP = "spatial-layout";

//Node and label size
var DEFAULT_NODE_SIZE = [100, 100];
var DEFAULT_SHAPE_SIZES = {
  'rectangle': [100, 50],
  'circle': [100,100],
  'diamond':[100,100]
};
var MAX_RADIUS = 60;
var LABEL_INPUT_PADDING = 1;
var NODE_SHAPES = ["rectangle", "circle", "diamond"];

var WEBSTRATES_URL_PREFIX = "http://webstrates.ucsd.edu/";

//Constants for traversing nodes on map using arow keys
var RIGHT_MIN_ANGLE = -45;
var RIGHT_MAX_ANGLE = 45;
var UP_MIN_ANGLE = -45;
var UP_MAX_ANGLE = 135;
var LEFT_MIN_ANGLE = 135;
var LEFT_MAX_ANGLE = -135;
var DOWN_MIN_ANGLE = -135;
var DOWN_MAX_ANGLE = -45;

//Distances and directions for translating the canvas by the arrow keys
var ARROW_DIST = 10;
var ARROW_TRANSLATES = {
	"ArrowUp" : 	{ x: 0, 				y: 1 * ARROW_DIST },
	"ArrowRight" : 	{ x: -1 * ARROW_DIST, 	y: 0 },
	"ArrowDown" : 	{ x: 0, 				y: -1 * ARROW_DIST },
	"ArrowLeft" : 	{ x: 1 * ARROW_DIST, 	y: 0}
};

//Temporary Variables
var source_node = null;
var dragged_object = null;
var dragStartPos = null;

var temp_label_div = null;
var drag_line = null; 
var hoveredEle = null;
var isPinning = false;

//Interaction counters
var mouseUp = 0;
var mouseDown = 0;

var DRAG_TOLERANCE = 5;

//Constants for Uploading Images and pinning to them
var IMG_MAX_SIZE = [1000, 1000];

//UI Constants
var INITIAL_UI_PADDING = 30;

var FONT_NORMAL = 100;
var FONT_BOLD = 700;

var defaultRadius = 40;
var defaultShape = "circle";
var defaultColor = "rgba(46, 127, 195, 0.1)";

var addWindowOpen = false;
var original_color = null;

// drag_line & source_node are stored as html element

var quickAddDist = 10 + MAX_RADIUS;

var DASH_ARRAY_VALUES = {
	"solid": "0",
	"dashed": "9 6",
	"none": "0 1"
}

/**
 * An object containing all the colors and color groups from the theme.  It
 * also has a getter that will return an array of hex color codes for a color
 * group.
 * @getter {[String]} colorGroup - Takes in a {String} groupname and returns
 *         						   an array of color hex strings from that
 *         						   group
 */
var THEME_COLORS = {
	colors: { 
		red: "#E68570", purple: "#CC6686", blue: "#5884B3", green: "#9DBE59",
		yellow: "#E5CF6C", black: "#000000", geisel: "#747678", 
		darkGrey: "#ACADAE", june: "#D3D4D4", lightGrey: "#EDEEEE", 
		white: "#FFFFFF", sea: "#006A96", sun: "#FFCD00", grass: "#6E963B", 
		night: "#182B49"
	},
	colorGroups: {
		surfaces: ["geisel", "darkGrey", "june", "lightGrey", "white"],
		brand: ["sea"],
		accents: ["sun", "grass", "night", "black"],
		mapElements : ["red", "purple", "blue", "green", "yellow", "darkGrey"],
		text: ["black", "darkGrey", "white"]
	}
};

function getColorGroup(groupName){
	let colorsInGroup = [];
	THEME_COLORS.colorGroups[groupName].forEach( (colorName)=>{
		colorsInGroup.push(THEME_COLORS.colors[colorName]);
	});
	return colorsInGroup;
}

var NODE_TEMPLATE = {
  'label': "Node Name",
  'note': false,
  'position': {x: 50, y: 50},
  'scale': {x:1, y: 1},
  'groupId': null,
  'reps': {
    'mapping':{
      'elements': {
        'node' : {
          'shape': "rectangle",
          'repSize': [100, 50],
          'style': {
            'node-rep':{
              'fill': THEME_COLORS.colors.june,
              'stroke': "none"
            },
            'label': {
            }
          }
        }
      }
    }
  }
}