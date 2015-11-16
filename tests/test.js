QUnit.test('Availability Test', function(assert) {
	assert.ok(typeof Suid === 'function', 'Suid is defined and is a function');
	var suid = new Suid();
	assert.ok(suid, 'suid created with Suid() is defined');
	assert.ok(suid.value !== undefined, 'suid has a value property');
	assert.ok(suid.value === 0, 'suid value property is correct');
});

QUnit.test('Constructor Test', function(assert) {
	var suid = new Suid(10);
	assert.ok(suid.value === 10, 'Suid constructed with number argument has correct value');
	var suid2 = Suid(10);
	assert.ok(suid2.value === 10, 'Suid constructed without new keyword has correct value');
	var suid3 = new Suid('a');
	assert.ok(suid3.value === 10, 'Suid constructed with string argument has correct value');
	var suid4 = new Suid(suid3);
	assert.ok(suid4.value === 10, 'Suid constructed with string argument has correct value');
});

QUnit.test('Conversion Test', function(assert) {
	var suid = Suid(1903154);
	assert.ok(suid.toString() === '14she', 'Suid correctly converted to base-36');
	var suid2 = Suid('14she');
	assert.ok(suid2.value === 1903154, 'Suid correctly converted from base-36');
});

QUnit.test('Comparison Test', function(assert) {
	var suid = new Suid(1903154);
	var suid2 = Suid('14she');
	assert.ok(suid.equals(suid2), 'Suids correctly considered equal');
	var suidGreater = Suid(1903155);
	assert.ok(suidGreater.compare(suid) > 0, 'Suid correctly considered greater');
	var suidLess = Suid(1903153);
	assert.ok(suidLess.compare(suid) < 0, 'Suid correctly considered less');
});
