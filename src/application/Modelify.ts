import {SchemeGenerator} from "../domain/schemeGeneration/SchemeGenerator";
import {CodeGenerator} from "../domain/codeGeneration/CodeGenerator";
import SourceFile from "../domain/codeGeneration/SourceFile";
import {SchemeSource} from "../domain/schemeGeneration/SchemeSource";
import BaseLogger from "../domain/logger/BaseLogger";

export default class Modelify {
    constructor(
        private schemeGenerator: SchemeGenerator,
        private codeGenerator: CodeGenerator,
        private logger: BaseLogger
    ) {

    }

    public generate(schemeSource: SchemeSource): SourceFile[] {
        let scheme = this.schemeGenerator.generate(schemeSource)

        return scheme.map(s => {
            let file = this.codeGenerator.generateClass(s)

            this.logger.log(`Generated model: ${file.fileName}`)

            return file
        })
    }
}