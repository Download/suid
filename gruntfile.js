module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	
	grunt.initConfig({
		version: grunt.file.readJSON('package.json').version,
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			options : {
				jshintrc : '.jshintrc'
			},
			all: [ 'src/suid.js' ]
		},

		uglify: {
			options:{
				banner : '/*! [Suid <%= version %>](http://download.github.io/suid) copyright 2015 by [Stijn de Witt](http://StijnDeWitt.com), some rights reserved. Licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) */',
				mangle: {
					except: ['Suid', 'u','m','d']
				},
				sourceMap: true
			},
			admin: {
				files: {
					'dist/suid.min.js': [ 'src/suid.js']
				}
			}
		},

		jsdoc : {
			dist : {
				src: ['src/*.js', 'test/*.js'],
				options: {
					destination: 'doc',
					template : "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template",
					configure: "node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/jsdoc.conf.json"
				}
			}
		},
		
	});

	grunt.registerTask( 'default', [
		'jshint',
		'uglify',
		'jsdoc'
	] );

	grunt.registerTask( 'dev', [
		'jshint',
		'uglify',
		'jsdoc'
	] );
};