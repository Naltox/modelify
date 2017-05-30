# Modelify

Modelify is a tool that created models from JSON.

## Installation

To install the stable version:

```bash
npm install modelify -g
```

This will install Modelify globally so that it may be run from the command line.

## Usage

```bash
modelify -lang=lang_name -i=/path/to/your.json -o=/path/to/out/dir
```

`lang_name` Output models language (js or ts or swift)

`/path/to/your.json` Path to some json

`/path/to/out/dir` Output path

## Currently available languages

* JavaScript
* TypeScript
* Swift