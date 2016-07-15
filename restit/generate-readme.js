#!/usr/bin/env node

var request = require('request'),
    fmt = require('util').format,
    packageJson = require('../package.json'),
    port = process.env.PORT || '8080',
    p = console.log;

function tooLong(str) {
    var len = 76,
        pad = '              ',
        idx = len;

    if (str.length > 76) {
        for (; idx > 0; idx--) {
            // if there is a space, break the string
            if (str.charCodeAt(idx) === 32) break;
        }

        // Create a string broken at the space,
        // put back together with line break,
        // make sure to pad the second line.
        str = [
            str.substring(0, idx),
            pad + str.substring(idx)
        ].join('\n');
    }

    return str;
}

function genDesc(o, sub, type) {
  var headers = sub ? o : o.headers;
  var fields = sub ? o : o.fields;

  if (!sub) {
    p('### %s `%s`\n', type, o.path);
    p('> %s\n', o.description);

    if (headers.length > 0) {
        p('#### Headers\n');

        p('```');
        headers.forEach(f => {
            p(f.field);
            p('- type:        %s', f.type);
            p('- required:    %s', f.required);
            p('- description: %s', tooLong(f.description));
            p('- requirement: %s', tooLong(f.requirement));
            p('');
        });
        p('```');
        p('');
    }

    if (fields.length > 0) {
      p('#### Fields\n');

      p('```');
      fields.forEach(f => {
        if (typeof f.subObject !== 'undefined') {
          p(f.field);
          p('- type:     subObject');
          p('- required: false');
          p('- fields:');

          genDesc(f.subObject, true);
        } else {
          p(f.field);
          p('- type:        %s', f.type);
          p('- required:    %s', f.required);
          p('- description: %s', tooLong(f.description));
          p('- requirement: %s', tooLong(f.requirement));
          p('');
        }
      });
      p('```');
      p('');
    }
  }
}

request(fmt('http://localhost:%s/v1/endpoints', port), (error, response, body) => {
  var data;

  if (error) {
      console.error('[ERROR] Local server must be running to use generate-readme.js');
      process.exit(1)
  }

  if (!error && response.statusCode == 200) {
    data = JSON.parse(body);

    p('# MSS CatalogIt API\n');
    p('API Version `%s`\n', packageJson.version);

    Object.keys(data).forEach(function (type) {
      data[type].forEach(function(o) {
        genDesc(o, false, type.toUpperCase());
      });
    });

    p('\nREADME generated by running `npm run readme` in repository while app runs locally on default port.\n');
  }
});