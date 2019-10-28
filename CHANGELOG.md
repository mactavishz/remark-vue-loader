# Changelog

<a name="0.2.0"></a>
## 0.2.0(2019-10-28)

### Features

* add remark parser tokenizer for container syntax

### Refactor

* change helper `findCodeBlocks` to `findContainers`
* change `SFCCodeBlockTransformer` to `SFCContainerTransformer`
* change `ExternalAPI.addCodeBlock` to `ExternalAPI.addContainer` 

#### BREAKING CHANGES

* rename `api.addCodeBlock` to  `api.addContainer` in loader options
* custom code block syntax is `**deprecated**

<a name="0.1.2"></a>
## 0.1.2 (2019-10-09)

### Chore

* update dependencies

<a name="0.1.1"></a>
## 0.1.1 (2019-10-09)

### Bug Fixes

* fix incompatible type in options schema JSON, adjust some descriptions

<a name="0.1.0"></a>
## 0.1.0 (2019-10-08)

### Features

* initial release
