'use strict';
var _ = require('lodash');
var yeoman = require('yeoman-generator');
var path = require('path');
var yosay = require('yosay');
var elementNameValidator = require('validate-element-name');
var chalk = require('chalk');

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

    this.argument('element-name', {
      desc: 'Tag name of the element and directory to generate.',
      required: true,
    });

    this.option('skip-install', {
      desc: 'Whether bower dependencies should be installed',
      defaults: true,
    });

    this.option('skip-install-message', {
      desc: 'Whether commands run should be shown',
      defaults: false,
    });

    this.sourceRoot(path.join(path.dirname(this.resolved), 'templates/seed-element'));
  },
  validate: function () {
    this.elementName = this['element-name'];
    var result = elementNameValidator(this.elementName);

    if (!result.isValid) {
      this.emit('error', new Error(chalk.red(result.message)));
    }

    if (result.message) {
      console.warn(chalk.yellow(result.message + '\n'));
    }

    return true;
  },
  askFor: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay('Out of the box I include Cells\'s seed-element.'));

    var prompts = [{
        name: 'i18n',
        message: 'Is your component going to use i18n?',
        type: 'confirm'
      }, {
        name: 'includeWCT',
        message: 'Would you like to include web-component-tester?',
        type: 'confirm'
      }, {
        name: 'useTheme',
        message: 'Would you use a theme?',
        type: 'confirm'
      }, {
        when: function (resp) {
          return resp.useTheme;
        },
        name: 'themeName',
        message: 'What\'s your component\'s theme?',
        type: 'list',
        choices: ['bbva-ui-theme', 'buzz-ui-theme', 'cells-composer-ui-theme', 'Other...']
      }, {
        when: function (resp) {
          return resp.themeName === 'Other...';
        },
        name: 'themeName',
        message: 'What\'s the theme name?'
      }
    ];

    this.prompt(prompts, function (props) {
      this.i18n = props.i18n;
      this.includeWCT = props.includeWCT;
      this.useTheme = props.useTheme;
      this.themeName = props.themeName;

      done();
    }.bind(this));

  },
  seed: function () {

    var renameElement = function (file) {
      return file.replace(/seed-element/g, this.elementName);
    }.bind(this);

    // Handle bug where npm has renamed .gitignore to .npmignore
    // https://github.com/npm/npm/issues/3763
    if (this.src.isFile('.npmignore')) {
      this.copy('.npmignore', '.gitignore');
    } else {
      this.copy('.gitignore', '.gitignore');
    }

    this.copy('bower.json', 'bower.json', function(file) {
      var manifest = JSON.parse(file);
      var theme_repo_url = 'https://descinet.bbva.es/stash/scm/celcom/' + this.themeName + '.git';

      manifest.name = this.elementName;
      manifest.main = this.elementName + '.html';
      if (!this.includeWCT) {
        delete manifest.devDependencies['web-component-tester'];
      }

      if (!this.i18n) {
        delete manifest.dependencies['cells-i18n-msg'];
      }

      // Add theme dependency
      if (this.useTheme) {
        manifest.devDependencies[this.themeName] = theme_repo_url;
      }


      return JSON.stringify(manifest, null, 2);
    }.bind(this));

    this.copy('index.html', 'index.html', renameElement);
    this.copy('README.md', 'README.md', renameElement);
    this.copy('seed-element.html', this.elementName + '.html', renameElement);
    this.copy('seed-element.scss', this.elementName + '.scss', renameElement);
    this.copy('demo/index.html', 'demo/index.html', renameElement);
    this.copy('images/cells.svg', 'images/cells.svg', renameElement);

    if (this.includeWCT) {
      this.copy('test/index.html', 'test/index.html', renameElement);
      this.copy('test/basic-test.html', 'test/basic-test.html', renameElement);
      this.copy('test/check-value-test.html', 'test/check-value-test.html', renameElement);
      this.copy('test/functions-test.html', 'test/functions-test.html', renameElement);
    }

    if (this.i18n) {
      this.copy('locales/en.json', 'locales/en.json', renameElement);
    }
  },
  install: function () {
    this.installDependencies({
      npm: false,
      skipInstall: this.options['skip-install'],
      skipMessage: this.options['skip-install-message']
    });
  }
});
