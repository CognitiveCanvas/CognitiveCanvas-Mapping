/* LOAD JAVASCRIPT */
require('./entity/constant.exec.js');
require('./main.js');
require('./init.js');
require('./nodes.js');
require('./request_handler.js');
require('./links.js');
require('./data_interpreter.js');
require('./draw.js');
require('./data.exec.js');
require('./default-style.js');
require('./layout.js');
require('./style.js');
require('./label.js');
require('./selections.js');
require('./pinning.js');
require('./tool_panel.js');
require('./minimap.js');
require('./logger.js');
require('./undo.js');
require('./transformer_extensions.js');
require('./hammer_events.js');
require('./svg_effects.js');
require('./redo.js');
require('../external/transformer.demangled.min.js');


/* LOAD EXTERNAL LIBRARIES */
const Snap = require(`imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg-min.js`);

/* LOAD CSS */
import '../styles/variables.css';
import '../styles/main.css';
import '../styles/tool_panel.css';
import '../styles/drawing.css';
import '../styles/context-menu.css';
import '../styles/minimap.css';
