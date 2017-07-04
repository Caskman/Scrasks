module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-screeps');

    var credentials = grunt.file.readJSON('private.json')

    grunt.initConfig({
        screeps: {
            options: credentials,
            dist: {
                src: ['src/*.js']
            }
        }
    })

    grunt.registerTask('test', 'test some stuff', () => {
        grunt.log.write("whattup\n").ok()
    })

    grunt.registerTask('default', ['screeps'])
}