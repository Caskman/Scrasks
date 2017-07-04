module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-screeps');
    grunt.loadNpmTasks('grunt-babel')

    var credentials = grunt.file.readJSON('private.json')

    grunt.initConfig({
        screeps: {
            options: credentials,
            dist: {
                src: ['dist/*.js']
            }
        },
        babel: {
            options: {
                plugins: [
                    'transform-es2015-modules-commonjs'
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['*.js'],
                        dest: 'dist/'
                    }
                ]
            }
        },
    })

    // grunt.registerTask('test', 'test some stuff', () => {
    //     grunt.log.write("whattup\n").ok()
    // })

    // grunt.registerTask('default', ['screeps'])
    // grunt.registerTask('babel', ['babel'])
}