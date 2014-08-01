module.exports = function(grunt) {
  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),
    jsdoc : {
      dist : {
        src : ['*.js'],
        options : {
          destination : 'doc',
          configure : './jsdoc.config.json'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.registerTask('default', ['jsdoc']);
};
