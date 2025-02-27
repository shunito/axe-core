describe('Configure Options', () => {
  const target = document.querySelector('#target');

  afterEach(() => {
    axe.reset();
    target.innerHTML = '';
  });

  describe('Check', () => {
    describe('aria-allowed-attr', () => {
      it('should allow an attribute supplied in options', done => {
        target.setAttribute('role', 'separator');
        target.setAttribute('aria-valuenow', '0');

        axe.configure({
          checks: [
            {
              id: 'aria-allowed-attr',
              options: { separator: ['aria-valuenow'] }
            }
          ]
        });
        axe.run(
          target,
          {
            runOnly: {
              type: 'rule',
              values: ['aria-allowed-attr']
            }
          },
          function (error, results) {
            assert.lengthOf(results.violations, 0, 'violations');
            done();
          }
        );
      });

      it('should not normalize external check options', done => {
        target.setAttribute('lang', 'en');

        axe.configure({
          checks: [
            {
              id: 'dylang',
              options: ['dylan'],
              evaluate:
                'function (node, options) {\n        const lang = (node.getAttribute("lang") || "").trim().toLowerCase();\n        const xmlLang = (node.getAttribute("xml:lang") || "").trim().toLowerCase();\n        const invalid = [];\n        (options || []).forEach(function(cc) {\n          cc = cc.toLowerCase();\n          if (lang && (lang === cc || lang.indexOf(cc.toLowerCase() + "-") === 0)) {\n            lang = null;\n          }\n          if (xmlLang && (xmlLang === cc || xmlLang.indexOf(cc.toLowerCase() + "-") === 0)) {\n            xmlLang = null;\n          }\n        });\n        if (xmlLang) {\n          invalid.push(\'xml:lang="\' + xmlLang + \'"\');\n        }\n        if (lang) {\n          invalid.push(\'lang="\' + lang + \'"\');\n        }\n        if (invalid.length) {\n          this.data(invalid);\n          return true;\n        }\n        return false;\n      }',
              messages: {
                pass: 'Good language',
                fail: 'You mst use the DYLAN language'
              }
            }
          ],
          rules: [
            {
              id: 'dylang',
              metadata: {
                description:
                  "Ensures lang attributes have the value of 'dylan'",
                help: "lang attribute must have the value of 'dylan'"
              },
              selector: '#target',
              any: [],
              all: [],
              none: ['dylang'],
              tags: ['wcag2aa']
            }
          ],
          data: {
            rules: {
              dylang: {
                description:
                  "Ensures lang attributes have the value of 'dylan'",
                help: "lang attribute must have the value of 'dylan'"
              }
            }
          }
        });

        axe.run(
          '#target',
          {
            runOnly: {
              type: 'rule',
              values: ['dylang']
            }
          },
          function (err, results) {
            try {
              assert.isNull(err);
              assert.lengthOf(results.violations, 1, 'violations');
              done();
            } catch (e) {
              done(e);
            }
          }
        );
      });
    });

    describe('aria-required-attr', () => {
      it('should report unique attributes when supplied from options', done => {
        target.setAttribute('role', 'slider');
        axe.configure({
          checks: [
            {
              id: 'aria-required-attr',
              options: { slider: ['aria-snuggles'] }
            }
          ]
        });
        axe.run(
          '#target',
          {
            runOnly: {
              type: 'rule',
              values: ['aria-required-attr']
            }
          },
          function (error, results) {
            assert.lengthOf(results.violations, 1, 'violations');
            assert.sameMembers(results.violations[0].nodes[0].any[0].data, [
              'aria-snuggles'
            ]);
            done();
          }
        );
      });
    });
  });

  describe('disableOtherRules', () => {
    it('disables rules that are not in the `rules` array', done => {
      axe.configure({
        disableOtherRules: true,
        rules: [
          {
            id: 'html-has-lang',
            enabled: true
          },
          {
            id: 'html-lang-valid',
            enabled: false
          }
        ]
      });

      axe.run(function (error, results) {
        assert.isNull(error);
        assert.lengthOf(results.passes, 1, 'passes');
        assert.equal(results.passes[0].id, 'html-has-lang');

        assert.lengthOf(results.violations, 0, 'violations');
        assert.lengthOf(results.incomplete, 0, 'incomplete');
        assert.lengthOf(results.inapplicable, 0, 'inapplicable');
        done();
      });
    });
  });

  describe('noHtml', () => {
    const captureError = axe.testUtils.captureError;
    it('prevents html property on nodes', done => {
      target.setAttribute('role', 'slider');
      axe.configure({
        noHtml: true,
        checks: [
          {
            id: 'aria-required-attr',
            options: { slider: ['aria-snuggles'] }
          }
        ]
      });
      axe.run(
        '#target',
        {
          runOnly: {
            type: 'rule',
            values: ['aria-required-attr']
          }
        },
        captureError(function (error, results) {
          assert.isNull(error);
          assert.isNull(results.violations[0].nodes[0].html);
          done();
        }, done)
      );
    });

    it('prevents html property on nodes from iframes', done => {
      const config = {
        noHtml: true,
        rules: [
          {
            id: 'div#target',
            // purposefully don't match so the first result is from
            // the iframe
            selector: 'foo'
          }
        ]
      };

      const iframe = document.createElement('iframe');
      iframe.src = '/test/mock/frames/context.html';
      iframe.onload = () => {
        axe.configure(config);

        axe.run(
          '#target',
          {
            runOnly: {
              type: 'rule',
              values: ['div#target']
            }
          },
          captureError(function (error, results) {
            assert.isNull(error);
            assert.deepEqual(results.passes[0].nodes[0].target, [
              'iframe',
              '#target'
            ]);
            assert.isNull(results.passes[0].nodes[0].html);
            done();
          }, done)
        );
      };
      target.appendChild(iframe);
    });

    it('prevents html property in postMesage', done => {
      const config = {
        noHtml: true,
        rules: [
          {
            id: 'div#target',
            // purposefully don't match so the first result is from
            // the iframe
            selector: 'foo'
          }
        ]
      };

      const iframe = document.createElement('iframe');
      iframe.src = '/test/mock/frames/noHtml-config.html';
      iframe.onload = () => {
        axe.configure(config);

        axe.run('#target', {
          runOnly: {
            type: 'rule',
            values: ['div#target']
          }
        });
      };
      target.appendChild(iframe);

      window.addEventListener('message', function (evt) {
        const data = JSON.parse(evt.data);
        if (Array.isArray(data.payload)) {
          try {
            assert.isNull(data.payload[0].nodes[0].node.source);
            done();
          } catch (err) {
            done(err);
          }
        }
      });
    });
  });
});
