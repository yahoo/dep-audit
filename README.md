NPM Dependency Audit Tool [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
======================

```
npm install -g dep-audit
```

Given a path to a configuration file, this module will check that each module
in the node_modules tree of the current directory satisfies the requirements
established by the configuration file.

```
dep-audit --config config/config.json
```

Config file should be formatted like so:

```
{
    "exclusions":{
        "name":[
            {
                "version_range":"1.0.0-2.1.4", // semver range that is not allowed
                "audit_trail":"Added by admin @ 2016-1-1", // who added it and when
                "desc":"Bad module" // why module isn't allowed
            }
        ]
    },
    "inclusions":{
        "name":[
            {
                "version_range":"1.0.0-2.1.4", // semver range that is allowed
                "audit_trail":"Added by admin @ 2016-1-1", // who added it and when
                "desc":"Bad module" // why module is allowed
            }
        ]
    },
    "spdx":"(MIT OR ISC)" // spdx expression indicating which licenses are ok
}
```
If a module is not in `exclusions` or `inclusions`, it will be allowed if
its license satisfies the SPDX expression in `spdx`.
Modules in `exclusions` will not be allowed even if their license
satisfies the spdx expression.
Modules in `inclusions` will be allowed even if their license
does not satisfy the spdx expression.

If an unacceptable module that does not satisfy the requirements in the config file
is found, dep-audit will log the module as well as its audit trail and description.
The process will then exit with exit code 1.

Alternatively, the user can provide a URL to fetch a config file from.

```
dep-audit --config-url http://....
```

Hooks
-----
A hook can be provided that will be executed before each module is audited.
In order to supply a hook, pass the file path of the module to the hook option.
```
--hook /path/to/hook/
```
The file must export a function that takes an object representing the
node_modules tree as an argument and returns an object representing the
modules from the node_modules tree that should be audited.
```
module.exports = function (json) {
  return json
}
```
The node_modules object will be formatted like so using
a separate object for each module.
```
{
  "name@version": {
    "licenses": "ISC",
    "repository": "url to repo",
    "licenseFile": "/path/to/license/file"
  }
}
```

Options
-------
* `--config [path]` Path to fetch inclusion list, exclusion list, and spdx expression
* `--config-url [url]` URL to fetch inclusion list, exclusion list, and spdx expression
* `--allowed [list]` Audit modules in node_modules tree using list of licenses
* `--hook [path]` Path to hook to execute before modules are audited
* `--fix` Attempt to fix incorrect licenses (implemented using [spdx-correct](https://www.npmjs.com/package/spdx-correct))
* `--guess` Attempt to guess licenses from files other than package.json (implemented using [license-checker](https://www.npmjs.com/package/license-checker))
* `--version` Display the current version
* `--help` Get help

Using dep-audit programmatically
------------------------------------
If dep-audit is installed locally, it can be used as a library rather than
a command line tool.
```
npm install dep-audit
```

Then, just require the module in your project and you can audit your dependencies programmatically.
```
var audit = require('dep-audit')
var opts = {
  "hook": function (json) {
    console.log(json)
    return json
  },
  "checker":
    {
      "start": "/path/to/project/",
      "production": true,
        // If true, will only audit production dependencies.
        // If false, will also audit dev dependencies,
      "unknown": false
        // If true, will only check package.json for license.
        // If false, will guess license from other files
    },
  "fix": true, // If true, will fix malformed licenses,
  "spdx": "MIT", // spdx expression indicating which licenses are allowed
  "include": {
    "name":[
        {
            "version_range":"1.0.0-2.1.4", // semver range that is allowed
            "audit_trail":"Added by admin @ 2016-1-1", // who added it and when
            "desc":"Bad module" // why module is allowed
        }
    ]
  },
  "exclude": {
    "name":[
        {
            "version_range":"1.0.0-2.1.4", // semver range that is not allowed
            "audit_trail":"Added by admin @ 2016-1-1", // who added it and when
            "desc":"Bad module" // why module isn't allowed
        }
    ]
  }
}

audit (opts, function (error, report) {
  if (error) {
    throw error
  }
  Object.keys(report.fail).forEach(function (nameVersion) {
    console.log('FAILED', nameVersion, 'because', report.fail[nameVersion])
  })
})
```
`opts.include` and `opts.exclude` should be formatted like the `inclusions` and `exclusions`
fields of a config file used in the command line tool.
That is, `opts.include` and `opts.exclude` should be objects where the keys are module names
and the values are lists containing objects with `version_range`, `audit_trail`, and `desc` fields.

License
-------

See LICENSE.txt
