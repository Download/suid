/**! 
 * Distributed Service-Unique IDs that are short and sweet.
 * 
 * http://download.github.io/suid
 * 
 * @Author Stijn de Witt (http://StijnDeWitt.com)
 * @Copyright (c) 2015. Some rights reserved. 
 * @License CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) 
 */
/** @namespace ws.suid */
(function (u,m,d) {
    if (typeof define === 'function' && define.amd) {define(d);} 
    else if (typeof exports === 'object') {module.exports = d();} 
    else {u[m] = d();}
}(this, 'Suid', function(){
	'use strict';
	
	var PREFIX = 'Suid:',
		SHARDSIZE = 4,
		IDSIZE = 32,
		THROTTLE = 5000,
		POOL = 'suidpool', 
		DETECT = 'suiddetect',
		
		/** 
		 * The alphabet used when serializing to base-36.
		 * 
		 * <big><code>'0123456789abcdefghijklmnopqrstuvwxyz'</code></big>
		 * 
		 * @constant
		 * @memberof! ws.suid
		 */
		ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
	
	var localStorageSupported = (function(ls){try{ls.setItem(DETECT, DETECT);ls.removeItem(DETECT);return true;}catch(e){return false;}})(localStorage),
		log = ('console' in window) && console.error && console.warn,
		currentBlock,
		currentId,
		readyListeners = [],
		config = getConfig();

	/**
	 * Distributed Service-Unique IDs that are short and sweet.
	 *  
	 * <p>When called without arguments, generates a new Suid.</p> 
	 * 
	 * <p>When called with an argument, constructs a new Suid based
	 * on the given value, which may be either a:</p>
	 * 
	 * <ul>
	 *   <li>Number</li>
	 *   <li>Base-36 String</li>
	 *   <li>Other Suid</li>
	 * </ul>
	 * 
	 * <p><b>Examples</b></p>
	 * 
	 * <big><pre>
	 * // call without arguments to get the next id
	 * var id1 = Suid();  // or,
	 * var id2 = new Suid();
	 * // this is equivalent to
	 * var id3 = Suid.next();
	 * 
	 * // call with a Number argument
	 * var ZERO = Suid(0);
	 * var ONE = new Suid(1);
	 * 
	 * // call with a base-36 string argument
	 * var suid = new Suid('14she');
	 * </pre></big>
	 * 
	 * @param value The Number or String value for the new Suid.
	 *              Only used when called as a constructor.
	 * 
	 * @class Suid
	 * @memberof! ws.suid
	 */
	var Suid = (function() {
		
		function Suid(value) {
			if (! (this instanceof Suid)) {return new Suid(value);}
			if (value === undefined) {value = 0;}
			if (typeof value === 'string') {value = Suid.fromString(value);}
			this.value = value instanceof Suid ? value.value : value;
			Number.call(this, this.value);		}
		
		Suid.prototype = Object.create(Number.prototype);
		Suid.prototype.constructor = Suid;
		
		/**
		 * Constant for a suid with a value of zero (0).
		 */
		Suid.NULL = Suid(0);
		
		/** 
		 * Converts this suid to a base-36 string.
		 * 
		 * @return The base-36 string.
		 * 
		 * @memberof! ws.suid.Suid#
		 */
		Suid.prototype.toString = function Suid_toString() {
			return this.value.toString(36); 
		};
		
		/** 
		 * Converts this suid to a JSON string.
		 * 
		 * The returned String will be of the format <code>'PREFIX:base-36'</code>,
		 * where <code>PREFIX</code> is the string <code>'Suid:'</code> and 
		 * <code>base-36</code> is the suid in base-36. 
		 * 
		 * For example: <code>'Suid:14she'</code>.
		 * 
		 * @return The JSON string.
		 * 
		 * @memberof! ws.suid.Suid#
		 * 
		 * @see {@link ws.suid.Suid.PREFIX}
		 * @see {@link ws.suid.Suid.fromJSON}
		 * @see {@link ws.suid.Suid.looksValidJSON}
		 * @see {@link ws.suid.Suid.revive}
		 */
		Suid.prototype.toJSON = function Suid_toJSON() {
			return PREFIX + this.toString();
		};
		
		/**
		 * Returns the underlying value of this suid.
		 * 
		 * @return The underlying primitive Number value.
		 * 
		 * @memberof! ws.suid.Suid#
		 */
		Suid.prototype.valueOf = function Suid_valueOf() {
			return this.value;
		};
		
		/**
		 * Creates a new suid from the given string.
		 * 
		 * @param str The base-36 string.
		 * @return The newly created suid.
		 * 
		 * @memberof! ws.suid.Suid
		 * @see {@link ws.suid.Suid#toString}
		 */
		Suid.fromString = function Suid_fromString(str) {
			return new Suid(parseInt(str, 36));
		};
		
		/**
		 * Creates a new suid from the given JSON.
		 * 
		 * @param json The JSON string.
		 * @return The newly created suid.
		 * 
		 * @memberof! ws.suid.Suid
		 * @see {@link ws.suid.Suid#toJSON}
		 */
		Suid.fromJSON = function Suid_fromJSON(json) {
			if (json === null) {return null;}
			if (!json.indexOf(PREFIX)) {json = json.substr(PREFIX.length);}
			return Suid.fromString(json);
		};
		
		/**
		 * Indicates whether the given string value looks like a valid suid.
		 * 
		 * If this method returns true, this only indicates that it *might*
		 * be a valid suid. There are no guarantees.
		 * 
		 * @param str The JSON string.
		 * @return True if it looks valid, false otherwise.
		 * 
		 * @memberof! ws.suid.Suid
		 * @see {@link ws.suid.Suid.fromString}
		 */
		Suid.looksValid = function Suid_looksValid(value) {
			if (!value) {
				return false;
			}
			var len = value.length;
			if ((!len) || (len > 11)) {
				return false;
			}
			if ((len === 11) && (ALPHABET.indexOf(value.charAt(0)) > 2)) {
				return false;
			}
			for (var i=0; i<len; i++) {
				if (ALPHABET.indexOf(value.charAt(i)) === -1) {
					return false;
				}
			}
			return true;
		};
		
		/**
		 * Indicates whether the given JSON value looks like a valid suid.
		 * 
		 * If this method returns true, this only indicates that the
		 * JSON *might* be a valid suid. There are no guarantees.
		 * 
		 * @param str The JSON string.
		 * @return True if it looks valid, false otherwise.
		 * 
		 * @memberof! ws.suid.Suid
		 * @see {@link ws.suid.Suid.looksValid}
		 * @see {@link ws.suid.Suid.fromJSON}
		 */
		Suid.looksValidJSON = function Suid_looksValidJSON(json) {
			if (! (json && json.length)) {
				return false;
			}
			if (json.indexOf(PREFIX) === -1) {
				return false;
			}
			return Suid.looksValid(json.substr(PREFIX.length));
		};

		/**
		 * Reviver function to be used i.c.w. JSON.parse.
		 * 
		 * Example:
		 * 
		 * <big><pre>
		 * var object = {
		 *   id: Suid(),
		 *   name: 'Example'
		 * };
		 * var json = JSON.stringify(object); // json === '{"id":"Suid:19b","name":"Example"}'
		 * var obj = JSON.parse(object, Suid.revive); // obj.id instanceof Suid === true
		 * 
		 * </pre></big>
		 * 
		 * @param key The name of the property to be revived.
		 * @param value The value of the property to be revived.
		 * @returns A suid if the JSON looks like a valid suid, the original value otherwise.
		 * 
		 * @memberof! ws.suid.Suid
		 * @see {@link ws.suid.Suid.looksValidJSON}
		 * @see {@link ws.suid.Suid.fromJSON}
		 */
		Suid.revive = function Suid_revive(key, value) {
			if (Suid.looksValidJSON(value)) {
				return Suid.fromJSON(value);
			}
			return value;
		};
		
		
		/**
		 * Generates the next suid.
		 * 
		 * @return The next new suid.
		 * 
		 * @memberof! ws.suid.Suid
		 */
		Suid.next = function Suid_next() {
			var pool = Pool.get();
			if ((pool.length < config.min) || ((!currentBlock && pool.length === config.min))) {
				if (config.server) {Server.fetch();}
				else if (log) {console.warn('No suid server configured. Please add the data-suid-server attribute to the script tag or call Suid.config before generating IDs.');}
			}
			if (! currentBlock) {
				if (pool.length === 0) {
					throw new Error('Unable to generate IDs. Suid block pool exhausted.');
				}
				currentId = 0;
				currentBlock = pool.splice(0, 1)[0];
				Pool.set(pool);
			}
			
			var result = currentBlock + currentId * SHARDSIZE;
			currentId++;
			if (currentId >= IDSIZE) {
				currentBlock = null;
			}
			return new Suid(result);
		};
		
		/**
		 * Configures the suid generator and gets the current config.
		 * 
		 * <p>This method can be used as an alternative for, or in addition to, specifying
		 * the configuration in the <code>data-suid-server</code> and <code>data-suid-options</code>
		 * script attributes.</p>
		 * 
		 * <p><b>Examples:</b></p>
		 * 
		 * <code><pre>
		 * // Assuming no config was set through script tag attributes...
		 * var config = Suid.config();       // config => {server:'', min:3, max:4}  (defaults)
		 * 
		 * Suid.config({
		 *     server: '/suid/suid.json',
		 *     min: 5,
		 *     max: 6
		 * });
		 * 
		 * var config = Suid.config();       // config => {server:'/suid/suid.json', min:5, max:6}
		 * 
		 * config = Suid.config({max: 8});   // config => {server:'/suid/suid.json', min:5, max:8}
		 * </pre></code> 
		 * 
		 * @return The current config after the given <code>cfg</code> object has been processed (if any).
		 * 
		 * @memberof! ws.suid.Suid
		 */
		Suid.config = function Suid_config(cfg) {
			if (cfg) {
				config.server = cfg.server || config.server;
				config.min = cfg.min || config.min;
				config.max = cfg.max || config.max;
			}
			Suid.ready();
			return cfg ? this : config;
		};
		
		/**
		 * Indicates if Suid is ready to generate IDs, attaches the given callback listener.
		 * 
		 * <p>This method can be used to find out whether Suid is ready to generate ID's, or
		 * to attach an event listener to the ready event. The given <code>callback</code> function
		 * is guaranteed to fire asynchronously, meaning this method will always return before
		 * the callback is fired. Due to this, this method may already return <code>true</code> even
		 * though the ready event hasn't fired yet.</p>
		 * 
		 * <p><b>Examples:</b></p>
		 * 
		 * <code><pre>
		 * if (Suid.ready()) {
		 *   // Suid is ready!
		 * } else {
		 *   // Suid is not ready yet...
		 * }
		 * 
		 * Suid.ready(function(){
		 *   // Suid is ready!
		 * });
		 * </pre></code>
		 * 
		 * @param callback The optional callback function that will be called once Suid is ready.
		 * @return <code>true</code> if Suid is ready, <code>false</code> otherwise.
		 */
		Suid.ready = function(callback) {
			var ready = !!config.server && Pool.get().length > 0;
			if (callback) {readyListeners.push(callback);}
			if (ready) {
				setTimeout(function(){
					for (var listener; listener=readyListeners.shift(); ) {
						listener();
					}
				}, 4);
			}
			else if (config.server) {
				Server.fetch();
			}
			return ready;
		};
		
		return Suid;
	})();

	var Pool = (function(){
		var pool = [];
		return {
			get: function() {
				if (localStorageSupported) {
					pool = Pool.from(localStorage.getItem(POOL));
				}
				return pool;
			},
			set: function(values){
				pool = values;
				if (localStorageSupported) {
					localStorage.setItem(POOL, Pool.to(pool));
				}
				return Pool;
			},
			from: function(str){
				var results = [];
				if (str) {
					var strings = str.split(',');
					for (var i=0, s; s=strings[i]; i++) {
						results.push(new Suid(s));
					}
				}
				return results;
			},
			to: function(obj){
				return obj.join(',');
			}
		};
	})();
	
	var Server = (function(){
		var retries = 0,
			started = 0;
		
		function handleSuccess(text) {
			retries = 0;
			var pool = Pool.get();
			pool.push(JSON.parse(text));
			Pool.set(pool);
			Suid.ready();
		}
		
		function handleError(status, request) {
			// status code 5xx ? possibly recoverable.
			switch(status) {
				case 500: // Internal server error
				case 502: // Bad Gateway
				case 503: // Service unavailable
				case 504: // Gateway Timeout
					retry(request);
					break;
				default: // unrecoverable? give up 
					if (log) {console.error('Unable to fetch suid data from server. ', request, status);}
					retries = 0;
			}
		}
		
		function retry(request) {
			if (retries === 0) {
				if (log) {console.error('Giving up fetching suid data from server: ' + config.server);}
				return;
			}
			
			retries--;
			var after = 300000; // 5 minutes
			var retryAfter = request.getResponseHeader('Retry-After');
			if (retryAfter) {
				after = parseInt(retryAfter, 10);
				if (! isNaN(after)) {
					after = after * 1000; // seconds to ms.
				}
			}
			// Is this urgent?
			if (! Pool.get().length) { // Pool is out of blocks
				if (after > 60000) {
					after = 60000; // 1 min
				}
			}
			if (currentId > (IDSIZE/2)) { // less than half of current block left
				if (after > 30000) {
					after = 30000; // 30 sec
				}
			}
			if (! currentBlock) { // completely out
				if (after > 2000) {
					after = 2000; // 2 sec
				}
			}
			
			setTimeout(function(){
				ajax(config.server, {blocks: config.max - Pool.get().length}, handleSuccess, handleError);
			}, after);
		}

		function ajax(url, data, success, error, sync) {
			var xhr = new XMLHttpRequest(), query = [], params, key; 
			for (key in data) {
				if (data.hasOwnProperty(key)) {
					query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
				}
			}
			params = query.join('&');
			xhr.open('get', url + (params ? (url.indexOf('?') !== -1 ? '&' : '?') + params : ''), !sync); 
			xhr.addEventListener('readystatechange', function(){ 
				if (this.readyState === 4) { 
					this.status === 200 ? success(this.responseText, this) : error(this.status, this);
				}
			}); 
			xhr.addEventListener('error', function () { 
				error(this, this.status); 
			}); 
			xhr.send(); 
		}

		return {
			fetch: function Server_fetch() {
				if (retries && ((new Date().getTime() - started < THROTTLE) || 
								(currentId && (currentId < (IDSIZE/2))))) {
					return; // already fetching and still recent or not urgent
				} 
				var pool = Pool.get();
				if (pool.length < config.min) {
					retries = 3;
					started = Date.now();
					ajax(config.server, {blocks: config.max - pool.length}, handleSuccess, handleError);
				}
			}
		};
	})();

	function getConfig() {
		var config = {server: '', min: 3, max: 4};
		var script = document.querySelector('script[data-suid-server]');
		if (! script) {script = document.querySelector('script[data-suid-options]');}
		if (! script) {return config;}

		var url = script.getAttribute('data-suid-server'),
			attr = script.getAttribute('data-suid-options'),
			options;
		if (attr) {
			try {
				options = JSON.parse(attr.split('\'').join('"'));
			}
			catch(error) {
				if (log) {console.error('Unable to parse suid options as JSON: \'' + attr + '\'. Error was: ', error);}
				return config;
			}
		}
		if (url) {config.server = url;}
		if (options && options.min) {config.min = options.min;}
		if (options && options.max) {config.max = options.max;}
		return config;
	}
	
	Suid.ready();
	
	// EXPOSE
	return Suid;
}));
