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
				banner : '/*! Suid <%= version %> | Stijn de Witt StijnDeWitt.com | CC0 1.0 Universal License | github.com/Download/suid */\n'
			},

			admin: {
				files: {
					'dist/suid.min.js': [ 'src/suid.js']
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
	 * Default task
	 */
	grunt.registerTask( 'default', [
		'jshint',
		'uglify',
		'notify:dist'
	] );

	/**
	 * Dev task
	 *
	 * The main tasks for development
	 */
	grunt.registerTask( 'dev', [
		'jshint',
		'uglify',
		'watch'
	] );
};