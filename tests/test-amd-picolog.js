require.config({
	baseUrl: '../dist',
	paths: {
		'picolog': 'https://cdn.rawgit.com/download/picolog/0.6.0/dist/picolog.min',
		'suid': './suid.min',
	},
	shim: {
		'suid': ['picolog']
	}
});
define(['picolog', 'suid'], function(log, Suid){
	QUnit.test("AMD Module Compliance Test", function( assert ) {
		assert.ok(Suid !== undefined, 'Suid is defined');
		assert.ok(typeof Suid == 'function', 'Suid is a function');
		assert.ok(window.Suid === undefined, 'global Suid is NOT defined');
		assert.ok(log !== undefined, 'log is defined');
		assert.ok(typeof log == 'object', 'log is an object');
		assert.ok(log.INFO, 'log is the Picolog log object');
		assert.ok(!window.log.INFO, 'global qUnit log object is NOT affected by picolog');
	});
});

