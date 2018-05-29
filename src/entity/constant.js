// constants for data.js
var DATA_COLLECTION = "data-collection";
var DEFAULT_STYLE = "default-style-data";
var SPATIAL_LAYOUT = "spatial-layout-data";
var SPATIAL_LAYOUT_DP = "spatial-layout";

//Node and label sizez
var MAX_RADIUS = 60;
var LABEL_INPUT_PADDING = 1;


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

var DRAG_TOLERANCE = 5;

//Constants for Uploading Images and pinning to them
var IMG_MAX_SIZE = [1000, 1000];