var socketio = require("socket.io");
var util = require("util");
var nomnom = require("nomnom");
var _ = require("lodash");
var packageJSON = require("./package.json");
// TODO: How should this handle multiple plugs in the same namespace? Should it be alowed?

var config = null;
var PowerStrip = (function() {
	var plugs = { };
	var io = null;

	/**
	 * @typedef {Object} SocketIoOptions
	 * @property {boolean} serveClient
	 * @property {String} path
	 */

	/**
	 * A list of plugs to add. Can be either an object, where each key is
	 * the namespace for the plug and the value is an object containing
	 * the name of the plug and an options object. Or it can be an Array
	 * of Arrays, where the first value is the namespace the second is the
	 * plug name and the third is an options object.
	 * @typedef {(Object|Array)} PlugList
	 * @property {String} namespace
	 * @property {(String|Object)} plug
	 * @property {Object} options
	 */

	/**
	 * @typedef {Object} PowerStripOptions
	 * @property {Object} [server] - http server to attach Socket.io to. This option will take precedence over port.
	 * @property {Number} [port] - Port number for Socket.io to listen to.
	 * @property {SocketIoOptions} [serverOptions] - Options to be passed to Socket.io.
	 * @property {PlugList} [plugs]
	 */

	/**
	 * Initialize the Power Strip with the given options object
	 * @param {PowerStripOptions} [options] - Options for initializing the Power Strip
	 */
	function init(options) {
		options = (options || {});
		if (options.server) {
			io = new socketio(options.server, options.serverOptions);
		} else if (options.port) {
			io = new socketio(options.port, options.serverOptions);
		} else {
			io = new socketio(options.serverOptions);
		}
		_.forEach((options.plugs || []), function(val, key) {
			var plug, options;
			if (util.isArray(val)) {
				key = val[0];
				plug = val[1];
				options = (val[2] || {});
			} else {
				plug = val.plug;
				options = val.options;
			}
			addPlug(key, plug, options);
		});
	}

	/**
	 *
	 * @param {Object} ns
	 * @param {Object} plugname
	 * @param {Object} [options]
	 */
	function addPlug(ns, plugname, options) {
		var plug = null;
		try {
			plug = require(plugname);
		} catch (e) {
			// TODO: Should we throw an error or is false enough?
			return false;
		}
		ns = (/^\//.test(ns)) ? "/" + ns : ns;
		var namespace = io.of(ns);
		plug.init(namespace, options);
		plug.start();
		plugs[ns] = plug;
		return true;
	}

	/**
	 *
	 * @param {Object} ns
	 */
	function removePlug(ns) {
		ns = (/^\//.test(ns)) ? "/" + ns : ns;
		var plug = plugs[ns];
		if (plug) {
			plug.stop();
			delete plugs[ns];
		}
		return true;
	}

	return {
		init : init,
		addPlug : addPlug,
		removePlug : removePlug
	};

})();

exports = PowerStrip;

// Command line or Module?
if (require.main === module) {
	var opts = nomnom.option("config", {
		abbr : "c",
		"default" : "./config.json",
		metavar : "FILE",
		position : 0,
		help : "Config file"
	}).option('version', {
		abbr : "v",
		flag : true,
		help : "print version and exit",
		callback : function() {
			return packageJSON.version;
		}
	}).option('watch', {
		abbr : "w",
		flag : true,
		help : "Watch config file for changes",
		callback : function() {
			return "Watch is not yet implemented.";
		}
	}).parse();

	try {
		config = require(opts.config);
	} catch(e) {
		console.error("Cannot find config file: %s", opts.config);
		process.exit(1);
	}
	// console.log(config);
	PowerStrip.init(config);
}
