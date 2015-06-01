module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	
	grunt.initConfig({
		version: grunt.file.readJSON('package.json').version,
		pkg: grunt.file.readJSON('package.json'),

		// notify cross-OS - see https://github.com/dylang/grunt-notify
		notify: {
			js: {
				options: {
					title: 'JS checked and minified',
					message: 'JS is all good'
				}
			},
			dist: {
				options: {
					title: 'Project Compiled',
					message: 'All good'
				}
			}
		},

		// chech our JS
		jshint: {
			options : {
				jshintrc : '.jshintrc'
			},
			all: [ 'src/suid.js' ]
		},

		// minify JS
		uglify: {
			options:{
				banner : '/*! [Suid <%= version %>](http://download.github.io/suid) copyright 2015 by [Stijn de Witt](http://StijnDeWitt.com), some rights reserved. Licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) */',
				mangle: {
					except: 'Suid'
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
		
		// watch it live
		watch: {
			js: {
				files: [ 'src/*.js' ],
				tasks: [
					'jshint',
					'uglify',
					'notify:js'
				],
			}
		}

	} ); // end init config

	/**
	 * Default tasks
	 */
	grunt.registerTask( 'default', [
		'jshint',
		'uglify',
		'jsdoc',
		'notify:dist'
	] );

	/**
	 * Dev tasks
	 *
	 * The main tasks for development
	 */
	grunt.registerTask( 'dev', [
		'jshint',
		'uglify',
		'jsdoc',
		'watch'
	] );
};