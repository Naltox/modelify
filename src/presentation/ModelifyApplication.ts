#!/usr/bin/env node

import BaseConsoleApplication from "./BaseConsoleApplication";
import ConsoleLogger from "../infrastructure/logger/ConsoleLogger";
import JavaScriptCodeGenerator from "../infrastructure/codeGeneration/JavaScriptCodeGenerator";
import {CodeGenerator} from "../domain/codeGeneration/CodeGenerator";
import TypescriptCodeGenerator from "../infrastructure/codeGeneration/TypescriptCodeGenerator";
import SwiftCodeGenerator from "../infrastructure/codeGeneration/SwiftCodeGenerator";
import JSONSchemeGenerator from "../infrastructure/schemeGeneration/JSONSchemeGenerator";
import JSONSchemeSource from "../infrastructure/schemeGeneration/sources/JSONSchemeSource";
import {join} from "path";
import Modelify from "../application/Modelify";

class ModelifyApplication extends BaseConsoleApplication {
    constructor() {
        super()

        const args = this.getArgs()

        const lang = args.lang
        const input = args.i
        const output = args.o

        if (!lang || !input || !output)
            this.die('\nWrong args\n\n' +
                'Usage: modelify -lang=js -i=/path/to/your.json -o=/path/to/out/dir\n\n' +
                'Available languages: js, ts, swift'
            )

        this.run(lang, input, output)
    }

    async run(
        lang: string,
        input: string,
        output: string
    ) {
        let logger = new ConsoleLogger()
        let json = JSON.parse(await this.readFile(input))
        let codeGenerator = this.getCodeGeneratorByLang(lang)
        let schemeGenerator = new JSONSchemeGenerator()
        let modelify = new Modelify(schemeGenerator, codeGenerator, logger)

        let files = modelify.generate(new JSONSchemeSource(json))

        for (let file of files) {
            await this.saveToFile(join(output, file.fileName),file.code.render())
        }

        console.log('Done!')
    }

    private getCodeGeneratorByLang(lang: string): CodeGenerator {
        if (lang === 'js')
            return new JavaScriptCodeGenerator()
        if (lang === 'ts')
            return new TypescriptCodeGenerator()
        if (lang === 'swift')
            return new SwiftCodeGenerator()

        throw new Error('No code generator for ' + lang)
    }
}

new ModelifyApplication()