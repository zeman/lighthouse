const assert = require('assert');
const {computeCSSTokenLength, computeJSTokenLength} = require('../../lib/minification-estimator');

describe('minification estimator', () => {
  describe('CSS', () => {
    it('should compute length of meaningful content', () => {
      const full = `
        /*
         * a complicated comment
         * that is
         * several
         * lines
         */
        .my-class {
          /* a simple comment */
          width: 100px;
          height: 100px;
        }
      `;

      const minified = '.my-class{width:100px;height:100px;}';
      assert.equal(computeCSSTokenLength(full), minified.length);
    });

    it('should handle string edge cases', () => {
      const pairs = [
        ['.my-class { content: "/*"; }', '.my-class{content:"/*";}'],
        ['.my-class { content: \'/* */\'; }', '.my-class{content:\'/* */\';}'],
        ['.my-class { content: "/*\\\\a"; }', '.my-class{content:"/*\\\\a";}'],
        ['.my-class { content: "/*\\"a"; }', '.my-class{content:"/*\\"a";}'],
        ['.my-class { content: "hello }', '.my-class { content: "hello }'],
        ['.my-class { content: "hello" }', '.my-class{content:"hello"}'],
      ];

      for (const [full, minified] of pairs) {
        assert.equal(
          computeCSSTokenLength(full),
          minified.length,
          `did not handle ${full} properly`
        );
      }
    });

    it('should handle comment edge cases', () => {
      const full = `
        /* here is a cool "string I found" */
        .my-class {
          content: "/*";
        }
      `;

      const minified = '.my-class{content:"/*";}';
      assert.equal(computeCSSTokenLength(full), minified.length);
    });

    it('should handle license comments', () => {
      const full = `
        /*!
         * @LICENSE
         * Apache 2.0
         */
        .my-class {
          width: 100px;
        }
      `;

      const minified = `/*!
         * @LICENSE
         * Apache 2.0
         */.my-class{width:100px;}`;
      assert.equal(computeCSSTokenLength(full), minified.length);
    });

    it('should handle unbalanced comments', () => {
      const full = `
        /*
        .my-class {
          width: 100px;
        }
      `;

      assert.equal(computeCSSTokenLength(full), full.length);
    });

    it('should handle data URIs', () => {
      const uri = 'data:image/jpeg;base64,asdfadiosgjwiojasfaasd';
      const full = `
        .my-other-class {
          background: data("${uri}");
          height: 100px;
        }
     `;

      const minified = `.my-other-class{background:data("${uri}");height:100px;}`;
      assert.equal(computeCSSTokenLength(full), minified.length);
    });

    it('should handle reeally long strings', () => {
      let hugeCss = '';
      for (let i = 0; i < 10000; i++) {
        hugeCss += `.my-class-${i} { width: 100px; height: 100px; }\n`;
      }

      assert.ok(computeCSSTokenLength(hugeCss) < 0.9 * hugeCss.length);
    });
  });

  describe('JS', () => {

  });
})
