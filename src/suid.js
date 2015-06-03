/**! 
 * Distributed Service-Unique IDs that are short and sweet.
 * 
 * http://download.github.io/suid
 * 
 * @Author Stijn de Witt (http://StijnDeWitt.com)
 * @Copyright (c) 2015. Some rights reserved. 
 * @License CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) 
 */
/* jshint browser:true, shadow:true, devel:true */
/** @namespace ws.suid */
(function(){
	'use strict';
	
	var PREFIX = 'Suid:',
		POOL = 'suidpool', 
		DETECT = 'suiddetect',
		
		/** 
		 * The alphabet used when serializing to base-32.
		 * 
		 * <big><code>'0123456789acdefghijkmnprstuvwxyz'</code></big>
		 * 
		 * @constant
		 * @memberof! ws.suid
		 * @see {@link ws.suid.Suid#toBase32}
		 * @see {@link ws.suid.Suid#toString}
		 */
		ALPHABET = '0123456789acdefghijkmnprstuvwxyz',
		
		/** 
		 * The replacement symbols used during compression.
		 * 
		 * <big><code>[['b','00'], ['l','01'], ['o','02'], ['q','03']]</code></big>
		 * 
		 * @constant
		 * @memberof! ws.suid 
		 * @see ws.suid.Suid.compress
		 * @see ws.suid.Suid.decompress
		 */
		REPLACEMENT_SYMBOLS = [['b','00'], ['l','01'], ['o','02'], ['q','03']],
		LEGAL_CHARS = ALPHABET + 'bloq';
	
	var localStorageSupported = (function(ls){try{ls.setItem(DETECT, DETECT);ls.removeItem(DETECT);return true;}catch(e){return false;}})(localStorage),
		log = window.console && console.error,
		currentBlock,
		currentId,
		options = getOptions(),
		settings = {
			url: options.url,
			min: options.min || 2,
			max: options.max || 2
		};

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
	 *   <li>(possibly compressed) Base32 String</li>
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
	 * // call with a (possibly compressed) base-32 string argument
	 * var suid = new Suid('14ub');
	 * </pre></big>
	 * 
	 * @param value The Number or String value for the new Suid.
	 *              Only used when called as a constructor.
	 * 
	 * @class Suid
	 * @memberof ws.suid 
	 */
	var Suid = (function() {
		
		function Suid(value) {
			if (value === undefined) {return Suid.next();}
			if (typeof value === 'string') {value = Suid.fromString(value);}
			this.value = value instanceof Suid ? value.value : value;
			Number.call(this, this.value);
		}
		
		Suid.prototype = Object.create(Number.prototype);
		
		/** 
		 * Converts this suid to string.
		 * 
		 * @return The (possibly compressed) base-32 string.
		 * 
		 * @memberof! ws.suid.Suid#
		 * @see ws.suid.Suid#toBase32
		 * @see ws.suid.Suid.compress
		 */
		Suid.prototype.toString = function Suid_toString() {
			return Suid.compress(this.toBase32()); 
		};
		
		Suid.prototype.toJSON = function Suid_toJSON() {
			return PREFIX + this.toString();
		};
		
		/**
		 * Converts this suid to a base-32 string.
		 * 
		 * @return The uncompressed base-32 string.
		 *  
		 * @memberof! ws.suid.Suid#
		 * @see ws.suid.Suid#toString
		 * @see ws.suid.Suid.compress
		 */
		Suid.prototype.toBase32 = function Suid_toBase32() {
			var value = this.valueOf();
			var result='', tmp='';
			for (var i=0; i<11; i++) {
				var idx = value & 0x1f;
				if (! idx) {
					tmp += '0';
				} else {
					result = ALPHABET.charAt(idx) + tmp + result;
					tmp = '';
				}
				value = value / 32;
			}
			return result;
		};
		
		Suid.prototype.toJSON = function Suid_toJSON() {
			return 'Suid:' + this.toString();
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
		 * @param str The (possibly compressed) base-32 string.
		 * @return The newly created suid.
		 * 
		 * @memberof! ws.suid.Suid
		 * @see ws.suid.Suid.fromBase32
		 * @see ws.suid.Suid.decompress
		 */
		Suid.fromString = function Suid_fromString(str) {
			return Suid.fromBase32(Suid.decompress(str));
		};
		
		/**
		 * Creates a new suid from the given base-32 string.
		 * 
		 * @param str The uncompressed base-32 string.
		 * @return The newly created suid.
		 * 
		 * @memberof! ws.suid.Suid
		 * @see ws.suid.Suid.fromString
		 * @see ws.suid.Suid.decompress
		 */
		Suid.fromBase32 = function Suid_fromBase32(str) {
			var result = 0;
			for (var i=0; i<str.length; i++) {
				var idx = ALPHABET.indexOf(str.charAt(i));
				result = result * 32 + idx;
			}
			return new Suid(result);
		};
		
		/**
		 * Creates a new suid from the given JSON.
		 * 
		 * @param json The JSON string.
		 * @return The newly created suid.
		 * 
		 * @memberof! ws.suid.Suid
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
		 * @see ws.suid.Suid.fromString
		 * @see ws.suid.Suid.decompress
		 */
		Suid.looksValid = function Suid_looksValid(value) {
			if (!value) {
				return false;
			}
			var len = value.length;
			if ((!len) || (len > 11)) {
				return false;
			}
			if ((len === 11) && (ALPHABET.indexOf(value.charAt(0)) > 8)) {
				return false;
			}
			for (var i=0; i<len; i++) {
				if (LEGAL_CHARS.indexOf(value.charAt(i)) === -1) {
					return false;
				}
			}
			return true;
		};
		
		/**
		 * Indicates whether the given JSON value looks like valid suid.
		 * 
		 * If this method returns true, this only indicates that the
		 * JSON *might* be a valid suid. There are no guarantees.
		 * 
		 * @param str The JSON string.
		 * @return True if it looks valid, false otherwise.
		 * 
		 * @memberof! ws.suid.Suid
		 * @see ws.suid.Suid.looksValid
		 * @see ws.suid.Suid.fromJSON
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
		 * @see ws.suid.Suid.looksValidJSON
		 * @see ws.suid.Suid.fromJSON
		 */
		Suid.revive = function Suid_revive(key, value) {
			if (Suid.looksValidJSON(value)) {
				return Suid.fromJSON(value);
			}
			return value;
		};
		
		
		/**
		 * Compresses the given string.
		 * 
		 * @param str The uncompressed base-32 string.
		 * @return The compressed base-32 string.
		 * @memberof! ws.suid.Suid
		 * @see ws.suid.Suid.decompress
		 */
		Suid.compress = function Suid_compress(str) {
			for (var i=0, replacement; replacement=REPLACEMENT_SYMBOLS[i]; i++) {
				str = str.replace(new RegExp(replacement[1], 'g'), replacement[0]);
			}
			return str;
		};
		
		/**
		 * Decompresses the given string.
		 * 
		 * @param str The compressed base-32 string.
		 * @return The uncompressed base-32 string.
		 * 
		 * @memberof! ws.suid.Suid
		 * @see ws.suid.Suid.decompress
		 */
		Suid.decompress = function Suid_decompress(str) {
			for (var i=0, replacement; replacement=REPLACEMENT_SYMBOLS[i]; i++) {
				str = str.replace(new RegExp(replacement[0], 'g'), replacement[1]);
			}
			return str;
		};
		
		/**
		 * Generates the next suid.
		 * 
		 * @return The next new suid.
		 * 
		 * @memberof! ws.suid.Suid
		 */
		Suid.next = function Suid_next() {
			if (! currentBlock) {
				Server.fetch();
				var pool = Pool.get();
				if (pool.length === 0) {
					throw new Error('Unable to generate IDs. Suid block pool exhausted.');
				}
				currentId = 0;
				currentBlock = pool.splice(0, 1)[0];
				Pool.set(pool);
			}
			
			var result = currentBlock + currentId * 4;
			currentId++;
			if (currentId > 255) {
				currentBlock = null;
			}
			return new Suid(result);
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
			started = 0;
			var pool = Pool.get();
			pool.push(JSON.parse(text));
			Pool.set(pool);
		}
		
		function handleError(status, request) {
			// status code 5xx ? possibly recoverable.
			switch(status) {
				case 500: // Internal server error... hopefully a glitch? retry.
				case 502: // Bad Gateway... hopefully a glitch? retry.
				case 503: // Service unavailable... hopefully temporary? retry.
				case 504: // Gateway Timeout... hopefully temporary? retry.
					retry(request);
					break;
				default: // unrecoverable? give up 
					if (log) {console.error('Unable to fetch suid data from server. ', request, status);}
					retries = 0;
					started = 0;
			}
		}
		
		function retry(request) {
			if (retries === 0) {
				started = 0;
				if (log) {console.error('Giving up fetching suid data after 5 attempts to fetch from server url: ' + settings.url);}
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
			if (currentId > 100) { // half of current block left
				if (after > 30000) {
					after = 30000; // 0.5 min
				}
			}
			if (! currentBlock) { // completely out
				if (after > 1000) {
					after = 1000; // 1 sec
				}
			}
			
			setTimeout(function(){
				ajax(settings.url, {blocks: settings.max - Pool.get().length}, handleSuccess, handleError);
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
				if (retries && ((new Date().getTime() - started < 5000) || 
								(currentId && (currentId < 100)))) {
					return; // already fetching and still recent or not urgent
				} 
				var pool = Pool.get();
				if (pool.length < settings.min) {
					retries = 3;
					started = Date.now();
					ajax(settings.url, {blocks: settings.max - pool.length}, handleSuccess, handleError);
				}
			}
		};
	})();

	function getOptions() {
		var options = {};
		var script = document.querySelector('script[data-suid-server]');
		if (! script) {
			if (log) {console.error('Attribute `data-suid-server` not found on any script element. Unable to fetch suids from the server.');}
			return options;
		}
		var url = script.getAttribute('data-suid-server'),
			attr = script.getAttribute('data-suid-options');
		
		if (attr) {
			try {
				options = JSON.parse(attr.split('\'').join('"'));
			}
			catch(error) {
				if (log) {console.error('Unable to parse suid options as JSON: \'' + attr + '\'. Error was: ', error);}
			}
		}
		options.url = url;
		return options;
	}
	
	// Fetch initial data from the server if needed
	Server.fetch();
	
	// EXPOSE
	window.Suid = Suid;
})();
