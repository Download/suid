require.config({
	baseUrl: '../dist',
	paths: {
		'suid': './suid.min',
	}
});
define(['suid'], function(Suid){
	QUnit.test("AMD Module Compliance Test", function( assert ) {
		assert.ok(Suid !== undefined, 'Suid is defined');
		assert.ok(typeof Suid === 'function', 'Suid is a function');
		assert.ok(window.Suid === undefined, 'global Suid is NOT defined');
	});
});

