module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-screeps')
    grunt.loadNpmTasks('grunt-babel')
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-exec')

    var credentials = grunt.file.readJSON('private.json')

    grunt.initConfig({
        screeps: {
            options: credentials,
            dist: {
                src: ['dist/*.js'],
            },
        },
        babel: {
            options: {
                plugins: [
                    'transform-es2015-modules-commonjs',
                ],
                presets: [
                    'babel-preset-flow',
                ],
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['*.js'],
                        dest: 'dist/',
                    },
                ],
            },
        },
        clean: [
            'dist',
        ],
        copy: {
            files: {
                cwd: 'src/test',  // set working folder / root to copy
                src: '*.js',           // copy all files and subfolders
                dest: 'dist/test/',    // destination folder
                expand: true,           // required when using cwd
            },
        },
        exec: {
            flow: {
                cmd: 'flow',
            },
        },
    })

    grunt.registerTask(
        'default',
        'default build task to clean, compile, and then copy the tests over',
        ['exec','clean', 'babel', 'copy']
    )

}